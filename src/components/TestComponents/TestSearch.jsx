import React, { useState, useEffect } from 'react';
import { Search, Package } from 'lucide-react';

const TestSearch = ({ 
  onSearch, 
  onSelect, 
  testEntries,
  disabled = false,
  loading = false,
  placeholder = "Search by Test Code, Booking ID, Name, or Mobile Number"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    handleSearchSuggestions(searchTerm);
  }, [searchTerm, testEntries]);

  const handleSearchSuggestions = (value) => {
    if (!value || value.length < 2) {
      setSearchResults([]);
      return;
    }

    const filtered = testEntries.filter(entry => {
      const searchValue = value.toLowerCase();
      
      // Check master booking ID (for multiple tests)
      if (entry.masterBookingId && 
          entry.masterBookingId.toLowerCase().includes(searchValue)) {
        return true;
      }
      
      // Check individual test codes (for multiple tests)
      if (entry.testCodes && entry.testCodes.some(code => 
          code.toLowerCase().includes(searchValue))) {
        return true;
      }
      
      // Check individual test names (for multiple tests)
      if (entry.testNames && entry.testNames.some(name => 
          name.toLowerCase().includes(searchValue))) {
        return true;
      }
      
      // Legacy single test support
      if (entry.testCode && entry.testCode.toLowerCase().includes(searchValue)) {
        return true;
      }
      
      if (entry.testName && entry.testName.toLowerCase().includes(searchValue)) {
        return true;
      }
      
      if (entry.bookingId && entry.bookingId.toLowerCase().includes(searchValue)) {
        return true;
      }
      
      // Patient name
      if (entry.name && entry.name.toLowerCase().includes(searchValue)) {
        return true;
      }
      
      // Mobile number
      if (entry.mobileNo && entry.mobileNo.includes(value)) {
        return true;
      }
      
      return false;
    });
    
    setSearchResults(filtered.slice(0, 8)); // Show more results for better UX
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);

    if (value.length >= 3) {
      onSearch?.(value);
    }
  };

  const handleSuggestionClick = (entry) => {
    const displayId = entry.masterBookingId || entry.testCode || entry.bookingId || '';
    setSearchTerm(displayId);
    setShowSuggestions(false);
    onSelect?.(entry);
  };

  const getDisplayId = (entry) => {
    return entry.masterBookingId || entry.testCode || entry.bookingId || 'N/A';
  };

  const getTestSummary = (entry) => {
    if (entry.tests && entry.tests.length > 0) {
      return {
        isMultiple: true,
        testCount: entry.testCount || entry.tests.length,
        testNames: entry.tests.map(t => t.testName).join(", "),
        totalPrice: entry.totalPrice || 0
      };
    }
    return {
      isMultiple: false,
      testCount: 1,
      testNames: entry.testName || 'N/A',
      totalPrice: entry.price || 0
    };
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={`h-5 w-5 ${loading ? 'animate-pulse text-blue-500' : 'text-gray-400'}`} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          disabled={disabled || loading}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </div>

      {showSuggestions && searchResults.length > 0 && !loading && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md overflow-auto ring-1 ring-black ring-opacity-5">
          {searchResults.map((entry) => {
            const testSummary = getTestSummary(entry);
            return (
              <div
                key={entry.id || getDisplayId(entry)}
                onClick={() => handleSuggestionClick(entry)}
                className="cursor-pointer select-none relative p-3 hover:bg-indigo-50 border-b border-gray-100 last:border-0"
              >
                <div className="flex flex-col gap-1">
                  {/* Header with ID and Multiple Test Indicator */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{getDisplayId(entry)}</span>
                    {testSummary.isMultiple && (
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">
                          {testSummary.testCount} Tests
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Patient Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">{entry.name}</span>
                    {entry.mobileNo && (
                      <span className="text-gray-500">• {entry.mobileNo}</span>
                    )}
                  </div>
                  
                  {/* Test Details */}
                  <div className="text-xs text-gray-500">
                    <div className="truncate" title={testSummary.testNames}>
                      Tests: {testSummary.testNames}
                    </div>
                  </div>
                  
                  {/* Amount and Status */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">
                      ₹{testSummary.totalPrice}
                      {entry.isFree && <span className="text-green-600 ml-1">(Free)</span>}
                    </span>
                    {entry.paymentStatus && (
                      <span className={`capitalize px-2 py-1 rounded-full ${
                        entry.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                        entry.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {entry.paymentStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Show more indicator if there are more results */}
          {testEntries.length > searchResults.length && (
            <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 text-center">
              Showing top {searchResults.length} results. Type more to narrow down.
            </div>
          )}
        </div>
      )}
      
      {/* No results message */}
      {showSuggestions && searchTerm.length >= 2 && searchResults.length === 0 && !loading && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5">
          <div className="px-3 py-4 text-sm text-gray-500 text-center">
            No entries found for "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSearch;