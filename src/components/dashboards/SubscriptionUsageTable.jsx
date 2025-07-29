import React, { useState, useEffect } from "react";
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

// Initialize Firebase apps (same as before)
let mswasthApp;
try {
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
} catch (e) {
  mswasthApp = getApps().find((app) => app.name === "mswasth");
}

let subtrackingApp;
try {
  subtrackingApp = initializeApp(
    {
      apiKey: "AIzaSyAZ-jBJFKI6o33jMf5xnqZIyXsao-YTb94",
      authDomain: "subtracking-d07a3.firebaseapp.com",
      projectId: "subtracking-d07a3",
      storageBucket: "subtracking-d07a3.firebasestorage.app",
      messagingSenderId: "759048482691",
      appId: "1:759048482691:web:1fda35315dd32f3fb850b6",
    },
    "subtracking"
  );
} catch (e) {
  subtrackingApp = getApps().find((app) => app.name === "subtracking");
}

const db = getFirestore(subtrackingApp);

export default function SubscriptionTable() {
  const BATCH_SIZE = 500;
  const ALL_PRODUCTS = ["M-Swasth Active", "M-Swasth Easy", "Vital+", "Vital+ with TFT"];

  const [utilizedCounts, setUtilizedCounts] = useState({});
  const [allClinics, setAllClinics] = useState(new Set());
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [totalProcessed, setTotalProcessed] = useState(0);

  const fetchNextBatch = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    let q = query(
      collection(db, "subscriptions"),
      orderBy("assignedAt"),
      limit(BATCH_SIZE)
    );
    
    if (lastDoc) {
      q = query(
        collection(db, "subscriptions"),
        orderBy("assignedAt"),
        startAfter(lastDoc),
        limit(BATCH_SIZE)
      );
    }

    try {
      const snap = await getDocs(q);
      const docs = snap.docs;
      
      if (docs.length < BATCH_SIZE) setHasMore(false);
      if (docs.length === 0) {
        setLoading(false);
        return;
      }

      const updates = {};
      const newClinics = new Set();

      docs.forEach((doc) => {
        const d = doc.data();
        const clinic = d.clinicCode || "Unknown";
        const product = d.productName || d.productId || "Unknown";
        const used = d.used === true;

        newClinics.add(clinic);
        const key = `${clinic}__${product}`;

        if (!updates[key]) {
          updates[key] = 0;
        }
        
        if (used) {
          updates[key] += 1;
        }
      });

      console.log('Utilized counts from this batch:', updates);

      setAllClinics((prev) => new Set([...prev, ...newClinics]));
      setTotalProcessed(prev => prev + docs.length);

      setUtilizedCounts((prev) => {
        const merged = { ...prev };
        for (const k in updates) {
          if (merged[k]) {
            merged[k] += updates[k];
          } else {
            merged[k] = updates[k];
          }
        }
        return merged;
      });

      setLastDoc(docs[docs.length - 1]);
    } catch (error) {
      console.error("Error fetching batch:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextBatch();
  }, []);

  const getCompleteDataWithTotals = () => {
    const clinicList = Array.from(allClinics).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const completeData = [];

    clinicList.forEach((clinic) => {
      let clinicTotals = { total: 0, utilized: 0, remaining: 0 };

      ALL_PRODUCTS.forEach((product) => {
        const key = `${clinic}__${product}`;
        const utilized = utilizedCounts[key] || 0;
        const remaining = 100 - utilized;

        const row = {
          clinicCode: clinic,
          productName: product,
          total: 100, // Always 100
          utilized,
          remaining,
        };

        completeData.push(row);
        clinicTotals.total += 100; // Each product adds 100 to total
        clinicTotals.utilized += utilized;
        clinicTotals.remaining += remaining;
      });

      // Add total row for the clinic
      completeData.push({
        isTotal: true,
        clinicCode: `${clinic} Total`,
        productName: "",
        total: clinicTotals.total,
        utilized: clinicTotals.utilized,
        remaining: clinicTotals.remaining,
      });
    });

    console.log('Complete data with totals:', completeData);
    return completeData;
  };

  const completeRows = getCompleteDataWithTotals();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Detailed Subscription Report</h2>
        <div className="mb-4 text-sm text-gray-600">
          Total records processed: {totalProcessed} | Clinics: {allClinics.size}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-200">Clinic Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-200">Product Name</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">Total Subscription</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">Utilized</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {completeRows.map((row, index) => (
                  <tr
                    key={`${row.clinicCode}__${row.productName}__${index}`}
                    className={`${row.isTotal ? 'bg-gray-50 font-semibold border-t-2 border-gray-300' : 'hover:bg-gray-50'} border-b border-gray-100`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-100">
                      {row.isTotal ? (
                        <span className="font-semibold">{row.clinicCode}</span>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-blue-600">▼</span>
                          <span className="ml-2">{row.clinicCode}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-100">{row.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-center border-r border-gray-100">{row.total}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-center border-r border-gray-100">{row.utilized}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-center">{row.remaining}</td>
                  </tr>
                ))}
                {completeRows.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No data fetched yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={fetchNextBatch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Loading…" : "Load More"}
            </button>
            {loading && (
              <div className="mt-2 text-sm text-gray-500">Processing batch {totalProcessed + 1}-{totalProcessed + BATCH_SIZE}...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}