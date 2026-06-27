// src/pages/Dashboard.jsx - REMOVED NEWS FEED FROM DASHBOARD
import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { getReportsByHall } from '../data/mockData';
import HallSelector from '../components/HallSelector';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const [reports, setReports] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);

  useEffect(() => {
    const hallId = user?.role === 'super_admin' ? selectedHall : user?.hallId;
    
    // Load Reports
    const hallReports = getReportsByHall(hallId);
    setReports(hallReports);

    const total = hallReports.length;
    const pending = hallReports.filter(r => r.status === 'pending').length;
    const inProgress = hallReports.filter(r => r.status === 'in-progress').length;
    const resolved = hallReports.filter(r => r.status === 'resolved').length;
    
    setStats({ total, pending, inProgress, resolved });
  }, [user, selectedHall]);

  const getHallDisplay = () => {
    if (user?.role === 'super_admin') {
      if (selectedHall) {
        const hall = reports.find(r => r.hallId === selectedHall);
        return hall ? hall.hallName : 'All Halls';
      }
      return 'All Halls';
    }
    return user?.hallName || 'Your Hall';
  };

  const recentReports = reports.slice(0, 5);
  const showHallSelector = user?.role === 'super_admin';

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            {user?.role === 'super_admin' 
              ? `📊 ${getHallDisplay()} Overview` 
              : `📊 ${getHallDisplay()} Dashboard`
            }
          </h2>
          <p className="page-subtitle">
            {user?.role === 'super_admin' 
              ? 'Manage all 6 halls from one dashboard'
              : `Manage reports for ${getHallDisplay()}`
            }
          </p>
        </div>
        <div className="hall-badge">
          <span className="hall-tag">
            {user?.role === 'super_admin' ? '⭐ Super Admin' : `🏛️ ${getHallDisplay()}`}
          </span>
        </div>
      </div>

      {showHallSelector && (
        <HallSelector 
          selectedHall={selectedHall} 
          onSelectHall={setSelectedHall} 
        />
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard label="Total Reports" value={stats.total} icon="📊" />
        <StatCard label="Pending" value={stats.pending} type="pending" icon="⏳" />
        <StatCard label="In Progress" value={stats.inProgress} type="in-progress" icon="🔄" />
        <StatCard label="Resolved" value={stats.resolved} type="resolved" icon="✅" />
      </div>

      {/* Recent Reports (Full Width) */}
      <div className="table-container" style={{ marginTop: '24px' }}>
        <div style={{ padding: '20px 24px 0 24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>📋 Recent Reports</h3>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Issue</th>
                {user?.role === 'super_admin' && <th>Hall</th>}
                <th>Location</th>
                <th>Status</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.length > 0 ? (
                recentReports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.studentName}</td>
                    <td>{report.issue}</td>
                    {user?.role === 'super_admin' && <td>{report.hallName}</td>}
                    <td>{report.location}</td>
                    <td>
                      <span className={`badge badge-${report.status}`}>
                        {report.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        color: report.priority === 'high' ? '#DC2626' : 
                               report.priority === 'medium' ? '#F59E0B' : '#10B981',
                        fontWeight: '600'
                      }}>
                        {report.priority.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={user?.role === 'super_admin' ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                    No reports found for this hall
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}