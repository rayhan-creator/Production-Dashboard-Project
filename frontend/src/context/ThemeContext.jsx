// ============================================================
// context/ThemeContext.jsx
// ============================================================
// Global dark/light mode toggle.
// Disimpan ke localStorage supaya tetap ingat pilihan user.
// ============================================================
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Ambil dari localStorage, fallback ke dark (default Denso dashboard)
    return localStorage.getItem('denso_theme') || 'dark';
  });

  useEffect(() => {
    // Set attribute ke <html> — CSS bisa pakai :root[data-theme="light"]
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('denso_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme harus dipakai di dalam ThemeProvider');
  return ctx;
}
