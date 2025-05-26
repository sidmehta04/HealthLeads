import React, { useState, useEffect } from "react";
import { database } from "../../firebase/config";
import { ref, onValue, off, update } from "firebase/database";
import {
  Search,
  User,
  FileText,
  AlertCircle,
  Users,
  ClipboardCheck,
} from "lucide-react";
import TestSearch from "./TestSearch";
import TestWorkflowStatus from "./TestWorkflowStatus";
import { useAuth } from "../../context/AuthContext";

export function ReportStatus() {
  const [searchTestCode, setSearchTestCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testData, setTestData] = useState(null);
  const [entryId, setEntryId] = useState(null);
  const [reportStatus, setReportStatus] = useState("not_submitted");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [allTestEntries, setAllTestEntries] = useState([]);
  const {currentUser} = useAuth();

  // Set up real-time listener for test entries
  useEffect(() => {
    const testEntriesRef = ref(database, "testEntries");

    const unsubscribe = onValue(
      testEntriesRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const entries = snapshot.val();
            const formattedEntries = Object.entries(entries)
              .map(([key, entry]) => ({
                id: key,
                ...entry,
              }))
              .sort(
                (a, b) =>
                  new Date(b.metadata?.createdAt || 0) -
                  new Date(a.metadata?.createdAt || 0)
              );

            setAllTestEntries(formattedEntries);

            // Update current test data if it exists
            if (entryId) {
              const updatedEntry = formattedEntries.find(
                (entry) => entry.id === entryId
              );
              if (updatedEntry) {
                setTestData(updatedEntry);
                setReportStatus(updatedEntry.reportStatus || "not_submitted");
              }
            }
          } else {
            setAllTestEntries([]);
          }
        } catch (error) {
          console.error("Error processing test entries:", error);
        }
      },
      (error) => {
        console.error("Error fetching test entries:", error);
      }
    );

    // Cleanup function
    return () => {
      off(testEntriesRef, "value", unsubscribe);
    };
  }, [entryId]); // Include entryId in dependencies to update current test data

  // Update search results when search code or entries change
  useEffect(() => {
    if (searchTestCode.trim()) {
      const filtered = allTestEntries.filter(
        (entry) =>
          (entry.testCode &&
            entry.testCode
              .toLowerCase()
              .includes(searchTestCode.toLowerCase())) ||
          (entry.name &&
            entry.name.toLowerCase().includes(searchTestCode.toLowerCase())) ||
          (entry.bookingId &&
            entry.bookingId
              .toLowerCase()
              .includes(searchTestCode.toLowerCase()))
      );
      setSearchResults(filtered.slice(0, 5));
      setIsDropdownOpen(true);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  }, [searchTestCode, allTestEntries]);
  // Add new handler for test clicks from TestWorkflowStatus
  const handleTestClick = (test) => {
    setSearchTestCode(test.testCode);
    setTestData(test);
    setEntryId(test.id);
    setReportStatus(test.reportStatus || "not_submitted");
    setIsDropdownOpen(false);
    setError(""); // Clear any existing errors
  };

  const handleSearchResultSelect = (entry) => {
    setSearchTestCode(entry.testCode);
    setTestData(entry);
    setEntryId(entry.id);
    setReportStatus(entry.reportStatus || "not_submitted");
    setIsDropdownOpen(false);
  };

  const handleSearch = () => {
    if (!searchTestCode.trim()) {
      setError("Please enter a test code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const matchingEntry = allTestEntries.find(
        (entry) =>
          entry.testCode &&
          entry.testCode.toUpperCase() === searchTestCode.toUpperCase()
      );

      if (matchingEntry) {
        setTestData(matchingEntry);
        setEntryId(matchingEntry.id);
        setReportStatus(matchingEntry.reportStatus || "not_submitted");
      } else {
        setError("No entry found with this test code");
        setTestData(null);
        setEntryId(null);
      }
    } catch (error) {
      setError("Error searching for test entry: " + error.message);
    }

    setLoading(false);
  };

  const handleReportUpdate = async () => {
    if (!entryId) return;
    if (!testData.vendorStatus || testData.vendorStatus !== "completed") {
      setError("Cannot update report status until vendor check is completed");
      return;
    }
  
    setLoading(true);
    setError("");
  
    try {
      const entryRef = ref(database, `testEntries/${entryId}`);
      const now = new Date().toISOString();
      
      const updates = {
        reportStatus,
        metadata: {
          ...testData.metadata,
          lastModified: now,
          reportStatusUpdatedAt: now,
          reportStatusUpdatedBy: currentUser.email,
        },
      };
  
      await update(entryRef, updates);
      alert("Report status updated successfully!");
    } catch (error) {
      setError("Failed to update report status: " + error.message);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setSearchTestCode("");
    setTestData(null);
    setEntryId(null);
    setReportStatus("not_submitted");
    setError("");
    setIsDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-white px-8 py-8 ">
      <div className="max-w-10xl mx-auto">
        <div className="mb-4">
          <TestWorkflowStatus
            activeContext="report-status"
            onTestClick={handleTestClick}
          />
        </div>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 ">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold text-white">Report Status</h2>

              <TestSearch
                testEntries={allTestEntries}
                onSearch={handleSearch}
                onSelect={handleSearchResultSelect}
                loading={loading}
              />
            </div>
          </div>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {error && (
            <div className="mx-6 mt-6 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {testData && (
            <div className="p-6 space-y-8">
              {/* Patient Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Patient Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{testData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mobile</p>
                    <p className="font-medium">{testData.mobileNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-medium">{testData.age}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium">{testData.gender}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{testData.address}</p>
                  </div>
                </div>
              </div>

              {/* Partner Details */}
              {testData.hasPartner && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Partner Details</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Partner Name</p>
                      <p className="font-medium">{testData.partnerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Partner Reference ID
                      </p>
                      <p className="font-medium">
                        {testData.partnerReferenceId}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Test Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Test Name</p>
                    <p className="font-medium">{testData.testName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Test Code</p>
                    <p className="font-medium">{testData.testCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Booking ID</p>
                    <p className="font-medium">{testData.bookingId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-medium">₹{testData.price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vendor Status</p>
                    <p className="font-medium capitalize">
                      {testData.vendorStatus || "Not Completed"}
                    </p>
                  </div>
                  {testData.vendorBookingId && (
                    <div>
                      <p className="text-sm text-gray-600">Vendor Booking ID</p>
                      <p className="font-medium">{testData.vendorBookingId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Report Status */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Report Status</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <select
                    value={reportStatus}
                    onChange={(e) => setReportStatus(e.target.value)}
                    className="rounded-lg border-gray-300"
                    disabled={
                      testData.reportStatus === "submitted" ||
                      !testData.vendorStatus ||
                      testData.vendorStatus !== "completed"
                    }
                  >
                    <option value="not_submitted">Not Sent</option>
                    <option value="submitted">Sent</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Clear
                </button>
                {(!testData.reportStatus ||
                  testData.reportStatus !== "submitted") &&
                  testData.vendorStatus === "completed" && (
                    <button
                      onClick={handleReportUpdate}
                      disabled={loading}
                      className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Update Report Status"}
                    </button>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportStatus;
