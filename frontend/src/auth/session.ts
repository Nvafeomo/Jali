const TOKEN_KEY = 'jali_token';
const EMAIL_KEY = 'jali_email';

export interface AuthSessionPayload {
  token: string;
  email: string;
}

export interface CurrentUser {
  email: string;
  familyTreeName: string;
}

export function saveAuthSession({ token, email }: AuthSessionPayload) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredEmail() {
  return localStorage.getItem(EMAIL_KEY);
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json() as { detail?: string; message?: string; title?: string };
    if (data.detail) return data.detail;
    if (data.message) return data.message;
  } catch {
    // ignore non-JSON bodies
  }
  return fallback;
}

async function authRequest(
  path: string,
  body: object,
  fallbackError: string,
): Promise<AuthResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      `Could not reach the server at ${API_URL}. Check that the backend is running and VITE_API_URL is correct.`,
    );
  }

  if (!res.ok) {
    const fallback =
      res.status === 401
        ? 'Incorrect email or password.'
        : res.status === 409
          ? 'An account with that email already exists.'
          : res.status === 400
            ? 'Check your email and password and try again.'
            : fallbackError;
    throw Object.assign(new Error(await readApiError(res, fallback)), { status: res.status });
  }

  return res.json() as Promise<AuthResponse>;
}

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const token = getAuthToken();
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) clearAuthSession();
    return null;
  }

  const data = await res.json();
  localStorage.setItem(EMAIL_KEY, data.email);
  return {
    email: data.email as string,
    familyTreeName: data.familyTreeName as string,
  };
}

export interface AuthResponse {
  token: string;
  email: string;
}

// Centralised login/register so pages don't hardcode the API URL.
export async function authLogin(email: string, password: string): Promise<AuthResponse> {
  return authRequest(
    '/auth/login',
    { email: email.trim().toLowerCase(), password },
    'Sign in failed. Try again.',
  );
}

export async function authRegister(email: string, password: string, termsAccepted: boolean): Promise<AuthResponse> {
  return authRequest(
    '/auth/register',
    { email: email.trim().toLowerCase(), password, termsAccepted },
    'Could not create account. Try again.',
  );
}

export async function fetchCurrentUserEmail(): Promise<string | null> {
  const user = await fetchCurrentUser();
  return user?.email ?? null;
}

export async function updateFamilyTreeName(name: string): Promise<string | null> {
  const token = getAuthToken();
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/family-tree`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    if (res.status === 401) clearAuthSession();
    return null;
  }

  const data = await res.json();
  return data.familyTreeName as string;
}
