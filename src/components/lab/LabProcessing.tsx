import React, { useId, useState } from 'react';
import { labAgentService } from '../../services';
import { useErAction } from '../er/useErAction';
import type { LabRejectReason, LabWorklist, LabWorklistLine, LabWorklistSample } from '../../types';
import { PRIORITY_LABEL, PRIORITY_TONE, REJECT_LABEL } from '../../utils/lab';
import { LabResultEntry, type EntryLine } from './LabResultEntry';

const REASONS = Object.keys(REJECT_LABEL) as LabRejectReason[];

interface LabProcessingProps {
  canBench: boolean;
  worklist: LabWorklist | null;
  error: string | null;
  onRetry(): void;
  /** After any action: the Lab lists and the header bell reload. */
  onChanged(): void;
}

/** The Processing tab: samples to receive, results to enter, and results the validator sent back. */
export const LabProcessing: React.FC<LabProcessingProps> = ({ canBench, worklist, error, onRetry, onChanged }) => {
  const [entering, setEntering] = useState<EntryLine | null>(null);

  if (!canBench) {
    return (
      <section className="medios-card bagent-card lab-card" aria-label="Processing">
        <h3 className="card-title">Processing</h3>
        <p className="data-empty">Lab staff only. Receiving samples and entering results is done by the lab.</p>
      </section>
    );
  }
  if (!worklist) {
    return (
      <section className="medios-card bagent-card lab-card" aria-label="Processing">
        {error ? (
          <p className="data-empty" role="alert">
            {error}{' '}
            <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>
              Try again
            </button>
          </p>
        ) : (
          <p className="data-empty">Loading the lab worklist…</p>
        )}
      </section>
    );
  }

  const open = (l: LabWorklistLine) =>
    setEntering({ lineId: l.lineId, test: l.test, label: l.label, requestNumber: l.requestNumber, patientUhid: l.patientUhid, initial: l.results, sentBackReason: l.sentBack?.reason });

  return (
    <div className="bagent-overview lab-body">
      <section className="medios-card bagent-card lab-card" aria-label="Samples to receive">
        <div className="card-header-row">
          <div className="bagent-title-group">
            <h3 className="card-title">To receive</h3>
            <span className="bagent-hint">{worklist.toReceive.length} waiting</span>
          </div>
        </div>
        {worklist.toReceive.length === 0 ? (
          <p className="data-empty">No collected samples are waiting to be received.</p>
        ) : (
          <ul className="lab-work">
            {worklist.toReceive.map((s) => (
              <ReceiveRow key={s.sampleId} sample={s} onChanged={onChanged} />
            ))}
          </ul>
        )}
      </section>

      <section className="medios-card bagent-card lab-card" aria-label="Results to enter">
        <div className="card-header-row">
          <div className="bagent-title-group">
            <h3 className="card-title">To enter</h3>
            <span className="bagent-hint">{worklist.toEnter.length + worklist.sentBack.length} waiting</span>
          </div>
        </div>
        {worklist.sentBack.length === 0 && worklist.toEnter.length === 0 ? (
          <p className="data-empty">No received samples are waiting for results.</p>
        ) : (
          <ul className="lab-work">
            {worklist.sentBack.map((l) => (
              <EnterRow key={l.lineId} line={l} onOpen={open} />
            ))}
            {worklist.toEnter.map((l) => (
              <EnterRow key={l.lineId} line={l} onOpen={open} />
            ))}
          </ul>
        )}
      </section>

      {entering && <LabResultEntry line={entering} onClose={() => setEntering(null)} onSaved={onChanged} />}
    </div>
  );
};

