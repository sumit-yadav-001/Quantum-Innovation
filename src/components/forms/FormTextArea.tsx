import React, { forwardRef } from 'react';
import type { FieldError } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';

export interface FormTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: FieldError;
  rows?: number;
}

export const FormTextArea = forwardRef<HTMLTextAreaElement, FormTextAreaProps>(
  ({ label, error, rows = 4, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
        <textarea
          ref={ref}
          rows={rows}
          className={`
            w-full px-3 py-2 border rounded-lg text-sm transition-colors resize-none
            bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700
            text-slate-900 dark:text-slate-100 placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
            disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed
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
      </div>
    );
  }
);

FormTextArea.displayName = 'FormTextArea';
