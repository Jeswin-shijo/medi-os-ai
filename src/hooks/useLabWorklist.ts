import { useCallback, useEffect, useState } from 'react';
import { labAgentService } from '../services';
import { errorMessage } from '../services/api';
import type { LabWorklist } from '../types';

/** The bench worklist. It fetches again whenever `refresh` changes (the Lab lists reloaded) or `retry` runs. */
export function useLabWorklist(refresh: unknown, enabled: boolean) {
  const [worklist, setWorklist] = useState<LabWorklist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    labAgentService
      .worklist()
      .then((w) => {
        if (!alive) return;
        setWorklist(w);
        setError(null);
      })
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [refresh, enabled, tries]);
  const retry = useCallback(() => setTries((n) => n + 1), []);
  return { worklist, error, retry };
}
