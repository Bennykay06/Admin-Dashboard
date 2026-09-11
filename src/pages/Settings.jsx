// src/pages/Settings.jsx - MINIMALIST SYSTEM SETTINGS
import React, { useState } from 'react';
import { updateStaffProfile } from '../data/mockData';
import supabase from '../lib/supabase';

const SETTINGS_KEY = 'resifix_global_settings';
const LEGACY_SETTINGS_KEY = 'snapfix_global_settings';

/**
 * Preferences were stored under snapfix_global_settings before the ResiFix
 * KNUST rebrand. Without this, an admin who had already tuned auto-assign or
 * evidence-required would quietly get the defaults back on the renamed build.
 * Runs at module load, so it lands before the useState initialisers below
 * read the key. The old entry is left in place — it costs nothing and keeps
 * the rename reversible.
 */
const migrateLegacySettings = () => {
  try {
    if (localStorage.getItem(SETTINGS_KEY) !== null) return;
    const legacy = localStorage.getItem(LEGACY_SETTINGS_KEY);
    if (legacy === null) return;
    JSON.parse(legacy); // a corrupt blob is not worth carrying over
    localStorage.setItem(SETTINGS_KEY, legacy);
  } catch (err) {
    // Storage disabled or private mode — defaults are a fine outcome.
  }
};

migrateLegacySettings();

