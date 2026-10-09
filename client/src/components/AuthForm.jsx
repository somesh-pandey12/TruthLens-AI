import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login, register, errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const payload = isRegister ? form : { email: form.email, password: form.password };
      const { data } = await (isRegister ? register(payload) : login(payload));
      loginSuccess(data.token, data.user);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="mb-8" aria-label="TruthLens home"><Logo size={32} /></Link>
      <form className="card w-full max-w-sm p-7" onSubmit={submit}>
        <h1 className="text-xl font-semibold text-slate-900">{isRegister ? 'Create your account' : 'Sign in to TruthLens'}</h1>
        <p className="mt-1 text-sm text-slate-500">{isRegister ? 'Save your analyses and track them over time.' : 'Welcome back.'}</p>

        <div className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" className="input" value={form.name} onChange={set('name')} required minLength={2} autoComplete="name" />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="input" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" className="input" type="password" value={form.password} onChange={set('password')} required
                   minLength={isRegister ? 8 : 1} autoComplete={isRegister ? 'new-password' : 'current-password'} />
            {isRegister && <p className="mt-1.5 text-xs text-slate-500">At least 8 characters.</p>}
          </div>
        </div>

        {error && <p className="alert-error mt-4">{error}</p>}
        <button className="btn btn-primary mt-6 w-full py-2.5" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-500">
        {isRegister ? <>Already registered? <Link to="/login" className="link">Sign in</Link></>
                    : <>New to TruthLens? <Link to="/register" className="link">Create an account</Link></>}
      </p>
    </div>
  );
}