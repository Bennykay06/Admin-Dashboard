// src/components/Sidebar.jsx - HIDE LOCATIONS FROM NON-SUPER ADMINS
import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ sidebarOpen, user }) {
  const isSuperAdmin = user?.role === 'super_admin';

  // ===== TECHNICIAN NAVIGATION =====
  const technicianNavItems = [
    { path: '/technician', icon: '🔧', label: 'Dashboard' },
  ];

  // ===== ADMIN NAVIGATION =====
  const adminNavItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/reports', icon: '📋', label: 'Reports' },
    { path: '/students', icon: '👥', label: 'Students' },
    { path: '/staff', icon: '👤', label: 'Staff' },
  ];

  // ===== SUPER ADMIN NAVIGATION (Adds Locations & Settings) =====
  const superAdminNavItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/reports', icon: '📋', label: 'Reports' },
    { path: '/students', icon: '👥', label: 'Students' },
    { path: '/staff', icon: '👤', label: 'Staff' },
    { path: '/locations', icon: '📍', label: 'Locations' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  // Choose navigation based on user role
  let navItems;
  if (user?.role === 'technician') {
    navItems = technicianNavItems;
  } else if (isSuperAdmin) {
    navItems = superAdminNavItems;
  } else {
    navItems = adminNavItems;
  }

  const getRoleDisplay = () => {
    if (user?.role === 'super_admin') return '⭐ Super Admin';
    if (user?.role === 'technician') return `🔧 ${user?.specialty || 'Technician'}`;
    return '🏛️ Hall Admin';
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">SF</div>
        <div>
          <div className="sidebar-logo-text">SnapFix</div>
          <div className="sidebar-logo-sub">Admin Panel</div>
        </div>
      </div>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user.name}</div>
          <div className="sidebar-user-role">{getRoleDisplay()}</div>
          <div className="sidebar-user-hall">{user.hallName || 'All Halls'}</div>
          {user.role === 'technician' && user.specialty && (
            <div className="sidebar-user-hall" style={{ color: '#3B82F6' }}>
              🛠️ {user.specialty} Specialist
            </div>
          )}
        </div>
      )}
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        {user?.role === 'technician' ? '🔧 Technician Portal' : '© 2024 SnapFix Admin'}
      </div>
    </aside>
  );
}