import { DependencyList, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/appContextCore';
import { errorMessage } from '../services/api';

/**
 * Runs `load` when the screen mounts and whenever `deps` change, handing the result
 * to `onData` (usually the screen's own state setter). Responses from a superseded
 * run are dropped, and failures surface as an error toast.
 */
export function useLoader<T>(load: () => Promise<T>, onData: (data: T) => void, deps: DependencyList) {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const latest = useRef({ load, onData, showToast });
  latest.current = { load, onData, showToast };

  useEffect(() => {
    let current = true;
    setLoading(true);
    latest.current
      .load()
      .then((data) => current && latest.current.onData(data))
      .catch((err) => current && latest.current.showToast(errorMessage(err), 'error'))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
    // `deps` is the caller's dependency list, as with useEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return { loading, reload: () => setVersion((v) => v + 1) };
}
