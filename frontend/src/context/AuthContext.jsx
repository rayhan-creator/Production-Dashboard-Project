// context/AuthContext.jsx — Auth via Supabase (no backend)
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
// ✅ FIX: path yang benar adalah '../lib/supabase.js' bukan '../frontend/src/supabase.js'
import { supabase, getProfile, PERMISSIONS, ROLE_CONFIG } from '../supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [session,   setSession]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [authError, setAuthError] = useState(null);

  // ── Load session saat app start ──
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        try {
          const profile = await getProfile(session.user.id);
          setUser({ ...profile, permissions: PERMISSIONS[profile.role] || [] });
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        try {
          const profile = await getProfile(session.user.id);
          setUser({ ...profile, permissions: PERMISSIONS[profile.role] || [] });
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Login ──
  // Username dikonversi ke format email: superadmin → superadmin@denso.local
  const login = useCallback(async (username, password) => {
    setAuthError(null);
    try {
      const email = username.includes('@')
        ? username
        : `${username.trim().toLowerCase()}@denso.local`;

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // ✅ FIX: pesan error yang jelas, tidak ada mention "backend" atau "port 5000"
        const msg = error.message === 'Invalid login credentials'
          ? 'Username atau password salah. Pastikan SQL schema sudah dijalankan di Supabase.'
          : error.message === 'Email not confirmed'
          ? 'Email belum dikonfirmasi. Cek Supabase → Authentication → Users.'
          : error.message;
        setAuthError(msg);
        return { success: false, message: msg };
      }
      return { success: true };
    } catch (err) {
      // ✅ FIX: error yang relevan, bukan "konek ke port 5000"
      const msg = 'Gagal konek ke Supabase. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  }, []);

  // ── Logout ──
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const hasPermission  = useCallback((p) => user?.permissions?.includes(p) || false, [user]);
  const canAccessPlant = useCallback((plant) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.bu_access?.includes(plant) || false;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, session, loading, authError,
      isAuthenticated: !!user,
      login, logout,
      hasPermission, canAccessPlant,
      clearAuthError: () => setAuthError(null),
      roleConfig: user ? ROLE_CONFIG[user.role] : null,
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
