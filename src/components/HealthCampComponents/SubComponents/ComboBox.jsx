import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const StateSelect = ({
  value,
  onChange,
  disabled = false,
  error = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const wrapperRef = useRef(null);

  const indianStates = [
    "ANDAMAN AND NICOBAR ISLANDS",
    "ANDHRA PRADESH",
    "ARUNACHAL PRADESH",
    "ASSAM",
    "BIHAR",
    "CHANDIGARH",
    "CHHATTISGARH",
    "DADRA AND NAGAR HAVELI",
    "DAMAN AND DIU",
    "DELHI",
    "GOA",
    "GUJARAT",
    "HARYANA",
    "HIMACHAL PRADESH",
    "JAMMU AND KASHMIR",
    "JHARKHAND",
    "KARNATAKA",
    "KERALA",
    "LADAKH",
    "LAKSHADWEEP",
    "MADHYA PRADESH",
    "MAHARASHTRA",
    "MANIPUR",
    "MEGHALAYA",
    "MIZORAM",
    "NAGALAND",
    "ODISHA",
    "PUDUCHERRY",
    "PUNJAB",
    "RAJASTHAN",
    "SIKKIM",
    "TAMIL NADU",
    "TELANGANA",
    "TRIPURA",
    "UTTAR PRADESH",
    "UTTARAKHAND",
    "WEST BENGAL"
  ];

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchText(""); // Reset search when closing
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter states based on search
  const filteredStates = indianStates.filter(state =>
    state.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleStateSelect = (state) => {
    onChange(state);
    setIsOpen(false);
    setSearchText(""); // Reset search after selection
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <Input
          type="text"
          value={isOpen ? searchText : value || ""} // Show search text when open, selected value when closed
          onChange={(e) => setSearchText(e.target.value)}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              setSearchText(""); // Clear search text when focusing
            }
          }}
          placeholder="Select state..."
          className={cn(
            "pr-10",
            disabled && "bg-gray-100 cursor-not-allowed",
            error && "border-red-500",
            className
          )}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              if (!isOpen) {
                setSearchText(""); // Clear search text when opening
              }
            }
          }}
          disabled={disabled}
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white border rounded-md shadow-lg">
          <div className="p-1">
            {filteredStates.map((state) => (
              <div
                key={state}
                className={cn(
                  "px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded",
                  value === state && "bg-gray-100"
                )}
                onClick={() => handleStateSelect(state)}
              >
                {state}
              </div>
            ))}
            {filteredStates.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No states found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StateSelect;