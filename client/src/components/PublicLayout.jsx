import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

export default function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-8">
          <Link to="/" aria-label="TruthLens home"><Logo /></Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link to="/analyze" className="hidden px-2 text-sm font-medium text-slate-600 hover:text-slate-900 sm:inline">Try it</Link>
            <Link to="/login" className="px-2 text-sm font-medium text-slate-600 hover:text-slate-900">Sign in</Link>
            <Link to="/register" className="btn btn-primary">Create account</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:px-8">
          <span>© {new Date().getFullYear()} TruthLens</span>
          <span>Automated assessments can be wrong. Always verify with primary sources.</span>
        </div>
      </footer>
    </div>
  );
}