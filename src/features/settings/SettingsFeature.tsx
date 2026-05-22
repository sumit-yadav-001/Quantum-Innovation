import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { toggleTheme } from '../../app/store/uiSlice';
import { Button } from '../../components/ui/Button';
import { Sun, Moon, Bell, Lock, User } from 'lucide-react';

const SettingsFeature: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.ui);
  const { user } = useAppSelector((state) => state.auth);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your preferences and account settings</p>
      </div>

      {/* Account Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-violet-600" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Account</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Name</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{user?.name}</p>
            </div>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
          <div className="flex justify-between items-center py-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Email</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
          <div className="flex justify-between items-center py-4">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Role</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          {theme === 'light' ? (
            <Sun className="w-5 h-5 text-violet-600" />
          ) : (
            <Moon className="w-5 h-5 text-violet-600" />
          )}
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h2>
        </div>
        <div className="flex justify-between items-center py-4">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Theme</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Current: {theme === 'light' ? 'Light' : 'Dark'}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => dispatch(toggleTheme())}>
            Toggle Theme
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-violet-600" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Email Notifications</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Receive updates via email</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-violet-600"
            />
          </div>
          <div className="flex justify-between items-center py-4">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Push Notifications</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Receive browser notifications</p>
            </div>
            <input
              type="checkbox"
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-violet-600"
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-violet-600" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Password</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Last changed 30 days ago</p>
            </div>
            <Button variant="outline" size="sm">Change</Button>
          </div>
          <div className="flex justify-between items-center py-4">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Two-Factor Authentication</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsFeature;
