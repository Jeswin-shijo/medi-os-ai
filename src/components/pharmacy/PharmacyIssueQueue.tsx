import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { ScanLine } from 'lucide-react';
import { pharmacyAgentService } from '../../services';
import { errorMessage } from '../../services/api';
import { useErAction } from '../er/useErAction';
import type { PharmacyIssueOptions, PharmacyLineView, PharmacyStore } from '../../types';
import { displayDay } from '../../utils/clinicDate';
import { BATCH_NO, ISSUE_GROUPS, STORE_LABEL, issueGroupOf } from '../../utils/pharmacy';
import { PharmacyLineCard } from './PharmacyLineCard';

const STORES: PharmacyStore[] = ['main', 'er'];
const MAX_QTY = 10000;

interface PharmacyIssueQueueProps {
  lines: PharmacyLineView[] | null;
  error: string | null;
  canIssue: boolean;
  onRetry(): void;
  /** After an issue or Out of stock: the lists and the header bell reload. */
  onChanged(): void;
}

/** The To issue tab: approved lines, grouped ER, Main pharmacy and OPD counter, each issued from stock. */
export const PharmacyIssueQueue: React.FC<PharmacyIssueQueueProps> = ({ lines, error, canIssue, onRetry, onChanged }) => {
  const groups = useMemo(() => ISSUE_GROUPS.map((g) => ({ title: g, lines: (lines ?? []).filter((l) => issueGroupOf(l) === g) })).filter((g) => g.lines.length > 0), [lines]);
  return (
    <div className="bagent-overview lab-body">
      <section className="medios-card bagent-card lab-card" aria-label="Lines to issue">
        <div className="card-header-row">
          <div className="bagent-title-group">
            <h3 className="card-title">To issue</h3>
            <span className="bagent-hint">{lines ? `${lines.length} ${lines.length === 1 ? 'line' : 'lines'} approved · oldest expiry first` : ''}</span>
          </div>
        </div>
        {!canIssue && <p className="er-hint lab-readonly">You can see this list. The pharmacist issues the medicines.</p>}
        {!lines ? (
          error ? (
            <p className="data-empty" role="alert">
              {error}{' '}
              <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>
                Try again
              </button>
            </p>
          ) : (
            <p className="data-empty">Loading the lines to issue…</p>
          )
        ) : groups.length === 0 ? (
          <p className="data-empty">Nothing is waiting to be issued.</p>
        ) : (
          groups.map((g) => (
            <section key={g.title} className="lab-loc" aria-label={g.title}>
              <h4 className="lab-loc-title">
                {g.title} <span className="er-hint">({g.lines.length})</span>
              </h4>
              <ul className="ph-cards">
                {g.lines.map((l) => (
                  <PharmacyLineCard
                    key={l.id}
                    line={l}
                    due="issue"
                    actions={
                      <>
                        {l.waitingForStock && (
                          <p className="ph-wait">
                            <span className="status-pill sm orange">Waiting for stock</span>
                            <span className="er-hint">The doctor chose to wait. Issue it once stock arrives.</span>
                          </p>
                        )}
                        {canIssue && <IssueActions line={l} onChanged={onChanged} />}
                      </>
                    }
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </section>
    </div>
  );
};

const IssueActions: React.FC<{ line: PharmacyLineView; onChanged(): void }> = ({ line, onChanged }) => {
  const uid = useId();
  const { busy, error, setError, run } = useErAction();
  const [options, setOptions] = useState<PharmacyIssueOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [store, setStore] = useState<PharmacyStore | null>(null);
  const [batchNo, setBatchNo] = useState('');
  const [qty, setQty] = useState('');

  const refresh = useCallback(() => setTries((n) => n + 1), []);

  // The stock of both stores: loaded with the card, and again after a refused issue.
  useEffect(() => {
    let alive = true;
    pharmacyAgentService
      .issueOptions(line.id)
      .then((o) => {
        if (!alive) return;
        setOptions(o);
        setOptionsError(null);
      })
      .catch((err) => alive && setOptionsError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [line.id, line.version, line.waitingForStock, tries]);

  const unlisted = line.product === null;
  const unknownQty = (options?.quantity ?? line.quantity) === null;
  const typed = Number(qty);
  const typedOk = Number.isInteger(typed) && typed >= 1 && typed <= MAX_QTY;
  const need = options?.quantity ?? line.quantity ?? (typedOk ? typed : 1);
  const chosen: PharmacyStore = store ?? options?.defaultStore ?? line.defaultStore;
  const usableIn = (s: PharmacyStore) => options?.stores.find((x) => x.store === s)?.usable ?? 0;
  const covers = (s: PharmacyStore) => unlisted || usableIn(s) >= need;
  const other: PharmacyStore = chosen === 'er' ? 'main' : 'er';
  const outOfStock = !!options && !unlisted && !covers('main') && !covers('er');
  const batches = options?.stores.find((s) => s.store === chosen)?.batches ?? [];
  const opd = line.setting === 'OPD';
  const verb = opd ? 'Hand over' : 'Issue';

  const typedBatch = batchNo.trim();
  const batchOk = typedBatch === '' || BATCH_NO.test(typedBatch);
  const ready = !!options && batchOk && (!unknownQty || typedOk);

  const issue = async (from: PharmacyStore) => {
    if (!ready) return;
    const body: { store: PharmacyStore; batchNo?: string; quantity?: number } = { store: from };
    // A batch typed for one store is not carried to the other.
    if (typedBatch && from === chosen) body.batchNo = typedBatch;
    if (unknownQty) body.quantity = typed;
    const ok = await run('issue', () => pharmacyAgentService.issue(line.id, body));
    if (ok) onChanged();
    else refresh();
  };

  const askQuery = async () => {
    const ok = await run('stock', () => pharmacyAgentService.outOfStock(line.id));
    if (ok) onChanged();
    else refresh();
  };

  const pickStore = (s: PharmacyStore) => {
    setStore(s);
    setBatchNo('');
    setError(null);
  };

  return (
    <div className="ph-actions">
      {optionsError ? (
        <p className="er-error" role="alert">
          {optionsError}{' '}
          <button type="button" className="btn-secondary btn-sm" onClick={refresh}>
            Try again
          </button>
        </p>
      ) : !options ? (
        <p className="er-hint">Loading the stock…</p>
      ) : (
        <>
          <fieldset className="admit-fieldset">
            <legend className="form-label">Issue from</legend>
            <div className="admit-options">
              {STORES.map((s) => (
                <label key={s} className={`admit-option${chosen === s ? ' is-on' : ''}`}>
                  <input type="radio" name={`${uid}-store`} value={s} checked={chosen === s} disabled={busy !== null} onChange={() => pickStore(s)} />
                  {STORE_LABEL[s]} {unlisted ? '' : `(${usableIn(s)} in stock)`}
                </label>
              ))}
            </div>
          </fieldset>

          {!unlisted && (
            <div className="ph-batches">
              {batches.length === 0 ? (
                <p className="er-hint">No unexpired stock in {STORE_LABEL[chosen]}.</p>
              ) : (
                <ul className="ph-batch-list" aria-label={`Batches in ${STORE_LABEL[chosen]}`}>
                  {batches.map((b, i) => (
                    <li key={b.id}>
                      <button type="button" className={`ph-batch${typedBatch === b.batchNo ? ' is-on' : ''}`} disabled={busy !== null} onClick={() => setBatchNo(b.batchNo)} data-tip={`Use batch ${b.batchNo}`}>
                        <span className="lab-num">{b.batchNo}</span>
                        <span className="er-hint">exp {displayDay(b.expiry)} · {b.quantity} left</span>
                        {i === 0 && <span className="status-pill sm blue">Oldest expiry</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!covers(chosen) && covers(other) && (
            <div className="admit-notice is-info" role="status">
              <div className="admit-notice-body">
                <p>
                  {STORE_LABEL[chosen]} has {usableIn(chosen)} {line.issueUnit}, and this line needs {need}. {STORE_LABEL[other]} has enough.
                </p>
                <button type="button" className="btn-secondary btn-sm" disabled={!ready || busy !== null} onClick={() => void issue(other)}>
                  Issue from {STORE_LABEL[other]} ({usableIn(other)} left)
                </button>
              </div>
            </div>
          )}

          <form
            className="ph-issue-form"
            onSubmit={(e) => {
              e.preventDefault();
              void issue(chosen);
            }}
          >
            {unknownQty && (
              <div className="ph-issue-qty">
                <label className="form-label" htmlFor={`${uid}-qty`}>Quantity{line.issueUnit ? ` (${line.issueUnit})` : ''}</label>
                <input id={`${uid}-qty`} className="input-field" type="number" inputMode="numeric" min={1} max={MAX_QTY} step={1} value={qty} onChange={(e) => { setQty(e.target.value); setError(null); }} />
              </div>
            )}
            {!unlisted && (
              <div className="ph-issue-scan">
                <label className="form-label" htmlFor={`${uid}-batch`}>Scan or type the batch number (blank: oldest expiry)</label>
                <div className="admit-search">
                  <ScanLine size={15} aria-hidden="true" />
                  <input
                    id={`${uid}-batch`}
                    className="input-field"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={40}
                    value={batchNo}
                    aria-invalid={!batchOk}
                    onChange={(e) => { setBatchNo(e.target.value); setError(null); }}
                  />
                </div>
                {!batchOk && <p className="er-error" role="alert">A batch number has letters, digits, &quot;/&quot; or &quot;-&quot; only.</p>}
              </div>
            )}
            <div className="ph-action-row">
              <button type="submit" className="btn-primary btn-sm" disabled={!ready || busy !== null}>
                {busy === 'issue' ? (opd ? 'Handing over…' : 'Issuing…') : verb}
              </button>
              <span data-tip={outOfStock ? undefined : 'There is stock in a store: issue it'} className="ph-tip-wrap">
                <button type="button" className="btn-secondary btn-sm" disabled={!outOfStock || busy !== null} onClick={() => void askQuery()}>
                  {busy === 'stock' ? 'Asking the doctor…' : 'Out of stock'}
                </button>
              </span>
            </div>
          </form>
        </>
      )}
      {error && (
        <p className="er-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
