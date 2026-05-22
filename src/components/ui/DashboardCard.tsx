import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number; // e.g. 12.5%
    isPositive: boolean;
    label: string; // e.g. "vs last month"
  };
  isLoading?: boolean;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  trend,
  isLoading = false
}) => {
  return (
    <div className="glassmorphism-card p-6 flex flex-col justify-between h-36 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-[2px]">
      {/* Background Accent Grid */}
      <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 rounded-full bg-violet-500/5 dark:bg-violet-400/5 blur-2xl pointer-events-none" />
      
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {title}
            </span>
            {icon && (
              <span className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 shrink-0">
                {icon}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-col">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-display tracking-tight">
              {value}
            </span>
            {trend && (
              <div className="flex items-center gap-1 mt-1 text-xs">
                <span className={`inline-flex items-center gap-0.5 font-medium ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {trend.isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {trend.value}%
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  {trend.label}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default DashboardCard;
