import { useEffect, useState } from 'react';
import { bedService } from '../services';
import { errorMessage } from '../services/api';
import type { BedOverview, SnapshotPoint, SnapshotRange } from '../types';

/** Wait this long after the board changes, so a burst of events costs one request. */
const REFETCH_MS = 300;

/** The Bed Agent overview, refetched 300 ms after `version` changes (from `useBedBoard`). */
export function useBedOverview(version: number): { overview: BedOverview | null; error: string | null } {
  const [overview, setOverview] = useState<BedOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // The first load is immediate; later ones are debounced.
    const timer = window.setTimeout(
      () => {
        bedService
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

/** Hourly bed counts for the chart; refetched with the overview when `version` changes. */
export function useBedSeries(range: SnapshotRange, version: number): { points: SnapshotPoint[] } {
  const [points, setPoints] = useState<SnapshotPoint[]>([]);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(
      () => {
        bedService
          .snapshots(range)
          .then((res) => alive && setPoints(res.points))
          .catch(() => {
            // Keep the last chart; the overview reports connection problems.
          });
      },
      version === 0 ? 0 : REFETCH_MS
    );
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [range, version]);

  return { points };
}
