// src/pages/Settings.jsx - MINIMALIST SYSTEM SETTINGS
import React, { useState } from 'react';
import { 
  getPersistedAdmins, 
  savePersistedAdmins,
  getPersistedStaff,
  savePersistedStaff 
} from '../data/mockData';

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
  const [emailNotifications, setEmailNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('snapfix_global_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.emailNotifications !== undefined ? parsed.emailNotifications : true;
      }
    } catch (e) {}
    return true;
  });

  const [autoAssign, setAutoAssign] = useState(() => {
    try {
      const saved = localStorage.getItem('snapfix_global_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.autoAssign !== undefined ? parsed.autoAssign : true;
      }
    } catch (e) {}
    return true;
  });

  const [requireEvidence, setRequireEvidence] = useState(() => {
    try {
      const saved = localStorage.getItem('snapfix_global_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.requireEvidence !== undefined ? parsed.requireEvidence : false;
      }
    } catch (e) {}
    return false;
  });

  const handleSaveProfile = (e) => {
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

    setIsSavingProfile(true);

    // Simulate saving process for responsiveness feedback
    setTimeout(() => {
      // Load admins
      const currentAdmins = getPersistedAdmins();
      const adminIndex = currentAdmins.findIndex(a => a.id === user.id);

      if (adminIndex !== -1) {
        // Create the updated admin object
        const updatedAdmin = {
          ...currentAdmins[adminIndex],
          name: name.trim(),
          email: email.trim().toLowerCase(),
        };

        if (password) {
          updatedAdmin.password = password;
        }

        // Save to admins array
        currentAdmins[adminIndex] = updatedAdmin;
        savePersistedAdmins(currentAdmins);

        // If they are not super_admin, they exist in staff list, update staff record too
        if (user.role !== 'super_admin') {
          const currentStaff = getPersistedStaff();
          const updatedStaff = currentStaff.map(s => {
            // Compare with old email because email might be changing
            if (s.email.toLowerCase() === user.email.toLowerCase()) {
              return {
                ...s,
                name: name.trim(),
                email: email.trim().toLowerCase()
              };
            }
            return s;
          });
          savePersistedStaff(updatedStaff);
        }

        // Update state & localStorage session
        localStorage.setItem('adminUser', JSON.stringify(updatedAdmin));
        setUser(updatedAdmin);

        // Clear password fields
        setPassword('');
        setConfirmPassword('');
        setIsSavingProfile(false);

        setMessage({ type: 'success', text: 'Profile and credentials updated successfully!' });

        // Auto-dismiss notification after 4 seconds
        setTimeout(() => {
          setMessage(prev => prev.text === 'Profile and credentials updated successfully!' ? { type: '', text: '' } : prev);
        }, 4000);
      } else {
        setIsSavingProfile(false);
        setMessage({ type: 'error', text: 'User profile not found in system.' });
      }
    }, 1000);
  };

  const handleSaveGlobals = (e) => {
    e.preventDefault();
    setIsSavingGlobals(true);
    setMessage({ type: '', text: '' });

    // Simulate saving process for responsiveness feedback
    setTimeout(() => {
      try {
        const settings = {
          emailNotifications,
          autoAssign,
          requireEvidence
        };
        localStorage.setItem('snapfix_global_settings', JSON.stringify(settings));
        setIsSavingGlobals(false);
        setMessage({ type: 'success', text: 'Global preferences updated successfully!' });

        // Auto-dismiss notification after 4 seconds
        setTimeout(() => {
          setMessage(prev => prev.text === 'Global preferences updated successfully!' ? { type: '', text: '' } : prev);
        }, 4000);
      } catch (error) {
        setIsSavingGlobals(false);
        setMessage({ type: 'error', text: 'Failed to save global preferences.' });
      }
    }, 1000);
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