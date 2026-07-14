// src/components/Layout.jsx - TAILWIND BASED WRAPPER
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, user, handleLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FBFBFB] text-on-surface flex">
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-45 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar sidebarOpen={sidebarOpen} user={user} />
      
      <div className="flex-1 md:pl-64 flex flex-col h-full overflow-hidden">
        <Header 
          user={user}
          setSidebarOpen={setSidebarOpen}
          handleLogout={handleLogout}
        />
        <main className="flex-1 pt-16 overflow-y-auto bg-[#FBFBFB]" style={{ scrollBehavior: 'smooth' }}>
          <div className="p-6 md:p-10 max-w-container-max mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}