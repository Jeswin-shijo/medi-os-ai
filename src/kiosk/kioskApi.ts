import { API_URL } from '../services/api';
import { KioskTapResult } from '../types';

// The check-in kiosk's calls. It authenticates with its kiosk key
// (`Authorization: Kiosk <key>`), never a staff session, and can only read its own
// settings and check in a tapped card.

export class KioskError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface KioskState {
  name: string;
  printSlips: boolean;
  hospitalName: string;
}

async function kioskFetch<T>(key: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Kiosk ${key}`, ...(body !== undefined && { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store'
    });
  } catch {
    throw new KioskError(0, 'The kiosk cannot reach the MediOS server.');
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message = payload?.message;
    throw new KioskError(res.status, typeof message === 'string' ? message : `Request failed (${res.status})`);
  }
  return payload.data as T;
}

export const kioskApi = {
  state: (key: string) => kioskFetch<KioskState>(key, '/queue/kiosk/state'),
  tap: (key: string, cardId: string) => kioskFetch<KioskTapResult>(key, '/queue/kiosk/tap', { cardId })
};
