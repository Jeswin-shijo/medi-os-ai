import React, { useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { erService } from '../../services';
import { errorMessage } from '../../services/api';
import type { BedRequest, ErDispositionKind, ErVisit } from '../../types';
import { followRequest } from '../../utils/beds';
import { DISPOSITION_LABEL, PRIORITY_FROM_COLOUR } from '../../utils/er';
import { displayTime } from '../../utils/clinicDate';
import { RequestBedDialog } from '../beds/RequestBedDialog';
import { useErAction } from './useErAction';

const NOTES_MAX = 1000;
const KINDS: ErDispositionKind[] = ['admit', 'home', 'transfer', 'left-against-advice', 'died'];

interface ErDispositionBarProps {
  visit: ErVisit;
  onChanged(): void;
  /** The admit went through (bed request made and the visit marked): the panel moves focus to its heading. */
  onAdmitted?(): void;
}

/**
 * Doctor and admin: where the patient goes next. Admit opens the bed form first and records the disposition
 * only once the bed request exists; the others ask for confirmation with optional notes.
 */
export const ErDispositionBar: React.FC<ErDispositionBarProps> = ({ visit, onChanged, onAdmitted }) => {
  const { user, showToast, refreshAlertCount, refreshPatients } = useApp();
  const { busy, error, run } = useErAction();
  const [confirming, setConfirming] = useState<Exclude<ErDispositionKind, 'admit'> | null>(null);
  const [notes, setNotes] = useState('');
  const [admitForm, setAdmitForm] = useState<{ notes: string } | null>(null);
  /** A bed request that was made but whose "admitted" mark failed: retry marks it without a second request. */
  const [markFailed, setMarkFailed] = useState<{ request: BedRequest; message: string } | null>(null);
  const [marking, setMarking] = useState(false);
  const [wrongPatient, setWrongPatient] = useState<string | null>(null);

  const done = visit.disposition;
  // An admitted patient still waiting for a bed can leave another way; Admit is already done.
  const waitingBed = visit.status === 'waiting-bed' && done?.kind === 'admit';
  if ((done && !waitingBed) || visit.status === 'left') {
    return (
      <section className="er-section" aria-label="Disposition">
        <h4 className="er-section-title">Disposition</h4>
        {done ? (
          <p className="er-note">
            {DISPOSITION_LABEL[done.kind]} by {done.byName} at {displayTime(new Date(done.at))}.{done.notes ? ` ${done.notes}` : ''}
          </p>
        ) : (
          <p className="er-hint">This patient has left the ER.</p>
        )}
      </section>
    );
  }

  const follow = (request: BedRequest) => followRequest(request.id, { showToast, refreshAlertCount }, request.patientName);

  const openAdmit = async () => {
    await run('admit-open', async () => {
      // The placeholder was just created: make sure the app's list has it before the bed form opens.
      await refreshPatients().catch(() => undefined);
      let text = visit.handoverNote ?? '';
      if (!text.trim()) text = await erService.handoverDraft(visit.id).then((d) => d.text, () => '');
      setAdmitForm({ notes: text });
    });
  };

  const markAdmitted = async (request: BedRequest) => {
    setMarking(true);
    try {
      await erService.disposition(visit.id, 'admit');
      setMarkFailed(null);
      onChanged();
      onAdmitted?.();
    } catch (err) {
      setMarkFailed({ request, message: errorMessage(err) });
    } finally {
      setMarking(false);
    }
  };

  const onRequestSent = (request: BedRequest) => {
    if (request.patientId !== visit.patientId) {
      setMarkFailed(null);
      setWrongPatient(`The bed request was made for ${request.patientName}, not for ${visit.patientName}. This ER visit was not marked as admitted.`);
      follow(request);
      return;
    }
    void (async () => {
      await markAdmitted(request);
      follow(request);
    })();
  };

  const confirm = async () => {
    if (!confirming) return;
    const saved = await run(`dispose-${confirming}`, () => erService.disposition(visit.id, confirming, notes.trim() || undefined));
    if (saved) {
      setConfirming(null);
      setNotes('');
      onChanged();
    }
  };

  const disabled = busy !== null || marking;

  return (
    <section className="er-section" aria-label="Disposition">
      <h4 className="er-section-title">Disposition</h4>
      {waitingBed && done && (
        <p className="er-note">
          {DISPOSITION_LABEL[done.kind]} by {done.byName} at {displayTime(new Date(done.at))}.{done.notes ? ` ${done.notes}` : ''}
        </p>
      )}
      {visit.admitCancelledAt && !done && (
        <p className="er-note" role="status">
          The bed request was cancelled at {displayTime(new Date(visit.admitCancelledAt))}. Decide again: admit, or send the patient elsewhere.
        </p>
      )}
      <div className="er-actions">
        {KINDS.filter((k) => !(waitingBed && k === 'admit')).map((k) => (
          <button
            key={k}
            type="button"
            className={k === 'admit' ? 'btn-primary btn-sm' : k === 'died' ? 'btn-danger-soft btn-sm' : 'btn-secondary btn-sm'}
            // Admit needs a triage colour (the bed priority comes from it); leaving does not, as a patient can walk out.
            disabled={disabled || (k === 'admit' && visit.colour === null)}
            data-tip={k === 'admit' && visit.colour === null ? 'Triage first' : undefined}
            aria-pressed={confirming === k}
            onClick={() => (k === 'admit' ? void openAdmit() : (setConfirming(k), setNotes('')))}
          >
            {k === 'admit' && busy === 'admit-open' ? 'Opening…' : DISPOSITION_LABEL[k]}
          </button>
        ))}
      </div>

      {waitingBed && <p className="er-hint">Leaving now cancels the open bed request.</p>}

      {confirming && (
        <div className="er-inline-form">
          <label className="form-label" htmlFor={`dispo-${visit.id}`}>
            {DISPOSITION_LABEL[confirming]}: add a note (optional)
          </label>
          <textarea id={`dispo-${visit.id}`} className="input-field" rows={2} maxLength={NOTES_MAX} value={notes} onChange={(e) => setNotes(e.target.value)} autoFocus />
          <div className="er-actions er-between">
            <span className="er-hint">{notes.length}/{NOTES_MAX}</span>
            <span className="er-actions">
              <button type="button" className="btn-secondary btn-sm" onClick={() => setConfirming(null)}>
                Cancel
              </button>
              <button type="button" className={confirming === 'died' ? 'btn-danger-soft btn-sm' : 'btn-primary btn-sm'} disabled={disabled} onClick={() => void confirm()}>
                {busy === `dispose-${confirming}` ? 'Saving…' : `Confirm: ${DISPOSITION_LABEL[confirming]}`}
              </button>
            </span>
          </div>
        </div>
      )}

      {markFailed && (
        <div className="er-error" role="alert">
          <p style={{ margin: 0 }}>
            The bed request for {markFailed.request.patientName} was sent, but the ER visit was not marked as admitted: {markFailed.message}
          </p>
          <div className="er-actions" style={{ marginTop: 6 }}>
            <button type="button" className="btn-primary btn-sm" disabled={disabled} onClick={() => void markAdmitted(markFailed.request)}>
              {marking ? 'Marking…' : 'Mark as admitted'}
            </button>
          </div>
        </div>
      )}
      {wrongPatient && (
        <p className="er-error" role="alert">
          {wrongPatient}
        </p>
      )}
      {error && (
        <p className="er-error" role="alert">
          {error}
        </p>
      )}

      {admitForm && (
        <RequestBedDialog
          initialPatient={{ id: visit.patientId, uhid: visit.patientUhid, name: visit.patientName, age: visit.patientAge ?? undefined }}
          initialValues={{
            priority: visit.colour ? PRIORITY_FROM_COLOUR[visit.colour] : 'medium',
            notes: admitForm.notes,
            doctor: user?.role === 'doctor' ? user.name : undefined
          }}
          lockPatient
          onClose={() => setAdmitForm(null)}
          onSubmitted={onRequestSent}
        />
      )}
    </section>
  );
};
