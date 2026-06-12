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

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const token = getAuthToken();
  if (!token) return null;

  const res = await fetch('http://localhost:8080/auth/me', {
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

export async function fetchCurrentUserEmail(): Promise<string | null> {
  const user = await fetchCurrentUser();
  return user?.email ?? null;
}

export async function updateFamilyTreeName(name: string): Promise<string | null> {
  const token = getAuthToken();
  if (!token) return null;

  const res = await fetch('http://localhost:8080/auth/family-tree', {
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
