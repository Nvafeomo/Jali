import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../auth/session';
import AuthShell from '../components/auth/AuthShell';
import formStyles from '../components/auth/AuthForm.module.css';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!token) {
      setError('No reset token found. Request a new link.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetPassword(token, newPassword);
      navigate('/login?reset=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      tagline="Choose a new password."
      footer={<Link to="/login">Back to sign in</Link>}
    >
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <label className={formStyles.label}>
          New password
          <input
            type="password"
            className={formStyles.input}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        <label className={formStyles.label}>
          Confirm new password
          <input
            type="password"
            className={formStyles.input}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        {error && <p className={formStyles.error}>{error}</p>}

        <button type="submit" className={formStyles.button} disabled={loading || !token}>
          {loading ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </AuthShell>
  );
};

export default ResetPasswordPage;
