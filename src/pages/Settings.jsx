// src/pages/Settings.jsx - ALLOW PROFILE AND CREDENTIAL UPDATES FOR ALL ROLES
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

      setMessage({ type: 'success', text: 'Profile and credentials updated successfully!' });
    } else {
      setMessage({ type: 'error', text: 'User profile not found in system.' });
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">⚙️ Settings</h2>
          <p className="page-subtitle">Update your profile and reset your login credentials</p>
        </div>
        <div className="hall-badge">
          <span className="hall-tag">
            {user?.role === 'super_admin' ? '⭐ Super Admin' : 
             user?.role === 'hall_admin' ? `🏛️ Hall Admin (${user?.hallName})` : 
             `🔧 Technician (${user?.specialtyLabel || 'General'})`}
          </span>
        </div>
      </div>

      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          background: message.type === 'success' ? '#ECFDF5' : '#FEE2E2',
          border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FCA5A5'}`,
          color: message.type === 'success' ? '#065F46' : '#991B1B',
          fontSize: '14px',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {/* Profile / Credentials Settings */}
        <form onSubmit={handleSaveProfile} className="table-container" style={{ padding: '24px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#111827' }}>👤 Profile & Credentials</h3>
          
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', outline: 'none' }}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', outline: 'none' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>New Password (leave blank to keep current)</label>
              <input 
                type="password" 
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', outline: 'none' }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Confirm New Password</label>
              <input 
                type="password" 
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', outline: 'none' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>

        {/* System Settings - Only for Super Admin */}
        {isSuperAdmin && (
          <div className="table-container" style={{ padding: '24px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>⚙️ System Settings</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" defaultChecked /> Enable Email Notifications
              </label>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" defaultChecked /> Auto-assign Reports to Staff
              </label>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" /> Require Photo/Video Evidence
              </label>
            </div>
            <button className="btn btn-primary">Save Settings</button>
          </div>
        )}

        {/* Danger Zone - Only for Super Admin */}
        {isSuperAdmin && (
          <div className="table-container" style={{ padding: '24px', borderColor: '#FEE2E2', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #FCA5A5' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#DC2626', fontWeight: '600' }}>⚠️ Danger Zone</h3>
            <p style={{ color: '#6B7280', marginBottom: '12px', fontSize: '14px' }}>
              This action cannot be undone. All data will be permanently deleted.
            </p>
            <button className="btn btn-danger">Clear All Data</button>
          </div>
        )}
      </div>
    </>
  );
}