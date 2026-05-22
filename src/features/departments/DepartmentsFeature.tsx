import React from 'react';
import { useDepartments } from '../../hooks';
import { Briefcase } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const DepartmentsFeature: React.FC = () => {
  const { data: departments = [], isLoading } = useDepartments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Departments</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage organization departments</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept: any) => (
            <div
              key={dept.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Briefcase className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{dept.name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{dept.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Employees:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{dept.employeeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Budget:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(dept.budget)}</span>
                </div>
                {dept.managerName && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Manager:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{dept.managerName}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartmentsFeature;
