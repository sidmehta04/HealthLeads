import React, { useState, useEffect } from "react";
import { database } from "../../firebase/config";
import { ref, push, onValue, update, off } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Calendar,
  CreditCard,
  Users,
  Eye,
  ChevronDown,
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import TestSearch from "./TestSearch";
import StateSelect from "../HealthCampComponents/SubComponents/ComboBox";
import TestWorkflowStatus from "./TestWorkflowStatus";
import TEST_CATALOG from "./SubComponents/Tests";
import TestNameSearch from "./TestNameSearch";
import { partners } from "./SubComponents/Tests";

// const TEST_CATALOG = {
//   CBC: { price: 500, code: "CBC" },
//   "Lipid Profile": { price: 800, code: "LIP" },
//   "Blood Sugar": { price: 300, code: "BST" },
// };

export function TestEntryForm() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTestCode, setSearchTestCode] = useState("");
  const [entryId, setEntryId] = useState(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewOnlyMode, setViewOnlyMode] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
  const [searchPartner, setSearchPartner] = useState("");

  // Add this with your other useEffect hooks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".partner-dropdown")) {
        setIsPartnerDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add this handler function alongside your other handlers
  const handlePartnerSelect = (selectedPartner) => {
    setFormData((prev) => ({
      ...prev,
      partnerName: selectedPartner,
    }));
    setSearchPartner(selectedPartner);
    setIsPartnerDropdownOpen(false);
  };

  // New state for storing all test entries
  const [allTestEntries, setAllTestEntries] = useState([]);

  useEffect(() => {
    const testEntriesRef = ref(database, "testEntries");

    // Set up real-time listener
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

    // Cleanup function to remove the listener
    return () => {
      off(testEntriesRef, "value", unsubscribe);
    };
  }, []);

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
      setSearchResults(filtered.slice(0, 5)); // Limit to top 5 results
      setIsDropdownOpen(true);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  }, [searchTestCode, allTestEntries]);
  const handleTestClick = (test) => {
    // Update to handle tests array instead of single test
    setFormData({
      ...test,
      tests: test.tests || [], // Ensure tests is an array
    });
    setEntryId(test.id);
    setSearchTestCode(test.testCode);
    setIsDropdownOpen(false);

    if (test.paymentStatus === "completed") {
      setViewOnlyMode(true);
      setEditMode(false);
    } else {
      setEditMode(true);
      setViewOnlyMode(false);
    }

    setIsSearchMode(false);
  };

  const generateUniqueTestCode = (testName) => {
    const testCode = TEST_CATALOG[testName]?.code || "TEST";
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 5);
    return `${testCode}-${timestamp}-${randomStr}`.toUpperCase();
  };

  const initialFormState = {
    name: "",
    mobileNo: "",
    age: "",
    gender: "",
    district: "",
    state: "",
    pincode: "",
    city: "",
    address: "",
    tests: [], // Change from single test to array of tests
    totalPrice: 0, // Add total price calculation

    hasPartner: false,
    partnerName: "",
    partnerReferenceId: "",
    paymentMode: "",
    paymentReference: "",
    paymentStatus: "pending",
    isFree: false, // Add new state for free/paid selection
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleTestSelection = (testName) => {
    if (!editMode && !viewOnlyMode) {
      const testCode = generateUniqueTestCode(testName);
      const newTest = {
        testName,
        testCode,
        price: TEST_CATALOG[testName]?.price || 0,
        bookingId: `BK-${testCode}`,
      };

      setFormData((prev) => {
        const updatedTests = [...prev.tests, newTest];
        const totalPrice = updatedTests.reduce(
          (sum, test) => sum + (test.price || 0),
          0
        );

        return {
          ...prev,
          tests: updatedTests,
          totalPrice,
        };
      });
    }
  };
  const handleRemoveTest = (indexToRemove) => {
    if (!editMode && !viewOnlyMode) {
      setFormData((prev) => {
        const updatedTests = prev.tests.filter(
          (_, index) => index !== indexToRemove
        );
        const totalPrice = updatedTests.reduce(
          (sum, test) => sum + (test.price || 0),
          0
        );

        return {
          ...prev,
          tests: updatedTests,
          totalPrice,
        };
      });
    }
  };

  const handleSearchResultSelect = (entry) => {
    setFormData(entry);
    setEntryId(entry.id);
    setSearchTestCode(entry.testCode);
    setIsDropdownOpen(false);

    if (entry.paymentStatus === "completed") {
      setViewOnlyMode(true);
      setEditMode(false);
    } else {
      setEditMode(true);
      setViewOnlyMode(false);
    }

    setIsSearchMode(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (viewOnlyMode) return;

    if (
      editMode &&
      !["paymentMode", "paymentReference", "paymentStatus", "isFree"].includes(
        name
      )
    ) {
      return;
    }

    if (name === "hasPartner") {
      setFormData((prev) => ({
        ...prev,
        hasPartner: checked,
        partnerName: "",
        partnerReferenceId: "",
      }));
    } else if (name === "isFree") {
      setFormData((prev) => ({
        ...prev,
        isFree: checked,
        paymentMode: checked ? "free" : "",
        paymentStatus: checked ? "completed" : "pending",
        paymentReference: checked ? "FREE" : "",
      }));
    } else if (name === "paymentMode") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        // If switching to cash, set reference to "N/A"
        // If switching to prepaid, clear the reference
        paymentReference:
          value === "cash"
            ? "N/A"
            : value === "upi"
            ? ""
            : prev.paymentReference,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  const handleSearch = async () => {
    if (!searchTestCode.trim()) {
      setError("Please enter a test code to search");
      return;
    }

    setLoading(true);
    setError("");

    const matchingEntry = allTestEntries.find(
      (entry) =>
        entry.testCode &&
        entry.testCode.toUpperCase() === searchTestCode.toUpperCase()
    );

    if (matchingEntry) {
      setFormData(matchingEntry);
      setEntryId(matchingEntry.id);

      if (matchingEntry.paymentStatus === "completed") {
        setViewOnlyMode(true);
        setEditMode(false);
      } else {
        setEditMode(true);
        setViewOnlyMode(false);
      }

      setIsSearchMode(false);
    } else {
      setError("No entry found with this test code");
    }

    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (editMode) {
        // Update existing entry - only payment details can be modified
        const entryRef = ref(database, `testEntries/${entryId}`);
        const updates = {
          paymentMode: formData.paymentMode,
          paymentReference: formData.paymentReference,
          paymentStatus: formData.paymentStatus,
          isFree: formData.isFree,
          metadata: {
            ...formData.metadata,
            lastModified: new Date().toISOString(),
          },
        };

        await update(entryRef, updates);
        alert("Payment details updated successfully!");

        if (formData.paymentStatus === "completed") {
          setViewOnlyMode(true);
          setEditMode(false);
        }
      } else {
        // Create new entry
        const requiredFields = ["name", "mobileNo", "age", "gender", "address"];

        const missingFields = requiredFields.filter(
          (field) => !formData[field]
        );

        // Check if at least one test is selected
        if (!formData.tests || formData.tests.length === 0) {
          setError("Please select at least one test");
          setLoading(false);
          return;
        }

        if (missingFields.length > 0) {
          setError(
            `Please fill in all required fields: ${missingFields.join(", ")}`
          );
          setLoading(false);
          return;
        }

        // Validate payment details if not free
        if (!formData.isFree) {
          if (!formData.paymentMode) {
            setError("Please select a payment mode");
            setLoading(false);
            return;
          }

          if (!formData.paymentReference) {
            setError("Please enter payment reference");
            setLoading(false);
            return;
          }

          if (!formData.paymentStatus) {
            setError("Please select payment status");
            setLoading(false);
            return;
          }
        }

        // Generate a master booking ID for the entire entry
        const masterBookingId = `BK-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .substring(2, 5)}`.toUpperCase();

        // Prepare the entry data
        const entryData = {
          // Patient details
          name: formData.name,
          mobileNo: formData.mobileNo,
          age: formData.age,
          gender: formData.gender,
          district: formData.district,
          state: formData.state,
          pincode: formData.pincode,
          city: formData.city,
          address: formData.address,

          // Multiple tests data
          tests: formData.tests,
          totalPrice: formData.totalPrice,
          testCount: formData.tests.length,

          // Master booking reference
          masterBookingId: masterBookingId,

          // Individual test codes for search purposes
          testCodes: formData.tests.map((test) => test.testCode),
          testNames: formData.tests.map((test) => test.testName),

          // Partner details
          hasPartner: formData.hasPartner,
          partnerName: formData.hasPartner ? formData.partnerName : "",
          partnerReferenceId: formData.hasPartner
            ? formData.partnerReferenceId
            : "",

          // Payment details
          isFree: formData.isFree,
          paymentMode: formData.isFree ? "free" : formData.paymentMode,
          paymentReference: formData.isFree
            ? "FREE"
            : formData.paymentReference,
          paymentStatus: formData.isFree ? "completed" : formData.paymentStatus,

          // Submission metadata
          submitter: {
            email: currentUser.email,
            uid: currentUser.uid,
            submittedAt: new Date().toISOString(),
          },
          metadata: {
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            status: "active",
            entryType: "multiple_tests",
          },
        };

        // Submit to Firebase
        const newEntryRef = ref(database, "testEntries");
        await push(newEntryRef, entryData);

        // Show success message with details
        const testsList = formData.tests
          .map((test) => test.testName)
          .join(", ");
        alert(
          `Test entry submitted successfully!\n\n` +
            `Master Booking ID: ${masterBookingId}\n` +
            `Tests: ${testsList}\n` +
            `Total Amount: ₹${formData.totalPrice}\n` +
            `Payment Status: ${
              formData.isFree ? "Free" : formData.paymentStatus
            }`
        );
      }

      // Reset form and navigate if not in view mode
      if (!viewOnlyMode) {
        resetForm();
        navigate("/individual-health-camp");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setError(
        `Failed to ${editMode ? "update" : "submit"} data: ${error.message}`
      );
    }

    setLoading(false);
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEntryId(null);
    setEditMode(false);
    setViewOnlyMode(false);
    setIsSearchMode(false);
    setSearchTestCode("");
    setError("");
    setIsDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-white py-12 px-4 sm:px-6">
      <div className="max-w-9xl mx-auto">
        <div className="mb-8">
          <TestWorkflowStatus
            activeContext="test-entry"
            onTestClick={handleTestClick}
          />
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-3">
              {viewOnlyMode ? (
                <Eye className="w-7 h-7 text-blue-100" />
              ) : editMode ? (
                <FileText className="w-7 h-7 text-blue-100" />
              ) : (
                <User className="w-7 h-7 text-blue-100" />
              )}
              <h2 className="text-3xl font-bold text-white">
                {viewOnlyMode
                  ? "View Test Entry"
                  : editMode
                  ? "Edit Payment Details"
                  : "Test Entry Form"}
              </h2>
            </div>

            {!editMode && !viewOnlyMode && (
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsSearchMode(!isSearchMode)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors duration-200 w-full md:w-auto justify-center"
                >
                  {isSearchMode ? (
                    <>
                      <FileText className="w-5 h-5" />
                      New Entry
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Search Entry
                    </>
                  )}
                </button>
                {isSearchMode && (
                  <TestSearch
                    testEntries={allTestEntries}
                    onSearch={handleSearch}
                    onSelect={handleSearchResultSelect}
                    loading={loading}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Enhanced Header */}

          {/* Error Message */}
          {error && (
            <div className="mx-8 mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-10">
            {/* Patient Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">
                  Patient Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter patient's full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full  border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={editMode || viewOnlyMode}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobileNo"
                    placeholder="Enter mobile number"
                    value={formData.mobileNo}
                    onChange={handleChange}
                    className="w-full h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={editMode || viewOnlyMode}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    placeholder="Enter age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={editMode || viewOnlyMode}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={editMode || viewOnlyMode}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    name="address"
                    placeholder="Enter complete address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    disabled={editMode || viewOnlyMode}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={editMode || viewOnlyMode}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    District
                  </label>
                  <input
                    type="text"
                    name="district"
                    placeholder="Enter district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={editMode || viewOnlyMode}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    State
                  </label>
                  <StateSelect
                    value={formData.state}
                    onChange={(value) => {
                      handleChange({
                        target: {
                          name: "state",
                          value: value,
                        },
                      });
                    }}
                    disabled={editMode || viewOnlyMode}
                    error={false}
                    className={`w-full ${
                      editMode || viewOnlyMode ? "bg-gray-50" : ""
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    placeholder="Enter 6-digit pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    maxLength="6"
                    pattern="[0-9]{6}"
                    disabled={editMode || viewOnlyMode}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Test Details Section */}
            {/* Test Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">
                  Test Details
                </h3>
              </div>

              {/* Test Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Add Test
                </label>
                <TestNameSearch
                  testCatalog={TEST_CATALOG}
                  onTestSelect={handleTestSelection}
                  disabled={editMode || viewOnlyMode}
                  value="" // Keep empty for multiple selections
                />
              </div>

              {/* Selected Tests Display */}
              {formData.tests.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-800">
                    Selected Tests:
                  </h4>
                  {formData.tests.map((test, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="grid grid-cols-3 gap-4 flex-1">
                        <div>
                          <span className="text-sm text-gray-600">
                            Test Name:
                          </span>
                          <p className="font-medium">{test.testName}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">
                            Test Code:
                          </span>
                          <p className="font-medium">{test.testCode}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Price:</span>
                          <p className="font-medium">₹{test.price}</p>
                        </div>
                      </div>
                      {!editMode && !viewOnlyMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTest(index)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Total Price Display */}
                  <div className="flex justify-end">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                      <span className="text-lg font-semibold text-blue-800">
                        Total: ₹{formData.totalPrice}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Partner Details Section */}
            {!viewOnlyMode && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Partner Details
                    </h3>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        name="hasPartner"
                        checked={formData.hasPartner}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={editMode || viewOnlyMode}
                      />
                      Include Partner Details
                    </label>
                  </div>
                </div>

                {formData.hasPartner && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 relative partner-dropdown">
                      <label className="text-sm font-medium text-gray-700">
                        Partner Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="partnerName"
                          placeholder="Search partner..."
                          value={searchPartner}
                          onChange={(e) => {
                            setSearchPartner(e.target.value);
                            setIsPartnerDropdownOpen(true);
                          }}
                          onClick={() => setIsPartnerDropdownOpen(true)}
                          className="w-full h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                          disabled={editMode || viewOnlyMode}
                        />
                        <ChevronDown
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer"
                          onClick={() =>
                            setIsPartnerDropdownOpen(!isPartnerDropdownOpen)
                          }
                        />
                      </div>

                      {isPartnerDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {partners
                            .filter((partner) =>
                              partner
                                .toLowerCase()
                                .includes(searchPartner.toLowerCase())
                            )
                            .map((partner, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 cursor-pointer hover:bg-gray-50"
                                onClick={() => handlePartnerSelect(partner)}
                              >
                                {partner}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Subscription ID
                      </label>
                      <input
                        type="text"
                        name="partnerReferenceId"
                        placeholder="Enter reference ID"
                        value={formData.partnerReferenceId}
                        onChange={handleChange}
                        className="w-full h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        disabled={editMode || viewOnlyMode}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">
                  Payment Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free/Paid Selection */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isFree"
                        checked={formData.isFree}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={
                          viewOnlyMode || (editMode && !formData.isFree)
                        }
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Free Test
                      </span>
                    </label>
                    {editMode && !formData.isFree && (
                      <span className="text-sm text-gray-500 italic">
                        (Cannot change to free after paid entry submission)
                      </span>
                    )}
                  </div>
                </div>

                {!formData.isFree && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Payment Mode
                      </label>
                      <select
                        name="paymentMode"
                        value={formData.paymentMode}
                        onChange={handleChange}
                        className="w-full h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        disabled={viewOnlyMode || formData.isFree}
                      >
                        <option value="">Select Payment Mode</option>
                        <option value="cash">Cash</option>
                        <option value="upi">PrePaid</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Payment Reference
                      </label>
                      <input
                        type="text"
                        name="paymentReference"
                        placeholder="Enter payment reference"
                        value={formData.paymentReference}
                        onChange={handleChange}
                        className="w-full h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        disabled={viewOnlyMode || formData.isFree}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Payment Status
                      </label>
                      <select
                        name="paymentStatus"
                        value={formData.paymentStatus}
                        onChange={handleChange}
                        className="w-full h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        disabled={viewOnlyMode || formData.isFree}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Payment Status Badge */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Current Status:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              ${
                formData.paymentStatus === "completed"
                  ? "bg-green-100 text-green-700"
                  : formData.paymentStatus === "failed"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
                    >
                      {formData.paymentStatus === "completed" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : formData.paymentStatus === "failed" ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {formData.paymentStatus.charAt(0).toUpperCase() +
                        formData.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Controls */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-8 border-t border-gray-200">
              {!viewOnlyMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                >
                  {editMode ? "New Entry" : "Reset Form"}
                </button>
              )}
              {!viewOnlyMode && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Processing...
                    </>
                  ) : editMode ? (
                    "Update Payment"
                  ) : (
                    "Submit Entry"
                  )}
                </button>
              )}
              {viewOnlyMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  New Entry
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TestEntryForm;
