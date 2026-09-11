// src/data/store.js
// In-memory mirror of the Supabase tables this dashboard uses.
//
// Why a cache instead of calling Supabase from each page:
//
// mockData.js exposed a *synchronous* API (getPersistedReports(),
// getStudentsByHall(), ...) and roughly 4,000 lines of page code is written
// against it — used directly inside render, in useMemo, in filter chains.
// Making those calls async would mean rewriting every page.
//
// So the data is loaded once into this module, kept fresh by Postgres
// realtime subscriptions, and read synchronously from memory. Writes go
// straight to Supabase and the cache is corrected from the server's reply,
// so a rejected write (RLS, validation) does not leave a phantom row on
// screen.
import supabase from '../lib/supabase';

// ---------------------------------------------------------------------
// Cache + change notification
// ---------------------------------------------------------------------
const cache = {
  halls: [],
  reports: [],
  staff: [],      // hall admins + super admins
  students: [],
  news: [],
  appointments: [],
};

let hydrated = false;
let hydrating = null;
const listeners = new Set();

/** Subscribe to any cache change. Returns an unsubscribe function. */
export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = () => {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('[store] listener threw:', e);
    }
  });
};

export const isHydrated = () => hydrated;
export const getCache = () => cache;

// ---------------------------------------------------------------------
// Row <-> legacy shape mappers
//
// The pages were written against the mock's camelCase objects and read a
// mix of field names for the same value (studentName *and* submittedBy,
// category *and* serviceType). Both spellings are provided so no page has
// to change.
// ---------------------------------------------------------------------
export const rowToReport = (r) => ({
  id: r.id,
  referenceId: r.reference_id,
  studentId: r.student_id,
  studentName: r.student_name || 'Resident',
  submittedBy: r.student_name || 'Resident',
  studentEmail: r.student_email || '',
  hallId: r.hall_id,
  hallName: r.hall_name || '',
  hall: r.hall_name || '',
  location: r.location || '',
  category: r.category || 'Electrical',
  serviceType: r.category || 'Electrical',
  issue: r.issue || 'General Issue',
  selectedIssue: r.issue || 'General Issue',
  description: r.description || 'No description provided',
  writtenDetails: r.description || '',
  status: r.status || 'pending',
  priority: r.priority || 'medium',
  photos: Array.isArray(r.photos) ? r.photos : [],
  video: r.video || null,
  // Several list views render a single thumbnail from imageUri.
  imageUri: (Array.isArray(r.photos) && r.photos[0]) || r.video || null,
  assignedTo: r.assigned_to,
  assignedName: r.assigned_name,
  assignedSpecialty: r.assigned_specialty,
  technicianNotes: r.technician_notes || '',
  repairDate: r.repair_date,
  resolvedAt: r.resolved_at,
  timestamp: r.created_at,
});

// Only the columns a client is allowed to change. Anything not listed here
// (reference_id, student_id, created_at) is owned by the database.
const reportToRow = (r) => {
  const row = {};
  const set = (col, val) => {
    if (val !== undefined) row[col] = val;
  };

  set('hall_id', r.hallId);
  set('hall_name', r.hallName ?? r.hall);
  set('location', r.location);
  set('category', r.category ?? r.serviceType);
  set('issue', r.issue ?? r.selectedIssue);
  set('description', r.description ?? r.writtenDetails);
  set('priority', r.priority);
  set('photos', r.photos);
  set('video', r.video);
  set('assigned_to', r.assignedTo);
  set('assigned_name', r.assignedName);
  set('assigned_specialty', r.assignedSpecialty);
  set('technician_notes', r.technicianNotes);
  set('repair_date', r.repairDate || null);

  // The mock accepted 'in progress'; the enum only knows 'in-progress'.
  if (r.status !== undefined) {
    row.status = String(r.status).toLowerCase().replace(/\s+/g, '-');
  }

  return row;
};

