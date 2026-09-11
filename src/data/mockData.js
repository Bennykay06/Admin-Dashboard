// src/data/mockData.js
// The dashboard's data API — same function names as before, now reading
// from Supabase via store.js instead of localStorage.
//
// The file name is kept (and the exports with it) so the ~4,000 lines of
// page code that import from here did not have to be rewritten. Nothing in
// it is mock data any more: every getter reads the in-memory mirror of the
// database that store.js keeps up to date over realtime.
//
// Two behavioural notes for anyone editing pages:
//
//   * Getters are still synchronous and still safe to call during render.
//   * Setters are now async and return a promise resolving to
//     `{ error }`. The old ones returned undefined, so existing
//     fire-and-forget call sites keep working, but new code should await
//     them and surface the error.
import {
  getCache,
  hydrate,
  updateReport as storeUpdateReport,
  deleteReport as storeDeleteReport,
  saveReports as storeSaveReports,
  createNews,
  updateNews,
  deleteNews,
  saveHall,
  deleteHall,
  createStaffAccount,
  updateStaffProfile,
  setStaffPassword,
  deleteStaffAccount,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  uploadFile,
  subscribe,
  isHydrated,
} from './store';

import { useEffect, useState } from 'react';

// Re-exported so pages can reach the write API and the realtime hook
// without importing two modules.
export {
  hydrate,
  subscribe,
  isHydrated,
  createNews,
  updateNews,
  deleteNews,
  saveHall,
  deleteHall,
  createStaffAccount,
  updateStaffProfile,
  setStaffPassword,
  deleteStaffAccount,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  uploadFile,
};

/**
 * Re-render a component whenever the cached data changes.
 *
 * Pages copy store data into local state inside a useEffect. Put the value
 * this returns in that effect's dependency array and the page will refresh
 * when a report arrives from a student's phone:
 *
 *   const version = useStoreVersion();
 *   useEffect(() => { setReports(getPersistedReports()); }, [version]);
 */
export const useStoreVersion = () => {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);
  return version;
};

// ---------------------------------------------------------------------
// Connectivity
// ---------------------------------------------------------------------

/**
 * Was the mock-server check; now reports whether the Supabase data has
 * loaded. Kept so existing call sites still resolve to a boolean.
 */
export const checkMockServer = async () => isHydrated();

// ---------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------
export const getPersistedReports = () => getCache().reports;

/** @deprecated Prefer saveReport(report) or updateReport(id, changes). */
export const savePersistedReports = (reports) => storeSaveReports(reports);

export const saveReport = (updatedReport) => storeUpdateReport(updatedReport.id, updatedReport);

export const updateReport = storeUpdateReport;
export const removeReport = storeDeleteReport;

export const getReportsByHall = (hallId) => {
  const all = getPersistedReports();
  if (!hallId) return all;
  return all.filter((r) => String(r.hallId) === String(hallId));
};

export const getReportsPendingAssignment = (hallId) => {
  const reports = getReportsByHall(hallId);
  return reports.filter((r) => r.status === 'pending');
};

// ---------------------------------------------------------------------
// People
//
// The old model split "admins" (login records, with plaintext passwords)
// from "staff" (directory entries). There is now one profiles table, so
// both getters return the same list and passwords live only in Supabase
// Auth as bcrypt hashes — they are not readable from here by design. Staff
// only ever means hall_admin or super_admin now; the technician role was
// removed (see remove_technician_role.sql).
// ---------------------------------------------------------------------
export const getPersistedAdmins = () => getCache().staff;
export const getPersistedStaff = () => getCache().staff;

/** @deprecated Accounts are created with createStaffAccount(). */
export const savePersistedAdmins = async () => {
  console.warn(
    '[mockData] savePersistedAdmins is a no-op. Use createStaffAccount / ' +
      'updateStaffProfile / deleteStaffAccount instead.'
  );
};
export const savePersistedStaff = savePersistedAdmins;

export const getAdminByEmail = (email) => {
  if (!email) return undefined;
  return getCache().staff.find((a) => (a.email || '').toLowerCase() === email.toLowerCase());
};

export const getStudentsByHall = (hallId) => {
  const students = getCache().students;
  if (!hallId) return students;
  return students.filter((s) => String(s.hallId) === String(hallId));
};

/**
 * Students with a report count attached. The old code pulled every report
 * into the browser and reduced over it; the count is computed here from the
 * same cache, so it stays a synchronous read.
 */
export const getStudentDirectory = (hallId) => {
  const reports = getPersistedReports();
  return getStudentsByHall(hallId).map((s) => ({
    ...s,
    reports: reports.filter((r) => r.studentId === s.id).length,
  }));
};

// ---------------------------------------------------------------------
// News
// ---------------------------------------------------------------------
export const getPersistedNews = () => getCache().news;

/** @deprecated Use createNews / updateNews / deleteNews. */
export const savePersistedNews = async () => {
  console.warn('[mockData] savePersistedNews is a no-op. Use createNews / updateNews / deleteNews.');
};

export const getNewsByHall = (hallId) => {
  const all = getPersistedNews();
  if (!hallId) return all;
  // A null hall_id is a system-wide announcement and shows for every hall.
  return all.filter((n) => n.hallId === null || String(n.hallId) === String(hallId));
};

// ---------------------------------------------------------------------
// Halls
// ---------------------------------------------------------------------
export const getPersistedHalls = () => getCache().halls;

/** @deprecated Use saveHall / deleteHall. */
export const savePersistedHalls = async () => {
  console.warn('[mockData] savePersistedHalls is a no-op. Use saveHall / deleteHall.');
};

// ---------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------
export const getPersistedAppointments = () => getCache().appointments;

export const getAppointmentsByHall = (hallId) => {
  const all = getPersistedAppointments();
  if (!hallId) return all;
  return all.filter((a) => String(a.hallId) === String(hallId));
};

// ---------------------------------------------------------------------
// Legacy aliases.
//
// These used to be static seed arrays exported at module load. They are now
// getter-backed so they never go stale — note they are *functions* where a
// list is genuinely dynamic. `halls` is kept as an array-like getter because
// components iterate it directly.
// ---------------------------------------------------------------------
export const mockLocations = () => getCache().halls;
export const mockStudents = () => getCache().students;
export const mockStaff = () => getCache().staff;
export const mockReports = () => getCache().reports;
export const admins = () => getCache().staff;

// ---------------------------------------------------------------------
// Display helpers (unchanged)
// ---------------------------------------------------------------------
export const getStatusLabel = (status) => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'scheduled': return 'Scheduled';
    case 'in-progress': return 'In Progress';
    case 'resolved': return 'Resolved';
    default: return 'Unknown';
  }
};

export const getPriorityLabel = (priority) => {
  switch (priority) {
    case 'high': return '🔥 High';
    case 'medium': return '⚡ Medium';
    case 'low': return '💤 Low';
    default: return 'Unknown';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#F59E0B';
    case 'scheduled': return '#EA580C';
    case 'in-progress': return '#3B82F6';
    case 'resolved': return '#10B981';
    default: return '#6B7280';
  }
};

export const getCategoryIcon = (category) => {
  switch (category) {
    case 'Electrical': return '⚡';
    case 'Plumbing': return '🔧';
    case 'Carpentry': return '🪚';
    case 'Masonry': return '🧱';
    default: return '📋';
  }
};
