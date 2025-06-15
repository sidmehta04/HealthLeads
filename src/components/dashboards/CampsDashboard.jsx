import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, Timestamp } from "firebase/firestore";
import { getDatabase, ref, get } from "firebase/database";

let mswasthApp;
let mswasthDb;
try {
  // Initialize mswasth Firebase app with a unique name
  mswasthApp = initializeApp(
    {
      apiKey: "AIzaSyBtWbPNRi4ia5a3pJ7aTFqqj9Z4aMN01Os",
      authDomain: "healthcamp-f0c93.firebaseapp.com",
      databaseURL: "https://healthcamp-f0c93-default-rtdb.firebaseio.com",
      projectId: "healthcamp-f0c93",
      storageBucket: "healthcamp-f0c93.firebasestorage.app",
      messagingSenderId: "210176603069",
      appId: "1:210176603069:web:ec38016d08a8051b1bd8d4",
    },
    "mswasth"
  );
} catch (error) {
  // If app already exists with this name, get the existing instance
  if (error.code === "app/duplicate-app") {
    console.log("Using existing mswasth Firebase app");
    mswasthApp = getApps().find((app) => app.name === "mswasth");
  } else {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

// Firebase configuration for the subscription tracking project
const subtrackingConfig = {
  apiKey: "AIzaSyAZ-jBJFKI6o33jMf5xnqZIyXsao-YTb94",
  authDomain: "subtracking-d07a3.firebaseapp.com",
  projectId: "subtracking-d07a3",
  storageBucket: "subtracking-d07a3.firebasestorage.app",
  messagingSenderId: "759048482691",
  appId: "1:759048482691:web:1fda35315dd32f3fb850b6",
};

// Initialize Firebase with a unique name to avoid conflicts
let subtrackingApp;
let db;

try {
  // Try to get existing app instance first
  subtrackingApp = initializeApp(subtrackingConfig, "subtracking");
} catch (error) {
  // If app already exists with this name, get the existing instance
  if (error.code === "app/duplicate-app") {
    console.log("Using existing subtracking Firebase app");
    subtrackingApp = getApps().find((app) => app.name === "subtracking");
  } else {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

db = getFirestore(subtrackingApp);
mswasthDb = getDatabase(mswasthApp);

const CampsDashboard = () => {
  const [clinicData, setClinicData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // New state for filtering and sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [policiesFilter, setPoliciesFilter] = useState('all'); // 'all', 'less25', 'greater25'
  
  const clinicsPerPage = 20;

  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        setLoading(true);
        setLoadingProgress(0);

        // Step 1: Fetch all clinics from Firestore (10% progress)
        console.time('Fetch clinics');
        const clinicsQuery = query(collection(db, "clinics"));
        const clinicsSnapshot = await getDocs(clinicsQuery);
        console.timeEnd('Fetch clinics');

        if (clinicsSnapshot.empty) {
          console.warn("No clinics found in the database.");
          setLoading(false);
          return;
        }

        const clinicCodes = clinicsSnapshot.docs.map(doc => doc.data().clinicCode || doc.id);
        setLoadingProgress(10);

        // Step 2: Fetch all health camps at once (30% progress)
        console.time('Fetch health camps');
        const healthCampsRef = ref(mswasthDb, "healthCamps");
        const healthCampsSnapshot = await get(healthCampsRef);
        console.timeEnd('Fetch health camps');

        let healthCamps = {};
        if (healthCampsSnapshot.exists()) {
          healthCamps = healthCampsSnapshot.val();
        }
        setLoadingProgress(30);

        // Step 3: Process camp data to find last camp date for each clinic (50% progress)
        console.time('Process camp data');
        const clinicLastCampMap = {};
        
        Object.values(healthCamps).forEach(camp => {
          if (camp.clinicCode && camp.completedAt) {
            const clinicCode = camp.clinicCode;
            const completedAt = camp.completedAt;
            
            if (!clinicLastCampMap[clinicCode] || 
                new Date(completedAt) > new Date(clinicLastCampMap[clinicCode])) {
              clinicLastCampMap[clinicCode] = completedAt;
            }
          }
        });
        console.timeEnd('Process camp data');
        setLoadingProgress(50);

        // Step 4: Fetch all sales data at once (70% progress)
        console.time('Fetch sales data');
        const salesQuery = query(collection(db, "sales"));
        const salesSnapshot = await getDocs(salesQuery);
        console.timeEnd('Fetch sales data');

        // Step 5: Process sales data efficiently (90% progress)
        console.time('Process sales data');
        const salesByClinic = {};
        
        salesSnapshot.docs.forEach(doc => {
          const saleData = doc.data();
          const clinicCode = saleData.clinicCode;
          
          if (!clinicCode) return;
          
          if (!salesByClinic[clinicCode]) {
            salesByClinic[clinicCode] = [];
          }
          
          salesByClinic[clinicCode].push({
            policyNumber: saleData.policyNumber,
            policyCreatedAt: saleData.policyCreatedAt,
            cancelled: saleData.cancelled === true,
            productId: saleData.productId
          });
        });
        console.timeEnd('Process sales data');
        setLoadingProgress(90);

        // Step 6: Calculate final data for each clinic (100% progress)
        console.time('Calculate final data');
        const clinicDataResults = clinicCodes.map(clinicCode => {
          const lastCampDate = clinicLastCampMap[clinicCode] || "N/A";
          
          let policiesSold = 0;
          
          if (salesByClinic[clinicCode]) {
            const uniquePolicies = new Set();
            
            salesByClinic[clinicCode].forEach(sale => {
              // Only count non-cancelled policies, excluding EasyCure products
              if (!sale.cancelled && 
                  sale.policyCreatedAt && 
                  sale.policyNumber &&
                  sale.productId !== 'EasyCure') {
                
                // If there's no last camp date, count all policies
                // If there is a last camp date, only count policies after that date
                if (lastCampDate === "N/A") {
                  uniquePolicies.add(sale.policyNumber);
                } else {
                  const lastCampTimestamp = new Date(lastCampDate);
                  if (sale.policyCreatedAt.toDate() > lastCampTimestamp) {
                    uniquePolicies.add(sale.policyNumber);
                  }
                }
              }
            });
            
            policiesSold = uniquePolicies.size;
          }

          return {
            clinicCode,
            lastCampDate,
            policiesSold,
          };
        });
        console.timeEnd('Calculate final data');

        console.log(`Processed ${clinicCodes.length} clinics`);
        setClinicData(clinicDataResults);
        setLoadingProgress(100);
      } catch (error) {
        console.error("Error fetching clinic data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClinicData();
  }, []);

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply filters and sorting
  const getFilteredAndSortedData = () => {
    let filtered = clinicData.filter((clinic) =>
      clinic.clinicCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply policies filter
    if (policiesFilter === 'less25') {
      filtered = filtered.filter(clinic => clinic.policiesSold < 25);
    } else if (policiesFilter === 'greater25') {
      filtered = filtered.filter(clinic => clinic.policiesSold >= 25);
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle date sorting
        if (sortConfig.key === 'lastCampDate') {
          aValue = aValue === 'N/A' ? new Date(0) : new Date(aValue);
          bValue = bValue === 'N/A' ? new Date(0) : new Date(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  };

  const filteredAndSortedClinics = getFilteredAndSortedData();
  const paginatedClinics = filteredAndSortedClinics.slice(
    (currentPage - 1) * clinicsPerPage,
    currentPage * clinicsPerPage
  );

  const totalPages = Math.ceil(filteredAndSortedClinics.length / clinicsPerPage);

  // Download function
  const downloadCSV = () => {
    const csvData = filteredAndSortedClinics.map(clinic => ({
      'Clinic Code': clinic.clinicCode,
      'Last Camp Date': clinic.lastCampDate && clinic.lastCampDate !== "N/A"
        ? new Date(clinic.lastCampDate).toLocaleDateString("en-GB")
        : "N/A",
      'Policies Sold': clinic.lastCampDate === "N/A" 
        ? clinic.policiesSold 
        : clinic.policiesSold
    }));

    const csvHeaders = Object.keys(csvData[0] || {});
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => csvHeaders.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `camps_dashboard_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort indicator component
  const SortIndicator = ({ column }) => {
    if (sortConfig.key !== column) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortConfig.direction === 'asc' ? 
      <span className="text-blue-600">↑</span> : 
      <span className="text-blue-600">↓</span>;
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900">Camps Overview</h3>
      <p className="text-sm text-gray-600">
        This section displays data related to camps.
      </p>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">Loading clinic data...</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{loadingProgress}% complete</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Search and Filter Controls */}
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex flex-wrap gap-4 items-center">
              <input
                type="text"
                placeholder="Search by clinic code"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2 flex-1 min-w-64"
              />
              
              <select
                value={policiesFilter}
                onChange={(e) => setPoliciesFilter(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2"
              >
                <option value="all">All Policies</option>
                <option value="less25">Less than 25 policies</option>
                <option value="greater25">25 or more policies</option>
              </select>
              
              <button
                onClick={downloadCSV}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('clinicCode')}
                  >
                    <div className="flex items-center gap-2">
                      Clinic Code
                      <SortIndicator column="clinicCode" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastCampDate')}
                  >
                    <div className="flex items-center gap-2">
                      Last Camp Date
                      <SortIndicator column="lastCampDate" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('policiesSold')}
                  >
                    <div className="flex items-center gap-2">
                      Policies Sold
                      <SortIndicator column="policiesSold" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedClinics.map((clinic) => (
                  <tr key={clinic.clinicCode} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">
                      {clinic.clinicCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">
                      {clinic.lastCampDate && clinic.lastCampDate !== "N/A"
                        ? new Date(clinic.lastCampDate).toLocaleDateString("en-GB")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        clinic.policiesSold >= 25 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {clinic.policiesSold}
                      </span>
                      
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Results summary */}
            <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
              Showing {paginatedClinics.length} of {filteredAndSortedClinics.length} clinics
            </div>
            
            {/* Pagination */}
            <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className={`px-4 py-2 rounded ${
                  currentPage === 1
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page <span className="font-bold">{currentPage}</span> of{" "}
                <span className="font-bold">{totalPages}</span>
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className={`px-4 py-2 rounded ${
                  currentPage === totalPages
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampsDashboard;