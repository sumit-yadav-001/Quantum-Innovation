import React, { useState } from 'react';
import { useAttendance, useAttendanceStats, useCheckIn, useCheckOut } from '../../hooks';
import { Button } from '../../components/ui/Button';
import { LogIn, LogOut, Calendar, BarChart3 } from 'lucide-react';
import { formatDate, formatTime } from '../../utils/helpers';

const AttendanceFeature: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: attendance, isLoading } = useAttendance({ date });
  const { data: stats } = useAttendanceStats();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const handleQuickCheckIn = async () => {
    try {
      await checkInMutation.mutateAsync('emp-emp'); // Default employee ID
      // Show toast notification
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleQuickCheckOut = async () => {
    try {
      await checkOutMutation.mutateAsync('emp-emp');
    } catch (error) {
      console.error('Check-out failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Attendance</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Track and manage employee attendance</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Attendance Rate</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.presentPercentage || 0}%</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Present Today</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.totalPresents || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Absent</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats?.totalAbsents || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Late</p>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats?.totalLates || 0}</p>
        </div>
      </div>

      {/* Quick Punch */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Quick Punch</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <Button
            variant="secondary"
            size="lg"
            leftIcon={<LogIn className="w-5 h-5" />}
            onClick={handleQuickCheckIn}
            isLoading={checkInMutation.isPending}
          >
            Check In
          </Button>
          <Button
            variant="secondary"
            size="lg"
            leftIcon={<LogOut className="w-5 h-5" />}
            onClick={handleQuickCheckOut}
            isLoading={checkOutMutation.isPending}
          >
            Check Out
          </Button>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Today's Attendance</h3>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 rounded-lg"
          />
        </div>

        {isLoading ? (
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        ) : attendance?.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">No attendance records for this date</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left py-3 text-slate-700 dark:text-slate-300 font-medium">Employee</th>
                  <th className="text-left py-3 text-slate-700 dark:text-slate-300 font-medium">Check In</th>
                  <th className="text-left py-3 text-slate-700 dark:text-slate-300 font-medium">Check Out</th>
                  <th className="text-left py-3 text-slate-700 dark:text-slate-300 font-medium">Total Hours</th>
                  <th className="text-left py-3 text-slate-700 dark:text-slate-300 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {attendance?.map((record: any) => (
                  <tr key={record.id}>
                    <td className="py-3 text-slate-900 dark:text-white">{record.employeeName}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{formatTime(record.checkIn)}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{formatTime(record.checkOut)}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{record.totalHours}h</td>
                    <td className="py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.status === 'PRESENT'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : record.status === 'ABSENT'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : record.status === 'LATE'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
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

export default AttendanceFeature;
