import React, { useCallback, useEffect, useId, useState } from 'react';
import { AlertTriangle, Printer, Search } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { labAgentService } from '../../services';
import { errorMessage } from '../../services/api';
import { useErAction } from '../er/useErAction';
import type { LabArea, LabLineView, LabRequestQuery, LabRequestView } from '../../types';
import { displayTime } from '../../utils/clinicDate';
import { LINE_STATUS_LABEL, PRIORITY_LABEL, PRIORITY_TONE, canCollectLab, locationText, requestStatus } from '../../utils/lab';

const AREAS: LabArea[] = ['ER', 'Ward', 'OPD'];
type StatusFilter = 'all' | 'open' | 'done';
const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'done', label: 'Done' }
];
const LINE_TONE: Record<LabLineView['status'], string> = { ordered: 'orange', collected: 'blue', received: 'blue', 'awaiting-validation': 'blue', released: 'green', cancelled: 'gray' };

interface LabOrdersProps {
  /** Changes whenever the Lab's lists reload: this tab then fetches its own filtered list again. */
  refresh: unknown;
  onChanged(): void;
  onPrint(request: LabRequestView): void;
}

/** The Orders tab: every request with its lines and their status, with search, a status filter and an area filter. */
export const LabOrders: React.FC<LabOrdersProps> = ({ refresh, onChanged, onPrint }) => {
  const { user } = useApp();
  const role = user?.role ?? '';
  const uid = useId();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [area, setArea] = useState<LabArea | ''>('');
  const [requests, setRequests] = useState<LabRequestView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let alive = true;
    const q: LabRequestQuery = { ...(status !== 'all' && { status }), ...(debounced && { search: debounced }), ...(area && { area }) };
    labAgentService
      .requests(q)
      .then((r) => {
        if (!alive) return;
        setRequests(r);
        setError(null);
      })
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [status, debounced, area, refresh, tries]);

  const filtered = status !== 'all' || debounced !== '' || area !== '';

  return (
    <div className="bagent-overview lab-body">
      <section className="medios-card bagent-card lab-card" aria-label="Lab orders">
        <div className="card-header-row">
          <div className="bagent-title-group">
            <h3 className="card-title">Lab orders</h3>
            <span className="bagent-hint">{requests ? `${requests.length} shown` : ''}</span>
          </div>
        </div>
        <div className="lab-filter-row">
          <div className="admit-search lab-search">
            <Search size={15} aria-hidden="true" />
            <input className="input-field" type="search" autoComplete="off" placeholder="Search patient, UHID or order number" aria-label="Search orders" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="bagent-filters" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((f) => (
              <button key={f.id} type="button" className={`chip-btn${status === f.id ? ' active' : ''}`} aria-pressed={status === f.id} onClick={() => setStatus(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="lab-area">
            <label className="form-label" htmlFor={`${uid}-area`}>Area</label>
            <select id={`${uid}-area`} className="form-select" value={area} onChange={(e) => setArea(e.target.value as LabArea | '')}>
              <option value="">All areas</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {!requests ? (
          error ? (
            <p className="data-empty" role="alert">
              {error}{' '}
              <button type="button" className="btn-secondary btn-sm" onClick={() => setTries((n) => n + 1)}>
                Try again
              </button>
            </p>
          ) : (
            <p className="data-empty">Loading orders…</p>
          )
        ) : requests.length === 0 ? (
          <p className="data-empty">{filtered ? 'No orders match these filters.' : 'No lab orders yet.'}</p>
        ) : (
          <>
            {error && <p className="bagent-banner" role="alert">Showing the last list loaded. {error}</p>}
            <ul className="lab-orders">
              {requests.map((r) => (
                <OrderCard key={r.id} request={r} userId={user?.id ?? ''} role={role} onChanged={onChanged} onPrint={onPrint} />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
};

const OrderCard: React.FC<{ request: LabRequestView; userId: string; role: string; onChanged(): void; onPrint(r: LabRequestView): void }> = ({ request: r, userId, role, onChanged, onPrint }) => {
  const st = requestStatus(r);
  const mayCancel = role === 'admin' || (role === 'doctor' && r.orderedBy.id === userId);
  return (
    <li className="lab-order">
      <div className="lab-order-head">
        <span className="lab-num">{r.number}</span>
        <span className={`status-pill sm ${PRIORITY_TONE[r.priority]}`}>{PRIORITY_LABEL[r.priority]}</span>
        <span className={`status-pill sm ${st.tone}`}>{st.label}</span>
        <span className="lab-order-patient">
          <span className="er-name">{r.patientName}</span> <span className="er-sub">{r.patientUhid} · {locationText(r.location)}</span>
        </span>
        <span className="er-hint lab-order-meta">
          {r.orderedBy.name} · {displayTime(new Date(r.orderedAt))}
          {r.scheduledFor ? ` · scheduled ${displayTime(new Date(r.scheduledFor))}` : ''}
        </span>
        {canCollectLab(role) && r.samples.length > 0 && (
          <button type="button" className="btn-secondary btn-sm" aria-label={`Print labels for ${r.number}`} onClick={() => onPrint(r)}>
            <Printer size={14} aria-hidden="true" />
            Labels
          </button>
        )}
      </div>
      {r.note && <p className="er-hint lab-order-note">Note: {r.note}</p>}
      <ul className="lab-lines">
        {r.lines.map((l) => (
          <Line key={l.id} line={l} request={r} mayCancel={mayCancel} onChanged={onChanged} />
        ))}
      </ul>
    </li>
  );
};

const Line: React.FC<{ line: LabLineView; request: LabRequestView; mayCancel: boolean; onChanged(): void }> = ({ line: l, request: r, mayCancel, onChanged }) => {
  const uid = useId();
  const { busy, error, setError, run } = useErAction();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  const sample = r.samples.find((s) => s.lines.includes(l.id));
  const canCancel = mayCancel && l.status !== 'released' && l.status !== 'cancelled';
  const critical = !!l.critical?.active && l.status !== 'cancelled';

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = reason.trim();
      if (!text) return;
      const done = await run('cancel', () => labAgentService.cancelLine(l.id, text));
      if (!done) return;
      setAsking(false);
      setReason('');
      onChanged();
    },
    [l.id, onChanged, reason, run]
  );

  return (
    <li className="lab-line">
      <div className="lab-line-row">
        <span className="lab-line-name">{l.label}</span>
        <span className={`status-pill sm ${LINE_TONE[l.status]}`}>{LINE_STATUS_LABEL[l.status]}</span>
        {critical && (
          <span className="status-pill sm red lab-delayed">
            <AlertTriangle size={12} aria-hidden="true" />
            Critical
          </span>
        )}
        {sample && <span className="er-hint">Sample {sample.number} · {sample.rejected ? 'rejected' : sample.collected ? 'collected' : 'not collected'}</span>}
        {l.status === 'cancelled' && l.cancelled && <span className="er-hint">Cancelled: {l.cancelled.reason}</span>}
        {canCancel && !asking && (
          <button type="button" className="btn-danger-soft btn-sm lab-line-action" aria-label={`Cancel ${l.label} on ${r.number}`} onClick={() => { setAsking(true); setError(null); }}>
            Cancel line
          </button>
        )}
      </div>
      {asking && (
        <form className="lab-reason" onSubmit={(e) => void submit(e)}>
          <label className="form-label" htmlFor={`${uid}-reason`}>Reason for cancelling {l.label}</label>
          <div className="lab-reason-row">
            <input id={`${uid}-reason`} className="input-field" maxLength={300} autoFocus autoComplete="off" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button type="submit" className="btn-primary btn-sm" disabled={!reason.trim() || busy !== null}>
              {busy ? 'Cancelling…' : 'Cancel line'}
            </button>
            <button type="button" className="btn-secondary btn-sm" disabled={busy !== null} onClick={() => { setAsking(false); setError(null); }}>
              Keep
            </button>
          </div>
          {error && <p className="er-error" role="alert">{error}</p>}
        </form>
      )}
    </li>
  );
};
