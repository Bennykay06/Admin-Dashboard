// src/pages/Students.jsx - MINIMALIST STUDENT DIRECTORY
import React, { useState, useEffect } from 'react';
import { getStudentsByHall, getPersistedHalls } from '../data/mockData';

export default function Students({ user }) {
  const isSuperAdmin = user?.role === 'super_admin';
  const [students, setStudents] = useState([]);
  const [halls, setHalls] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load halls and initial students
  useEffect(() => {
    setHalls(getPersistedHalls());
  }, []);

  useEffect(() => {
    const hallId = isSuperAdmin ? selectedHall : user?.hallId;
    const hallStudents = getStudentsByHall(hallId);
    setStudents(hallStudents);
  }, [user, selectedHall, isSuperAdmin]);

  const toggleStatus = (id) => {
    const allStudents = JSON.parse(localStorage.getItem('snapfix_students') || '[]');
    const updatedStudents = allStudents.map(student => {
      if (student.id === id) {
        const currentStatus = student.status || 'active';
        return {
          ...student,
          status: currentStatus === 'active' ? 'inactive' : 'active'
        };
      }
      return student;
    });
    localStorage.setItem('snapfix_students', JSON.stringify(updatedStudents));
    
    // Refresh display
    const hallId = isSuperAdmin ? selectedHall : user?.hallId;
    setStudents(updatedStudents.filter(s => !hallId || String(s.hallId) === String(hallId)));
  };

  // Filter students based on search and resolved status
  const filteredStudents = students.filter(student => {
    const isActive = (student.status || 'active') === 'active';
    if (!isActive) return false;

    const term = searchQuery.toLowerCase();
    const room = student.room || `Block ${String.fromCharCode(65 + (Number(student.id) % 3))}-${100 + Number(student.id)}`;
    
    return (
      student.name.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term) ||
      room.toLowerCase().includes(term)
    );
  });

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().toUpperCase().split(/\s+/);
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return parts[0].slice(0, 2);
  };

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Name,Hall,Room,Email,Reports,Fault Status\n';
    
    filteredStudents.forEach(s => {
      const room = s.room || `Block ${String.fromCharCode(65 + (Number(s.id) % 3))}-${100 + Number(s.id)}`;
      const status = (s.status || 'active') === 'active' ? 'Resolved' : 'Pending';
      csvContent += `"${s.name}","${s.hallName}","${room}","${s.email}",${s.reports || 0},"${status}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'student_directory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics
  const totalStudentsCount = filteredStudents.length;
  const activeReportersCount = filteredStudents.filter(s => (s.reports || 0) > 0).length;

  return (
    <div className="font-body-md">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div>
          <h2 className="font-headline-xl text-headline-xl font-bold text-deep-charcoal tracking-tight">Student Directory</h2>
          <p className="text-secondary font-body-lg mt-1">
            {isSuperAdmin 
              ? (selectedHall ? `Displaying resolved reports for ${halls.find(h => String(h.id) === String(selectedHall))?.name || ''}` : 'Displaying all resolved faults from all halls')
              : `Displaying resolved reports for registered students in ${user?.hallName}`
            }
          </p>
        </div>
        <div className="flex gap-4">
          {/* Metrics */}
          <div className="bg-white border border-surface-container-highest p-4 px-6 rounded-2xl flex items-center gap-5 min-w-[200px] shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-deep-charcoal text-[28px]">group</span>
            </div>
            <div>
              <p className="text-[10px] text-secondary uppercase font-bold tracking-[0.1em] mb-1">Total Students</p>
              <p className="text-2xl font-bold text-deep-charcoal">{totalStudentsCount}</p>
            </div>
          </div>
          <div className="bg-white border border-surface-container-highest p-4 px-6 rounded-2xl flex items-center gap-5 min-w-[200px] shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-deep-charcoal text-[28px]">record_voice_over</span>
            </div>
            <div>
              <p className="text-[10px] text-secondary uppercase font-bold tracking-[0.1em] mb-1">Active Reporters</p>
              <p className="text-2xl font-bold text-deep-charcoal">{activeReportersCount}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Actions / Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex flex-1 items-center gap-4 w-full md:max-w-2xl">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
            <input 
              className="w-full pl-12 pr-4 py-3 bg-white border border-surface-container-highest rounded-xl focus:ring-1 focus:ring-deep-charcoal focus:border-deep-charcoal outline-none transition-all text-sm font-medium" 
              placeholder="Search by name, room or email..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {isSuperAdmin && (
            <div className="relative">
              <select 
                className="appearance-none pl-4 pr-10 py-3 bg-white border border-surface-container-highest rounded-xl focus:ring-1 focus:ring-deep-charcoal outline-none cursor-pointer text-sm font-medium min-w-[180px]"
                value={selectedHall || ''}
                onChange={(e) => setSelectedHall(e.target.value ? e.target.value : null)}
              >
                <option value="">All Residence</option>
                {halls.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
            </div>
          )}
        </div>
        
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-surface-container-highest text-deep-charcoal rounded-xl text-sm font-bold hover:bg-surface-container-low transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          Export CSV
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-surface-container-highest rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-container-highest">
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-secondary font-bold">Student Name</th>
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-secondary font-bold">Residential Location</th>
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-secondary font-bold">Email Address</th>
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-secondary font-bold text-center">Reports</th>
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-secondary font-bold">Fault Status</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-surface-container">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-secondary font-medium">
                  No student records match search criteria.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const room = student.room || `Block ${String.fromCharCode(65 + (Number(student.id) % 3))}-${100 + Number(student.id)}`;
                const isActive = (student.status || 'active') === 'active';
                
                return (
                  <tr key={student.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-deep-charcoal text-white flex items-center justify-center font-bold text-xs">
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <p className="font-bold text-deep-charcoal">{student.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-deep-charcoal">
                      <span className="font-semibold">{student.hallName}</span>, {room}
                    </td>
                    <td className="px-6 py-4 text-secondary">{student.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-surface-container text-deep-charcoal px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-surface-container-highest">
                        {student.reports}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(student.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          isActive 
                            ? 'bg-status-success/10 text-status-success' 
                            : 'bg-status-critical/10 text-status-critical'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-status-success' : 'bg-status-critical'}`}></span>
                        {isActive ? 'Resolved' : 'Pending'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}