import { useCallback, useEffect, useRef, useState } from 'react';
import { labAgentService } from '../services';
import { errorMessage } from '../services/api';
import type { CoordinatorEvent, LabCollectionItem, LabCriticalRow, LabOverview, LabRequestView } from '../types';
import { useCoordinatorStream } from './useCoordinator';

/** The Lab's own events refresh after this long; a burst of them costs one request. */
const LAB_MS = 300;
/** ER and bed events move a patient, so the side loads wait a little longer. */
const SIDE_MS = 400;

export interface UseLab {
  overview: LabOverview | null;
  requests: LabRequestView[] | null;
  collection: LabCollectionItem[] | null;
  critical: LabCriticalRow[] | null;
  /** The first load failed (or the latest did); `reload` tries again. */
  error: string | null;
  live: boolean;
  /** The latest Lab event, for the diagram's pulse; null until one arrives. */
  lastEvent: CoordinatorEvent | null;
  /** Reload everything now (after an action of this person's own, or Try again). */
  reload: () => void;
}

/**
 * The Lab page's data: the overview, the requests, the collection list and the critical list. All four refetch
 * 300 ms after a Coordinator event from `lab`; the requests, collection list and critical list also refetch
 * 400 ms after one from `er` or `bed`, because a patient's location changes with those.
 */
export function useLab(): UseLab {
  const [overview, setOverview] = useState<LabOverview | null>(null);
  const [requests, setRequests] = useState<LabRequestView[] | null>(null);
  const [collection, setCollection] = useState<LabCollectionItem[] | null>(null);
  const [critical, setCritical] = useState<LabCriticalRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [labEvents, setLabEvents] = useState(0);
  const [sideEvents, setSideEvents] = useState(0);
  const [manual, setManual] = useState(0);
  const [lastEvent, setLastEvent] = useState<CoordinatorEvent | null>(null);
  const manualRef = useRef(false);

  const onEvent = useCallback((event: CoordinatorEvent) => {
    if (event.from === 'lab') {
      setLabEvents((n) => n + 1);
      setLastEvent(event);
    } else if (event.from === 'er' || event.from === 'bed') {
      setSideEvents((n) => n + 1);
    }
  }, []);
  const { sync, live } = useCoordinatorStream({ onEvent });

  // Everything refetches on a Lab event, a stream catch-up or a manual reload.
  const mainVersion = sync + labEvents + manual;
  useEffect(() => {
    let alive = true;
    const immediate = mainVersion === 0 || manualRef.current;
    manualRef.current = false;
    const timer = window.setTimeout(
      () => {
        Promise.all([labAgentService.overview(), labAgentService.requests(), labAgentService.collection(), labAgentService.critical()])
          .then(([nextOverview, nextRequests, nextCollection, nextCritical]) => {
            if (!alive) return;
            setOverview(nextOverview);
            setRequests(nextRequests);
            setCollection(nextCollection);
            setCritical(nextCritical);
            setError(null);
          })
          .catch((err) => alive && setError(errorMessage(err)));
      },
      immediate ? 0 : LAB_MS
    );
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [mainVersion]);

  // ER and bed events: only the lists that show a patient's location.
  useEffect(() => {
    if (sideEvents === 0) return;
    let alive = true;
    const timer = window.setTimeout(() => {
      Promise.all([labAgentService.requests(), labAgentService.collection(), labAgentService.critical()])
        .then(([nextRequests, nextCollection, nextCritical]) => {
          if (!alive) return;
          setRequests(nextRequests);
          setCollection(nextCollection);
          setCritical(nextCritical);
        })
        .catch(() => {
          // The next event or a reload tries again; what is on screen stays.
        });
    }, SIDE_MS);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [sideEvents]);

  const reload = useCallback(() => {
    manualRef.current = true;
    setManual((n) => n + 1);
  }, []);

  return { overview, requests, collection, critical, error, live, lastEvent, reload };
}
