import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import PublicLayout from './components/PublicLayout.jsx';
import Landing from './pages/Landing.jsx';
import Analyze from './pages/Analyze.jsx';
import Dashboard from './pages/Dashboard.jsx';
import History from './pages/History.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

const Splash = () => (
  <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading…</div>
);

function Shell({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? <AppLayout>{children}</AppLayout> : <PublicLayout>{children}</PublicLayout>;
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <AppLayout>{children}</AppLayout>;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GuestOnly><PublicLayout><Landing /></PublicLayout></GuestOnly>} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/analyze" element={<Shell><Analyze /></Shell>} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
      <Route path="*" element={<Shell><div className="card p-10 text-center"><h1 className="text-xl font-semibold">Page not found</h1></div></Shell>} />
    </Routes>
  );
}