import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarDays, 
  Receipt, 
  Network, 
  FolderOpen, 
  Settings, 
  LogOut, 
  Menu, 
  ChevronLeft, 
  Bell, 
  Sun, 
  Moon, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../app/store';
import { toggleSidebar, toggleTheme } from '../../app/store/uiSlice';
import { logout } from '../../app/store/authSlice';
import { ToastContainer } from './ToastContainer';
import { addToast } from '../../app/store/notificationSlice';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/axios';
import type { SystemNotification } from '../../types';
import { Badge } from '../ui/Badge';

export const MainLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { user } = useAppSelector((state) => state.auth);
  const { sidebarOpen, theme } = useAppSelector((state) => state.ui);

  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Fetch Notifications via TanStack Query
  const { data: notifications = [] } = useQuery<SystemNotification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/api/notifications');
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw?.data ?? []);
    },
    refetchInterval: 15000 // poll every 15s to simulate real-time
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 2. Mark notification as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleLogout = () => {
    dispatch(logout());
    dispatch(
      addToast({
        title: 'Logged Out',
        message: 'You have logged out of the session successfully.',
        type: 'info'
      })
    );
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['ADMIN', 'HR_MANAGER', 'TEAM_LEAD', 'EMPLOYEE'] },
    { label: 'Employees', path: '/employees', icon: <Users className="w-5 h-5" />, roles: ['ADMIN', 'HR_MANAGER'] },
    { label: 'Attendance', path: '/attendance', icon: <Clock className="w-5 h-5" />, roles: ['ADMIN', 'HR_MANAGER', 'TEAM_LEAD', 'EMPLOYEE'] },
    { label: 'Leaves', path: '/leaves', icon: <CalendarDays className="w-5 h-5" />, roles: ['ADMIN', 'HR_MANAGER', 'TEAM_LEAD', 'EMPLOYEE'] },
    { label: 'Payroll', path: '/payroll', icon: <Receipt className="w-5 h-5" />, roles: ['ADMIN', 'HR_MANAGER', 'TEAM_LEAD', 'EMPLOYEE'] },
    { label: 'Departments', path: '/departments', icon: <Network className="w-5 h-5" />, roles: ['ADMIN', 'HR_MANAGER', 'TEAM_LEAD'] },
    { label: 'Documents', path: '/documents', icon: <FolderOpen className="w-5 h-5" />, roles: ['ADMIN', 'HR_MANAGER', 'TEAM_LEAD', 'EMPLOYEE'] },
    { label: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" />, roles: ['ADMIN', 'HR_MANAGER', 'TEAM_LEAD', 'EMPLOYEE'] }
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      {/* Toast container floater */}
      <ToastContainer />

      {/* --- SIDEBAR FOR DESKTOP --- */}
      <aside 
        className={`hidden md:flex flex-col border-r border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 transition-all duration-300 z-30 shrink-0 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="font-bold font-display text-lg tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Quantum Innovations
              </span>
            )}
          </div>
          {sidebarOpen && (
            <button 
              onClick={() => dispatch(toggleSidebar())}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-350'}`}>
                  {item.icon}
                </span>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs font-semibold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-45 shadow-md">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Expand button if collapsed */}
        {!sidebarOpen && (
          <div className="p-4 border-t border-slate-250 dark:border-slate-800 flex justify-center">
            <button 
              onClick={() => dispatch(toggleSidebar())}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>
        )}
      </aside>

      {/* --- SIDEBAR FOR MOBILE --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 bg-white dark:bg-slate-900 h-full flex flex-col border-r border-slate-200 dark:border-slate-800 z-50 animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center px-5 justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-slate-850 dark:text-white">Quantum Innovations</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-600 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-850'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* --- MAIN PAGE WORKSPACE --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* HEADER */}
        <header className="h-16 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm md:text-base font-semibold text-slate-600 dark:text-slate-350 capitalize font-display">
              {location.pathname.replace('/', '').split('/')[0] || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Dark Mode toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifPanelOpen(!notifPanelOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all relative cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {notifPanelOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifPanelOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl z-40 py-2 animate-in fade-in slide-in-from-top-5 duration-200">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <Badge variant="info" className="text-[10px]">{unreadCount} Unread</Badge>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs text-slate-400">
                          No notifications at this time.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => {
                              if (!notif.read) markReadMutation.mutate(notif.id);
                              setNotifPanelOpen(false);
                            }}
                            className={`px-4 py-3 border-b border-slate-50 dark:border-slate-850/50 hover:bg-slate-50 dark:hover:bg-slate-850/50 cursor-pointer flex flex-col gap-0.5 text-left transition-colors ${
                              !notif.read ? 'bg-violet-500/5 dark:bg-violet-400/5' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-200">{notif.title}</span>
                              <span className="text-[9px] text-slate-400 whitespace-nowrap">{new Date(notif.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 transition-all text-left cursor-pointer"
              >
                <img 
                  src={user?.avatar} 
                  alt={user?.name} 
                  className="w-7 h-7 rounded-full object-cover border border-violet-100 dark:border-slate-800"
                />
                <div className="hidden lg:flex flex-col pr-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-250 truncate leading-none mb-0.5">{user?.name}</span>
                  <span className="text-[9px] text-slate-450 uppercase tracking-wider font-medium leading-none">{user?.role.replace('_', ' ')}</span>
                </div>
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-45 py-1.5 animate-in fade-in slide-in-from-top-5 duration-200 text-left">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 lg:hidden">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">{user?.name}</span>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">{user?.role.replace('_', ' ')}</span>
                    </div>
                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>My Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-950/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default MainLayout;
