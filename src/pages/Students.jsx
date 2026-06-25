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
                    <span className="badge badge-active">Active</span>
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