export const rowToPerson = (p) => ({
  id: p.id,
  name: p.full_name || p.email || 'Unnamed',
  fullName: p.full_name || '',
  email: p.email || '',
  role: p.role,
  hallId: p.hall_id,
  hallName: p.halls?.name || '',
  specialty: p.specialty || '',
  phone: p.phone || '',
  room: p.room || '',
  isActive: p.is_active !== false,
  emailNotifications: p.email_notifications !== false,
  createdAt: p.created_at,
});

export const rowToNews = (n) => ({
  id: n.id,
  hallId: n.hall_id,
  title: n.title,
  content: n.content,
  author: n.author,
  image: n.image_url,
  // The News page renders attachments from these two. Only one URL is
  // stored, so the kind is inferred from its extension.
  mediaUri: n.image_url,
  mediaType: n.image_url
    ? /\.(mp4|mov|webm)(\?|$)/i.test(n.image_url)
      ? 'video'
      : 'image'
    : null,
  date: n.created_at,
});

export const rowToAppointment = (a) => ({
  id: a.id,
  reportId: a.report_id,
  studentId: a.student_id,
  createdBy: a.created_by,
  hallId: a.hall_id,
  hallName: a.hall_name || '',
  studentName: a.student_name || 'Resident',
  reportCategory: a.report_category || '',
  reportIssue: a.report_issue || '',
  title: a.title || 'Maintenance Visit',
  slotLabel: a.slot_label || '',
  scheduledFor: a.scheduled_for,
  status: a.status || 'scheduled',
  createdAt: a.created_at,
});

/**
 * Uploads a file picked in the dashboard and returns its public URL.
 * Storage RLS requires the first path segment to be the uploader's user id.
 */
export const uploadFile = async (file, folder = 'news') => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: 'Not signed in' };

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${auth.user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from('report-media')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error('[store] uploadFile failed:', error.message);
    return { error: error.message };
  }

  const { data } = supabase.storage.from('report-media').getPublicUrl(path);
  return { error: null, url: data.publicUrl };
};

export const rowToHall = (h) => ({
  id: h.id,
  name: h.name,
  code: h.code,
  floors: h.floors,
  rooms: h.rooms,
});

const REPORT_COLUMNS =
  'id, reference_id, student_id, student_name, student_email, hall_id, hall_name, ' +
  'location, category, issue, description, status, priority, photos, video, ' +
  'assigned_to, assigned_name, assigned_specialty, technician_notes, repair_date, ' +
  'resolved_at, created_at';

const APPOINTMENT_COLUMNS =
  'id, report_id, student_id, created_by, hall_id, hall_name, student_name, ' +
  'report_category, report_issue, title, slot_label, scheduled_for, status, created_at';

// ---------------------------------------------------------------------
// Hydration
// ---------------------------------------------------------------------

/**
 * Loads everything the signed-in user is allowed to see. RLS does the
 * filtering, so a hall admin naturally gets only their hall — the queries
 * are the same for every role.
 */
export const hydrate = async () => {
  if (hydrating) return hydrating;

  hydrating = (async () => {
    const [halls, reports, people, news, appointments] = await Promise.all([
      supabase.from('halls').select('*').order('name'),
      supabase.from('reports').select(REPORT_COLUMNS).order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, full_name, email, role, hall_id, specialty, phone, room, is_active, created_at, halls(name)')
        .order('full_name'),
      supabase.from('news').select('*').order('created_at', { ascending: false }),
      supabase.from('appointments').select(APPOINTMENT_COLUMNS).order('scheduled_for', { ascending: true }),
    ]);

    const firstError = [halls, reports, people, news, appointments].find((r) => r.error)?.error;
    if (firstError) {
      console.error('[store] hydrate failed:', firstError.message);
      throw firstError;
    }

    cache.halls = (halls.data || []).map(rowToHall);
    cache.reports = (reports.data || []).map(rowToReport);
    cache.news = (news.data || []).map(rowToNews);
    cache.appointments = (appointments.data || []).map(rowToAppointment);

    const everyone = (people.data || []).map(rowToPerson);
    cache.students = everyone.filter((p) => p.role === 'student');
    // 'staff' now only ever means hall_admin or super_admin — the
    // technician role was removed (remove_technician_role.sql).
    cache.staff = everyone.filter((p) => p.role !== 'student');

    hydrated = true;
    emit();
  })();

  try {
    await hydrating;
  } finally {
    hydrating = null;
  }
};

