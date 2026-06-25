// src/pages/TechnicianDashboard.jsx - UNIFIED TECHNICIAN DASHBOARD
import React, { useState, useEffect } from 'react';
import { 
  getReportsByTechnician, 
  getStatusLabel, 
  getCategoryIcon,
  getPersistedReports,
  savePersistedReports
} from '../data/mockData';
import StatCard from '../components/StatCard';

export default function TechnicianDashboard({ user }) {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  
  // Form fields for updating report
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    if (user?.id) {
      const techReports = getReportsByTechnician(user.id);
      setReports(techReports);
    }
  }, [user]);

  const refreshReports = () => {
    if (user?.id) {
      const techReports = getReportsByTechnician(user.id);
      setReports(techReports);
    }
  };

  const handleOpenUpdate = (report) => {
    setSelectedReport(report);
    setNotes(report.technicianNotes || '');
    setStatus(report.status);
    setShowUpdateModal(true);
  };

  const handleSaveUpdate = () => {
    if (!selectedReport) return;

    // Update in localStorage
    const allReports = getPersistedReports();
    const updatedAllReports = allReports.map(report => 
      report.id === selectedReport.id 
        ? { 
            ...report, 
            status, 
            technicianNotes: notes,
            repairDate: status === 'resolved' ? new Date().toISOString() : report.repairDate
          }
        : report
    );
    savePersistedReports(updatedAllReports);

    // Close modal and refresh page state
    setShowUpdateModal(false);
    setSelectedReport(null);
    refreshReports();
  };

  const handleViewImage = (imageUri) => {
    setSelectedImage(imageUri);
    setShowImageModal(true);
  };

  // Stats calculation
  const totalReports = reports.length;
  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const inProgressCount = reports.filter(r => r.status === 'in-progress').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;

  const getStatusCount = (statusTab) => {
    if (statusTab === 'all') return reports.length;
    return reports.filter(r => r.status === statusTab).length;
  };

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter);

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">🔧 Technician Workspace</h2>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.name || 'Technician'}</strong>. Manage and resolve your assigned repairs.
          </p>
        </div>
        <div className="hall-badge">
          <span className="hall-tag" style={{ background: '#E0F2FE', color: '#0284C7' }}>
            🛠️ {user?.specialty || 'General'} Technician
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard label="Assigned Jobs" value={totalReports} icon="📋" />
        <StatCard label="Pending" value={pendingCount} type="pending" icon="⏳" />
        <StatCard label="In Progress" value={inProgressCount} type="in-progress" icon="🔄" />
        <StatCard label="Resolved" value={resolvedCount} type="resolved" icon="✅" />
      </div>

      {/* Filters */}
      <div className="filter-group">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Jobs ({getStatusCount('all')})
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({getStatusCount('pending')})
        </button>
        <button 
          className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
          onClick={() => setFilter('in-progress')}
        >
          In Progress ({getStatusCount('in-progress')})
        </button>
        <button 
          className={`filter-btn ${filter === 'resolved' ? 'active' : ''}`}
          onClick={() => setFilter('resolved')}
        >
          Resolved ({getStatusCount('resolved')})
        </button>
      </div>

      {/* Job list */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Student / Location</th>
                <th>Issue</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Photo</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
                    No assigned reports found for this status.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td style={{ fontWeight: '600', color: '#6B7280', fontSize: '13px' }}>
                      #{report.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{report.studentName}</div>
                      <div style={{ fontSize: '12px', color: '#4B5563', fontWeight: '500' }}>📍 {report.location}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#111827' }}>
                        {getCategoryIcon(report.category)} {report.issue}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                        {report.description.length > 50 ? report.description.substring(0, 50) + '...' : report.description}
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        color: report.priority === 'high' ? '#DC2626' : 
                               report.priority === 'medium' ? '#F59E0B' : '#10B981',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        {report.priority.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${report.status}`}>
                        {getStatusLabel(report.status)}
                      </span>
                    </td>
                    <td>
                      {report.imageUri ? (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => handleViewImage(report.imageUri)}
                        >
                          📷 View
                        </button>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '12px' }}>No photo</span>
                      )}
                    </td>
                    <td style={{ fontSize: '13px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {report.technicianNotes ? (
                        <span style={{ color: '#374151', fontStyle: 'italic' }}>{report.technicianNotes}</span>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '11px' }}>No notes added</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => handleOpenUpdate(report)}
                      >
                        ⚡ Update Job
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== UPDATE MODAL ===== */}
      {showUpdateModal && selectedReport && (
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
            maxWidth: '550px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ marginBottom: '16px', fontSize: '22px', fontWeight: '700', color: '#111827' }}>
              🔧 Update Job #{selectedReport.id}
            </h2>

            {/* Evidence Image */}
            {selectedReport.imageUri && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Student Photo Evidence (Click to zoom)
                </label>
                <img 
                  src={selectedReport.imageUri} 
                  alt="Evidence" 
                  style={{ 
                    width: '100%', 
                    height: '180px', 
                    objectFit: 'cover',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: '1px solid #E5E7EB'
                  }}
                  onClick={() => handleViewImage(selectedReport.imageUri)}
                />
              </div>
            )}

            {/* Description Details */}
            <div style={{ 
              background: '#F9FAFB', 
              padding: '16px', 
              borderRadius: '8px', 
              fontSize: '14px', 
              marginBottom: '20px', 
              border: '1px solid #F3F4F6' 
            }}>
              <p style={{ margin: '0 0 6px 0' }}><strong>Location:</strong> {selectedReport.location}</p>
              <p style={{ margin: '0 0 6px 0' }}><strong>Student:</strong> {selectedReport.studentName} ({selectedReport.studentEmail})</p>
              <p style={{ margin: '0 0 6px 0' }}><strong>Reported Issue:</strong> {selectedReport.issue}</p>
              <p style={{ margin: '0', color: '#4B5563', background: '#FFFFFF', padding: '10px', borderRadius: '4px', border: '1px solid #E5E7EB', marginTop: '6px', fontSize: '13px' }}>
                <strong>Student Description:</strong> "{selectedReport.description}"
              </p>
            </div>

            {/* Edit Fields */}
            <div className="form-group">
              <label>Update Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="form-group">
              <label>Technician Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter actions taken, parts used, or updates for the administration..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                className="btn btn-primary"
                onClick={handleSaveUpdate}
                style={{ flex: 1 }}
              >
                Save Updates
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedReport(null);
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== IMAGE MODAL ===== */}
      {showImageModal && selectedImage && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '20px',
            width: '100%',
            maxWidth: '600px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>📷 Evidence Photo</h3>
              <button
                className="btn btn-secondary"
                onClick={() => setShowImageModal(false)}
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                ✕ Close
              </button>
            </div>
            <img 
              src={selectedImage} 
              alt="Evidence" 
              style={{ 
                width: '100%', 
                height: 'auto', 
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}