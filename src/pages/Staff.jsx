// src/pages/Staff.jsx - COMPLETE WITH CREDENTIALS GENERATION AND TECH SPECIALTIES
import React, { useState } from 'react';
import { 
  getPersistedStaff, 
  savePersistedStaff, 
  getPersistedAdmins, 
  savePersistedAdmins 
} from '../data/mockData';

export default function Staff({ user }) {
  const [staff, setStaff] = useState(() => getPersistedStaff());
  const [showModal, setShowModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Electrical Technician',
    status: 'active'
  });

  // ===== ADD STAFF =====
  const handleAddStaff = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      role: 'Electrical Technician',
      status: 'active'
    });
    setShowModal(true);
  };

  // ===== EDIT STAFF =====
  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role,
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

    // Auto-generate email if left blank
    let email = formData.email.trim();
    if (!email) {
      email = formData.name.toLowerCase().trim().replace(/\s+/g, '.') + '@snapfix.com';
    }

    if (editingStaff) {
      // Update existing staff
      const updatedStaff = staff.map(member => 
        member.id === editingStaff.id 
          ? { ...member, name: formData.name, email, role: formData.role, status: formData.status }
          : member
      );
      setStaff(updatedStaff);
      savePersistedStaff(updatedStaff);

      // Also update in admins list if they exist there
      const allAdmins = getPersistedAdmins();
      const updatedAdmins = allAdmins.map(admin => {
        if (admin.email.toLowerCase() === editingStaff.email.toLowerCase()) {
          let role = 'technician';
          let specialty = null;
          let specialtyIcon = null;

          if (formData.role === 'Admin') {
            role = 'hall_admin';
          } else if (formData.role === 'Supervisor') {
            role = 'supervisor';
          } else {
            // Electrical Technician, etc.
            specialty = formData.role.replace(' Technician', '');
            if (specialty === 'Electrical') specialtyIcon = '⚡';
            else if (specialty === 'Plumbing') specialtyIcon = '🔧';
            else if (specialty === 'Carpentry') specialtyIcon = '🪚';
            else if (specialty === 'Masonry') specialtyIcon = '🧱';
          }

          return {
            ...admin,
            name: formData.name,
            email: email,
            role,
            specialty,
            specialtyIcon
          };
        }
        return admin;
      });
      savePersistedAdmins(updatedAdmins);
      setShowModal(false);
    } else {
      // Add new staff - Simulate backend credentials generation
      const generatedPassword = 'sf' + Math.floor(1000 + Math.random() * 9000);
      
      const newStaffId = Date.now().toString();
      const newStaffMember = {
        id: newStaffId,
        name: formData.name,
        email: email,
        role: formData.role,
        status: formData.status
      };

      const updatedStaff = [...staff, newStaffMember];
      setStaff(updatedStaff);
      savePersistedStaff(updatedStaff);

      // Map Role to admins schema for authentication
      let role = 'technician';
      let specialty = null;
      let specialtyIcon = null;

      if (formData.role === 'Admin') {
        role = 'hall_admin';
      } else if (formData.role === 'Supervisor') {
        role = 'supervisor';
      } else {
        specialty = formData.role.replace(' Technician', '');
        if (specialty === 'Electrical') specialtyIcon = '⚡';
        else if (specialty === 'Plumbing') specialtyIcon = '🔧';
        else if (specialty === 'Carpentry') specialtyIcon = '🪚';
        else if (specialty === 'Masonry') specialtyIcon = '🧱';
      }

      const newAdminObj = {
        id: 'admin_' + newStaffId,
        email: email,
        password: generatedPassword,
        name: formData.name,
        role,
        hallId: user?.hallId || null,
        hallName: user?.hallName || 'All Halls',
        specialty,
        specialtyIcon
      };

      const currentAdmins = getPersistedAdmins();
      currentAdmins.push(newAdminObj);
      savePersistedAdmins(currentAdmins);

      // Set credentials info to display to user
      setGeneratedCredentials({
        name: formData.name,
        role: formData.role,
        email: email,
        password: generatedPassword
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
              {staff.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                    No staff members found. Click "Add Staff" to add one.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id}>
                    <td style={{ fontWeight: '500' }}>{member.name}</td>
                    <td>{member.email}</td>
                    <td>
                      <span style={{ 
                        background: member.role === 'Admin' ? '#ECFDF5' : '#DBEAFE',
                        color: member.role === 'Admin' ? '#065F46' : '#1E40AF',
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
              <label>Email Address (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Leave blank to auto-generate"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                If left blank, email will be generated based on full name (e.g. john.doe@snapfix.com).
              </span>
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                <option value="Electrical Technician">Electrical Technician</option>
                <option value="Plumbing Technician">Plumbing Technician</option>
                <option value="Carpentry Technician">Carpentry Technician</option>
                <option value="Masonry Technician">Masonry Technician</option>
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
              <div>
                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', display: 'block', textTransform: 'uppercase' }}>
                  Temporary Password
                </span>
                <span style={{ fontSize: '16px', color: '#10B981', fontWeight: '700', fontFamily: 'monospace' }}>
                  {generatedCredentials.password}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const copyText = `Name: ${generatedCredentials.name}\nEmail: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}`;
                  navigator.clipboard.writeText(copyText);
                  alert('Copied to clipboard!');
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