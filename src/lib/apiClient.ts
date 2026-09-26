/**
 * CLAUSETRACE Authenticated API Client
 * Wraps browser fetch with automatic Firebase Auth Bearer token injection.
 */

import { auth } from './firebase';

export async function getAuthHeader(): Promise<Record<string, string>> {
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch (err) {
      console.warn('Failed to retrieve Firebase ID token:', err);
    }
  }
  return { Authorization: 'Bearer demo-token' };
}

export async function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
  const authHeader = await getAuthHeader();
  const headers = new Headers(init?.headers || {});

  Object.entries(authHeader).forEach(([k, v]) => {
    if (!headers.has(k)) {
      headers.set(k, v);
    }
  });

  return fetch(url, {
    ...init,
    headers,
  });
}
