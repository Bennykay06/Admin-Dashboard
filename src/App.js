// src/App.js - PROTECT LOCATIONS ROUTE
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';
import supabase from './lib/supabase';
import { hydrate, startRealtime, stopRealtime, clearCache } from './data/store';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Staff from './pages/Staff';
import Locations from './pages/Locations';
import Settings from './pages/Settings';
import News from './pages/News';
import ScheduleAppointment from './pages/ScheduleAppointment';

/**
 * Builds the `user` object the pages expect from the signed-in account's
 * profile row. The role comes from the database, not from anything the
 * browser stored, so it cannot be edited in devtools to unlock a route.
 */
const loadSessionUser = async (session) => {
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, hall_id, specialty, halls(name)')
    .eq('id', session.user.id)
    .single();

  if (error || !data) {
    console.error('[App] could not load profile for session:', error?.message);
    return null;
  }

  // Students have no dashboard; they use the mobile app.
  if (data.role === 'student') return null;

  return {
    id: data.id,
    name: data.full_name || data.email,
    email: data.email,
    role: data.role,
    hallId: data.hall_id,
    hallName: data.halls?.name || 'All Halls',
    specialty: data.specialty,
  };
};

function App() {
  const [user, setUser] = useState(null);
  // Restoring the session is asynchronous. Without this the protected
  // routes would see user === null on the first render and bounce a
  // signed-in admin to /login on every refresh.
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applySession = async (session) => {
      const nextUser = await loadSessionUser(session);
      if (cancelled) return;

      setUser(nextUser);

      if (nextUser) {
        try {
          await hydrate();
          startRealtime();
        } catch (e) {
          console.error('[App] initial data load failed:', e.message);
        }
      } else {
        stopRealtime();
        clearCache();
      }

      if (!cancelled) setRestoring(false);
    };

    supabase.auth.getSession().then(({ data }) => applySession(data.session));

    // Fires on sign in, sign out, and token refresh — including in another
    // tab, so signing out once signs out everywhere.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return; // same user, nothing to reload
      applySession(session);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
      stopRealtime();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange clears the cache and the user.
    localStorage.removeItem('adminUser'); // drop the pre-Supabase leftover
  };

  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (restoring) {
      return <div className="app-loading">Loading…</div>;
    }
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

        {/* NEWS ROUTE - All Logged In Roles */}
        <Route
          path="/news"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'hall_admin']}>
              <Layout user={user} handleLogout={handleLogout}>
                <News user={user} />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* APPOINTMENT SCHEDULE ROUTE - Hall Admin + Super Admin */}
        <Route
          path="/schedule-appointment"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'hall_admin']}>
              <Layout user={user} handleLogout={handleLogout}>
                <ScheduleAppointment user={user} />
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

        {/* STAFF - Only Super Admin (hall admins are the only staff role left
            to manage, and only a super admin creates those) */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
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
            <ProtectedRoute allowedRoles={['super_admin', 'hall_admin']}>
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
