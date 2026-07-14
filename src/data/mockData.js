// src/data/mockData.js - PERSISTENT DATA WITH TECH ASSIGNMENTS
// ===== INITIAL HALLS DATA =====
const initialHalls = [
  { id: '1', name: 'Unity Hall', code: 'unity', floors: 5, rooms: 50 },
  { id: '2', name: 'Independence Hall', code: 'independence', floors: 4, rooms: 40 },
  { id: '3', name: 'Republic Hall', code: 'republic', floors: 6, rooms: 60 },
  { id: '4', name: 'Africa Hall', code: 'africa', floors: 3, rooms: 30 },
  { id: '5', name: 'University Hall', code: 'university', floors: 4, rooms: 45 },
  { id: '6', name: 'Queen Elizabeth II Hall', code: 'queenshall', floors: 5, rooms: 55 },
];

// ===== INITIAL ADMINS DATA =====
// NOTE: Hall admins are NOT seeded here. They must be created by the Super
// Admin via Staff Management. The old hardcoded hall-admin demo logins
// (e.g. unity@snapfix.com) have been removed and are revoked on load.
const initialAdmins = [
  // Super Admin (the only bootstrap admin account)
  {
    id: '7',
    email: 'admin@snapfix.com',
    password: 'admin123',
    name: 'Super Admin',
    role: 'super_admin',
    hallId: null,
    hallName: 'All Halls'
  }
  // No technicians are seeded — they are created by an administrator via
  // Staff Management, and only those generated credentials can log in.
];

// ===== INITIAL STUDENTS DATA =====
const initialStudents = [
  { id: '1', name: 'John Mensah', email: 'john@st.knust.edu.gh', hallId: '1', hallName: 'Unity Hall', reports: 5 },
  { id: '2', name: 'Ama Serwaa', email: 'ama@st.knust.edu.gh', hallId: '2', hallName: 'Independence Hall', reports: 3 },
  { id: '3', name: 'Kwame Asante', email: 'kwame@st.knust.edu.gh', hallId: '3', hallName: 'Republic Hall', reports: 7 },
  { id: '4', name: 'Esi Ampofo', email: 'esi@st.knust.edu.gh', hallId: '4', hallName: 'Africa Hall', reports: 2 },
  { id: '5', name: 'Kofi Annan', email: 'kofi@st.knust.edu.gh', hallId: '1', hallName: 'Unity Hall', reports: 4 },
  { id: '6', name: 'Akua Manu', email: 'akua@st.knust.edu.gh', hallId: '5', hallName: 'University Hall', reports: 6 },
  { id: '7', name: 'Yaw Boakye', email: 'yaw@st.knust.edu.gh', hallId: '6', hallName: 'Queen Elizabeth II Hall', reports: 3 },
];

// ===== INITIAL STAFF DATA =====
// No staff are seeded — an administrator adds them via Staff Management.
const initialStaff = [];

// ===== INITIAL NEWS DATA =====
const initialNews = [
  {
    id: 'n1',
    hallId: '1',
    title: 'Water Supply Maintenance',
    content: 'Please note that the main water valve will be shut down for maintenance on Sunday from 8:00 AM to 12:00 PM. Kindly store enough water.',
    date: '2026-06-25T08:00:00Z',
    author: 'Unity Admin'
  },
  {
    id: 'n2',
    hallId: '2',
    title: 'New WiFi Routers Installed',
    content: 'We have upgraded the WiFi infrastructure in Block B. High-speed connectivity is now available. Let us know if you face issues.',
    date: '2026-06-24T10:00:00Z',
    author: 'Indeco Admin'
  }
];

