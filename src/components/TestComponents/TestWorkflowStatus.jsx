// TestWorkflowStatus.jsx
import React, { useState, useEffect } from "react";
import { database } from "../../firebase/config";
import { ref, onValue, off } from "firebase/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, FileText, CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { StatusBadge, UserActivityInfo, formatDateTime } from "./SubComponents/TestActivityStatus";

const TestWorkflowStatus = ({ activeContext, onTestClick }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTabsVisible, setIsTabsVisible] = useState(true);
  const [showAllRecords, setShowAllRecords] = useState(false);

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

  const filterTests = {
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

  const TestTable = ({ tests }) => {
    const displayTests = showAllRecords ? tests : tests.slice(0, 5);
    return (
      <div className="flex flex-col gap-4">
        <div className="relative rounded-md shadow">
          <div className="overflow-y-auto max-h-96">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onTestClick?.(test)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {test.testCode}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {test.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{test.mobileNo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={test.paymentStatus} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={test.vendorStatus} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={test.reportStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {tests.length > 5 && (
          <button
            onClick={() => setShowAllRecords(!showAllRecords)}
            className="self-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {showAllRecords ? "Show Less" : `Show All (${tests.length})`}
          </button>
        )}
      </div>
    );
  };

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
                return (
                  <TabsTrigger
                    key={tabKey}
                    value={tabKey}
                    className="flex items-center gap-2"
                  >
                    <TabIcon className="w-4 h-4" />
                    {tabLabels[tabKey].label} ({filterTests[tabKey].length})
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {getContextTabs().map((tabKey) => (
              <TabsContent key={tabKey} value={tabKey}>
                {filterTests[tabKey].length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No {tabLabels[tabKey].label.toLowerCase()} test entries found
                  </div>
                ) : (
                  <TestTable tests={filterTests[tabKey]} />
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default TestWorkflowStatus;