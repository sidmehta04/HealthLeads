import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';

const TestNameSearch = ({ testCatalog, onTestSelect, disabled, value, selectedTests = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredTests, setFilteredTests] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        if (!searchQuery) {
          setIsSearching(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim()) {
      // Filter out already selected tests
      const selectedTestNames = selectedTests ? selectedTests.map(test => test.testName) : [];
      const filtered = Object.keys(testCatalog).filter(test =>
        test.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedTestNames.includes(test) // Exclude already selected tests
      );
      setFilteredTests(filtered);
      setIsDropdownOpen(true);
    } else {
      setFilteredTests([]);
      setIsDropdownOpen(false);
    }
  }, [searchQuery, testCatalog]); // Removed selectedTests from dependencies

  const handleTestClick = (test) => {
    onTestSelect(test);
    setSearchQuery(''); // Clear search after selection
    setIsDropdownOpen(false);
    setIsSearching(false);
  };

  const handleInputFocus = () => {
    setIsSearching(true);
    setSearchQuery('');
    // Show all available tests when focused (excluding selected ones)
    const selectedTestNames = selectedTests ? selectedTests.map(test => test.testName) : [];
    const allAvailableTests = Object.keys(testCatalog).filter(test => 
      !selectedTestNames.includes(test)
    );
    setFilteredTests(allAvailableTests);
    setIsDropdownOpen(true);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setIsSearching(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredTests.length > 0) {
      e.preventDefault();
      handleTestClick(filteredTests[0]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search and add tests..."
            value={isSearching ? searchQuery : ''}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            className="w-full h-12 pl-4 pr-10 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={disabled}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isSearching ? (
              <X 
                className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" 
                onClick={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                  setIsDropdownOpen(false);
                }}
              />
            ) : (
              <Search className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Dropdown */}
        {isDropdownOpen && !disabled && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
            {filteredTests.length > 0 ? (
              <>
                <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                  {searchQuery ? `Found ${filteredTests.length} tests` : 'Available tests'}
                </div>
                {filteredTests.map((test) => (
                  <div
                    key={test}
                    className="px-4 py-3 cursor-pointer hover:bg-blue-50 flex justify-between items-center border-b border-gray-100 last:border-0 group"
                    onClick={() => handleTestClick(test)}
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      <span className="font-medium text-gray-900">{test}</span>
                    </div>
                    <span className="text-sm font-medium text-blue-600">
                      ₹{testCatalog[test].price}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {searchQuery ? 'No tests found' : 'All tests have been added'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Tests Display */}
      {selectedTests.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Selected Tests ({selectedTests.length}):
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedTests.map((test, index) => (
              <div key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex-1">
                  <div className="font-medium text-blue-900">{test.testName}</div>
                  <div className="text-sm text-blue-700">
                    Code: {test.testCode} • ₹{test.price}
                  </div>
                </div>
                <div className="text-sm font-medium text-blue-800">
                  ₹{test.price}
                </div>
              </div>
            ))}
          </div>
          
          {/* Total Price */}
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-800">Total Amount:</span>
              <span className="text-lg font-bold text-green-800">
                ₹{selectedTests.reduce((sum, test) => sum + (test.price || 0), 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {selectedTests.length === 0 && !isSearching && (
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          💡 Click the search box to see available tests, or start typing to search
        </div>
      )}
    </div>
  );
};

export default TestNameSearch;