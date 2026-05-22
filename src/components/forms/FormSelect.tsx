import React, { forwardRef } from 'react';
import { FieldError } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: FieldError;
  options: Array<{ label: string; value: string | number }>;
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
        <select
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg text-sm transition-colors
            bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700
            text-slate-900 dark:text-slate-100
            focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
            disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <div className="flex items-center gap-1 mt-1.5 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>{error.message}</span>
          </div>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
