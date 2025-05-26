import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  CheckCircle2,
  FileBarChart2,
  User,
  ChevronRight,
  LockKeyhole,
  LogOut,
} from "lucide-react";
import TestEntry from "./TestComponents/TestEntry";
import VendorCheck from "./TestComponents/SubComponents/VendorCheck";
import ReportStatus from "./TestComponents/ReportStatus";
import { useAuth } from "../context/AuthContext";

const IndividualHealthCampForm = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("test-entry");
  const { currentUser, userRole } = useAuth();

  // Define role-based access
  const canAccessVendorAndReports = userRole === "superadmin" || userRole === "health-camp-admin";
  const isRestrictedUser = !canAccessVendorAndReports;

  const tabs = [
    {
      id: "test-entry",
      name: "Test Entry",
      component: TestEntry,
      icon: ClipboardList,
      description: "Record and manage test results",
      restricted: false,
    },
    {
      id: "vendor-check",
      name: "Vendor Booking",
      component: VendorCheck,
      icon: CheckCircle2,
      description: "Verify and manage vendors",
      restricted: isRestrictedUser,
    },
    {
      id: "report-status",
      name: "Report Status",
      component: ReportStatus,
      icon: FileBarChart2,
      description: "Track report generation progress",
      restricted: isRestrictedUser,
    },
  ];

  // Reset to test-entry if user tries to access restricted tab
  useEffect(() => {
    if (tabs.find((tab) => tab.id === activeTab)?.restricted) {
      setActiveTab("test-entry");
    }
  }, [activeTab, userRole]);

  const handleLogout = async () => {
    try {
      // Assuming you have a logout function in your auth context
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <ClipboardList className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Test Management System
                </h1>
                <p className="text-gray-500 text-sm mt-1.5">
                  Streamlined healthcare test management
                </p>
              </div>
            </div>

            {/* User profile section */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5">
                <User className="w-5 h-5 text-gray-600" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {currentUser?.email}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {userRole}
                  </span>
                </div>
              </div>
            
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-10xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Breadcrumb */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Dashboard</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-blue-600 font-medium">Test Management</span>
            </div>

            <div className="p-6">
              {/* Tab navigation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => !tab.restricted && setActiveTab(tab.id)}
                    disabled={tab.restricted}
                    className={`
                      relative flex flex-col items-center
                      rounded-lg py-4 px-6 border
                      transition-all duration-200
                      ${tab.restricted ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50" : "border-gray-200 hover:border-blue-200 hover:bg-blue-50"}
                      ${activeTab === tab.id ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : ""}
                    `}
                  >
                    <div
                      className={`
                      p-3 rounded-lg
                      ${
                        activeTab === tab.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }
                    `}
                    >
                      <tab.icon className="w-6 h-6" />
                      {tab.restricted && (
                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-gray-200">
                          <LockKeyhole className="w-3 h-3 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="text-center mt-3">
                      <div
                        className={`
                        font-medium text-base
                        ${
                          activeTab === tab.id
                            ? "text-blue-600"
                            : "text-gray-700"
                        }
                      `}
                      >
                        {tab.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1.5">
                        {tab.restricted ? "Access restricted" : tab.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Content area */}
              <div className="mt-6">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`
                      transform transition-all duration-300
                      ${
                        activeTab === tab.id
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-4 hidden"
                      }
                    `}
                  >
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <tab.component />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IndividualHealthCampForm;