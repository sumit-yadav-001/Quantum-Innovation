import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Sun, 
  Moon, 
  ShieldAlert, 
  Save, 
  Database,
  Camera,
  Trash2
} from 'lucide-react';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { useAppSelector, useAppDispatch } from '../app/store';
import { setTheme } from '../app/store/uiSlice';
import { loginSuccess } from '../app/store/authSlice';
import { addToast } from '../app/store/notificationSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { resetDB } from '../mocks/db';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.ui);

  // Tabs
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'system'>('profile');

  // Form States - Profile
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState('+1 (555) 019-9000');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [avatarError, setAvatarError] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form with user state changes (e.g. after login)
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfileAvatar(user.avatar || '');
      setAvatarError(false);
    }
  }, [user?.id]);

  // Handle local file selection → convert to base64 data URL
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      dispatch(addToast({ title: 'Invalid File', message: 'Please select an image file (JPG, PNG, WebP).', type: 'error' }));
      return;
    }

    // Validate file size — max 2MB
    if (file.size > 2 * 1024 * 1024) {
      dispatch(addToast({ title: 'File Too Large', message: 'Image must be under 2MB.', type: 'error' }));
      return;
    }

    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setProfileAvatar(dataUrl);
      setAvatarError(false);
      setAvatarUploading(false);
      dispatch(addToast({ title: 'Photo Selected', message: 'Click "Save Profile Changes" to apply.', type: 'info' }));
    };
    reader.onerror = () => {
      setAvatarUploading(false);
      dispatch(addToast({ title: 'Read Error', message: 'Could not read the selected file.', type: 'error' }));
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    setProfileAvatar('');
    setAvatarError(false);
  };

  // Form States - Preferences
  const [prefEmailNotifs, setPrefEmailNotifs] = useState(true);
  const [prefWeeklyDigest, setPrefWeeklyDigest] = useState(false);
  const [prefPunchReminders, setPrefPunchReminders] = useState(true);
  const [prefCompactDensity, setPrefCompactDensity] = useState(false);

  // Load preferences from localStorage if exists
  useEffect(() => {
    const savedPrefs = localStorage.getItem('hrms_user_preferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPrefEmailNotifs(parsed.emailNotifs ?? true);
        setPrefWeeklyDigest(parsed.weeklyDigest ?? false);
        setPrefPunchReminders(parsed.punchReminders ?? true);
        setPrefCompactDensity(parsed.compactDensity ?? false);
      } catch (e) {
        // use default values
      }
    }
  }, []);

  // Fetch the current user employee phone details (since it's not in the main user session token)
  useEffect(() => {
    if (user?.id) {
      apiClient.get(`${ENDPOINTS.EMPLOYEES}/${user.id}`)
        .then(res => {
          if (res.data?.phone) {
            setProfilePhone(res.data.phone);
          }
        })
        .catch(() => {
          // ignore or keep default
        });
    }
  }, [user]);

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { name: string; email: string; phone: string; avatar: string }) => {
      const res = await apiClient.put(`${ENDPOINTS.EMPLOYEES}/${user?.id}`, payload);
      return res.data;
    },
    onSuccess: (updatedEmp) => {
      // Sync auth store with updated profile
      if (user && token) {
        const updatedUserObj = {
          ...user,
          name: updatedEmp.name,
          email: updatedEmp.email,
          avatar: updatedEmp.avatar || user.avatar
        };
        dispatch(loginSuccess({ user: updatedUserObj, token }));
      }
      setAvatarError(false);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      
      dispatch(addToast({
        title: 'Profile Updated',
        message: 'Personal details and credentials have been updated.',
        type: 'success'
      }));
    },
    onError: (err: any) => {
      dispatch(addToast({
        title: 'Save Failed',
        message: err.message || 'Could not save profile changes.',
        type: 'error'
      }));
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail) {
      alert('Name and Email are required.');
      return;
    }
    updateProfileMutation.mutate({
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
      avatar: profileAvatar
    });
  };

  const handleSavePreferences = () => {
    const preferencesObj = {
      emailNotifs: prefEmailNotifs,
      weeklyDigest: prefWeeklyDigest,
      punchReminders: prefPunchReminders,
      compactDensity: prefCompactDensity
    };
    localStorage.setItem('hrms_user_preferences', JSON.stringify(preferencesObj));
    dispatch(addToast({
      title: 'Preferences Saved',
      message: 'System alerts and dashboard preferences updated.',
      type: 'success'
    }));
  };

  const handleResetDatabase = () => {
    if (confirm('WARNING: This will erase all modifications (new employees, leave requests, logs) and restore the mock database seed. Proceed?')) {
      resetDB();
      // Reload page to re-initialize
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure profile details, dashboard preferences, system themes, and settings.
        </p>
      </div>

      {/* Tabs list */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-2 text-sm font-semibold border-b-2 px-1 transition-all cursor-pointer ${
            activeTab === 'profile' 
              ? 'border-violet-600 text-violet-650 dark:text-violet-400' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Personal Profile</span>
          </span>
        </button>
        
        <button
          onClick={() => setActiveTab('preferences')}
          className={`pb-2 text-sm font-semibold border-b-2 px-1 transition-all cursor-pointer ${
            activeTab === 'preferences' 
              ? 'border-violet-600 text-violet-650 dark:text-violet-400' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>Preferences</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`pb-2 text-sm font-semibold border-b-2 px-1 transition-all cursor-pointer ${
            activeTab === 'system' 
              ? 'border-violet-600 text-violet-650 dark:text-violet-400' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            <span>System Console</span>
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Tab Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PROFILE PANEL */}
          {activeTab === 'profile' && (
            <div className="glassmorphism p-6 rounded-xl space-y-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Profile Information
              </h2>
              
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {/* Avatar Upload Section */}
                <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-slate-100 dark:border-slate-800 pb-6">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />

                  {/* Clickable Avatar */}
                  <div className="relative group shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {/* Avatar image or initials fallback */}
                    {profileAvatar && !avatarError ? (
                      <img
                        src={profileAvatar}
                        alt={profileName || 'Profile'}
                        onError={() => setAvatarError(true)}
                        onLoad={() => setAvatarError(false)}
                        className="w-24 h-24 rounded-full object-cover border-2 border-violet-200 dark:border-violet-800 shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center border-2 border-violet-200 dark:border-violet-800 shadow-lg">
                        <span className="text-3xl font-bold text-white select-none">
                          {(profileName || user?.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                      {avatarUploading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-white" />
                          <span className="text-[9px] text-white font-semibold tracking-wide">CHANGE</span>
                        </>
                      )}
                    </div>

                    {/* Online dot */}
                    <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  </div>

                  {/* Info + actions */}
                  <div className="flex flex-col gap-2 text-center sm:text-left">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{profileName || user?.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user?.designation} · {user?.department}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Upload Photo
                      </button>
                      {profileAvatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      JPG, PNG or WebP · Max 2MB · Click photo or button to upload
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                  />

                  <Input
                    label="Corporate Email Address"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                  />

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Security Access Level</label>
                    <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 font-semibold text-sm">
                      {user?.role.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</label>
                    <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 font-semibold text-xs capitalize">
                      {user?.department || 'N/A'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Designation</label>
                    <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 font-semibold text-xs">
                      {user?.designation || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    isLoading={updateProfileMutation.isPending}
                    className="gap-1.5 cursor-pointer bg-violet-650 hover:bg-violet-750"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* PREFERENCES PANEL */}
          {activeTab === 'preferences' && (
            <div className="glassmorphism p-6 rounded-xl space-y-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                System Preferences & Alerts
              </h2>
              
              <div className="space-y-4">
                {/* Preference switches */}
                <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Email System Alerts</span>
                    <p className="text-[11px] text-slate-450">Receive automated copies of leave approvals and payslips via mail.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={prefEmailNotifs}
                    onChange={(e) => setPrefEmailNotifs(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Weekly Performance Summaries</span>
                    <p className="text-[11px] text-slate-455">Subscribes to weekly department attendance and KPI stats reporting.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={prefWeeklyDigest}
                    onChange={(e) => setPrefWeeklyDigest(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">SMS Punch Reminders</span>
                    <p className="text-[11px] text-slate-450">Receive notifications on mobile to check in at mornings and punch out at evenings.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={prefPunchReminders}
                    onChange={(e) => setPrefPunchReminders(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Compact Table Layout</span>
                    <p className="text-[11px] text-slate-450">Removes spacing in data grids to display more records simultaneously.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={prefCompactDensity}
                    onChange={(e) => setPrefCompactDensity(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
                  <Button
                    onClick={handleSavePreferences}
                    className="gap-1.5 cursor-pointer bg-violet-650 hover:bg-violet-750"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Preference Settings</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM CONSOLE */}
          {activeTab === 'system' && (
            <div className="glassmorphism p-6 rounded-xl space-y-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Developer & Administrator Console
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-3">
                  <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span>Danger Zone: Mock Database Control</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    This action deletes all locally cached data in `localStorage` (`hrms_mock_db` key), including updates, check-ins, leaves, and custom departments. It regenerates a fresh, randomized seed dataset of 25+ employees, payroll logs, and workflows.
                  </p>
                  <Button
                    onClick={handleResetDatabase}
                    variant="danger"
                    size="sm"
                    className="gap-1.5 cursor-pointer"
                  >
                    <Database className="w-4 h-4" />
                    <span>Reset & Re-Seed Local Database</span>
                  </Button>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-slate-700 dark:text-slate-350">Mock Credentials Guide</h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                    <li><strong>Admin User:</strong> admin@hrms.com | pwd: admin123</li>
                    <li><strong>HR Director:</strong> hr@hrms.com | pwd: hr123</li>
                    <li><strong>Team Lead:</strong> lead@hrms.com | pwd: lead123</li>
                    <li><strong>Employee User:</strong> employee@hrms.com | pwd: employee123</li>
                    <li><strong>Other Employees:</strong> (email from directory) | pwd: password123</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar Info Card */}
        <div className="glassmorphism p-5 rounded-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/20 text-violet-600 flex items-center justify-center shrink-0">
              <SettingsIcon className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-805 dark:text-white">Quantum Innovations Theme Selection</h3>
              <p className="text-[10px] text-slate-400 font-medium">Synchronized theme controller</p>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 leading-normal">
            Switch between Light and Dark visual aesthetics. Switching modes shifts the document style tokens instantly without layout jumps.
          </p>

          <hr className="border-slate-100 dark:border-slate-850" />

          {/* Theme button */}
          <div className="flex gap-2">
            <button
              onClick={() => dispatch(setTheme('light'))}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                theme === 'light'
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Mode</span>
            </button>

            <button
              onClick={() => dispatch(setTheme('dark'))}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Settings;