// ===== INITIAL REPORTS (WITH PRE-ASSIGNMENTS) =====
const initialReports = [
  {
    id: '1',
    studentName: 'John Mensah',
    studentEmail: 'john@st.knust.edu.gh',
    category: 'Electrical',
    issue: 'Bulb not lighting up',
    hallId: '1',
    hallName: 'Unity Hall',
    location: 'Unity Hall, Floor 2, Room 205',
    status: 'pending',
    priority: 'high',
    timestamp: '2024-06-20T10:30:00Z',
    description: 'The fluorescent tube in my room has been flickering for 2 days and now completely dead.',
    imageUri: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=400&q=80',
    assignedTo: null,
    assignedName: null,
    assignedSpecialty: null,
    technicianNotes: '',
    repairDate: null
  },
  {
    id: '2',
    studentName: 'Ama Serwaa',
    studentEmail: 'ama@st.knust.edu.gh',
    category: 'Plumbing',
    issue: 'Leaking tap',
    hallId: '2',
    hallName: 'Independence Hall',
    location: 'Independence Hall, Floor 1, Room 104',
    status: 'pending',
    priority: 'medium',
    timestamp: '2024-06-19T14:20:00Z',
    description: 'The bathroom tap is leaking constantly and wasting water.',
    imageUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    assignedTo: null,
    assignedName: null,
    assignedSpecialty: null,
    technicianNotes: '',
    repairDate: null
  },
  {
    id: '3',
    studentName: 'Kwame Asante',
    studentEmail: 'kwame@st.knust.edu.gh',
    category: 'Carpentry',
    issue: 'Broken door lock',
    hallId: '3',
    hallName: 'Republic Hall',
    location: 'Republic Hall, Floor 3, Room 312',
    status: 'pending',
    priority: 'low',
    timestamp: '2024-06-18T09:15:00Z',
    description: 'The door lock is jammed and cannot be opened from outside.',
    imageUri: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
    assignedTo: null,
    assignedName: null,
    assignedSpecialty: null,
    technicianNotes: '',
    repairDate: null
  },
  {
    id: '4',
    studentName: 'Esi Ampofo',
    studentEmail: 'esi@st.knust.edu.gh',
    category: 'Masonry',
    issue: 'Cracked wall',
    hallId: '4',
    hallName: 'Africa Hall',
    location: 'Africa Hall, Floor 1, Room 112',
    status: 'pending',
    priority: 'medium',
    timestamp: '2024-06-17T16:45:00Z',
    description: 'There is a visible crack on the wall near the window.',
    imageUri: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400&q=80',
    assignedTo: null,
    assignedName: null,
    assignedSpecialty: null,
    technicianNotes: '',
    repairDate: null
  },
  {
    id: '5',
    studentName: 'Kofi Annan',
    studentEmail: 'kofi@st.knust.edu.gh',
    category: 'Electrical',
    issue: 'Faulty socket',
    hallId: '1',
    hallName: 'Unity Hall',
    location: 'Unity Hall, Floor 4, Room 410',
    status: 'pending',
    priority: 'high',
    timestamp: '2024-06-16T11:00:00Z',
    description: 'The wall socket is sparking when I plug in my charger.',
    imageUri: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=400&q=80',
    assignedTo: null,
    assignedName: null,
    assignedSpecialty: null,
    technicianNotes: '',
    repairDate: null
  },
  {
    id: '6',
    studentName: 'Akua Manu',
    studentEmail: 'akua@st.knust.edu.gh',
    category: 'Plumbing',
    issue: 'Blocked drain',
    hallId: '5',
    hallName: 'University Hall',
    location: 'University Hall, Floor 2, Room 208',
    status: 'pending',
    priority: 'medium',
    timestamp: '2024-06-15T13:30:00Z',
    description: 'The sink drain is completely blocked and water is backing up.',
    imageUri: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
    assignedTo: null,
    assignedName: null,
    assignedSpecialty: null,
    technicianNotes: '',
    repairDate: null
  },
  {
    id: '7',
    studentName: 'Yaw Boakye',
    studentEmail: 'yaw@st.knust.edu.gh',
    category: 'Electrical',
    issue: 'Ceiling fan not working',
    hallId: '6',
    hallName: 'Queen Elizabeth II Hall',
    location: 'Queen Elizabeth II Hall, Floor 3, Room 305',
    status: 'pending',
    priority: 'low',
    timestamp: '2024-06-14T09:00:00Z',
    description: 'The ceiling fan is not spinning.',
    imageUri: 'https://images.unsplash.com/photo-1618944847023-38aa001235f0?w=400&q=80',
    assignedTo: null,
    assignedName: null,
    assignedSpecialty: null,
    technicianNotes: '',
    repairDate: null
  },
];

// Retired demo accounts. These are no longer valid logins — hall admins and
// technicians must be created by an administrator via Staff Management. Any of
// these still sitting in a browser's localStorage are removed on load.
const REVOKED_SEED_EMAILS = [
  'unity@snapfix.com',
  'independence@snapfix.com',
  'republic@snapfix.com',
  'africa@snapfix.com',
  'universityhall@snapfix.com',
  'queenshall@snapfix.com',
  'kwame.mensah@unity.snapfix.com',
];

// ===== LOCALSTORAGE SETUP (FRONTEND-ONLY, LOCAL STORAGE ONLY) =====
export const checkMockServer = async () => {
  // Always return false to prevent any backend fetch connections
  return false;
};

