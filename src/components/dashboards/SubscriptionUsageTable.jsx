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
  // OPTIMIZATION 1: Increased batch size for fewer Firebase calls
  const BATCH_SIZE = 10000; // Increased from 2000 to 10000
  const PROCESSING_DELAY = 10; // Reduced from 50ms to 10ms

  const [loading, setLoading] = useState(false);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('Ready to download report');
  const [progress, setProgress] = useState(0);
  const [processingSpeed, setProcessingSpeed] = useState(0);
  
  // OPTIMIZATION 2: Use refs instead of state for performance-critical data
  const usageStatsRef = useRef(new Map());
  const processingStartTime = useRef(0);
  const abortController = useRef(null);

  // OPTIMIZATION 4: Ultra-fast batch processing with direct Map operations
  const processBatchOptimized = useCallback((docs) => {
    const batchStats = usageStatsRef.current;
    
    // Process documents with minimal operations
    for (let i = 0; i < docs.length; i++) {
      const subscription = docs[i].data();
      const clinicCode = subscription.clinicCode || 'Unknown';
      const productId = subscription.productId || 'Unknown';
      const productName = subscription.productName || 'Unknown';
      const isUtilized = subscription.used === true;

      const key = `${clinicCode}__${productId}__${productName}`;
      
      // Direct Map operations for maximum speed
      const existing = batchStats.get(key);
      if (existing) {
        existing.total++;
        if (isUtilized) {
          existing.utilized++;
        } else {
          existing.remaining++;
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
  }, []);

  // OPTIMIZATION 5: Enhanced progress tracking with better performance metrics
  const updateProgress = useCallback((processed, total, batchNumber) => {
    const now = Date.now();
    const elapsed = (now - processingStartTime.current) / 1000;
    const speed = processed / elapsed;
    const eta = total > processed ? (total - processed) / speed : 0;
    
    setTotalProcessed(processed);
    setProgress(total > 0 ? (processed / total) * 100 : 0);
    setProcessingSpeed(Math.round(speed));
    setProcessingStatus(
      `Batch ${batchNumber}: ${processed.toLocaleString()}/${total.toLocaleString()} | ${Math.round(speed)}/sec | ETA: ${Math.round(eta)}s`
    );
  }, []);

  // OPTIMIZATION 6: Better total estimation using multiple samples
  const getEstimatedTotal = useCallback(async () => {
    try {
      setProcessingStatus('Estimating total records...');
      
      // Get multiple samples for better estimation
      const sampleQuery = query(
        collection(db, "subscriptions"),
        limit(5000)
      );
      const sampleSnap = await getDocs(sampleQuery);
      
      // Conservative estimation based on sample size
      let estimated;
      if (sampleSnap.size === 5000) {
        // If we got full 5000, estimate higher
        estimated = 300000; // Conservative estimate for large datasets
      } else {
        estimated = sampleSnap.size * 1.2; // 20% buffer for smaller datasets
      }
      
      setEstimatedTotal(estimated);
      return estimated;
    } catch (error) {
      console.error("Error estimating total:", error);
      setEstimatedTotal(100000); // Fallback estimate
      return 100000;
    }
  }, []);

  // OPTIMIZATION 7: Simplified CSV generation (removed unwanted data)
  const generateCSVInWorker = useCallback((usageStatsMap, totalProcessed) => {
    return new Promise((resolve, reject) => {
      try {
        setProcessingStatus('Generating CSV file...');
        
        const csvRows = [];
        
        // Simple header - only the columns you want
        csvRows.push([
          'Clinic Code', 'Product Name', 'Total Subscriptions', 'Utilized', 'Remaining', 'Utilization Rate (%)'
        ]);
        
        // OPTIMIZATION 8: Group and sort data efficiently
        const clinicGroups = new Map();
        
        for (const [key, stat] of usageStatsMap) {
          const clinicCode = stat.clinicCode;
          
          if (!clinicGroups.has(clinicCode)) {
            clinicGroups.set(clinicCode, {
              clinicCode,
              products: [], 
              totals: { total: 0, utilized: 0, remaining: 0 }
            });
          }
          
          const clinic = clinicGroups.get(clinicCode);
          clinic.products.push(stat);
          clinic.totals.total += stat.total;
          clinic.totals.utilized += stat.utilized;
          clinic.totals.remaining += stat.remaining;
        }
        
        // Sort and build CSV data efficiently
        const sortedClinics = Array.from(clinicGroups.values()).sort((a, b) => 
          a.clinicCode.localeCompare(b.clinicCode, undefined, { numeric: true })
        );
        
        for (const clinic of sortedClinics) {
          const products = clinic.products.sort((a, b) => 
            a.productId.localeCompare(b.productId, undefined, { numeric: true })
          );
          
          products.forEach((product) => {
            const rate = product.total > 0 ? ((product.utilized / product.total) * 100).toFixed(0) : '0';
            
            csvRows.push([
              clinic.clinicCode,
              product.productName,
              product.total,
              product.utilized,
              product.remaining,
              rate
            ]);
          });
          
          // COMMENT: Remove the lines below (lines 165-171) if you don't want clinic total rows in future
          const clinicRate = clinic.totals.total > 0 
            ? ((clinic.totals.utilized / clinic.totals.total) * 100).toFixed(2) : '0.00';
          csvRows.push([
            clinic.clinicCode,
            'All Products',
            clinic.totals.total, 
            clinic.totals.utilized, 
            clinic.totals.remaining, 
            clinicRate
          ]);
        }
        
        resolve(csvRows);
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  // OPTIMIZATION 10: Ultra-fast CSV file generation and download
  const downloadOptimizedCSV = useCallback(async (csvRows) => {
    try {
      setProcessingStatus('Creating download file...');
      
      // OPTIMIZATION: Use array join instead of string concatenation for better performance
      const csvContent = csvRows.map(row => 
        row.map(cell => {
          const cellStr = String(cell ?? '');
          return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')
            ? `"${cellStr.replace(/"/g, '""')}"`
            : cellStr;
        }).join(',')
      ).join('\n');
      
      // Create and trigger download with optimized blob creation
      const blob = new Blob(['\ufeff' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Subscription_Usage_Analysis_Report_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up memory
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
    } catch (error) {
      console.error('Error downloading CSV:', error);
      setProcessingStatus('❌ Error creating download. Please try again.');
      throw error;
    }
  }, []);

  // OPTIMIZATION 11: Main processing function with all optimizations
  const processAndDownload = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setProcessingStatus('Initializing optimized processing...');
    setProgress(0);
    setTotalProcessed(0);
    
    // Reset refs
    usageStatsRef.current = new Map();
    
    abortController.current = new AbortController();
    processingStartTime.current = Date.now();
    
    try {
      const estimatedTotal = await getEstimatedTotal();

      if (abortController.current.signal.aborted) return;

      setProcessingStatus('Starting optimized data processing...');

      let processedCount = 0;
      let batchNumber = 1;
      let hasMoreData = true;

      // OPTIMIZATION 12: Initial query with optimal ordering
      let q = query(
        collection(db, "subscriptions"),
        orderBy("assignedAt"),
        limit(BATCH_SIZE)
      );

      // Process all batches with maximum optimization
      while (hasMoreData && !abortController.current.signal.aborted) {
        try {
          const snap = await getDocs(q);
          const docs = snap.docs;
          
          if (docs.length === 0) {
            hasMoreData = false;
            break;
          }

          // Process batch with optimized function
          processBatchOptimized(docs);
          processedCount += docs.length;
          
          // Update progress
          updateProgress(processedCount, Math.max(estimatedTotal, processedCount), batchNumber);

          // Check for more data
          if (docs.length < BATCH_SIZE) {
            hasMoreData = false;
          } else {
            // Prepare next batch
            q = query(
              collection(db, "subscriptions"),
              orderBy("assignedAt"),
              startAfter(docs[docs.length - 1]),
              limit(BATCH_SIZE)
            );
          }

          batchNumber++;

          // Minimal delay for UI updates
          if (hasMoreData && batchNumber % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, PROCESSING_DELAY));
          }

        } catch (batchError) {
          console.error(`Error in batch ${batchNumber}:`, batchError);
          setProcessingStatus(`Warning: Error in batch ${batchNumber}, continuing...`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (abortController.current.signal.aborted) {
        setProcessingStatus('Processing cancelled');
        return;
      }

      // Generate CSV with worker-like optimization
      setProcessingStatus('Generating optimized CSV...');
      const csvRows = await generateCSVInWorker(usageStatsRef.current, processedCount);
      
      // Download file
      await downloadOptimizedCSV(csvRows);
      
      const totalTime = Math.round((Date.now() - processingStartTime.current) / 1000);
      setProcessingStatus(`✅ Report downloaded! ${processedCount.toLocaleString()} records in ${totalTime}s (${Math.round(processedCount/totalTime)}/sec)`);
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
    processBatchOptimized, 
    BATCH_SIZE, 
    PROCESSING_DELAY,
    updateProgress, 
    getEstimatedTotal,
    generateCSVInWorker,
    downloadOptimizedCSV
  ]);

  // Cancel processing function
  const cancelProcessing = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      setProcessingStatus('Cancelling...');
    }
  }, []);

  // Memoized progress bar component
  const ProgressBar = useMemo(() => (
    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
      <div 
        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  ), [progress]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-lg w-full border border-gray-100">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
           📊 Download Excel Report
          </h1>
          <p className="text-gray-600">
            Ultra-fast subscription analysis report
          </p>
        </div>
        
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="text-sm text-blue-700 font-semibold mb-2">Processing Status</div>
          <div className="text-blue-900 text-sm mb-3 font-medium">{processingStatus}</div>
          
          {loading && (
            <>
              {ProgressBar}
              <div className="flex justify-between text-xs text-blue-700 mb-2 font-medium">
                <span>{totalProcessed.toLocaleString()} records</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              {processingSpeed > 0 && (
                <div className="text-xs text-green-600 font-semibold">
                  ⚡ Speed: {processingSpeed.toLocaleString()} records/sec
                </div>
              )}
            </>
          )}
        </div>

        {loading && (
          <div className="mb-6 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-blue-600 mx-auto mb-3"></div>
            <div className="text-sm text-gray-700 font-medium">Optimized processing in progress...</div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={processAndDownload}
            disabled={loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center gap-3 text-lg shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating Optimized Report...
              </>
            ) : (
              <>
                ⚡ Download Excel Report
              </>
            )}
          </button>
          
          {loading && (
            <button
              onClick={cancelProcessing}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md"
            >
              ❌ Cancel Processing
            </button>
          )}
        </div>

        {!loading && totalProcessed > 0 && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg text-center border border-green-200">
            <div className="text-sm text-green-700 font-semibold">
              ✅ Last processed: {totalProcessed.toLocaleString()} records
            </div>
            <div className="text-xs text-green-600 mt-1">
              Performance optimizations applied successfully
            </div>
          </div>
        )}
      </div>
    </div>
  );
}