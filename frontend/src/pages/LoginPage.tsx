import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveAuthSession, authLogin } from '../auth/session';
import styles from './LoginPage.module.css';

// LoginPage handles email/password authentication.
// On success, the backend returns a JWT which we store in localStorage.
// Apollo's authLink (graphql/client.ts) reads that token before every request.

const LoginPage = () => {
  const navigate = useNavigate();

  // Controlled form state — each field is a piece of React state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state for loading spinner and error display
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent the browser's default form submission (which would reload the page)
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // authLogin lives in session.ts so the API URL stays in one place.
      const data = await authLogin(email, password);
      saveAuthSession({ token: data.token, email: data.email });
      navigate('/tree', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.logo}>Jali</h1>
        <p className={styles.tagline}>Your family's story, preserved.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Email
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className={styles.label}>
            Password
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.signup}>
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>

        {/* Dev-only shortcut — stripped out in production builds */}
        {import.meta.env.DEV && (
          <p className={styles.devNote}>
            Dev: go straight to <Link to="/tree">/tree</Link> (no login needed)
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
