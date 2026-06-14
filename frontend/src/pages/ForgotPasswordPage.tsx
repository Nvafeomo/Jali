import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../auth/session';
import AuthShell from '../components/auth/AuthShell';
import formStyles from '../components/auth/AuthForm.module.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await forgotPassword(email);
      navigate('/check-email?mode=reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      tagline="We'll send you a reset link."
      footer={<Link to="/login">Back to sign in</Link>}
    >
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <label className={formStyles.label}>
          Email address
          <input
            type="email"
            className={formStyles.input}
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </label>

        {error && <p className={formStyles.error}>{error}</p>}

        <button type="submit" className={formStyles.button} disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
