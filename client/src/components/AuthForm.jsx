import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login, register, errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

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
      navigate(location.state?.from || '/analyze', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex justify-center pt-8">
      <form className="card w-full max-w-sm" onSubmit={submit}>
        <h2 className="text-2xl font-bold">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
        {isRegister && (
          <label className="mt-4 block text-sm">Name
            <input className="input" value={form.name} onChange={set('name')} required minLength={2} autoComplete="name" />
          </label>
        )}
        <label className="mt-4 block text-sm">Email
          <input className="input" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        </label>
        <label className="mt-4 block text-sm">Password
          <input className="input" type="password" value={form.password} onChange={set('password')} required
                 minLength={isRegister ? 8 : 1} autoComplete={isRegister ? 'new-password' : 'current-password'} />
        </label>
        {error && <p className="error-box">{error}</p>}
        <button className="btn btn-primary mt-5 w-full py-3" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Sign up' : 'Login'}
        </button>
        <p className="mt-4 text-center text-sm text-muted">
          {isRegister ? <>Already have an account? <Link to="/login">Login</Link></>
                      : <>New here? <Link to="/register">Create an account</Link></>}
        </p>
      </form>
    </div>
  );
}