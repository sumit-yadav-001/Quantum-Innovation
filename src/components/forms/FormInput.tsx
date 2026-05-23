import React, { forwardRef } from 'react';
import type { FieldError } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: FieldError;
  helperText?: string;
  fullWidth?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, fullWidth = false, className = '', ...props }, ref) => {
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg text-sm transition-colors
            bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700
            text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
            disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-500 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <div className="flex items-center gap-1 mt-1.5 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>{error.message}</span>
          </div>
        )}
        {helperText && !error && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
