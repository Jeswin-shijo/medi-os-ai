import { useCallback, useEffect, useRef, useState } from 'react';
import { bedService } from '../services';
import { errorMessage, streamEvents } from '../services/api';
import type { BedBoard, BedRequestEvent } from '../types';

const DEBOUNCE_MS = 200;
const FIRST_RETRY_MS = 3000;
const MAX_RETRY_MS = 30_000;
const FALLBACK_POLL_MS = 30_000;

interface BedBoardOptions {
  /** Called for each bed request that changed state (the latest callback is used; changing it does not reconnect). */
  onRequest?: (event: BedRequestEvent) => void;
}

/**
 * The bed board, kept live: loads on mount, reloads when the server says something changed,
 * reconnects with a growing delay when the stream drops, and polls while it is down.
 * `version` goes up on every `changed` or `request` event, so other hooks can refetch with it.
 */
export function useBedBoard(opts: BedBoardOptions = {}): {
  board: BedBoard | null;
  error: string | null;
  reload: () => Promise<void>;
  version: number;
  live: boolean;
} {
  const [board, setBoard] = useState<BedBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [live, setLive] = useState(false);
  const alive = useRef(true);
  const onRequest = useRef(opts.onRequest);
  useEffect(() => {
    onRequest.current = opts.onRequest;
  }, [opts.onRequest]);

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
          (event, data) => {
            if (!connected) {
              connected = true;
              delay = FIRST_RETRY_MS;
              setLive(true);
              void reload(); // anything missed while the stream was down
            }
            if (event === 'changed') {
              scheduleReload();
              setVersion((v) => v + 1);
            } else if (event === 'request') {
              setVersion((v) => v + 1);
              try {
                onRequest.current?.(JSON.parse(data) as BedRequestEvent);
              } catch {
                // A malformed event is skipped; the version bump already refreshes the screens.
              }
            }
          },
          controller.signal
        );
      } catch {
        // Falls through to the reconnect below.
      }
      connected = false;
      if (alive.current) setLive(false);
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

  return { board, error, reload, version, live };
}
