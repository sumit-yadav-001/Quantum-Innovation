import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../app/store';
import { removeToast } from '../../app/store/notificationSlice';
import type { ToastMessage } from '../../app/store/notificationSlice';

export const ToastContainer: React.FC = () => {
  const { toasts } = useAppSelector((state) => state.notifications);
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(toast.id));
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dispatch]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-violet-500 shrink-0" />
  };

  const borderColors = {
    success: 'border-emerald-500/20 bg-emerald-50/95 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300',
    warning: 'border-amber-500/20 bg-amber-50/95 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300',
    error: 'border-rose-500/20 bg-rose-50/95 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300',
    info: 'border-violet-500/20 bg-violet-50/95 dark:bg-violet-950/20 text-violet-800 dark:text-violet-300'
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${borderColors[toast.type]}`}>
      {icons[toast.type]}
      <div className="flex-1 flex flex-col text-left gap-0.5">
        <span className="text-sm font-semibold tracking-tight leading-tight">
          {toast.title}
        </span>
        <span className="text-xs opacity-90 leading-normal">
          {toast.message}
        </span>
      </div>
      <button 
        onClick={() => dispatch(removeToast(toast.id))}
        className="p-0.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
