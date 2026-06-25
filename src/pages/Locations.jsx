// src/pages/Locations.jsx - FIXED HOOKS ORDER
import React, { useState } from 'react';
import { halls } from '../data/mockData';
import { Navigate } from 'react-router-dom';

export default function Locations({ user }) {
  // ✅ All hooks must be called BEFORE any conditional returns
  const [locations, setLocations] = useState(halls);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    floors: '',
    rooms: ''
  });

  // ✅ Check permission AFTER all hooks are called
  if (user?.role !== 'super_admin') {
    return <Navigate to="/" />;
  }

  const isSuperAdmin = user?.role === 'super_admin';

  const handleAddLocation = () => {
    if (!isSuperAdmin) return;
    setEditingLocation(null);
    setFormData({ name: '', code: '', floors: '', rooms: '' });
    setShowModal(true);
  };

  const handleEditLocation = (location) => {
    if (!isSuperAdmin) return;
    setEditingLocation(location);
    setFormData({
      name: location.name,
      code: location.code,
      floors: location.floors || '',
      rooms: location.rooms || ''
    });
    setShowModal(true);
  };

  const handleDeleteLocation = (id) => {
    if (!isSuperAdmin) return;
    if (window.confirm('Are you sure you want to delete this hall?')) {
      setLocations(locations.filter(loc => loc.id !== id));
    }
  };

  const handleSaveLocation = () => {
    if (!isSuperAdmin) return;
    if (!formData.name || !formData.code) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingLocation) {
      setLocations(locations.map(loc =>
        loc.id === editingLocation.id ? { ...loc, ...formData } : loc
      ));
    } else {
      const newLocation = { id: Date.now().toString(), ...formData };
      setLocations([...locations, newLocation]);
    }

    setShowModal(false);
    setFormData({ name: '', code: '', floors: '', rooms: '' });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">📍 Locations Management</h2>
          <p className="page-subtitle">Manage halls, floors, and rooms (Super Admin Only)</p>
        </div>
        <div className="hall-badge">
          <span className="hall-tag">⭐ Super Admin</span>
        </div>
      </div>

      {isSuperAdmin && (
        <div style={{ marginBottom: '16px' }}>
          <button className="btn btn-primary" onClick={handleAddLocation}>+ Add Hall</button>
        </div>
      )}

      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Floors</th>
                <th>Rooms</th>
                {isSuperAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                    No halls found.
                  </td>
                </tr>
              ) : (
                locations.map((hall) => (
                  <tr key={hall.id}>
                    <td style={{ fontWeight: '500' }}>{hall.name}</td>
                    <td>{hall.code}</td>
                    <td>{hall.floors || '-'}</td>
                    <td>{hall.rooms || '-'}</td>
                    {isSuperAdmin && (
                      <td>
                        <button 
                          className="btn btn-secondary" 
                          style={{ marginRight: '8px', padding: '4px 12px', fontSize: '12px' }}
                          onClick={() => handleEditLocation(hall)}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '4px 12px', fontSize: '12px' }}
                          onClick={() => handleDeleteLocation(hall.id)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && isSuperAdmin && (
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
              {editingLocation ? '✏️ Edit Hall' : '➕ Add New Hall'}
            </h2>

            <div className="form-group">
              <label>Hall Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter hall name"
              />
            </div>

            <div className="form-group">
              <label>Hall Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., unity, independence"
              />
            </div>

            <div className="form-group">
              <label>Number of Floors</label>
              <input
                type="number"
                value={formData.floors}
                onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
                placeholder="e.g., 5"
              />
            </div>

            <div className="form-group">
              <label>Number of Rooms</label>
              <input
                type="number"
                value={formData.rooms}
                onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                placeholder="e.g., 50"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={handleSaveLocation} style={{ flex: 1 }}>
                {editingLocation ? 'Update Hall' : 'Add Hall'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}