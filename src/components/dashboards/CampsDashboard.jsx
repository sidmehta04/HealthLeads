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
  const clinicsPerPage = 20;

  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        setLoading(true);

        // Fetch clinic codes from mswasthApp
        const clinicsRef = ref(mswasthDb, "clinics");
        const clinicsSnapshot = await get(clinicsRef);

        if (!clinicsSnapshot.exists()) {
          console.warn("No clinics found in the database.");
          setLoading(false);
          return;
        }

        const clinics = clinicsSnapshot.val();
        const clinicCodes = Object.keys(clinics);

        const clinicDataPromises = clinicCodes.map(async (clinicCode) => {
          // Fetch last camp date from mswasthApp
          const healthCampsRef = ref(mswasthDb, "healthCamps");
          const healthCampsSnapshot = await get(healthCampsRef);

          let lastCampDate = "N/A";
          if (healthCampsSnapshot.exists()) {
            const healthCamps = healthCampsSnapshot.val();
            const clinicCamps = Object.values(healthCamps).filter(
              (camp) => camp.clinicCode === clinicCode
            );
            if (clinicCamps.length > 0) {
              lastCampDate = clinicCamps
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0]
                .completedAt;
            }
          }

          // Fetch sales since last camp date from subtracking Firestore
          let policiesSold = 0;
          if (lastCampDate && lastCampDate !== "N/A") {
            const salesQuery = query(
              collection(db, "sales"),
              where("clinicCode", "==", clinicCode),
              where("policyCreatedAt", ">", Timestamp.fromDate(new Date(lastCampDate)))
            );
            const salesSnapshot = await getDocs(salesQuery);
            policiesSold = salesSnapshot.size; 
						//TODO: ITERATE THROUGH POLICIES AND CHECK FOR UNIQUE POLICY NUMBER AND CANCELLED == TRUE
						//TODO: ADD Ascending and Descending filters for date and policies
						//TODO: ADD FILTERS, less than 25 and greater than 25. 
						//TODO: ADD DOWNLOAD OPTION For above to filtered.
          }

          return {
            clinicCode,
            lastCampDate,
            policiesSold,
          };
        });

        const clinicData = await Promise.all(clinicDataPromises);
        setClinicData(clinicData);
      } catch (error) {
        console.error("Error fetching clinic data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClinicData();
  }, []);

  const filteredClinics = clinicData.filter((clinic) =>
    clinic.clinicCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedClinics = filteredClinics.slice(
    (currentPage - 1) * clinicsPerPage,
    currentPage * clinicsPerPage
  );

  const totalPages = Math.ceil(filteredClinics.length / clinicsPerPage);

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900">Camps Overview</h3>
      <p className="text-sm text-gray-600">
        This section displays data related to camps.
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <input
						type="text"
						placeholder="Search by clinic code"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="border border-gray-300 rounded px-4 py-2 mt-4 w-full"
					/>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinic Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Camp Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policies Sold Since Last Camp Date</th>
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
												? new Date(clinic.lastCampDate).toLocaleDateString("en-GB") // Format date as DD-MM-YYYY
												: "N/A"}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">
											{clinic.policiesSold}
										</td>
									</tr>
								))}
							</tbody>
							</table>
							<div className="flex justify-between items-center mt-4">
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