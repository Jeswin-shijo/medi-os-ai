import React, { useState } from 'react';
import type { ErComplaintInfo, ErPathwayKey, ErVisit } from '../../types';
import { erService } from '../../services';
import { displayTime } from '../../utils/clinicDate';
import { leftText, minutesTo, stepClock } from '../../utils/er';
import { useErAction } from './useErAction';

interface ErPathwayStepsProps {
  visit: ErVisit;
  info: ErComplaintInfo['pathways'];
  now: number;
  /** Ticking steps and starting or cancelling pathways: admin, doctor and nurse. */
  canEdit: boolean;
  onChanged(): void;
}

/** The fast-track pathways: each running one with its steps and time left, and the ones that can be started. */
export const ErPathwaySteps: React.FC<ErPathwayStepsProps> = ({ visit, info, now, canEdit, onChanged }) => {
  const { busy, error, run } = useErAction();
  const [cancelling, setCancelling] = useState<ErPathwayKey | null>(null);
  const [reason, setReason] = useState('');
  const closed = visit.status === 'left';

  const running = visit.pathways.filter((p) => !p.cancelled);
  const cancelled = visit.pathways.filter((p) => p.cancelled);
  const idle = info.filter((p) => !running.some((r) => r.key === p.key));

  const act = async (name: string, fn: () => Promise<ErVisit>) => {
    const saved = await run(name, fn);
    if (saved) {
      setCancelling(null);
      setReason('');
      onChanged();
    }
  };

  return (
    <section className="er-section" aria-label="Pathways">
      <h4 className="er-section-title">Pathways</h4>
      {running.length === 0 && <p className="er-hint">No pathway is running.</p>}
      {running.map((p) => {
        const pathway = info.find((x) => x.key === p.key);
        return (
          <div key={p.key} className="er-pathway">
            <div className="er-pathway-head">
              <strong>{pathway?.label ?? p.key}</strong>
              <span className="er-hint">{p.startedBy === 'rules' ? 'Started by the rules' : `Started by ${p.startedByName ?? 'staff'}`}</span>
              {canEdit && !closed && cancelling !== p.key && (
                <button type="button" className="btn-secondary btn-sm er-push" onClick={() => { setCancelling(p.key); setReason(''); }}>
                  Cancel
                </button>
              )}
            </div>
            <ul className="er-steps">
              {(pathway?.steps ?? []).map((st) => {
                const rec = visit.steps.find((x) => x.key === st.key);
                const done = !!rec?.doneAt;
                const clock = done ? undefined : stepClock(visit, st.key);
                const minutes = clock ? minutesTo(clock.dueAt, now) : null;
                // The doctor step is closed by "Seen by doctor", not by a tick.
                const byDoctorButton = st.key === 'doctor';
                return (
                  <li key={st.key} className={`er-step${done ? ' is-done' : ''}`}>
                    <input
                      type="checkbox"
                      data-tip={byDoctorButton ? 'Ticked by Seen by doctor' : undefined}
                      id={`step-${visit.id}-${p.key}-${st.key}`}
                      checked={done}
                      disabled={!canEdit || closed || done || byDoctorButton || busy !== null}
                      onChange={() => void act(`step-${st.key}`, () => erService.tickStep(visit.id, st.key))}
                    />
                    <label htmlFor={`step-${visit.id}-${p.key}-${st.key}`} data-tip={byDoctorButton ? 'Ticked by Seen by doctor' : undefined}>{st.label}</label>
                    {done ? (
                      <span className="er-hint er-push">
                        {rec?.byName ?? 'Staff'}, {displayTime(new Date(rec!.doneAt!))}
                      </span>
                    ) : (
                      minutes !== null && <span className={`er-push ${minutes < 0 ? 'er-late' : 'er-left'}`}>{leftText(minutes)}</span>
                    )}
                  </li>
                );
              })}
            </ul>
            {cancelling === p.key && (
              <div className="er-inline-form">
                <label className="form-label" htmlFor={`cancel-${visit.id}-${p.key}`}>Why cancel this pathway? *</label>
                <input id={`cancel-${visit.id}-${p.key}`} className="input-field" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
                <div className="er-actions">
                  <button type="button" className="btn-secondary btn-sm" onClick={() => setCancelling(null)}>
                    Keep it
                  </button>
                  <button type="button" className="btn-danger-soft btn-sm" disabled={!reason.trim() || busy !== null} onClick={() => void act('cancel', () => erService.cancelPathway(visit.id, p.key, reason.trim()))}>
                    {busy === 'cancel' ? 'Cancelling…' : 'Cancel pathway'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {cancelled.map((p) => (
        <p key={p.key} className="er-hint">
          {info.find((x) => x.key === p.key)?.label ?? p.key} cancelled by {p.cancelled!.byName}: {p.cancelled!.reason}
        </p>
      ))}
      {canEdit && !closed && idle.length > 0 && (
        <div className="er-actions er-start">
          {idle.map((p) => (
            <button key={p.key} type="button" className="btn-secondary btn-sm" disabled={busy !== null} onClick={() => void act(`start-${p.key}`, () => erService.startPathway(visit.id, p.key))}>
              {busy === `start-${p.key}` ? 'Starting…' : `Start ${p.label}`}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className="er-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
};