export default function Settings({ user, setUser }) {
  const isSuperAdmin = user?.role === 'super_admin';

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingGlobals, setIsSavingGlobals] = useState(false);

  // Global settings state loaded from localStorage
  const [emailNotifications, setEmailNotifications] = useState(
    user?.emailNotifications !== undefined ? user.emailNotifications : true
  );

  const [autoAssign, setAutoAssign] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.autoAssign !== undefined ? parsed.autoAssign : true;
      }
    } catch (e) {}
    return true;
  });

  const [requireEvidence, setRequireEvidence] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.requireEvidence !== undefined ? parsed.requireEvidence : false;
      }
    } catch (e) {}
    return false;
  });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!name.trim() || !email.trim()) {
      setMessage({ type: 'error', text: 'Name and Email are required.' });
      return;
    }

    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (password && password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    setIsSavingProfile(true);

    try {
      const { error: profileError } = await updateStaffProfile(user.id, { name: name.trim() });
      if (profileError) throw new Error(profileError);

      // Email and password live in Supabase Auth, not the profiles table.
      const authChanges = {};
      if (email.trim().toLowerCase() !== (user.email || '').toLowerCase()) {
        authChanges.email = email.trim().toLowerCase();
      }
      if (password) {
        authChanges.password = password;
      }

      let emailPending = false;
      if (Object.keys(authChanges).length) {
        const { error: authError } = await supabase.auth.updateUser(authChanges);
        if (authError) throw new Error(authError.message);
        emailPending = Boolean(authChanges.email);
      }

      setUser({ ...user, name: name.trim() });
      setPassword('');
      setConfirmPassword('');

      setMessage({
        type: 'success',
        text: emailPending
          // Supabase sends a confirmation link before an address change
          // takes effect, so the old one keeps working until it is clicked.
          ? 'Profile updated. Check your new inbox to confirm the email change.'
          : 'Profile and credentials updated successfully!',
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not save your profile.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveGlobals = async (e) => {
    e.preventDefault();
    setIsSavingGlobals(true);
    setMessage({ type: '', text: '' });

    try {
      // Save emailNotifications to the database profile
      const { error: profileError } = await updateStaffProfile(user.id, { emailNotifications });
      if (profileError) throw new Error(profileError);
      
      // Update the user state locally so it's fresh
      setUser({ ...user, emailNotifications });

      // Simulate saving remaining global settings to localStorage
      const settings = {
        autoAssign,
        requireEvidence
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      
      setMessage({ type: 'success', text: 'Preferences updated successfully!' });

      setTimeout(() => {
        setMessage(prev => prev.text === 'Preferences updated successfully!' ? { type: '', text: '' } : prev);
      }, 4000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences.' });
    } finally {
      setIsSavingGlobals(false);
    }
  };

  return (
    <div className="font-body-md">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div>
          <h2 className="font-headline-xl text-headline-xl font-bold text-deep-charcoal tracking-tight">System Settings</h2>
          <p className="text-secondary font-body-lg mt-1">Configure your profile, reset credentials and manage system preferences</p>
        </div>
      </header>

      {message.text && (
        <div className={`p-4 rounded-xl border mb-6 text-sm font-semibold text-center transition-all ${
          message.type === 'success' 
            ? 'bg-status-success/10 border-status-success text-status-success' 
            : 'bg-status-critical/10 border-status-critical text-status-critical'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile / Credentials Settings */}
        <form onSubmit={handleSaveProfile} className="bg-white border border-outline rounded-xl p-8 flex flex-col shadow-sm">
          <h3 className="text-lg font-bold text-deep-charcoal mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined">person</span>
            Profile & Credentials
          </h3>
          
          <div className="space-y-1.5 mb-4">
            <label className="font-label-md text-black/60 block text-xs">Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              disabled={isSavingProfile}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 font-body-md focus:border-black outline-none transition-all text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              required
            />
          </div>

          <div className="space-y-1.5 mb-4">
            <label className="font-label-md text-black/60 block text-xs">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSavingProfile}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 font-body-md focus:border-black outline-none transition-all text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-1.5">
              <label className="font-label-md text-black/60 block text-xs">New Password</label>
              <input 
                type="password" 
                placeholder="Leave blank to keep"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSavingProfile}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 font-body-md focus:border-black outline-none transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-label-md text-black/60 block text-xs">Confirm Password</label>
              <input 
                type="password" 
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSavingProfile}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 font-body-md focus:border-black outline-none transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSavingProfile}
            className="w-full md:w-auto md:self-end px-8 py-3 bg-deep-charcoal text-white rounded-lg font-semibold hover:bg-black transition-all shadow-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingProfile ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Changes'}
          </button>
        </form>

        {/* System Settings & Danger Zone */}
        <div className="space-y-8">
          {isSuperAdmin && (
            <form onSubmit={handleSaveGlobals} className="bg-white border border-outline rounded-xl p-8 flex flex-col shadow-sm">
              <h3 className="text-lg font-bold text-deep-charcoal mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined">settings</span>
                Global System Settings
              </h3>
              
              <div className="space-y-4 mb-6">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-deep-charcoal select-none disabled:opacity-60">
                  <input 
                    type="checkbox" 
                    checked={emailNotifications} 
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    disabled={isSavingGlobals}
                    className="rounded border-outline-variant focus:ring-0 text-black disabled:opacity-60" 
                  />
                  Enable Email Notifications
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-deep-charcoal select-none disabled:opacity-60">
                  <input 
                    type="checkbox" 
                    checked={autoAssign} 
                    onChange={(e) => setAutoAssign(e.target.checked)}
                    disabled={isSavingGlobals}
                    className="rounded border-outline-variant focus:ring-0 text-black disabled:opacity-60" 
                  />
                  Auto-assign Reports to Staff
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-deep-charcoal select-none disabled:opacity-60">
                  <input 
                    type="checkbox" 
                    checked={requireEvidence} 
                    onChange={(e) => setRequireEvidence(e.target.checked)}
                    disabled={isSavingGlobals}
                    className="rounded border-outline-variant focus:ring-0 text-black disabled:opacity-60" 
                  />
                  Require Photo/Video Evidence
                </label>
              </div>
              
              <button 
                type="submit"
                disabled={isSavingGlobals}
                className="w-full md:w-auto md:self-end px-8 py-3 bg-white border border-outline text-deep-charcoal rounded-lg font-semibold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingGlobals ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-deep-charcoal" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save Global Preferences'}
              </button>
            </form>
          )}

          {isSuperAdmin && (
            <div className="bg-white border border-status-critical/30 rounded-xl p-8 flex flex-col shadow-sm">
              <h3 className="text-lg font-bold text-status-critical mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span>
                Danger Zone
              </h3>
              <p className="text-sm text-secondary font-medium mb-6">
                Resetting the database clears all local storage data, resetting system users, directories, and logs back to seed state. This action is irreversible.
              </p>
              <button 
                onClick={() => {
                  if (window.confirm('WARNING: Are you sure you want to restore the system database to seeds? This will delete all generated staff, students, and announcements.')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="w-full md:w-auto md:self-end px-8 py-3 border border-status-critical text-status-critical rounded-lg font-semibold hover:bg-status-critical/5 transition-colors"
              >
                Clear All Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}