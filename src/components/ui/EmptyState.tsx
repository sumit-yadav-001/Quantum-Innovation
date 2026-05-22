import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'Try adjusting your search filters or add a new record to get started.',
  icon = <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-700" />,
  actionLabel,
  onAction
}) => {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center text-center px-4">
      <div className="mb-4 p-4 rounded-full bg-slate-100 dark:bg-slate-900">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
