import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminByEmail } from '../data/mockData';

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const admin = getAdminByEmail(email);

    if (admin && admin.password === password) {
      localStorage.setItem('adminUser', JSON.stringify(admin));
      setUser(admin);
      
      if (admin.role === 'technician') {
        navigate('/technician');
      } else {
        navigate('/');
      }
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">SF</div>
          <h1>SnapFix Admin</h1>
          <p>Sign in to manage your hall reports</p>
        </div>

        <div className="login-demo">
          <p><strong>🔑 Demo Credentials:</strong></p>
          <div className="demo-grid">
            <div className="demo-item super-admin">
              <span>⭐ Super Admin:</span>
              <code>admin@snapfix.com / admin123</code>
            </div>
            <div className="demo-item">
              <span>🏛️ Unity Hall:</span>
              <code>unity@snapfix.com / unity123</code>
            </div>
            <div className="demo-item">
              <span>🏛️ Independence Hall:</span>
              <code>independence@snapfix.com / independence123</code>
            </div>
            <div className="demo-item">
              <span>🏛️ Republic Hall:</span>
              <code>republic@snapfix.com / republic123</code>
            </div>
            <div className="demo-item">
              <span>🏛️ Africa Hall:</span>
              <code>africa@snapfix.com / africa123</code>
            </div>
            <div className="demo-item">
              <span>🏛️ University Hall:</span>
              <code>universityhall@snapfix.com / university123</code>
            </div>
            <div className="demo-item">
              <span>🏛️ Queen Elizabeth II Hall:</span>
              <code>queenshall@snapfix.com / queenshall123</code>
            </div>
            <div className="demo-item technician">
              <span>⚡ Electrical Technician:</span>
              <code>kwaku@snapfix.com / kwaku123</code>
            </div>
            <div className="demo-item technician">
              <span>🔧 Plumbing Technician:</span>
              <code>osei@snapfix.com / osei123</code>
            </div>
            <div className="demo-item technician">
              <span>🪚 Carpentry Technician:</span>
              <code>abena@snapfix.com / abena123</code>
            </div>
            <div className="demo-item technician">
              <span>🧱 Masonry Technician:</span>
              <code>kofi@snapfix.com / kofi123</code>
            </div>
          </div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your admin email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-btn">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}