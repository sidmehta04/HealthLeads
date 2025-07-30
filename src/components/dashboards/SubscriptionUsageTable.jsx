import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  initializeApp,
  getApps,
} from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";

// Initialize Firebase apps once
const initializeFirebaseApps = () => {
  let mswasthApp, subtrackingApp;
  
  try {
    mswasthApp = getApps().find(app => app.name === "mswasth") || 
      initializeApp({
        apiKey: "AIzaSyBtWbPNRi4ia5a3pJ7aTFqqj9Z4aMN01Os",
        authDomain: "healthcamp-f0c93.firebaseapp.com",
        databaseURL: "https://healthcamp-f0c93-default-rtdb.firebaseio.com",
        projectId: "healthcamp-f0c93",
        storageBucket: "healthcamp-f0c93.firebasestorage.app",
        messagingSenderId: "210176603069",
        appId: "1:210176603069:web:ec38016d08a8051b1bd8d4",
      }, "mswasth");
  } catch (e) {
    mswasthApp = getApps().find((app) => app.name === "mswasth");
  }

  try {
    subtrackingApp = getApps().find(app => app.name === "subtracking") ||
      initializeApp({
        apiKey: "AIzaSyAZ-jBJFKI6o33jMf5xnqZIyXsao-YTb94",
        authDomain: "subtracking-d07a3.firebaseapp.com",
        projectId: "subtracking-d07a3",
        storageBucket: "subtracking-d07a3.firebasestorage.app",
        messagingSenderId: "759048482691",
        appId: "1:759048482691:web:1fda35315dd32f3fb850b6",
      }, "subtracking");
  } catch (e) {
    subtrackingApp = getApps().find((app) => app.name === "subtracking");
  }
  
  return { mswasthApp, subtrackingApp };
};

const { subtrackingApp } = initializeFirebaseApps();
const db = getFirestore(subtrackingApp);

