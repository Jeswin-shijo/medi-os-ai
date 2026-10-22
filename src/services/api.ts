// HTTP client for the MediOS backend (NestJS, see ../hospital backend).
// Every response is wrapped as { success, statusCode, data }; this unwraps `data`
// and turns failures into ApiError with the server's message.

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');
const TOKEN_KEY = 'medios_token';

/** Dispatched on window when the API rejects the stored session. */
export const UNAUTHORIZED_EVENT = 'medios:unauthorized';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong');

export const authToken = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Private mode: the session lasts until reload.
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }
};

type Query = Record<string, string | number | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
}

export async function api<T>(path: string, { method = 'GET', body, query }: RequestOptions = {}): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const url = `${API_URL}${path}${params.size ? `?${params}` : ''}`;
  const token = authToken.get();

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(0, `Cannot reach the MediOS API at ${API_URL}. Is the backend running?`);
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      authToken.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const message = payload?.message;
    throw new ApiError(res.status, Array.isArray(message) ? message.join('; ') : message || `Request failed (${res.status})`);
  }
  return payload?.data as T;
}
