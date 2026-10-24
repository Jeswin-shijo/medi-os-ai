// HTTP client for the MediOS backend (NestJS, see ../hospital backend).
// Every response is wrapped as { success, statusCode, data }; this unwraps `data`
// and turns failures into ApiError with the server's message.
//
// Session model: the short-lived access token lives only in memory (never in
// localStorage, where injected scripts could read it). The refresh token is an
// httpOnly cookie the browser sends to /api/auth; on a 401 the client refreshes
// once and retries the request.

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');

/** Required by the API on cookie-authenticated endpoints (CSRF protection). */
const CLIENT_HEADERS = { 'X-MediOS-Client': 'web' };

/** Auth endpoints whose 401 means "not signed in", not "token expired". */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

/** Dispatched on window when the session cannot be renewed. */
export const UNAUTHORIZED_EVENT = 'medios:unauthorized';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong');

let accessToken: string | null = null;

export const session = {
  setAccessToken(token: string) {
    accessToken = token;
  },
  clear() {
    accessToken = null;
  }
};

// Earlier versions kept the token in localStorage; remove any leftover copy.
try {
  localStorage.removeItem('medios_token');
} catch {
  // Storage blocked: nothing to clean up.
}

export interface SessionPayload<U> {
  accessToken: string;
  expiresIn: number;
  user: U;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestRefresh<U>(): Promise<SessionPayload<U> | null> {
  // A second attempt covers another tab having rotated the cookie a moment ago.
  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include', headers: CLIENT_HEADERS });
    } catch {
      return null;
    }
    if (res.ok) {
      const payload = await res.json();
      accessToken = payload.data.accessToken;
      return payload.data as SessionPayload<U>;
    }
    if (res.status !== 401 || attempt === 1) return null;
    await wait(400);
  }
  return null;
}

let refreshing: Promise<SessionPayload<unknown> | null> | null = null;

/** Renews the access token from the refresh cookie; concurrent callers share one request. */
export function refreshSession<U>(): Promise<SessionPayload<U> | null> {
  refreshing ??= requestRefresh<unknown>().finally(() => {
    refreshing = null;
  });
  return refreshing as Promise<SessionPayload<U> | null>;
}

type Query = Record<string, string | number | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
}

export async function api<T>(path: string, { method = 'GET', body, query }: RequestOptions = {}, retried = false): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const url = `${API_URL}${path}${params.size ? `?${params}` : ''}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      credentials: 'include',
      headers: {
        ...CLIENT_HEADERS,
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` })
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(0, `Cannot reach the MediOS API at ${API_URL}. Is the backend running?`);
  }

  if (res.status === 401 && !NO_REFRESH_PATHS.includes(path)) {
    if (!retried && (await refreshSession())) return api<T>(path, { method, body, query }, true);
    accessToken = null;
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (res.status === 204) return undefined as T;
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message = payload?.message;
    throw new ApiError(res.status, Array.isArray(message) ? message.join('; ') : message || `Request failed (${res.status})`);
  }
  return payload?.data as T;
}