const initLocalStorage = async () => {
  if (typeof window !== 'undefined') {
    // Seed each store once if empty. Generated accounts/data are never overwritten.
    if (!localStorage.getItem('snapfix_halls')) {
      localStorage.setItem('snapfix_halls', JSON.stringify(initialHalls));
    }
    if (!localStorage.getItem('snapfix_admins')) {
      localStorage.setItem('snapfix_admins', JSON.stringify(initialAdmins));
    }
    if (!localStorage.getItem('snapfix_students')) {
      localStorage.setItem('snapfix_students', JSON.stringify(initialStudents));
    }
    if (!localStorage.getItem('snapfix_staff')) {
      localStorage.setItem('snapfix_staff', JSON.stringify(initialStaff));
    }
    // Use 'reports' as the primary key to sync with mobile app, fallback/migrate from 'snapfix_reports'
    const storedReports = localStorage.getItem('reports') || localStorage.getItem('snapfix_reports');
    if (!localStorage.getItem('reports')) {
      if (storedReports) {
        localStorage.setItem('reports', storedReports);
      } else {
        localStorage.setItem('reports', JSON.stringify(initialReports));
      }
    } else {
      try {
        const parsed = JSON.parse(storedReports);
        const hasVideo = parsed.some(r => r.imageUri && (r.imageUri.endsWith('.mp4') || r.imageUri.startsWith('data:video/')));
        if (!hasVideo) {
          localStorage.setItem('reports', JSON.stringify(initialReports));
        }
      } catch (e) {}
    }
    if (!localStorage.getItem('snapfix_news')) {
      localStorage.setItem('snapfix_news', JSON.stringify(initialNews));
    }

    // Revoke retired demo accounts (old hall admins + the demo technician)
    // from the login and staff lists, preserving the super admin and any
    // administrator-generated accounts.
    try {
      const admins = JSON.parse(localStorage.getItem('snapfix_admins') || '[]');
      const cleanedAdmins = admins.filter(
        a => !REVOKED_SEED_EMAILS.includes((a.email || '').toLowerCase())
      );
      if (cleanedAdmins.length !== admins.length) {
        localStorage.setItem('snapfix_admins', JSON.stringify(cleanedAdmins));
      }

      const staff = JSON.parse(localStorage.getItem('snapfix_staff') || '[]');
      const cleanedStaff = staff.filter(
        s => !REVOKED_SEED_EMAILS.includes((s.email || '').toLowerCase())
      );
      if (cleanedStaff.length !== staff.length) {
        localStorage.setItem('snapfix_staff', JSON.stringify(cleanedStaff));
      }

      // Unassign reports still pointing at a technician that no longer exists.
      const validTechIds = new Set(
        cleanedAdmins.filter(a => a.role === 'technician').map(a => a.id)
      );
      const reports = JSON.parse(localStorage.getItem('reports') || '[]');
      let reportsChanged = false;
      const cleanedReports = reports.map(r => {
        if (r.assignedTo && !validTechIds.has(r.assignedTo)) {
          reportsChanged = true;
          return { ...r, assignedTo: null, assignedName: null, assignedSpecialty: null };
        }
        return r;
      });
      if (reportsChanged) {
        localStorage.setItem('reports', JSON.stringify(cleanedReports));
      }
    } catch (e) {
      // ignore — malformed stores are left as-is
    }
  }
};

// Start background syncing loop (disabled since we are offline-only)
const startBackgroundSync = () => {
  // No-op
};

// Execute immediately
initLocalStorage().then(() => {
  startBackgroundSync();
});

// ===== EXPORT PERSISTED GETTERS / SETTERS =====
export const getPersistedReports = () => {
  const raw = localStorage.getItem('reports');
  const reports = raw ? JSON.parse(raw) : [];
  return reports.map(r => {
    // Normalize fields from mobile schema to web schema
    const studentName = r.studentName || r.submittedBy || 'Resident';
    const category = r.category || r.serviceType || 'Electrical';
    const issue = r.issue || r.selectedIssue || 'General Issue';
    const description = r.description || r.writtenDetails || 'No description provided';
    const hallName = r.hallName || r.hall || 'Unity Hall';
    let status = r.status || 'pending';
    if (status === 'in progress') status = 'in-progress';
    
    // Media fallback
    let imageUri = r.imageUri || null;
    if (!imageUri && r.photos && r.photos.length > 0) {
      imageUri = r.photos[0];
    } else if (!imageUri && r.video) {
      imageUri = r.video;
    }

    return {
      ...r,
      studentName,
      submittedBy: studentName,
      category,
      serviceType: category,
      issue,
      selectedIssue: issue,
      description,
      writtenDetails: description,
      hallName,
      hall: hallName,
      status,
      imageUri,
    };
  });
};

export const savePersistedReports = (reports) => {
  const normalized = reports.map(r => {
    // Make sure status has the correct spacing for mobile when writing
    let mobileStatus = r.status || 'pending';
    if (mobileStatus === 'in-progress') mobileStatus = 'in progress';
    
    return {
      ...r,
      submittedBy: r.studentName || r.submittedBy,
      serviceType: r.category || r.serviceType,
      selectedIssue: r.issue || r.selectedIssue,
      writtenDetails: r.description || r.writtenDetails,
      hall: r.hallName || r.hall,
      status: mobileStatus,
    };
  });
  localStorage.setItem('reports', JSON.stringify(normalized));
};

