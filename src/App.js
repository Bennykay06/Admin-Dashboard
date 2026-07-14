// src/App.js - PROTECT LOCATIONS ROUTE
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Staff from './pages/Staff';
import Locations from './pages/Locations';
import Settings from './pages/Settings';
import TechnicianDashboard from './pages/TechnicianDashboard';
import News from './pages/News';
import ScheduleAppointment from './pages/ScheduleAppointment';
import UpdateReport from './pages/UpdateReport';

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
      return <Navigate to="/login" />;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        
        {/* Admin/Technician Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'hall_admin', 'technician']}>
              <Layout user={user} handleLogout={handleLogout}>
                {user?.role === 'technician' ? (
                  <TechnicianDashboard user={user} />
                ) : (
                  <Dashboard user={user} />
                )}
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* NEWS ROUTE - All Logged In Roles */}
        <Route 
          path="/news" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'hall_admin', 'technician']}>
              <Layout user={user} handleLogout={handleLogout}>
                <News user={user} />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* SCHEDULE APPOINTMENT ROUTE - Technician Role */}
        <Route 
          path="/schedule-appointment" 
          element={
            <ProtectedRoute allowedRoles={['technician']}>
              <Layout user={user} handleLogout={handleLogout}>
                <ScheduleAppointment user={user} />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* UPDATE REPORT ROUTE - Technician Role */}
        <Route 
          path="/update-report" 
          element={
            <ProtectedRoute allowedRoles={['technician']}>
              <Layout user={user} handleLogout={handleLogout}>
                <UpdateReport user={user} />
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
        
        {/* SETTINGS - All Logged In Roles */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'hall_admin', 'technician']}>
              <Layout user={user} handleLogout={handleLogout}>
                <Settings user={user} setUser={setUser} />
              </Layout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;