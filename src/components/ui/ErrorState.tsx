import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An error occurred while fetching the requested data. Please try again.',
  onRetry
}) => {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center text-center px-4">
      <div className="mb-4 p-4 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400">
        <AlertCircle className="w-12 h-12" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
};
