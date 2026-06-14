import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../auth/session';
import AuthShell from '../components/auth/AuthShell';

const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in this link.');
      return;
    }

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verification failed.');
      });
  }, [token]);

  return (
    <AuthShell
      tagline="Email verification"
      footer={<Link to="/login">Back to sign in</Link>}
    >
      <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <p style={{ color: 'var(--jali-text-muted)' }}>Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
            <p style={{ color: 'var(--jali-text)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Your email is verified. Your family tree is ready.
            </p>
            <Link
              to="/tree"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.75rem',
                background: 'linear-gradient(180deg, var(--jali-accent) 0%, #9370db 100%)',
                color: '#0f172a',
                fontWeight: 600,
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              Go to my tree →
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>❌</div>
            <p style={{ color: '#fca5a5', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              {message}
            </p>
            <p style={{ color: 'var(--jali-text-muted)', fontSize: '0.875rem' }}>
              You can request a new link from the{' '}
              <Link to="/check-email" style={{ color: 'var(--jali-accent)' }}>check email page</Link>.
            </p>
          </>
        )}
      </div>
    </AuthShell>
  );
};

export default VerifyEmailPage;
