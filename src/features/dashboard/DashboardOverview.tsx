import React from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, TrendingUp, Calendar, Briefcase, AlertCircle } from 'lucide-react';
import { useDashboardStats, useRecentActivity } from '../../hooks';
import { formatCurrency } from '../../utils/helpers';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#6366f1'];

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; trend?: string }> = ({
  icon,
  label,
  value,
  trend,
}) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        {trend && <p className="text-xs text-green-600 dark:text-green-400 mt-2">{trend}</p>}
      </div>
      <div className="text-violet-600 dark:text-violet-400 text-2xl">{icon}</div>
    </div>
  </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
    {children}
  </div>
);

const DashboardOverview: React.FC = () => {
  const { data: stats, isLoading, error } = useDashboardStats();
  const { data: activities } = useRecentActivity();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-200 dark:bg-slate-700 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        <p className="text-red-700 dark:text-red-200">Failed to load dashboard statistics</p>
      </div>
    );
  }

  const dashboardData = [
    { name: 'Mon', attendance: 85 },
    { name: 'Tue', attendance: 88 },
    { name: 'Wed', attendance: 82 },
    { name: 'Thu', attendance: 90 },
    { name: 'Fri', attendance: 87 },
    { name: 'Sat', attendance: 30 },
    { name: 'Sun', attendance: 25 },
  ];

  const departmentData = [
    { name: 'Engineering', value: stats?.totalEmployees || 0 * 0.4 },
    { name: 'Sales', value: stats?.totalEmployees || 0 * 0.25 },
    { name: 'HR', value: stats?.totalEmployees || 0 * 0.15 },
    { name: 'Finance', value: stats?.totalEmployees || 0 * 0.12 },
    { name: 'Marketing', value: stats?.totalEmployees || 0 * 0.08 },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="w-8 h-8" />}
          label="Total Employees"
          value={stats?.totalEmployees || 0}
          trend={`${stats?.activeEmployees || 0} active`}
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8" />}
          label="Avg Attendance"
          value={`${stats?.avgAttendance || 0}%`}
          trend="↑ 2% from last week"
        />
        <StatCard
          icon={<Calendar className="w-8 h-8" />}
          label="Pending Leaves"
          value={stats?.pendingLeaves || 0}
          trend="5 awaiting approval"
        />
        <StatCard
          icon={<Briefcase className="w-8 h-8" />}
          label="Total Payroll"
          value={formatCurrency(stats?.totalPayroll || 0)}
          trend="May 2026 processing"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Weekly Attendance Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="attendance" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Department Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name} ${entry.value}%`}
                outerRadius={80}
                fill="#8b5cf6"
                dataKey="value"
              >
                {departmentData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Payroll Expense">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { month: 'Jan', payroll: 450000 },
                { month: 'Feb', payroll: 480000 },
                { month: 'Mar', payroll: 465000 },
                { month: 'Apr', payroll: 490000 },
                { month: 'May', payroll: 510000 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="payroll" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Recent Activities">
          <div className="space-y-3">
            {activities?.slice(0, 5).map((activity: any, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-3 pb-3 border-b border-slate-200 dark:border-slate-700 last:border-0"
              >
                <div className="w-2 h-2 mt-2 rounded-full bg-violet-600 dark:bg-violet-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{activity.type}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activity.description}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default DashboardOverview;
