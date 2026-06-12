import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  clearAuthSession,
  fetchCurrentUserEmail,
  getAuthToken,
  getStoredEmail,
} from '../auth/session';
import client from '../graphql/client';

export function useAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(() => getStoredEmail());

  useEffect(() => {
    if (!getAuthToken()) return;

    if (getStoredEmail()) return;

    fetchCurrentUserEmail().then(setEmail);
  }, []);

  const logout = useCallback(async () => {
    clearAuthSession();
    setEmail(null);
    await client.clearStore();
    navigate('/login', { replace: true });
  }, [navigate]);

  return {
    email,
    isAuthenticated: !!getAuthToken(),
    logout,
  };
}
