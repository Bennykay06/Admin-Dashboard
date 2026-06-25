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
const initialAdmins = [
  // Hall-Specific Admins
  { 
    id: '1', 
    email: 'unity@snapfix.com', 
    password: 'unity123', 
    name: 'Unity Admin',
    role: 'hall_admin',
    hallId: '1',
    hallName: 'Unity Hall'
  },
  { 
    id: '2', 
    email: 'independence@snapfix.com', 
    password: 'independence123', 
    name: 'Independence Admin',
    role: 'hall_admin',
    hallId: '2',
    hallName: 'Independence Hall'
  },
  { 
    id: '3', 
    email: 'republic@snapfix.com', 
    password: 'republic123', 
    name: 'Republic Admin',
    role: 'hall_admin',
    hallId: '3',
    hallName: 'Republic Hall'
  },
  { 
    id: '4', 
    email: 'africa@snapfix.com', 
    password: 'africa123', 
    name: 'Africa Admin',
    role: 'hall_admin',
    hallId: '4',
    hallName: 'Africa Hall'
  },
  { 
    id: '5', 
    email: 'universityhall@snapfix.com', 
    password: 'university123', 
    name: 'University Admin',
    role: 'hall_admin',
    hallId: '5',
    hallName: 'University Hall'
  },
  { 
    id: '6', 
    email: 'queenshall@snapfix.com', 
    password: 'queenshall123', 
    name: 'Queen Elizabeth II Admin',
    role: 'hall_admin',
    hallId: '6',
    hallName: 'Queen Elizabeth II Hall'
  },
  // Super Admin
  { 
    id: '7', 
    email: 'admin@snapfix.com', 
    password: 'admin123', 
    name: 'Super Admin',
    role: 'super_admin',
    hallId: null,
    hallName: 'All Halls'
  },
  // ===== TECHNICIANS =====
  { 
    id: '8', 
    email: 'kwaku@snapfix.com', 
    password: 'kwaku123', 
    name: 'Kwaku Mensah',
    role: 'technician',
    hallId: null,
    hallName: 'All Halls',
    specialty: 'Electrical',
    specialtyIcon: '⚡'
  },
  { 
    id: '9', 
    email: 'osei@snapfix.com', 
    password: 'osei123', 
    name: 'Osei Tutu',
    role: 'technician',
    hallId: null,
    hallName: 'All Halls',
    specialty: 'Plumbing',
    specialtyIcon: '🔧'
  },
  { 
    id: '10', 
    email: 'abena@snapfix.com', 
    password: 'abena123', 
    name: 'Abena Oforiwa',
    role: 'technician',
    hallId: null,
    hallName: 'All Halls',
    specialty: 'Carpentry',
    specialtyIcon: '🪚'
  },
  { 
    id: '11', 
    email: 'kofi@snapfix.com', 
    password: 'kofi123', 
    name: 'Kofi Asare',
    role: 'technician',
    hallId: null,
    hallName: 'All Halls',
    specialty: 'Masonry',
    specialtyIcon: '🧱'
  },
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
const initialStaff = [
  { id: '1', name: 'Mr. Osei Tutu', role: 'Plumbing Technician', email: 'osei@snapfix.com', status: 'active' },
  { id: '2', name: 'Mr. Kwaku Mensah', role: 'Electrical Technician', email: 'kwaku@snapfix.com', status: 'active' },
  { id: '3', name: 'Ms. Abena Oforiwa', role: 'Carpentry Technician', email: 'abena@snapfix.com', status: 'active' },
  { id: '4', name: 'Mr. Kofi Asare', role: 'Masonry Technician', email: 'kofi@snapfix.com', status: 'active' },
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
    assignedTo: '8', // Assigned to Kwaku
    assignedName: 'Kwaku Mensah',
    assignedSpecialty: 'Electrical',
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
    status: 'in-progress',
    priority: 'medium',
    timestamp: '2024-06-19T14:20:00Z',
    description: 'The bathroom tap is leaking constantly and wasting water.',
    imageUri: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80',
    assignedTo: '9', // Assigned to Osei
    assignedName: 'Osei Tutu',
    assignedSpecialty: 'Plumbing',
    technicianNotes: 'Investigated the leak. Needs a replacement washer.',
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
    status: 'in-progress',
    priority: 'high',
    timestamp: '2024-06-16T11:00:00Z',
    description: 'The wall socket is sparking when I plug in my charger.',
    imageUri: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=400&q=80',
    assignedTo: '8', // Assigned to Kwaku
    assignedName: 'Kwaku Mensah',
    assignedSpecialty: 'Electrical',
    technicianNotes: 'Scheduled repair for Thursday afternoon.',
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

// ===== LOCALSTORAGE SYNCHRONIZATION =====
const initLocalStorage = () => {
  if (typeof window !== 'undefined') {
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
    if (!localStorage.getItem('snapfix_reports')) {
      localStorage.setItem('snapfix_reports', JSON.stringify(initialReports));
    }
  }
};

// Execute immediately
initLocalStorage();

// ===== EXPORT PERSISTED GETTERS / SETTERS =====
export const getPersistedReports = () => {
  return JSON.parse(localStorage.getItem('snapfix_reports') || '[]');
};

export const savePersistedReports = (reports) => {
  localStorage.setItem('snapfix_reports', JSON.stringify(reports));
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
  return allReports.filter(report => report.hallId === hallId);
};

export const getReportsByTechnician = (technicianId) => {
  if (!technicianId) return [];
  const allReports = getPersistedReports();
  return allReports.filter(report => report.assignedTo === technicianId);
};

export const getReportsPendingAssignment = (hallId) => {
  const allReports = getPersistedReports();
  const reports = hallId ? allReports.filter(r => r.hallId === hallId) : allReports;
  return reports.filter(r => r.assignedTo === null && r.status === 'pending');
};

export const getStudentsByHall = (hallId) => {
  const students = JSON.parse(localStorage.getItem('snapfix_students') || '[]');
  if (!hallId) return students;
  return students.filter(student => student.hallId === hallId);
};

export const getAdminByEmail = (email) => {
  const currentAdmins = getPersistedAdmins();
  return currentAdmins.find(admin => admin.email.toLowerCase() === email.toLowerCase());
};

export const getTechnicianBySpecialty = (specialty) => {
  const currentAdmins = getPersistedAdmins();
  return currentAdmins.find(admin => admin.role === 'technician' && admin.specialty === specialty);
};

export const getTechnicians = () => {
  const currentAdmins = getPersistedAdmins();
  return currentAdmins.filter(admin => admin.role === 'technician');
};

export const getTechniciansBySpecialty = (specialty) => {
  const currentAdmins = getPersistedAdmins();
  return currentAdmins.filter(admin => admin.role === 'technician' && admin.specialty === specialty);
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