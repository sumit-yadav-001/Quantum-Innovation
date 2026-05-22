import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  message?: string;
  fullPage?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ 
  message = 'Loading data...', 
  fullPage = false 
}) => {
  const containerStyle = fullPage 
    ? 'fixed inset-0 bg-slate-50/80 dark:bg-slate-950/80 z-50 flex flex-col items-center justify-center'
    : 'w-full py-12 flex flex-col items-center justify-center gap-3';

  return (
    <div className={containerStyle}>
      <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
      {message && (
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {message}
        </span>
      )}
    </div>
  );
};
