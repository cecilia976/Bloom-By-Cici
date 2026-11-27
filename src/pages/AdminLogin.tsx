import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import Logo from '../components/Logo';
import { isAuthorizedAdmin } from '../lib/auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;

    void (async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) return;

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (isAuthorizedAdmin(userData.user)) {
          if (active) navigate('/admin');
          return;
        }

        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        if (active) setError('This account is not authorized to manage the website.');
      } catch {
        if (active) setError('We could not verify administrator access. Please refresh and try again.');
      }
    })();

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
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        setError('Those details did not match the authorized administrator account.');
        return;
      }
      if (!data.user || !isAuthorizedAdmin(data.user)) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        setError('Those details did not match the authorized administrator account.');
        return;
      }
      navigate('/admin');
    } catch {
      setError('We could not sign in or verify administrator access. Check the Supabase connection and try again.');
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
        <span className="eyebrow"><LockKeyhole size={14} /> Administrator access</span>
        <h1>Welcome back.</h1>
        <p>Sign in to manage products, images, and customer reviews.</p>
        {!isSupabaseConfigured && (
          <p className="form-error" role="alert">
            Admin access is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY), then create an administrator account in Supabase.
          </p>
        )}
        <form onSubmit={submit}>
          <label>
            Account email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" disabled={!isSupabaseConfigured} />
          </label>
          <label>
            Password
            <span className="auth-password-field">
              <input required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" disabled={!isSupabaseConfigured} />
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark button-full" disabled={loading || !isSupabaseConfigured}>
            {loading ? 'Checking…' : 'Sign in'}
          </button>
        </form>
        <small className="auth-footnote">Administrator access is managed through Supabase. Registration is disabled.</small>
      </div>
    </div>
  );
}