export const clearCache = () => {
  cache.halls = [];
  cache.reports = [];
  cache.staff = [];
  cache.students = [];
  cache.news = [];
  cache.appointments = [];
  hydrated = false;
  emit();
};

// ---------------------------------------------------------------------
// Realtime
//
// This is what makes a report filed on a phone appear here without a
// refresh. Postgres pushes the change, the cache is patched, listeners
// re-render.
// ---------------------------------------------------------------------
let channel = null;

const upsertInto = (list, item) => {
  const index = list.findIndex((x) => x.id === item.id);
  if (index === -1) return [item, ...list];
  const next = list.slice();
  next[index] = item;
  return next;
};

export const startRealtime = () => {
  if (channel) return;

  channel = supabase
    .channel('resifix-dashboard')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
      if (payload.eventType === 'DELETE') {
        cache.reports = cache.reports.filter((r) => r.id !== payload.old.id);
      } else {
        cache.reports = upsertInto(cache.reports, rowToReport(payload.new));
      }
      emit();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, (payload) => {
      if (payload.eventType === 'DELETE') {
        cache.news = cache.news.filter((n) => n.id !== payload.old.id);
      } else {
        cache.news = upsertInto(cache.news, rowToNews(payload.new));
      }
      emit();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
      const id = payload.eventType === 'DELETE' ? payload.old.id : payload.new.id;
      cache.students = cache.students.filter((p) => p.id !== id);
      cache.staff = cache.staff.filter((p) => p.id !== id);

      if (payload.eventType !== 'DELETE') {
        // The realtime payload has no joined hall name; keep the one we
        // already resolved, or look it up from the cached hall list.
        const person = rowToPerson(payload.new);
        person.hallName =
          cache.halls.find((h) => h.id === person.hallId)?.name || person.hallName;

        if (person.role === 'student') cache.students = upsertInto(cache.students, person);
        else cache.staff = upsertInto(cache.staff, person);
      }
      emit();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'halls' }, (payload) => {
      if (payload.eventType === 'DELETE') {
        cache.halls = cache.halls.filter((h) => h.id !== payload.old.id);
      } else {
        cache.halls = upsertInto(cache.halls, rowToHall(payload.new));
      }
      emit();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
      if (payload.eventType === 'DELETE') {
        cache.appointments = cache.appointments.filter((a) => a.id !== payload.old.id);
      } else {
        cache.appointments = upsertInto(cache.appointments, rowToAppointment(payload.new));
      }
      emit();
    })
    .subscribe();
};

export const stopRealtime = () => {
  if (!channel) return;
  supabase.removeChannel(channel);
  channel = null;
};

// ---------------------------------------------------------------------
// Writes
//
// Each one updates the cache optimistically for a responsive UI, then
// reconciles with whatever the server actually stored.
// ---------------------------------------------------------------------

/**
 * Emails the student that the status of their report moved.
 *
 * The send-status-email edge function does the work: it re-reads the report
 * server-side and holds the mail provider's key, so nothing sensitive is in
 * the browser. Deliberately not awaited by the caller — a mail provider
 * having a bad afternoon should never block or roll back a status change
 * that the database has already accepted.
 */
const emailStudentAboutStatus = async (reportId) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-status-email', {
      body: { reportId },
    });
    if (error) {
      console.warn('[store] status email not sent:', error.message);
    } else if (data?.skipped) {
      console.info('[store] status email skipped:', data.skipped);
    } else if (data?.ok) {
      console.info('[store] status email sent to', data.to);
    }
  } catch (err) {
    console.warn('[store] status email threw:', err?.message ?? err);
  }
};

