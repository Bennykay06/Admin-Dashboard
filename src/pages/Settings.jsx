// src/pages/Settings.jsx - ADD PERMISSION CHECK
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function Settings({ user }) {
  // If not Super Admin, redirect to dashboard
  if (user?.role !== 'super_admin') {
    return <Navigate to="/" />;
  }

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">⚙️ Settings</h2>
          <p className="page-subtitle">System configuration and preferences (Super Admin Only)</p>
        </div>
        <div className="hall-badge">
          <span className="hall-tag">⭐ Super Admin</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {/* Profile Settings */}
        <div className="table-container" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>👤 Profile Settings</h3>
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              value={user?.name || 'Admin'} 
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={user?.email || 'admin@snapfix.com'} 
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
            />
          </div>
          <button className="btn btn-primary">Save Changes</button>
        </div>

        {/* System Settings - Only for Super Admin */}
        {isSuperAdmin && (
          <div className="table-container" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>⚙️ System Settings</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked /> Enable Email Notifications
              </label>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked /> Auto-assign Reports to Staff
              </label>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" /> Require Photo Evidence
              </label>
            </div>
            <button className="btn btn-primary">Save Settings</button>
          </div>
        )}

        {/* Danger Zone - Only for Super Admin */}
        {isSuperAdmin && (
          <div className="table-container" style={{ padding: '24px', borderColor: '#FEE2E2' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#DC2626' }}>⚠️ Danger Zone</h3>
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