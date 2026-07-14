// src/pages/UpdateReport.jsx - TECHNICIAN RESOLUTION & NOTES SUBMISSION PAGE
import React, { useState, useEffect } from 'react';
import { 
  getReportsByTechnician, 
  getPersistedReports, 
  savePersistedReports 
} from '../data/mockData';

export default function UpdateReport({ user }) {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [techNotes, setTechNotes] = useState('');

  const loadActiveReports = () => {
    if (user?.id) {
      const allTechReports = getReportsByTechnician(user.id);
      // Filter out reports that are already resolved
      const activeReports = allTechReports.filter(r => r.status !== 'resolved');
      setReports(activeReports);

      // Keep selected report updated or reset it if it is resolved/removed
      if (selectedReport) {
        const updated = activeReports.find(a => a.id === selectedReport.id);
        if (updated) {
          setSelectedReport(updated);
        } else {
          setSelectedReport(null);
          setTechNotes('');
        }
      }
    }
  };

  useEffect(() => {
    loadActiveReports();
    if (typeof window !== 'undefined') {
      window.addEventListener('mock-data-updated', loadActiveReports);
      return () => window.removeEventListener('mock-data-updated', loadActiveReports);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSelectReport = (report) => {
    setSelectedReport(report);
    setTechNotes(report.technicianNotes || '');
  };

  const handleMarkAsResolved = () => {
    if (!selectedReport) return;

    if (!techNotes.trim()) {
      alert('Please leave a note before resolving the job.');
      return;
    }

    const allReports = getPersistedReports();
    const updatedAllReports = allReports.map(report => {
      if (report.id === selectedReport.id) {
        return {
          ...report,
          status: 'resolved',
          technicianNotes: techNotes,
          repairDate: new Date().toISOString()
        };
      }
      return report;
    });

    savePersistedReports(updatedAllReports);

    // Dispatch event to sync state across views/tabs
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mock-data-updated'));
    }

    alert('Report successfully marked as Resolved and submitted to the Student Directory!');
    loadActiveReports();
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().toUpperCase().split(/\s+/);
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return parts[0].slice(0, 2);
  };

  return (
    <div className="font-headline-md min-h-screen p-4 md:p-8 animate-fade-in-up space-y-10">
      {/* Page Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="font-headline-xl text-headline-xl font-bold text-deep-charcoal tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px]">build_circle</span>
            Update Maintenance Report
          </h2>
          <p className="text-secondary font-body-lg mt-1 border-l-2 border-deep-charcoal pl-4">
            Leave repair notes, submit resolution details, and sync updates to student files.
          </p>
        </div>
      </header>

      {/* Main split view */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Active Jobs List */}
        <div className="flex-1 w-full space-y-4">
          <div className="premium-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light bg-surface-low flex justify-between items-center">
              <h4 className="font-title-md text-sm font-bold uppercase tracking-widest text-deep-charcoal">
                Active Assignments Queue
              </h4>
            </div>

            <div className="divide-y divide-border-light max-h-[500px] overflow-y-auto thin-scrollbar">
              {reports.length === 0 ? (
                <div className="p-8 text-center text-secondary text-sm">
                  No active assignments awaiting resolution notes.
                </div>
              ) : (
                reports.map(report => {
                  const isSelected = selectedReport?.id === report.id;
                  const isConfirmed = report.appointmentStatus === 'confirmed';
                  
                  return (
                    <div 
                      key={report.id}
                      onClick={() => handleSelectReport(report)}
                      className={`p-5 flex justify-between items-center cursor-pointer transition-all hover:bg-surface-low border-l-4 ${
                        isConfirmed ? 'border-l-status-success' : 'border-l-status-pending'
                      } ${isSelected ? 'bg-surface-mid' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-deep-charcoal text-white flex items-center justify-center font-bold text-[10px] rounded-lg flex-shrink-0">
                          {getInitials(report.studentName)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-deep-charcoal">{report.studentName}</span>
                            <span className="font-mono text-[10px] text-secondary">#{report.id}</span>
                          </div>
                          <p className="text-xs text-secondary font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">location_on</span>
                            {report.location}
                          </p>
                          <p className="text-xs text-deep-charcoal font-semibold mt-1">
                            🔧 {report.issue}
                          </p>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className={`monochromatic-badge inline-block ${
                          report.status === 'in-progress' ? 'in-progress' : 'pending'
                        }`}>
                          {report.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Update Action Form */}
        <div className="w-full lg:w-[450px]">
          {selectedReport ? (
            <div className="premium-card p-6 space-y-6">
              <div>
                <h4 className="font-title-md text-sm font-bold uppercase tracking-wider text-deep-charcoal mb-4 flex items-center gap-1.5">
                  <span className="material-symbols-outlined">description</span>
                  Report Details
                </h4>

                <div className="space-y-3 text-xs text-secondary">
                  <p><strong className="text-deep-charcoal">Student Name:</strong> {selectedReport.studentName}</p>
                  <p><strong className="text-deep-charcoal">Location:</strong> {selectedReport.location}</p>
                  <p><strong className="text-deep-charcoal">Fault Category:</strong> {selectedReport.category}</p>
                  <p><strong className="text-deep-charcoal">Fault:</strong> {selectedReport.issue}</p>
                  <div className="bg-surface-low border border-border-medium rounded-lg p-3 italic text-deep-charcoal mt-2">
                    "{selectedReport.description}"
                  </div>
                </div>
              </div>

              {/* Note Submission Form */}
              <div className="space-y-4 pt-4 border-t border-border-light">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-black/60 block">Leave a Note (Technician Remarks)</label>
                  <textarea
                    value={techNotes}
                    onChange={(e) => setTechNotes(e.target.value)}
                    placeholder="Describe what repair actions were taken, materials used, or specific details for the student and admin directory..."
                    rows="5"
                    className="w-full premium-input resize-none"
                  />
                </div>

                <button
                  onClick={handleMarkAsResolved}
                  className="w-full py-3.5 bg-status-success/15 hover:bg-status-success/25 text-status-success-text border border-status-success/30 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  Mark as Resolved & Submit
                </button>
              </div>
            </div>
          ) : (
            <div className="premium-card p-8 text-center text-secondary text-xs">
              <span className="material-symbols-outlined text-[32px] mb-2 block">info</span>
              Select an active assignment from the queue to leave notes and resolve the ticket.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
