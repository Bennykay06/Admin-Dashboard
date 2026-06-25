// src/components/Layout.jsx - WITH TECHNICIAN SUPPORT
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, user, handleLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get page title based on role and path
  const getPageTitle = () => {
    if (user?.role === 'technician') {
      return 'Technician Dashboard';
    }
    return 'Admin Dashboard';
  };

  return (
    <div className="app-container">
      {/* Sidebar Overlay (Mobile) */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        style={{
          display: sidebarOpen ? 'block' : 'none',
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999
        }}
      />
      
      <Sidebar sidebarOpen={sidebarOpen} user={user} />
      
      <div className="main-content">
        <Header 
          user={user}
          setSidebarOpen={setSidebarOpen}
          handleLogout={handleLogout}
          pageTitle={getPageTitle()}
        />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}