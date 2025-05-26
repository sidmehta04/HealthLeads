import React from 'react';

const DEFAULT_TEST_PRICES = [300, 400];
const PARTNER_PRICES = {
  HUMANA: 500,
  "M-AFFINITY": 500,
  PAHAL: 150,
};

const FinancialDetailsSection = ({ formData, handleChange, isCompleted, isTestsSaved }) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Financial Details
        </h3>
        {isTestsSaved && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Tests Count Saved
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Test Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Test Price
          </label>
          <select
            name="testPrice"
            value={formData.testPrice}
            onChange={handleChange}
            required
            readOnly={isCompleted || isTestsSaved}
            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 ${
              isCompleted || isTestsSaved
                ? "bg-gray-100"
                : "focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          >
            {DEFAULT_TEST_PRICES.map(price => (
              <option key={price} value={price}>
                ₹{price}
              </option>
            ))}
          </select>
        </div>

        {/* Tests Done - Saveable */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tests Done
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            name="unitsSold"
            value={formData.unitsSold}
            onChange={handleChange}
            required
            readOnly={isCompleted || isTestsSaved}
            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              isCompleted || isTestsSaved
                ? "bg-gray-100"
                : "focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          />
        </div>

        {/* Revenue - Auto-calculated */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Revenue
          </label>
          <input
            type="text"
            inputMode="numeric"
            name="revenue"
            value={formData.revenue}
            readOnly
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        {/* Transaction ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Transaction ID
          </label>
          <input
            type="text"
            name="transactionId"
            value={formData.transactionId}
            onChange={handleChange}
            required
            readOnly={isCompleted}
            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 ${
              isCompleted ? "bg-gray-100" : "focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          />
        </div>

        {/* Amount Paid to Finance */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount Paid to Finance
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            name="amountPaidToFinance"
            value={formData.amountPaidToFinance}
            onChange={handleChange}
            required
            readOnly={isCompleted}
            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              isCompleted ? "bg-gray-100" : "focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          />
        </div>

        {/* Marketing Expense */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Marketing Expense
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            name="marketingExpense"
            value={formData.marketingExpense}
            onChange={handleChange}
            required
            readOnly={isCompleted}
            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              isCompleted ? "bg-gray-100" : "focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          />
        </div>

        {/* Operational Expense */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Operational Expense
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            name="operationalExpense"
            value={formData.operationalExpense}
            onChange={handleChange}
            required
            readOnly={isCompleted}
            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              isCompleted ? "bg-gray-100" : "focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          />
        </div>
      </div>

      {/* Info message when tests count is saved */}
      {isTestsSaved && (
        <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Tests count has been saved and locked. Contact administrator for any changes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDetailsSection;