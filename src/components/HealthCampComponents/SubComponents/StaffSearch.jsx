import React, { useState, useEffect, useRef } from 'react';
import { database } from "../../../firebase/config";
import { ref, get } from "firebase/database";
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const StaffSearch = ({ 
  onSelect, 
  value = "", 
  role = "", 
  label = "Select staff",
  readOnly = false,
  className = "",
  error = false
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize states with current value
  useEffect(() => {
    setSearchQuery(value || "");
  }, [value]);

  // Staff fetching effect remains the same
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const path = role ? `staffData/${role}` : 'staffFlattened';
        const staffRef = ref(database, path);
        const snapshot = await get(staffRef);
        
        if (snapshot.exists()) {
          const staffData = snapshot.val();
          const staffArray = Object.values(staffData || {}).map(staff => ({
            ...staff,
            displayNameUpper: staff.displayName.toUpperCase(),
            empCodeUpper: staff.empCode.toUpperCase(),
            nameUpper: staff.name.toUpperCase()
          }));
          staffArray.unshift({
            name: "N/A",
            empCode: "NA",
            displayName: "N/A (NA)",
            displayNameUpper: "N/A (NA)",
            empCodeUpper: "NA",
            nameUpper: "N/A"
          });
          setStaff(staffArray);
        } else {
          setStaff([{
            name: "N/A",
            empCode: "NA",
            displayName: "N/A (NA)",
            displayNameUpper: "N/A (NA)",
            empCodeUpper: "NA",
            nameUpper: "N/A"
          }]);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        setStaff([{
          name: "N/A",
          empCode: "NA",
          displayName: "N/A (NA)",
          displayNameUpper: "N/A (NA)",
          empCodeUpper: "NA",
          nameUpper: "N/A"
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [role]);

  const handleInputChange = (e) => {
    if (readOnly) return;
    
    const input = e.target.value;
    setSearchQuery(input);
    setIsEditing(true);
    setShowDropdown(true);
    onSelect(input);
  };

  const handleSelect = (person) => {
    const displayName = person.displayName;
    setSearchQuery(displayName);
    onSelect(displayName);
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (readOnly) return;

    if (e.key === 'Backspace') {
      const newValue = searchQuery.slice(0, -1);
      setSearchQuery(newValue);
      setIsEditing(true);
      setShowDropdown(true);
      onSelect(newValue);
    } else if (e.key === 'Enter' && showDropdown) {
      e.preventDefault();
    }
  };

  const handleBlur = (e) => {
    // Only hide dropdown if not clicking within it
    if (!dropdownRef.current?.contains(e.relatedTarget)) {
      setTimeout(() => {
        setShowDropdown(false);
      }, 200);
    }
  };

  const handleFocus = () => {
    if (!readOnly) {
      setShowDropdown(true);
      setIsEditing(true);
    }
  };

  // Filter staff based on search query
  const filteredStaff = searchQuery 
    ? staff.filter(person => {
        const searchUpper = searchQuery.toUpperCase();
        return (
          person.displayNameUpper.includes(searchUpper) ||
          person.empCodeUpper.includes(searchUpper) ||
          person.nameUpper.includes(searchUpper)
        );
      })
    : staff;

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder={`${label} - Format: NAME (CODE) or N/A`}
        value={searchQuery}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full",
          readOnly && "bg-gray-100",
          error && "border-red-500",
          className
        )}
        disabled={loading || readOnly}
      />
      {showDropdown && !readOnly && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white rounded-md border shadow-lg"
        >
          <ScrollArea className="h-auto max-h-48">
            {filteredStaff.length === 0 ? (
              <div className="py-2 px-3 text-sm text-gray-500">
                Enter in format: NAME (CODE) or select from list
              </div>
            ) : (
              <div className="py-1">
                {filteredStaff.map((person) => (
                  <button
                    key={person.empCode}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100",
                      searchQuery.toUpperCase() === person.displayNameUpper && "bg-gray-100"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(person);
                    }}
                    type="button"
                    tabIndex={0}
                  >
                    {person.displayName}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default StaffSearch;