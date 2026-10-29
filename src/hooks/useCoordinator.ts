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

interface StreamSub {
  /** A live event arrived. */
  event(e: CoordinatorEvent, parsed: boolean): void;
  /** The stream (re)connected: anything may have been missed. */
  caughtUp(): void;
  state(live: boolean): void;
}

// One connection serves every screen that is mounted at the same time (a Lab list inside the ER panel,
// the Lab page, the Coordinator page): it opens with the first subscriber and closes with the last.
const subs = new Set<StreamSub>();
let hub: { stop(): void } | null = null;
let hubLive = false;

function startHub(): { stop(): void } {
  const controller = new AbortController();
  let retry: number | undefined;
  let delay = FIRST_RETRY_MS;
  let connected = false;
  const connect = async () => {
    try {
      await streamEvents(
        '/coordinator/stream',
        (event, data) => {
          if (!connected) {
            connected = true;
            hubLive = true;
            delay = FIRST_RETRY_MS;
            subs.forEach((sub) => sub.state(true));
            subs.forEach((sub) => sub.caughtUp());
          }
          if (event !== 'coordinator') return;
          let parsed: CoordinatorEvent | null = null;
          try {
            parsed = JSON.parse(data) as CoordinatorEvent;
          } catch {
            // A malformed event is skipped; the version bump still refreshes the screens.
          }
          subs.forEach((sub) => sub.event(parsed as CoordinatorEvent, parsed !== null));
        },
        controller.signal
      );
    } catch {
      // Falls through to the reconnect below.
    }
    connected = false;
    hubLive = false;
    if (controller.signal.aborted) return;
    subs.forEach((sub) => sub.state(false));
    retry = window.setTimeout(connect, delay);
    delay = Math.min(delay * 2, MAX_RETRY_MS);
  };
  void connect();
  return {
    stop() {
      controller.abort();
      window.clearTimeout(retry);
      hubLive = false;
    }
  };
}

/**
 * The live connection to the Coordinator (shared by every screen mounted at once). `version` goes up on every
 * event, so screens can refetch with it. `sync` goes up only when everything may be stale (the stream
 * (re)connected, the tab came back, or a poll while the stream is down), for lists that otherwise refetch on
 * their own event kinds. Reconnects with a growing delay when the stream drops; `live` is true while connected.
 */
export function useCoordinatorStream(opts: CoordinatorStreamOptions = {}): { version: number; sync: number; live: boolean } {
  const [version, setVersion] = useState(0);
  const [sync, setSync] = useState(0);
  const [live, setLive] = useState(hubLive);
  const onEvent = useRef(opts.onEvent);
  useEffect(() => {
    onEvent.current = opts.onEvent;
  }, [opts.onEvent]);

  useEffect(() => {
    const bumpAll = () => {
      setVersion((v) => v + 1);
      setSync((v) => v + 1);
    };
    const sub: StreamSub = {
      event: (e, parsed) => {
        setVersion((v) => v + 1);
        if (parsed) onEvent.current?.(e);
      },
      caughtUp: bumpAll,
      state: setLive
    };
    subs.add(sub);
    if (!hub) hub = startHub();

    // A visible tab always catches up after being hidden.
    const onVisible = () => {
      if (document.visibilityState === 'visible') bumpAll();
    };
    document.addEventListener('visibilitychange', onVisible);
    // While the stream is down, poll so the lists still catch up.
    const poll = window.setInterval(() => {
      if (hubLive || document.visibilityState !== 'visible') return;
      bumpAll();
    }, FALLBACK_POLL_MS);

    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      subs.delete(sub);
      if (subs.size === 0) {
        hub?.stop();
        hub = null;
      }
    };
  }, []);

  return { version, sync, live };
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
  // On unmount nothing will fetch again: let anyone still awaiting reload() carry on.
  useEffect(() => {
    const pending = waiters.current;
    return () => {
      pending.splice(0).forEach((done) => done());
    };
  }, []);

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
