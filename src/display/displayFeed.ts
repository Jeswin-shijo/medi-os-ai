import { API_URL } from '../services/api';
import { QueueDisplaySnapshot } from '../types';

// The waiting-room display's connection. It authenticates with its display key
// (`Authorization: Display <key>`), never a staff session, and receives the queue as
// server-sent events read through fetch (EventSource cannot send that header).

/** The key was removed or never valid: stop retrying. */
export class DisplayRevokedError extends Error {}

/** The server sends a snapshot at least every 15 s; silence this long means a dead connection. */
const SILENCE_MS = 40_000;

const authHeader = (key: string) => ({ Authorization: `Display ${key}` });

async function refusal(res: Response): Promise<Error> {
  const body = await res.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message : `The queue could not be loaded (${res.status})`;
  return res.status === 401 ? new DisplayRevokedError(message) : new Error(message);
}

/** One request for the current queue; used between stream attempts. */
export async function fetchSnapshot(key: string, signal: AbortSignal): Promise<QueueDisplaySnapshot> {
  const res = await fetch(`${API_URL}/queue/display/state`, { headers: authHeader(key), signal, cache: 'no-store' });
  if (!res.ok) throw await refusal(res);
  return (await res.json()).data as QueueDisplaySnapshot;
}

/** Streams snapshots until the connection ends (resolves) or fails (rejects). */
export async function streamSnapshots(key: string, signal: AbortSignal, onSnapshot: (snapshot: QueueDisplaySnapshot) => void): Promise<void> {
  const watchdog = new AbortController();
  const abort = () => watchdog.abort();
  signal.addEventListener('abort', abort);
  let silence = window.setTimeout(abort, SILENCE_MS);
  const heard = () => {
    window.clearTimeout(silence);
    silence = window.setTimeout(abort, SILENCE_MS);
  };

  try {
    const res = await fetch(`${API_URL}/queue/display/stream`, { headers: authHeader(key), signal: watchdog.signal, cache: 'no-store' });
    if (!res.ok || !res.body) throw await refusal(res);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      heard();
      buffer += decoder.decode(value, { stream: true });
      let end;
      while ((end = buffer.indexOf('\n\n')) >= 0) {
        const message = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const event = /^event: (.+)$/m.exec(message)?.[1];
        const data = /^data: (.+)$/m.exec(message)?.[1];
        if (event === 'revoked') throw new DisplayRevokedError('This display was removed. Ask an administrator for a new link.');
        if (event === 'snapshot' && data) onSnapshot(JSON.parse(data) as QueueDisplaySnapshot);
      }
    }
  } finally {
    window.clearTimeout(silence);
    signal.removeEventListener('abort', abort);
  }
}
