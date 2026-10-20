import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as api from '../lib/api.js';
export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = isLogin
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      signIn(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="mb-6 text-center"><Logo className="text-xl" /></div>
      <form onSubmit={submit} className="card space-y-4 p-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="text-sm text-slate-500">{isLogin ? 'Sign in to see your history.' : 'Save every analysis to your history.'}</p>
        </div>

        {!isLogin && <input className="input" placeholder="Full name" value={form.name} onChange={set('name')} required />}
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
        <input className="input" type="password" placeholder="Password (min 8 characters)" value={form.password} onChange={set('password')} required minLength={isLogin ? 1 : 8} />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button className="btn-primary w-full" disabled={loading}>
          {loading && <Loader2 size={16} className="animate-spin" />} {isLogin ? 'Sign in' : 'Create account'}
        </button>
        <p className="text-center text-sm text-slate-600">
          {isLogin ? <>New here? <Link to="/register" className="font-semibold text-brand-700">Create an account</Link></>
                   : <>Already have an account? <Link to="/login" className="font-semibold text-brand-700">Sign in</Link></>}
        </p>
      </form>
    </div>
  );
}