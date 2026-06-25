// src/components/Header.jsx - WITH TECHNICIAN SUPPORT
import React from 'react';
import { useLocation } from 'react-router-dom';

export default function Header({ user, setSidebarOpen, handleLogout, pageTitle }) {
  const location = useLocation();
  
  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    
    const path = location.pathname;
    switch(path) {
      case '/': return 'Dashboard';
      case '/reports': return 'Reports Management';
      case '/students': return 'Students Management';
      case '/staff': return 'Staff Management';
      case '/locations': return 'Locations Management';
      case '/settings': return 'Settings';
      case '/technician': return 'Technician Dashboard';
      default: return 'Dashboard';
    }
  };

  // Get role badge
  const getRoleBadge = () => {
    if (user?.role === 'super_admin') return '⭐ Super Admin';
    if (user?.role === 'technician') return '🔧 Technician';
    return '🏛️ Hall Admin';
  };

  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="header-menu-btn"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>
        <h1 className="header-title">{getPageTitle()}</h1>
      </div>
      
      <div className="header-right">
        <div className="header-profile">
          <div className="header-avatar">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <div className="header-name">{user?.name || 'Admin'}</div>
            <div className="header-role">{getRoleBadge()}</div>
          </div>
        </div>
        <button 
          className="header-logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}