/** Applies a partial change to one report. */
export const updateReport = async (id, changes) => {
  const previous = cache.reports.find((r) => r.id === id);
  if (previous) {
    cache.reports = upsertInto(cache.reports, { ...previous, ...changes });
    emit();
  }

  const { data, error } = await supabase
    .from('reports')
    .update(reportToRow(changes))
    .eq('id', id)
    .select(REPORT_COLUMNS)
    .single();

  if (error) {
    console.error('[store] updateReport failed:', error.message);
    if (previous) {
      cache.reports = upsertInto(cache.reports, previous); // roll back
      emit();
    }
    return { error: error.message };
  }

  const saved = rowToReport(data);
  cache.reports = upsertInto(cache.reports, saved);
  emit();

  // Only a genuine move between states is worth an email — re-saving the
  // same status, or editing notes, is not.
  if (previous && previous.status !== saved.status) {
    emailStudentAboutStatus(id);
  }

  return { error: null };
};

export const deleteReport = async (id) => {
  const previous = cache.reports.find((r) => r.id === id);
  cache.reports = cache.reports.filter((r) => r.id !== id);
  emit();

  const { error } = await supabase.from('reports').delete().eq('id', id);
  if (error) {
    console.error('[store] deleteReport failed:', error.message);
    if (previous) {
      cache.reports = upsertInto(cache.reports, previous);
      emit();
    }
    return { error: error.message };
  }
  return { error: null };
};

/**
 * Reconciles a whole reports array against the cache.
 *
 * The old savePersistedReports() wrote the entire collection to
 * localStorage, and several pages still hand back a full list. Against a
 * shared database that cannot be a blind overwrite — it would clobber
 * concurrent edits and other halls' rows — so only genuine differences are
 * sent.
 */
export const saveReports = async (reports) => {
  const byId = new Map(cache.reports.map((r) => [r.id, r]));
  const changed = [];

  for (const report of reports) {
    const before = byId.get(report.id);
    if (!before) continue; // creating reports is the mobile app's job

    const patch = reportToRow(report);
    const beforeRow = reportToRow(before);
    const differs = Object.keys(patch).some(
      (k) => JSON.stringify(patch[k]) !== JSON.stringify(beforeRow[k])
    );
    if (differs) changed.push({ id: report.id, patch });
  }

  for (const { id, patch } of changed) {
    const { error } = await supabase.from('reports').update(patch).eq('id', id);
    if (error) console.error('[store] saveReports failed for', id, error.message);
  }

  if (changed.length) await hydrate();
};

