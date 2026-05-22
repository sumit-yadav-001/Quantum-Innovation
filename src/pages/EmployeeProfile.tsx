import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Briefcase, 
  Calendar, 
  Wallet,
  Clock,
  CalendarDays,
  Receipt,
  Download,
  Eye,
  FileText
} from 'lucide-react';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Loader } from '../components/ui/Loader';
import { ErrorState } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import type { Employee, AttendanceRecord, LeaveRequest, PayrollRecord } from '../types';

export const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'info' | 'attendance' | 'leaves' | 'payroll'>('info');
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);

  // 1. Fetch Employee Profile
  const { data: employee, isLoading: empLoading, isError: empError } = useQuery<Employee>({
    queryKey: ['employee', id],
    queryFn: async () => {
      // Find employee in listing since we return all
      const res = await apiClient.get(`${ENDPOINTS.EMPLOYEES}`);
      const list = res.data.data as Employee[];
      const found = list.find(e => e.id === id);
      if (!found) throw new Error('Employee not found');
      return found;
    }
  });

  // 2. Fetch Attendance for Employee
  const { data: attendance = [], isLoading: attLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', { employeeId: id }],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.ATTENDANCE, { params: { employeeId: id } });
      return res.data;
    },
    enabled: !!id
  });

  // 3. Fetch Leaves for Employee
  const { data: leaves = [], isLoading: leavesLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['leaves', { employeeId: id }],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.LEAVES, { params: { employeeId: id } });
      return res.data;
    },
    enabled: !!id
  });

  // 4. Fetch Payroll history
  const { data: payrolls = [], isLoading: payLoading } = useQuery<PayrollRecord[]>({
    queryKey: ['payroll'],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.PAYROLL);
      return res.data;
    }
  });

  const employeePayrolls = payrolls.filter(p => p.employeeId === id);

  if (empLoading || attLoading || leavesLoading || payLoading) {
    return <Loader message="Fetching employee profile..." />;
  }

  if (empError || !employee) {
    return (
      <ErrorState 
        title="Employee profile not found" 
        message="The employee record you are trying to view does not exist or has been removed."
      />
    );
  }

  const handleViewPayslip = (pay: PayrollRecord) => {
    setSelectedPayslip(pay);
    setPayslipModalOpen(true);
  };

  const getLeaveBadgeColor = (status: string) => {
    if (status === 'APPROVED') return 'success';
    if (status === 'REJECTED') return 'danger';
    return 'warning';
  };

  return (
    <div className="space-y-6">
      {/* Header Back button */}
      <div className="flex items-center gap-2 text-left">
        <Link to="/employees">
          <Button variant="outline" size="sm" className="p-1.5 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
            Employee Profile
          </h1>
          <p className="text-xs text-slate-500">
            Workforce Directory / ID: {employee.id}
          </p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="glassmorphism p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center text-left relative overflow-hidden">
        {/* Background Accent Grid */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-violet-500/5 dark:bg-violet-400/5 blur-2xl pointer-events-none" />

        <img 
          src={employee.avatar} 
          alt={employee.name} 
          className="w-24 h-24 rounded-full object-cover border-2 border-violet-100 dark:border-slate-850"
        />

        <div className="flex-1 space-y-2 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display">
              {employee.name}
            </h2>
            <div>
              <Badge variant={employee.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {employee.status}
              </Badge>
            </div>
          </div>
          
          <p className="text-sm font-semibold text-violet-650 dark:text-violet-400 leading-none">
            {employee.designation} &bull; {employee.department}
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-slate-500 dark:text-slate-400 text-xs">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {employee.email}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {employee.phone}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Joined {employee.joiningDate}
            </span>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 text-center md:text-right shrink-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gross Annual Salary</span>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-display tracking-tight mt-1">
            ${employee.salary.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Est. net credit: ${Math.round(employee.salary / 12 * 1.04).toLocaleString()}/mo</span>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('info')}
          className={`pb-2.5 text-sm font-semibold border-b-2 px-1 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'info' 
              ? 'border-violet-600 text-violet-650 dark:text-violet-400' 
              : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Personal Details
          </span>
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-2.5 text-sm font-semibold border-b-2 px-1 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'attendance' 
              ? 'border-violet-600 text-violet-650 dark:text-violet-400' 
              : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Attendance History ({attendance.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`pb-2.5 text-sm font-semibold border-b-2 px-1 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'leaves' 
              ? 'border-violet-600 text-violet-650 dark:text-violet-400' 
              : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Leave History ({leaves.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`pb-2.5 text-sm font-semibold border-b-2 px-1 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'payroll' 
              ? 'border-violet-600 text-violet-650 dark:text-violet-400' 
              : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Payslips ({employeePayrolls.length})
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Employment Card */}
            <div className="glassmorphism p-5 rounded-xl space-y-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-2">Employment Details</span>
              <div className="grid grid-cols-2 gap-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-slate-450 block">Employee ID</span>
                  <span className="font-semibold">{employee.id}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-450 block">Designation</span>
                  <span className="font-semibold">{employee.designation}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-450 block">Department</span>
                  <span className="font-semibold">{employee.department}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-450 block">Joining Date</span>
                  <span className="font-semibold">{employee.joiningDate}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-450 block">Work Status</span>
                  <span className="font-semibold">{employee.status}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-450 block">Base Salary Type</span>
                  <span className="font-semibold">USD - Annual</span>
                </div>
              </div>
            </div>

            {/* Financial Config */}
            <div className="glassmorphism p-5 rounded-xl space-y-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-2">Salary Config Breakdown</span>
              <div className="grid grid-cols-2 gap-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-slate-450 block">Monthly Base Salary</span>
                  <span className="font-semibold">${Math.round(employee.salary / 12).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-450 block">Performance Allowances</span>
                  <span className="font-semibold">${Math.round(employee.salary / 12 * 0.12).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-450 block">Tax & Benefit Deductions</span>
                  <span className="font-semibold">${Math.round(employee.salary / 12 * 0.08).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-450 block">Net Credited Monthly</span>
                  <span className="font-bold text-violet-600 dark:text-violet-400">${Math.round(employee.salary / 12 * 1.04).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Panel: Attendance */}
        {activeTab === 'attendance' && (
          <div className="glassmorphism rounded-xl overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Attendance History Log</span>
            </div>
            {attendance.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No attendance records clocked.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Clock In</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Clock Out</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Logged Hours</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                    {attendance.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/30">
                        <td className="px-6 py-3.5 font-medium">{rec.date}</td>
                        <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{rec.checkIn || '--:--'}</td>
                        <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{rec.checkOut || '--:--'}</td>
                        <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{rec.totalHours > 0 ? `${rec.totalHours} hrs` : '--'}</td>
                        <td className="px-6 py-3.5">
                          <Badge variant={rec.status === 'PRESENT' ? 'success' : rec.status === 'LATE' ? 'warning' : rec.status === 'LEAVE' ? 'info' : 'danger'}>
                            {rec.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Panel: Leaves */}
        {activeTab === 'leaves' && (
          <div className="glassmorphism rounded-xl overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Leave Requests History</span>
            </div>
            {leaves.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No leave requests logged.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Leave Type</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Duration</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Reason</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                    {leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/30">
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-350">{l.type}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-xs">
                            <span>From: {l.startDate}</span>
                            <span>To: {l.endDate}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-650 dark:text-slate-400 max-w-sm truncate">{l.reason}</td>
                        <td className="px-6 py-4">
                          <Badge variant={getLeaveBadgeColor(l.status)}>
                            {l.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Panel: Payroll & Payslip list */}
        {activeTab === 'payroll' && (
          <div className="glassmorphism rounded-xl overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Payroll Cycle Credits</span>
            </div>
            {employeePayrolls.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No payroll history credited.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Salary Month</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Gross Salary</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Net Salary</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Payment Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Credit Date</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-550 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                    {employeePayrolls.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/30">
                        <td className="px-6 py-3.5 font-medium">{pay.month}</td>
                        <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">${pay.baseSalary.toLocaleString()}</td>
                        <td className="px-6 py-3.5 font-bold text-violet-650 dark:text-violet-400">${pay.netSalary.toLocaleString()}</td>
                        <td className="px-6 py-3.5">
                          <Badge variant={pay.status === 'PAID' ? 'success' : 'warning'}>
                            {pay.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">{pay.paidDate || '--'}</td>
                        <td className="px-6 py-3.5 text-right">
                          <Button 
                            onClick={() => handleViewPayslip(pay)}
                            size="sm" 
                            variant="ghost" 
                            className="gap-1.5 cursor-pointer text-violet-600"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Payslip</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- PAYSLIP VIEWER MODAL --- */}
      <Modal
        isOpen={payslipModalOpen}
        onClose={() => setPayslipModalOpen(false)}
        title="Official Pay Disbursement Summary"
        size="lg"
      >
        {selectedPayslip && (
          <div className="space-y-6 p-4 text-left dark:text-slate-900 bg-white rounded-lg border border-slate-200">
            {/* Payslip Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div className="space-y-0.5">
                <span className="font-bold text-lg text-violet-750 font-display">AuraHR Corporation</span>
                <span className="text-[10px] text-slate-450 block">100 Enterprise Way, Suite 400, San Jose, CA</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-slate-700">PAYSLIP SUMMARY</span>
                <span className="text-xs text-slate-500 block">Cycle Month: {selectedPayslip.month}</span>
              </div>
            </div>

            {/* Employee Information */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-450 block uppercase font-medium">Employee Name</span>
                <span className="font-bold text-slate-800">{employee.name}</span>
                <span className="text-slate-450 block mt-1">ID: {employee.id}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-450 block uppercase font-medium">Department / Designation</span>
                <span className="font-bold text-slate-850">{employee.department}</span>
                <span className="text-slate-450 block mt-0.5">{employee.designation}</span>
              </div>
            </div>

            {/* Salary Breakdown Table */}
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 border-b border-slate-200 pb-1 font-bold text-slate-600">
                <span>EARNINGS & ALLOWANCES</span>
                <span className="text-right">AMOUNT ($)</span>
              </div>
              <div className="grid grid-cols-2 text-slate-700">
                <span>Monthly Base Salary</span>
                <span className="text-right">${selectedPayslip.baseSalary.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 text-slate-700">
                <span>Professional Allowance (12%)</span>
                <span className="text-right">${selectedPayslip.allowances.toLocaleString()}</span>
              </div>
              
              <div className="grid grid-cols-2 border-b border-slate-200 pt-3 pb-1 font-bold text-slate-650">
                <span>STATUTORY DEDUCTIONS</span>
                <span className="text-right">AMOUNT ($)</span>
              </div>
              <div className="grid grid-cols-2 text-slate-700">
                <span>Income Tax & Benefits (8%)</span>
                <span className="text-right">-${selectedPayslip.deductions.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 border-t border-slate-300 pt-4 font-bold text-sm text-slate-900">
                <span>NET CREDIT SALARY</span>
                <span className="text-right text-violet-750">${selectedPayslip.netSalary.toLocaleString()}</span>
              </div>
            </div>

            {/* Payslip Footer */}
            <div className="border-t border-slate-200 pt-6 text-[10px] text-slate-400 text-center flex justify-between">
              <span>Payment Mode: Direct Corporate Credit</span>
              <span>Status: {selectedPayslip.status}</span>
            </div>

            <div className="flex justify-end gap-2.5 pt-4">
              <Button
                variant="outline"
                onClick={() => setPayslipModalOpen(false)}
                className="cursor-pointer"
              >
                Close Summary
              </Button>
              <Button
                onClick={() => {
                  alert("Disbursement document triggered for printing.");
                  window.print();
                }}
                className="gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Print Payslip
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default EmployeeProfile;
