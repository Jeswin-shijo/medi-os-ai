import { useCallback, useEffect, useRef, useState } from 'react';
import { coordinatorService } from '../services';
import { errorMessage, streamEvents } from '../services/api';
import type { CoordinatorEvent, CoordinatorOverview } from '../types';

const FIRST_RETRY_MS = 3000;
const MAX_RETRY_MS = 30_000;
/** Wait this long after something changes, so a burst of events costs one request. */
const REFETCH_MS = 300;
/** While the stream is down, refetch this often (as the bed board does). */
const FALLBACK_POLL_MS = 30_000;

interface CoordinatorStreamOptions {
  /** Called for each live event (the latest callback is used; changing it does not reconnect). */
  onEvent?: (event: CoordinatorEvent) => void;
}

/**
 * One live connection to the Coordinator. `version` goes up on every event, so screens can refetch
 * with it. Reconnects with a growing delay when the stream drops; `live` is true while connected.
 */
export function useCoordinatorStream(opts: CoordinatorStreamOptions = {}): { version: number; live: boolean } {
  const [version, setVersion] = useState(0);
  const [live, setLive] = useState(false);
  const onEvent = useRef(opts.onEvent);
  useEffect(() => {
    onEvent.current = opts.onEvent;
  }, [opts.onEvent]);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    let connected = false;
    let retry: number | undefined;
    let delay = FIRST_RETRY_MS;

    const connect = async () => {
      try {
        await streamEvents(
          '/coordinator/stream',
          (event, data) => {
            if (!connected) {
              connected = true;
              delay = FIRST_RETRY_MS;
              setLive(true);
              setVersion((v) => v + 1); // anything missed while the stream was down
            }
            if (event !== 'coordinator') return;
            setVersion((v) => v + 1);
            try {
              onEvent.current?.(JSON.parse(data) as CoordinatorEvent);
            } catch {
              // A malformed event is skipped; the version bump already refreshes the screens.
            }
          },
          controller.signal
        );
      } catch {
        // Falls through to the reconnect below.
      }
      connected = false;
      if (alive) setLive(false);
      if (controller.signal.aborted) return;
      retry = window.setTimeout(connect, delay);
      delay = Math.min(delay * 2, MAX_RETRY_MS);
    };
    void connect();

    // A visible tab always catches up after being hidden.
    const onVisible = () => {
      if (document.visibilityState === 'visible') setVersion((v) => v + 1);
    };
    document.addEventListener('visibilitychange', onVisible);
    // While the stream is down, poll so the lists still catch up.
    const poll = window.setInterval(() => {
      if (!connected && document.visibilityState === 'visible') setVersion((v) => v + 1);
    }, FALLBACK_POLL_MS);

    return () => {
      window.clearInterval(poll);
      alive = false;
      controller.abort();
      window.clearTimeout(retry);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return { version, live };
}

/** The Coordinator overview, refetched 300 ms after `version` changes (from `useCoordinatorStream`). */
export function useCoordinatorOverview(version: number): { overview: CoordinatorOverview | null; error: string | null } {
  const [overview, setOverview] = useState<CoordinatorOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(
      () => {
        coordinatorService
          .overview()
          .then((next) => {
            if (!alive) return;
            setOverview(next);
            setError(null);
          })
          .catch((err) => alive && setError(errorMessage(err)));
      },
      version === 0 ? 0 : REFETCH_MS
    );
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [version]);

  return { overview, error };
}

/** Any Coordinator list, refetched 300 ms after `version` changes. Pass a stable `fetcher` (useCallback). */
export function useCoordinatorList<T>(
  fetcher: () => Promise<T[]>,
  version: number
): { items: T[]; loading: boolean; error: string | null; reload: () => Promise<void> } {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(0);
  // A manual reload() runs at once; stream changes wait out the debounce.
  const manualRef = useRef(false);
  // Callers of reload() that are waiting for the next fetch to finish.
  const waiters = useRef<(() => void)[]>([]);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(
      () => {
        fetcher()
          .then((next) => {
            if (!alive) return;
            setItems(next);
            setError(null);
          })
          .catch((err) => alive && setError(errorMessage(err)))
          .finally(() => {
            if (!alive) return; // a newer fetch has replaced this one; it will release the waiters
            setLoading(false);
            waiters.current.splice(0).forEach((done) => done());
          });
      },
      version === 0 || manualRef.current ? 0 : REFETCH_MS
    );
    manualRef.current = false;
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [fetcher, version, manual]);

  const reload = useCallback(
    () =>
      new Promise<void>((resolve) => {
        waiters.current.push(resolve);
        manualRef.current = true;
        setManual((n) => n + 1);
      }),
    []
  );
  return { items, loading, error, reload };
}
