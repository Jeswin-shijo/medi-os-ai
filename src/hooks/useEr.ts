import { useCallback, useEffect, useRef, useState } from 'react';
import { erService } from '../services';
import { errorMessage } from '../services/api';
import type { CoordinatorEvent, ErBoard, ErComplaintInfo, ErOverview } from '../types';
import { useCoordinatorStream } from './useCoordinator';

/** Wait this long after something changes, so a burst of events costs one request. */
const REFETCH_MS = 300;

export interface UseEr {
  board: ErBoard | null;
  overview: ErOverview | null;
  /** The complaint list and pathways, for labels and the forms; null until loaded. */
  complaints: ErComplaintInfo | null;
  /** The complaint list failed to load; `reload` tries again. */
  complaintsError: boolean;
  error: string | null;
  live: boolean;
  /** Goes up on every change that matters to the ER (events from `er` or `bed`, and stream catch-ups): side cards refetch with it. */
  eventVersion: number;
  /** The latest ER or bed event, for the diagram's pulse; null until one arrives. */
  lastEvent: CoordinatorEvent | null;
  /** Reload the board and overview now (after an action of this person's own). */
  reload: () => void;
}

/**
 * The ER page's data: the board and the overview, refetched 300 ms after a Coordinator event whose `from` is
 * `er` or `bed` (the ER's own work, and the bed that frees up or is given).
 */
export function useEr(): UseEr {
  const [board, setBoard] = useState<ErBoard | null>(null);
  const [overview, setOverview] = useState<ErOverview | null>(null);
  const [complaints, setComplaints] = useState<ErComplaintInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Counts the changes that matter to the ER; the first load and every stream catch-up count too.
  const [erEvents, setErEvents] = useState(0);
  const [manual, setManual] = useState(0);
  const [lastEvent, setLastEvent] = useState<CoordinatorEvent | null>(null);
  const manualRef = useRef(false);

  const onEvent = useCallback((event: CoordinatorEvent) => {
    if (event.from === 'er' || event.from === 'bed') {
      setErEvents((n) => n + 1);
      setLastEvent(event);
    }
  }, []);
  const { sync, live } = useCoordinatorStream({ onEvent });
  const version = sync + erEvents + manual;
  // The side cards refetch on this, a little after a burst of events has ended.
  const [settledEvents, setSettledEvents] = useState(0);
  const eventVersion = sync + erEvents;
  useEffect(() => {
    const t = window.setTimeout(() => setSettledEvents(eventVersion), REFETCH_MS + 100);
    return () => window.clearTimeout(t);
  }, [eventVersion]);

  useEffect(() => {
    let alive = true;
    const immediate = version === 0 || manualRef.current;
    manualRef.current = false;
    const timer = window.setTimeout(
      () => {
        Promise.all([erService.board(), erService.overview()])
          .then(([nextBoard, nextOverview]) => {
            if (!alive) return;
            setBoard(nextBoard);
            setOverview(nextOverview);
            setError(null);
          })
          .catch((err) => alive && setError(errorMessage(err)));
      },
      immediate ? 0 : REFETCH_MS
    );
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [version]);

  // A failed load of the complaint list can be retried: New arrival and the triage form need it.
  const [complaintsTick, setComplaintsTick] = useState(0);
  const [complaintsError, setComplaintsError] = useState(false);
  const complaintsFailed = useRef(false);
  useEffect(() => {
    let alive = true;
    erService
      .complaints()
      .then((c) => {
        if (!alive) return;
        setComplaints(c);
        complaintsFailed.current = false;
        setComplaintsError(false);
      })
      .catch(() => {
        if (!alive) return;
        complaintsFailed.current = true;
        setComplaintsError(true);
      });
    return () => {
      alive = false;
    };
  }, [complaintsTick]);

  const reload = useCallback(() => {
    manualRef.current = true;
    setManual((n) => n + 1);
    // A reload also retries a complaint list that failed to load.
    if (complaintsFailed.current) setComplaintsTick((n) => n + 1);
  }, []);

  return { board, overview, complaints, complaintsError, error, live, eventVersion: settledEvents, lastEvent, reload };
}
