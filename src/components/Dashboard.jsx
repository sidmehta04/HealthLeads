// Dashboard.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { database } from "../firebase/config";
import { ref, onValue } from "firebase/database";
import { HealthCampComponent } from "./DataBaseRetrival/HealthEntries";
import { IndividualComponent } from "./DataBaseRetrival/IndividualEntries";

const Dashboard = () => {
  const { userRole } = useAuth();
  const [healthCampData, setHealthCampData] = useState([]);
  const [individualData, setIndividualData] = useState([]);
  const [loading, setLoading] = useState({
    healthCamp: false,
    individual: false
  });
  const [error, setError] = useState(null);

  // State for individual filters
  const [individualFilters, setIndividualFilters] = useState({
    testCode: "all",
    testName: "all",
    submittedAt: "all",
    reportStatus: "all",
    vendorStatus: "all",
  });

  // State for column filters
  const [columnFilters, setColumnFilters] = useState({});
  
  // Initialize filter options state
  const [filterOptions, setFilterOptions] = useState({
    staffTypes: ["agent", "nurse", "som", "dc", "teamLeader"],
    staffNames: {
      agent: [],
      nurse: [],
      som: [],
      dc: [],
      teamLeader: [],
    },
    clinicCodes: [],
    dates: [],
    statuses: [],
    testCodes: [],
    testNames: [],
    reportStatuses: [],
    vendorStatuses: []
  });

  // Fetch health camp data
  useEffect(() => {
    if (userRole === "health-camp-admin" || userRole === "superadmin") {
      setLoading(prev => ({ ...prev, healthCamp: true }));
      const healthCampRef = ref(database, "healthCamps");
      
      try {
        const unsubscribe = onValue(healthCampRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const formattedData = Object.entries(data).map(([id, camp]) => ({
              id,
              ...camp,
            }));
            setHealthCampData(formattedData);
            
            // Extract unique values for all filterable fields
            const staffNames = {
              agent: [...new Set(formattedData.map(camp => camp.agentName).filter(Boolean))],
              nurse: [...new Set(formattedData.map(camp => camp.nurseName).filter(Boolean))],
              som: [...new Set(formattedData.map(camp => camp.somName).filter(Boolean))],
              dc: [...new Set(formattedData.map(camp => camp.dcName).filter(Boolean))],
              teamLeader: [...new Set(formattedData.map(camp => camp.teamLeader).filter(Boolean))],
            };

            setFilterOptions(prev => ({
              ...prev,
              staffNames,
              clinicCodes: [...new Set(formattedData.map(camp => camp.clinicCode).filter(Boolean))].sort(),
              dates: [...new Set(formattedData.map(camp => camp.date).filter(Boolean))].sort(),
              statuses: [...new Set(formattedData.map(camp => camp.status).filter(Boolean))].sort(),
            }));
          }
          setLoading(prev => ({ ...prev, healthCamp: false }));
        }, (error) => {
          setError(error.message);
          setLoading(prev => ({ ...prev, healthCamp: false }));
        });

        return () => unsubscribe();
      } catch (error) {
        setError(error.message);
        setLoading(prev => ({ ...prev, healthCamp: false }));
      }
    }
  }, [userRole]);

  // Fetch individual data
  useEffect(() => {
    if (userRole === "individual-camp-admin" || userRole === "health-camp-admin" || userRole === "superadmin") {
      setLoading(prev => ({ ...prev, individual: true }));
      const individualRef = ref(database, "testEntries");
      
      try {
        const unsubscribe = onValue(individualRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const formattedData = Object.entries(data).map(([id, entry]) => ({
              id,
              ...entry,
            }));
            setIndividualData(formattedData);

            // Update filter options for individual entries
            setFilterOptions(prev => ({
              ...prev,
              testCodes: [...new Set(formattedData.map(entry => entry.testCode).filter(Boolean))].sort(),
              testNames: [...new Set(formattedData.map(entry => entry.testName).filter(Boolean))].sort(),
              reportStatuses: [...new Set(formattedData.map(entry => entry.reportStatus).filter(Boolean))].sort(),
              vendorStatuses: [...new Set(formattedData.map(entry => entry.vendorStatus).filter(Boolean))].sort(),
            }));
          }
          setLoading(prev => ({ ...prev, individual: false }));
        }, (error) => {
          setError(error.message);
          setLoading(prev => ({ ...prev, individual: false }));
        });

        return () => unsubscribe();
      } catch (error) {
        setError(error.message);
        setLoading(prev => ({ ...prev, individual: false }));
      }
    }
  }, [userRole]);

  // Handle individual filter changes
  const handleIndividualFilterChange = (filterKey, value) => {
    setIndividualFilters(prev => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  // Handle column filter changes
  const handleColumnFilterChange = (filters) => {
    setColumnFilters(filters);
  };

  // Filter individual data based on filters
  const getFilteredIndividualData = () => {
    return individualData.filter(entry => {
      return Object.entries(individualFilters).every(([key, value]) => {
        if (value === "all") return true;
        return entry[key] === value;
      });
    });
  };

  // Filter health camp data based on column filters
  const filterHealthCampData = (data) => {
    return data.filter(camp => {
      return Object.entries(columnFilters).every(([field, value]) => {
        if (!value || value === "all") return true;
        
        // Handle staff name fields
        if (field.startsWith('staff_')) {
          const staffType = field.split('_')[1];
          const staffFieldMap = {
            agent: 'agentName',
            nurse: 'nurseName',
            som: 'somName',
            dc: 'dcName',
            teamLeader: 'teamLeader'
          };
          return camp[staffFieldMap[staffType]] === value;
        }
        
        // Handle regular fields
        return camp[field] === value;
      });
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-red-600 text-lg font-semibold mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const isLoading = loading.healthCamp || loading.individual;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-14xl mx-auto py-0 px-0">
        {/* Health Camp Section */}
        {(userRole === "health-camp-admin" || userRole === "superadmin") && (
          <HealthCampComponent
            data={filterHealthCampData(healthCampData)}
            filterOptions={filterOptions}
            onColumnFilterChange={handleColumnFilterChange}
            userRole={userRole}
          />
        )}
        
        {/* Individual Section */}
        {(userRole === "individual-camp-admin" ||
          userRole === "health-camp-admin" ||
          userRole === "superadmin") && (
          <IndividualComponent
            data={getFilteredIndividualData()}
            filters={individualFilters}
            filterOptions={filterOptions}
            onFilterChange={handleIndividualFilterChange}
            userRole={userRole}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;