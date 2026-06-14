import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveAuthSession, authRegister } from '../auth/session';
import client from '../graphql/client';
import AuthShell from '../components/auth/AuthShell';
import formStyles from '../components/auth/AuthForm.module.css';

const TOS_URL = 'https://nvafeomo.github.io/Jali/tos/';
const PP_URL = 'https://nvafeomo.github.io/Jali/privacy-policy/';

const SignupPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await authRegister(email, password, termsAccepted);
      saveAuthSession({ token: data.token, email: data.email });
      await client.clearStore();
      navigate('/check-email', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      tagline="Start preserving your family's story."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
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
            autoComplete="new-password"
            required
          />
        </label>

        <label className={formStyles.label}>
          Confirm password
          <input
            type="password"
            className={formStyles.input}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        <label className={formStyles.tosRow}>
          <input
            type="checkbox"
            className={formStyles.checkbox}
            checked={termsAccepted}
            onChange={e => setTermsAccepted(e.target.checked)}
            required
          />
          I agree to the{' '}
          <a href={TOS_URL} target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href={PP_URL} target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </label>

        {error && <p className={formStyles.error}>{error}</p>}

        <button type="submit" className={formStyles.button} disabled={loading || !termsAccepted}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
};

export default SignupPage;
