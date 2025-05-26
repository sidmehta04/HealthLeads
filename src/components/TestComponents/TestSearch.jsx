import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const TestSearch = ({ 
  onSearch, 
  onSelect, 
  testEntries,
  disabled = false,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    handleSearchSuggestions(searchTerm);
  }, [searchTerm, testEntries]);

  const handleSearchSuggestions = (value) => {
    if (!value || value.length < 3) {
      setSearchResults([]);
      return;
    }

    const filtered = testEntries.filter(entry => 
      (entry.testCode && entry.testCode.toLowerCase().includes(value.toLowerCase())) ||
      (entry.name && entry.name.toLowerCase().includes(value.toLowerCase())) ||
      (entry.bookingId && entry.bookingId.toLowerCase().includes(value.toLowerCase())) ||
      (entry.mobileNo && entry.mobileNo.includes(value)) // Added mobile number search
    );
    setSearchResults(filtered.slice(0, 5));
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);

    if (value.length >= 7) {
      onSearch?.(value);
    }
  };

  const handleSuggestionClick = (entry) => {
    setSearchTerm(entry.testCode);
    setShowSuggestions(false);
    onSelect?.(entry);
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          disabled={disabled}
          placeholder="Search by Test Code, Name, ID, or Mobile Number"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
        />
      </div>

      {showSuggestions && searchResults.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md overflow-auto ring-1 ring-black ring-opacity-5">
          {searchResults.map((entry) => (
            <div
              key={entry.id || entry.testCode}
              onClick={() => handleSuggestionClick(entry)}
              className="cursor-pointer select-none relative p-3 hover:bg-indigo-50 border-b border-gray-100 last:border-0"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-gray-900">{entry.testCode}</span>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{entry.name}</span>
                  {entry.mobileNo && (
                    <span className="text-gray-500">• {entry.mobileNo}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{entry.bookingId}</span>
                {entry.paymentStatus && (
                  <span className={`text-xs capitalize ${
                    entry.paymentStatus === 'completed' ? 'text-green-600' :
                    entry.paymentStatus === 'failed' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    Payment: {entry.paymentStatus}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestSearch;