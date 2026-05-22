import React from 'react';
import { FileText } from 'lucide-react';

const DocumentsFeature: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Document Management</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage company and employee documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-3xl font-bold text-slate-900 dark:text-white">0</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Total Documents</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-3xl font-bold text-slate-900 dark:text-white">0</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Policies</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-3xl font-bold text-slate-900 dark:text-white">0</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Contracts</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-3xl font-bold text-slate-900 dark:text-white">0</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Payroll</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-12 border border-slate-200 dark:border-slate-700 text-center">
        <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No documents yet</h3>
        <p className="text-slate-600 dark:text-slate-400">Documents will appear here once uploaded</p>
      </div>
    </div>
  );
};

export default DocumentsFeature;
