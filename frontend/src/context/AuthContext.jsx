// context/AuthContext.jsx — Global auth state
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

// URL backend — pakai env var kalau ada, fallback ke localhost dev
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ROLE_CONFIG = {
  super_admin:   { label: 'Super Admin',   color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)', icon: '👑' },
  administrator: { label: 'Administrator', color: '#6C63FF', bg: 'rgba(108,99,255,0.12)',  icon: '🛡️' },
  approver:      { label: 'Approver',      color: '#FFD93D', bg: 'rgba(255,217,61,0.12)',  icon: '✅' },
  pic_staff:     { label: 'PIC Staff',     color: '#00C9A7', bg: 'rgba(0,201,167,0.12)',   icon: '📋' },
};

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [token,     setToken]     = useState(() => localStorage.getItem('denso_token'));
  const [loading,   setLoading]   = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const saved = localStorage.getItem('denso_token');
      if (!saved) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${saved}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(saved);
        } else {
          localStorage.removeItem('denso_token');
          setToken(null);
        }
      } catch {
        // Backend offline — keep token, user tetap bisa lihat UI
        console.warn('[Auth] Backend unreachable');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (username, password) => {
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.message || 'Login gagal.');
        return { success: false, message: data.message };
      }
      localStorage.setItem('denso_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch {
      const msg = 'Tidak bisa konek ke server. Pastikan backend berjalan di port 5000.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
    localStorage.removeItem('denso_token');
    setToken(null);
    setUser(null);
  }, [token]);

  const hasPermission  = useCallback((p) => user?.permissions?.includes(p) || false, [user]);
  const canAccessPlant = useCallback((plant) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.bu_access?.includes(plant) || false;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, token, loading, authError,
      isAuthenticated: !!user,
      login, logout,
      hasPermission, canAccessPlant,
      clearAuthError: () => setAuthError(null),
      roleConfig: user ? ROLE_CONFIG[user.role] : null,
      apiBase: API_BASE,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus di dalam AuthProvider');
  return ctx;
}
