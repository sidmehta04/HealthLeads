import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

const TestNameSearch = ({ testCatalog, onTestSelect, disabled, value }) => {
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
      const filtered = Object.keys(testCatalog).filter(test =>
        test.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTests(filtered);
      setIsDropdownOpen(true);
    } else {
      setFilteredTests([]);
      setIsDropdownOpen(false);
    }
  }, [searchQuery, testCatalog]);

  const handleTestClick = (test) => {
    onTestSelect(test);
    setSearchQuery('');
    setIsDropdownOpen(false);
    setIsSearching(false);
  };

  const handleInputFocus = () => {
    setIsSearching(true);
    setSearchQuery('');
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setIsSearching(true);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search for a test..."
          value={isSearching ? searchQuery : value || ''}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="w-full h-8 pr-10 border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {isDropdownOpen && !disabled && filteredTests.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
          {filteredTests.map((test) => (
            <div
              key={test}
              className="px-4 py-2 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
              onClick={() => handleTestClick(test)}
            >
              <span>{test}</span>
              <span className="text-sm text-gray-500">
                ₹{testCatalog[test].price}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestNameSearch;