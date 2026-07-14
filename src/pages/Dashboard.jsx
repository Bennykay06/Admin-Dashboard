// src/pages/Dashboard.jsx - COMPREHENSIVE HALL ADMIN OVERVIEW WITH TECHNICIAN ASSIGNMENT
import React, { useState, useEffect } from 'react';
import { 
  getReportsByHall, 
  getPersistedHalls, 
  getTechnicians, 
  getPersistedReports, 
  savePersistedReports 
} from '../data/mockData';

export default function Dashboard({ user }) {
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    scheduled: 0,
    inProgress: 0,
    resolved: 0
  });
  
  const [reports, setReports] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);
  const [halls, setHalls] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const isVideo = (uri) => {
    if (!uri) return false;
    return uri.startsWith('data:video/') || uri.toLowerCase().endsWith('.mp4') || uri.toLowerCase().endsWith('.mov') || uri.toLowerCase().endsWith('.webm');
  };

  const loadData = () => {
    setHalls(getPersistedHalls());
    setTechnicians(getTechnicians());

    const hallId = isSuperAdmin ? selectedHall : user?.hallId;
    const hallReports = getReportsByHall(hallId);
    
    // Sort reports: newest first
    const sortedReports = [...hallReports].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setReports(sortedReports);

    const total = hallReports.length;
    const pending = hallReports.filter(r => r.status === 'pending').length;
    const scheduled = hallReports.filter(r => r.status === 'scheduled').length;
    const inProgress = hallReports.filter(r => r.status === 'in-progress').length;
    const resolved = hallReports.filter(r => r.status === 'resolved').length;
    
    setStats({ total, pending, scheduled, inProgress, resolved });
  };

  // Load stats and reports dynamically
  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      window.addEventListener('mock-data-updated', loadData);
      return () => window.removeEventListener('mock-data-updated', loadData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedHall, isSuperAdmin]);

  const handleAssignTechnician = (reportId, techId) => {
    const allReports = getPersistedReports();
    const tech = technicians.find(t => String(t.id) === String(techId));
    
    const updated = allReports.map(report => {
      if (report.id === reportId) {
        // Safe type assignment supporting both seeded numeric IDs (e.g. 4) and custom string IDs (e.g. 't12345')
        const finalTechId = techId ? (isNaN(Number(techId)) ? techId : Number(techId)) : null;
        return {
          ...report,
          assignedTo: finalTechId,
          assignedName: tech ? tech.name : null,
          assignedSpecialty: tech ? tech.specialty : null,
          status: techId ? 'scheduled' : 'pending' // Transition status on assignment
        };
      }
      return report;
    });
    
    savePersistedReports(updated);
    
    // Dispatch global event so the other windows/tabs catch database mutations
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mock-data-updated'));
    }

    loadData();
  };

  const getHallDisplay = () => {
    if (isSuperAdmin) {
      if (selectedHall) {
        const hall = halls.find(h => String(h.id) === String(selectedHall));
        return hall ? hall.name : 'All Halls';
      }
      return 'All Halls';
    }
    return user?.hallName || 'Your Hall';
  };

  const getInitials = (name) => {
    if (!name) return 'SA';
    const parts = name.trim().toUpperCase().split(/\s+/);
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return parts[0].slice(0, 2);
  };

  const recentReports = reports.slice(0, 15); // Show top 15 reports directly in the dashboard

  return (
    <div className="font-headline-md min-h-screen p-4 md:p-8 animate-fade-in-up space-y-8">
      {/* Dashboard Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="font-headline-xl text-headline-xl font-bold text-deep-charcoal tracking-tight">
            {getHallDisplay()} Overview
          </h2>
          <p className="text-secondary font-body-lg mt-1 border-l-2 border-deep-charcoal pl-4">
            Manage residential logs, track maintenance reports, and delegate jobs to specialists.
          </p>
        </div>

        {/* Global Hall Selector (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="relative w-full md:w-64">
            <select
              value={selectedHall || ''}
              onChange={(e) => setSelectedHall(e.target.value ? Number(e.target.value) : null)}
              className="w-full premium-select appearance-none pl-4 pr-10 py-3"
            >
              <option value="">All Residence Halls</option>
              {halls.map((hall) => (
                <option key={hall.id} value={hall.id}>
                  {hall.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
              expand_more
            </span>
          </div>
        )}
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <span className="material-symbols-outlined text-deep-charcoal">assignment</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Total</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">Reports Raised</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{stats.total}</span>
          </div>
        </div>

        {/* Pending */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <span className="material-symbols-outlined text-status-critical-text" style={{ color: 'var(--status-critical-text)' }}>info</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Pending</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">Unassigned</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{stats.pending}</span>
          </div>
        </div>

        {/* Scheduled */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <span className="material-symbols-outlined text-status-pending-text" style={{ color: 'var(--status-pending-text)' }}>calendar_today</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Scheduled</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">Assigned</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{stats.scheduled}</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <span className="material-symbols-outlined text-status-pending-text" style={{ color: 'var(--status-pending-text)' }}>engineering</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Fixing</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">In Progress</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{stats.inProgress}</span>
          </div>
        </div>

        {/* Resolved */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <span className="material-symbols-outlined text-status-success-text" style={{ color: 'var(--status-success-text)' }}>check_circle</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Done</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">Resolved</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{stats.resolved}</span>
          </div>
        </div>
      </div>

      {/* Master Reports Table Container */}
      <div className="premium-card overflow-hidden">
        <div className="px-8 py-6 border-b border-border-light bg-surface-low/50 flex justify-between items-center">
          <h4 className="font-title-md text-title-md font-bold uppercase tracking-widest text-deep-charcoal">
            {isSuperAdmin ? 'Global Maintenance Log' : 'Recent Hall Reports'}
          </h4>
        </div>
        
        <div className="overflow-x-auto thin-scrollbar">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Student Name</th>
                {isSuperAdmin && <th>Residence Hall</th>}
                <th>Location</th>
                <th>Fault Category</th>
                <th>Specific Faults</th>
                <th>Assign Technician</th>
                <th>Evidence</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.length > 0 ? (
                recentReports.map((report) => {
                  // Filter technicians by the hall assigned to the report
                  const availableTechs = technicians.filter(
                    t => String(t.hallId) === String(report.hallId)
                  );

                  return (
                    <tr key={report.id}>
                      {/* Student Name */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-deep-charcoal text-white flex items-center justify-center font-bold text-[10px] rounded-lg">
                            {getInitials(report.studentName)}
                          </div>
                          <span className="font-bold text-[13px] text-deep-charcoal">
                            {report.studentName}
                          </span>
                        </div>
                      </td>

                      {/* Residence Hall (Super Admin only) */}
                      {isSuperAdmin && (
                        <td>
                          <span className="font-semibold text-xs text-secondary">
                            {report.hallName}
                          </span>
                        </td>
                      )}

                      {/* Location */}
                      <td className="text-secondary text-sm font-semibold">
                        {report.location}
                      </td>

                      {/* Fault Category */}
                      <td>
                        <span className="monochromatic-badge inline-block uppercase tracking-wider text-[10px] scheduled">
                          {report.category || 'General'}
                        </span>
                      </td>

                      {/* Specific Faults */}
                      <td>
                        <div className="font-bold text-deep-charcoal text-[13px]">{report.issue}</div>
                        <div className="text-[11px] text-secondary italic mt-0.5 max-w-[200px] truncate" title={report.description}>
                          {report.description || 'No additional details.'}
                        </div>
                      </td>

                      {/* Assign Technician Dropdown */}
                      <td>
                        <div className="relative">
                          <select
                            value={report.assignedTo || ''}
                            onChange={(e) => handleAssignTechnician(report.id, e.target.value)}
                            className={`premium-select text-xs py-1.5 pl-3 pr-8 min-w-[170px] appearance-none ${
                              report.assignedTo ? 'bg-status-success/5 border-status-success/30 font-bold text-status-success-text' : ''
                            }`}
                          >
                            <option value="">Unassigned</option>
                            {availableTechs.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.specialty})
                              </option>
                            ))}
                          </select>
                          <span className={`material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-secondary text-[16px] ${
                            report.assignedTo ? 'text-status-success-text' : ''
                          }`}>
                            expand_more
                          </span>
                        </div>
                        {report.assignedTo && (
                          <div className="text-[10px] text-status-success-text font-bold mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            Assigned to {report.assignedName || 'Technician'}
                          </div>
                        )}
                      </td>

                      {/* Photo/Video Evidence Button */}
                      <td>
                        {report.imageUri || (report.photos && report.photos.length > 0) || report.video ? (
                          <button
                            onClick={() => {
                              const mediaUri = report.imageUri || (report.photos && report.photos[0]) || report.video;
                              setSelectedImage(mediaUri);
                              setShowImageModal(true);
                            }}
                            className="outline-btn text-[11px] py-1.5 px-3 flex items-center gap-1 hover:bg-surface-high transition-all"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {isVideo(report.imageUri || (report.photos && report.photos[0]) || report.video) ? 'movie' : 'image'}
                            </span>
                            View Media
                          </button>
                        ) : (
                          <span className="text-[11px] text-secondary italic">No media</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="text-center">
                        <span className={`monochromatic-badge ${
                          report.status === 'resolved' 
                            ? 'success' 
                            : report.status === 'in-progress'
                            ? 'in-progress'
                            : report.status === 'scheduled'
                            ? 'scheduled'
                            : 'pending'
                        }`}>
                          {report.status.replace('-', ' ')}
                        </span>
                        {report.assignedTo && (
                          <div className="text-[10px] text-secondary font-semibold mt-1">
                            {report.assignedName}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isSuperAdmin ? 8 : 7} className="text-center py-12 text-secondary font-medium">
                    No reports registered under this scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== EVIDENCE MEDIA PREVIEW MODAL ===== */}
      {showImageModal && selectedImage && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="modal-content bg-white border border-border-medium rounded-xl p-6 max-w-2xl w-full shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-deep-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined">image</span>
                Evidence Media
              </h3>
              <button
                className="outline-btn py-1 px-3 text-xs"
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedImage('');
                }}
              >
                ✕ Close
              </button>
            </div>
            <div className="flex-1 bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
              {isVideo(selectedImage) ? (
                <video 
                  src={selectedImage} 
                  controls
                  autoPlay
                  className="max-h-[60vh] w-full object-contain"
                />
              ) : (
                <img 
                  src={selectedImage} 
                  alt="Evidence" 
                  className="max-h-[60vh] w-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}