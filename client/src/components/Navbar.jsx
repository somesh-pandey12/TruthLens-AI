import { Link, NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const link = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`;

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/"><Logo className="text-lg text-slate-900" /></Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/" end className={link}>Analyze</NavLink>
            {user && <NavLink to="/history" className={link}>History</NavLink>}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:block">Hi, {user.name.split(' ')[0]}</span>
              <button onClick={logout} className="btn-ghost !px-3 !py-2" title="Sign out">
                <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900">Sign in</Link>
              <Link to="/register" className="btn-primary !py-2">Create account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}