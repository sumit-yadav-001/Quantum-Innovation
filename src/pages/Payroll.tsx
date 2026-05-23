import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Receipt, 
  Download, 
  CreditCard, 
  CircleAlert, 
  Printer, 
  Calendar, 
  Building,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { useAppSelector, useAppDispatch } from '../app/store';
import { addToast } from '../app/store/notificationSlice';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Loader } from '../components/ui/Loader';
import { ErrorState } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import type { PayrollRecord } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const Payroll: React.FC = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [selectedDept, setSelectedDept] = useState('All');
  
  // Payslip Modal State
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  // 1. Fetch Payroll Records
  const { data: payrollRecords = [], isLoading: recordsLoading, isError: recordsError, refetch: refetchRecords } = useQuery<PayrollRecord[]>({
    queryKey: ['payroll', { month: selectedMonth, department: selectedDept }],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.PAYROLL, {
        params: {
          month: selectedMonth,
          department: selectedDept === 'All' ? '' : selectedDept
        }
      });
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw?.data ?? []);
    }
  });

  // 2. Fetch Payroll Stats (outflows, trends)
  const { data: payrollStats, isLoading: statsLoading, isError: statsError } = useQuery<{
    totalOutflow: number;
    avgSalary: number;
    totalDeductions: number;
    monthlySpendTrend: { month: string; totalSpend: number; headcount: number }[];
  }>({
    queryKey: ['payrollStats', selectedMonth],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.PAYROLL_STATS, {
        params: { month: selectedMonth }
      });
      return res.data;
    },
    enabled: isAdminOrHR // only relevant for admin/HR
  });

  // 3. Mutation to Pay a Record
  const payRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`${ENDPOINTS.PAYROLL}/${id}`, { status: 'PAID' });
    },
    onSuccess: (_, recordId) => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['payrollStats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      dispatch(addToast({
        title: 'Payroll Disbursed',
        message: 'The employee salary record status was updated to PAID.',
        type: 'success'
      }));
      // Update local modal view if open
      if (selectedPayroll && selectedPayroll.id === recordId) {
        setSelectedPayroll(prev => prev ? { ...prev, status: 'PAID', paidDate: new Date().toISOString().split('T')[0] } : null);
      }
    },
    onError: (err: any) => {
      dispatch(addToast({
        title: 'Disbursement Failed',
        message: err.message || 'Could not execute salary disbursement.',
        type: 'error'
      }));
    }
  });

  // 4. Mutation to Bulk Pay (Run Payroll) for selected month
  const runPayrollMutation = useMutation({
    mutationFn: async () => {
      // Find all records that are PROCESSING or PENDING for the selected month and pay them
      const targetRecords = payrollRecords.filter(r => r.status !== 'PAID');
      for (const record of targetRecords) {
        await apiClient.patch(`${ENDPOINTS.PAYROLL}/${record.id}`, { status: 'PAID' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['payrollStats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      dispatch(addToast({
        title: 'Payroll Run Complete',
        message: `Successfully processed and paid outstanding cycles for ${selectedMonth}.`,
        type: 'success'
      }));
    },
    onError: (err: any) => {
      dispatch(addToast({
        title: 'Payroll Run Failed',
        message: err.message || 'Failed to execute bulk payroll run.',
        type: 'error'
      }));
    }
  });

  // Client-side filtering for Employee/Lead view
  const personalPayrollRecords = useMemo(() => {
    if (isAdminOrHR) return payrollRecords;
    // For general employees and team leads (non-HR), show only their personal records
    return payrollRecords.filter(p => p.employeeId === user?.id);
  }, [payrollRecords, user, isAdminOrHR]);

  // Employee Personal stats
  const employeeStats = useMemo(() => {
    if (isAdminOrHR) return null;
    const paidRecords = personalPayrollRecords.filter(r => r.status === 'PAID');
    const ytdNet = paidRecords.reduce((sum, r) => sum + r.netSalary, 0);
    const avgNet = paidRecords.length > 0 ? Math.round(ytdNet / paidRecords.length) : 0;
    const lastPaid = paidRecords.length > 0 ? paidRecords[0].paidDate : 'N/A';
    
    return { ytdNet, avgNet, lastPaid };
  }, [personalPayrollRecords, isAdminOrHR]);

  const handleOpenPayslip = (record: PayrollRecord) => {
    setSelectedPayroll(record);
    setPayslipModalOpen(true);
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  const handleDownloadPayslipCSV = (record: PayrollRecord) => {
    const csvContent = [
      ['Quantum Innovations - Salary Statement'],
      ['Payslip Period', record.month],
      ['Employee Name', record.employeeName],
      ['Employee ID', record.employeeId],
      ['Department', record.department],
      [],
      ['Earnings Breakdowns', 'Amount ($)'],
      ['Base Salary', record.baseSalary],
      ['Allowances', record.allowances],
      ['Total Gross Earnings', record.baseSalary + record.allowances],
      [],
      ['Deductions / Taxes', 'Amount ($)'],
      ['Total Deductions', record.deductions],
      [],
      ['Net Salary Credited', record.netSalary],
      ['Status', record.status],
      ['Paid Date', record.paidDate || 'Processing']
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Payslip_${record.employeeName.replace(/ /g, '_')}_${record.month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PAID') return 'success';
    if (status === 'PROCESSING') return 'warning';
    return 'neutral';
  };

  const formattedChartData = useMemo(() => {
    if (!payrollStats?.monthlySpendTrend) return [];
    return payrollStats.monthlySpendTrend.map(t => ({
      month: t.month,
      'Total Spend ($)': t.totalSpend,
      'Headcount': t.headcount
    }));
  }, [payrollStats]);

  if (recordsLoading || (isAdminOrHR && statsLoading)) {
    return <Loader message="Accessing salary sheets and corporate ledger..." />;
  }

  if (recordsError || (isAdminOrHR && statsError)) {
    return <ErrorState onRetry={() => { refetchRecords(); }} message="Failed to load payroll records." />;
  }

  // Count unprocessed payrolls for the warning alert
  const pendingCount = payrollRecords.filter(r => r.status !== 'PAID').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">
            Payroll Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAdminOrHR 
              ? 'Oversee corporate expense flows, authorize pending disbursements, and export ledger analytics.'
              : 'Review personal monthly statements, tax adjustments, and access printable payslips.'
            }
          </p>
        </div>

        {isAdminOrHR && pendingCount > 0 && (
          <Button 
            onClick={() => {
              if (confirm(`Are you sure you want to approve and pay all ${pendingCount} unprocessed salary cycles for ${selectedMonth}?`)) {
                runPayrollMutation.mutate();
              }
            }}
            isLoading={runPayrollMutation.isPending}
            className="gap-2 cursor-pointer bg-violet-650 hover:bg-violet-750"
          >
            <CreditCard className="w-4 h-4" />
            <span>Process {pendingCount} Pending Salaries</span>
          </Button>
        )}
      </div>

      {/* ADMIN / HR KPI Cards & Trend Analytics */}
      {isAdminOrHR && payrollStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
            <div className="glassmorphism p-5 rounded-xl border-l-4 border-violet-500 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Monthly Spend</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-display mt-1 block">
                  ${payrollStats.totalOutflow.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-violet-50 dark:bg-violet-950/20 text-violet-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            
            <div className="glassmorphism p-5 rounded-xl border-l-4 border-emerald-500 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Average Net Salary</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-display mt-1 block">
                  ${payrollStats.avgSalary.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="glassmorphism p-5 rounded-xl border-l-4 border-amber-500 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Deductions / Taxes</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-display mt-1 block">
                  ${payrollStats.totalDeductions.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-lg">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            <div className="glassmorphism p-5 rounded-xl border-l-4 border-blue-500 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Employees Cycle Run</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-display mt-1 block">
                  {payrollRecords.length} Active
                </span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-lg">
                <Building className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Spend Trend Chart */}
          {formattedChartData.length > 0 && (
            <div className="glassmorphism p-5 rounded-xl text-left">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Monthly Net Salary Spend Trend (Last 6 Months)
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-850" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        borderColor: '#334155',
                        color: '#f8fafc',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', pt: 10 }} />
                    <Bar dataKey="Total Spend ($)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* EMPLOYEE Self-Service KPI Cards */}
      {!isAdminOrHR && employeeStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="glassmorphism p-5 rounded-xl border-l-4 border-violet-500 flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">YTD Net Earnings</span>
              <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-display mt-1 block">
                ${employeeStats.ytdNet.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-violet-50 dark:bg-violet-950/20 text-violet-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="glassmorphism p-5 rounded-xl border-l-4 border-emerald-500 flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Avg Net Monthly Pay</span>
              <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-display mt-1 block">
                ${employeeStats.avgNet.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="glassmorphism p-5 rounded-xl border-l-4 border-amber-500 flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Last Salary Payout</span>
              <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-display mt-1 block">
                {employeeStats.lastPaid}
              </span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* FILTER CONTROL CARD (only for ADMIN/HR) */}
      {isAdminOrHR && (
        <div className="glassmorphism p-4 rounded-xl flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/3 text-left">
            <Select
              label="Cycle Month"
              options={[
                { value: '2026-05', label: 'May 2026 (Active)' },
                { value: '2026-04', label: 'April 2026' },
                { value: '2026-03', label: 'March 2026' },
                { value: '2026-02', label: 'February 2026' },
                { value: '2026-01', label: 'January 2026' },
                { value: '2025-12', label: 'December 2025' },
                { value: '2025-11', label: 'November 2025' }
              ]}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          <div className="w-full md:w-1/3 text-left">
            <Select
              label="Department Allocation"
              options={[
                { value: 'All', label: 'All Departments' },
                { value: 'Executive', label: 'Executive' },
                { value: 'Human Resources', label: 'Human Resources' },
                { value: 'Engineering', label: 'Engineering' },
                { value: 'Marketing', label: 'Marketing' },
                { value: 'Finance', label: 'Finance' },
                { value: 'Sales', label: 'Sales' }
              ]}
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            />
          </div>

          <Button 
            variant="secondary"
            onClick={() => {
              setSelectedMonth('2026-05');
              setSelectedDept('All');
            }}
            className="w-full md:w-auto shrink-0 cursor-pointer"
          >
            Reset Filters
          </Button>
        </div>
      )}

      {/* WARNING/ALERT IF PENDING DISBURSEMENTS */}
      {isAdminOrHR && pendingCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 flex gap-3 text-left items-center">
          <CircleAlert className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-sm text-amber-600 dark:text-amber-400">
            There are <strong>{pendingCount}</strong> outstanding salary cycles pending approval or processing for <strong>{selectedMonth}</strong>. Use the action options below to finalize them.
          </div>
        </div>
      )}

      {/* Roster Listing Card */}
      <div className="glassmorphism rounded-xl overflow-hidden text-left">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            {isAdminOrHR ? `Cycles Registry - ${selectedMonth}` : 'My Personal Salary History'}
          </span>
          
          {isAdminOrHR && personalPayrollRecords.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 cursor-pointer text-xs"
              onClick={() => {
                // Generate CSV payload for the active listing
                const header = ['Employee Name', 'Department', 'Month', 'Base Salary', 'Allowances', 'Deductions', 'Net Salary', 'Status', 'Paid Date'];
                const rows = personalPayrollRecords.map(r => [
                  r.employeeName,
                  r.department,
                  r.month,
                  r.baseSalary,
                  r.allowances,
                  r.deductions,
                  r.netSalary,
                  r.status,
                  r.paidDate || 'N/A'
                ]);
                const csvStr = [header.join(','), ...rows.map(row => row.join(','))].join('\n');
                const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `QuantumInnovations_Payroll_${selectedMonth}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export sheet</span>
            </Button>
          )}
        </div>

        {personalPayrollRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No payroll statements found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                  {isAdminOrHR && <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Employee</th>}
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Month Period</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Base Salary</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Allowances</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Deductions</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Net Pay Credit</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-550 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {personalPayrollRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/30">
                    {isAdminOrHR && (
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{r.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{r.department}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 font-medium">{r.month}</td>
                    <td className="px-6 py-4">${r.baseSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400">+${r.allowances.toLocaleString()}</td>
                    <td className="px-6 py-4 text-red-600 dark:text-red-400">-${r.deductions.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-violet-650 dark:text-violet-400">${r.netSalary.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusBadge(r.status)}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {isAdminOrHR && r.status !== 'PAID' && (
                          <Button
                            onClick={() => payRecordMutation.mutate(r.id)}
                            isLoading={payRecordMutation.isPending && payRecordMutation.variables === r.id}
                            variant="secondary"
                            size="sm"
                            className="text-xs cursor-pointer hover:bg-violet-600 hover:text-white"
                          >
                            Pay
                          </Button>
                        )}
                        <Button
                          onClick={() => handleOpenPayslip(r)}
                          variant="outline"
                          size="sm"
                          className="text-xs cursor-pointer gap-1"
                        >
                          <span>Payslip</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- PAYSLIP DETAILS MODAL --- */}
      <Modal
        isOpen={payslipModalOpen}
        onClose={() => setPayslipModalOpen(false)}
        title="Payslip Statement"
      >
        {selectedPayroll && (
          <div className="space-y-6 text-left">
            {/* Payslip Corporate Header */}
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <h2 className="text-xl font-bold font-display tracking-tight text-violet-650 dark:text-violet-400">
                  AuraHR Corporation
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  100 Innovation Way, Tech District, Suite 500
                </p>
                <p className="text-[10px] text-slate-400">
                  payouts@aurahr.com | +1 (800) Aura-HR
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Salary Statement</span>
                <span className="text-lg font-bold font-display text-slate-800 dark:text-slate-100 block mt-1">
                  {selectedPayroll.month}
                </span>
                <Badge variant={getStatusBadge(selectedPayroll.status)} className="mt-1">
                  {selectedPayroll.status}
                </Badge>
              </div>
            </div>

            {/* Employee Block */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 dark:border-slate-850 pb-5">
              <div>
                <span className="text-slate-400 block mb-1">Prepared For</span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{selectedPayroll.employeeName}</span>
                <span className="text-slate-500 block mt-0.5">ID: {selectedPayroll.employeeId}</span>
                <span className="text-slate-500 block">Department: {selectedPayroll.department}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block mb-1">Details</span>
                <span className="text-slate-600 dark:text-slate-400 block">payout currency: USD ($)</span>
                {selectedPayroll.paidDate && (
                  <span className="text-slate-600 dark:text-slate-400 block mt-0.5">Paid Date: {selectedPayroll.paidDate}</span>
                )}
                <span className="text-slate-650 dark:text-slate-400 block font-medium">Txn ID: tx-pay-{selectedPayroll.id.split('-').pop()}</span>
              </div>
            </div>

            {/* Configurator breakdown breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-normal">
              {/* Earnings column */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1.5 uppercase tracking-wider text-[10px]">
                  Salary Earnings
                </h3>
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Salary Credit</span>
                  <span className="font-semibold text-slate-750 dark:text-slate-250">${selectedPayroll.baseSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allowances (HRA, Transport)</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">+${selectedPayroll.allowances.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-850 font-semibold">
                  <span className="text-slate-700 dark:text-slate-350">Gross Earnings</span>
                  <span className="text-slate-800 dark:text-slate-200">${(selectedPayroll.baseSalary + selectedPayroll.allowances).toLocaleString()}</span>
                </div>
              </div>

              {/* Deductions column */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1.5 uppercase tracking-wider text-[10px]">
                  Deductions & Taxes
                </h3>
                <div className="flex justify-between">
                  <span className="text-slate-500">Corporate Tax / Withholdings</span>
                  <span className="font-semibold text-red-650 dark:text-red-400">-${selectedPayroll.deductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-850 font-semibold">
                  <span className="text-slate-700 dark:text-slate-350">Total Deductions</span>
                  <span className="text-slate-800 dark:text-slate-200">-${selectedPayroll.deductions.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Total credit box */}
            <div className="p-4 bg-violet-500/5 dark:bg-violet-400/5 border border-violet-500/10 rounded-xl flex justify-between items-center mt-6">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Salary Disbursed</span>
                <span className="text-xs text-slate-400 block mt-0.5">Calculated as: Gross Pay - Total Deductions</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-violet-650 dark:text-violet-400 font-display">
                  ${selectedPayroll.netSalary.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between pt-4 border-t border-slate-200 dark:border-slate-800 mt-8">
              <Button
                variant="outline"
                className="gap-1.5 cursor-pointer text-xs"
                onClick={() => handleDownloadPayslipCSV(selectedPayroll)}
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export Details</span>
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-1.5 cursor-pointer text-xs"
                  onClick={handlePrintPayslip}
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Statement</span>
                </Button>
                
                {isAdminOrHR && selectedPayroll.status !== 'PAID' && (
                  <Button
                    onClick={() => payRecordMutation.mutate(selectedPayroll.id)}
                    isLoading={payRecordMutation.isPending && payRecordMutation.variables === selectedPayroll.id}
                    className="cursor-pointer text-xs bg-violet-650 hover:bg-violet-750"
                  >
                    Authorize Payout
                  </Button>
                )}
                
                <Button
                  variant="secondary"
                  onClick={() => setPayslipModalOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Payroll;
