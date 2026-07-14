// src/components/Sidebar.jsx - MINIMALIST NAV WITH MATERIAL SYMBOLS
import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ sidebarOpen, user }) {
  const isSuperAdmin = user?.role === 'super_admin';
  const isTechnician = user?.role === 'technician';

  // ===== NAVIGATION ITEMS =====
  let navItems = [];
  if (isTechnician) {
    navItems = [
      { path: '/', icon: 'dashboard', label: 'Dashboard' },
      { path: '/schedule-appointment', icon: 'handshake', label: 'Schedule Appointment' },
      { path: '/update-report', icon: 'build_circle', label: 'Update Report' },
      { path: '/news', icon: 'campaign', label: 'Announcements' },
      { path: '/settings', icon: 'settings_suggest', label: 'System Settings' },
    ];
  } else if (isSuperAdmin) {
    navItems = [
      { path: '/', icon: 'dashboard', label: 'Dashboard' },
      { path: '/locations', icon: 'domain', label: 'Campus Infrastructure' },
      { path: '/news', icon: 'campaign', label: 'Announcements' },
      { path: '/staff', icon: 'badge', label: 'Staff Management' },
      { path: '/students', icon: 'group', label: 'Student Directory' },
      { path: '/settings', icon: 'settings_suggest', label: 'System Settings' },
    ];
  } else {
    // Hall Admin
    navItems = [
      { path: '/', icon: 'dashboard', label: 'Dashboard' },
      { path: '/news', icon: 'campaign', label: 'Announcements' },
      { path: '/staff', icon: 'badge', label: 'Staff Management' },
      { path: '/students', icon: 'group', label: 'Student Directory' },
      { path: '/settings', icon: 'settings_suggest', label: 'System Settings' },
    ];
  }

  const getRoleDisplay = () => {
    if (user?.role === 'super_admin') return 'Super Admin';
    if (user?.role === 'technician') return `${user?.specialty || 'Technician'} Specialist`;
    return 'Hall Admin';
  };

  return (
    <aside className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-surface-container-highest flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-deep-charcoal flex items-center justify-center rounded-xl shadow-sm">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none text-deep-charcoal">SnapFix</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary mt-1">{getRoleDisplay()}</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-body-md text-sm font-medium ${
                  isActive
                    ? 'bg-deep-charcoal text-white shadow-md shadow-black/10'
                    : 'text-secondary hover:bg-surface-container-low hover:text-deep-charcoal'
                }`
              }
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-surface-container-highest">
        <div className="flex items-center gap-3 mb-2 text-secondary">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-deep-charcoal truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-secondary truncate">{user?.email || 'user@snapfix.com'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}