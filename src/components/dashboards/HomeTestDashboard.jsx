import React, { useState, useEffect } from "react";
import { database } from "../../firebase/config";
import { ref, get } from "firebase/database";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import _ from "lodash";
import {
  ChartBar,
  CircleDollarSign,
  ClipboardCheck,
  Users,
  AlertCircle,
} from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function HomeTestDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [testData, setTestData] = useState([]);
  const [selectedTest, setSelectedTest] = useState("all");
  const [insights, setInsights] = useState({
    totalTests: 0,
    totalRevenue: 0,
    pendingReports: 0,
    completedTests: 0,
    testDistribution: [],
    revenueByTest: [],
    statusDistribution: [],
    partnerDistribution: [],
  });

  // Fetch test data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const testEntriesRef = ref(database, "testEntries");
        const snapshot = await get(testEntriesRef);

        if (snapshot.exists()) {
          const entries = Object.values(snapshot.val());
          setTestData(entries);
          calculateInsights(entries, "all");
        } else {
          setError("No test data available");
        }
      } catch (error) {
        setError("Error fetching data: " + error.message);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Calculate insights based on selected test
  const calculateInsights = (data, selectedTestType) => {
    let filteredData = data;
    if (selectedTestType !== "all") {
      filteredData = data.filter((test) => test.testName === selectedTestType);
    }

    // Basic metrics
    const totalTests = filteredData.length;
    const totalRevenue = _.sumBy(
      filteredData,
      (test) => Number(test.price) || 0
    );
    const pendingReports = filteredData.filter(
      (test) => !test.reportStatus || test.reportStatus === "not_submitted"
    ).length;
    const completedTests = filteredData.filter(
      (test) =>
        test.vendorStatus === "completed" && test.reportStatus === "submitted"
    ).length;

    // Test distribution
    const testDistribution = _(filteredData)
      .groupBy("testName")
      .map((tests, name) => ({
        name,
        count: tests.length,
      }))
      .value();

    // Revenue by test
    const revenueByTest = _(filteredData)
      .groupBy("testName")
      .map((tests, name) => ({
        name,
        revenue: _.sumBy(tests, (test) => Number(test.price) || 0),
      }))
      .value();

    // Status distribution
    const statusDistribution = [
      {
        name: "Completed",
        value: completedTests,
      },
      {
        name: "Pending Reports",
        value: pendingReports,
      },
      {
        name: "In Progress",
        value: totalTests - completedTests - pendingReports,
      },
    ];

    // Partner distribution
    const partnerDistribution = _(filteredData)
      .groupBy((test) => (test.hasPartner ? "Partner" : "Direct"))
      .map((tests, type) => ({
        name: type,
        value: tests.length,
      }))
      .value();

    setInsights({
      totalTests,
      totalRevenue,
      pendingReports,
      completedTests,
      testDistribution,
      revenueByTest,
      statusDistribution,
      partnerDistribution,
    });
  };

  // Handle test selection
  const handleTestChange = (e) => {
    const selectedValue = e.target.value;
    setSelectedTest(selectedValue);
    calculateInsights(testData, selectedValue);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Home Test Dashboard
            </h1>
            <select
              value={selectedTest}
              onChange={handleTestChange}
              className="rounded-lg border-gray-300"
            >
              <option value="all">All Tests</option>
              {_(testData)
                .map("testName")
                .uniq()
                .filter(Boolean)
                .sort()
                .map((test) => (
                  <option key={test} value={test}>
                    {test}
                  </option>
                ))
                .value()}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <ChartBar className="w-10 h-10 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {insights.totalTests}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CircleDollarSign className="w-10 h-10 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  ₹{insights.totalRevenue}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <ClipboardCheck className="w-10 h-10 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pending Reports
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {insights.pendingReports}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="w-10 h-10 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Completed Tests
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {insights.completedTests}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Test Distribution
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.testDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0088FE" name="Number of Tests" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue by Test */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue by Test
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.revenueByTest}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#00C49F" name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Status Distribution
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={insights.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {insights.statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Partner Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Partner vs Direct Tests
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={insights.partnerDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {insights.partnerDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeTestDashboard;
