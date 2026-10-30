import React, { useEffect, useId, useMemo, useState } from 'react';
import { PackagePlus, SlidersHorizontal } from 'lucide-react';
import { pharmacyAgentService } from '../../services';
import { errorMessage } from '../../services/api';
import { useErAction } from '../er/useErAction';
import type { PharmacyBatchView, PharmacyCatalogue, PharmacyStockRow, PharmacyStore } from '../../types';
import { displayDay, isoDay } from '../../utils/clinicDate';
import { ADJUST_REASON_LABEL, BATCH_NO, STORE_LABEL } from '../../utils/pharmacy';
import { LabDialogShell } from '../lab/LabDialogShell';

const MAX_QTY = 10000;
const STORES: PharmacyStore[] = ['main', 'er'];

interface ReceiveDialogProps {
  /** Pre-fill from a stock row (Receive on that product and store). */
  initial?: { product: string; store: PharmacyStore };
  onClose(): void;
  onDone(): void;
}

/** Receive a batch into a store: product, store, batch number, expiry and quantity. */
export const ReceiveDialog: React.FC<ReceiveDialogProps> = ({ initial, onClose, onDone }) => {
  const uid = useId();
  const { busy, error, setError, run } = useErAction();
  const [catalogue, setCatalogue] = useState<PharmacyCatalogue | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [product, setProduct] = useState(initial?.product ?? '');
  const [store, setStore] = useState<PharmacyStore>(initial?.store ?? 'main');
  const [batchNo, setBatchNo] = useState('');
  const [expiry, setExpiry] = useState('');
  const [qty, setQty] = useState('');

  useEffect(() => {
    let alive = true;
    pharmacyAgentService
      .catalogue()
      .then((c) => {
        if (!alive) return;
        setCatalogue(c);
        setLoadError(null);
      })
      .catch((err) => alive && setLoadError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [tries]);

  const products = useMemo(() => (catalogue?.medicines ?? []).flatMap((m) => m.products.map((p) => ({ key: p.key, label: p.label }))).sort((a, b) => a.label.localeCompare(b.label)), [catalogue]);

  const day = isoDay();
  const quantity = Number(qty);
  const batch = batchNo.trim();
  const problem = !product
    ? 'Choose the product.'
    : !BATCH_NO.test(batch)
      ? 'Enter the batch number: letters, digits, ".", "/", "-" or inner spaces, up to 40 characters.'
      : !/^\d{4}-\d{2}-\d{2}$/.test(expiry)
        ? 'Enter the expiry date.'
        : expiry < day
          ? 'This batch has already expired.'
          : !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY
            ? `Quantity is a whole number from 1 to ${MAX_QTY}.`
            : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (problem) return;
    const ok = await run('receive', () => pharmacyAgentService.receive({ product, store, batchNo: batch, expiry, quantity }));
    if (!ok) return;
    onDone();
    onClose();
  };

  return (
    <LabDialogShell title="Receive stock" icon={<PackagePlus size={18} color="var(--blue-text)" aria-hidden="true" />} busy={busy !== null} onClose={onClose}>
      <form onSubmit={(e) => void submit(e)}>
        <div className="modal-body admit-body ph-order-body">
          {!catalogue ? (
            loadError ? (
              <p className="er-error" role="alert">
                {loadError}{' '}
                <button type="button" className="btn-secondary btn-sm" onClick={() => setTries((n) => n + 1)}>
                  Try again
                </button>
              </p>
            ) : (
              <p className="data-empty">Loading the medicine list…</p>
            )
          ) : (
            <>
              <div>
                <label className="form-label" htmlFor={`${uid}-product`}>Product</label>
                <select id={`${uid}-product`} className="form-select" value={product} onChange={(e) => { setProduct(e.target.value); setError(null); }}>
                  <option value="">Choose a product</option>
                  {products.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>
              <fieldset className="admit-fieldset">
                <legend className="form-label">Store</legend>
                <div className="admit-options">
                  {STORES.map((s) => (
                    <label key={s} className={`admit-option${store === s ? ' is-on' : ''}`}>
                      <input type="radio" name={`${uid}-store`} value={s} checked={store === s} onChange={() => setStore(s)} />
                      {STORE_LABEL[s]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="ph-line-grid">
                <div>
                  <label className="form-label" htmlFor={`${uid}-batch`}>Batch number</label>
                  <input id={`${uid}-batch`} className="input-field" style={{ fontFamily: 'var(--font-mono)' }} autoComplete="off" spellCheck={false} maxLength={40} value={batchNo} onChange={(e) => { setBatchNo(e.target.value); setError(null); }} />
                </div>
                <div>
                  <label className="form-label" htmlFor={`${uid}-expiry`}>Expiry date</label>
                  <input id={`${uid}-expiry`} className="input-field" type="date" min={day} value={expiry} onChange={(e) => { setExpiry(e.target.value); setError(null); }} />
                </div>
                <div>
                  <label className="form-label" htmlFor={`${uid}-qty`}>Quantity</label>
                  <input id={`${uid}-qty`} className="input-field" type="number" inputMode="numeric" min={1} max={MAX_QTY} step={1} value={qty} onChange={(e) => { setQty(e.target.value); setError(null); }} />
                </div>
              </div>
              {problem && (batchNo || expiry || qty) && <p className="admit-hint">{problem}</p>}
            </>
          )}
        </div>
        {error && (
          <p className="admit-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy !== null}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!!problem || busy !== null}>
            {busy ? 'Receiving…' : 'Receive stock'}
          </button>
        </div>
      </form>
    </LabDialogShell>
  );
};

interface AdjustDialogProps {
  row: PharmacyStockRow;
  batch: PharmacyBatchView;
  onClose(): void;
  onDone(): void;
}

/** Adjust one batch: a change (minus takes stock out) and why. */
export const AdjustDialog: React.FC<AdjustDialogProps> = ({ row, batch, onClose, onDone }) => {
  const uid = useId();
  const { busy, error, setError, run } = useErAction();
  const [change, setChange] = useState('');
  const [reason, setReason] = useState('damaged');

  const n = Number(change);
  const valid = change.trim() !== '' && Number.isInteger(n) && n !== 0 && Math.abs(n) <= 100000;
  const after = valid ? batch.quantity + n : null;
  const ready = valid && after !== null && after >= 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    const ok = await run('adjust', () => pharmacyAgentService.adjust(batch.id, { change: n, reason }));
    if (!ok) return;
    onDone();
    onClose();
  };

  return (
    <LabDialogShell title="Adjust a batch" icon={<SlidersHorizontal size={18} color="var(--blue-text)" aria-hidden="true" />} busy={busy !== null} onClose={onClose}>
      <form onSubmit={(e) => void submit(e)}>
        <div className="modal-body admit-body ph-order-body">
          <p className="admit-patient-name">{row.label}</p>
          <p className="er-sub">
            {STORE_LABEL[row.store]} · batch <span className="lab-num">{batch.batchNo}</span> · expires {displayDay(batch.expiry)} · {batch.quantity} in the batch
          </p>
          <div className="ph-line-grid">
            <div>
              <label className="form-label" htmlFor={`${uid}-change`}>Change (use minus to take out)</label>
              <input id={`${uid}-change`} className="input-field" type="number" inputMode="numeric" step={1} value={change} onChange={(e) => { setChange(e.target.value); setError(null); }} autoFocus />
            </div>
            <div>
              <label className="form-label" htmlFor={`${uid}-reason`}>Reason</label>
              <select id={`${uid}-reason`} className="form-select" value={reason} onChange={(e) => setReason(e.target.value)}>
                {Object.entries(ADJUST_REASON_LABEL).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="admit-hint" aria-live="polite">
            {after === null ? 'Enter a whole number that is not 0.' : after < 0 ? `That would leave ${after}. A batch cannot go below 0.` : `${after} will be left in the batch.`}
          </p>
        </div>
        {error && (
          <p className="admit-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy !== null}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!ready || busy !== null}>
            {busy ? 'Saving…' : 'Save adjustment'}
          </button>
        </div>
      </form>
    </LabDialogShell>
  );
};
