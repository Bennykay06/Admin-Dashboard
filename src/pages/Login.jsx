import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminByEmail } from '../data/mockData';
import '../styles/Login.css';

export default function Login({ setUser }) {
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' or 'tech'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Password reset flow states
  const [resetFlow, setResetFlow] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'true' && params.get('token')) {
      try {
        const decoded = JSON.parse(atob(params.get('token')));
        if (decoded.email && decoded.expiresAt) {
          if (Date.now() > decoded.expiresAt) {
            setResetError('This password reset link has expired (links are only valid for 30 minutes). Please contact your administrator.');
            setResetFlow(true);
          } else {
            setResetEmail(decoded.email);
            setResetFlow(true);
          }
        }
      } catch (e) {
        setResetError('Invalid or corrupted password reset link.');
        setResetFlow(true);
      }
    }
  }, []);

  const handleResetPassword = (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (resetNewPassword.length < 4) {
      setResetError('Password must be at least 4 characters long.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    const rawAdmins = localStorage.getItem('snapfix_admins');
    if (rawAdmins) {
      try {
        const adminsList = JSON.parse(rawAdmins);
        const adminIndex = adminsList.findIndex(a => a.email.toLowerCase() === resetEmail.toLowerCase());
        
        if (adminIndex !== -1) {
          adminsList[adminIndex].password = resetNewPassword;
          localStorage.setItem('snapfix_admins', JSON.stringify(adminsList));
          
          setResetSuccess('Password has been reset successfully! Redirecting to login...');
          
          const role = adminsList[adminIndex].role;
          
          setTimeout(() => {
            setResetFlow(false);
            setActiveTab(role === 'technician' ? 'tech' : 'staff');
            setEmail(resetEmail);
            setPassword(resetNewPassword);
            navigate('/login', { replace: true });
            setResetNewPassword('');
            setResetConfirmPassword('');
            setResetSuccess('');
          }, 2000);
        } else {
          setResetError('User account not found.');
        }
      } catch (err) {
        setResetError('An error occurred while resetting the password.');
      }
    } else {
      setResetError('Account data not found.');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const admin = getAdminByEmail(email);

    if (admin && admin.password === password) {
      // Validate role compatibility with selected tab
      if (activeTab === 'tech' && admin.role !== 'technician') {
        setError('Please use the Hall Admin tab to sign in with an Administrator account.');
        return;
      }
      if (activeTab === 'staff' && admin.role === 'technician') {
        setError('Please use the Technician tab to sign in with a Technician account.');
        return;
      }

      localStorage.setItem('adminUser', JSON.stringify(admin));
      setUser(admin);
      navigate('/');
    } else {
      setError('Invalid email or password. Please check your credentials.');
    }
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError('');
    setEmail('');
    setPassword('');
  };

  return (
    <main className="flex min-h-screen w-full flex-col md:flex-row font-body-md text-on-surface bg-white">
      {/* Left Panel: Monochromatic Branding */}
      <section className="relative hidden md:flex md:w-1/2 items-center justify-center bg-black overflow-hidden p-12">
        <div className="relative z-20 text-center max-w-xl">
          <div className="mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full border border-white/20 text-white font-label-md text-xs mb-4">
              Institutional Portal
            </span>
            <h1 className="font-headline-xl text-headline-xl text-white tracking-tighter uppercase mb-4 text-4xl font-extrabold">
              KNUST <br/> <span className="font-normal opacity-60">Campus</span>
            </h1>
            <p className="font-body-lg text-white opacity-70 leading-relaxed max-w-md mx-auto text-sm">
              A unified gateway for facility management and institutional operations.
            </p>
          </div>
          
          {/* Monochromatic Live Updates Widget */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left flex items-start gap-4 backdrop-blur-md">
            <div className="bg-white text-black p-3 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            </div>
            <div>
              <h3 className="font-headline-md text-white mb-1 font-semibold text-lg">Live Updates</h3>
              <p className="text-sm text-white opacity-70">
                <span className="font-bold">42</span> active work orders across <span className="font-bold">12</span> halls.
              </p>
              <div className="mt-3 flex gap-1">
                <div className="h-1 w-12 bg-white rounded-full"></div>
                <div className="h-1 w-6 bg-white/20 rounded-full"></div>
                <div className="h-1 w-6 bg-white/20 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="absolute bottom-8 left-8 right-8 flex justify-between z-20 text-white/40 font-label-sm text-xs">
          <span>© 2026 KNUST Management</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> Systems Online
          </span>
        </div>
      </section>

      {/* Right Panel: Access Form */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:px-12 relative bg-[#FBFBFB]">
        {/* Mobile Header */}
        <div className="md:hidden text-center mb-8">
          <h2 className="text-2xl font-bold text-black uppercase tracking-tight">KNUST Campus</h2>
          <p className="text-black/50 text-xs font-semibold uppercase tracking-wider">Facility Management Access</p>
        </div>

        <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-lg border border-outline-variant/60" id="login-card">
          {resetFlow ? (
            <div className="w-full">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-black mb-1">Reset Your Password</h2>
                <p className="text-xs text-black/60">
                  {resetEmail ? `Please set a new secure password for ${resetEmail}` : 'Reset link has expired or is invalid.'}
                </p>
              </div>

              {resetError && (
                <div className="p-3 bg-status-critical/10 border border-status-critical text-status-critical text-xs font-bold rounded-lg mb-4 text-center">
                  {resetError}
                </div>
              )}
              {resetSuccess && (
                <div className="p-3 bg-status-success/10 border border-status-success text-status-success text-xs font-bold rounded-lg mb-4 text-center">
                  {resetSuccess}
                </div>
              )}

              {resetEmail ? (
                <form className="space-y-4" onSubmit={handleResetPassword}>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-black/60 block ml-0.5" htmlFor="resetNewPassword">New Password</label>
                    <div className="relative group">
                      <input 
                        className="w-full pl-4 pr-4 py-2 bg-surface-container-low border border-outline-variant focus:border-black focus:bg-white rounded-lg outline-none transition-all text-sm font-medium"
                        id="resetNewPassword"
                        type="password"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Minimum 4 characters"
                        required
                        disabled={!!resetSuccess}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-black/60 block ml-0.5" htmlFor="resetConfirmPassword">Confirm Password</label>
                    <div className="relative group">
                      <input 
                        className="w-full pl-4 pr-4 py-2 bg-surface-container-low border border-outline-variant focus:border-black focus:bg-white rounded-lg outline-none transition-all text-sm font-medium"
                        id="resetConfirmPassword"
                        type="password"
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        disabled={!!resetSuccess}
                      />
                    </div>
                  </div>

                  <button 
                    className="w-full py-3 bg-black hover:bg-neutral-900 text-white rounded-lg font-bold text-sm transition-all shadow-sm mt-6"
                    type="submit" 
                    disabled={!!resetSuccess}
                  >
                    Save Password
                  </button>

                  <button 
                    className="w-full text-center text-xs font-bold text-secondary hover:text-black transition-colors py-2 block"
                    type="button" 
                    onClick={() => {
                      setResetFlow(false);
                      navigate('/login', { replace: true });
                    }}
                  >
                    Cancel & Back to Login
                  </button>
                </form>
              ) : (
                <button 
                  className="w-full py-3 bg-black hover:bg-neutral-900 text-white rounded-lg font-bold text-sm transition-all shadow-sm"
                  type="button" 
                  onClick={() => {
                    setResetFlow(false);
                    navigate('/login', { replace: true });
                  }}
                >
                  Back to Login
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-black mb-1">Portal Access</h2>
                <p className="text-xs text-black/60">Select your institutional role to continue.</p>
              </div>

              {/* Segmented Tab */}
              <div className="flex p-1 bg-surface-container rounded-lg mb-6">
                <button 
                  type="button"
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold text-xs transition-all duration-200 ${
                    activeTab === 'staff' 
                      ? 'bg-white shadow-sm text-black' 
                      : 'text-secondary hover:text-black'
                  }`}
                  onClick={() => handleTabSwitch('staff')}
                >
                  Hall Admin
                </button>
                <button 
                  type="button"
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold text-xs transition-all duration-200 ${
                    activeTab === 'tech' 
                      ? 'bg-white shadow-sm text-black' 
                      : 'text-secondary hover:text-black'
                  }`}
                  onClick={() => handleTabSwitch('tech')}
                >
                  Technician
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-status-critical/10 border border-status-critical text-status-critical text-xs font-bold rounded-lg mb-4 text-center">
                  {error}
                </div>
              )}

              {/* Form */}
              <form className="space-y-4" onSubmit={handleLogin}>
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-black/60 block ml-0.5" htmlFor="email"> Email</label>
                  <div className="relative group">
                    <input 
                      className="w-full pl-4 pr-4 py-2.5 bg-surface-container-low border border-outline-variant focus:border-black focus:bg-white rounded-lg outline-none transition-all text-sm font-medium"
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-0.5">
                    <label className="text-xs font-bold text-black/60 block" htmlFor="password">Password</label>
                    <a className="text-[10px] font-bold text-secondary hover:text-black transition-colors" href="#forgot" onClick={(e) => e.preventDefault()}>Forgot Password?</a>
                  </div>
                  <div className="relative group">
                    <input 
                      className="w-full pl-4 pr-12 py-2.5 bg-surface-container-low border border-outline-variant focus:border-black focus:bg-white rounded-lg outline-none transition-all text-sm font-medium"
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors flex items-center"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    className="rounded border-outline-variant focus:ring-0 text-black w-4 h-4 cursor-pointer"
                    id="remember"
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                  />
                  <label className="text-xs font-semibold text-secondary cursor-pointer select-none" htmlFor="remember">
                    Remember device for 30 days
                  </label>
                </div>

                {/* Login Button */}
                <button 
                  className="w-full py-3 bg-black hover:bg-neutral-900 text-white rounded-lg font-bold text-sm transition-all shadow-sm mt-6"
                  type="submit"
                >
                  Login to Portal
                </button>
              </form>
            </>
          )}

          {/* Footer */}
          <footer className="mt-8 pt-6 border-t border-outline-variant/60 text-center">
            <div className="flex justify-center gap-3 text-[10px] font-bold text-secondary tracking-wider uppercase mb-3">
              <a className="hover:text-black transition-colors" href="#help" onClick={(e) => e.preventDefault()}>Help</a>
              <span>•</span>
              <a className="hover:text-black transition-colors" href="#safety" onClick={(e) => e.preventDefault()}>Safety</a>
              <span>•</span>
              <a className="hover:text-black transition-colors" href="#privacy" onClick={(e) => e.preventDefault()}>Privacy</a>
            </div>
            <p className="text-[10px] text-secondary/60">
              © 2026 KNUST Campus Facilities Admin
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}