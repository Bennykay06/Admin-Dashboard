import React from 'react';

export default function StatCard({ label, value, type, icon }) {
  const getTypeClass = () => {
    switch(type) {
      case 'pending': return 'pending';
      case 'scheduled': return 'scheduled';
      case 'in-progress': return 'in-progress';
      case 'resolved': return 'resolved';
      default: return '';
    }
  };

  return (
    <div className={`stat-card ${getTypeClass()}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-number">{value}</div>
    </div>
  );
}