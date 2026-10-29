import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { erService } from '../../services';
import type { ErBay, ErComplaintInfo, ErVisit, TriageColour } from '../../types';
import { displayTime } from '../../utils/clinicDate';
import { COLOUR_LABEL, ER_CLINICAL_ROLES, ER_DOCTOR_ROLES, MODE_LABEL, STATUS_LABEL, TRIAGE_COLOURS, leftText, minutesTo } from '../../utils/er';
import { ErDispositionBar } from './ErDispositionBar';
import { ErHandover } from './ErHandover';
import { ErPathwaySteps } from './ErPathwaySteps';
import { TriageForm } from './TriageForm';
import { useErAction } from './useErAction';

interface ErVisitPanelProps {
  visit: ErVisit;
  complaints: ErComplaintInfo | null;
  role: string;
  /** Takes focus when a visit is selected. */
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  /** After any change of this person's own: reload the board. */
  onChanged(): void;
}

/** One visit in full: who, triage, bay, pathways, doctor, handover and where the patient goes next. */
export const ErVisitPanel: React.FC<ErVisitPanelProps> = ({ visit, complaints, role, headingRef, onChanged }) => {
  const canClinical = ER_CLINICAL_ROLES.includes(role);
  const canDoctor = ER_DOCTOR_ROLES.includes(role);
  const closed = visit.status === 'left';
  // Time left is worked out from the real clock, so it keeps moving between data refreshes.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const sex = visit.patientGender ? visit.patientGender[0].toUpperCase() : '';
  const ageSex = visit.patientAge === null && !sex ? '' : `${visit.patientAge ?? '?'} ${sex}`.trim();
  const complaintLabel = complaints?.complaints.find((c) => c.key === visit.complaint)?.label ?? visit.complaint;

  return (
    <div className="er-panel-body">
      <header className="er-panel-head">
        <div className="er-panel-title">
          <h3 ref={headingRef} tabIndex={-1} className="card-title er-heading">
            {visit.number}
          </h3>
          {visit.colour ? <span className={`tri-pill ${visit.colour}`}>{COLOUR_LABEL[visit.colour]}</span> : <span className="tri-pill none">Not triaged</span>}
          <span className="status-pill sm blue">{STATUS_LABEL[visit.status]}</span>
        </div>
        <p className="er-patient">
          <strong>{visit.patientName}</strong>
          {visit.detailsPending ? <span className="status-pill sm gray er-pending">Details pending</span> : ageSex && <span className="er-hint">{ageSex}</span>}
        </p>
        <p className="er-hint">
          {visit.detailsPending ? '' : `${visit.patientUhid} · `}
          {MODE_LABEL[visit.mode]} at {displayTime(new Date(visit.arrivedAt))} · {visit.complaintText || complaintLabel}
        </p>
      </header>

      {visit.colour === null && !closed ? (
        canClinical ? (
          <section className="er-section" aria-label="Triage">
            <h4 className="er-section-title">Triage</h4>
            <TriageForm visit={visit} complaints={complaints} onDone={onChanged} />
          </section>
        ) : (
          <p className="er-hint">Waiting for a nurse to triage this patient.</p>
        )
      ) : (
        <TriageSummary visit={visit} canRetriage={canClinical && !closed} onChanged={onChanged} />
      )}

      <BaySection visit={visit} canEdit={canClinical && !closed} onChanged={onChanged} />
      <ErPathwaySteps visit={visit} info={complaints?.pathways ?? []} now={now} canEdit={canClinical} onChanged={onChanged} />
      <DoctorSection visit={visit} now={now} canEdit={canDoctor && !closed} onChanged={onChanged} />
      <ErHandover key={visit.id} visit={visit} canEdit={canClinical} onChanged={onChanged} />
      {canDoctor && <ErDispositionBar visit={visit} onChanged={onChanged} />}
      {visit.triage && visit.triage.history.length > 0 && (
        <section className="er-section" aria-label="Triage history">
          <h4 className="er-section-title">Triage history</h4>
          <ul className="er-history">
            {[...visit.triage.history].reverse().map((h, i) => (
              <li key={`${h.at}-${i}`}>
                <span className={`tri-dot ${h.colour}`} aria-hidden="true" />
                <strong>
                  {h.kind === 'retriage' ? 'Re-triaged' : 'Triaged'} {h.colour}
                </strong>
                <span className="er-hint">
                  {h.byName}, {displayTime(new Date(h.at))}
                  {h.reason ? `: ${h.reason}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

const vitalsLine = (v: ErVisit): string => {
  const x = v.vitals;
  const parts: string[] = [];
  if (x?.spo2 !== undefined) parts.push(`SpO₂ ${x.spo2}%`);
  if (x?.bpSystolic !== undefined) parts.push(`BP ${x.bpSystolic}/${x.bpDiastolic ?? '?'}`);
  if (x?.heartRate !== undefined) parts.push(`HR ${x.heartRate}`);
  if (x?.respiratoryRate !== undefined) parts.push(`RR ${x.respiratoryRate}`);
  if (x?.temperature !== undefined) parts.push(`${x.temperature} °C`);
  if (v.painScore !== null) parts.push(`Pain ${v.painScore}/10`);
  return parts.join(' · ');
};

/** The confirmed triage, with the reasons, and Re-triage (a colour and a reason). */
const TriageSummary: React.FC<{ visit: ErVisit; canRetriage: boolean; onChanged(): void }> = ({ visit, canRetriage, onChanged }) => {
  const { busy, error, run } = useErAction();
  const [open, setOpen] = useState(false);
  const [colour, setColour] = useState<TriageColour>(visit.colour ?? 'yellow');
  const [reason, setReason] = useState('');
  const line = vitalsLine(visit);

  const save = async () => {
    const saved = await run('retriage', () => erService.retriage(visit.id, colour, reason.trim()));
    if (saved) {
      setOpen(false);
      setReason('');
      onChanged();
    }
  };

  return (
    <section className="er-section" aria-label="Triage">
      <div className="er-section-head">
        <h4 className="er-section-title">Triage</h4>
        {canRetriage && !open && (
          <button
            type="button"
            className="btn-secondary btn-sm er-push"
            onClick={() => {
              setColour(visit.colour ?? 'yellow');
              setOpen(true);
            }}
          >
            Re-triage
          </button>
        )}
      </div>
      {line && <p className="er-note">{line}</p>}
      {visit.triage && visit.triage.reasons.length > 0 && (
        <ul className="er-reasons">
          {visit.triage.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      {open && (
        <div className="er-inline-form">
          <fieldset className="admit-fieldset">
            <legend className="form-label">New colour</legend>
            <div className="admit-options">
              {TRIAGE_COLOURS.map((c) => (
                <label key={c} className={`admit-option${colour === c ? ' is-on' : ''}`}>
                  <input type="radio" name={`retriage-${visit.id}`} value={c} checked={colour === c} onChange={() => setColour(c)} />
                  <span className={`tri-dot ${c}`} aria-hidden="true" />
                  {COLOUR_LABEL[c]}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="form-label" htmlFor={`retriage-reason-${visit.id}`}>
            Reason *
          </label>
          <input id={`retriage-reason-${visit.id}`} className="input-field" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
          <div className="er-actions">
            <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary btn-sm" disabled={!reason.trim() || busy !== null} onClick={() => void save()}>
              {busy ? 'Saving…' : 'Save colour'}
            </button>
          </div>
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

/** The current bay, the one the rules suggest for this colour, and a pick from the free ones. */
const BaySection: React.FC<{ visit: ErVisit; canEdit: boolean; onChanged(): void }> = ({ visit, canEdit, onChanged }) => {
  const { busy, error, run } = useErAction();
  const [bays, setBays] = useState<ErBay[] | null>(null);
  const [suggested, setSuggested] = useState<ErBay | null>(null);
  const [tick, setTick] = useState(0);
  const colour = visit.colour;

  useEffect(() => {
    if (!canEdit) return;
    let alive = true;
    erService
      .bays()
      .then((b) => alive && setBays(b))
      .catch(() => alive && setBays([]));
    if (colour) {
      erService
        .suggestBay(colour)
        .then((b) => alive && setSuggested(b))
        .catch(() => alive && setSuggested(null));
    }
    return () => {
      alive = false;
    };
  }, [canEdit, colour, visit.bayId, tick]);

  const assign = async (bayId: string | null) => {
    const saved = await run('bay', () => erService.assignBay(visit.id, bayId));
    if (saved) onChanged();
    // A bay taken meanwhile shows up as taken on the next look.
    else setTick((n) => n + 1);
  };

  const free = (bays ?? []).filter((b) => !b.outOfUse && (b.visitId === null || b.id === visit.bayId));
  const showSuggested = colour && suggested && suggested.id !== visit.bayId;

  return (
    <section className="er-section" aria-label="Bay">
      <h4 className="er-section-title">Bay</h4>
      <p className="er-note">{visit.bayName ?? <span className="er-hint">No bay yet.</span>}</p>
      {canEdit && (
        <>
          {showSuggested && (
            <div className="er-actions er-between">
              <span className="er-hint">Suggested: {suggested.name}</span>
              <button type="button" className="btn-secondary btn-sm" disabled={busy !== null} onClick={() => void assign(suggested.id)}>
                {busy ? 'Assigning…' : `Use ${suggested.name}`}
              </button>
            </div>
          )}
          <label className="form-label sr-only" htmlFor={`bay-${visit.id}`}>
            Choose a bay
          </label>
          <select id={`bay-${visit.id}`} className="form-select" value={visit.bayId ?? ''} disabled={busy !== null || bays === null} onChange={(e) => void assign(e.target.value || null)}>
            <option value="">{visit.bayId ? 'Take out of the bay' : 'Choose a bay'}</option>
            {free.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.kind === 'resus' ? ' (resus)' : ''}
              </option>
            ))}
          </select>
        </>
      )}
      {error && (
        <p className="er-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
};

/** Seen by doctor: the button (doctor, admin) with the doctor clock's time left, or when the patient was seen. */
const DoctorSection: React.FC<{ visit: ErVisit; now: number; canEdit: boolean; onChanged(): void }> = ({ visit, now, canEdit, onChanged }) => {
  const { busy, error, run } = useErAction();
  const clock = visit.clocks.find((c) => c.key === 'er-doctor');
  const minutes = clock ? minutesTo(clock.dueAt, now) : null;

  const mark = async () => {
    const saved = await run('seen', () => erService.doctorSeen(visit.id));
    if (saved) onChanged();
  };

  return (
    <section className="er-section" aria-label="Doctor">
      <h4 className="er-section-title">Doctor</h4>
      {visit.doctorSeenAt ? (
        <p className="er-note er-ok-line">
          <Check size={14} aria-hidden="true" /> Seen by a doctor at {displayTime(new Date(visit.doctorSeenAt))}
        </p>
      ) : (
        <div className="er-actions er-between">
          {minutes !== null ? <span className={minutes < 0 ? 'er-late' : 'er-left'}>{leftText(minutes)}</span> : <span className="er-hint">Not seen yet.</span>}
          {canEdit && (
            <button type="button" className="btn-primary btn-sm" disabled={busy !== null} onClick={() => void mark()}>
              {busy ? 'Saving…' : 'Seen by doctor'}
            </button>
          )}
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
