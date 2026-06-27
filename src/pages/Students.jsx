// src/pages/Students.jsx - REMOVED UNUSED 'halls' IMPORT
import React, { useState, useEffect } from 'react';
import { getStudentsByHall } from '../data/mockData';
import HallSelector from '../components/HallSelector';

export default function Students({ user }) {
  const [students, setStudents] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);

  useEffect(() => {
    const hallId = user?.role === 'super_admin' ? selectedHall : user?.hallId;
    const hallStudents = getStudentsByHall(hallId);
    setStudents(hallStudents);
  }, [user, selectedHall]);

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
    const hallId = user?.role === 'super_admin' ? selectedHall : user?.hallId;
    setStudents(updatedStudents.filter(s => !hallId || s.hallId === hallId));
  };

  const showHallSelector = user?.role === 'super_admin';

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">👥 Students Management</h2>
          <p className="page-subtitle">
            {user?.role === 'super_admin' 
              ? 'View all registered students across all halls'
              : `View all registered students in ${user?.hallName}`
            }
          </p>
        </div>
        <div className="hall-badge">
          <span className="hall-tag">
            {user?.role === 'super_admin' ? '⭐ All Halls' : `🏛️ ${user?.hallName}`}
          </span>
        </div>
      </div>

      {showHallSelector && (
        <HallSelector 
          selectedHall={selectedHall} 
          onSelectHall={setSelectedHall} 
        />
      )}

      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                {user?.role === 'super_admin' && <th>Hall</th>}
                <th>Reports</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td style={{ fontWeight: '500' }}>{student.name}</td>
                  <td>{student.email}</td>
                  {user?.role === 'super_admin' && <td>{student.hallName}</td>}
                  <td>
                    <span style={{ 
                      background: '#ECFDF5', 
                      color: '#10B981',
                      padding: '2px 10px',
                      borderRadius: '4px',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}>
                      {student.reports}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={(student.status || 'active') === 'active'} 
                          onChange={() => toggleStatus(student.id)} 
                        />
                        <span className="slider"></span>
                      </label>
                      <span style={{ 
                        fontSize: '13px', 
                        fontWeight: '500', 
                        color: (student.status || 'active') === 'active' ? '#10B981' : '#6B7280' 
                      }}>
                        {(student.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}