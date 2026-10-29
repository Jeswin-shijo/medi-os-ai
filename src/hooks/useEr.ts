import { useCallback, useEffect, useRef, useState } from 'react';
import { erService } from '../services';
import { errorMessage } from '../services/api';
import type { CoordinatorEvent, ErBoard, ErComplaintInfo, ErOverview, ErSeriesPoint, SnapshotRange } from '../types';
import { useCoordinatorStream } from './useCoordinator';

/** Wait this long after something changes, so a burst of events costs one request. */
const REFETCH_MS = 300;
/** Hourly counts change once an hour. */
const SERIES_REFRESH_MS = 3_600_000;

export interface UseEr {
  board: ErBoard | null;
  overview: ErOverview | null;
  /** Hourly counts, oldest first; null until loaded. */
  series: ErSeriesPoint[] | null;
  /** The complaint list and pathways, for labels and the forms; null until loaded. */
  complaints: ErComplaintInfo | null;
  error: string | null;
  live: boolean;
  /** Reload the board and overview now (after an action of this person's own). */
  reload: () => void;
  /** Reload the hourly series now. */
  reloadSeries: () => void;
}

/**
 * The ER page's data: the board and the overview, refetched 300 ms after a Coordinator event whose `from` is
 * `er` or `bed` (the ER's own work, and the bed that frees up or is given). The series loads once, then hourly or on demand.
 */
export function useEr(range: SnapshotRange = '24h'): UseEr {
  const [board, setBoard] = useState<ErBoard | null>(null);
  const [overview, setOverview] = useState<ErOverview | null>(null);
  const [series, setSeries] = useState<ErSeriesPoint[] | null>(null);
  const [complaints, setComplaints] = useState<ErComplaintInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Counts the changes that matter to the ER; the first load and every stream catch-up count too.
  const [erEvents, setErEvents] = useState(0);
  const [manual, setManual] = useState(0);
  const [seriesTick, setSeriesTick] = useState(0);
  const manualRef = useRef(false);

  const onEvent = useCallback((event: CoordinatorEvent) => {
    if (event.from === 'er' || event.from === 'bed') setErEvents((n) => n + 1);
  }, []);
  const { sync, live } = useCoordinatorStream({ onEvent });
  const version = sync + erEvents + manual;

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

  useEffect(() => {
    let alive = true;
    erService
      .complaints()
      .then((c) => alive && setComplaints(c))
      .catch(() => {
        // Labels fall back to the stored text.
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const t = window.setInterval(() => setSeriesTick((n) => n + 1), SERIES_REFRESH_MS);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    let alive = true;
    erService
      .snapshots(range)
      .then((r) => alive && setSeries(r.points))
      .catch(() => {
        // The series is optional: the cards and the queue do not need it.
      });
    return () => {
      alive = false;
    };
  }, [range, seriesTick]);

  const reload = useCallback(() => {
    manualRef.current = true;
    setManual((n) => n + 1);
  }, []);
  const reloadSeries = useCallback(() => setSeriesTick((n) => n + 1), []);

  return { board, overview, series, complaints, error, live, reload, reloadSeries };
}