const ReceiveRow: React.FC<{ sample: LabWorklistSample; onChanged(): void }> = ({ sample: s, onChanged }) => {
  const uid = useId();
  const { busy, error, setError, run } = useErAction();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState<LabRejectReason>('haemolysed');
  const [note, setNote] = useState('');

  const receive = async () => {
    const ok = await run('receive', () => labAgentService.receive(s.sampleId));
    if (ok) onChanged();
  };
  const noteMissing = reason === 'other' && !note.trim();
  const reject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (noteMissing) return;
    const ok = await run('reject', () => labAgentService.reject(s.sampleId, reason, note.trim() || undefined));
    if (!ok) return;
    setRejecting(false);
    onChanged();
  };

  return (
    <li className="lab-work-row">
      <div className="lab-work-head">
        <span className="lab-num">{s.sampleNumber}</span>
        <span className="lab-work-main">
          <span className="er-name">{s.patientName}</span> <span className="er-sub">{s.patientUhid}</span>
          <span className="er-sub lab-block">
            {s.requestNumber} · {s.tubeLabel} · {s.tests.join(', ')}
          </span>
        </span>
        <span className={`status-pill sm ${PRIORITY_TONE[s.priority]}`}>{PRIORITY_LABEL[s.priority]}</span>
        {!rejecting && (
          <span className="lab-work-actions">
            <button type="button" className="btn-primary btn-sm" disabled={busy !== null} aria-label={`Mark ${s.sampleNumber} received`} onClick={() => void receive()}>
              {busy === 'receive' ? 'Saving…' : 'Received'}
            </button>
            <button type="button" className="btn-danger-soft btn-sm" disabled={busy !== null} aria-label={`Reject ${s.sampleNumber}`} onClick={() => { setRejecting(true); setError(null); }}>
              Reject
            </button>
          </span>
        )}
      </div>
      {rejecting && (
        <form className="lab-reason" onSubmit={(e) => void reject(e)}>
          <label className="form-label" htmlFor={`${uid}-why`}>
            Why is {s.sampleNumber} rejected?
          </label>
          <div className="lab-reason-row">
            <select id={`${uid}-why`} className="form-select" value={reason} onChange={(e) => setReason(e.target.value as LabRejectReason)}>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {REJECT_LABEL[r]}
                </option>
              ))}
            </select>
            <input className="input-field" maxLength={500} autoComplete="off" aria-label={reason === 'other' ? 'Note (required)' : 'Note (optional)'} placeholder={reason === 'other' ? 'Note (required)' : 'Note (optional)'} value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="submit" className="btn-danger-soft btn-sm" disabled={noteMissing || busy !== null}>
              {busy === 'reject' ? 'Rejecting…' : 'Reject sample'}
            </button>
            <button type="button" className="btn-secondary btn-sm" disabled={busy !== null} onClick={() => { setRejecting(false); setError(null); }}>
              Keep
            </button>
          </div>
          <p className="er-hint">A new sample is then collected.</p>
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

const EnterRow: React.FC<{ line: LabWorklistLine; onOpen(l: LabWorklistLine): void }> = ({ line: l, onOpen }) => (
  <li className="lab-work-row">
    <div className="lab-work-head">
      <span className="lab-num">{l.requestNumber}</span>
      <span className="lab-work-main">
        <span className="er-name">{l.patientName}</span> <span className="er-sub">{l.patientUhid}</span>
        <span className="er-sub lab-block">{l.label}</span>
      </span>
      <span className={`status-pill sm ${PRIORITY_TONE[l.priority]}`}>{PRIORITY_LABEL[l.priority]}</span>
      {l.sentBack && <span className="status-pill sm orange">Sent back</span>}
      <span className="lab-work-actions">
        <button type="button" className="btn-primary btn-sm" aria-label={`Enter results for ${l.label}, ${l.requestNumber}`} onClick={() => onOpen(l)}>
          {l.sentBack ? 'Enter again' : 'Enter results'}
        </button>
      </span>
    </div>
    {l.sentBack && (
      <p className="lab-sentback">
        <strong>Sent back by {l.sentBack.by}:</strong> {l.sentBack.reason}
      </p>
    )}
  </li>
);
