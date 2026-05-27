import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  Key,
  Mail,
  ShieldAlert,
  Users,
  BarChart3,
  CalendarCheck,
  Wallet,
  ArrowRight
} from 'lucide-react';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { useAppDispatch, useAppSelector } from '../app/store';
import { loginStart, loginSuccess, loginFailure } from '../app/store/authSlice';
import { addToast } from '../app/store/notificationSlice';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(3, 'Password must be at least 3 characters')
});

type LoginFormValues = z.infer<typeof loginSchema>;


const MOCK_CREDENTIALS: Record<string, {
  password: string;
  user: { id: string; name: string; email: string; role: string; department: string; designation: string; avatar: string }
}> = {
  'admin@hrms.com': {
    password: 'admin123',
    user: { id: 'emp-admin', name: 'Admin User', email: 'admin@hrms.com', role: 'ADMIN', department: 'Executive', designation: 'CEO', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200' }
  },
  'hr@hrms.com': {
    password: 'hr123',
    user: { id: 'emp-hr', name: 'Sarah Jenkins', email: 'hr@hrms.com', role: 'HR_MANAGER', department: 'Human Resources', designation: 'HR Director', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' }
  },
  'lead@hrms.com': {
    password: 'lead123',
    user: { id: 'emp-lead', name: 'David Chen', email: 'lead@hrms.com', role: 'TEAM_LEAD', department: 'Engineering', designation: 'Lead Engineer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' }
  },
  'employee@hrms.com': {
    password: 'employee123',
    user: { id: 'emp-emp', name: 'Alex River', email: 'employee@hrms.com', role: 'EMPLOYEE', department: 'Engineering', designation: 'Software Engineer', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' }
  }
};

function mockAuthFallback(email: string, password: string) {
  const entry = MOCK_CREDENTIALS[email.toLowerCase()];
  if (entry && (entry.password === password || password === 'password123')) {
    return { user: entry.user, token: `mock-jwt-token-for-${entry.user.id}-${entry.user.role}` };
  }
  return null;
}

const FEATURES = [
  { icon: <Users className="w-4 h-4" />, label: 'Employee Management', desc: 'Full workforce directory & profiles' },
  { icon: <CalendarCheck className="w-4 h-4" />, label: 'Attendance Tracking', desc: 'Real-time punch-in/out & reports' },
  { icon: <BarChart3 className="w-4 h-4" />, label: 'Analytics Dashboard', desc: 'KPIs, charts & department insights' },
  { icon: <Wallet className="w-4 h-4" />, label: 'Payroll Processing', desc: 'Salary disbursements & payslips' },
];

export const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useAppSelector((state) => state.auth);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const from = location.state?.from?.pathname || '/dashboard';

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      dispatch(loginStart());
      try {
        const res = await apiClient.post(ENDPOINTS.LOGIN, values);
        return res.data;
      } catch (networkErr: any) {
        console.warn('[Login] MSW failed, using fallback auth:', networkErr?.message);
        const fallback = mockAuthFallback(values.email, values.password);
        if (fallback) return fallback;
        throw { message: 'Invalid email or password. Please check your credentials.' };
      }
    },
    onSuccess: (data) => {
      dispatch(loginSuccess(data));
      dispatch(addToast({
        title: 'Welcome Back!',
        message: `Logged in as ${data.user.name} (${data.user.role.replace('_', ' ')}).`,
        type: 'success'
      }));
      navigate(from, { replace: true });
    },
    onError: (err: any) => {
      const msg = err.message || 'Login failed. Please check your credentials.';
      dispatch(loginFailure(msg));
      dispatch(addToast({ title: 'Authentication Failed', message: msg, type: 'error' }));
    }
  });

  const onSubmit = (values: LoginFormValues) => loginMutation.mutate(values);

  const fillCredentials = (role: 'ADMIN' | 'HR' | 'LEAD' | 'EMPLOYEE') => {
    const creds = {
      ADMIN:    { email: 'admin@hrms.com',    pass: 'admin123' },
      HR:       { email: 'hr@hrms.com',       pass: 'hr123' },
      LEAD:     { email: 'lead@hrms.com',     pass: 'lead123' },
      EMPLOYEE: { email: 'employee@hrms.com', pass: 'employee123' }
    };
    setValue('email', creds[role].email);
    setValue('password', creds[role].pass);
  };

  return (
    <div className="min-h-screen flex bg-slate-950 overflow-hidden">

      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950" />

        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />

        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/40">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-lg font-display leading-none block">Quantum Innovations</span>
              <span className="text-violet-400 text-[10px] font-medium tracking-widest uppercase">HR Management System</span>
            </div>
          </div>

          <div className="space-y-4 mb-12">
            <h1 className="text-4xl font-bold text-white font-display leading-tight tracking-tight">
              Manage your entire<br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                workforce in one place
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              A unified enterprise platform for HR operations — from onboarding to payroll, attendance to analytics.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-violet-400 shrink-0 group-hover:bg-violet-600/20 group-hover:border-violet-500/30 transition-all">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-none mb-0.5">{f.label}</p>
                  <p className="text-[11px] text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-8 pt-8 border-t border-white/5">
          {[
            { value: '26+', label: 'Employees' },
            { value: '6', label: 'Departments' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xl font-bold text-white font-display">{stat.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative bg-slate-950">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">

          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base font-display">Quantum Innovations</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white font-display tracking-tight mb-1">
              Sign in to your account
            </h2>
            <p className="text-sm text-slate-500">
              Enter your credentials to access the HR portal
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  {...register('email')}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900 border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-rose-500/50 focus:ring-rose-500/20'
                      : 'border-slate-800 focus:border-violet-500/50 focus:ring-violet-500/20'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900 border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-rose-500/50 focus:ring-rose-500/20'
                      : 'border-slate-800 focus:border-violet-500/50 focus:ring-violet-500/20'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || loginMutation.isPending}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-violet-600/25 cursor-pointer"
            >
              {loading || loginMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Quick Demo Access</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { role: 'ADMIN' as const,    label: 'Administrator', sub: 'Full system access',    color: 'violet' },
              { role: 'HR' as const,       label: 'HR Manager',    sub: 'Employee & payroll',    color: 'blue' },
              { role: 'LEAD' as const,     label: 'Team Lead',     sub: 'Team approvals',        color: 'emerald' },
              { role: 'EMPLOYEE' as const, label: 'Employee',      sub: 'Self-service access',   color: 'amber' },
            ].map(({ role, label, sub, color }) => (
              <button
                key={role}
                type="button"
                onClick={() => fillCredentials(role)}
                className="group flex flex-col gap-1 p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{label}</span>
                  <div className={`w-1.5 h-1.5 rounded-full bg-${color}-500`} />
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors">{sub}</span>
              </button>
            ))}
          </div>

          <p className="text-center text-[10px] text-slate-700 mt-8">
            © 2026 Quantum Innovations · Enterprise HR Platform · v2.0
          </p>
        </div>
      </div>
    </div>
  );
};
export default Login;
