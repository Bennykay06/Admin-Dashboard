// src/components/Header.jsx - CLEAN TOP NAVBAR WITH TAILWIND
import React from 'react';
import { useLocation } from 'react-router-dom';

export default function Header({ user, setSidebarOpen, handleLogout, pageTitle }) {
  const location = useLocation();
  
  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    
    const path = location.pathname;
    switch(path) {
      case '/': return 'Dashboard';
      case '/students': return 'Student Directory';
      case '/staff': return 'Staff Management';
      case '/locations': return 'Campus Infrastructure';
      case '/settings': return 'System Settings';
      case '/news': return 'Announcements';
      default: return 'Dashboard';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().toUpperCase().split(/\s+/);
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return parts[0].slice(0, 2);
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white border-b border-surface-container-highest flex justify-between items-center px-8 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          className="md:hidden p-2 text-deep-charcoal hover:bg-surface-container rounded-lg"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-lg font-bold text-deep-charcoal uppercase tracking-wider">
          {getPageTitle()}
        </h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-deep-charcoal text-white flex items-center justify-center font-bold text-xs">
            {getInitials(user?.name)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-deep-charcoal leading-none mb-0.5">{user?.name || 'User'}</div>
            <div className="text-[9px] text-secondary uppercase tracking-wider font-semibold leading-none">
              {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'technician' ? 'Technician' : 'Hall Admin'}
            </div>
          </div>
        </div>
        <button 
          className="text-xs font-bold uppercase tracking-widest text-deep-charcoal hover:text-secondary transition-colors"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}