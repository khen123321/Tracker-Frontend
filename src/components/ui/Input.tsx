import React, { forwardRef, InputHTMLAttributes } from 'react';

// Extend standard HTML input attributes so we get autocomplete for things like 'type', 'placeholder', etc.
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ElementType; 
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-sm">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Icon size={18} />
            </div>
          )}
          <input
            ref={ref}
            className={`
              block w-full rounded-md border py-2 px-3 text-sm transition-all
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
              ${Icon ? 'pl-10' : ''}
              ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

// Explicitly set displayName when using forwardRef (Best practice for React DevTools)
Input.displayName = 'Input';