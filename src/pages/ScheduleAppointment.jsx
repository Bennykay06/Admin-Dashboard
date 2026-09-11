// src/pages/ScheduleAppointment.jsx - ADMIN APPOINTMENT SCHEDULE
//
// Replaces the old technician-only appointment queue. Hall admins and the
// super admin use this to see every scheduled maintenance visit and to book
// a new one directly against an open report — there is no technician role
// left to do that from a "Technician Schedule" view.
import React, { useState, useEffect } from 'react';
import {
  getAppointmentsByHall,
  getPersistedHalls,
  getReportsByHall,
  createAppointment,
  updateAppointment,
  updateReport,
  useStoreVersion,
} from '../data/mockData';

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const formatDateTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

// A date input happily accepts a two-digit year typed into the year spinner,
// which lands in the database as year 0026 rather than 2026. The appointment
// then sorts two millennia into the past and disappears from every "upcoming"
// view, so catch it before it is saved.
const MIN_DATE = '2000-01-01';
const MAX_DATE = '2100-12-31';

const parseSlot = (date, time) => {
  const d = new Date(`${date}T${time}`);
  if (Number.isNaN(d.getTime())) {
    return { error: 'That date/time is not valid.' };
  }
  const year = d.getFullYear();
  if (year < 2000 || year > 2100) {
    return { error: `That works out to the year ${year}. Check the year and try again.` };
  }
  return {
    when: d,
    slotLabel: `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
  };
};

export default function ScheduleAppointment({ user }) {
  const isSuperAdmin = user?.role === 'super_admin';
  const version = useStoreVersion();

  const [halls, setHalls] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);
  // Default to showing everything on the books. Narrowing to "upcoming
  // scheduled" by default meant a single mistyped date could leave an admin
  // staring at an empty table, unsure whether the booking had saved at all.
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all'); // upcoming | past | all

  const [appointments, setAppointments] = useState([]);
  const [openReports, setOpenReports] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [formReportId, setFormReportId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingAppt, setEditingAppt] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const hallId = isSuperAdmin ? selectedHall : user?.hallId;

  const loadData = () => {
    setHalls(getPersistedHalls());
    setAppointments(getAppointmentsByHall(hallId));
    setOpenReports(getReportsByHall(hallId).filter((r) => r.status !== 'resolved'));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hallId, version]);

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().toUpperCase().split(/\s+/);
    if (parts.length >= 2) return parts[0][0] + parts[1][0];
    return parts[0].slice(0, 2);
  };

  const now = Date.now();
  const filteredAppointments = appointments
    .filter((a) => statusFilter === 'all' || a.status === statusFilter)
    .filter((a) => {
      if (timeFilter === 'all' || !a.scheduledFor) return true;
      const t = new Date(a.scheduledFor).getTime();
      if (Number.isNaN(t)) return true;
      return timeFilter === 'upcoming' ? t >= now : t < now;
    })
    .sort((a, b) => new Date(a.scheduledFor || 0) - new Date(b.scheduledFor || 0));

  const scheduledCount = appointments.filter((a) => a.status === 'scheduled').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

  const openScheduleModal = () => {
    setFormReportId(openReports[0]?.id || '');
    setFormDate('');
    setFormTime('');
    setFormTitle('');
    setShowModal(true);
  };

  const handleSchedule = async () => {
    const report = openReports.find((r) => String(r.id) === String(formReportId));
    if (!report) {
      alert('Select a report to schedule this visit against.');
      return;
    }
    if (!formDate || !formTime) {
      alert('Pick a date and time.');
      return;
    }

    const slot = parseSlot(formDate, formTime);
    if (slot.error) {
      alert(slot.error);
      return;
    }

    setSaving(true);
    // The issue text comes straight from the student's report and often
    // carries stray line breaks from the "Other: ..." box.
    const issue = (report.issue || '').replace(/\s+/g, ' ').trim();
    const title = formTitle.trim() || `${report.category} visit — ${issue}`;

    const { error } = await createAppointment({
      report,
      title,
      scheduledFor: slot.when.toISOString(),
      slotLabel: slot.slotLabel,
    });

    if (error) {
      alert(`Could not schedule this appointment: ${error}`);
      setSaving(false);
      return;
    }

    // Keep the report's own status in step with the fact that a visit is
    // now booked.
    if (report.status === 'pending') {
      await updateReport(report.id, { status: 'scheduled' });
    }

    setSaving(false);
    setShowModal(false);
  };

  const handleMarkCompleted = async (appt) => {
    const { error } = await updateAppointment(appt.id, { status: 'completed' });
    if (error) alert(`Could not update this appointment: ${error}`);
  };

  const handleCancel = async (appt) => {
    if (!window.confirm('Cancel this appointment?')) return;
    const { error } = await updateAppointment(appt.id, { status: 'cancelled' });
    if (error) alert(`Could not cancel this appointment: ${error}`);
  };

  const openEditModal = (appt) => {
    const d = appt.scheduledFor ? new Date(appt.scheduledFor) : null;
    const valid = d && !Number.isNaN(d.getTime());
    // <input type="date"/"time"> need local YYYY-MM-DD / HH:MM strings — a
    // plain toISOString() would shift the displayed time to UTC.
    const pad = (n) => String(n).padStart(2, '0');
    setEditingAppt(appt);
    setEditDate(valid ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '');
    setEditTime(valid ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '');
    setEditTitle(appt.title || '');
  };

  const closeEditModal = () => {
    setEditingAppt(null);
    setSavingEdit(false);
  };

  const handleSaveEdit = async () => {
    if (!editingAppt) return;
    if (!editDate || !editTime) {
      alert('Pick a date and time.');
      return;
    }
    if (!editTitle.trim()) {
      alert('Give this appointment a title.');
      return;
    }

    const slot = parseSlot(editDate, editTime);
    if (slot.error) {
      alert(slot.error);
      return;
    }

    setSavingEdit(true);

    const { error } = await updateAppointment(editingAppt.id, {
      title: editTitle.trim().replace(/\s+/g, ' '),
      scheduledFor: slot.when.toISOString(),
      slotLabel: slot.slotLabel,
    });

    setSavingEdit(false);
    if (error) {
      alert(`Could not reschedule this appointment: ${error}`);
      return;
    }

    closeEditModal();
  };

  return (
    <div className="font-headline-md min-h-screen p-4 md:p-8 animate-fade-in-up space-y-10">
      {/* Page Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="font-headline-xl text-headline-xl font-bold text-deep-charcoal tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px]">calendar_month</span>
            Appointment Schedule
          </h2>
          <p className="text-secondary font-body-lg mt-1 border-l-2 border-deep-charcoal pl-4">
            Book and track maintenance visits{isSuperAdmin ? ' across every hall' : ` for ${user?.hallName || 'your hall'}`}.
          </p>
        </div>

        <button
          className="flex items-center gap-2 px-6 py-3 bg-deep-charcoal text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-sm disabled:opacity-40"
          onClick={openScheduleModal}
          disabled={openReports.length === 0}
          title={openReports.length === 0 ? 'No open reports to schedule against' : undefined}
        >
          <span className="material-symbols-outlined text-[20px]">event_available</span>
          Schedule Appointment
        </button>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-status-pending-text">event</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Booked</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">Scheduled</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{scheduledCount}</span>
          </div>
        </div>

        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-status-success-text">check_circle</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Done</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">Completed</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{completedCount}</span>
          </div>
        </div>

        <div className="premium-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-status-critical-text">event_busy</span>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Dropped</span>
          </div>
          <div>
            <p className="text-secondary font-label-md uppercase tracking-widest text-[10px] mb-1">Cancelled</p>
            <span className="text-4xl font-bold text-deep-charcoal tracking-tight">{cancelledCount}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="premium-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light bg-surface-low flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h4 className="font-title-md text-sm font-bold uppercase tracking-widest text-deep-charcoal">
            Appointments
            {appointments.length > 0 && (
              <span className="ml-2 text-secondary font-semibold normal-case tracking-normal">
                showing {filteredAppointments.length} of {appointments.length}
              </span>
            )}
          </h4>

          <div className="flex flex-wrap items-center gap-3">
            {isSuperAdmin && (
              <div className="relative">
                <select
                  value={selectedHall || ''}
                  onChange={(e) => setSelectedHall(e.target.value || null)}
                  className="premium-select text-xs py-1.5 pl-3 pr-8 appearance-none min-w-[160px]"
                >
                  <option value="">All Residence Halls</option>
                  {halls.map((hall) => (
                    <option key={hall.id} value={hall.id}>{hall.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="premium-select text-xs py-1.5 pl-3 pr-8 appearance-none min-w-[120px]"
              >
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="all">All Dates</option>
              </select>
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="premium-select text-xs py-1.5 pl-3 pr-8 appearance-none min-w-[130px]"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto thin-scrollbar">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Student Name</th>
                {isSuperAdmin && <th>Residence Hall</th>}
                <th>Maintenance Job</th>
                <th>Scheduled For</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 6 : 5} className="text-center py-12 text-secondary text-sm font-medium">
                    {appointments.length === 0 ? (
                      <>No appointments booked{isSuperAdmin ? '' : ` for ${user?.hallName || 'your hall'}`} yet.</>
                    ) : (
                      <>
                        <p>
                          None of the {appointments.length} booked appointment{appointments.length === 1 ? '' : 's'} match these filters.
                        </p>
                        <button
                          className="outline-btn text-[11px] py-1.5 px-3 mt-3"
                          onClick={() => {
                            setStatusFilter('all');
                            setTimeFilter('all');
                          }}
                        >
                          Show all appointments
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => (
                  <tr key={appt.id}>
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

                    {isSuperAdmin && (
                      <td className="font-semibold text-xs text-secondary">{appt.hallName || '—'}</td>
                    )}

                    <td>
                      <div className="font-bold text-deep-charcoal text-[13px]">{appt.title}</div>
                      {appt.reportCategory && (
                        <div className="text-[11px] text-secondary italic mt-0.5 max-w-[250px] truncate">
                          {appt.reportCategory}{appt.reportIssue ? ` — ${appt.reportIssue}` : ''}
                        </div>
                      )}
                    </td>

                    <td className="font-semibold text-xs text-deep-charcoal">
                      {formatDateTime(appt.scheduledFor) || appt.slotLabel || 'No date set'}
                    </td>

                    <td className="text-center">
                      <span className={`monochromatic-badge ${
                        appt.status === 'completed' ? 'success' :
                        appt.status === 'cancelled' ? 'critical' : 'scheduled'
                      }`}>
                        {STATUS_LABELS[appt.status] || appt.status}
                      </span>
                    </td>

                    <td className="text-right space-x-2">
                      <button
                        className="outline-btn text-[11px] py-1.5 px-3"
                        onClick={() => openEditModal(appt)}
                      >
                        Edit
                      </button>
                      {appt.status === 'scheduled' && (
                        <>
                          <button
                            className="outline-btn text-[11px] py-1.5 px-3"
                            onClick={() => handleMarkCompleted(appt)}
                          >
                            Mark Completed
                          </button>
                          <button
                            className="outline-btn text-[11px] py-1.5 px-3 hover:text-error"
                            onClick={() => handleCancel(appt)}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== SCHEDULE APPOINTMENT MODAL ===== */}
      {showModal && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white border border-border-medium rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-deep-charcoal mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px]">event_available</span>
              Schedule Appointment
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black/60 block ml-0.5">Report *</label>
                <div className="relative">
                  <select
                    value={formReportId}
                    onChange={(e) => setFormReportId(e.target.value)}
                    className="w-full premium-select appearance-none cursor-pointer"
                  >
                    {openReports.length === 0 && <option value="">No open reports</option>}
                    {openReports.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.studentName} — {r.category}: {r.issue}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-black/60 block ml-0.5">Date *</label>
                  <input
                    type="date"
                    value={formDate}
                    min={MIN_DATE}
                    max={MAX_DATE}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full premium-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-black/60 block ml-0.5">Time *</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full premium-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black/60 block ml-0.5">Title (optional)</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Electrical visit — socket repair"
                  className="w-full premium-input"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                className="flex-1 py-3 bg-black hover:bg-neutral-900 text-white rounded-lg font-bold text-sm transition-all shadow-sm disabled:opacity-50"
                onClick={handleSchedule}
                disabled={saving}
              >
                {saving ? 'Scheduling…' : 'Schedule'}
              </button>
              <button
                className="flex-1 py-3 border border-border-medium text-secondary rounded-lg font-bold text-sm hover:bg-surface-low transition-colors"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT / RESCHEDULE APPOINTMENT MODAL ===== */}
      {editingAppt && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white border border-border-medium rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-deep-charcoal mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px]">edit_calendar</span>
              Reschedule Appointment
            </h2>
            <p className="text-secondary text-xs mb-6">
              {editingAppt.studentName}{editingAppt.reportCategory ? ` — ${editingAppt.reportCategory}` : ''}
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-black/60 block ml-0.5">Date *</label>
                  <input
                    type="date"
                    value={editDate}
                    min={MIN_DATE}
                    max={MAX_DATE}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full premium-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-black/60 block ml-0.5">Time *</label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full premium-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black/60 block ml-0.5">Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g., Electrical visit — socket repair"
                  className="w-full premium-input"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                className="flex-1 py-3 bg-black hover:bg-neutral-900 text-white rounded-lg font-bold text-sm transition-all shadow-sm disabled:opacity-50"
                onClick={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                className="flex-1 py-3 border border-border-medium text-secondary rounded-lg font-bold text-sm hover:bg-surface-low transition-colors"
                onClick={closeEditModal}
                disabled={savingEdit}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
