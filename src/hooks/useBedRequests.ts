import { useCallback, useEffect, useRef, useState } from 'react';
import { bedRequestService } from '../services';
import { errorMessage } from '../services/api';
import type { BedRequest, BedRequestState } from '../types';

const PAGE_SIZE = 25;
/** The API's largest page. */
const MAX_PAGE = 200;
const REFETCH_MS = 300;

export interface BedRequestFilter {
  state?: BedRequestState;
  type?: 'admission' | 'transfer' | 'step-down';
}

/**
 * Bed requests, newest first. They reload 300 ms after `version` or the filter changes: a filter change starts
 * again at one page, while a `version` bump refetches as many rows as are loaded now (at least one page), so
 * "Load more" pages survive live updates. `loadMore` adds the next page, using the oldest `requestedAt`
 * loaded as the cursor. A failed refetch keeps the rows and sets `error`.
 * `loaded` turns true with the first page, so lists can tell "none yet" from "still loading".
 */
export function useBedRequests(
  filter: BedRequestFilter,
  version: number
): { requests: BedRequest[]; loadMore: () => Promise<void>; hasMore: boolean; error: string | null; loaded: boolean } {
  const [requests, setRequests] = useState<BedRequest[]>([]);
  const [firstPage, setFirstPage] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state, type } = filter;
  // Drops answers that arrive after a newer fetch started (a changed filter, say).
  const generation = useRef(0);
  const loading = useRef(false);
  const loaded = useRef<BedRequest[]>([]);
  const filterKey = useRef('');

  useEffect(() => {
    const mine = ++generation.current;
    const key = `${state ?? ''}|${type ?? ''}`;
    if (key !== filterKey.current) {
      filterKey.current = key;
      loaded.current = [];
    }
    const count = Math.min(Math.max(loaded.current.length, PAGE_SIZE), MAX_PAGE);
    const timer = window.setTimeout(
      () => {
        bedRequestService
          .list({ state, type, limit: count })
          .then((page) => {
            if (mine !== generation.current) return;
            loaded.current = page;
            setRequests(page);
            setFirstPage(true);
            setHasMore(page.length >= count);
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

  return { requests, loadMore, hasMore, error, loaded: firstPage };
}
