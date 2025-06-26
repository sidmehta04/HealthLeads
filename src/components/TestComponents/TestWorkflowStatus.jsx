// TestWorkflowStatus.jsx - Optimized for large datasets
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { database } from "../../firebase/config";
import { ref, onValue, off } from "firebase/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, FileText, CheckCircle2, Clock, ChevronDown, ChevronUp, Package } from "lucide-react";
import { StatusBadge, UserActivityInfo, formatDateTime } from "./SubComponents/TestActivityStatus";

const TestWorkflowStatus = ({ activeContext, onTestClick }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTabsVisible, setIsTabsVisible] = useState(true);
  const [showAllRecords, setShowAllRecords] = useState({});
  const [itemsPerPage] = useState(10); // Show only 5 items

  useEffect(() => {
    const testsRef = ref(database, "testEntries");
    
    const unsubscribe = onValue(testsRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const allTests = Object.entries(snapshot.val())
            .map(([key, test]) => ({
              id: key,
              ...test,
            }))
            .sort((a, b) => new Date(b.metadata?.createdAt || 0) - new Date(a.metadata?.createdAt || 0));
          setTests(allTests);
        } else {
          setTests([]);
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch tests: " + err.message);
        setLoading(false);
      }
    });
    return () => off(testsRef, 'value', unsubscribe);
  }, []);

  // Memoized filter function for better performance
  const filterTests = useMemo(() => {
    return {
      incomplete: tests.filter(
        (test) => !test.paymentStatus || test.paymentStatus !== "completed"
      ),
      pendingVendor: tests.filter(
        (test) =>
          test.paymentStatus === "completed" &&
          (!test.vendorStatus || test.vendorStatus !== "completed")
      ),
      pendingReport: tests.filter(
        (test) =>
          test.paymentStatus === "completed" &&
          test.vendorStatus === "completed" &&
          (!test.reportStatus || test.reportStatus !== "submitted")
      ),
      completed: tests.filter(
        (test) =>
          test.paymentStatus === "completed" &&
          test.vendorStatus === "completed" &&
          test.reportStatus === "submitted"
      ),
    };
  }, [tests]);

  // Helper function to get display ID for search
  const getDisplayId = useCallback((test) => {
    return test.masterBookingId || test.testCode || test.bookingId || 'N/A';
  }, []);

  // Helper function to get test summary
  const getTestSummary = useCallback((test) => {
    if (test.tests && test.tests.length > 0) {
      return {
        isMultiple: true,
        testCount: test.testCount || test.tests.length,
        testNames: test.tests.map(t => t.testName).join(", "),
        totalPrice: test.totalPrice || 0
      };
    }
    return {
      isMultiple: false,
      testCount: 1,
      testNames: test.testName || 'N/A',
      totalPrice: test.price || 0
    };
  }, []);

  // Toggle show all records for specific tab
  const toggleShowAll = useCallback((tabKey) => {
    setShowAllRecords(prev => ({
      ...prev,
      [tabKey]: !prev[tabKey]
    }));
  }, []);

  // Virtualized table component for better performance
  const TestTable = React.memo(({ tests, tabKey }) => {
    const isShowingAll = showAllRecords[tabKey];
    const displayTests = isShowingAll ? tests : tests.slice(0, itemsPerPage);
    
    return (
      <div className="flex flex-col gap-4">
        {/* Performance indicator for large datasets */}
        {tests.length > 1000 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                Large dataset ({tests.length.toLocaleString()} records). 
                {!isShowingAll && ` Showing first ${itemsPerPage} entries.`}
              </span>
            </div>
          </div>
        )}

        {/* Scrollable table container */}
        <div className="border border-gray-200 rounded-lg">
          <div 
            className="overflow-y-auto" 
            style={{ 
              maxHeight: '400px',
              scrollBehavior: 'smooth'
            }}
            onScroll={(e) => e.stopPropagation()}
          >
            <table className="w-full">
              {/* Header */}
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Booking ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Tests
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Vendor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayTests.map((test, index) => {
                  const testSummary = getTestSummary(test);
                  return (
                    <tr 
                      key={test.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}
                    >
                      <td className="px-4 py-4 border-r border-gray-100">
                        <button
                          onClick={() => onTestClick?.(test)}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {getDisplayId(test)}
                        </button>
                        {testSummary.isMultiple && (
                          <div className="flex items-center gap-1 mt-1">
                            <Package className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">
                              Multiple Tests
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 border-r border-gray-100">
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {test.name}
                          </span>
                          <div className="text-xs text-gray-500">{test.mobileNo}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 border-r border-gray-100">
                        <div className="max-w-xs">
                          {testSummary.isMultiple ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {testSummary.testCount} Tests
                              </div>
                              <div className="text-xs text-gray-500 truncate" title={testSummary.testNames}>
                                {testSummary.testNames}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-900">{testSummary.testNames}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 border-r border-gray-100">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{testSummary.totalPrice}
                          {test.isFree && (
                            <span className="text-xs text-green-600 ml-1">(Free)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 border-r border-gray-100">
                        <StatusBadge status={test.paymentStatus} />
                      </td>
                      <td className="px-4 py-4 border-r border-gray-100">
                        <StatusBadge status={test.vendorStatus} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={test.reportStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination controls */}
        {tests.length > itemsPerPage && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {displayTests.length} of {tests.length.toLocaleString()} entries
            </div>
            <button
              onClick={() => toggleShowAll(tabKey)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
            >
              {isShowingAll ? "Show Less" : `Show All (${tests.length.toLocaleString()})`}
            </button>
          </div>
        )}
      </div>
    );
  });



  const getContextTabs = () => {
    switch (activeContext) {
      case "vendor-check":
        return ["pendingVendor", "pendingReport"];
      case "report-status":
        return ["pendingReport", "completed"];
      default:
        return ["incomplete", "pendingVendor"];
    }
  };

  const getDefaultTab = () => {
    switch (activeContext) {
      case "vendor-check":
        return "pendingVendor";
      case "report-status":
        return "pendingReport";
      default:
        return "incomplete";
    }
  };

  const tabLabels = {
    incomplete: { label: "Pending Payments", icon: Clock },
    pendingVendor: { label: "Pending Vendor Booking", icon: FileText },
    pendingReport: { label: "Pending Report", icon: AlertCircle },
    completed: { label: "Completed", icon: CheckCircle2 },
  };

  // Memoized summary statistics calculation
  const getSummaryStats = useCallback((tests) => {
    const multipleTestEntries = tests.filter(test => test.tests && test.tests.length > 0);
    const singleTestEntries = tests.filter(test => !test.tests || test.tests.length === 0);
    const totalTests = tests.reduce((sum, test) => {
      return sum + (test.testCount || (test.tests ? test.tests.length : 1));
    }, 0);
    const totalAmount = tests.reduce((sum, test) => {
      return sum + (test.totalPrice || test.price || 0);
    }, 0);

    return {
      totalEntries: tests.length,
      multipleTestEntries: multipleTestEntries.length,
      singleTestEntries: singleTestEntries.length,
      totalTests,
      totalAmount
    };
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Test Entry Workflow Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Test Entry Workflow Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Test Entry Workflow Status</CardTitle>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTabsVisible(!isTabsVisible)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={isTabsVisible ? "Collapse panel" : "Expand panel"}
          >
            {isTabsVisible ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {isTabsVisible && (
          <Tabs defaultValue={getDefaultTab()} className="w-full">
            <TabsList 
              className="mb-4 grid w-full" 
              style={{ gridTemplateColumns: `repeat(${getContextTabs().length}, 1fr)` }}
            >
              {getContextTabs().map((tabKey) => {
                const TabIcon = tabLabels[tabKey].icon;
                const stats = getSummaryStats(filterTests[tabKey]);
                return (
                  <TabsTrigger
                    key={tabKey}
                    value={tabKey}
                    className="flex items-center gap-2"
                  >
                    <TabIcon className="w-4 h-4" />
                    <div className="flex flex-col items-center">
                      <span>{tabLabels[tabKey].label}</span>
                      <span className="text-xs opacity-75">
                        ({stats.totalEntries.toLocaleString()} entries, {stats.totalTests.toLocaleString()} tests)
                      </span>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {getContextTabs().map((tabKey) => {
              const stats = getSummaryStats(filterTests[tabKey]);
              return (
                <TabsContent key={tabKey} value={tabKey}>
                  {filterTests[tabKey].length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No {tabLabels[tabKey].label.toLowerCase()} test entries found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary Stats */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-lg font-semibold text-blue-800">{stats.totalEntries.toLocaleString()}</div>
                            <div className="text-xs text-blue-600">Entries</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-blue-800">{stats.totalTests.toLocaleString()}</div>
                            <div className="text-xs text-blue-600">Total Tests</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-blue-800">₹{stats.totalAmount.toLocaleString()}</div>
                            <div className="text-xs text-blue-600">Total Amount</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-blue-800">{stats.multipleTestEntries.toLocaleString()}</div>
                            <div className="text-xs text-blue-600">Multi-Test Entries</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Table Display */}
                      <TestTable tests={filterTests[tabKey]} tabKey={tabKey} />
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default TestWorkflowStatus;