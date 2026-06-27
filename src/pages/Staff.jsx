// src/pages/Staff.jsx - COMPLETE WITH CREDENTIALS GENERATION AND TECH SPECIALTIES
import React, { useState } from 'react';
import { 
  getPersistedStaff, 
  savePersistedStaff, 
  getPersistedAdmins, 
  savePersistedAdmins 
} from '../data/mockData';

// Copy helper that works outside secure contexts (e.g. http:// on a LAN IP),
// where navigator.clipboard is undefined. Falls back to a hidden textarea.
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => alert('Copied to clipboard!'))
      .catch(() => fallbackCopy(text));
    return;
  }
  fallbackCopy(text);
}

function fallbackCopy(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    alert(ok ? 'Copied to clipboard!' : 'Could not copy. Please copy manually.');
  } catch {
    alert('Could not copy. Please copy manually.');
  }
}

export default function Staff({ user }) {
  // Super admins manage every hall and can create hall admins. Hall admins are
  // scoped to their own hall and may only create/manage technicians there.
  const isSuperAdmin = user?.role === 'super_admin';

  const [staff, setStaff] = useState(() => getPersistedStaff());
  const [showModal, setShowModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'technician',
    hallId: '1',
    specialty: 'electrical',
    status: 'active'
  });

  // ===== ADD STAFF =====
  const handleAddStaff = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      role: 'technician',
      hallId: user?.hallId || '1',
      specialty: 'electrical',
      status: 'active'
    });
    setShowModal(true);
  };

  // ===== EDIT STAFF =====
  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    const currentAdmins = getPersistedAdmins();
    const adminObj = currentAdmins.find(a => a.email.toLowerCase() === staffMember.email.toLowerCase()) || {};
    
    const specialty = adminObj.role === 'hall_admin'
      ? 'hall-admin'
      : (adminObj.specialty || 'electrical');

    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      role: adminObj.role || 'technician',
      hallId: adminObj.hallId || '1',
      specialty,
      status: staffMember.status
    });
    setShowModal(true);
  };

  // ===== DELETE STAFF =====
  const handleDeleteStaff = (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      const updatedStaff = staff.filter(member => member.id !== id);
      setStaff(updatedStaff);
      savePersistedStaff(updatedStaff);

      // Remove from admins too
      const currentStaffMember = staff.find(member => member.id === id);
      if (currentStaffMember) {
        const currentAdmins = getPersistedAdmins();
        const updatedAdmins = currentAdmins.filter(admin => admin.email !== currentStaffMember.email);
        savePersistedAdmins(updatedAdmins);
      }
    }
  };

  // ===== SAVE STAFF (Add or Update) =====
  const handleSaveStaff = () => {
    if (!formData.name) {
      alert('Please fill in Name');
      return;
    }

    // Only the super admin can create hall admins; hall admins manage technicians only.
    if (formData.specialty === 'hall-admin' && !isSuperAdmin) {
      alert('Only the Super Admin can create Hall Admins. You can add technicians for your hall.');
      return;
    }

    const hallNames = {
      '1': 'Unity Hall',
      '2': 'Independence Hall',
      '3': 'Republic Hall',
      '4': 'Africa Hall',
      '5': 'University Hall',
      '6': 'Queen Elizabeth II Hall'
    };

    const hallCodes = {
      '1': 'unity',
      '2': 'independence',
      '3': 'republic',
      '4': 'africa',
      '5': 'university',
      '6': 'queenshall'
    };

    const specialties = {
      'hall-admin': { label: 'Hall Admin', icon: '🏛️' },
      'electrical': { label: 'Electrical', icon: '⚡' },
      'plumbing': { label: 'Plumbing', icon: '🔧' },
      'carpentry': { label: 'Carpentry', icon: '🪚' },
      'masonry': { label: 'Masonry', icon: '🧱' }
    };

    const hallName = hallNames[formData.hallId] || 'All Halls';
    const hallCode = hallCodes[formData.hallId] || 'hall';
    const specInfo = specialties[formData.specialty] || { label: 'General', icon: '🔧' };

    // "Hall Admin" is a role, not a technician specialty. When selected we
    // create a real hall_admin account (Admin Portal) instead of a technician.
    const isHallAdmin = formData.specialty === 'hall-admin';
    const staffRole = isHallAdmin ? 'Hall Admin' : `${specInfo.label} Technician`;
    const loginRole = isHallAdmin ? 'hall_admin' : 'technician';
    const loginPortal = isHallAdmin ? 'Admin Portal' : 'Technician Portal';

    // Auto-generate email: [firstname].[lastname]@[hallcode].snapfix.com
    // If no surname is given, fall back to the person's role/specialty.
    const nameParts = formData.name.trim().toLowerCase().split(/\s+/);
    const firstName = nameParts[0] || 'staff';
    const lastName = nameParts.slice(1).join('.') || formData.specialty;
    const email = `${firstName}.${lastName}@${hallCode}.snapfix.com`;

    if (editingStaff) {
      // Update existing staff
      const updatedStaff = staff.map(member =>
        member.id === editingStaff.id
          ? {
              ...member,
              name: formData.name,
              email,
              role: staffRole,
              status: formData.status
            }
          : member
      );
      setStaff(updatedStaff);
      savePersistedStaff(updatedStaff);

      // Also update in admins list if they exist there
      const allAdmins = getPersistedAdmins();
      const updatedAdmins = allAdmins.map(admin => {
        if (admin.email.toLowerCase() === editingStaff.email.toLowerCase()) {
          return {
            ...admin,
            name: formData.name,
            email,
            role: loginRole,
            hallId: formData.hallId,
            hallName,
            specialty: isHallAdmin ? null : formData.specialty,
            specialtyLabel: isHallAdmin ? null : specInfo.label,
            specialtyIcon: isHallAdmin ? null : specInfo.icon
          };
        }
        return admin;
      });
      savePersistedAdmins(updatedAdmins);
      setShowModal(false);
    } else {
      // Add new staff
      // Generate 10-character password with letters, numbers, and symbols
      const generateRandomPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~}{[]:;?><';
        let password = '';
        for (let i = 0; i < 10; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      };
      const generatedPassword = generateRandomPassword();
      const newStaffId = 't' + Date.now().toString();

      const newStaffMember = {
        id: newStaffId,
        name: formData.name,
        email,
        role: staffRole,
        status: formData.status
      };

      const updatedStaff = [...staff, newStaffMember];
      setStaff(updatedStaff);
      savePersistedStaff(updatedStaff);

      const newAdminObj = {
        id: newStaffId,
        email,
        password: generatedPassword,
        name: formData.name,
        role: loginRole,
        hallId: formData.hallId,
        hallName,
        // Technician specialty fields are omitted for hall admins.
        ...(isHallAdmin ? {} : {
          specialty: formData.specialty,
          specialtyLabel: specInfo.label,
          specialtyIcon: specInfo.icon
        })
      };

      const currentAdmins = getPersistedAdmins();
      currentAdmins.push(newAdminObj);
      savePersistedAdmins(currentAdmins);

      // Set credentials info to display to user
      setGeneratedCredentials({
        name: formData.name,
        role: staffRole,
        email,
        password: generatedPassword,
        portal: loginPortal
      });

      setShowModal(false);
      setShowCredentialsModal(true);
    }
  };

  // ===== TOGGLE STAFF STATUS =====
  const toggleStatus = (id) => {
    const updatedStaff = staff.map(member => 
      member.id === id 
        ? { ...member, status: member.status === 'active' ? 'inactive' : 'active' }
        : member
    );
    setStaff(updatedStaff);
    savePersistedStaff(updatedStaff);
  };

  const currentAdmins = getPersistedAdmins();
  const displayedStaff = staff.filter(member => {
    if (isSuperAdmin) return true; // Super admin sees all staff
    const adminObj = currentAdmins.find(a => a.email.toLowerCase() === member.email.toLowerCase());
    // Hall admins manage only the technicians in their own hall.
    return adminObj?.hallId === user.hallId && adminObj?.role === 'technician';
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">👤 Staff Management</h2>
          <p className="page-subtitle">Manage maintenance staff and administrators</p>
        </div>
        <div className="hall-badge">
          <span className="hall-tag">🏛️ {user?.hallName || 'All Halls'}</span>
        </div>
      </div>

      {/* Add Staff Button */}
      <div style={{ marginBottom: '16px' }}>
        <button className="btn btn-primary" onClick={handleAddStaff}>
          + Add Staff
        </button>
      </div>

      {/* Staff Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedStaff.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                    No staff members found. Click "Add Staff" to add one.
                  </td>
                </tr>
              ) : (
                displayedStaff.map((member) => (
                  <tr key={member.id}>
                    <td style={{ fontWeight: '500' }}>{member.name}</td>
                    <td>{member.email}</td>
                    <td>
                      <span style={{
                        background: member.role?.includes('Admin') ? '#ECFDF5' : '#DBEAFE',
                        color: member.role?.includes('Admin') ? '#065F46' : '#1E40AF',
                        padding: '2px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {member.role}
                      </span>
                    </td>
                    <td>
                      <span 
                        className={`badge badge-${member.status}`}
                        onClick={() => toggleStatus(member.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        style={{ marginRight: '8px', padding: '4px 12px', fontSize: '12px' }}
                        onClick={() => handleEditStaff(member)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                        onClick={() => handleDeleteStaff(member.id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== ADD/EDIT MODAL ===== */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: '700' }}>
              {editingStaff ? '✏️ Edit Staff' : '➕ Add New Staff'}
            </h2>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John Doe"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                required
              />
            </div>

            <div className="form-group">
              <label>Hall *</label>
              <select
                value={formData.hallId}
                onChange={(e) => setFormData({ ...formData, hallId: e.target.value })}
                disabled={!!user?.hallId}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  background: !!user?.hallId ? '#F3F4F6' : 'white',
                  cursor: !!user?.hallId ? 'not-allowed' : 'default'
                }}
              >
                <option value="1">Unity Hall</option>
                <option value="2">Independence Hall</option>
                <option value="3">Republic Hall</option>
                <option value="4">Africa Hall</option>
                <option value="5">University Hall</option>
                <option value="6">Queen Elizabeth II Hall</option>
              </select>
            </div>

            <div className="form-group">
              <label>Role / Specialty *</label>
              <select
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'white'
                }}
              >
                {isSuperAdmin && <option value="hall-admin">Hall Admin</option>}
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="carpentry">Carpentry</option>
                <option value="masonry">Masonry</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'white'
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                onClick={handleSaveStaff}
                style={{ flex: 1 }}
              >
                {editingStaff ? 'Update Staff' : 'Add Staff'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREDENTIALS GENERATION DISPLAY MODAL ===== */}
      {showCredentialsModal && generatedCredentials && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            borderTop: '5px solid #10B981',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              Credentials Generated!
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
              The new staff member has been added to the system. Share these credentials for them to sign in.
            </p>

            <div style={{
              background: '#F3F4F6',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'left',
              marginBottom: '24px',
              border: '1px dashed #D1D5DB',
              wordBreak: 'break-all'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', display: 'block', textTransform: 'uppercase' }}>
                  Name
                </span>
                <span style={{ fontSize: '15px', color: '#1F2937', fontWeight: '500' }}>
                  {generatedCredentials.name}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', display: 'block', textTransform: 'uppercase' }}>
                  Role / Specialty
                </span>
                <span style={{ fontSize: '15px', color: '#1F2937', fontWeight: '500' }}>
                  {generatedCredentials.role}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', display: 'block', textTransform: 'uppercase' }}>
                  Email Address
                </span>
                <span style={{ fontSize: '15px', color: '#1F2937', fontWeight: '600', fontFamily: 'monospace' }}>
                  {generatedCredentials.email}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', display: 'block', textTransform: 'uppercase' }}>
                  Temporary Password
                </span>
                <span style={{ fontSize: '16px', color: '#10B981', fontWeight: '700', fontFamily: 'monospace' }}>
                  {generatedCredentials.password}
                </span>
              </div>
              {generatedCredentials.portal && (
                <div>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', display: 'block', textTransform: 'uppercase' }}>
                    Sign In Via
                  </span>
                  <span style={{ fontSize: '15px', color: '#1F2937', fontWeight: '600' }}>
                    {generatedCredentials.portal}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const copyText = `Name: ${generatedCredentials.name}\nRole: ${generatedCredentials.role}\nEmail: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}${generatedCredentials.portal ? `\nSign in via: ${generatedCredentials.portal}` : ''}`;
                  copyToClipboard(copyText);
                }}
                style={{ width: '100%' }}
              >
                📋 Copy Details
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowCredentialsModal(false);
                  setGeneratedCredentials(null);
                }}
                style={{ width: '100%' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}