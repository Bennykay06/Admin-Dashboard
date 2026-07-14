// src/pages/TechnicianDashboard.jsx - UNIFIED TECHNICIAN DASHBOARD
import React, { useState, useEffect } from 'react';
import { 
  getReportsByTechnician, 
  getStatusLabel, 
  getPersistedReports,
  savePersistedReports
} from '../data/mockData';

const isVideo = (uri) => {
  if (!uri) return false;
  return uri.startsWith('data:video/') || uri.toLowerCase().endsWith('.mp4') || uri.toLowerCase().endsWith('.mov') || uri.toLowerCase().endsWith('.webm');
};

export default function TechnicianDashboard({ user }) {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  
  // Form fields for updating report
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');

  useEffect(() => {
    const loadTechData = () => {
      if (user?.id) {
        const techReports = getReportsByTechnician(user.id);
        setReports(techReports);
      }
    };

    loadTechData();

    if (typeof window !== 'undefined') {
      window.addEventListener('mock-data-updated', loadTechData);
      return () => window.removeEventListener('mock-data-updated', loadTechData);
    }
  }, [user]);

  // Poll chat messages in real time when update modal is open
  useEffect(() => {
    if (!showUpdateModal || !selectedReport) return;

    const chatKey = `chat:${selectedReport.id}`;
    
    const loadChat = () => {
      // Fallback to local storage
      const rawChat = localStorage.getItem(chatKey);
      if (rawChat) {
        try {
          const parsed = JSON.parse(rawChat);
          setChatMessages(parsed.messages || []);
        } catch (e) {}
      }
    };

    loadChat();
    const interval = setInterval(loadChat, 2000);
    return () => clearInterval(interval);
  }, [showUpdateModal, selectedReport]);

  const refreshReports = () => {
    if (user?.id) {
      const techReports = getReportsByTechnician(user.id);
      setReports(techReports);
    }
  };

  const handleOpenUpdate = (report) => {
    setSelectedReport(report);
    setProposedDate(report.appointmentDate || '');
    setProposedTime(report.appointmentTime || '');

    // Load Chat history from localStorage
    const chatKey = `chat:${report.id}`;
    const rawChat = localStorage.getItem(chatKey);
    if (rawChat) {
      try {
        const parsed = JSON.parse(rawChat);
        setChatMessages(parsed.messages || []);
      } catch (e) {
        setChatMessages([]);
      }
    } else {
      setChatMessages([]);
    }

    setShowUpdateModal(true);
  };

  const handleResolveJob = () => {
    if (!selectedReport) return;

    // Update status to resolved
    const allReports = getPersistedReports();
    const updatedAllReports = allReports.map(report => 
      report.id === selectedReport.id 
        ? { 
            ...report, 
            status: 'resolved',
            repairDate: new Date().toISOString()
          }
        : report
    );
    savePersistedReports(updatedAllReports);

    setShowUpdateModal(false);
    setSelectedReport(null);
    setProposedDate('');
    setProposedTime('');
    setChatMessages([]);
    setNewMessageText('');
    refreshReports();
    alert('Job marked as Resolved!');
  };
  const handleSendMessage = () => {
    if (!newMessageText.trim() || !selectedReport) return;

    const msg = {
      id: Date.now().toString(),
      text: newMessageText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isTechnician: true
    };

    const updatedMessages = [...chatMessages, msg];
    setChatMessages(updatedMessages);
    setNewMessageText('');

    // Save to localStorage
    const chatKey = `chat:${selectedReport.id}`;
    const payload = { messages: updatedMessages };
    localStorage.setItem(chatKey, JSON.stringify(payload));
  };

  const handleClearChat = () => {
    if (!selectedReport) return;
    if (window.confirm("Are you sure you want to clear the entire chat history for this job?")) {
      const chatKey = `chat:${selectedReport.id}`;
      localStorage.removeItem(chatKey);
      setChatMessages([]);
      
      const sysMsg = {
        id: `sys-${Date.now()}`,
        text: `Chat history was cleared.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      };
      
      const payload = { messages: [sysMsg] };
      localStorage.setItem(chatKey, JSON.stringify(payload));
      setChatMessages([sysMsg]);
    }
  };

  const handleSuggestAppointmentInChat = (date, time) => {
    if (!date || !time || !selectedReport) return;
    
    // 1. Post a system message in the chat
    const msg = {
      id: `sys-${Date.now()}`,
      text: `Technician proposed an appointment: ${date} at ${time}.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isTechnician: true,
      isSystem: true
    };
    
    const updatedMessages = [...chatMessages, msg];
    setChatMessages(updatedMessages);
    
    // Save chat
    const chatKey = `chat:${selectedReport.id}`;
    const payload = { messages: updatedMessages };
    localStorage.setItem(chatKey, JSON.stringify(payload));

    // 2. Set report proposed date/time in state
    setProposedDate(date);
    setProposedTime(time);

    // 3. Update report in localStorage immediately so the student app sees it instantly
    const allReports = getPersistedReports();
    const updatedAllReports = allReports.map(report => 
      report.id === selectedReport.id 
        ? { 
            ...report, 
            status: 'scheduled',
            appointmentStatus: 'pending_confirmation',
            appointmentDate: date,
            appointmentTime: time,
          }
        : report
    );
    savePersistedReports(updatedAllReports);
    refreshReports();
  };



  const handleViewImage = (imageUri) => {
    setSelectedImage(imageUri);
    setShowImageModal(true);
  };

  // Stats calculation
  const totalReports = reports.length;
  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const scheduledCount = reports.filter(r => r.status === 'scheduled').length;
  const inProgressCount = reports.filter(r => r.status === 'in-progress').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;

  const getStatusCount = (statusTab) => {
    if (statusTab === 'all') return reports.length;
    return reports.filter(r => r.status === statusTab).length;
  };

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter);

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().toUpperCase().split(/\s+/);
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return parts[0].slice(0, 2);
  };

  return (
    <div className="font-headline-md min-h-screen p-4 md:p-8 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div>
          <h2 className="font-headline-xl text-headline-xl font-bold text-deep-charcoal tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px]">
              {user?.specialtyIcon === '⚡' ? 'bolt' : 
               user?.specialtyIcon === '🔧' ? 'build' : 
               user?.specialtyIcon === '🪚' ? 'handyman' : 
               user?.specialtyIcon === '🧱' ? 'foundation' : 'construction'}
            </span>
            {user?.specialtyLabel || 'Technician'} Technician
          </h2>
          <p className="text-secondary font-body-lg mt-1 border-l-2 border-deep-charcoal pl-4">
            Welcome back, <strong className="text-deep-charcoal font-semibold">{user?.name || 'Technician'}</strong> • Managing {user?.specialtyLabel || 'maintenance'} issues for {user?.hallName || 'your hall'}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="bg-surface-white border border-border-medium px-4 py-2 flex items-center gap-2 rounded-lg font-bold tracking-widest text-[11px] uppercase shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-secondary">domain</span>
            <span>{user?.hallName || 'Your Hall'}</span>
          </span>
          <span className="bg-surface-white border border-border-medium px-4 py-2 flex items-center gap-2 rounded-lg font-bold tracking-widest text-[11px] uppercase shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
            <span>{user?.specialtyLabel || 'General'} Specialist</span>
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 mb-10">
        {/* Total Assigned */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <span className="material-symbols-outlined text-deep-charcoal">assignment</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Jobs</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">Assigned Jobs</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{totalReports}</span>
          </div>
        </div>

        {/* Pending */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <span className="material-symbols-outlined text-status-pending-text" style={{ color: 'var(--status-pending-text)' }}>hourglass_empty</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Queue</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">Pending</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{pendingCount}</span>
          </div>
        </div>

        {/* Scheduled */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <span className="material-symbols-outlined text-status-scheduled-text" style={{ color: 'var(--status-scheduled-text)' }}>calendar_month</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Planned</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">Scheduled</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{scheduledCount}</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <span className="material-symbols-outlined text-status-progress-text" style={{ color: 'var(--status-progress-text)' }}>sync</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Active</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">In Progress</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{inProgressCount}</span>
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
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{resolvedCount}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-10 overflow-x-auto thin-scrollbar pb-4 border-b border-black/10">
        <div className="flex gap-4 min-w-max">
          <button 
            className={`px-6 py-2 font-label-md text-label-md uppercase tracking-widest transition-all rounded-lg ${
              filter === 'all' 
                ? 'bg-black text-white shadow' 
                : 'bg-white border border-black/20 text-black hover:bg-black hover:text-white'
            }`}
            onClick={() => setFilter('all')}
          >
            All Jobs ({getStatusCount('all')})
          </button>
          <button 
            className={`px-6 py-2 font-label-md text-label-md uppercase tracking-widest transition-all rounded-lg ${
              filter === 'pending' 
                ? 'bg-black text-white shadow' 
                : 'bg-white border border-black/20 text-black hover:bg-black hover:text-white'
            }`}
            onClick={() => setFilter('pending')}
          >
            Pending ({getStatusCount('pending')})
          </button>
          <button 
            className={`px-6 py-2 font-label-md text-label-md uppercase tracking-widest transition-all rounded-lg ${
              filter === 'scheduled' 
                ? 'bg-black text-white shadow' 
                : 'bg-white border border-black/20 text-black hover:bg-black hover:text-white'
            }`}
            onClick={() => setFilter('scheduled')}
          >
            Scheduled ({getStatusCount('scheduled')})
          </button>
          <button 
            className={`px-6 py-2 font-label-md text-label-md uppercase tracking-widest transition-all rounded-lg ${
              filter === 'in-progress' 
                ? 'bg-black text-white shadow' 
                : 'bg-white border border-black/20 text-black hover:bg-black hover:text-white'
            }`}
            onClick={() => setFilter('in-progress')}
          >
            In Progress ({getStatusCount('in-progress')})
          </button>
          <button 
            className={`px-6 py-2 font-label-md text-label-md uppercase tracking-widest transition-all rounded-lg ${
              filter === 'resolved' 
                ? 'bg-black text-white shadow' 
                : 'bg-white border border-black/20 text-black hover:bg-black hover:text-white'
            }`}
            onClick={() => setFilter('resolved')}
          >
            Resolved ({getStatusCount('resolved')})
          </button>
        </div>
      </div>

      {/* Job list table */}
      <div className="premium-card overflow-hidden">
        <div className="px-8 py-6 border-b border-border-light bg-surface-low/50 flex justify-between items-center">
          <h4 className="font-title-md text-title-md font-bold uppercase tracking-widest text-deep-charcoal">
            Active Job Queue
          </h4>
        </div>

        <div className="overflow-x-auto thin-scrollbar">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Student / Location</th>
                <th>Issue</th>
                <th>Priority</th>
                <th className="text-center">Status</th>
                <th className="text-center">Evidence</th>
                <th>Notes</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-secondary font-medium">
                    No assigned reports found for this status.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <span className="font-mono font-bold text-xs text-secondary">
                        #{report.id}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-deep-charcoal text-white flex items-center justify-center font-bold text-[10px] rounded-lg">
                          {getInitials(report.studentName)}
                        </div>
                        <div>
                          <div className="font-bold text-deep-charcoal text-[13px]">{report.studentName}</div>
                          <div className="text-[11px] text-secondary font-semibold flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {report.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-deep-charcoal flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          {report.category === 'Electrical' ? 'bolt' : 
                           report.category === 'Plumbing' ? 'build' : 
                           report.category === 'Carpentry' ? 'handyman' : 
                           report.category === 'Masonry' ? 'foundation' : 'construction'}
                        </span>
                        {report.issue}
                      </div>
                      <div className="text-[11px] text-secondary mt-1 max-w-[220px] truncate">
                        {report.description}
                      </div>
                    </td>
                    <td>
                      <span className={`monochromatic-badge ${
                        report.priority === 'high' ? 'critical' : report.priority === 'medium' ? 'scheduled' : 'in-progress'
                      }`}>
                        {report.priority}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col items-center gap-1">
                        <span className={`monochromatic-badge ${
                          report.status === 'resolved' ? 'success' : report.status === 'in-progress' ? 'in-progress' : report.status === 'scheduled' ? 'scheduled' : 'pending'
                        }`}>
                          {getStatusLabel(report.status)}
                        </span>
                        {report.appointmentStatus && (
                          <span className={`text-[10px] font-bold ${
                            report.appointmentStatus === 'confirmed' ? 'text-status-success-text' : 
                            report.appointmentStatus === 'declined' ? 'text-status-critical-text' : 'text-status-pending-text'
                          }`}>
                            {report.appointmentStatus === 'confirmed' ? `Confirmed (${report.appointmentDate})` : 
                             report.appointmentStatus === 'declined' ? 'Declined' : 'Awaiting Student'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      {report.imageUri ? (
                        <button
                          className="outline-btn mx-auto text-[10px] py-1 px-2.5"
                          onClick={() => handleViewImage(report.imageUri)}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isVideo(report.imageUri) ? 'movie' : 'image'}
                          </span>
                          {isVideo(report.imageUri) ? 'Video' : 'Photo'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-secondary italic">No media</span>
                      )}
                    </td>
                    <td className="text-[12px] text-secondary italic max-w-[150px] truncate">
                      {report.technicianNotes || <span className="text-neutral-300 not-italic">—</span>}
                    </td>
                    <td className="text-right">
                      <button 
                        className="py-1.5 px-3 bg-black hover:bg-neutral-900 text-white rounded-lg font-bold text-xs transition-all shadow-sm"
                        onClick={() => handleOpenUpdate(report)}
                      >
                        Update Job
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
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white border border-border-medium rounded-xl p-8 max-w-4xl w-full h-[80vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 border-b border-border-light pb-4">
              <h2 className="text-xl font-bold text-deep-charcoal flex items-center gap-2">
                <span className="material-symbols-outlined">construction</span>
                Update Job #{selectedReport.id}
              </h2>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedReport(null);
                  setChatMessages([]);
                  setNewMessageText('');
                }}
                className="w-8 h-8 rounded-lg bg-surface-mid hover:bg-surface-high flex items-center justify-center text-secondary transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Columns */}
            <div className="flex-1 flex flex-col md:flex-row gap-8 overflow-hidden">
              {/* Left Column: Form & Details */}
              <div className="flex-1 overflow-y-auto thin-scrollbar pr-2 space-y-6">
                {/* Evidence Media */}
                {((selectedReport.photos && selectedReport.photos.length > 0) || selectedReport.video || selectedReport.imageUri) && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-black/60 block">
                      Student Media Evidence (Click to zoom/play)
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {selectedReport.photos && selectedReport.photos.length > 0 ? (
                        selectedReport.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo}
                            alt={`Evidence ${idx + 1}`}
                            onClick={() => handleViewImage(photo)}
                            className="w-16 h-16 object-cover rounded-lg border border-border-medium cursor-pointer hover:border-black transition-colors"
                          />
                        ))
                      ) : (
                        selectedReport.imageUri && !isVideo(selectedReport.imageUri) && (
                          <img
                            src={selectedReport.imageUri}
                            alt="Evidence"
                            onClick={() => handleViewImage(selectedReport.imageUri)}
                            className="w-16 h-16 object-cover rounded-lg border border-border-medium cursor-pointer hover:border-black transition-colors"
                          />
                        )
                      )}

                      {selectedReport.video ? (
                        <video
                          src={selectedReport.video}
                          onClick={() => handleViewImage(selectedReport.video)}
                          className="w-16 h-16 object-cover rounded-lg border border-border-medium cursor-pointer hover:border-black transition-colors bg-black"
                        />
                      ) : (
                        selectedReport.imageUri && isVideo(selectedReport.imageUri) && (
                          <video
                            src={selectedReport.imageUri}
                            onClick={() => handleViewImage(selectedReport.imageUri)}
                            className="w-16 h-16 object-cover rounded-lg border border-border-medium cursor-pointer hover:border-black transition-colors bg-black"
                          />
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Description Details Card */}
                <div className="bg-surface-low border border-border-light rounded-xl p-5 space-y-2.5 text-xs text-secondary">
                  <p className="text-deep-charcoal text-sm font-semibold">
                    {selectedReport.issue}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span className="font-semibold text-deep-charcoal">{selectedReport.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    <span>Student: {selectedReport.studentName} ({selectedReport.studentEmail})</span>
                  </div>
                  <div className="bg-white border border-border-medium rounded-lg p-3 italic text-deep-charcoal mt-2">
                    "{selectedReport.description}"
                  </div>
                </div>

                {/* Current Appointment Status */}
                {selectedReport.appointmentStatus && (
                  <div className={`border rounded-lg p-4 text-xs ${
                    selectedReport.appointmentStatus === 'confirmed' ? 'bg-status-success/5 border-status-success/30 text-status-success-text' : 
                    selectedReport.appointmentStatus === 'declined' ? 'bg-status-critical/5 border-status-critical/30 text-status-critical-text' : 
                    'bg-status-pending/5 border-status-pending/30 text-status-pending-text'
                  }`}>
                    <span className="font-bold text-[13px] block mb-1">
                      {selectedReport.appointmentStatus === 'confirmed' ? '📅 Confirmed Appointment' : 
                       selectedReport.appointmentStatus === 'declined' ? '❌ Declined Appointment' : '⏳ Awaiting Student Confirmation'}
                    </span>
                    <div>
                      {selectedReport.appointmentDate && selectedReport.appointmentTime 
                        ? `${selectedReport.appointmentDate} at ${selectedReport.appointmentTime}`
                        : 'No appointment date/time specified.'}
                    </div>
                  </div>
                )}

                {/* Form Inputs / Actions */}
                <div className="space-y-6 pt-2">
                  {selectedReport.appointmentStatus === 'confirmed' ? (
                    <div className="space-y-4">
                      <div className="bg-status-success/5 border border-status-success/30 rounded-xl p-5 text-center text-status-success-text space-y-2">
                        <span className="material-symbols-outlined text-[32px] block">check_circle</span>
                        <h4 className="font-bold text-sm">Appointment is Confirmed</h4>
                        <p className="text-[11px] leading-relaxed text-status-success-text/80">
                          Work is scheduled for {selectedReport.appointmentDate} at {selectedReport.appointmentTime}. Perform the repair, then set this job as resolved below.
                        </p>
                      </div>

                      {selectedReport.status !== 'resolved' && (
                        <button
                          onClick={handleResolveJob}
                          className="w-full py-3.5 bg-status-success/15 hover:bg-status-success/25 text-status-success-text border border-status-success/30 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[18px]">done_all</span>
                          Mark Job as Resolved
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Rescheduling Form */
                    <div className="border border-border-medium rounded-xl p-5 space-y-4 bg-surface-low/50">
                      <label className="text-xs font-bold text-deep-charcoal block uppercase tracking-wider">
                        📅 Set Appointment Proposal
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Proposal Date</span>
                          <input
                            type="text"
                            value={proposedDate}
                            onChange={(e) => setProposedDate(e.target.value)}
                            placeholder="e.g. Tomorrow"
                            className="w-full premium-input"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Proposal Time</span>
                          <input
                            type="text"
                            value={proposedTime}
                            onChange={(e) => setProposedTime(e.target.value)}
                            placeholder="e.g. 10:00 AM"
                            className="w-full premium-input"
                          />
                        </div>
                      </div>
                      {proposedDate && proposedTime && (
                        <button
                          type="button"
                          onClick={() => handleSuggestAppointmentInChat(proposedDate, proposedTime)}
                          className="w-full py-2.5 bg-black hover:bg-neutral-900 text-white rounded-lg font-bold text-xs transition-all shadow-sm"
                        >
                          Send Appointment Proposal
                        </button>
                      )}
                    </div>
                  )}

                  {/* Close Action */}
                  <div className="pt-6 border-t border-border-light">
                    <button
                      className="w-full py-3 bg-white border border-border-dark text-deep-charcoal hover:bg-surface-low rounded-lg font-bold text-sm transition-all"
                      onClick={() => {
                        setShowUpdateModal(false);
                        setSelectedReport(null);
                        setProposedDate('');
                        setProposedTime('');
                        setChatMessages([]);
                        setNewMessageText('');
                      }}
                    >
                      Close Modal
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Chat */}
              <div className="flex-1 border-t md:border-t-0 md:border-l border-border-light pt-6 md:pt-0 md:pl-6 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-deep-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined">chat</span>
                    Live Chat with Student
                  </h3>
                  {chatMessages.length > 0 && (
                    <button
                      onClick={handleClearChat}
                      className="text-[10px] font-bold text-status-critical-text hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[12px]">delete</span>
                      Clear Chat
                    </button>
                  )}
                </div>

                {/* Chat Scroll Container */}
                <div className="flex-1 overflow-y-auto thin-scrollbar bg-surface-low border border-border-light rounded-xl p-4 mb-4 flex flex-col gap-3">
                  {chatMessages.length === 0 ? (
                    <div className="m-auto text-center text-xs text-secondary font-medium">
                      No messages yet. Send a message to start negotiation.
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isTech = msg.isTechnician;
                      const isSys = msg.isSystem;
                      
                      if (isSys) {
                        return (
                          <div key={msg.id} className="flex justify-center">
                            <div className="bg-status-pending/5 border border-status-pending/30 text-status-pending-text px-3 py-1.5 rounded-lg text-[10px] text-center font-bold">
                              {msg.text}
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div 
                          key={msg.id}
                          className={`flex ${isTech ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs ${
                            isTech 
                              ? 'bg-black text-white rounded-br-none shadow-sm' 
                              : 'bg-white border border-border-medium text-deep-charcoal rounded-bl-none shadow-sm'
                          }`}>
                            <div>{msg.text}</div>
                            <div className={`text-[9px] text-right mt-1 font-semibold ${isTech ? 'text-white/60' : 'text-secondary'}`}>
                              {msg.time}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input Fields */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type a message to the student..."
                    className="flex-1 premium-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-5 bg-black hover:bg-neutral-900 text-white rounded-lg font-bold text-xs transition-all"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== IMAGE MODAL ===== */}
      {showImageModal && selectedImage && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white border border-border-medium rounded-xl p-6 max-w-2xl w-full shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-deep-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined">image</span>
                Evidence Media
              </h3>
              <button
                className="outline-btn py-1 px-3 text-xs"
                onClick={() => setShowImageModal(false)}
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