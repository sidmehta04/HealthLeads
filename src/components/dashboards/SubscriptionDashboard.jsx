import  { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import * as XLSX from "xlsx";
import { getDatabase, ref, get } from "firebase/database";
import CampsDashboard from "./CampsDashboard";
import SubscriptionUsageTable from "./SubscriptionUsageTable";
import SubscriptionTable from "./SubscriptionUsageTable";
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

export const SubscriptionDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [clinicsData, setClinicsData] = useState({});
  const [subTab, setSubTab] = useState("sales");

  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    uniqueProducts: 0,
    cashPayments: 0,
    onlinePayments: 0,
  });
  const [utilizedPolicyNumbers, setUtilizedPolicyNumbers] = useState(new Set());

  const [productDistribution, setProductDistribution] = useState([]);
  const [revenueByProduct, setRevenueByProduct] = useState([]);
  const [clinicDistribution, setClinicDistribution] = useState([]);

  // Get current date information
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const [clinicFilter, setClinicFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [uniqueClinicCodes, setUniqueClinicCodes] = useState([]);
  const [uniqueStates, setUniqueStates] = useState([]);
  const [clinicSearchTerm, setClinicSearchTerm] = useState("");
  const [filteredClinicCodes, setFilteredClinicCodes] = useState([]);

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("itd"); // 'daily', 'mtd', 'ytd', 'itd'
  const [selectedDay, setSelectedDay] = useState(currentDate);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const transactionsPerPage = 5;
  const normalizeStateName = (state) => {
    if (!state) return "";

    // Convert to lowercase for case-insensitive comparison
    const stateLower = state.toLowerCase();

    // Mapping for state abbreviations and variations
    const stateMapping = {
      as: "assam",
      wb: "west bengal",
      "west bengal": "west bengal",
      od: "odisha",
      odisha: "odisha",
      "up east": "uttar pradesh east",
      "up west": "uttar pradesh west",
      mh: "maharashtra",
      mp: "madhya pradesh",
      rj: "rajasthan",
      gj: "gujarat",
      gujrat: "gujarat",
      jh: "jharkhand",
    };

    return stateMapping[stateLower] || stateLower;
  };

  // Updated downloadExcel function to ensure only unique policy numbers
  const downloadExcel = () => {
    try {
      // Use filteredSales for export to include all data matching the current filter
      const dataToExport = filteredSales.length > 0 ? filteredSales : salesData;

      // Create a Map to ensure unique policy numbers in export
      const uniquePolicyMap = new Map();

      dataToExport.forEach((sale) => {
        if (sale.policyNumber && !uniquePolicyMap.has(sale.policyNumber)) {
          uniquePolicyMap.set(sale.policyNumber, sale);
        }
      });

      // Convert map back to array for export
      const uniqueDataToExport = Array.from(uniquePolicyMap.values());

      // Create worksheet from the unique data
      const worksheet = XLSX.utils.json_to_sheet(
        uniqueDataToExport.map((sale) => {
          const clinicInfo = clinicsData[sale.clinicCode] || {};

          return {
            Date: formatDate(sale.saleDate || sale.timestamp),
            "Policy Number": sale.policyNumber || "",
            "Transaction ID": sale.transactionId || "",
            Product: sale.productName || "",
            "Clinic Code": sale.clinicCode || "",
            District: clinicInfo.districtName || "",
            State: clinicInfo.state || "",
            "Payment Method": sale.paymentMethod === "cash" ? "Cash" : "UPI",
            "Amount (₹)": sale.price || 0,
            Utilised: utilizedPolicyNumbers.has(sale.policyNumber)
              ? "Yes"
              : "No",
            Cancelled: sale.cancelled === true ? "Yes" : "No", // Add cancelled status for reference
          };
        })
      );

      // Create workbook and add the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Unique_Policies");

      // Generate filename based on the current filter
      let filename = "Unique_Policies_";
      switch (dateFilter) {
        case "daily":
          filename += `${selectedDay.toISOString().split("T")[0]}`;
          break;
        case "mtd":
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          filename += `${monthNames[selectedMonth]}_${selectedYear}`;
          break;
        case "ytd":
          filename += `FY_${selectedYear}-${selectedYear + 1}`;
          break;
        default:
          filename += "All_Time";
      }

      // Add filter information to filename if filters are applied
      if (clinicFilter !== "all") {
        filename += `_${clinicFilter}`;
      }
      if (stateFilter !== "all") {
        filename += `_${stateFilter.replace(/\s+/g, "_")}`;
      }

      filename += ".xlsx";

      // Save the file
      XLSX.writeFile(workbook, filename);

      // Show success message with unique count
      console.log(
        `Excel file downloaded: ${filename} with ${uniqueDataToExport.length} unique policy records (from ${dataToExport.length} total filtered records)`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("There was an error exporting to Excel. Please try again.");
    }
  };
  // Use this in your fetchData useEffect, after setting clinicsData
  // Updated data fetching logic to exclude cancelled transactions and get unique policy numbers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch clinics data first
        const clinicsCollection = collection(db, "clinics");
        const clinicsSnapshot = await getDocs(clinicsCollection);

        const clinicsMap = {};
        clinicsSnapshot.forEach((doc) => {
          const clinicData = doc.data();
          // Use clinic code as the key
          if (clinicData.clinicCode) {
            // Normalize the state name while setting up clinics data
            if (clinicData.state) {
              clinicData.normalizedState = normalizeStateName(clinicData.state);
            }
            clinicsMap[clinicData.clinicCode] = clinicData;
          }
        });

        setClinicsData(clinicsMap);

        // Extract unique clinic codes for filter dropdowns
        const clinicCodes = Object.keys(clinicsMap);
        setUniqueClinicCodes(clinicCodes);
        setFilteredClinicCodes(clinicCodes);

        // Extract and normalize unique states
        const statesMap = new Map();
        Object.values(clinicsMap).forEach((clinic) => {
          if (clinic.state) {
            const normalizedState = normalizeStateName(clinic.state);
            // Use the original state name for display, but track normalized version
            statesMap.set(normalizedState, clinic.state);
          }
        });

        // Convert map to array of unique states (using display names)
        const states = Array.from(statesMap.values());
        setUniqueStates(states);

        // Then fetch sales data
        const salesCollection = collection(db, "sales");
        const salesQuery = query(salesCollection, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(salesQuery);

        const sales = [];
        const policyNumbersMap = new Map(); // To track unique policy numbers

        querySnapshot.forEach((doc) => {
          const saleData = doc.data();

          // Get the sale date from policyCreatedAt (preferred) or timestamp
          const saleTimestamp = saleData.policyCreatedAt;
          const saleDate = saleTimestamp?.toDate
            ? saleTimestamp.toDate()
            : new Date(saleTimestamp);

          // Only include sales with a valid date and status is completed (if status exists)
          // EXCLUDE cancelled transactions (cancelled == true)
          if (
            saleDate &&
            (!saleData.status ||
              (saleData.status === "completed" &&
                saleData.cancelled !== true)) &&
            saleData.cancelled !== true // Double check to exclude cancelled
          ) {
            // Only include sales with non-empty policy numbers
            if (saleData.policyNumber && saleData.policyNumber.trim() !== "") {
              // Check if this policy number already exists
              if (!policyNumbersMap.has(saleData.policyNumber)) {
                const clinicInfo = clinicsMap[saleData.clinicCode] || {};

                const saleRecord = {
                  id: doc.id,
                  ...saleData,
                  saleDate: saleDate, // Add the saleDate property
                  clinicDistrict: clinicInfo.districtName || "Unknown",
                  clinicState: clinicInfo.state || "Unknown",
                  normalizedState: clinicInfo.normalizedState || "",
                };

                // Add to map to track unique policy numbers
                policyNumbersMap.set(saleData.policyNumber, saleRecord);
                sales.push(saleRecord);
              }
            }
          }
        });

        setSalesData(sales);
        filterSalesByDate(sales, dateFilter);

        // Fetch utilized policy numbers
        await fetchUtilizedPolicyNumbers();

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  useEffect(() => {
    // Guard against undefined uniqueClinicCodes
    if (!uniqueClinicCodes) return;

    if (clinicSearchTerm.trim() === "") {
      setFilteredClinicCodes(uniqueClinicCodes);
    } else {
      const filteredCodes = uniqueClinicCodes.filter((code) =>
        code.toLowerCase().includes(clinicSearchTerm.toLowerCase())
      );
      setFilteredClinicCodes(filteredCodes);
    }
  }, [clinicSearchTerm, uniqueClinicCodes]);
  const fetchUtilizedPolicyNumbers = async () => {
    try {
      // Reference to the camp conversion data in Realtime Database
      const campConversionRef = ref(mswasthDb, "camp_conversions");

      // Get the data from camp conversion
      const snapshot = await get(campConversionRef);

      if (snapshot.exists()) {
        const campConversionData = snapshot.val();
        const policyNumbers = new Set();

        // Extract policy numbers from camp conversion data
        // This traverses potential nested structures to find policy numbers
        const extractPolicyNumbers = (data) => {
          if (!data || typeof data !== "object") return;

          if (data.policyNumber) {
            policyNumbers.add(data.policyNumber);
          }

          // Check child nodes
          Object.values(data).forEach((value) => {
            if (value && typeof value === "object") {
              extractPolicyNumbers(value);
            }
          });
        };

        extractPolicyNumbers(campConversionData);
        console.log(`Found ${policyNumbers.size} utilized policy numbers`);
        setUtilizedPolicyNumbers(policyNumbers);
      } else {
        console.log("No data available in camp conversion");
      }
    } catch (error) {
      console.error("Error fetching camp conversion data:", error);
    }
  };

  useEffect(() => {
    if (salesData.length > 0) {
      filterSalesByDate(
        salesData,
        dateFilter,
        selectedDay,
        selectedMonth,
        selectedYear
      );
    }
  }, [
    dateFilter,
    selectedDay,
    selectedMonth,
    selectedYear,
    salesData,
    clinicFilter,
    stateFilter,
    clinicsData,
  ]);

  // Update the filterSalesByDate function
  // Update the filterSalesByDate function with corrected MTD logic
  const filterSalesByDate = (
    sales,
    filter,
    day = selectedDay,
    month = selectedMonth,
    year = selectedYear
  ) => {
    // Guard against undefined sales
    if (!sales) {
      console.warn("Sales data is undefined in filterSalesByDate");
      return;
    }

    let filtered;
    // Date filtering logic updated to use saleDate property
    switch (filter) {
      case "daily":
        // Fix for timezone issues - use date components instead of ISO string
        const selectedDate = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate()
        );
        const nextDay = new Date(selectedDate);
        nextDay.setDate(selectedDate.getDate() + 1);

        filtered = sales.filter((sale) => {
          return sale.saleDate >= selectedDate && sale.saleDate < nextDay;
        });
        break;

      case "mtd":
        // Create a date for the start of the selected month
        const startOfMonth = new Date(year, month, 1);

        // For MTD, we want from start of month to current date (not end of month)
        // If the selected month/year is the current month/year, use current date
        // Otherwise, use the last day of the selected month
        let endDate;
        const currentDate = new Date();
        const isCurrentMonth =
          year === currentDate.getFullYear() &&
          month === currentDate.getMonth();

        if (isCurrentMonth) {
          // For current month, use current date + 1 day to include today's data
          endDate = new Date(currentDate);
          endDate.setDate(currentDate.getDate() + 1);
        } else {
          // For past months, use the entire month
          endDate = new Date(year, month + 1, 1); // Start of next month
        }

        filtered = sales.filter((sale) => {
          return sale.saleDate >= startOfMonth && sale.saleDate < endDate;
        });
        break;

      case "ytd":
        // Financial year (April to March) for the selected year
        const financialYearStart = new Date(year, 3, 1); // April 1st

        // For YTD, filter from start of financial year to current date
        const currentDateForYTD = new Date();
        const endOfCurrentDay = new Date(currentDateForYTD);
        endOfCurrentDay.setDate(currentDateForYTD.getDate() + 1);

        filtered = sales.filter((sale) => {
          return (
            sale.saleDate >= financialYearStart &&
            sale.saleDate < endOfCurrentDay
          );
        });
        break;

      case "itd":
      default:
        filtered = [...sales]; // All data
        break;
    }

    // Additional filter to ensure we only show transactions with policy numbers
    filtered = filtered.filter(
      (sale) => sale.policyNumber && sale.policyNumber.trim() !== ""
    );

    // Guard against undefined clinicsData
    const clinicsDataAvailable =
      clinicsData && Object.keys(clinicsData).length > 0;

    // Apply clinic code filter if not set to "all"
    if (clinicFilter !== "all") {
      filtered = filtered.filter((sale) => sale.clinicCode === clinicFilter);
    }

    // Apply state filter if not set to "all" and clinicsData is available
    if (stateFilter !== "all" && clinicsDataAvailable) {
      filtered = filtered.filter((sale) => {
        const clinicInfo = clinicsData[sale.clinicCode];
        if (!clinicInfo || !clinicInfo.state) return false;

        // Use normalized state for comparison
        return (
          normalizeStateName(clinicInfo.state) ===
          normalizeStateName(stateFilter)
        );
      });
    }

    setFilteredSales(filtered);
    processData(filtered);
    // Also update recentTransactions for the table display
    setRecentTransactions(filtered);
    // Reset to first page when changing filters
    setCurrentPage(1);
  };

  const processData = (sales) => {
    // Calculate stats
    const uniquePolicyNumbers = new Set(sales.map((sale) => sale.policyNumber))
      .size;

    const totalRevenue = sales.reduce(
      (sum, sale) => sum + (sale.price || 0),
      0
    );

    // Count unique products
    const uniqueProducts = new Set(sales.map((sale) => sale.productId)).size;

    // Count payment methods
    const cashPayments = sales.filter(
      (sale) => sale.paymentMethod === "cash"
    ).length;
    const onlinePayments = sales.filter(
      (sale) => sale.paymentMethod !== "cash"
    ).length;

    setStats({
      totalSales: uniquePolicyNumbers, // Change this line
      totalRevenue,
      uniqueProducts,
      cashPayments,
      onlinePayments,
    });

    // Product distribution
    const productCounts = {};
    sales.forEach((sale) => {
      const productName = sale.productName || "Unknown";
      productCounts[productName] = (productCounts[productName] || 0) + 1;
    });

    const productDistData = Object.keys(productCounts).map((product) => ({
      name: product,
      value: productCounts[product],
    }));

    setProductDistribution(productDistData);

    // Revenue by product
    const productRevenue = {};
    sales.forEach((sale) => {
      const productName = sale.productName || "Unknown";
      productRevenue[productName] =
        (productRevenue[productName] || 0) + (sale.price || 0);
    });

    const revenueData = Object.keys(productRevenue).map((product) => ({
      name: product,
      revenue: productRevenue[product],
    }));

    setRevenueByProduct(revenueData);

    // Clinic distribution
    const clinicCounts = {};
    sales.forEach((sale) => {
      const clinicCode = sale.clinicCode || "Unknown";
      clinicCounts[clinicCode] = (clinicCounts[clinicCode] || 0) + 1;
    });

    const clinicData = Object.keys(clinicCounts)
      .map((clinic) => ({
        name: clinic,
        value: clinicCounts[clinic],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 clinics

    setClinicDistribution(clinicData);
  };

  const COLORS = [
    "#4C78A8",
    "#72B7B2",
    "#54A24B",
    "#EECA3B",
    "#B279A2",
    "#FF9DA6",
    "#9D755D",
  ];

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setSubTab("sales")}
          className={`px-4 py-2 text-sm font-medium ${subTab === "sales"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Sales
        </button>
        <button
          onClick={() => setSubTab("camps")}
          className={`px-4 py-2 text-sm font-medium ${subTab === "camps"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Camps
        </button>
        <button
          onClick={() => setSubTab("usage")}
          className={`px-4 py-2 text-sm font-medium ${subTab === "usage"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Usage
        </button>
      </div>

      {/* Sub-tab content */}
      {subTab === "sales" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Subscription Sales Dashboard
            </h2>
            <div className="flex flex-wrap space-x-2">
              <button
                onClick={() => setDateFilter("daily")}
                className={`px-3 py-1 text-sm font-medium rounded-md ${dateFilter === "daily"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                Daily
              </button>
              <button
                onClick={() => setDateFilter("mtd")}
                className={`px-3 py-1 text-sm font-medium rounded-md ${dateFilter === "mtd"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                MTD
              </button>
              <button
                onClick={() => setDateFilter("ytd")}
                className={`px-3 py-1 text-sm font-medium rounded-md ${dateFilter === "ytd"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                YTD
              </button>
              <button
                onClick={() => setDateFilter("itd")}
                className={`px-3 py-1 text-sm font-medium rounded-md ${dateFilter === "itd"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                ITD
              </button>
            </div>
          </div>

          {/* Date controls based on the selected filter */}
          <div className="bg-white rounded-lg shadow p-4">
            {dateFilter === "daily" && (
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <label className="text-sm font-medium text-gray-700">
                  Select Date:
                </label>
                <input
                  type="date"
                  value={selectedDay.toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDay(new Date(e.target.value))}
                  max={currentDate.toISOString().split("T")[0]}
                  className="rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50"
                />
              </div>
            )}

            {dateFilter === "mtd" && (
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <label className="text-sm font-medium text-gray-700">
                  Select Month and Year:
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50"
                  >
                    {Array.from({ length: currentMonth + 1 }, (_, i) => i).map(
                      (monthIndex) => {
                        const monthNames = [
                          "January",
                          "February",
                          "March",
                          "April",
                          "May",
                          "June",
                          "July",
                          "August",
                          "September",
                          "October",
                          "November",
                          "December",
                        ];
                        return (
                          <option key={monthIndex} value={monthIndex}>
                            {monthNames[monthIndex]}
                          </option>
                        );
                      }
                    )}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50"
                  >
                    <option value={currentYear}>{currentYear}</option>
                  </select>
                </div>
              </div>
            )}

            {dateFilter === "ytd" && (
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <label className="text-sm font-medium text-gray-700">
                  Select Financial Year:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50"
                >
                  <option value={currentYear}>
                    {currentYear}-{currentYear + 1}
                  </option>
                </select>
                <span className="text-sm text-gray-500">
                  (April {selectedYear} - March {selectedYear + 1})
                </span>
              </div>
            )}

            {dateFilter === "itd" && (
              <div className="text-sm text-gray-500">
                Showing all data since inception
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Clinic Code:
              </label>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={clinicSearchTerm}
                    onChange={(e) => setClinicSearchTerm(e.target.value)}
                    placeholder="Search clinic code..."
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50 pl-3 pr-10 py-2"
                  />
                  {clinicSearchTerm && (
                    <button
                      onClick={() => setClinicSearchTerm("")}
                      className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <select
                  value={clinicFilter}
                  onChange={(e) => setClinicFilter(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50"
                >
                  <option value="all">All Clinics</option>
                  {filteredClinicCodes.map((clinicCode) => (
                    <option key={clinicCode} value={clinicCode}>
                      {clinicCode}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500">
                  {filteredClinicCodes.length} of {uniqueClinicCodes.length} clinics
                  shown
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">State:</label>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50"
              >
                <option value="all">All States</option>
                {uniqueStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-500">Total Sales</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalSales}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ₹{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-500">Unique Products</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.uniqueProducts}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-500">Payment Methods</p>
                <div className="mt-1">
                  <p className="text-sm text-gray-600">
                    Cash: {stats.cashPayments}
                  </p>
                  <p className="text-sm text-gray-600">
                    Online: {stats.onlinePayments}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Products Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Product Sales Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [value, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue by Product */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Revenue by Product
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={revenueByProduct}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => ["₹" + value.toLocaleString(), "Revenue"]}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clinic Distribution Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">
              Top Clinics by Sales
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={clinicDistribution}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 100,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" name="Number of Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-medium text-gray-900">
                Recent Transactions
              </h3>
              <button
                onClick={downloadExcel}
                className="px-3 py-1 text-sm font-medium rounded-md bg-gray-800 text-white hover:bg-gray-700"
              >
                Download Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Transaction ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Policy Number
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Clinic Code
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      District
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      State
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Payment Method
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Utilised
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTransactions
                    .slice(
                      (currentPage - 1) * transactionsPerPage,
                      currentPage * transactionsPerPage
                    )
                    .map((transaction) => {
                      const clinicInfo = clinicsData[transaction.clinicCode] || {};

                      return (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.transactionId || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.policyNumber || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.productName || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.clinicCode || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {clinicInfo.districtName || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {clinicInfo.state || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(transaction.policyCreatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.paymentMethod === "cash"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                                }`}
                            >
                              {transaction.paymentMethod === "cash"
                                ? "Cash"
                                : "UPI"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ₹{transaction.price?.toLocaleString() || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${utilizedPolicyNumbers.has(transaction.policyNumber)
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                }`}
                            >
                              {utilizedPolicyNumbers.has(transaction.policyNumber)
                                ? "Yes"
                                : "No"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {recentTransactions.length > transactionsPerPage && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${currentPage === 1
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-50"
                      }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(
                          prev + 1,
                          Math.ceil(recentTransactions.length / transactionsPerPage)
                        )
                      )
                    }
                    disabled={
                      currentPage ===
                      Math.ceil(recentTransactions.length / transactionsPerPage)
                    }
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${currentPage ===
                        Math.ceil(recentTransactions.length / transactionsPerPage)
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-50"
                      }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {Math.min(
                          (currentPage - 1) * transactionsPerPage + 1,
                          recentTransactions.length
                        )}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(
                          currentPage * transactionsPerPage,
                          recentTransactions.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {recentTransactions.length}
                      </span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${currentPage === 1
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        <span className="sr-only">Previous</span>
                        &lsaquo;
                      </button>

                      {/* Page numbers */}
                      {[
                        ...Array(
                          Math.min(
                            5,
                            Math.ceil(
                              recentTransactions.length / transactionsPerPage
                            )
                          )
                        ).keys(),
                      ].map((i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border ${currentPage === page
                                ? "z-10 bg-gray-900 border-gray-900 text-white"
                                : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                              } text-sm font-medium`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(
                              prev + 1,
                              Math.ceil(
                                recentTransactions.length / transactionsPerPage
                              )
                            )
                          )
                        }
                        disabled={
                          currentPage ===
                          Math.ceil(recentTransactions.length / transactionsPerPage)
                        }
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${currentPage ===
                            Math.ceil(recentTransactions.length / transactionsPerPage)
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        <span className="sr-only">Next</span>
                        &rsaquo;
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      )}

      {subTab === "camps" && (
        <CampsDashboard />
      )}
      {subTab === "usage" && (
        <SubscriptionTable/>
      )}
    </div>
  );
};

export default SubscriptionDashboard;
