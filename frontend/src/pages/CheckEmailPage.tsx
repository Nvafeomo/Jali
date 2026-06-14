import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resendVerification } from '../auth/session';
import AuthShell from '../components/auth/AuthShell';
import formStyles from '../components/auth/AuthForm.module.css';

const CheckEmailPage = () => {
  const [params] = useSearchParams();
  const mode = params.get('mode') ?? 'verify';
  const isReset = mode === 'reset';

  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    try {
      await resendVerification();
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      tagline={isReset ? 'Check your inbox.' : 'One more step.'}
      footer={
        <Link to="/login">Back to sign in</Link>
      }
    >
      <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📬</div>

        <p style={{ color: 'var(--jali-text)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
          {isReset
            ? 'If that email is registered, we sent a password reset link. Check your inbox (and spam folder).'
            : 'We sent a verification link to your email. Click it to confirm your account.'}
        </p>

        <p style={{ color: 'var(--jali-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {isReset ? 'The link expires in 1 hour.' : 'The link expires in 24 hours.'}
        </p>

        {!isReset && (
          <>
            {resent ? (
              <p style={{ color: 'var(--jali-accent)', fontSize: '0.875rem' }}>
                ✓ Verification email resent.
              </p>
            ) : (
              <>
                {error && <p className={formStyles.error}>{error}</p>}
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className={formStyles.button}
                  style={{ width: 'auto', padding: '0.6rem 1.5rem', fontSize: '0.875rem' }}
                >
                  {loading ? 'Sending…' : 'Resend verification email'}
                </button>
              </>
            )}
            <p style={{ marginTop: '1.25rem' }}>
              <Link
                to="/tree"
                state={{ onboarding: true }}
                style={{ color: 'var(--jali-text-muted)', fontSize: '0.85rem' }}
              >
                Continue to your tree →
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthShell>
  );
};

export default CheckEmailPage;
