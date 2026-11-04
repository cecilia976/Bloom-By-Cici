import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import Logo from '../components/Logo';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;

    void supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) throw sessionError;
        if (active && data.session) navigate('/admin');
      })
      .catch(() => {
        if (active) setError('We could not check your staff session. Please refresh and try again.');
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Admin login is not configured. Connect this website to Supabase first.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError('Those details did not match an authorized staff account.');
        return;
      }
      navigate('/admin');
    } catch {
      setError('We could not sign in right now. Check the Supabase connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Logo />
        <Link to="/" className="back-link"><ArrowLeft size={15} /> Back to storefront</Link>
      </div>
      <div className="auth-card">
        <span className="eyebrow"><LockKeyhole size={14} /> Staff area</span>
        <h1>Welcome back.</h1>
        <p>Sign in to care for the collection and customer requests.</p>
        {!isSupabaseConfigured && (
          <p className="form-error" role="alert">
            Admin access is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then create an administrator account in Supabase.
          </p>
        )}
        <form onSubmit={submit}>
          <label>
            Account email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" disabled={!isSupabaseConfigured} />
          </label>
          <label>
            Password
            <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" disabled={!isSupabaseConfigured} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark button-full" disabled={loading || !isSupabaseConfigured}>
            {loading ? 'Checking…' : 'Sign in'}
          </button>
        </form>
        <small className="auth-footnote">Staff access is managed securely through the store account.</small>
      </div>
    </div>
  );
}
