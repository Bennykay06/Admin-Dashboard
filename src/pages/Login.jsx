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
      navigate('/');
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
          </div>
          <p style={{ marginTop: '12px', fontSize: '12px', color: '#6B7280', lineHeight: '1.5' }}>
            🏛️ Hall admin accounts are created by the Super Admin under Staff Management. Use the credentials generated there to sign in.
          </p>
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