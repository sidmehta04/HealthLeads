import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const vendors = [
  { label: "Red cliffe Labs", value: "RED_CLIFF" },
  { label: "Healthians", value: "HEALTHIANS" },
  { label: "Tata1mg", value: "TATA1MG" },
  { label: "Goraksh Diagnostic", value: "GORAKSH_DIAGNOSTIC" },
];

const VendorDetailsSection = ({ formData, handleChange, isCompleted, isSaved = false }) => {
  // Find vendor label for display
  const getVendorLabel = (value) => {
    const vendor = vendors.find(v => v.value === value);
    return vendor ? vendor.label : value;
  };

  const handleVendorSelect = (value) => {
    if (isSaved || isCompleted) return; // Prevent changes if saved or completed
    handleChange({
      target: {
        name: "vendorName",
        value: value
      }
    });
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Vendor Details
        </h3>
        {isSaved && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Details Saved
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Vendor
          </label>
          {isSaved ? (
            <div className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100">
              {getVendorLabel(formData.vendorName)}
            </div>
          ) : (
            <Select
              value={formData.vendorName}
              onValueChange={handleVendorSelect}
              disabled={isCompleted || isSaved}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.value} value={vendor.value}>
                    {vendor.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phlebotomist Name
          </label>
          <input
            type="text"
            name="phleboName"
            value={formData.phleboName}
            onChange={handleChange}
            required
            readOnly={isCompleted || isSaved}
            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 ${
              isCompleted || isSaved
                ? "bg-gray-100"
                : "focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phlebotomist Mobile Number
          </label>
          <input
            type="tel"
            name="phleboMobileNo"
            value={formData.phleboMobileNo}
            onChange={handleChange}
            required
            pattern="[0-9]{10}"
            readOnly={isCompleted || isSaved}
            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 ${
              isCompleted || isSaved
                ? "bg-gray-100"
                : "focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          />
        </div>
      </div>
      {isSaved && (
        <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Vendor details have been saved and locked. Contact administrator for any changes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDetailsSection;