import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/appContextCore';
import { pharmacyAgentService } from '../services';
import { errorMessage } from '../services/api';
import type { CoordinatorEvent, PharmacyLineView, PharmacyOrderView, PharmacyOverview } from '../types';
import { useCoordinatorStream } from './useCoordinator';

/** The Pharmacy's own events refresh after this long; a burst of them costs one request. */
const PHARMACY_MS = 300;
/** ER and bed events move a patient, so the side loads wait a little longer. */
const SIDE_MS = 400;
/** The alert is raised just after the message is sent, so the header bell recounts a moment later. */
const BELL_MS = 800;
const ORDER_LIMIT = 100;

export interface UsePharmacy {
  overview: PharmacyOverview | null;
  orders: PharmacyOrderView[] | null;
  /** The pharmacist's lists: lines to check, lines to issue, queries. */
  check: PharmacyLineView[] | null;
  issue: PharmacyLineView[] | null;
  queries: PharmacyLineView[] | null;
  /** The first load failed (or the latest did); `reload` tries again. */
  error: string | null;
  live: boolean;
  /** The most orders `orders` can hold; at this length the list may be cut off. */
  orderLimit: number;
  /** The latest Pharmacy event, for the diagram's pulse; null until one arrives. */
  lastEvent: CoordinatorEvent | null;
  /** Reload everything now (after an action of this person's own, or Try again). */
  reload: () => void;
}

const loadSide = () =>
  Promise.all([pharmacyAgentService.orders({ limit: ORDER_LIMIT }), pharmacyAgentService.worklist('check'), pharmacyAgentService.worklist('issue'), pharmacyAgentService.worklist('queries')]);

/**
 * The Pharmacy page's data: the overview, the orders and the three worklists. Everything refetches 300 ms after a
 * Coordinator event from `pharmacy`; the orders and worklists also refetch 400 ms after one from `er` or `bed`,
 * because a patient's location changes with those. Every `pharmacy` event recounts the header bell after 800 ms
 * (queries and rejections raise alerts; low stock sends no message, so the bell gets that one from the app's
 * own 60-second refresh).
 */
export function usePharmacy(): UsePharmacy {
  const [overview, setOverview] = useState<PharmacyOverview | null>(null);
  const [orders, setOrders] = useState<PharmacyOrderView[] | null>(null);
  const [check, setCheck] = useState<PharmacyLineView[] | null>(null);
  const [issue, setIssue] = useState<PharmacyLineView[] | null>(null);
  const [queries, setQueries] = useState<PharmacyLineView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ownEvents, setOwnEvents] = useState(0);
  const [sideEvents, setSideEvents] = useState(0);
  const [manual, setManual] = useState(0);
  const [lastEvent, setLastEvent] = useState<CoordinatorEvent | null>(null);
  const manualRef = useRef(false);
  const bellTimers = useRef(new Set<number>());
  const { refreshAlertCount } = useApp();

  const onEvent = useCallback(
    (event: CoordinatorEvent) => {
      if (event.from === 'pharmacy') {
        setOwnEvents((n) => n + 1);
        setLastEvent(event);
        const t = window.setTimeout(() => {
          bellTimers.current.delete(t);
          void refreshAlertCount();
        }, BELL_MS);
        bellTimers.current.add(t);
      } else if (event.from === 'er' || event.from === 'bed') {
        setSideEvents((n) => n + 1);
      }
    },
    [refreshAlertCount]
  );
  const { sync, live } = useCoordinatorStream({ onEvent });

  // A recount still waiting when the page closes is cancelled.
  useEffect(() => {
    const timers = bellTimers.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
    };
  }, []);

  // Everything refetches on a Pharmacy event, a stream catch-up or a manual reload.
  const mainVersion = sync + ownEvents + manual;
  useEffect(() => {
    let alive = true;
    const immediate = mainVersion === 0 || manualRef.current;
    manualRef.current = false;
    const timer = window.setTimeout(
      () => {
        Promise.all([pharmacyAgentService.overview(), loadSide()])
          .then(([nextOverview, [nextOrders, nextCheck, nextIssue, nextQueries]]) => {
            if (!alive) return;
            setOverview(nextOverview);
            setOrders(nextOrders);
            setCheck(nextCheck);
            setIssue(nextIssue);
            setQueries(nextQueries);
            setError(null);
          })
          .catch((err) => alive && setError(errorMessage(err)));
      },
      immediate ? 0 : PHARMACY_MS
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
      loadSide()
        .then(([nextOrders, nextCheck, nextIssue, nextQueries]) => {
          if (!alive) return;
          setOrders(nextOrders);
          setCheck(nextCheck);
          setIssue(nextIssue);
          setQueries(nextQueries);
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

  return { overview, orders, check, issue, queries, error, live, orderLimit: ORDER_LIMIT, lastEvent, reload };
}
