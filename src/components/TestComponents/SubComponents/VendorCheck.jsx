import React, { useState, useEffect } from "react";
import { database } from "../../../firebase/config";
import { ref, onValue, off, update } from "firebase/database";
import { User, FileText, AlertCircle, Users, CreditCard } from "lucide-react";
import TestSearch from "../TestSearch";
import TestWorkflowStatus from "../TestWorkflowStatus";
import { useAuth } from "../../../context/AuthContext";


export function VendorCheck() {
  const { currentUser } = useAuth();  // Add this line

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testData, setTestData] = useState(null);
  const [entryId, setEntryId] = useState(null);
  const [vendorBookingId, setVendorBookingId] = useState("");
  const [vendorStatus, setVendorStatus] = useState("not_completed");
  const [allTestEntries, setAllTestEntries] = useState([]);

  // Set up real-time listener for test entries
  useEffect(() => {
    const testEntriesRef = ref(database, "testEntries");
    
    const unsubscribe = onValue(testEntriesRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const entries = snapshot.val();
          const formattedEntries = Object.entries(entries)
            .map(([key, entry]) => ({
              id: key,
              ...entry,
            }))
            .sort((a, b) => 
              new Date(b.metadata?.createdAt || 0) - 
              new Date(a.metadata?.createdAt || 0)
            );
          
          setAllTestEntries(formattedEntries);

          // Update current test data if it exists
          if (entryId) {
            const updatedEntry = formattedEntries.find(entry => entry.id === entryId);
            if (updatedEntry) {
              setTestData(updatedEntry);
              setVendorStatus(updatedEntry.vendorStatus || "not_completed");
              setVendorBookingId(updatedEntry.vendorBookingId || "");
            }
          }
        } else {
          setAllTestEntries([]);
        }
      } catch (error) {
        console.error("Error processing test entries:", error);
      }
    }, (error) => {
      console.error("Error fetching test entries:", error);
    });

    // Cleanup function
    return () => {
      off(testEntriesRef, 'value', unsubscribe);
    };
  }, [entryId]); // Include entryId in dependencies to update current test data

  const handleSearch = async (searchCode) => {
    if (!searchCode.trim()) {
      setError("Please enter a test code");
      return;
    }

    setLoading(true);
    setError("");

    const matchingEntry = allTestEntries.find(
      (entry) =>
        entry.testCode &&
        entry.testCode.toUpperCase() === searchCode.toUpperCase()
    );

    if (matchingEntry) {
      setTestData(matchingEntry);
      setEntryId(matchingEntry.id);
      setVendorStatus(matchingEntry.vendorStatus || "not_completed");
      setVendorBookingId(matchingEntry.vendorBookingId || "");
    } else {
      setError("No entry found with this test code");
      setTestData(null);
      setEntryId(null);
    }

    setLoading(false);
  };

  const handleSearchResultSelect = (entry) => {
    setTestData(entry);
    setEntryId(entry.id);
    setVendorStatus(entry.vendorStatus || "not_completed");
    setVendorBookingId(entry.vendorBookingId || "");
  };
  const handleTestClick = (test) => {
    setTestData(test);
    setEntryId(test.id);
    setVendorStatus(test.vendorStatus || "not_completed");
    setVendorBookingId(test.vendorBookingId || "");
    setError(""); // Clear any existing errors
  };

  const handleVendorUpdate = async () => {
    if (!entryId) return;
    if (!testData.paymentStatus || testData.paymentStatus !== "completed") {
      setError("Cannot update vendor status until payment is completed");
      return;
    }
    if (vendorStatus === "completed" && !vendorBookingId.trim()) {
      setError("Please enter vendor booking ID");
      return;
    }
  
    setLoading(true);
    setError("");
  
    try {
      const entryRef = ref(database, `testEntries/${entryId}`);
      const now = new Date().toISOString();
      
      const updates = {
        vendorStatus,
        ...(vendorStatus === "completed" && { vendorBookingId }),
        metadata: {
          ...testData.metadata,
          lastModified: now,
          vendorStatusUpdatedAt: now,
          vendorStatusUpdatedBy: currentUser.email,
        },
      };
  
      await update(entryRef, updates);
      alert("Vendor status updated successfully!");
    } catch (error) {
      setError("Failed to update vendor status: " + error.message);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTestData(null);
    setEntryId(null);
    setVendorBookingId("");
    setVendorStatus("not_completed");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-white px-8 py-8">
      <div className="max-w-8xl mx-auto">
      <div className="mb-4">
          <TestWorkflowStatus 
            activeContext="vendor-check" 
            onTestClick={handleTestClick}
          />
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold text-white">Vendor Check</h2>

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
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Payment Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Payment Mode</p>
                    <p className="font-medium capitalize">
                      {testData.paymentMode || "Not Set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Reference</p>
                    <p className="font-medium">
                      {testData.paymentReference || "Not Set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <p
                      className={`font-medium capitalize ${
                        testData.paymentStatus === "completed"
                          ? "text-green-600"
                          : testData.paymentStatus === "failed"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {testData.paymentStatus || "Pending"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vendor Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Vendor Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={vendorStatus}
                    onChange={(e) => setVendorStatus(e.target.value)}
                    className="rounded-lg border-gray-300"
                    disabled={
                      testData.vendorStatus === "completed" ||
                      testData.paymentStatus !== "completed"
                    }
                  >
                    <option value="not_completed">Not Completed</option>
                    <option value="completed">Completed</option>
                  </select>

                  {vendorStatus === "completed" && (
                    <input
                      type="text"
                      value={vendorBookingId}
                      onChange={(e) => setVendorBookingId(e.target.value)}
                      placeholder="Enter Vendor Booking ID"
                      className="rounded-lg border-gray-300"
                      disabled={
                        testData.vendorStatus === "completed" ||
                        testData.paymentStatus !== "completed"
                      }
                      required
                    />
                  )}
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
                {testData.vendorStatus !== "completed" &&
                  testData.paymentStatus === "completed" && (
                    <button
                      onClick={handleVendorUpdate}
                      disabled={loading}
                      className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Update Vendor Status"}
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

export default VendorCheck;
