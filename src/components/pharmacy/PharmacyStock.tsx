import React, { useId, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, PackagePlus } from 'lucide-react';
import { pharmacyAgentService } from '../../services';
import { useErAction } from '../er/useErAction';
import type { UsePharmacyStock } from '../../hooks/usePharmacyStock';
import { MOVEMENT_LIMIT } from '../../hooks/usePharmacyStock';
import type { PharmacyBatchView, PharmacyMovement, PharmacyStockRow, PharmacyStore } from '../../types';
import { displayDateTime, displayDay } from '../../utils/clinicDate';
import { tableMin } from '../../utils/layout';
import { ADJUST_REASON_LABEL, STORE_LABEL } from '../../utils/pharmacy';
import { AdjustDialog, ReceiveDialog } from './StockDialogs';

const rowKey = (r: Pick<PharmacyStockRow, 'product' | 'store'>) => `${r.product}|${r.store}`;
const KIND_LABEL: Record<string, string> = { received: 'Received', issued: 'Issued', adjusted: 'Adjusted' };

interface PharmacyStockProps {
  data: UsePharmacyStock;
  canStock: boolean;
  /** After Receive, Adjust, Remove or a level change: the stock reloads and the header bell recounts. */
  onChanged(): void;
}

/** The Stock tab: each product in each store, its batches, reorder level and the movement log. */
export const PharmacyStock: React.FC<PharmacyStockProps> = ({ data, canStock, onChanged }) => {
  const { stock, movements, error, filter, setFilter, reload } = data;
  const uid = useId();
  const [receiving, setReceiving] = useState<{ product: string; store: PharmacyStore } | 'new' | null>(null);
  const [adjusting, setAdjusting] = useState<{ row: PharmacyStockRow; batch: PharmacyBatchView } | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [storeFilter, setStoreFilter] = useState<PharmacyStore | ''>('');
  const [lowOnly, setLowOnly] = useState(false);

  const done = () => {
    reload();
    onChanged();
  };
  const toggle = (k: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (!next.delete(k)) next.add(k);
      return next;
    });

  const rows = useMemo(() => (stock ?? []).filter((r) => (!storeFilter || r.store === storeFilter) && (!lowOnly || r.low)), [stock, storeFilter, lowOnly]);
  const products = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of stock ?? []) seen.set(r.product, r.label);
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [stock]);
  const lowCount = (stock ?? []).filter((r) => r.low).length;

  return (
    <div className="bagent-overview lab-body">
      <section className="medios-card bagent-card lab-card" aria-label="Stock">
        <div className="card-header-row">
          <div className="bagent-title-group">
            <h3 className="card-title">Stock</h3>
            <span className="bagent-hint">{stock ? `${stock.length} product and store rows${lowCount ? ` · ${lowCount} low` : ''}` : ''}</span>
          </div>
          {canStock && (
            <button type="button" className="btn-primary btn-sm" onClick={() => setReceiving('new')}>
              <PackagePlus size={14} aria-hidden="true" />
              Receive stock
            </button>
          )}
        </div>
        <div className="lab-filter-row">
          <div className="lab-area">
            <label className="form-label" htmlFor={`${uid}-store`}>Store</label>
            <select id={`${uid}-store`} className="form-select" value={storeFilter} onChange={(e) => setStoreFilter(e.target.value as PharmacyStore | '')}>
              <option value="">Both stores</option>
              <option value="main">{STORE_LABEL.main}</option>
              <option value="er">{STORE_LABEL.er}</option>
            </select>
          </div>
          <label className="admit-stay">
            <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
            Low stock only
          </label>
        </div>
        {!canStock && <p className="er-hint lab-readonly">You can see the stock. The pharmacist receives and adjusts it.</p>}
        {!stock ? (
          error ? (
            <p className="data-empty" role="alert">
              {error}{' '}
              <button type="button" className="btn-secondary btn-sm" onClick={reload}>
                Try again
              </button>
            </p>
          ) : (
            <p className="data-empty">Loading the stock…</p>
          )
        ) : rows.length === 0 ? (
          <p className="data-empty">{lowOnly ? 'No product is low.' : 'No stock matches.'}</p>
        ) : (
          <div className="table-scroll" style={tableMin(720)}>
            <table className="data-table lab-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Store</th>
                  <th scope="col">In stock</th>
                  <th scope="col">Reorder level</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const k = rowKey(r);
                  const expanded = open.has(k);
                  return (
                    <React.Fragment key={k}>
                      <tr className={r.low ? 'is-late' : undefined}>
                        <td>
                          <button type="button" className="lab-later-toggle" aria-expanded={expanded} aria-label={`${expanded ? 'Hide' : 'Show'} batches of ${r.label} in ${STORE_LABEL[r.store]}`} onClick={() => toggle(k)}>
                            {expanded ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                            <span className="er-name">{r.label}</span>
                          </button>
                        </td>
                        <td>{STORE_LABEL[r.store]}</td>
                        <td className="lab-num">{r.usable}</td>
                        <td>
                          <LevelCell row={r} canStock={canStock} onSaved={done} />
                        </td>
                        <td>
                          <span className="ph-tags">
                            {r.low && <span className="status-pill sm red">Low</span>}
                            {r.nearExpiry > 0 && <span className="status-pill sm orange">{r.nearExpiry} near expiry</span>}
                            {r.expired > 0 && <span className="status-pill sm red">{r.expired} expired</span>}
                            {!r.low && r.nearExpiry === 0 && r.expired === 0 && <span className="er-hint">OK</span>}
                          </span>
                        </td>
                        <td>
                          {canStock && (
                            <button type="button" className="btn-secondary btn-sm" aria-label={`Receive ${r.label} into ${STORE_LABEL[r.store]}`} onClick={() => setReceiving({ product: r.product, store: r.store })}>
                              Receive
                            </button>
                          )}
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="ph-batch-row">
                          <td colSpan={6}>
                            <BatchTable row={r} canStock={canStock} onAdjust={(batch) => setAdjusting({ row: r, batch })} onRemoved={done} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="medios-card bagent-card lab-card" aria-label="Stock movements">
        <div className="card-header-row">
          <div className="bagent-title-group">
            <h3 className="card-title">Movement log</h3>
            <span className="bagent-hint">{movements ? `Newest ${MOVEMENT_LIMIT}${movements.length >= MOVEMENT_LIMIT ? '' : `: ${movements.length} so far`}` : ''}</span>
          </div>
        </div>
        <div className="lab-filter-row">
          <div className="lab-area">
            <label className="form-label" htmlFor={`${uid}-mproduct`}>Product</label>
            <select id={`${uid}-mproduct`} className="form-select" value={filter.product} onChange={(e) => setFilter({ ...filter, product: e.target.value })}>
              <option value="">All products</option>
              {products.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="lab-area">
            <label className="form-label" htmlFor={`${uid}-mstore`}>Store</label>
            <select id={`${uid}-mstore`} className="form-select" value={filter.store} onChange={(e) => setFilter({ ...filter, store: e.target.value as PharmacyStore | '' })}>
              <option value="">Both stores</option>
              <option value="main">{STORE_LABEL.main}</option>
              <option value="er">{STORE_LABEL.er}</option>
            </select>
          </div>
        </div>
        {!movements ? (
          <p className="data-empty">{error ? 'The movements could not be loaded.' : 'Loading the movements…'}</p>
        ) : movements.length === 0 ? (
          <p className="data-empty">No stock has moved yet.</p>
        ) : (
          <MovementTable movements={movements} />
        )}
      </section>

      {receiving && <ReceiveDialog initial={receiving === 'new' ? undefined : receiving} onClose={() => setReceiving(null)} onDone={done} />}
      {adjusting && <AdjustDialog row={adjusting.row} batch={adjusting.batch} onClose={() => setAdjusting(null)} onDone={done} />}
    </div>
  );
};

/** The reorder level: a number that saves on Save or Enter, for those who may change it. */
const LevelCell: React.FC<{ row: PharmacyStockRow; canStock: boolean; onSaved(): void }> = ({ row, canStock, onSaved }) => {
  const uid = useId();
  const { busy, error, setError, run } = useErAction();
  const [text, setText] = useState<string | null>(null);
  if (!canStock) return <span className="lab-num">{row.reorderLevel || '—'}</span>;
  const value = text ?? String(row.reorderLevel);
  const n = Number(value);
  const valid = value.trim() !== '' && Number.isInteger(n) && n >= 0 && n <= 100000;
  const dirty = text !== null && text !== String(row.reorderLevel);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !dirty) return;
    const ok = await run('level', () => pharmacyAgentService.setLevel({ product: row.product, store: row.store, reorderLevel: n }));
    if (!ok) return;
    setText(null);
    onSaved();
  };

  return (
    <form className="ph-level" onSubmit={(e) => void save(e)}>
      <input
        id={uid}
        className="input-field ph-level-input"
        type="number"
        inputMode="numeric"
        min={0}
        max={100000}
        step={1}
        aria-label={`Reorder level of ${row.label} in ${STORE_LABEL[row.store]}`}
        aria-invalid={!valid}
        value={value}
        onChange={(e) => { setText(e.target.value); setError(null); }}
      />
      {dirty && (
        <button type="submit" className="btn-secondary btn-sm" disabled={!valid || busy !== null}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      )}
      {error && (
        <span className="er-error" role="alert">
          {error}
        </span>
      )}
    </form>
  );
};

const BatchTable: React.FC<{ row: PharmacyStockRow; canStock: boolean; onAdjust(b: PharmacyBatchView): void; onRemoved(): void }> = ({ row, canStock, onAdjust, onRemoved }) => {
  const { busy, error, run } = useErAction();
  const remove = async (b: PharmacyBatchView) => {
    const ok = await run(b.id, () => pharmacyAgentService.removeExpired(b.id));
    if (ok) onRemoved();
  };
  return (
    <div className="ph-batch-table">
      {row.batches.length === 0 ? (
        <p className="er-hint">No batch holds stock.</p>
      ) : (
        <ul className="ph-batch-rows" aria-label={`Batches of ${row.label}`}>
          {row.batches.map((b) => (
            <li key={b.id} className="ph-batch-line">
              <span className="lab-num">{b.batchNo}</span>
              <span className="er-sub">expires {displayDay(b.expiry)}</span>
              <span className="lab-num">{b.quantity} left</span>
              {b.expired && <span className="status-pill sm red">Expired</span>}
              {b.nearExpiry && <span className="status-pill sm orange">Near expiry</span>}
              {canStock && (
                <span className="ph-batch-actions">
                  <button type="button" className="btn-secondary btn-sm" aria-label={`Adjust batch ${b.batchNo} of ${row.label}`} disabled={busy !== null} onClick={() => onAdjust(b)}>
                    Adjust
                  </button>
                  {b.expired && (
                    <button type="button" className="btn-secondary btn-sm" aria-label={`Remove expired batch ${b.batchNo} of ${row.label}`} disabled={busy !== null} onClick={() => void remove(b)}>
                      {busy === b.id ? 'Removing…' : 'Remove'}
                    </button>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className="er-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

const MovementTable: React.FC<{ movements: PharmacyMovement[] }> = ({ movements }) => (
  <div className="table-scroll" style={tableMin(640)}>
    <table className="data-table lab-table">
      <thead>
        <tr>
          <th scope="col">When</th>
          <th scope="col">Product</th>
          <th scope="col">Store</th>
          <th scope="col">Change</th>
          <th scope="col">What</th>
          <th scope="col">By</th>
        </tr>
      </thead>
      <tbody>
        {movements.map((m) => (
          <tr key={m.id}>
            <td className="lab-time">{displayDateTime(new Date(m.at))}</td>
            <td>{m.label}</td>
            <td>{STORE_LABEL[m.store]}</td>
            <td className={`lab-num ${m.change < 0 ? 'ph-out' : 'ph-in'}`}>{m.change > 0 ? `+${m.change}` : m.change}</td>
            <td>
              {KIND_LABEL[m.kind] ?? m.kind}
              {m.reason ? <span className="er-sub lab-block">{ADJUST_REASON_LABEL[m.reason] ?? m.reason}</span> : null}
            </td>
            <td>{m.by.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