// ---------------------------------------------------------------------
// News
// ---------------------------------------------------------------------
export const createNews = async ({ hallId, title, content, author, image }) => {
  const { data, error } = await supabase
    .from('news')
    .insert({
      hall_id: hallId || null,
      title,
      content,
      author: author || '',
      image_url: image || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[store] createNews failed:', error.message);
    return { error: error.message };
  }

  cache.news = upsertInto(cache.news, rowToNews(data));
  emit();
  return { error: null, news: rowToNews(data) };
};

export const updateNews = async (id, changes) => {
  const patch = {};
  if (changes.title !== undefined) patch.title = changes.title;
  if (changes.content !== undefined) patch.content = changes.content;
  if (changes.hallId !== undefined) patch.hall_id = changes.hallId || null;
  if (changes.image !== undefined) patch.image_url = changes.image || null;

  const { data, error } = await supabase.from('news').update(patch).eq('id', id).select().single();
  if (error) {
    console.error('[store] updateNews failed:', error.message);
    return { error: error.message };
  }

  cache.news = upsertInto(cache.news, rowToNews(data));
  emit();
  return { error: null };
};

export const deleteNews = async (id) => {
  const { error } = await supabase.from('news').delete().eq('id', id);
  if (error) {
    console.error('[store] deleteNews failed:', error.message);
    return { error: error.message };
  }
  cache.news = cache.news.filter((n) => n.id !== id);
  emit();
  return { error: null };
};

// ---------------------------------------------------------------------
// Halls
// ---------------------------------------------------------------------
export const saveHall = async (hall) => {
  const row = {
    name: hall.name,
    code: hall.code,
    floors: Number(hall.floors) || 0,
    rooms: Number(hall.rooms) || 0,
  };

  const query = hall.id
    ? supabase.from('halls').update(row).eq('id', hall.id)
    : supabase.from('halls').insert(row);

  const { data, error } = await query.select().single();
  if (error) {
    console.error('[store] saveHall failed:', error.message);
    return { error: error.message };
  }

  cache.halls = upsertInto(cache.halls, rowToHall(data));
  emit();
  return { error: null, hall: rowToHall(data) };
};

export const deleteHall = async (id) => {
  const { error } = await supabase.from('halls').delete().eq('id', id);
  if (error) {
    console.error('[store] deleteHall failed:', error.message);
    return { error: error.message };
  }
  cache.halls = cache.halls.filter((h) => h.id !== id);
  emit();
  return { error: null };
};

// ---------------------------------------------------------------------
// Support chat
//
// The same conversations/messages tables the mobile ChatScreen uses. Not
// currently called from anywhere in this app (the "Live Chat with Student"
// panel that used these lived in the now-removed Technician Dashboard) but
// left in place: the tables and RLS are still live, the mobile app still
// depends on them, and a future admin-facing chat view can call straight
// back into these.
// ---------------------------------------------------------------------
export const getConversationForReport = async (report) => {
  if (!report?.id) return { error: 'No report' };

  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('id')
    .eq('report_id', report.id)
    .maybeSingle();

  if (findError) {
    console.error('[store] getConversationForReport failed:', findError.message);
    return { error: findError.message };
  }
  if (existing) return { error: null, id: existing.id };

  // The student who filed the report owns the conversation; staff joining
  // it are recorded as staff_id.
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      report_id: report.id,
      student_id: report.studentId,
      staff_id: auth.user?.id ?? null,
      subject: `${report.category} — ${report.issue}`,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[store] could not open conversation:', error.message);
    return { error: error.message };
  }
  return { error: null, id: data.id };
};

export const fetchMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, sender_name, sender_role, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at');

  if (error) {
    console.error('[store] fetchMessages failed:', error.message);
    return [];
  }
  return data || [];
};

export const sendMessage = async (conversationId, body, sender) => {
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: sender.id,
    sender_name: sender.name,
    sender_role: sender.role,
    body,
  });

  if (error) {
    console.error('[store] sendMessage failed:', error.message);
    return { error: error.message };
  }
  return { error: null };
};

export const subscribeToMessages = (conversationId, onMessage) => {
  const ch = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(ch);
};

// ---------------------------------------------------------------------
// Appointments
//
// Scheduled from the admin-facing Appointment Schedule page (hall_admin /
// super_admin) rather than by a technician, so the creator is always the
// signed-in admin.
// ---------------------------------------------------------------------
export const createAppointment = async ({ report, title, scheduledFor, slotLabel }) => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: 'Not signed in' };

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      report_id: report?.id ?? null,
      student_id: report?.studentId ?? null,
      created_by: auth.user.id,
      hall_id: report?.hallId ?? null,
      hall_name: report?.hallName ?? report?.hall ?? null,
      student_name: report?.studentName ?? null,
      report_category: report?.category ?? null,
      report_issue: report?.issue ?? null,
      title: title || 'Maintenance Visit',
      slot_label: slotLabel || '',
      scheduled_for: scheduledFor || null,
      status: 'scheduled',
    })
    .select(APPOINTMENT_COLUMNS)
    .single();

  if (error) {
    console.error('[store] createAppointment failed:', error.message);
    return { error: error.message };
  }

  cache.appointments = upsertInto(cache.appointments, rowToAppointment(data));
  emit();
  return { error: null, appointment: rowToAppointment(data) };
};

