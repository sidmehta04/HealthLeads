// TestWorkflowStatus.jsx - Perfect design with optimized virtualization and aligned columns
import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from "react";
import { database } from "../../firebase/config";
import { ref, onValue, off } from "firebase/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, FileText, CheckCircle2, Clock, ChevronDown, ChevronUp, Package, Loader2, User, Phone, CreditCard } from "lucide-react";
import { StatusBadge } from "./SubComponents/TestActivityStatus";
import { Virtuoso, TableVirtuoso } from "react-virtuoso";
import debounce from "lodash.debounce";
 
// Mobile Card Component
// eslint-disable-next-line react/display-name
const TestMobileCard = React.memo(({ test, onTestClick, getTestSummary, getDisplayId }) => {
  const testSummary = getTestSummary(test);
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <button
            onClick={() => onTestClick?.(test)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
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
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-gray-900">
            ₹{testSummary.totalPrice}
            {test.isFree && (
              <span className="text-xs text-green-600 ml-1">(Free)</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <User className="w-4 h-4 text-gray-400" />
        <div>
          <span className="font-medium text-gray-900">{test.name}</span>
          <div className="flex items-center gap-1 mt-1">
            <Phone className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{test.mobileNo}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-xs text-gray-500 uppercase font-medium">Tests:</span>
          <div className="text-sm text-gray-900 mt-1">
            {testSummary.isMultiple ? (
              <div>
                <span className="font-medium">{testSummary.testCount} Tests</span>
                <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {testSummary.testNames}
                </div>
              </div>
            ) : (
              <span>{testSummary.testNames}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">Payment:</span>
            <StatusBadge status={test.paymentStatus} />
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">Vendor:</span>
            <StatusBadge status={test.vendorStatus} />
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">Report:</span>
            <StatusBadge status={test.reportStatus} />
          </div>
        </div>
      </div>
    </div>
  );
});

// Perfect Table Row Component with Fixed Widths
const TestTableRow = React.memo(({ test, index, onTestClick, getTestSummary, getDisplayId }) => {
  const testSummary = getTestSummary(test);
  return (
    <tr style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
      <td 
        className="px-3 py-4 text-left border-b border-gray-100 border-r border-gray-300 bg-white"
        style={{ width: '14%' }}
      >
        <div className="flex flex-col">
          <button
            onClick={() => onTestClick?.(test)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left truncate"
            title={getDisplayId(test)}
          >
            {getDisplayId(test)}
          </button>
          {testSummary.isMultiple && (
            <div className="flex items-center gap-1 mt-1">
              <Package className="w-3 h-3 text-green-600 flex-shrink-0" />
              <span className="text-xs text-green-600 font-medium">
                Multiple
              </span>
            </div>
          )}
        </div>
      </td>
      <td 
        className="px-3 py-4 text-left border-b border-gray-100 border-r border-gray-300 bg-white"
        style={{ width: '16%' }}
      >
        <div className="flex flex-col">
          <div className="text-sm font-medium text-gray-900 truncate" title={test.name}>
            {test.name}
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate" title={test.mobileNo}>
            {test.mobileNo}
          </div>
        </div>
      </td>
      <td 
        className="px-3 py-4 text-left border-b border-gray-100 border-r border-gray-300 bg-white"
        style={{ width: '24%' }}
      >
        <div>
          {testSummary.isMultiple ? (
            <div>
              <div className="text-sm font-medium text-gray-900">
                {testSummary.testCount} Tests
              </div>
              <div className="text-xs text-gray-500 truncate mt-1" title={testSummary.testNames}>
                {testSummary.testNames}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-900 truncate" title={testSummary.testNames}>
              {testSummary.testNames}
            </div>
          )}
        </div>
      </td>
      <td 
        className="px-3 py-4 text-left border-b border-gray-100 border-r border-gray-300 bg-white"
        style={{ width: '10%' }}
      >
        <div className="text-sm font-semibold text-gray-900">
          ₹{testSummary.totalPrice}
          {test.isFree && (
            <div className="text-xs text-green-600 mt-1">(Free)</div>
          )}
        </div>
      </td>
      <td 
        className="px-3 py-4 text-left border-b border-gray-100 border-r border-gray-300 bg-white"
        style={{ width: '12%' }}
      >
        <StatusBadge status={test.paymentStatus} />
      </td>
      <td 
        className="px-3 py-4 text-left border-b border-gray-100 border-r border-gray-300 bg-white"
        style={{ width: '12%' }}
      >
        <StatusBadge status={test.vendorStatus} />
      </td>
      <td 
        className="px-3 py-4 text-left border-b border-gray-100 bg-white"
        style={{ width: '10.5%' }}
      >
        <StatusBadge status={test.reportStatus} />
      </td>
    </tr>
  );
});

// Perfect TestTable with Virtualization and Aligned Columns
// eslint-disable-next-line react/display-name
const TestTable = React.memo(({ tests, tabKey, showAll, onToggleShowAll, onTestClick, getTestSummary, getDisplayId }) => {
  const itemsPerPage = 10;
  const scrollContainerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [visibleItems, setVisibleItems] = useState(showAll ? tests : tests.slice(0, itemsPerPage));

  // Debounced resize handler
  const checkScreenSize = useCallback(
    debounce(() => {
      setIsMobile(window.innerWidth < 768);
    }, 100),
    []
  );

  useEffect(() => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => {
      checkScreenSize.cancel();
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [checkScreenSize]);

  // Update visible items based on showAll
  useEffect(() => {
    setVisibleItems(showAll ? tests : tests.slice(0, itemsPerPage));
  }, [showAll, tests, itemsPerPage]);

  // Handle scroll restoration
  useLayoutEffect(() => {
    if (scrollContainerRef.current && !isMobile) {
      const savedScroll = sessionStorage.getItem(`scrollPos_${tabKey}`);
      if (savedScroll) {
        scrollContainerRef.current.scrollTop = parseInt(savedScroll, 10);
      }
    }
  }, [tabKey, isMobile]);

  const handleToggleShowAll = useCallback(() => {
    onToggleShowAll(tabKey);
  }, [onToggleShowAll, tabKey]);

  // Mobile view with virtualization
  if (isMobile) {
    return (
      <div className="flex flex-col gap-4">
        {tests.length > 1000 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                Large dataset ({tests.length.toLocaleString()} records).
                {!showAll && ` Showing first ${itemsPerPage} entries.`}
              </span>
            </div>
          </div>
        )}

        <Virtuoso
          style={{ height: '500px' }}
          data={visibleItems}
          itemContent={(index, test) => (
            <div className="mb-3">
              <TestMobileCard
                key={test.id}
                test={test}
                onTestClick={onTestClick}
                getTestSummary={getTestSummary}
                getDisplayId={getDisplayId}
              />
            </div>
          )}
          components={{
            Footer: () =>
              tests.length > itemsPerPage ? (
                <div className="flex flex-col gap-2 p-4">
                  <div className="text-sm text-gray-600 text-center">
                    Showing {visibleItems.length} of {tests.length.toLocaleString()} entries
                  </div>
                  <button
                    onClick={handleToggleShowAll}
                    className="w-full px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {showAll ? "Show Less" : `Show All (${tests.length.toLocaleString()})`}
                  </button>
                </div>
              ) : null,
          }}
        />
      </div>
    );
  }

  // Perfect Desktop Table with Virtualization and Fixed Column Alignment
  return (
    <div className="flex flex-col gap-4">
      {tests.length > 1000 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              Large dataset ({tests.length.toLocaleString()} records).
              {!showAll && ` Showing first ${itemsPerPage} entries.`}
            </span>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* Fixed Header with Exact Column Widths */}
        <div className="bg-gray-100 border-b border-gray-200 sticky top-0 z-20">
          <table className="min-w-full" style={{ width: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300"
                  style={{ width: '14%' }}
                >
                  Booking ID
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300"
                  style={{ width: '16%' }}
                >
                  Patient
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300"
                  style={{ width: '24%' }}
                >
                  Tests
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300"
                  style={{ width: '10%' }}
                >
                  Amount
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300"
                  style={{ width: '12%' }}
                >
                  Payment
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300"
                  style={{ width: '12%' }}
                >
                  Vendor
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: '12%' }}
                >
                  Report
                </th>
              </tr>
            </thead>
          </table>
        </div>
        
        {/* Virtualized Table Body with Matching Column Widths */}
        <TableVirtuoso
          style={{ height: '550px' }}
          data={visibleItems}
          components={{
            Table: ({ style, ...props }) => (
              <table 
                {...props} 
                style={{ ...style, width: '100%', tableLayout: 'fixed' }}
                className="min-w-full"
              />
            ),
            // eslint-disable-next-line react/display-name
            TableBody: React.forwardRef(({ style, ...props }, ref) => (
              <tbody {...props} ref={ref} style={{ ...style }} className="bg-white divide-y divide-gray-200" />
            )),
          }}
          itemContent={(index, test) => (
            <TestTableRow
              key={`${test.id}-${index}`}
              test={test}
              index={index}
              onTestClick={onTestClick}
              getTestSummary={getTestSummary}
              getDisplayId={getDisplayId}
            />
          )}
        />
      </div>

      {tests.length > itemsPerPage && (
        <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
          <div className="text-sm text-gray-600">
            Showing {visibleItems.length} of {tests.length.toLocaleString()} entries
          </div>
          <button
            onClick={handleToggleShowAll}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            {showAll ? "Show Less" : `Show All (${tests.length.toLocaleString()})`}
          </button>
        </div>
      )}
    </div>
  );
});

const TestWorkflowStatus = ({ activeContext, onTestClick }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTabsVisible, setIsTabsVisible] = useState(true);
  const [showAllRecords, setShowAllRecords] = useState({});

  // Paginated Firebase fetch
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
    }, { onlyOnce: false });
    return () => off(testsRef, 'value', unsubscribe);
  }, []);

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

  const getDisplayId = useCallback((test) => {
    return test.masterBookingId || test.testCode || test.bookingId || 'N/A';
  }, []);

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

  const toggleShowAll = useCallback((tabKey) => {
    setShowAllRecords(prev => ({
      ...prev,
      [tabKey]: !prev[tabKey]
    }));
  }, []);

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
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Test Entry Workflow Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Test Entry Workflow Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
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
    <Card className="w-full shadow-sm border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b border-gray-200">
        <CardTitle className="text-xl text-gray-900 font-semibold">Test Entry Workflow Status</CardTitle>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTabsVisible(!isTabsVisible)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
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
      <CardContent className="p-6">
        {isTabsVisible && (
          <Tabs defaultValue={getDefaultTab()} className="w-full">
            <TabsList
              className="mb-6 grid w-full h-auto bg-gray-100 p-1 rounded-lg"
              style={{ gridTemplateColumns: `repeat(${getContextTabs().length}, 1fr)` }}
            >
              {getContextTabs().map((tabKey) => {
                const TabIcon = tabLabels[tabKey].icon;
                const stats = getSummaryStats(filterTests[tabKey]);
                return (
                  <TabsTrigger
                    key={tabKey}
                    value={tabKey}
                    className="flex flex-col items-center gap-1 p-3 min-h-[70px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <TabIcon className="w-4 h-4 flex-shrink-0 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900 text-center leading-tight">
                        {tabLabels[tabKey].label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 text-center leading-tight">
                      <span className="hidden md:inline">
                        ({stats.totalEntries.toLocaleString()} entries, {stats.totalTests.toLocaleString()} tests)
                      </span>
                      <span className="md:hidden">
                        ({stats.totalEntries.toLocaleString()})
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
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium">No {tabLabels[tabKey].label.toLowerCase()} found</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-2xl font-bold text-blue-800">{stats.totalEntries.toLocaleString()}</div>
                            <div className="text-xs text-blue-600 font-medium">Entries</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-2xl font-bold text-blue-800">{stats.totalTests.toLocaleString()}</div>
                            <div className="text-xs text-blue-600 font-medium">Total Tests</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-2xl font-bold text-blue-800">₹{stats.totalAmount.toLocaleString()}</div>
                            <div className="text-xs text-blue-600 font-medium">Total Amount</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-2xl font-bold text-blue-800">{stats.multipleTestEntries.toLocaleString()}</div>
                            <div className="text-xs text-blue-600 font-medium">Multi-Test Entries</div>
                          </div>
                        </div>
                      </div>

                      <TestTable
                        tests={filterTests[tabKey]}
                        tabKey={tabKey}
                        showAll={showAllRecords[tabKey]}
                        onToggleShowAll={toggleShowAll}
                        onTestClick={onTestClick}
                        getTestSummary={getTestSummary}
                        getDisplayId={getDisplayId}
                      />
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

