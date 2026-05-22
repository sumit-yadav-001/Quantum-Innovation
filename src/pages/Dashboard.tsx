import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CalendarRange, 
  Wallet, 
  UserCheck, 
  ArrowRight, 
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar
} from 'recharts';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { useAppSelector, useAppDispatch } from '../app/store';
import { addToast } from '../app/store/notificationSlice';
import { DashboardCard } from '../components/ui/DashboardCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Loader } from '../components/ui/Loader';
import { ErrorState } from '../components/ui/ErrorState';

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<'SICK' | 'CASUAL' | 'ANNUAL'>('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const todayStr = '2026-05-22'; // Current Mock Date

  // 1. Fetch data in parallel
  const { data: employeesRes, isLoading: empsLoading, error: empsError } = useQuery({
    queryKey: ['employees', { limit: 100 }],
    queryFn: () => apiClient.get(`${ENDPOINTS.EMPLOYEES}?limit=100`)
  });

  const { data: attendanceRes, isLoading: attsLoading } = useQuery({
    queryKey: ['attendance', { date: todayStr }],
    queryFn: () => apiClient.get(`${ENDPOINTS.ATTENDANCE}?date=${todayStr}`)
  });

  const { data: myAttendanceRes } = useQuery({
    queryKey: ['attendance', { employeeId: user?.id }],
    queryFn: () => apiClient.get(`${ENDPOINTS.ATTENDANCE}?employeeId=${user?.id}`),
    enabled: !!user?.id
  });

  const { data: leavesRes, isLoading: leavesLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: () => apiClient.get(ENDPOINTS.LEAVES)
  });

  const { data: payrollStatsRes, isLoading: payrollLoading } = useQuery({
    queryKey: ['payrollStats', { month: '2026-05' }],
    queryFn: () => apiClient.get(`${ENDPOINTS.PAYROLL_STATS}?month=2026-05`)
  });

  const { data: generalAttStatsRes } = useQuery({
    queryKey: ['attendanceStats', { company: true }],
    queryFn: () => apiClient.get(ENDPOINTS.ATTENDANCE_STATS)
  });

  // Punch Mutation
  const punchMutation = useMutation({
    mutationFn: async (action: 'IN' | 'OUT') => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      await apiClient.post(ENDPOINTS.ATTENDANCE_PUNCH, {
        employeeId: user?.id,
        date: todayStr,
        time: timeStr,
        action
      });
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      dispatch(
        addToast({
          title: action === 'IN' ? 'Punched In Successfully' : 'Punched Out Successfully',
          message: `Your check-${action.toLowerCase()} has been logged for today.`,
          type: 'success'
        })
      );
    },
    onError: (err: any) => {
      dispatch(
        addToast({
          title: 'Punch Registration Failed',
          message: err.message || 'Unable to register check event.',
          type: 'error'
        })
      );
    }
  });

  // Leave Mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(ENDPOINTS.LEAVES, {
        employeeId: user?.id,
        type: leaveType,
        startDate,
        endDate,
        reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setLeaveModalOpen(false);
      setReason('');
      setStartDate('');
      setEndDate('');
      dispatch(
        addToast({
          title: 'Leave Request Submitted',
          message: 'Your leave application is pending manager approval.',
          type: 'success'
        })
      );
    },
    onError: (err: any) => {
      dispatch(
        addToast({
          title: 'Failed to Apply Leave',
          message: err.message || 'An error occurred.',
          type: 'error'
        })
      );
    }
  });

  if (empsLoading || attsLoading || leavesLoading || payrollLoading) {
    return <Loader message="Compiling analytical dashboard..." />;
  }

  if (empsError) {
    return <ErrorState message="Could not compile dashboard widgets." onRetry={() => queryClient.refetchQueries()} />;
  }

  // Calculate Metrics
  const employees = employeesRes?.data?.data || [];
  const headcount = employees.filter((e: any) => e.status === 'ACTIVE').length;
  
  const todayAttendance = attendanceRes?.data || [];
  const presentToday = todayAttendance.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
  
  const leaves = leavesRes?.data || [];
  const pendingLeavesCount = leaves.filter((l: any) => l.status === 'PENDING').length;
  
  const payrollStats = payrollStatsRes?.data || { totalOutflow: 0 };
  const monthlySalaryOutflow = payrollStats.totalOutflow;

  // Find My Punch details
  const myPunches = myAttendanceRes?.data || [];
  const todayPunch = myPunches.find((a: any) => a.date === todayStr);
  const isPunchedIn = todayPunch && todayPunch.checkIn && !todayPunch.checkOut;
  const isPunchedOut = todayPunch && todayPunch.checkIn && todayPunch.checkOut;

  // Chart Data: Department Breakdowns
  const deptDataMap: Record<string, number> = {};
  employees.forEach((emp: any) => {
    if (emp.status === 'ACTIVE') {
      deptDataMap[emp.department] = (deptDataMap[emp.department] || 0) + 1;
    }
  });
  const departmentChartData = Object.entries(deptDataMap).map(([name, value]) => ({ name, value }));

  // Chart Data: Attendance Trends (Last 7 Days)
  const attendanceTrends = generalAttStatsRes?.data?.dailyStatsTrend || [];

  // Chart Data: Payroll Trends (Last 6 Months)
  const payrollTrends = generalAttStatsRes?.data?.monthlySpendTrend || [];

  // Chart Data: Leave Distribution Types
  const leaveTypesMap = { SICK: 0, CASUAL: 0, ANNUAL: 0 };
  leaves.forEach((l: any) => {
    if (l.status === 'APPROVED') {
      leaveTypesMap[l.type as keyof typeof leaveTypesMap] = (leaveTypesMap[l.type as keyof typeof leaveTypesMap] || 0) + 1;
    }
  });
  const leaveChartData = Object.entries(leaveTypesMap).map(([name, value]) => ({ name, value }));

  // Recent activities list
  const recentActivities = [
    ...todayAttendance.slice(0, 5).map((a: any) => ({
      id: a.id,
      text: `${a.employeeName} checked in (${a.status})`,
      time: a.checkIn || '09:00 AM',
      type: 'attendance'
    })),
    ...leaves.slice(0, 3).map((l: any) => ({
      id: l.id,
      text: `${l.employeeName} applied for ${l.type.toLowerCase()} leave`,
      time: 'Recently',
      type: 'leave'
    }))
  ].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome header & Quick action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            AuraHR Dashboard / Corporate Overview. Today is {todayStr}
          </p>
        </div>

        {/* --- QUICK ACTIONS WIDGET --- */}
        <div className="flex items-center gap-2">
          {/* Quick Punch Panel */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
            <Clock className="w-4 h-4 text-violet-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {isPunchedOut ? 'Shift Done' : isPunchedIn ? 'Working...' : 'Not Clocked In'}
            </span>
            <Button
              size="sm"
              variant={isPunchedIn ? 'danger' : 'primary'}
              disabled={isPunchedOut || punchMutation.isPending}
              onClick={() => punchMutation.mutate(isPunchedIn ? 'OUT' : 'IN')}
              className="text-[11px] px-2.5 py-1 font-bold tracking-wide"
            >
              {isPunchedOut ? 'Completed' : isPunchedIn ? 'Punch Out' : 'Punch In'}
            </Button>
          </div>

          <Button 
            onClick={() => setLeaveModalOpen(true)}
            size="sm"
            variant="outline"
            className="cursor-pointer"
          >
            Apply Leave
          </Button>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Active Workforce"
          value={headcount}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: 4.8, isPositive: true, label: "vs last quarter" }}
        />
        <DashboardCard
          title="Presents Today"
          value={presentToday}
          icon={<UserCheck className="w-5 h-5" />}
          trend={{ value: 92.3, isPositive: true, label: "attendance rate" }}
        />
        <DashboardCard
          title="Pending Approvals"
          value={pendingLeavesCount}
          icon={<CalendarRange className="w-5 h-5" />}
        />
        <DashboardCard
          title="Monthly Payroll Outflow"
          value={`$${monthlySalaryOutflow.toLocaleString()}`}
          icon={<Wallet className="w-5 h-5" />}
          trend={{ value: 1.2, isPositive: false, label: "vs last month" }}
        />
      </div>

      {/* Analytical Charts Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance trend (2/3 width) */}
        <div className="lg:col-span-2 glassmorphism p-5 rounded-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-display">Workforce Attendance Trend</span>
            <Badge variant="success">Last 7 Active Days</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="date" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" />
                <ChartTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area type="monotone" dataKey="present" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={2} name="Presents" />
                <Area type="monotone" dataKey="late" stroke="#f59e0b" fill="none" strokeWidth={1.5} name="Lates" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Size Share (1/3 width) */}
        <div className="glassmorphism p-5 rounded-xl flex flex-col justify-between">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-display mb-2 text-left block">
            Department Allocation
          </span>
          <div className="h-48 w-full">
            {departmentChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {departmentChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip contentStyle={{ fontSize: 10, borderRadius: 6 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-2">
            {departmentChartData.map((d, index) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="truncate">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Expense outflow (1/3 width) */}
        <div className="glassmorphism p-5 rounded-xl flex flex-col text-left">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-display mb-4 block">
            Payroll Expenditure Trend
          </span>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" fontSize={10} stroke="#94a3b8" />
                <YAxis fontSize={10} stroke="#94a3b8" />
                <ChartTooltip contentStyle={{ fontSize: 10, borderRadius: 6 }} />
                <Bar dataKey="totalSpend" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total Outflow ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave categories distribution (1/3 width) */}
        <div className="glassmorphism p-5 rounded-xl flex flex-col text-left">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-display mb-4 block">
            Leave Distribution (Approved)
          </span>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" />
                <ChartTooltip contentStyle={{ fontSize: 10, borderRadius: 6 }} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Days count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent logs and alerts (1/3 width) */}
        <div className="glassmorphism p-5 rounded-xl flex flex-col text-left justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-display mb-4 block">
              Recent Activity logs
            </span>
            <div className="space-y-4">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                    act.type === 'attendance' ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-600' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600'
                  }`}>
                    {act.type === 'attendance' ? <Clock className="w-4 h-4" /> : <CalendarRange className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">{act.text}</span>
                    <span className="text-[10px] text-slate-400">{act.time}</span>
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <span className="text-xs text-slate-450 block text-center py-8">No events logged today.</span>
              )}
            </div>
          </div>
          
          <Link to="/attendance" className="text-xs text-violet-650 font-semibold flex items-center gap-1 mt-4 hover:underline">
            <span>View detailed attendance board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* --- LEAVE REQUEST MODAL --- */}
      <Modal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title="Apply for Leave"
      >
        <div className="space-y-4">
          <Select
            label="Leave Type"
            options={[
              { value: 'CASUAL', label: 'Casual Leave' },
              { value: 'SICK', label: 'Sick Leave' },
              { value: 'ANNUAL', label: 'Annual Paid Leave' }
            ]}
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as any)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Reason for request
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800 dark:text-slate-100 placeholder-slate-400"
              placeholder="Provide context for approval"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              onClick={() => setLeaveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => leaveMutation.mutate()}
              isLoading={leaveMutation.isPending}
            >
              Submit Application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default Dashboard;
