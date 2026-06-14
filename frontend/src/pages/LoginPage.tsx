import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { saveAuthSession, authLogin } from '../auth/session';
import client from '../graphql/client';
import AuthShell from '../components/auth/AuthShell';
import formStyles from '../components/auth/AuthForm.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justReset = searchParams.get('reset') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await authLogin(email, password);
      saveAuthSession({ token: data.token, email: data.email });
      await client.clearStore();
      navigate('/tree', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      tagline="Your family's story, preserved."
      footer={
        <>
          Don&apos;t have an account? <Link to="/signup">Create one</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <label className={formStyles.label}>
          Email
          <input
            type="email"
            className={formStyles.input}
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className={formStyles.label}>
          Password
          <input
            type="password"
            className={formStyles.input}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {justReset && (
          <p style={{
            color: 'var(--jali-accent)',
            fontSize: '0.875rem',
            background: 'var(--jali-accent-glow)',
            border: '1px solid var(--jali-border-accent)',
            borderRadius: '8px',
            padding: '0.6rem 0.85rem',
            margin: 0,
          }}>
            ✓ Password reset. Sign in with your new password.
          </p>
        )}

        {error && <p className={formStyles.error}>{error}</p>}

        <button type="submit" className={formStyles.button} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p style={{ textAlign: 'center', margin: 0, fontSize: '0.85rem' }}>
          <Link to="/forgot-password" style={{ color: 'var(--jali-text-muted)' }}>
            Forgot password?
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
