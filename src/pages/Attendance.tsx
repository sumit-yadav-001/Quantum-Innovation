import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import { 
  Clock, 
  Search, 
  Download
} from 'lucide-react';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { useAppSelector, useAppDispatch } from '../app/store';
import { addToast } from '../app/store/notificationSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Loader } from '../components/ui/Loader';
import type { AttendanceRecord } from '../types';

export const Attendance: React.FC = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const todayStr = '2026-05-22';
  const [filterDate, setFilterDate] = useState(todayStr);
  const [employeeSearch, setEmployeeSearch] = useState('');

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER' || user?.role === 'TEAM_LEAD';

  // 1. Fetch Today's Attendance logs (For Admin/HR)
  const { data: allAttendance = [], isLoading: allLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', { date: filterDate }],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.ATTENDANCE, { params: { date: filterDate } });
      // MSW returns array directly — handle both array and wrapped object
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw?.data ?? []);
    },
    enabled: isAdminOrHR
  });

  // 2. Fetch My Personal Attendance Logs (For Employees)
  const { data: myAttendance = [], isLoading: myLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', { employeeId: user?.id }],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.ATTENDANCE, { params: { employeeId: user?.id } });
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw?.data ?? []);
    },
    enabled: !!user?.id
  });

  // 3. Fetch Personal/Company Stats
  const { data: attStatsRes } = useQuery({
    queryKey: ['attendanceStats', { employeeId: isAdminOrHR ? '' : user?.id }],
    queryFn: async () => {
      const params = isAdminOrHR ? {} : { employeeId: user?.id };
      const res = await apiClient.get(ENDPOINTS.ATTENDANCE_STATS, { params });
      return res.data;
    }
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
      queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });
      dispatch(
        addToast({
          title: action === 'IN' ? 'Checked In' : 'Checked Out',
          message: `Your check-${action.toLowerCase()} has been logged.`,
          type: 'success'
        })
      );
    },
    onError: (err: any) => {
      dispatch(addToast({ title: 'Action Failed', message: err.message, type: 'error' }));
    }
  });

  const stats = attStatsRes || { presentPercentage: 0, totalPresents: 0, totalLates: 0, totalLeaves: 0, totalAbsents: 0 };

  // Filter attendance log by search query — safe array check
  const safeAllAttendance = Array.isArray(allAttendance) ? allAttendance : [];
  const safeMyAttendance = Array.isArray(myAttendance) ? myAttendance : [];

  const filteredAttendance = safeAllAttendance.filter((rec) =>
    rec.employeeName?.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  // Check today's punch state for the logged in user
  const personalTodayRecord = safeMyAttendance.find((rec) => rec.date === todayStr);
  const isPunchedIn = personalTodayRecord && personalTodayRecord.checkIn && !personalTodayRecord.checkOut;
  const isPunchedOut = personalTodayRecord && personalTodayRecord.checkIn && personalTodayRecord.checkOut;

  // Render Attendance Status Icon
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="success">PRESENT</Badge>;
      case 'LATE':
        return <Badge variant="warning">LATE</Badge>;
      case 'LEAVE':
        return <Badge variant="info">LEAVE</Badge>;
      case 'ABSENT':
        return <Badge variant="danger">ABSENT</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleExportCSV = () => {
    dispatch(addToast({ title: 'Exporting Logs', message: 'Downloading CSV logs...', type: 'info' }));
    const dataToParse = isAdminOrHR ? safeAllAttendance : safeMyAttendance;
    const csv = Papa.unparse(dataToParse);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Attendance_Report_${filterDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (allLoading || myLoading) {
    return <Loader message="Opening attendance logbook..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">
            Attendance Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAdminOrHR 
              ? "Verify employee clock-in hours, daily records, and generate logs." 
              : "Review your personal clock-in stats, punch details, and histories."
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Punch Panel (for self service) */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
            <Clock className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold">
              {isPunchedOut ? 'Shift Done' : isPunchedIn ? 'Working...' : 'Not Clocked In'}
            </span>
            <Button
              size="sm"
              variant={isPunchedIn ? 'danger' : 'primary'}
              disabled={!!isPunchedOut || punchMutation.isPending}
              onClick={() => punchMutation.mutate(isPunchedIn ? 'OUT' : 'IN')}
              className="text-[11px] px-2.5 py-1 font-bold"
            >
              {isPunchedOut ? 'Completed' : isPunchedIn ? 'Punch Out' : 'Punch In'}
            </Button>
          </div>

          <Button 
            onClick={handleExportCSV} 
            variant="outline"
            className="gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download CSV</span>
          </Button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-left">
        <div className="glassmorphism p-4 rounded-xl flex flex-col justify-between h-24">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
          <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-display">{stats.presentPercentage}%</span>
          <span className="text-[9px] text-slate-400">Overall rate</span>
        </div>
        <div className="glassmorphism p-4 rounded-xl flex flex-col justify-between h-24">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Present Days</span>
          <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-display">{stats.totalPresents}</span>
          <span className="text-[9px] text-slate-400">Punches logged</span>
        </div>
        <div className="glassmorphism p-4 rounded-xl flex flex-col justify-between h-24">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Late Arrivals</span>
          <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-display">{stats.totalLates}</span>
          <span className="text-[9px] text-slate-400">Past 9:30 AM clock-in</span>
        </div>
        <div className="glassmorphism p-4 rounded-xl flex flex-col justify-between h-24">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Approved Leaves</span>
          <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-display">{stats.totalLeaves}</span>
          <span className="text-[9px] text-slate-400">Authorized absences</span>
        </div>
        <div className="glassmorphism p-4 rounded-xl flex flex-col justify-between h-24">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Absences</span>
          <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-display">{stats.totalAbsents}</span>
          <span className="text-[9px] text-slate-400">Unexcused leaves</span>
        </div>
      </div>

      {/* Main Roster Logs (For admin/hr/lead) */}
      {isAdminOrHR ? (
        <div className="space-y-4 text-left">
          {/* Query Filter panel */}
          <div className="glassmorphism p-4 rounded-xl flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
              <Input
                label="Filter by Date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="w-full md:w-1/2">
              <div className="relative">
                <Input
                  label="Search Employee Name"
                  placeholder="Type name here..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="pl-9"
                />
                <Search className="absolute left-3 top-[34px] w-4 h-4 text-slate-400" />
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setFilterDate(todayStr);
                setEmployeeSearch('');
              }}
              className="shrink-0"
            >
              Reset Filters
            </Button>
          </div>

          {/* Records Table */}
          <div className="glassmorphism rounded-xl overflow-hidden">
            {filteredAttendance.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No attendance clock events on this date.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Employee Name</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Clock In</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Clock Out</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Logged Hours</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                    {filteredAttendance.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/30">
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-350">{rec.employeeName}</td>
                        <td className="px-6 py-4 font-mono text-xs">{rec.checkIn || '--:--'}</td>
                        <td className="px-6 py-4 font-mono text-xs">{rec.checkOut || '--:--'}</td>
                        <td className="px-6 py-4">{rec.totalHours > 0 ? `${rec.totalHours} hrs` : '--'}</td>
                        <td className="px-6 py-4">{getStatusBadge(rec.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Personal Logs Table (For self-service Employee) */
        <div className="glassmorphism rounded-xl overflow-hidden text-left">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">My Personal Clock History</span>
          </div>
          {safeMyAttendance.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No logs clocked for this profile.</div>
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
                  {safeMyAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/30">
                      <td className="px-6 py-3.5 font-semibold">{rec.date}</td>
                      <td className="px-6 py-3.5 font-mono text-xs">{rec.checkIn || '--:--'}</td>
                      <td className="px-6 py-3.5 font-mono text-xs">{rec.checkOut || '--:--'}</td>
                      <td className="px-6 py-3.5">{rec.totalHours > 0 ? `${rec.totalHours} hrs` : '--'}</td>
                      <td className="px-6 py-3.5">{getStatusBadge(rec.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default Attendance;
