import React, { useId, useMemo, useState } from 'react';
import { pharmacyAgentService } from '../../services';
import { useErAction } from '../er/useErAction';
import type { PharmacyLineView } from '../../types';
import { QUERY_KIND_LABEL, needsDoctorFlags, needsReasonFlags, needsReviewFlags, sortForCheck } from '../../utils/pharmacy';
import { PharmacyLineCard } from './PharmacyLineCard';

const DOCTOR_TIP = 'A doctor must confirm this allergy: use Query doctor';
const KINDS = Object.keys(QUERY_KIND_LABEL);

interface PharmacyCheckQueueProps {
  lines: PharmacyLineView[] | null;
  error: string | null;
  canCheck: boolean;
  onRetry(): void;
  /** After an approve, query or reject: the lists and the header bell reload. */
  onChanged(): void;
}

/** The To check tab: lines waiting for the pharmacist, STAT and red first. */
export const PharmacyCheckQueue: React.FC<PharmacyCheckQueueProps> = ({ lines, error, canCheck, onRetry, onChanged }) => {
  const sorted = useMemo(() => sortForCheck(lines ?? []), [lines]);
  return (
    <div className="bagent-overview lab-body">
      <section className="medios-card bagent-card lab-card" aria-label="Lines to check">
        <div className="card-header-row">
          <div className="bagent-title-group">
            <h3 className="card-title">To check</h3>
            <span className="bagent-hint">{lines ? `${lines.length} ${lines.length === 1 ? 'line' : 'lines'} waiting · STAT and red flags first` : ''}</span>
          </div>
        </div>
        {!canCheck && <p className="er-hint lab-readonly">You can see this list. The pharmacist checks the lines.</p>}
        {!lines ? (
          error ? (
            <p className="data-empty" role="alert">
              {error}{' '}
              <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>
                Try again
              </button>
            </p>
          ) : (
            <p className="data-empty">Loading the lines to check…</p>
          )
        ) : sorted.length === 0 ? (
          <p className="data-empty">Nothing is waiting to be checked.</p>
        ) : (
          <ul className="ph-cards">
            {sorted.map((l) => (
              <PharmacyLineCard key={l.id} line={l} actions={canCheck ? <CheckActions line={l} onChanged={onChanged} /> : undefined} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

type Mode = 'approve' | 'query' | 'reject';

const CheckActions: React.FC<{ line: PharmacyLineView; onChanged(): void }> = ({ line, onChanged }) => {
  const uid = useId();
  const { busy, error, setError, run } = useErAction();
  const [mode, setMode] = useState<Mode | null>(null);
  const [reason, setReason] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const firstRed = line.flags.find((f) => f.severity === 'red');
  const [kind, setKind] = useState(firstRed && KINDS.includes(firstRed.kind) ? firstRed.kind : 'other');
  const [question, setQuestion] = useState('');

  const needsDoctor = needsDoctorFlags(line).length > 0;
  const needsReason = needsReasonFlags(line).length > 0;
  const needsReview = needsReviewFlags(line).length > 0;

  const close = () => {
    setMode(null);
    setError(null);
  };
  const open = (next: Mode) => {
    setError(null);
    setReason('');
    setReviewed(false);
    setMode(mode === next ? null : next);
  };
  const done = (ok: unknown) => {
    if (ok) {
      setMode(null);
      onChanged();
    }
  };

  const approve = async () => {
    const body = { ...(needsReason && { reason: reason.trim() }), ...(needsReview && { allergyReviewed: true }) };
    done(await run('approve', () => pharmacyAgentService.approve(line.id, body)));
  };
  const onApproveClick = () => {
    if (needsReason || needsReview) open('approve');
    else void approve();
  };

  const approveReady = (!needsReason || reason.trim().length > 0) && (!needsReview || reviewed);

  return (
    <div className="ph-actions">
      <div className="ph-action-row">
        <span data-tip={needsDoctor ? DOCTOR_TIP : undefined} className="ph-tip-wrap">
          <button type="button" className="btn-primary btn-sm" disabled={needsDoctor || busy !== null} data-tip={needsDoctor ? DOCTOR_TIP : undefined} aria-describedby={needsDoctor ? `${uid}-doctor` : undefined} onClick={onApproveClick}>
            {busy === 'approve' && !mode ? 'Approving…' : 'Approve'}
          </button>
        </span>
        <button type="button" className="btn-secondary btn-sm" aria-expanded={mode === 'query'} disabled={busy !== null} onClick={() => open('query')}>
          Query doctor
        </button>
        <button type="button" className="btn-secondary btn-sm" aria-expanded={mode === 'reject'} disabled={busy !== null} onClick={() => open('reject')}>
          Reject
        </button>
        {needsDoctor && (
          <span id={`${uid}-doctor`} className="er-hint">
            {DOCTOR_TIP}.
          </span>
        )}
      </div>

      {mode === 'approve' && (
        <form
          className="ph-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (approveReady) void approve();
          }}
        >
          {needsReason && (
            <div>
              <label className="form-label" htmlFor={`${uid}-reason`}>Reason for approving despite the red flag</label>
              <textarea id={`${uid}-reason`} className="input-field" rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
              <p className="admit-hint"><span className="admit-count">{reason.length} / 300</span></p>
            </div>
          )}
          {needsReview && (
            <label className="admit-stay">
              <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />
              Allergy reviewed: I checked the patient&apos;s allergy against this medicine
            </label>
          )}
          <FormEnd error={error} busy={busy === 'approve'} ready={approveReady} label="Approve" busyLabel="Approving…" onCancel={close} />
        </form>
      )}

      {mode === 'query' && (
        <form
          className="ph-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (question.trim()) void run('query', () => pharmacyAgentService.query(line.id, { kind, question: question.trim() })).then(done);
          }}
        >
          <div>
            <label className="form-label" htmlFor={`${uid}-kind`}>What is it about</label>
            <select id={`${uid}-kind`} className="form-select" value={kind} onChange={(e) => setKind(e.target.value)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>{QUERY_KIND_LABEL[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor={`${uid}-q`}>Question for the doctor</label>
            <textarea id={`${uid}-q`} className="input-field" rows={2} maxLength={300} value={question} onChange={(e) => setQuestion(e.target.value)} autoFocus />
            <p className="admit-hint"><span className="admit-count">{question.length} / 300</span></p>
          </div>
          <FormEnd error={error} busy={busy === 'query'} ready={question.trim().length > 0} label="Send query" busyLabel="Sending…" onCancel={close} />
        </form>
      )}

      {mode === 'reject' && (
        <form
          className="ph-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (reason.trim()) void run('reject', () => pharmacyAgentService.reject(line.id, reason.trim())).then(done);
          }}
        >
          <div>
            <label className="form-label" htmlFor={`${uid}-rej`}>Reason for rejecting</label>
            <textarea id={`${uid}-rej`} className="input-field" rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
            <p className="admit-hint"><span className="admit-count">{reason.length} / 300</span></p>
          </div>
          <FormEnd error={error} busy={busy === 'reject'} ready={reason.trim().length > 0} label="Reject line" busyLabel="Rejecting…" onCancel={close} />
        </form>
      )}
      {!mode && error && (
        <p className="er-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

const FormEnd: React.FC<{ error: string | null; busy: boolean; ready: boolean; label: string; busyLabel: string; onCancel(): void }> = ({ error, busy, ready, label, busyLabel, onCancel }) => (
  <>
    {error && (
      <p className="er-error" role="alert">
        {error}
      </p>
    )}
    <div className="ph-form-end">
      <button type="button" className="btn-secondary btn-sm" onClick={onCancel} disabled={busy}>
        Cancel
      </button>
      <button type="submit" className="btn-primary btn-sm" disabled={!ready || busy}>
        {busy ? busyLabel : label}
      </button>
    </div>
  </>
);
