// src/pages/Students.jsx - MINIMALIST STUDENT DIRECTORY WITH TECH REMARKS
import React, { useState, useEffect } from 'react';
import { getStudentsByHall, getPersistedHalls, getPersistedReports, getCategoryIcon } from '../data/mockData';

export default function Students({ user }) {
  const isSuperAdmin = user?.role === 'super_admin';
  const [students, setStudents] = useState([]);
  const [halls, setHalls] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForRemarks, setSelectedStudentForRemarks] = useState(null);
  const [showRemarksModal, setShowRemarksModal] = useState(false);

  const loadData = () => {
    setReports(getPersistedReports());
    const hallId = isSuperAdmin ? selectedHall : user?.hallId;
    setStudents(getStudentsByHall(hallId));
  };

  // Load halls and initial students/reports
  useEffect(() => {
    setHalls(getPersistedHalls());
  }, []);

  useEffect(() => {
    loadData();

    if (typeof window !== 'undefined') {
      window.addEventListener('mock-data-updated', loadData);
      return () => window.removeEventListener('mock-data-updated', loadData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleOpenRemarks = (student) => {
    setSelectedStudentForRemarks(student);
    setShowRemarksModal(true);
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
    csvContent += 'Name,Hall,Room,Email,Reports,Technician Remarks,Fault Status\n';
    
    filteredStudents.forEach(s => {
      const room = s.room || `Block ${String.fromCharCode(65 + (Number(s.id) % 3))}-${100 + Number(s.id)}`;
      const status = (s.status || 'active') === 'active' ? 'Resolved' : 'Pending';

      const studentReports = reports.filter(r => 
        (r.studentEmail && r.studentEmail.toLowerCase() === s.email.toLowerCase()) || 
        (r.studentName && r.studentName.toLowerCase() === s.name.toLowerCase())
      );
      const notes = studentReports
        .filter(r => r.status === 'resolved' && r.technicianNotes)
        .map(r => `${r.category} - ${r.issue}: ${r.technicianNotes}`)
        .join(' | ');

      csvContent += `"${s.name}","${s.hallName}","${room}","${s.email}",${s.reports || 0},"${notes.replace(/"/g, '""')}","${status}"\n`;
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-container-highest">
                <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-secondary font-bold">Student Name</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-secondary font-bold">Residential Location</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-secondary font-bold">Email Address</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-secondary font-bold text-center">Reports</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-secondary font-bold">Technician Remarks</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-secondary font-bold">Fault Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-surface-container">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-secondary font-medium">
                    No student records match search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const room = student.room || `Block ${String.fromCharCode(65 + (Number(student.id) % 3))}-${100 + Number(student.id)}`;
                  const isActive = (student.status || 'active') === 'active';
                  
                  // Retrieve reports matching this student's details
                  const studentReports = reports.filter(r => 
                    (r.studentEmail && r.studentEmail.toLowerCase() === student.email.toLowerCase()) || 
                    (r.studentName && r.studentName.toLowerCase() === student.name.toLowerCase())
                  );
                  const resolvedReportsWithNotes = studentReports.filter(r => r.status === 'resolved' && r.technicianNotes);

                  return (
                    <tr key={student.id} className="hover:bg-surface-container-low transition-colors align-top">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-deep-charcoal text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
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
                        {resolvedReportsWithNotes.length === 0 ? (
                          <span className="text-secondary italic text-xs">No remarks</span>
                        ) : (
                          <button
                            onClick={() => handleOpenRemarks(student)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-900 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            View Remarks ({resolvedReportsWithNotes.length})
                          </button>
                        )}
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

      {/* ===== REMARKS MODAL ===== */}
      {showRemarksModal && selectedStudentForRemarks && (() => {
        const studentReports = reports.filter(r => 
          (r.studentEmail && r.studentEmail.toLowerCase() === selectedStudentForRemarks.email.toLowerCase()) || 
          (r.studentName && r.studentName.toLowerCase() === selectedStudentForRemarks.name.toLowerCase())
        );
        const resolvedReportsWithNotes = studentReports.filter(r => r.status === 'resolved' && r.technicianNotes);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-surface-container-highest rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl flex flex-col max-h-[85vh] animate-scale-up">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6 border-b border-surface-container pb-4">
                <div>
                  <h3 className="text-lg font-bold text-deep-charcoal flex items-center gap-2">
                    <span className="material-symbols-outlined text-[24px]">description</span>
                    Technician Remarks
                  </h3>
                  <p className="text-xs text-secondary mt-1">
                    Resolved tickets history for <strong className="text-deep-charcoal">{selectedStudentForRemarks.name}</strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRemarksModal(false);
                    setSelectedStudentForRemarks(null);
                  }}
                  className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-highest flex items-center justify-center text-secondary hover:text-deep-charcoal transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Remarks List */}
              <div className="flex-1 overflow-y-auto thin-scrollbar space-y-4 pr-1">
                {resolvedReportsWithNotes.length === 0 ? (
                  <p className="text-center py-10 text-secondary text-sm italic">
                    No resolved remarks found for this student.
                  </p>
                ) : (
                  resolvedReportsWithNotes.map((report) => (
                    <div 
                      key={report.id} 
                      className="bg-surface-container-low border border-surface-container-highest rounded-2xl p-4 space-y-3 shadow-sm hover:shadow transition-shadow"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(report.category)}</span>
                          <div>
                            <h4 className="font-bold text-sm text-deep-charcoal leading-snug">{report.issue}</h4>
                            <p className="text-[10px] text-secondary font-medium">{report.location}</p>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] bg-surface-container px-2 py-0.5 rounded-md font-bold text-deep-charcoal border border-surface-container-highest flex-shrink-0">
                          #{report.id}
                        </span>
                      </div>

                      <div className="bg-white border border-surface-container rounded-xl p-3 text-xs text-deep-charcoal italic leading-relaxed relative">
                        <span className="absolute top-1 left-2 text-neutral-200 text-3xl font-serif select-none pointer-events-none">“</span>
                        <p className="pl-4 pr-2 font-medium">"{report.technicianNotes}"</p>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-secondary font-bold pt-2 border-t border-surface-container">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">badge</span>
                          <span>By: {report.assignedName || 'Technician'} ({report.assignedSpecialty || report.category} Specialist)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          <span>{report.repairDate ? new Date(report.repairDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-surface-container flex justify-end">
                <button
                  onClick={() => {
                    setShowRemarksModal(false);
                    setSelectedStudentForRemarks(null);
                  }}
                  className="px-5 py-2.5 bg-black hover:bg-neutral-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Close Remarks
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}