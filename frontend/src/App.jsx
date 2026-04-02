// App.jsx — Router + Auth Guard
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { LoadingSpinner } from './components/ui/index.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'var(--bg-base)' }}>
      <LoadingSpinner size="lg" text="Memuat aplikasi..."/>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace/>;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace/>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"     element={<PublicRoute><LoginPage/></PublicRoute>}/>
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
      <Route path="/"          element={<Navigate to="/dashboard" replace/>}/>
      <Route path="*"          element={<Navigate to="/dashboard" replace/>}/>
    </Routes>
  );
}
