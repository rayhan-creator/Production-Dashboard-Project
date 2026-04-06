// context/AuthContext.jsx — Auth via Supabase (no backend)
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase, getProfile, PERMISSIONS, ROLE_CONFIG } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);    // profile dari DB
  const [session,   setSession]   = useState(null);    // Supabase session
  const [loading,   setLoading]   = useState(true);
  const [authError, setAuthError] = useState(null);

  // ── Load session saat app start ──
  useEffect(() => {
    // Cek session yang tersimpan
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

    // Listen perubahan auth state (login/logout/token refresh)
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

  // ── Login dengan email (format: username@denso.local) ──
  // Demo accounts: superadmin@denso.local, admin_plant_a@denso.local, dll
  const login = useCallback(async (username, password) => {
    setAuthError(null);
    try {
      // Konversi username → email format Supabase
      const email = username.includes('@') ? username : `${username.trim().toLowerCase()}@denso.local`;

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message === 'Invalid login credentials'
          ? 'Username atau password salah.'
          : error.message;
        setAuthError(msg);
        return { success: false, message: msg };
      }
      return { success: true };
    } catch (err) {
      const msg = 'Terjadi kesalahan. Coba lagi.';
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
