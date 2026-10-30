import { useCallback, useEffect, useState } from 'react';
import { pharmacyAgentService } from '../services';
import { errorMessage } from '../services/api';
import type { PharmacyMovement, PharmacyStockRow, PharmacyStore } from '../types';

/** The movement log shows this many entries, newest first. */
export const MOVEMENT_LIMIT = 100;

export interface MovementFilter {
  product: string;
  store: PharmacyStore | '';
}

export interface UsePharmacyStock {
  stock: PharmacyStockRow[] | null;
  movements: PharmacyMovement[] | null;
  /** The latest load failed; `reload` tries again. */
  error: string | null;
  filter: MovementFilter;
  setFilter(next: MovementFilter): void;
  /** Reload the stock and the log now (after Receive, Adjust, Remove or a level change). */
  reload(): void;
}

/** The Stock tab's data. It loads only while the tab is open (`active`), and the log reloads when its filter changes. */
export function usePharmacyStock(active: boolean): UsePharmacyStock {
  const [stock, setStock] = useState<PharmacyStockRow[] | null>(null);
  const [movements, setMovements] = useState<PharmacyMovement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MovementFilter>({ product: '', store: '' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    Promise.all([
      pharmacyAgentService.stock(),
      pharmacyAgentService.movements({ limit: MOVEMENT_LIMIT, ...(filter.product && { product: filter.product }), ...(filter.store && { store: filter.store }) })
    ])
      .then(([nextStock, nextMovements]) => {
        if (!alive) return;
        setStock(nextStock);
        setMovements(nextMovements);
        setError(null);
      })
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [active, filter, version]);

  const reload = useCallback(() => setVersion((n) => n + 1), []);
  return { stock, movements, error, filter, setFilter, reload };
}
