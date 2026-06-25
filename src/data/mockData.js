// src/data/mockData.js - WITH PHOTO EVIDENCE
// ===== HALLS DATA =====
export const halls = [
  { id: '1', name: 'Unity Hall', code: 'unity', floors: 5, rooms: 50 },
  { id: '2', name: 'Independence Hall', code: 'independence', floors: 4, rooms: 40 },
  { id: '3', name: 'Republic Hall', code: 'republic', floors: 6, rooms: 60 },
  { id: '4', name: 'Africa Hall', code: 'africa', floors: 3, rooms: 30 },
  { id: '5', name: 'University Hall', code: 'university', floors: 4, rooms: 45 },
  { id: '6', name: 'Queen Elizabeth II Hall', code: 'queenshall', floors: 5, rooms: 55 },
];

// ===== ADMINS DATA =====
export const admins = [
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

// ===== STUDENTS DATA =====
export const mockStudents = [
  { id: '1', name: 'John Mensah', email: 'john@st.knust.edu.gh', hallId: '1', hallName: 'Unity Hall', reports: 5 },
  { id: '2', name: 'Ama Serwaa', email: 'ama@st.knust.edu.gh', hallId: '2', hallName: 'Independence Hall', reports: 3 },
  { id: '3', name: 'Kwame Asante', email: 'kwame@st.knust.edu.gh', hallId: '3', hallName: 'Republic Hall', reports: 7 },
  { id: '4', name: 'Esi Ampofo', email: 'esi@st.knust.edu.gh', hallId: '4', hallName: 'Africa Hall', reports: 2 },
  { id: '5', name: 'Kofi Annan', email: 'kofi@st.knust.edu.gh', hallId: '1', hallName: 'Unity Hall', reports: 4 },
  { id: '6', name: 'Akua Manu', email: 'akua@st.knust.edu.gh', hallId: '5', hallName: 'University Hall', reports: 6 },
  { id: '7', name: 'Yaw Boakye', email: 'yaw@st.knust.edu.gh', hallId: '6', hallName: 'Queen Elizabeth II Hall', reports: 3 },
];

// ===== STAFF DATA =====
export const mockStaff = [
  { id: '1', name: 'Mr. Osei Tutu', role: 'Admin', email: 'osei@snapfix.com', status: 'active' },
  { id: '2', name: 'Mr. Kwaku Mensah', role: 'Technician', email: 'kwaku@snapfix.com', status: 'active' },
  { id: '3', name: 'Ms. Abena Oforiwa', role: 'Technician', email: 'abena@snapfix.com', status: 'active' },
  { id: '4', name: 'Mr. Kofi Asare', role: 'Technician', email: 'kofi@snapfix.com', status: 'active' },
];

// ===== REPORTS WITH PHOTO EVIDENCE =====
export const mockReports = [
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
    imageUri: 'https://via.placeholder.com/400x300/FFD700/333?text=Electrical+Issue',
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
    imageUri: 'https://via.placeholder.com/400x300/00BFFF/333?text=Plumbing+Issue',
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
    imageUri: 'https://via.placeholder.com/400x300/8B4513/333?text=Carpentry+Issue',
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
    imageUri: 'https://via.placeholder.com/400x300/A0522D/333?text=Masonry+Issue',
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
    imageUri: 'https://via.placeholder.com/400x300/FF6B35/333?text=Faulty+Socket',
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
    imageUri: 'https://via.placeholder.com/400x300/1E90FF/333?text=Blocked+Drain',
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
    imageUri: 'https://via.placeholder.com/400x300/FFA500/333?text=Fan+Issue',
    assignedTo: null,
    assignedName: null,
    assignedSpecialty: null,
    technicianNotes: '',
    repairDate: null
  },
];

// ===== LOCATIONS DATA =====
export const mockLocations = [
  { id: '1', name: 'Unity Hall', code: 'unity', floors: 5, rooms: 50 },
  { id: '2', name: 'Independence Hall', code: 'independence', floors: 4, rooms: 40 },
  { id: '3', name: 'Republic Hall', code: 'republic', floors: 6, rooms: 60 },
  { id: '4', name: 'Africa Hall', code: 'africa', floors: 3, rooms: 30 },
  { id: '5', name: 'University Hall', code: 'university', floors: 4, rooms: 45 },
  { id: '6', name: 'Queen Elizabeth II Hall', code: 'queenshall', floors: 5, rooms: 55 },
];

// ===== HELPER FUNCTIONS =====
export const getReportsByHall = (hallId) => {
  if (!hallId) return mockReports;
  return mockReports.filter(report => report.hallId === hallId);
};

export const getReportsByTechnician = (technicianId) => {
  if (!technicianId) return [];
  return mockReports.filter(report => report.assignedTo === technicianId);
};

export const getReportsPendingAssignment = (hallId) => {
  const reports = hallId ? mockReports.filter(r => r.hallId === hallId) : mockReports;
  return reports.filter(r => r.assignedTo === null && r.status === 'pending');
};

export const getStudentsByHall = (hallId) => {
  if (!hallId) return mockStudents;
  return mockStudents.filter(student => student.hallId === hallId);
};

export const getAdminByEmail = (email) => {
  return admins.find(admin => admin.email === email);
};

export const getTechnicianBySpecialty = (specialty) => {
  return admins.find(admin => admin.role === 'technician' && admin.specialty === specialty);
};

export const getTechnicians = () => {
  return admins.filter(admin => admin.role === 'technician');
};

export const getTechniciansBySpecialty = (specialty) => {
  return admins.filter(admin => admin.role === 'technician' && admin.specialty === specialty);
};

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