import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

export const ColumnFilterDropdown = ({ 
  field, 
  header,
  options, 
  value,
  onFilterChange,
  onFilterClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onFilterClose();
      }
    };

    // Check dropdown position on mount and window resize
    const checkPosition = () => {
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        if (spaceBelow < 200 && spaceAbove > spaceBelow) {
          setDropdownPosition('top');
        } else {
          setDropdownPosition('bottom');
        }
      }
    };

    checkPosition();
    window.addEventListener('resize', checkPosition);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', checkPosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onFilterClose]);

  const filteredOptions = options.filter(option => 
    option?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Set minimum height to prevent layout shifts
  const minHeight = Math.min(filteredOptions.length * 28 + 80, 300);

  return (
    <div 
      ref={dropdownRef} 
      className={`absolute z-50 w-48 bg-white rounded-md shadow-lg border border-gray-200 ${
        dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
      }`}
      style={{ minHeight: `${minHeight}px` }}
    >
      <div className="p-2 border-b">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="overflow-auto" style={{ maxHeight: '240px' }}>
        <div 
          className="px-3 py-1 text-xs hover:bg-gray-100 cursor-pointer font-medium text-blue-600"
          onClick={() => {
            onFilterChange(field, null);
            onFilterClose();
          }}
        >
          Show All
        </div>
        {filteredOptions.map((option) => (
          <div
            key={option}
            className={`px-3 py-1 text-xs hover:bg-gray-100 cursor-pointer ${
              value === option ? 'bg-blue-50 text-blue-600' : ''
            }`}
            onClick={() => {
              onFilterChange(field, option);
              onFilterClose();
            }}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ColumnHeader = ({ 
  field, 
  header, 
  value,
  options,
  onFilterChange,
  isActive,
  onFilterClick 
}) => {
  return (
    <div className="flex items-center gap-1 group relative">
      {header}
      <div className="relative inline-block">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFilterClick(field);
          }}
          className={`p-1 rounded hover:bg-gray-200 ${value ? 'text-blue-600' : ''}`}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFilterChange(field, null);
            }}
            className="ml-1 p-1 rounded hover:bg-gray-200 text-gray-500"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        {isActive && (
          <ColumnFilterDropdown
            field={field}
            header={header}
            options={options}
            value={value}
            onFilterChange={onFilterChange}
            onFilterClose={() => onFilterClick(null)}
          />
        )}
      </div>
    </div>
  );
};