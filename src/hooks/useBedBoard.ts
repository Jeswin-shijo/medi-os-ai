import { useCallback, useEffect, useRef, useState } from 'react';
import { bedService } from '../services';
import { errorMessage, streamEvents } from '../services/api';
import type { BedBoard } from '../types';

const DEBOUNCE_MS = 200;
const FIRST_RETRY_MS = 3000;
const MAX_RETRY_MS = 30_000;
const FALLBACK_POLL_MS = 30_000;

/**
 * The bed board, kept live: loads on mount, reloads when the server says something changed,
 * reconnects with a growing delay when the stream drops, and polls while it is down.
 */
export function useBedBoard(): { board: BedBoard | null; error: string | null; reload: () => Promise<void> } {
  const [board, setBoard] = useState<BedBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  const reload = useCallback(async () => {
    try {
      const next = await bedService.board();
      if (!alive.current) return;
      setBoard(next);
      setError(null);
    } catch (err) {
      if (alive.current) setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    let connected = false;
    let debounce: number | undefined;
    let retry: number | undefined;
    let delay = FIRST_RETRY_MS;

    const scheduleReload = () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(reload, DEBOUNCE_MS);
    };

    const connect = async () => {
      try {
        await streamEvents(
          '/beds/stream',
          (event) => {
            if (!connected) {
              connected = true;
              delay = FIRST_RETRY_MS;
              void reload(); // anything missed while the stream was down
            }
            if (event === 'changed') scheduleReload();
          },
          controller.signal
        );
      } catch {
        // Falls through to the reconnect below.
      }
      connected = false;
      if (controller.signal.aborted) return;
      retry = window.setTimeout(connect, delay);
      delay = Math.min(delay * 2, MAX_RETRY_MS);
    };

    // Initial load: the first stream event also reloads, so a failure here is retried.
    bedService
      .board()
      .then((next) => {
        if (!alive.current) return;
        setBoard(next);
        setError(null);
      })
      .catch((err) => alive.current && setError(errorMessage(err)));
    void connect();

    // While the stream is down, poll; a visible tab always catches up.
    const poll = window.setInterval(() => {
      if (!connected && document.visibilityState === 'visible') void reload();
    }, FALLBACK_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      alive.current = false;
      controller.abort();
      window.clearTimeout(debounce);
      window.clearTimeout(retry);
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  return { board, error, reload };
}
