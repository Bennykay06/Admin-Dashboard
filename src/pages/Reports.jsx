// src/pages/Reports.jsx - WITH PERSISTENCE SUPPORT
import React, { useState, useEffect } from 'react';
import { 
  getReportsByHall, 
  getStatusLabel, 
  getTechnicians,
  getTechniciansBySpecialty,
  getCategoryIcon,
  getPersistedReports,
  savePersistedReports
} from '../data/mockData';
import HallSelector from '../components/HallSelector';

export default function Reports({ user }) {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedHall, setSelectedHall] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedImage, setSelectedImage] = useState('');

  useEffect(() => {
    const hallId = user?.role === 'super_admin' ? selectedHall : user?.hallId;
    const hallReports = getReportsByHall(hallId);
    setReports(hallReports);
  }, [user, selectedHall]);

  const handleStatusChange = (id, newStatus) => {
    // Update local state
    setReports(reports.map(report => 
      report.id === id ? { ...report, status: newStatus } : report
    ));

    // Update localStorage
    const allReports = getPersistedReports();
    const updatedAllReports = allReports.map(report => 
      report.id === id ? { ...report, status: newStatus } : report
    );
    savePersistedReports(updatedAllReports);
  };

  const handleAssignReport = (report) => {
    setSelectedReport(report);
    setSelectedTechnician('');
    setShowAssignModal(true);
  };

  const handleAssignTechnician = () => {
    if (!selectedTechnician || !selectedReport) return;

    const technician = getTechnicians().find(t => t.id === selectedTechnician);
    
    // Update local state
    setReports(reports.map(report => 
      report.id === selectedReport.id 
        ? { 
            ...report, 
            assignedTo: technician.id,
            assignedName: technician.name,
            assignedSpecialty: technician.specialty,
            status: 'in-progress'
          }
        : report
    ));

    // Update localStorage
    const allReports = getPersistedReports();
    const updatedAllReports = allReports.map(report => 
      report.id === selectedReport.id 
        ? { 
            ...report, 
            assignedTo: technician.id,
            assignedName: technician.name,
            assignedSpecialty: technician.specialty,
            status: 'in-progress'
          }
        : report
    );
    savePersistedReports(updatedAllReports);

    setShowAssignModal(false);
    setSelectedReport(null);
    setSelectedTechnician('');
  };

  const handleViewImage = (imageUri) => {
    setSelectedImage(imageUri);
    setShowImageModal(true);
  };

  const getAvailableTechnicians = (category) => {
    return getTechniciansBySpecialty(category);
  };

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter);

  const getStatusCount = (status) => {
    if (status === 'all') return reports.length;
    return reports.filter(r => r.status === status).length;
  };

  const showHallSelector = user?.role === 'super_admin';
  const isAdmin = user?.role === 'hall_admin' || user?.role === 'super_admin';

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">📋 Reports Management</h2>
          <p className="page-subtitle">
            {user?.role === 'super_admin' 
              ? 'View and manage reports from all halls'
              : `View and manage reports for ${user?.hallName}`
            }
          </p>
        </div>
        <div className="hall-badge">
          <span className="hall-tag">
            {user?.role === 'super_admin' ? '⭐ All Halls' : `🏛️ ${user?.hallName}`}
          </span>
        </div>
      </div>

      {showHallSelector && (
        <HallSelector 
          selectedHall={selectedHall} 
          onSelectHall={setSelectedHall} 
        />
      )}

      <div className="filter-group">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({getStatusCount('all')})
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

      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student</th>
                <th>Issue</th>
                {user?.role === 'super_admin' && <th>Hall</th>}
                <th>Location</th>
                <th>Category</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Photo</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td style={{ fontWeight: '600', color: '#6B7280', fontSize: '13px' }}>
                    #{report.id}
                  </td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{report.studentName}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{report.studentEmail}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{report.issue}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{report.category}</div>
                  </td>
                  {user?.role === 'super_admin' && <td>{report.hallName}</td>}
                  <td style={{ fontSize: '13px' }}>{report.location}</td>
                  <td>
                    <span style={{ 
                      background: '#F3F4F6', 
                      padding: '2px 10px', 
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {getCategoryIcon(report.category)} {report.category}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${report.status}`}>
                      {getStatusLabel(report.status)}
                    </span>
                  </td>
                  <td>
                    {report.assignedName ? (
                      <span style={{ 
                        background: '#DBEAFE', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#1E40AF'
                      }}>
                        {report.assignedName}
                      </span>
                    ) : (
                      <span style={{ color: '#6B7280', fontSize: '12px' }}>Not assigned</span>
                    )}
                  </td>
                  <td>
                    <span style={{ 
                      color: report.priority === 'high' ? '#DC2626' : 
                             report.priority === 'medium' ? '#F59E0B' : '#10B981',
                      fontWeight: '500',
                      fontSize: '13px'
                    }}>
                      {report.priority}
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
                  <td>
                    {isAdmin && report.status === 'pending' && !report.assignedTo && (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '4px 12px', fontSize: '12px', marginRight: '4px' }}
                        onClick={() => handleAssignReport(report)}
                      >
                        Assign
                      </button>
                    )}
                    {isAdmin && report.status !== 'resolved' && report.assignedTo && (
                      <select
                        className="status-select"
                        value={report.status}
                        onChange={(e) => handleStatusChange(report.id, e.target.value)}
                        style={{ marginRight: '4px' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    )}
                    {!report.assignedTo && report.status === 'pending' && (
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>
                        Awaiting assignment
                      </span>
                    )}
                    {report.status === 'resolved' && (
                      <span style={{ fontSize: '11px', color: '#10B981' }}>✅ Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedReport && (
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
            <h2 style={{ marginBottom: '16px', fontSize: '22px', fontWeight: '700' }}>
              📋 Assign Report #{selectedReport.id}
            </h2>

            {selectedReport.imageUri && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Evidence Photo</label>
                <img 
                  src={selectedReport.imageUri} 
                  alt="Evidence" 
                  style={{ 
                    width: '100%', 
                    height: '150px', 
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginTop: '4px'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <p><strong>Issue:</strong> {selectedReport.issue}</p>
              <p><strong>Category:</strong> {selectedReport.category}</p>
              <p><strong>Location:</strong> {selectedReport.location}</p>
              <p><strong>Student:</strong> {selectedReport.studentName}</p>
              <p><strong>Description:</strong> {selectedReport.description}</p>
            </div>

            <div className="form-group">
              <label>Select Technician ({selectedReport.category})</label>
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
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
                <option value="">Select a technician...</option>
                {getAvailableTechnicians(selectedReport.category).map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.specialty})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                onClick={handleAssignTechnician}
                disabled={!selectedTechnician}
                style={{ 
                  flex: 1,
                  opacity: !selectedTechnician ? 0.5 : 1,
                  cursor: !selectedTechnician ? 'not-allowed' : 'pointer'
                }}
              >
                Assign
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAssignModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
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
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>📷 Evidence Photo</h3>
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
                borderRadius: '8px'
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}