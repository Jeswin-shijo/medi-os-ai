import { useCallback, useRef, useState } from 'react';
import { errorMessage } from '../../services/api';

/**
 * One action at a time with a busy name and the server's message. A second call while one runs is ignored,
 * so a double click never sends twice.
 */
export function useErAction() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);

  const run = useCallback(async <T,>(name: string, fn: () => Promise<T>): Promise<T | undefined> => {
    if (locked.current) return undefined;
    locked.current = true;
    setBusy(name);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(errorMessage(err));
      return undefined;
    } finally {
      locked.current = false;
      setBusy(null);
    }
  }, []);

  return { busy, error, setError, run };
}
