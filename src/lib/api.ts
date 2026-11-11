import type { PrototypeState } from './storage';

export interface AppUser {
  id: string;
  displayName: string | null;
  email: string | null;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function frontendOrigin(): string {
  return window.location.origin;
}

function readCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  if (!item) return null;
  try {
    return decodeURIComponent(item.slice(prefix.length));
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: { method?: string; body?: unknown; csrf?: boolean } = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers = new Headers({ 'X-Frontend-Origin': frontendOrigin() });
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (options.csrf) {
    const token = readCookie('career_csrf_token');
    if (!token) throw new ApiError('Your secure session is not ready. Reload the page and try again.', 403, 'csrf_missing');
    headers.set('X-CSRF-Token', token);
  }

  const response = await fetch(path, {
    method,
    headers,
    credentials: 'include',
    cache: 'no-store',
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  if (!response.ok) {
    let payload: { error?: string; message?: string } = {};
    try {
      payload = await response.json() as typeof payload;
    } catch {
      // Keep the HTTP status as the useful signal when the server sends no JSON body.
    }
    throw new ApiError(payload.message ?? payload.error ?? `Request failed (${response.status}).`, response.status, payload.error);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const accountApi = {
  getSession: () => request<{ user: AppUser | null }>('/api/auth/session'),
  startLogin: (origin: string) => request<{ authorizationUrl: string }>('/api/auth/start', { method: 'POST', body: { origin } }),
  getWorkspace: () => request<{ workspace: PrototypeState; revision: number }>('/api/me/workspace'),
  saveWorkspace: (workspace: PrototypeState, expectedRevision: number) => request<{ revision: number }>('/api/me/workspace', { method: 'PUT', body: { workspace, expectedRevision }, csrf: true }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST', body: {}, csrf: true }),
  deleteAccount: () => request<void>('/api/account', { method: 'DELETE', csrf: true }),
};
