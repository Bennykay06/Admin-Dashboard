// src/pages/Dashboard.jsx - COMPREHENSIVE HALL ADMIN OVERVIEW
//
// Used to also handle technician assignment (a dropdown per report). The
// technician role was removed (see remove_technician_role.sql), so this
// page now lets hall_admin/super_admin move a report's status directly
// instead of delegating it to an assigned technician.
import React, { useState, useEffect } from 'react';
import {
  getReportsByHall,
  getPersistedHalls,
  updateReport,
  useStoreVersion,
} from '../data/mockData';
import RealTimeAnalytics from '../components/RealTimeAnalytics';


export default function Dashboard({ user }) {
  const isSuperAdmin = user?.role === 'super_admin';
  const version = useStoreVersion();

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    scheduled: 0,
    resolved: 0
  });

  const [reports, setReports] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);
  const [halls, setHalls] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedReportMedia, setSelectedReportMedia] = useState([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState(null);

  const isVideo = (uri) => {
    if (!uri) return false;
    return uri.startsWith('data:video/') || uri.toLowerCase().endsWith('.mp4') || uri.toLowerCase().endsWith('.mov') || uri.toLowerCase().endsWith('.webm');
  };

  const getReportMedia = (report) => {
    const media = [];
    if (report.imageUri) {
      media.push({
        uri: report.imageUri,
        type: isVideo(report.imageUri) ? 'video' : 'image'
      });
    }
    if (report.photos && Array.isArray(report.photos)) {
      report.photos.forEach(photo => {
        if (photo && !media.some(m => m.uri === photo)) {
          media.push({
            uri: photo,
            type: isVideo(photo) ? 'video' : 'image'
          });
        }
      });
    }
    if (report.video) {
      if (!media.some(m => m.uri === report.video)) {
        media.push({
          uri: report.video,
          type: 'video'
        });
      }
    }
    return media;
  };

  const loadData = () => {
    setHalls(getPersistedHalls());

    const hallId = isSuperAdmin ? selectedHall : user?.hallId;
    const hallReports = getReportsByHall(hallId);

    // Sort reports: newest first
    const sortedReports = [...hallReports].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setReports(sortedReports);

    const total = hallReports.length;
    const pending = hallReports.filter(r => r.status === 'pending').length;
    const resolved = hallReports.filter(r => r.status === 'resolved').length;
    // Anything that is neither still waiting nor finished counts as scheduled,
    // so a legacy 'in-progress' row from before that state was retired is
    // still represented rather than silently dropping out of the totals.
    const scheduled = total - pending - resolved;

    setStats({ total, pending, scheduled, resolved });
  };

  // Load stats and reports dynamically. `version` bumps whenever realtime
  // delivers a change, so a report filed on a student's phone shows up here
  // without anyone refreshing the page.
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedHall, isSuperAdmin, version]);

  const handleStatusChange = async (report, newStatus) => {
    if (newStatus === report.status) return;

    const changes = { status: newStatus };
    if (newStatus === 'resolved') {
      const notes = window.prompt('Add resolution notes (optional):', report.technicianNotes || '');
      if (notes === null) return; // user cancelled the whole update
      changes.technicianNotes = notes;
      changes.repairDate = new Date().toISOString();
    }

    const { error } = await updateReport(report.id, changes);
    if (error) alert(`Could not update this report: ${error}`);
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

  const filteredReports = activeFilter
    ? reports.filter(r => r.status === activeFilter)
    : reports;

  const recentReports = filteredReports.slice(0, 15); // Show top 15 reports directly in the dashboard

  return (
    <div className="font-headline-md min-h-screen p-4 md:p-8 animate-fade-in-up space-y-8">
      {/* Dashboard Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="font-headline-xl text-headline-xl font-bold text-deep-charcoal tracking-tight">
            {getHallDisplay()} Overview
          </h2>
          <p className="text-secondary font-body-lg mt-1 border-l-2 border-deep-charcoal pl-4">
            Manage residential logs and track maintenance reports through to resolution.
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

      {/* Real-time distribution graph replacing the old static cards */}
      <RealTimeAnalytics
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Master Reports Table Container */}
      <div className="premium-card overflow-hidden">
        <div className="px-8 py-6 border-b border-border-light bg-surface-low/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h4 className="font-title-md text-title-md font-bold uppercase tracking-widest text-deep-charcoal">
            {isSuperAdmin ? 'Global Maintenance Log' : 'Recent Hall Reports'}
            {activeFilter && (
              <span className="ml-2 text-xs font-semibold normal-case text-secondary bg-surface-mid px-2.5 py-1 rounded-md border border-border-light">
                Filtered by {activeFilter.replace('-', ' ')}
              </span>
            )}
          </h4>
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="outline-btn text-[10px] py-1 px-2.5 flex items-center gap-1 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
              Clear Filter
            </button>
          )}
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
                <th>Evidence</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.length > 0 ? (
                recentReports.map((report) => (
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

                    {/* Photo/Video Evidence Button */}
                    <td>
                      {report.imageUri || (report.photos && report.photos.length > 0) || report.video ? (
                        <button
                          onClick={() => {
                            const media = getReportMedia(report);
                            setSelectedReportMedia(media);
                            setActiveMediaIndex(0);
                            setShowImageModal(true);
                          }}
                          className="outline-btn text-[11px] py-1.5 px-3 flex items-center gap-1 hover:bg-surface-high transition-all"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {getReportMedia(report).some(m => m.type === 'video')
                              ? (getReportMedia(report).some(m => m.type === 'image') ? 'perm_media' : 'movie')
                              : 'image'}
                          </span>
                          View Media ({getReportMedia(report).length})
                        </button>
                      ) : (
                        <span className="text-[11px] text-secondary italic">No media</span>
                      )}
                    </td>

                    {/* Status: badge + control to move it forward */}
                    <td className="text-center">
                      <span className={`monochromatic-badge ${
                        report.status === 'resolved'
                          ? 'success'
                          : report.status === 'pending'
                          ? 'pending'
                          : 'scheduled'
                      }`}>
                        {report.status === 'pending' || report.status === 'resolved'
                          ? report.status
                          : 'scheduled'}
                      </span>
                      <div className="relative mt-2">
                        <select
                          value={
                            report.status === 'pending' || report.status === 'resolved'
                              ? report.status
                              : 'scheduled'
                          }
                          onChange={(e) => handleStatusChange(report, e.target.value)}
                          className="premium-select text-[10px] py-1 pl-2 pr-6 appearance-none w-full min-w-[120px]"
                        >
                          <option value="pending">Pending</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="text-center py-12 text-secondary font-medium">
                    No reports registered under this scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== EVIDENCE MEDIA PREVIEW MODAL ===== */}
      {showImageModal && selectedReportMedia && selectedReportMedia.length > 0 && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in bg-black/60 backdrop-blur-sm">
          <div className="modal-content bg-white border border-border-medium rounded-xl p-6 max-w-3xl w-full shadow-2xl flex flex-col">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-deep-charcoal uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined">perm_media</span>
                  Evidence Files
                </h3>
                <span className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-0.5">
                  Item {activeMediaIndex + 1} of {selectedReportMedia.length} — {
                    selectedReportMedia.filter(m => m.type === 'image').length
                  } Photo(s), {
                    selectedReportMedia.filter(m => m.type === 'video').length
                  } Video(s)
                </span>
              </div>
              <button
                className="outline-btn py-1 px-3 text-xs"
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedReportMedia([]);
                  setActiveMediaIndex(0);
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Main Viewer Area */}
            <div className="relative flex-1 bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[360px] max-h-[60vh]">
              {/* Prev Button */}
              {selectedReportMedia.length > 1 && (
                <button
                  onClick={() => setActiveMediaIndex((activeMediaIndex - 1 + selectedReportMedia.length) % selectedReportMedia.length)}
                  className="absolute left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer select-none"
                >
                  <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                </button>
              )}

              {/* Main Content Display */}
              {selectedReportMedia[activeMediaIndex].type === 'video' ? (
                <video
                  key={selectedReportMedia[activeMediaIndex].uri}
                  src={selectedReportMedia[activeMediaIndex].uri}
                  controls
                  autoPlay
                  className="max-h-[60vh] max-w-full object-contain"
                />
              ) : (
                <img
                  src={selectedReportMedia[activeMediaIndex].uri}
                  alt={`Evidence ${activeMediaIndex + 1}`}
                  className="max-h-[60vh] max-w-full object-contain"
                />
              )}

              {/* Next Button */}
              {selectedReportMedia.length > 1 && (
                <button
                  onClick={() => setActiveMediaIndex((activeMediaIndex + 1) % selectedReportMedia.length)}
                  className="absolute right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer select-none"
                >
                  <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                </button>
              )}
            </div>

            {/* Thumbnail Row (only if more than 1 item) */}
            {selectedReportMedia.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto py-2 thin-scrollbar justify-center">
                {selectedReportMedia.map((media, idx) => {
                  const isActive = idx === activeMediaIndex;
                  return (
                    <div
                      key={media.uri}
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 ${
                        isActive ? 'border-deep-charcoal scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      {media.type === 'video' ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-[20px]">play_circle</span>
                        </div>
                      ) : (
                        <img
                          src={media.uri}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
