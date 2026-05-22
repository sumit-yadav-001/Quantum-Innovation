import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Key, Mail, ShieldAlert } from 'lucide-react';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { useAppDispatch, useAppSelector } from '../app/store';
import { loginStart, loginSuccess, loginFailure } from '../app/store/authSlice';
import { addToast } from '../app/store/notificationSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useAppSelector((state) => state.auth);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Calculate redirection path
  const from = location.state?.from?.pathname || '/dashboard';

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      dispatch(loginStart());
      const res = await apiClient.post(ENDPOINTS.LOGIN, values);
      return res.data;
    },
    onSuccess: (data) => {
      dispatch(loginSuccess(data));
      dispatch(
        addToast({
          title: 'Welcome Back!',
          message: `Logged in as ${data.user.name} (${data.user.role.replace('_', ' ')}).`,
          type: 'success'
        })
      );
      navigate(from, { replace: true });
    },
    onError: (err: any) => {
      const msg = err.message || 'Login failed. Please check your credentials.';
      dispatch(loginFailure(msg));
      dispatch(
        addToast({
          title: 'Authentication Failed',
          message: msg,
          type: 'error'
        })
      );
    }
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const fillCredentials = (role: 'ADMIN' | 'HR' | 'LEAD' | 'EMPLOYEE') => {
    const creds = {
      ADMIN: { email: 'admin@hrms.com', pass: 'admin123' },
      HR: { email: 'hr@hrms.com', pass: 'hr123' },
      LEAD: { email: 'lead@hrms.com', pass: 'lead123' },
      EMPLOYEE: { email: 'employee@hrms.com', pass: 'employee123' }
    };
    
    setValue('email', creds[role].email);
    setValue('password', creds[role].pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background Graphic Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-violet-500/10 dark:bg-violet-400/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[35rem] h-[35rem] rounded-full bg-indigo-500/10 dark:bg-indigo-400/5 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-violet-650 flex items-center justify-center shadow-lg shadow-violet-500/25 mb-4 animate-bounce">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100 mb-1 leading-none">
            AuraHR Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sign in to manage your workplace operations
          </p>
        </div>

        {/* Card Frame */}
        <div className="glassmorphism p-8 rounded-2xl shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-lg text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="relative">
              <Input
                label="Corporate Email"
                placeholder="you@company.com"
                error={errors.email?.message}
                {...register('email')}
                className="pl-10"
              />
              <Mail className="absolute left-3 top-[34px] w-4 h-4 text-slate-400" />
            </div>

            <div className="relative">
              <Input
                label="Access Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
                className="pl-10"
              />
              <Key className="absolute left-3 top-[34px] w-4 h-4 text-slate-400" />
            </div>

            <Button
              type="submit"
              className="w-full mt-2 cursor-pointer"
              isLoading={loading}
            >
              Sign In to System
            </Button>
          </form>

          {/* Quick Demo Shortcuts */}
          <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block text-center mb-3">
              Quick Demo Login
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('ADMIN')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-850 hover:bg-violet-50/20 dark:hover:bg-violet-950/10 text-xs font-medium text-slate-650 dark:text-slate-350 transition-all cursor-pointer text-left flex flex-col gap-0.5"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Administrator</span>
                <span className="text-[9px] text-slate-400">admin@hrms.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('HR')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-850 hover:bg-violet-50/20 dark:hover:bg-violet-950/10 text-xs font-medium text-slate-650 dark:text-slate-350 transition-all cursor-pointer text-left flex flex-col gap-0.5"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">HR Manager</span>
                <span className="text-[9px] text-slate-400">hr@hrms.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('LEAD')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-850 hover:bg-violet-50/20 dark:hover:bg-violet-950/10 text-xs font-medium text-slate-650 dark:text-slate-350 transition-all cursor-pointer text-left flex flex-col gap-0.5"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Team Lead</span>
                <span className="text-[9px] text-slate-400">lead@hrms.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('EMPLOYEE')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-850 hover:bg-violet-50/20 dark:hover:bg-violet-950/10 text-xs font-medium text-slate-650 dark:text-slate-350 transition-all cursor-pointer text-left flex flex-col gap-0.5"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Employee</span>
                <span className="text-[9px] text-slate-400">employee@hrms.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
