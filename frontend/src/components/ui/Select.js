import React from 'react';

export function Select({ label, error, options = [], placeholder, className = '', id, required, ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '_');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`block w-full rounded-lg border ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
          focus:outline-none focus:ring-1 text-sm text-gray-900 bg-white
          disabled:bg-gray-50 disabled:cursor-not-allowed px-3 py-2 ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default Select;
