import React, { useState } from "react";
import { database } from "../../firebase/config";
import { ref, update, get } from "firebase/database";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CampSearch from "./SubComponents/CampSearch";
import CampStatusView from "./IncompleteCamps";

const ClosedCamp = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [campFound, setCampFound] = useState(false);
  const [reportStatusUpdated, setReportStatusUpdated] = useState(false);
  const [campKey, setCampKey] = useState(null);
  const [isCampCompleted, setIsCampCompleted] = useState(false);

  const [formData, setFormData] = useState({
    // Camp Details (All read-only)
    campCode: "",
    date: "",
    clinicCode: "",
    address: "",
    district: "",
    state: "",
    pinCode: "",
    
    // Staff Details
    nurseName: "",
    mobileNo: "",
    teamLeader: "",
    dcName: "",
    agentName: "",
    roName: "",
    somName: "",
    
    completedBy: "",
    completedAt: "",
    status: "",
  
    // Financial Details (read-only)
    totalConversions: "",
    totalSales: "",
    marketingExpense: "",
    operationalExpense: "",
  
    // Phlebotomist Details (read-only)
    phleboName: "",
    phleboMobileNo: "",
  
    // Report Status (editable if not updated and camp is completed)
    reportStatus: "",
  });
  const resetForm = () => {
    setFormData({
      campCode: "",
      date: "",
      clinicCode: "",
      address: "",
      district: "",
      state: "",
      pinCode: "",
      nurseName: "",
      mobileNo: "",
      teamLeader: "",
      dcName: "",
      agentName: "",
      roName: "",
      somName: "",
      completedBy: "",
      completedAt: "",
      status: "",
      totalConversions: "",
      totalSales: "",
      marketingExpense: "",
      operationalExpense: "",
      phleboName: "",
      phleboMobileNo: "",
      reportStatus: "",
    });
    setCampFound(false);
    setReportStatusUpdated(false);
    setCampKey(null);
    setIsCampCompleted(false);
    setError("");
    setLoading(false);
  };
  
  const handleBackToDashboard = () => {
    resetForm();
    navigate("/health-camp");
  };
  const handleCampCodeClick = (campCode) => {
    setFormData((prev) => ({ ...prev, campCode }));
    // Reset form state
    setCampFound(false);
    setReportStatusUpdated(false);
    setIsCampCompleted(false);
    setError("");

    // Find and load camp data
    const fetchCampData = async () => {
      setLoading(true);
      try {
        const campsRef = ref(database, "healthCamps");
        const snapshot = await get(campsRef);

        if (snapshot.exists()) {
          const camps = Object.entries(snapshot.val());
          const [key, camp] =
            camps.find(
              ([_, camp]) =>
                camp.campCode?.toUpperCase() === campCode.toUpperCase()
            ) || [];

          if (camp) {
            handleCampFound(key, camp);
          } else {
            handleError("Camp not found");
          }
        }
      } catch (err) {
        handleError("Error fetching camp data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCampData();
  };

  const handleCampFound = (key, camp) => {
    // Reset the form data before setting new data
    setFormData((prev) => ({
      ...prev,
      // Reset all fields to empty strings
      campCode: camp.campCode, // Keep the new camp code
      date: "",
      clinicCode: "",
      address: "",
      district: "",
      state: "",
      pinCode: "",
      nurseName: "",
      mobileNo: "",
      tl: "",
      tlEmpId: "",
      dcName: "",
      dcEmpId: "",
      completedBy: "",
      completedAt: "",
      status: "",
      totalConversions: "",
      totalSales: "",
      marketingExpense: "",
      operationalExpense: "",
      phleboName: "",
      phleboMobileNo: "",
      reportStatus: "",
    }));

    setCampKey(key);
    setCampFound(true);
    setReportStatusUpdated(!!camp.reportStatus);
    setIsCampCompleted(camp.status === "completed");

    // Handle backward compatibility - if testDone exists but not totalConversions or totalSales
    const updatedCamp = { ...camp };
    if (updatedCamp.testDone && (!updatedCamp.totalConversions && !updatedCamp.totalSales)) {
      updatedCamp.totalConversions = updatedCamp.testDone;
      updatedCamp.totalSales = updatedCamp.testDone;
    }

    // Set the new camp data after reset
    setFormData((prev) => ({
      ...prev,
      ...updatedCamp,
    }));

    setError("");

    // Validate if camp is not completed
    if (camp.status !== "completed") {
      setError("Cannot update report status: Camp is not completed yet");
    }
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setCampFound(false);
    setIsCampCompleted(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (!reportStatusUpdated && isCampCompleted) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCampCodeChange = (value) => {
    setFormData((prev) => ({ ...prev, campCode: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reportStatusUpdated || !isCampCompleted) return;

    setLoading(true);
    try {
      // Validate camp completion status before update
      if (formData.status !== "completed") {
        throw new Error(
          "Cannot update report status: Camp must be completed first"
        );
      }

      const updates = {
        reportStatus: formData.reportStatus,
        reportStatusUpdatedBy: currentUser.email,
        reportStatusUpdatedAt: new Date().toISOString(),
      };

      const campRef = ref(database, `healthCamps/${campKey}`);
      await update(campRef, updates);

      alert("Report status updated successfully!");
      setReportStatusUpdated(true);
    } catch (err) {
      setError("Failed to update report status: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Update CampStatusView implementation */}
      <CampStatusView
        activeContext="close"
        onCampCodeClick={handleCampCodeClick}
      />

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Search Camp</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Camp Code
            {campFound && (
              <span
                className={`ml-2 text-xs ${
                  reportStatusUpdated
                    ? "text-orange-600"
                    : isCampCompleted
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
                {reportStatusUpdated
                  ? "✓ Report Status Already Updated"
                  : isCampCompleted
                  ? "✓ Camp Found (Completed)"
                  : "⚠ Camp Found (Not Completed)"}
              </span>
            )}
          </label>
          <CampSearch
            value={formData.campCode}
            onChange={handleCampCodeChange}
            onCampFound={handleCampFound}
            onError={handleError}
            onLoading={setLoading}
          />
        </div>
      </div>
      {campFound && (
        <>
          {/* Camp Details Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Camp Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="text"
                  value={formData.date}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Clinic Code
                </label>
                <input
                  type="text"
                  value={formData.clinicCode}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={formData.mobileNo}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  District
                </label>
                <input
                  type="text"
                  value={formData.district}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pin Code
                </label>
                <input
                  type="text"
                  value={formData.pinCode}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Staff Details Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Staff Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nurse Name
                </label>
                <input
                  type="text"
                  value={formData.nurseName}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
            
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Team Leader
                </label>
                <input
                  type="text"
                  value={formData.teamLeader}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Agent
                </label>
                <input
                  type="text"
                  value={formData.agentName}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  DC Name
                </label>
                <input
                  type="text"
                  value={formData.dcName}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SOM
                </label>
                <input
                  type="text"
                  value={formData.somName}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  RO
                </label>
                <input
                  type="text"
                  value={formData.roName}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Financial Details Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Financial Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Conversions
                </label>
                <input
                  type="text"
                  value={formData.totalConversions}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Sales
                </label>
                <input
                  type="text"
                  value={formData.totalSales}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Marketing Expense
                </label>
                <input
                  type="text"
                  value={formData.marketingExpense}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Operational Expense
                </label>
                <input
                  type="text"
                  value={formData.operationalExpense}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Phlebotomist Details Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Phlebotomist Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phlebotomist Name
                </label>
                <input
                  type="text"
                  value={formData.phleboName}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phlebotomist Mobile Number
                </label>
                <input
                  type="text"
                  value={formData.phleboMobileNo}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Report Status Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Report Status
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                {reportStatusUpdated ? (
                  <div className="mt-2">
                    <span
                      className={`px-3 py-2 rounded-md ${
                        formData.reportStatus === "sent"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {formData.reportStatus === "sent" ? "Sent" : "Not Sent"}
                    </span>
                    <p className="mt-2 text-sm text-gray-600">
                      Updated by: {formData.reportStatusUpdatedBy} on{" "}
                      {new Date(
                        formData.reportStatusUpdatedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <select
                    name="reportStatus"
                    value={formData.reportStatus}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Status</option>
                    <option value="sent">Sent</option>
                    <option value="not_sent">Not Sent</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              Financial Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-blue-700">Conversions:</span>
                <span className="ml-2 font-medium">{formData.totalConversions}</span>
              </div>
              <div>
                <span className="text-sm text-blue-700">Sales:</span>
                <span className="ml-2 font-medium">{formData.totalSales}</span>
              </div>
              <div>
                <span className="text-sm text-blue-700">Total Expenses:</span>
                <span className="ml-2 font-medium">
                  ₹
                  {(
                    parseInt(formData.marketingExpense || 0) +
                    parseInt(formData.operationalExpense || 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Completion Details */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-green-900 mb-4">
              Completion Details
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <span className="text-sm text-green-700">Completed By:</span>
                <span className="ml-2 font-medium">{formData.completedBy}</span>
              </div>
              <div>
                <span className="text-sm text-green-700">Completed On:</span>
                <span className="ml-2 font-medium">
                  {new Date(formData.completedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Form Controls */}
          <div className="flex justify-end space-x-4 mt-8">
            {!reportStatusUpdated && (
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating Status...
                  </>
                ) : (
                  "Update Report Status"
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleBackToDashboard}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Status Update Info */}
          {reportStatusUpdated && (
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Report status has been updated and cannot be modified.
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Last updated by: {formData.reportStatusUpdatedBy} on{" "}
                    {new Date(
                      formData.reportStatusUpdatedAt
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </form>
  );
};

export default ClosedCamp;