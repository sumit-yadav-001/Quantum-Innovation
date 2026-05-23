import React, { useState } from 'react';
import { usePayroll, usePayrollStats } from '../../hooks';
import { Button } from '../../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileSpreadsheet } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const PayrollFeature: React.FC = () => {
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const { data: payrollData, isLoading } = usePayroll({ month });
  const { data: stats } = usePayrollStats(month);

  const payroll = payrollData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payroll Management</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage salaries and payroll records</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Outflow</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalOutflow)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Average Salary</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.avgSalary)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Deductions</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalDeductions)}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {stats?.monthlySpendTrend && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Monthly Payroll Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthlySpendTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalSpend" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Month Filter */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Month:</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white"
        />
        <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
          Export
        </Button>
      </div>

      {/* Payroll Records */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          </div>
        ) : payroll.length === 0 ? (
          <div className="p-8 text-center">
            <FileSpreadsheet className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">No payroll records for this month</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Employee</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Base Salary</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Allowances</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Deductions</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Net Salary</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {payroll.map((record: any) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">{record.employeeName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{formatCurrency(record.baseSalary)}</td>
                    <td className="px-6 py-4 text-sm text-green-600 dark:text-green-400">+{formatCurrency(record.allowances)}</td>
                    <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400">-{formatCurrency(record.deductions)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(record.netSalary)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.status === 'PAID'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : record.status === 'PROCESSING'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollFeature;