export const getPersistedAdmins = () => {
  return JSON.parse(localStorage.getItem('snapfix_admins') || '[]');
};

export const savePersistedAdmins = (adminsList) => {
  localStorage.setItem('snapfix_admins', JSON.stringify(adminsList));
};

export const getPersistedStaff = () => {
  return JSON.parse(localStorage.getItem('snapfix_staff') || '[]');
};

export const savePersistedStaff = (staffList) => {
  localStorage.setItem('snapfix_staff', JSON.stringify(staffList));
};

export const getPersistedNews = () => {
  return JSON.parse(localStorage.getItem('snapfix_news') || '[]');
};

export const savePersistedNews = (newsList) => {
  localStorage.setItem('snapfix_news', JSON.stringify(newsList));
};

export const getPersistedHalls = () => {
  return JSON.parse(localStorage.getItem('snapfix_halls') || '[]');
};

export const savePersistedHalls = (hallsList) => {
  localStorage.setItem('snapfix_halls', JSON.stringify(hallsList));
};

// Maintain compatibility with static exports
export const halls = initialHalls;
export const admins = initialAdmins;
export const mockStudents = initialStudents;
export const mockStaff = initialStaff;
export const mockReports = initialReports;
export const mockLocations = halls;

// ===== PERSISTENT HELPER FUNCTIONS =====
export const getReportsByHall = (hallId) => {
  const allReports = getPersistedReports();
  if (!hallId) return allReports;
  return allReports.filter(report => String(report.hallId) === String(hallId));
};

export const getNewsByHall = (hallId) => {
  const allNews = getPersistedNews();
  if (!hallId) return allNews;
  return allNews.filter(news => String(news.hallId) === String(hallId) || String(news.hallId) === 'all');
};

export const getReportsByTechnician = (technicianId) => {
  if (!technicianId) return [];
  const allReports = getPersistedReports();
  return allReports.filter(report => 
    report.assignedTo !== null && String(report.assignedTo) === String(technicianId)
  );
};

export const getReportsPendingAssignment = (hallId) => {
  const allReports = getPersistedReports();
  const reports = hallId ? allReports.filter(r => String(r.hallId) === String(hallId)) : allReports;
  return reports.filter(r => r.assignedTo === null && r.status === 'pending');
};

export const getStudentsByHall = (hallId) => {
  const students = JSON.parse(localStorage.getItem('snapfix_students') || '[]');
  if (!hallId) return students;
  return students.filter(student => String(student.hallId) === String(hallId));
};

export const getAdminByEmail = (email) => {
  const currentAdmins = getPersistedAdmins();
  return currentAdmins.find(admin => admin.email.toLowerCase() === email.toLowerCase());
};

export const getTechnicianBySpecialty = (specialty) => {
  const currentAdmins = getPersistedAdmins();
  return currentAdmins.find(admin => 
    admin.role === 'technician' && 
    admin.specialty?.toLowerCase() === specialty?.toLowerCase()
  );
};

export const getTechnicians = () => {
  const currentAdmins = getPersistedAdmins();
  return currentAdmins.filter(admin => admin.role === 'technician');
};

export const getTechniciansBySpecialty = (specialty) => {
  const currentAdmins = getPersistedAdmins();
  return currentAdmins.filter(admin => 
    admin.role === 'technician' && 
    admin.specialty?.toLowerCase() === specialty?.toLowerCase()
  );
};

export const saveReport = (updatedReport) => {
  const allReports = getPersistedReports();
  const updatedReports = allReports.map(report => 
    report.id === updatedReport.id ? { ...report, ...updatedReport } : report
  );
  savePersistedReports(updatedReports);
  return updatedReports;
};

// ===== STATIC DISPLAY HELPERS =====
export const getStatusLabel = (status) => {
  switch(status) {
    case 'pending': return 'Pending';
    case 'scheduled': return 'Scheduled';
    case 'in-progress': return 'In Progress';
    case 'resolved': return 'Resolved';
    default: return 'Unknown';
  }
};

export const getPriorityLabel = (priority) => {
  switch(priority) {
    case 'high': return '🔥 High';
    case 'medium': return '⚡ Medium';
    case 'low': return '💤 Low';
    default: return 'Unknown';
  }
};

export const getStatusColor = (status) => {
  switch(status) {
    case 'pending': return '#F59E0B';
    case 'scheduled': return '#EA580C';
    case 'in-progress': return '#3B82F6';
    case 'resolved': return '#10B981';
    default: return '#6B7280';
  }
};

export const getCategoryIcon = (category) => {
  switch(category) {
    case 'Electrical': return '⚡';
    case 'Plumbing': return '🔧';
    case 'Carpentry': return '🪚';
    case 'Masonry': return '🧱';
    default: return '📋';
  }
};