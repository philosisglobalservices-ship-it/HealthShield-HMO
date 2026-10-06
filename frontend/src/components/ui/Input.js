import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input({
  label, error, helperText, leftIcon: LeftIcon, rightIcon: RightIcon,
  className = '', id, required, ...props
}, ref) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '_');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className="h-4 w-4 text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`block w-full rounded-lg border ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
            focus:outline-none focus:ring-1 text-sm text-gray-900 placeholder-gray-400
            bg-white disabled:bg-gray-50 disabled:cursor-not-allowed
            ${LeftIcon ? 'pl-10' : 'pl-3'} ${RightIcon ? 'pr-10' : 'pr-3'} py-2 ${className}`}
          {...props}
        />
        {RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <RightIcon className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
});

export default Input;
