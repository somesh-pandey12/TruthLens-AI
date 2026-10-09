import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass = ({ isActive }) =>
  `text-sm ${isActive ? 'font-semibold text-white' : 'text-slate-300 hover:text-white'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link to="/" className="text-xl font-extrabold text-white hover:text-white">
          ✔ Verify<span className="text-brand">AI</span>
        </Link>
        <nav className="flex items-center gap-4">
          <NavLink to="/analyze" className={linkClass}>Analyze</NavLink>
          {user && <NavLink to="/history" className={linkClass}>History</NavLink>}
          {user ? (
            <>
              <span className="hidden text-sm text-muted sm:inline">Hi, {user.name.split(' ')[0]}</span>
              <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Login</NavLink>
              <Link to="/register" className="btn btn-primary hover:text-white">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}