/** Reschedule an appointment, or mark it completed/cancelled. */
export const updateAppointment = async (id, changes) => {
  const previous = cache.appointments.find((a) => a.id === id);
  if (previous) {
    cache.appointments = upsertInto(cache.appointments, { ...previous, ...changes });
    emit();
  }

  const patch = {};
  if (changes.status !== undefined) patch.status = changes.status;
  if (changes.title !== undefined) patch.title = changes.title;
  if (changes.slotLabel !== undefined) patch.slot_label = changes.slotLabel;
  if (changes.scheduledFor !== undefined) patch.scheduled_for = changes.scheduledFor;

  const { data, error } = await supabase
    .from('appointments')
    .update(patch)
    .eq('id', id)
    .select(APPOINTMENT_COLUMNS)
    .single();

  if (error) {
    console.error('[store] updateAppointment failed:', error.message);
    if (previous) {
      cache.appointments = upsertInto(cache.appointments, previous);
      emit();
    }
    return { error: error.message };
  }

  cache.appointments = upsertInto(cache.appointments, rowToAppointment(data));
  emit();
  return { error: null };
};

export const deleteAppointment = async (id) => {
  const previous = cache.appointments.find((a) => a.id === id);
  cache.appointments = cache.appointments.filter((a) => a.id !== id);
  emit();

  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) {
    console.error('[store] deleteAppointment failed:', error.message);
    if (previous) {
      cache.appointments = upsertInto(cache.appointments, previous);
      emit();
    }
    return { error: error.message };
  }
  return { error: null };
};

// ---------------------------------------------------------------------
// Staff
//
// Creating a login needs privileges the anon key does not have, so these
// call the SECURITY DEFINER functions from migration 0004 rather than
// writing to auth.users directly. Only hall_admin accounts are creatable
// now (the technician role was removed), and only by a super admin — see
// remove_technician_role.sql.
// ---------------------------------------------------------------------
export const createStaffAccount = async ({ email, password, name, role, hallId, phone }) => {
  const cleanEmail = email.toLowerCase().trim();
  const { data, error } = await supabase.rpc('create_staff_account', {
    p_email: cleanEmail,
    p_password: password,
    p_full_name: name,
    p_role: role,
    p_hall_id: hallId || null,
    p_specialty: null,
    p_phone: phone || null,
  });

  if (error) {
    console.error('[store] createStaffAccount failed:', error.message);
    return { error: error.message };
  }

  await hydrate();
  return { error: null, id: data };
};

export const updateStaffProfile = async (id, changes) => {
  const patch = {};
  if (changes.name !== undefined) patch.full_name = changes.name;
  if (changes.role !== undefined) patch.role = changes.role;
  if (changes.phone !== undefined) patch.phone = changes.phone;
  if (changes.hallId !== undefined) patch.hall_id = changes.hallId || null;
  if (changes.isActive !== undefined) patch.is_active = changes.isActive;
  if (changes.emailNotifications !== undefined) patch.email_notifications = changes.emailNotifications;

  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) {
    console.error('[store] updateStaffProfile failed:', error.message);
    return { error: error.message };
  }

  await hydrate();
  return { error: null };
};

export const setStaffPassword = async (id, password) => {
  const { error } = await supabase.rpc('set_staff_password', {
    p_user_id: id,
    p_password: password,
  });
  if (error) {
    console.error('[store] setStaffPassword failed:', error.message);
    return { error: error.message };
  }
  return { error: null };
};

export const deleteStaffAccount = async (id) => {
  const { error } = await supabase.rpc('delete_staff_account', { p_user_id: id });
  if (error) {
    console.error('[store] deleteStaffAccount failed:', error.message);
    return { error: error.message };
  }

  cache.staff = cache.staff.filter((s) => s.id !== id);
  emit();
  return { error: null };
};
