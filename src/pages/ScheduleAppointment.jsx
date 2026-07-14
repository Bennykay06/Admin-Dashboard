// src/pages/ScheduleAppointment.jsx - ACTIVE TECHNICIAN APPOINTMENT QUEUE VIEWER
import React, { useState, useEffect } from 'react';
import { 
  getReportsByTechnician
} from '../data/mockData';

export default function ScheduleAppointment({ user }) {
  const [appointments, setAppointments] = useState([]);

  const loadAppointments = () => {
    if (user?.id) {
      const reports = getReportsByTechnician(user.id);
      // Filter reports that are scheduled or have appointment dates set
      const activeAppts = reports.filter(r => r.appointmentDate || r.status === 'scheduled');
      setAppointments(activeAppts);
    }
  };

  useEffect(() => {
    loadAppointments();
    if (typeof window !== 'undefined') {
      window.addEventListener('mock-data-updated', loadAppointments);
      return () => window.removeEventListener('mock-data-updated', loadAppointments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().toUpperCase().split(/\s+/);
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return parts[0].slice(0, 2);
  };

  // Stats
  const confirmedCount = appointments.filter(a => a.appointmentStatus === 'confirmed').length;
  const pendingCount = appointments.filter(a => a.appointmentStatus === 'pending_confirmation').length;
  const negotiatingCount = appointments.filter(a => a.appointmentStatus === 'declined' || (!a.appointmentStatus && a.status === 'scheduled')).length;

  return (
    <div className="font-headline-md min-h-screen p-4 md:p-8 animate-fade-in-up space-y-10">
      {/* Page Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="font-headline-xl text-headline-xl font-bold text-deep-charcoal tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px]">calendar_month</span>
            Technician Schedule
          </h2>
          <p className="text-secondary font-body-lg mt-1 border-l-2 border-deep-charcoal pl-4">
            View your active calendar, confirmed repair slots, and pending proposals.
          </p>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-status-success-text">check_circle</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Active</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">Confirmed Bookings</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{confirmedCount}</span>
          </div>
        </div>

        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-status-pending-text">hourglass_empty</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Awaiting</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">Pending Confirmation</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{pendingCount}</span>
          </div>
        </div>

        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-status-critical-text">chat</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Negotiating</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">Declined / In Discussion</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{negotiatingCount}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Full-Width Appointments Table/List */}
      <div className="premium-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light bg-surface-low flex justify-between items-center">
          <h4 className="font-title-md text-sm font-bold uppercase tracking-widest text-deep-charcoal">
            Active Appointments Queue
          </h4>
        </div>

        <div className="overflow-x-auto thin-scrollbar">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Location</th>
                <th>Maintenance Job</th>
                <th>Scheduled Date & Time</th>
                <th className="text-center">Negotiation Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-secondary text-sm font-medium">
                    No active scheduled appointments in your calendar queue.
                  </td>
                </tr>
              ) : (
                appointments.map(appt => {
                  const isConfirmed = appt.appointmentStatus === 'confirmed';
                  const isDeclined = appt.appointmentStatus === 'declined';
                  
                  return (
                    <tr key={appt.id}>
                      {/* Student Name */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-deep-charcoal text-white flex items-center justify-center font-bold text-[10px] rounded-lg">
                            {getInitials(appt.studentName)}
                          </div>
                          <span className="font-bold text-[13px] text-deep-charcoal">
                            {appt.studentName}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="text-secondary text-sm font-semibold">
                        {appt.location}
                      </td>

                      {/* Issue details */}
                      <td>
                        <div className="font-bold text-deep-charcoal text-[13px]">{appt.issue}</div>
                        <div className="text-[11px] text-secondary italic mt-0.5 max-w-[250px] truncate" title={appt.description}>
                          {appt.description || 'No additional details.'}
                        </div>
                      </td>

                      {/* Scheduled Date & Time */}
                      <td className="font-semibold text-xs text-deep-charcoal">
                        {appt.appointmentDate || 'No Date'} • {appt.appointmentTime || 'No Time'}
                      </td>

                      {/* Status */}
                      <td className="text-center">
                        <span className={`monochromatic-badge ${
                          isConfirmed ? 'success' : 
                          isDeclined ? 'critical' : 'pending'
                        }`}>
                          {isConfirmed ? 'Confirmed' : 
                           isDeclined ? 'Declined' : 'Awaiting Confirmation'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
