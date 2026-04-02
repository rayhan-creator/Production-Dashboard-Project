// pages/LoginPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const DEMO_ACCOUNTS = [
  { username:'superadmin',    label:'Super Admin',   icon:'👑', color:'#FF6B6B' },
  { username:'admin_plant_a', label:'Administrator', icon:'🛡️', color:'#6C63FF' },
  { username:'approver_mgr',  label:'Approver',      icon:'✅', color:'#FFD93D' },
  { username:'pic_safety',    label:'PIC Staff',     icon:'📋', color:'#00C9A7' },
];

export default function LoginPage() {
  const { login, isAuthenticated, authError, clearAuthError } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { if (isAuthenticated) navigate('/dashboard', { replace:true }); }, [isAuthenticated, navigate]);
  useEffect(() => { clearAuthError(); }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    await login(username, password);
    setLoading(false);
  };

  const fillDemo = (acc) => { setUsername(acc.username); setPassword('password123'); clearAuthError(); };

  return (
    <div className="login-page">
      <div className="login-bg-grid"/>
      <div className="login-bg-glow top"/>
      <div className="login-bg-glow bottom"/>

      {/* Theme toggle di pojok kanan atas */}
      <button className="theme-toggle-corner" onClick={toggleTheme} title="Toggle tema">
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className="login-container">
        <div className="login-brand">
          <div className="login-logo">🏭</div>
          <h1 className="login-title">Production <span>Dashboard</span></h1>
          <p className="login-subtitle">PT. DENSO INDONESIA — PED Division</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" className="form-input" placeholder="Masukkan username"
              value={username} onChange={e => setUsername(e.target.value)}
              autoComplete="username" autoFocus/>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrap">
              <input type={showPass ? 'text' : 'password'} className="form-input"
                placeholder="Masukkan password" value={password}
                onChange={e => setPassword(e.target.value)} autoComplete="current-password"/>
              <button type="button" className="toggle-pass" onClick={() => setShowPass(p => !p)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {authError && <div className="login-error"><span>⚠️</span> {authError}</div>}
          <button type="submit" className="btn-login" disabled={loading || !username || !password}>
            {loading ? <span className="btn-spinner"/> : '→'}
            {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
          </button>
        </form>

        <div className="demo-section">
          <p className="demo-label">Quick Login — Demo Accounts (pw: password123)</p>
          <div className="demo-grid">
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.username} className="demo-btn" onClick={() => fillDemo(acc)}
                style={{ '--demo-color': acc.color }}>
                <span>{acc.icon}</span><span>{acc.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* <p className="login-note">
          💡 Backend: <code>cd backend && npm run dev</code><br/>
          pastikan jalan di <code>localhost:5000</code>
        </p> */}
      </div>
    </div>
  );
}
