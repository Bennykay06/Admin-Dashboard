// src/pages/Reports.jsx - WITH PERSISTENCE SUPPORT
import React, { useState, useEffect } from 'react';
import { 
  getReportsByHall, 
  getStatusLabel, 
  getTechnicians,
  getCategoryIcon,
  getPersistedReports,
  savePersistedReports
} from '../data/mockData';
import HallSelector from '../components/HallSelector';

const isVideo = (uri) => {
  if (!uri) return false;
  return uri.startsWith('data:video/') || uri.toLowerCase().endsWith('.mp4') || uri.toLowerCase().endsWith('.mov') || uri.toLowerCase().endsWith('.webm');
};

// Color-coded priority choices used by the assign modal pills.
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', icon: '💤', color: '#047857', bg: '#ECFDF5', border: '#6EE7B7' },
  { value: 'medium', label: 'Medium', icon: '⚡', color: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
  { value: 'high', label: 'High', icon: '🔥', color: '#B91C1C', bg: '#FEF2F2', border: '#FCA5A5' },
];

export default function Reports({ user }) {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedHall, setSelectedHall] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('medium');

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

  const handlePriorityChange = (id, newPriority) => {
    // Update local state
    setReports(reports.map(report => 
      report.id === id ? { ...report, priority: newPriority } : report
    ));

    // Update localStorage
    const allReports = getPersistedReports();
    const updatedAllReports = allReports.map(report => 
      report.id === id ? { ...report, priority: newPriority } : report
    );
    savePersistedReports(updatedAllReports);
  };

  const handleAssignReport = (report) => {
    setSelectedReport(report);
    setSelectedTechnician('');
    setSelectedPriority(report.priority || 'medium');
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
            assignedSpecialty: technician.specialtyLabel || technician.specialty,
            category: technician.specialtyLabel || technician.specialty,
            priority: selectedPriority,
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
            assignedSpecialty: technician.specialtyLabel || technician.specialty,
            category: technician.specialtyLabel || technician.specialty,
            priority: selectedPriority,
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

  const getAvailableTechnicians = (report) => {
    if (!report) return [];
    const allTechs = getTechnicians();
    return allTechs.filter(tech => tech.hallId === report.hallId);
  };

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter);

  const getStatusCount = (status) => {
    if (status === 'all') return reports.length;
    return reports.filter(r => r.status === status).length;
  };

  const showHallSelector = user?.role === 'super_admin';
  const canAssign = user?.role === 'hall_admin';

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
                <th>Photo/Video</th>
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
                        background: '#FFFFFF', 
                        border: '1px solid #E5E7EB',
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#1E40AF',
                        fontWeight: '500'
                      }}>
                        {report.assignedName}
                      </span>
                    ) : (
                      <span style={{ color: '#6B7280', fontSize: '12px' }}>Not assigned</span>
                    )}
                  </td>
                  <td>
                    {canAssign ? (
                      <select
                        value={report.priority}
                        onChange={(e) => handlePriorityChange(report.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #D1D5DB',
                          background: 'white',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: report.priority === 'high' ? '#DC2626' : 
                                 report.priority === 'medium' ? '#F59E0B' : '#10B981',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="low" style={{ color: '#10B981' }}>LOW</option>
                        <option value="medium" style={{ color: '#F59E0B' }}>MEDIUM</option>
                        <option value="high" style={{ color: '#DC2626' }}>HIGH</option>
                      </select>
                    ) : (
                      <span style={{ 
                        color: report.priority === 'high' ? '#DC2626' : 
                               report.priority === 'medium' ? '#F59E0B' : '#10B981',
                        fontWeight: '500',
                        fontSize: '13px'
                      }}>
                        {report.priority}
                      </span>
                    )}
                  </td>
                  <td>
                    {report.imageUri ? (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => handleViewImage(report.imageUri)}
                      >
                        {isVideo(report.imageUri) ? '🎥 View' : '📷 View'}
                      </button>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '12px' }}>No media</span>
                    )}
                  </td>
                  <td>
                    {canAssign && report.status !== 'resolved' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 12px', fontSize: '12px' }}
                          onClick={() => handleAssignReport(report)}
                        >
                          {report.assignedTo ? 'Reassign' : 'Assign'}
                        </button>
                        {report.assignedTo && (
                          <select
                            className="status-select"
                            value={report.status}
                            onChange={(e) => handleStatusChange(report.id, e.target.value)}
                            style={{ margin: 0 }}
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        )}
                      </div>
                    )}
                    {!report.assignedTo && report.status === 'pending' && !canAssign && (
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
          background: 'rgba(17,24,39,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid #F3F4F6',
              background: 'linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 70%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: '#10B981',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}>🛠️</div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                    {selectedReport.assignedTo ? 'Reassign Report' : 'Assign Report'}
                  </h2>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>
                    Report #{selectedReport.id} · {selectedReport.hallName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                aria-label="Close"
                style={{
                  border: 'none',
                  background: '#F3F4F6',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  fontSize: '15px',
                  flexShrink: 0
                }}
              >✕</button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
              {/* Report summary */}
              <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {selectedReport.imageUri && (
                  isVideo(selectedReport.imageUri) ? (
                    <video
                      src={selectedReport.imageUri}
                      onClick={() => handleViewImage(selectedReport.imageUri)}
                      style={{
                        width: '104px',
                        height: '104px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        cursor: 'zoom-in',
                        flexShrink: 0,
                        background: 'black'
                      }}
                    />
                  ) : (
                    <img
                      src={selectedReport.imageUri}
                      alt="Evidence"
                      onClick={() => handleViewImage(selectedReport.imageUri)}
                      style={{
                        width: '104px',
                        height: '104px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        cursor: 'zoom-in',
                        flexShrink: 0
                      }}
                    />
                  )
                )}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 6px' }}>
                    {selectedReport.issue}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#F3F4F6',
                      color: '#374151',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {getCategoryIcon(selectedReport.category)} {selectedReport.category}
                    </span>
                    <span className={`badge badge-${selectedReport.status}`}>
                      {getStatusLabel(selectedReport.status)}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                    {selectedReport.description}
                  </p>
                </div>
              </div>

              {/* Meta */}
              <div style={{
                background: '#F9FAFB',
                border: '1px solid #F3F4F6',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px 16px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>📍 Location</div>
                  <div style={{ fontSize: '13px', color: '#1F2937', fontWeight: '500' }}>{selectedReport.location}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>👤 Student</div>
                  <div style={{ fontSize: '13px', color: '#1F2937', fontWeight: '500' }}>{selectedReport.studentName}</div>
                </div>
              </div>

              {/* Technician */}
              {(() => {
                const techs = getAvailableTechnicians(selectedReport);
                const matching = techs.filter(
                  t => t.specialty?.toLowerCase() === selectedReport.category?.toLowerCase()
                );
                return (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      Assign Technician <span style={{ color: '#10B981' }}>*</span>
                    </label>
                    <select
                      value={selectedTechnician}
                      onChange={(e) => setSelectedTechnician(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        background: '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select a technician...</option>
                      {techs.map((tech) => {
                        const isMatch = tech.specialty?.toLowerCase() === selectedReport.category?.toLowerCase();
                        return (
                          <option
                            key={tech.id}
                            value={tech.id}
                            disabled={!isMatch}
                            style={{ color: isMatch ? '#1F2937' : '#9CA3AF' }}
                          >
                            {tech.name} ({tech.specialtyLabel || tech.specialty}){!isMatch ? ' — mismatched specialty' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {matching.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '6px' }}>
                        ⚠️ No {selectedReport.category} technician available in this hall.
                      </p>
                    ) : (
                      <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '6px' }}>
                        {matching.length} {selectedReport.category} technician{matching.length > 1 ? 's' : ''} available · others are disabled.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Priority */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Set Priority <span style={{ color: '#10B981' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {PRIORITY_OPTIONS.map((opt) => {
                    const active = selectedPriority === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedPriority(opt.value)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          border: active ? `2px solid ${opt.color}` : '1px solid #E5E7EB',
                          background: active ? opt.bg : '#FFFFFF',
                          color: active ? opt.color : '#6B7280',
                          fontWeight: active ? '700' : '500',
                          fontSize: '13px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{opt.icon}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '16px 24px',
              borderTop: '1px solid #F3F4F6',
              background: '#FFFFFF'
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAssignModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssignTechnician}
                disabled={!selectedTechnician}
                style={{
                  flex: 2,
                  opacity: !selectedTechnician ? 0.5 : 1,
                  cursor: !selectedTechnician ? 'not-allowed' : 'pointer'
                }}
              >
                {selectedReport.assignedTo ? '🔄 Reassign Technician' : '✓ Assign Technician'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div
          onClick={() => setShowImageModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '20px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>📁 Evidence Media</h3>
              <button
                onClick={() => setShowImageModal(false)}
                aria-label="Close"
                style={{
                  border: 'none',
                  background: '#F3F4F6',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  fontSize: '15px'
                }}
              >✕</button>
            </div>
            {isVideo(selectedImage) ? (
              <video
                src={selectedImage}
                controls
                autoPlay
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  display: 'block',
                  background: 'black',
                  maxHeight: '70vh'
                }}
              />
            ) : (
              <img
                src={selectedImage}
                alt="Evidence"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  display: 'block'
                }}
              />
            )}
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', marginTop: '12px' }}>
              Tap outside the media or press “✕” to return.
            </p>
          </div>
        </div>
      )}
    </>
  );
}