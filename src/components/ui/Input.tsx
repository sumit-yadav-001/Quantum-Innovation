import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', type = 'text', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1 text-left">
        {label && (
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all duration-200 
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                : 'border-slate-200 dark:border-slate-800 focus:border-violet-500 dark:focus:border-violet-500'
            } 
            text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
        {!error && helperText && <span className="text-xs text-slate-400 dark:text-slate-500">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
