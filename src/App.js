// src/App.js - PROTECT LOCATIONS ROUTE
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Students from './pages/Students';
import Staff from './pages/Staff';
import Locations from './pages/Locations';
import Settings from './pages/Settings';
import TechnicianDashboard from './pages/TechnicianDashboard';
import TechLogin from './pages/TechLogin';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('adminUser');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    setUser(null);
  };

  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (!user) {
      if (allowedRoles.includes('technician')) {
        return <Navigate to="/tech-login" />;
      }
      return <Navigate to="/login" />;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      if (user.role === 'technician') return <Navigate to="/technician" />;
      return <Navigate to="/" />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/tech-login" element={<TechLogin setUser={setUser} />} />
        
        {/* Technician Route */}
        <Route 
          path="/technician" 
          element={
            <ProtectedRoute allowedRoles={['technician']}>
              <Layout user={user} handleLogout={handleLogout}>
                <TechnicianDashboard user={user} />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'hall_admin']}>
              <Layout user={user} handleLogout={handleLogout}>
                <Dashboard user={user} />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'hall_admin']}>
              <Layout user={user} handleLogout={handleLogout}>
                <Reports user={user} />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/students" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'hall_admin']}>
              <Layout user={user} handleLogout={handleLogout}>
                <Students user={user} />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/staff" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'hall_admin']}>
              <Layout user={user} handleLogout={handleLogout}>
                <Staff user={user} />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* LOCATIONS - Only Super Admin */}
        <Route 
          path="/locations" 
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout user={user} handleLogout={handleLogout}>
                <Locations user={user} />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* SETTINGS - Only Super Admin */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout user={user} handleLogout={handleLogout}>
                <Settings user={user} />
              </Layout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;