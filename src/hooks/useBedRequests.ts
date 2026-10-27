import { useCallback, useEffect, useRef, useState } from 'react';
import { bedRequestService } from '../services';
import { errorMessage } from '../services/api';
import type { BedRequest, BedRequestState } from '../types';

const PAGE_SIZE = 25;
const REFETCH_MS = 300;

export interface BedRequestFilter {
  state?: BedRequestState;
  type?: 'admission' | 'transfer' | 'step-down';
}

/**
 * Bed requests, newest first. The first page reloads 300 ms after `version` or the filter changes;
 * `loadMore` adds the next page, using the oldest `requestedAt` loaded as the cursor.
 */
export function useBedRequests(
  filter: BedRequestFilter,
  version: number
): { requests: BedRequest[]; loadMore: () => Promise<void>; hasMore: boolean; error: string | null } {
  const [requests, setRequests] = useState<BedRequest[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state, type } = filter;
  // Drops answers that arrive after a newer fetch started (a changed filter, say).
  const generation = useRef(0);
  const loading = useRef(false);
  const loaded = useRef<BedRequest[]>([]);

  useEffect(() => {
    const mine = ++generation.current;
    const timer = window.setTimeout(
      () => {
        bedRequestService
          .list({ state, type, limit: PAGE_SIZE })
          .then((page) => {
            if (mine !== generation.current) return;
            loaded.current = page;
            setRequests(page);
            setHasMore(page.length >= PAGE_SIZE);
            setError(null);
          })
          .catch((err) => mine === generation.current && setError(errorMessage(err)));
      },
      version === 0 ? 0 : REFETCH_MS
    );
    return () => window.clearTimeout(timer);
  }, [state, type, version]);

  const loadMore = useCallback(async () => {
    const last = loaded.current[loaded.current.length - 1];
    if (!last || loading.current) return;
    const mine = generation.current;
    loading.current = true;
    try {
      const page = await bedRequestService.list({ state, type, limit: PAGE_SIZE, before: last.requestedAt });
      if (mine !== generation.current) return;
      loaded.current = [...loaded.current, ...page];
      setRequests(loaded.current);
      setHasMore(page.length >= PAGE_SIZE);
    } catch (err) {
      if (mine === generation.current) setError(errorMessage(err));
    } finally {
      loading.current = false;
    }
  }, [state, type]);

  return { requests, loadMore, hasMore, error };
}
