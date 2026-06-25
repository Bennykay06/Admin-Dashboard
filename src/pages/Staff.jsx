// src/pages/Staff.jsx - COMPLETE WITH ADD, EDIT, DELETE
import React, { useState } from 'react';
import { mockStaff } from '../data/mockData';

export default function Staff({ user }) {
  const [staff, setStaff] = useState(mockStaff);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Technician',
    status: 'active'
  });

  // ===== ADD STAFF =====
  const handleAddStaff = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      role: 'Technician',
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
      setStaff(staff.filter(member => member.id !== id));
    }
  };

  // ===== SAVE STAFF (Add or Update) =====
  const handleSaveStaff = () => {
    if (!formData.name || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingStaff) {
      // Update existing staff
      setStaff(staff.map(member => 
        member.id === editingStaff.id 
          ? { ...member, ...formData }
          : member
      ));
    } else {
      // Add new staff
      const newStaff = {
        id: Date.now().toString(),
        ...formData
      };
      setStaff([...staff, newStaff]);
    }

    setShowModal(false);
    setFormData({ name: '', email: '', role: 'Technician', status: 'active' });
  };

  // ===== TOGGLE STAFF STATUS =====
  const toggleStatus = (id) => {
    setStaff(staff.map(member => 
      member.id === id 
        ? { ...member, status: member.status === 'active' ? 'inactive' : 'active' }
        : member
    ));
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
                placeholder="Enter staff name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter staff email"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
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
                <option value="Admin">Admin</option>
                <option value="Technician">Technician</option>
                <option value="Supervisor">Supervisor</option>
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
    </>
  );
}