export default function OptimizedSubscriptionExcelDownloader() {
  const BATCH_SIZE = 2000; // Increased batch size for better performance
  const PROCESSING_DELAY = 50; // Reduced delay between batches

  const [usageStats, setUsageStats] = useState(new Map()); // Using Map for better performance
  const [clinicData, setClinicData] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('Ready to download report');
  const [progress, setProgress] = useState(0);
  const [processingSpeed, setProcessingSpeed] = useState(0);
  
  // Use refs to avoid stale closures and improve performance
  const processingStartTime = useRef(0);
  const lastUpdateTime = useRef(0);
  const abortController = useRef(null);

  // Memoized clinic data fetcher with better error handling
  const fetchClinicData = useCallback(async () => {
    try {
      setProcessingStatus('Fetching clinic data...');
      const clinicsRef = collection(db, "clinics");
      const clinicsSnap = await getDocs(clinicsRef);
      
      const clinics = new Map();
      clinicsSnap.forEach((doc) => {
        const clinic = doc.data();
        if (clinic.clinicCode) {
          clinics.set(clinic.clinicCode, {
            clinicName: clinic.clinicName || 'Unknown',
            state: clinic.state || 'Unknown',
            district: clinic.district || 'Unknown',
            address: clinic.address || 'Unknown',
            contactPerson: clinic.contactPerson || 'Unknown',
            phoneNumber: clinic.phoneNumber || 'Unknown',
            email: clinic.email || 'Unknown',
          });
        }
      });
      
      setClinicData(clinics);
      return clinics;
    } catch (error) {
      console.error("Error fetching clinic data:", error);
      setProcessingStatus('Error fetching clinic data');
      throw error;
    }
  }, []);

  // Optimized batch processing with better memory management
  const processBatch = useCallback((docs, existingStats) => {
    const batchStats = new Map(existingStats);
    
    for (const doc of docs) {
      const subscription = doc.data();
      const clinicCode = subscription.clinicCode || 'Unknown';
      const productId = subscription.productId || 'Unknown';
      const productName = subscription.productName || 'Unknown';
      const isUtilized = subscription.used === true;

      const key = `${clinicCode}__${productId}__${productName}`;
      
      const existing = batchStats.get(key);
      if (existing) {
        existing.total += 1;
        if (isUtilized) {
          existing.utilized += 1;
        } else {
          existing.remaining += 1;
        }
      } else {
        batchStats.set(key, {
          clinicCode,
          productId,
          productName,
          total: 1,
          utilized: isUtilized ? 1 : 0,
          remaining: isUtilized ? 0 : 1
        });
      }
    }

    return batchStats;
  }, []);

  // Enhanced progress tracking
  const updateProgress = useCallback((processed, total, batchNumber) => {
    const now = Date.now();
    const elapsed = (now - processingStartTime.current) / 1000;
    const speed = processed / elapsed;
    
    setTotalProcessed(processed);
    setProgress(total > 0 ? (processed / total) * 100 : 0);
    setProcessingSpeed(Math.round(speed));
    setProcessingStatus(
      `Processing batch ${batchNumber}: ${processed.toLocaleString()} / ${total.toLocaleString()} records (${Math.round(speed)} records/sec)`
    );
  }, []);

  // Get estimated total count for better progress tracking
  const getEstimatedTotal = useCallback(async () => {
    try {
      // First, try to get a sample to estimate
      const sampleQuery = query(
        collection(db, "subscriptions"),
        limit(1000)
      );
      const sampleSnap = await getDocs(sampleQuery);
      
      // This is a rough estimate - Firebase doesn't provide exact counts efficiently
      // You might want to maintain a separate counter document for exact counts
      const estimated = sampleSnap.size === 1000 ? 50000 : sampleSnap.size; // Conservative estimate
      setEstimatedTotal(estimated);
      return estimated;
    } catch (error) {
      console.error("Error estimating total:", error);
      setEstimatedTotal(0);
      return 0;
    }
  }, []);

  // Main processing function with cancellation support
  const processAndDownload = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setProcessingStatus('Initializing...');
    setProgress(0);
    setTotalProcessed(0);
    
    // Create abort controller for cancellation
    abortController.current = new AbortController();
    processingStartTime.current = Date.now();
    
    try {
      // Reset state
      setUsageStats(new Map());

      // Get estimated total and fetch clinic data in parallel
      const [estimatedTotal, clinicDataMap] = await Promise.all([
        getEstimatedTotal(),
        fetchClinicData()
      ]);

      if (abortController.current.signal.aborted) return;

      setProcessingStatus('Processing subscription data...');

      let allStats = new Map();
      let processedCount = 0;
      let batchNumber = 1;
      let hasMoreData = true;

      // Initial query
      let q = query(
        collection(db, "subscriptions"),
        orderBy("assignedAt"),
        limit(BATCH_SIZE)
      );

      // Process batches with improved error handling and cancellation support
      while (hasMoreData && !abortController.current.signal.aborted) {
        try {
          const snap = await getDocs(q);
          const docs = snap.docs;
          
          if (docs.length === 0) {
            hasMoreData = false;
            break;
          }

          // Process batch with optimized memory usage
          allStats = processBatch(docs, allStats);
          processedCount += docs.length;
          
          // Update progress with current stats
          updateProgress(processedCount, Math.max(estimatedTotal, processedCount), batchNumber);

          // Check if we have more data
          if (docs.length < BATCH_SIZE) {
            hasMoreData = false;
          } else {
            // Prepare next batch query
            q = query(
              collection(db, "subscriptions"),
              orderBy("assignedAt"),
              startAfter(docs[docs.length - 1]),
              limit(BATCH_SIZE)
            );
          }

          batchNumber++;

          // Smaller delay for better performance, but allow UI updates
          if (hasMoreData) {
            await new Promise(resolve => setTimeout(resolve, PROCESSING_DELAY));
          }

        } catch (batchError) {
          console.error(`Error processing batch ${batchNumber}:`, batchError);
          // Continue with next batch instead of failing completely
          setProcessingStatus(`Warning: Error in batch ${batchNumber}, continuing...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (abortController.current.signal.aborted) {
        setProcessingStatus('Processing cancelled');
        return;
      }

      setUsageStats(allStats);
      setProcessingStatus('Generating Excel file...');

      // Generate and download Excel with optimized data structures
      const excelData = generateExcelData(allStats, clinicDataMap, processedCount);
      await downloadExcelFile(excelData);
      
      setProcessingStatus(`✅ Report downloaded! Processed ${processedCount.toLocaleString()} records in ${Math.round((Date.now() - processingStartTime.current) / 1000)}s`);
      setProgress(100);
      
    } catch (error) {
      console.error("Error processing data:", error);
      setProcessingStatus('❌ Error occurred. Please try again.');
    } finally {
      setLoading(false);
      abortController.current = null;
    }
  }, [
    loading, 
    processBatch, 
    BATCH_SIZE, 
    PROCESSING_DELAY,
    fetchClinicData, 
    updateProgress, 
    getEstimatedTotal
  ]);

  // Cancel processing function
  const cancelProcessing = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      setProcessingStatus('Cancelling...');
    }
  }, []);

  // Optimized Excel data generation with better memory management
  const generateExcelData = useCallback((usageStatsMap, clinicDataMap, totalProcessed) => {
    const excelData = [];
    
    // Convert Map to grouped structure more efficiently
    const clinicGroups = new Map();
    
    for (const [key, stat] of usageStatsMap) {
      const clinicCode = stat.clinicCode;
      
      if (!clinicGroups.has(clinicCode)) {
        const clinicInfo = clinicDataMap.get(clinicCode) || {
          clinicName: 'Unknown',
          state: 'Unknown',
          district: 'Unknown',
          address: 'Unknown',
          contactPerson: 'Unknown',
          phoneNumber: 'Unknown',
          email: 'Unknown'
        };
        
        clinicGroups.set(clinicCode, {
          clinicCode,
          ...clinicInfo,
          products: new Map(),
          totals: { total: 0, utilized: 0, remaining: 0 }
        });
      }
      
      const clinic = clinicGroups.get(clinicCode);
      const productKey = `${stat.productId}__${stat.productName}`;
      clinic.products.set(productKey, stat);
      
      clinic.totals.total += stat.total;
      clinic.totals.utilized += stat.utilized;
      clinic.totals.remaining += stat.remaining;
    }
    
    // Calculate overall stats more efficiently
    const overallStats = Array.from(usageStatsMap.values()).reduce(
      (acc, stat) => ({
        total: acc.total + stat.total,
        utilized: acc.utilized + stat.utilized,
        remaining: acc.remaining + stat.remaining
      }),
      { total: 0, utilized: 0, remaining: 0 }
    );

    // Build Excel content
    const utilizationRate = overallStats.total > 0 
      ? ((overallStats.utilized / overallStats.total) * 100).toFixed(2) 
      : '0.00';

    // Header information
    excelData.push([]);
    excelData.push(['SUBSCRIPTION USAGE ANALYSIS REPORT']);
    excelData.push(['Generated on:', new Date().toLocaleString()]);
    excelData.push(['Total Records Processed:', totalProcessed.toLocaleString()]);
    excelData.push(['Processing Time:', `${Math.round((Date.now() - processingStartTime.current) / 1000)}s`]);
    excelData.push([]);
    
    // Overall statistics
    excelData.push(['OVERALL STATISTICS']);
    excelData.push(['Total Subscriptions', overallStats.total]);
    excelData.push(['Utilized Subscriptions', overallStats.utilized]);
    excelData.push(['Remaining Subscriptions', overallStats.remaining]);
    excelData.push(['Overall Utilization Rate (%)', utilizationRate]);
    excelData.push([]);
    excelData.push([]);
    
    // Detailed clinic-wise data with optimized sorting
    excelData.push(['DETAILED CLINIC-WISE SUBSCRIPTION ANALYSIS']);
    excelData.push([
      'Clinic Code', 'Clinic Name', 'State', 'District', 'Address',
      'Contact Person', 'Phone Number', 'Email', 'Product ID', 'Product Name',
      'Total Subscriptions', 'Utilized', 'Remaining', 'Utilization Rate (%)'
    ]);
    
    // Sort clinics efficiently
    const sortedClinics = Array.from(clinicGroups.values()).sort((a, b) => 
      a.clinicCode.localeCompare(b.clinicCode, undefined, { numeric: true })
    );
    
    for (const clinic of sortedClinics) {
      const products = Array.from(clinic.products.values()).sort((a, b) => 
        a.productId.localeCompare(b.productId, undefined, { numeric: true })
      );
      
      products.forEach((product, i) => {
        const rate = product.total > 0 
          ? ((product.utilized / product.total) * 100).toFixed(2) 
          : '0.00';
        
        excelData.push([
          i === 0 ? clinic.clinicCode : '',
          i === 0 ? clinic.clinicName : '',
          i === 0 ? clinic.state : '',
          i === 0 ? clinic.district : '',
          i === 0 ? clinic.address : '',
          i === 0 ? clinic.contactPerson : '',
          i === 0 ? clinic.phoneNumber : '',
          i === 0 ? clinic.email : '',
          product.productId,
          product.productName,
          product.total,
          product.utilized,
          product.remaining,
          rate
        ]);
      });
      
      // Clinic totals row
      const clinicRate = clinic.totals.total > 0 
        ? ((clinic.totals.utilized / clinic.totals.total) * 100).toFixed(2) 
        : '0.00';
      excelData.push([
        '', '', '', '', '', '', '', '',
        'CLINIC TOTAL', 'All Products',
        clinic.totals.total, clinic.totals.utilized, clinic.totals.remaining, clinicRate
      ]);
      excelData.push([]);
    }
    
    // Add summaries (state-wise and product-wise) - implementation similar but optimized
    addStateSummary(excelData, sortedClinics);
    addProductSummary(excelData, usageStatsMap);
    
    return excelData;
  }, []);

  // Helper function for state summary
  const addStateSummary = useCallback((excelData, clinics) => {
    excelData.push([]);
    excelData.push(['STATE-WISE SUMMARY']);
    excelData.push(['State', 'Number of Clinics', 'Total Subscriptions', 'Utilized', 'Remaining', 'Utilization Rate (%)']);
    
    const stateStats = new Map();
    for (const clinic of clinics) {
      const state = clinic.state;
      const existing = stateStats.get(state) || { clinicCount: 0, total: 0, utilized: 0, remaining: 0 };
      
      existing.clinicCount += 1;
      existing.total += clinic.totals.total;
      existing.utilized += clinic.totals.utilized;
      existing.remaining += clinic.totals.remaining;
      
      stateStats.set(state, existing);
    }
    
    Array.from(stateStats.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([state, stats]) => {
        const rate = stats.total > 0 ? ((stats.utilized / stats.total) * 100).toFixed(2) : '0.00';
        excelData.push([state, stats.clinicCount, stats.total, stats.utilized, stats.remaining, rate]);
      });
  }, []);

  // Helper function for product summary
  const addProductSummary = useCallback((excelData, usageStatsMap) => {
    excelData.push([]);
    excelData.push([]);
    excelData.push(['PRODUCT-WISE SUMMARY']);
    excelData.push(['Product ID', 'Product Name', 'Total Subscriptions', 'Utilized', 'Remaining', 'Utilization Rate (%)']);
    
    const productStats = new Map();
    for (const stat of usageStatsMap.values()) {
      const key = `${stat.productId}__${stat.productName}`;
      const existing = productStats.get(key) || {
        productId: stat.productId,
        productName: stat.productName,
        total: 0, utilized: 0, remaining: 0
      };
      
      existing.total += stat.total;
      existing.utilized += stat.utilized;
      existing.remaining += stat.remaining;
      
      productStats.set(key, existing);
    }
    
    Array.from(productStats.values())
      .sort((a, b) => a.productId.localeCompare(b.productId, undefined, { numeric: true }))
      .forEach(product => {
        const rate = product.total > 0 ? ((product.utilized / product.total) * 100).toFixed(2) : '0.00';
        excelData.push([product.productId, product.productName, product.total, product.utilized, product.remaining, rate]);
      });
  }, []);

  // Optimized file download with better error handling
  const downloadExcelFile = useCallback(async (excelData) => {
    try {
      setProcessingStatus('Preparing download...');
      
      // Use more efficient CSV generation
      const csvContent = excelData
        .map(row => 
          row.map(cell => {
            const cellStr = String(cell ?? '');
            // Only quote if necessary
            return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')
              ? `"${cellStr.replace(/"/g, '""')}"`
              : cellStr;
          }).join(',')
        )
        .join('\n');
      
      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Subscription_Usage_Analysis_Report_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating Excel file:', error);
      setProcessingStatus('❌ Error generating file. Please try again.');
      throw error;
    }
  }, []);

  // Memoized progress bar component
  const ProgressBar = useMemo(() => (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  ), [progress]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            📊 Download Excel Report
          </h1>
          <p className="text-gray-600">
            Optimized subscription usage analysis report
          </p>
        </div>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-600 font-medium mb-2">Status</div>
          <div className="text-blue-800 text-sm mb-3">{processingStatus}</div>
          
          {loading && (
            <>
              {ProgressBar}
              <div className="flex justify-between text-xs text-blue-600 mb-2">
                <span>{totalProcessed.toLocaleString()} records</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              {processingSpeed > 0 && (
                <div className="text-xs text-blue-500">
                  Speed: {processingSpeed.toLocaleString()} records/sec
                </div>
              )}
            </>
          )}
        </div>

        {loading && (
          <div className="mb-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">Processing data...</div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={processAndDownload}
            disabled={loading}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating Report...
              </>
            ) : (
              <>
                📥 Download Excel Report
              </>
            )}
          </button>
          
          {loading && (
            <button
              onClick={cancelProcessing}
              className="w-full px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            >
              ❌ Cancel Processing
            </button>
          )}
        </div>

        {!loading && totalProcessed > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
            <div className="text-sm text-green-600">
              Last processed: {totalProcessed.toLocaleString()} records
            </div>
          </div>
        )}
      </div>
    </div>
  );
}