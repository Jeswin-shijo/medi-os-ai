import React, { useId, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { labAgentService } from '../../services';
import { useErAction } from '../er/useErAction';
import type { LabLineView, LabRequestView, LabWorklist, LabWorklistLine } from '../../types';
import { clinicNow, displayTime } from '../../utils/clinicDate';
import { PRIORITY_LABEL, PRIORITY_TONE } from '../../utils/lab';
import { LabResultEntry, type EntryLine } from './LabResultEntry';
import { LabResultValues } from './LabResultValues';

const DAY_MS = 24 * 60 * 60 * 1000;

interface LabResultsProps {
  canBench: boolean;
  worklist: LabWorklist | null;
  requests: LabRequestView[] | null;
  error: string | null;
  onRetry(): void;
  /** After any action: the Lab lists and the header bell reload. */
  onChanged(): void;
}

interface Released {
  request: LabRequestView;
  line: LabLineView;
}

/** The Results tab: results awaiting a second person's validation, and what was released in the last 24 hours. */
export const LabResults: React.FC<LabResultsProps> = ({ canBench, worklist, requests, error, onRetry, onChanged }) => {
  const [amending, setAmending] = useState<EntryLine | null>(null);

  // Released times are staff-visible clinic times, so the 24 hours run on the clinic clock too.
  const released = useMemo<Released[]>(() => {
    const since = clinicNow().getTime() - DAY_MS;
    const out: Released[] = [];
    for (const request of requests ?? []) {
      for (const line of request.lines) {
        if (line.status === 'released' && line.releasedAt && new Date(line.releasedAt).getTime() >= since) out.push({ request, line });
      }
    }
    return out.sort((a, b) => new Date(b.line.releasedAt!).getTime() - new Date(a.line.releasedAt!).getTime());
  }, [requests]);

  if (!canBench) {
    return (
      <section className="medios-card bagent-card lab-card" aria-label="Results">
        <h3 className="card-title">Results</h3>
        <p className="data-empty">Lab staff only. Results are validated and released by the lab.</p>
      </section>
    );
  }

  return (
    <div className="bagent-overview lab-body">
      <section className="medios-card bagent-card lab-card" aria-label="Awaiting validation">
        <div className="card-header-row">
          <div className="bagent-title-group">
            <h3 className="card-title">Awaiting validation</h3>
            <span className="bagent-hint">{worklist ? `${worklist.toValidate.length} waiting` : ''}</span>
          </div>
        </div>
        {!worklist ? (
          error ? (
            <p className="data-empty" role="alert">
              {error}{' '}
              <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>
                Try again
              </button>
            </p>
          ) : (
            <p className="data-empty">Loading the results…</p>
          )
        ) : worklist.toValidate.length === 0 ? (
          <p className="data-empty">No results are waiting for validation.</p>
        ) : (
          <ul className="lab-work">
            {worklist.toValidate.map((l) => (
              <ValidateRow key={l.lineId} line={l} onChanged={onChanged} />
            ))}
          </ul>
        )}
      </section>

      <section className="medios-card bagent-card lab-card" aria-label="Recently released">
        <div className="card-header-row">
          <div className="bagent-title-group">
            <h3 className="card-title">Recently released</h3>
            <span className="bagent-hint">{requests ? `last 24 hours · ${released.length}` : ''}</span>
          </div>
        </div>
        {!requests ? (
          <p className="data-empty">Loading…</p>
        ) : released.length === 0 ? (
          <p className="data-empty">Nothing was released in the last 24 hours.</p>
        ) : (
          <ul className="lab-work">
            {released.map(({ request: r, line: l }) => (
              <li key={l.id} className="lab-work-row">
                <div className="lab-work-head">
                  <span className="lab-num">{r.number}</span>
                  <span className="lab-work-main">
                    <span className="er-name">{r.patientName}</span> <span className="er-sub">{r.patientUhid}</span>
                    <span className="er-sub lab-block">
                      {l.label} · released {displayTime(new Date(l.releasedAt!))}
                      {l.version > 1 ? ' · amended' : ''}
                    </span>
                  </span>
                  <span className="lab-work-actions">
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      aria-label={`Amend ${l.label}, ${r.number}`}
                      onClick={() => setAmending({ lineId: l.id, test: l.test, label: l.label, requestNumber: r.number, patientUhid: r.patientUhid, initial: l.results })}
                    >
                      Amend
                    </button>
                  </span>
                </div>
                <LabResultValues results={l.results} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {amending && <LabResultEntry line={amending} amend onClose={() => setAmending(null)} onSaved={onChanged} />}
    </div>
  );
};

const ValidateRow: React.FC<{ line: LabWorklistLine; onChanged(): void }> = ({ line: l, onChanged }) => {
  const uid = useId();
  const { user } = useApp();
  const { busy, error, setError, run } = useErAction();
  const [sending, setSending] = useState(false);
  const [reason, setReason] = useState('');
  // The worklist names who entered it but gives no id, so the names are compared; the server still refuses the same person.
  const own = !!user && !!l.enteredBy && l.enteredBy.name === user.name;

  const release = async () => {
    const ok = await run('release', () => labAgentService.release(l.lineId));
    if (ok) onChanged();
  };
  const sendBack = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = reason.trim();
    if (!text) return;
    const ok = await run('send-back', () => labAgentService.sendBack(l.lineId, text));
    if (!ok) return;
    setSending(false);
    setReason('');
    onChanged();
  };

  return (
    <li className={`lab-work-row${l.critical ? ' is-critical' : ''}`}>
      <div className="lab-work-head">
        <span className="lab-num">{l.requestNumber}</span>
        <span className="lab-work-main">
          <span className="er-name">{l.patientName}</span> <span className="er-sub">{l.patientUhid}</span>
          <span className="er-sub lab-block">
            {l.label} · Entered by {l.enteredBy?.name ?? '—'}
            {l.enteredAt ? ` at ${displayTime(new Date(l.enteredAt))}` : ''}
          </span>
        </span>
        {l.critical && (
          <span className="status-pill sm red lab-delayed">
            <AlertTriangle size={12} aria-hidden="true" />
            Critical
          </span>
        )}
        <span className={`status-pill sm ${PRIORITY_TONE[l.priority]}`}>{PRIORITY_LABEL[l.priority]}</span>
      </div>
      <LabResultValues results={l.results} />
      {!sending && (
        <div className="lab-work-foot">
          <span {...(own ? { 'data-tip': 'Someone else must validate this result' } : {})}>
            <button type="button" className="btn-primary btn-sm" disabled={own || busy !== null} aria-label={`Validate and release ${l.label}, ${l.requestNumber}`} onClick={() => void release()}>
              {busy === 'release' ? 'Releasing…' : 'Validate and release'}
            </button>
          </span>
          <button type="button" className="btn-danger-soft btn-sm" disabled={busy !== null} aria-label={`Send back ${l.label}, ${l.requestNumber}`} onClick={() => { setSending(true); setError(null); }}>
            Send back
          </button>
          {own && <span className="er-hint">You entered this result, so another person validates it.</span>}
        </div>
      )}
      {sending && (
        <form className="lab-reason" onSubmit={(e) => void sendBack(e)}>
          <label className="form-label" htmlFor={`${uid}-why`}>
            Why is it sent back for re-entry?
          </label>
          <div className="lab-reason-row">
            <input id={`${uid}-why`} className="input-field" maxLength={300} autoFocus autoComplete="off" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button type="submit" className="btn-danger-soft btn-sm" disabled={!reason.trim() || busy !== null}>
              {busy === 'send-back' ? 'Sending…' : 'Send back'}
            </button>
            <button type="button" className="btn-secondary btn-sm" disabled={busy !== null} onClick={() => { setSending(false); setError(null); }}>
              Keep
            </button>
          </div>
        </form>
      )}
      {error && (
        <p className="er-error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
};
