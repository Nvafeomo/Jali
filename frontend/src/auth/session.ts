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
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const status = res.status;
    throw Object.assign(new Error(status === 401 ? 'Incorrect email or password.' : 'Something went wrong. Try again.'), { status });
  }
  return res.json() as Promise<AuthResponse>;
}

export async function authRegister(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const status = res.status;
    throw Object.assign(new Error(status === 409 ? 'An account with that email already exists.' : 'Something went wrong. Try again.'), { status });
  }
  return res.json() as Promise<AuthResponse>;
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
