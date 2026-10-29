import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FlaskConical, Printer, Search, X } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { labAgentService } from '../../services';
import { errorMessage } from '../../services/api';
import { useErAction } from '../er/useErAction';
import type { LabCatalogue, LabPriority, LabRequestView, Patient } from '../../types';
import { PRIORITY_LABEL } from '../../utils/lab';

const MAX_TESTS = 10;
const MATCH_LIMIT = 6;
const PRIORITIES: LabPriority[] = ['stat', 'urgent', 'routine'];
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** "30 min", "2 h", "1 day": a turnaround target in words. */
const targetText = (minutes: number): string => (minutes >= 1440 && minutes % 1440 === 0 ? `${minutes / 1440} d` : minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`);

interface NewLabOrderDialogProps {
  /** A fixed patient (an order from the patient's own page): the search is skipped. */
  initialPatient?: Pick<Patient, 'id' | 'name' | 'uhid'> & Partial<Pick<Patient, 'age' | 'gender'>>;
  /** The role may print labels (admin, nurse, lab). A doctor sees a note instead. */
  canPrint: boolean;
  onClose(): void;
  /** After an order is saved: the lists reload. */
  onOrdered(requests: LabRequestView[]): void;
  /** Open the print view for a request. The dialog closes at the same moment, so only one modal is ever open. */
  onPrint(request: LabRequestView): void;
}

/** Order lab tests for a patient: tests grouped by tube, a priority, a note and an optional repeat. */
export const NewLabOrderDialog: React.FC<NewLabOrderDialogProps> = ({ initialPatient, canPrint, onClose, onOrdered, onPrint }) => {
  const { patients } = useApp();
  const uid = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const { busy, error, setError, run } = useErAction();
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  const closeGuard = useRef<() => void>(onClose);

  const [catalogue, setCatalogue] = useState<LabCatalogue | null>(null);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const [loadTries, setLoadTries] = useState(0);
  const [query, setQuery] = useState('');
  const [patient, setPatient] = useState<Pick<Patient, 'id' | 'name' | 'uhid'> & Partial<Pick<Patient, 'age' | 'gender'>> | null>(initialPatient ?? null);
  const [picked, setPicked] = useState<string[]>([]);
  const [priority, setPriority] = useState<LabPriority>('routine');
  const [note, setNote] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [repeatHours, setRepeatHours] = useState('6');
  const [created, setCreated] = useState<LabRequestView[] | null>(null);

  useEffect(() => {
    closeGuard.current = () => {
      if (busy === null) onClose();
    };
  });

  useEffect(() => {
    let alive = true;
    labAgentService
      .catalogue()
      .then((c) => {
        if (!alive) return;
        setCatalogue(c);
        setCatalogueError(null);
      })
      .catch((err) => alive && setCatalogueError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [loadTries]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () => (q.length < 2 ? [] : patients.filter((p) => p.name.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q) || p.phone.includes(q)).slice(0, MATCH_LIMIT)),
    [patients, q]
  );

  const groups = useMemo(() => {
    if (!catalogue) return [];
    const tubes = catalogue.tubes.length ? catalogue.tubes : [...new Set(catalogue.tests.map((t) => t.tube))].map((key) => ({ key, label: catalogue.tests.find((t) => t.tube === key)?.tubeLabel ?? key }));
    return tubes.map((tube) => ({ tube, tests: catalogue.tests.filter((t) => t.tube === tube.key) })).filter((g) => g.tests.length > 0);
  }, [catalogue]);

  useEffect(() => {
    const box = boxRef.current;
    if (box && !box.contains(document.activeElement)) box.querySelector<HTMLElement>('input, button.btn-primary')?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, [opener]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const box = boxRef.current;
      if (!box || e.defaultPrevented) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeGuard.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const at = document.activeElement;
      if (!box.contains(at) || (e.shiftKey ? at === first || at === box : at === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const toggle = (key: string) => {
    setError(null);
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : p.length >= MAX_TESTS ? p : [...p, key]));
  };

  const hours = Number(repeatHours);
  const repeatOk = !repeat || (Number.isInteger(hours) && hours >= 1 && hours <= 72);
  const ready = !!patient && picked.length > 0 && repeatOk;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !ready) return;
    const requests = await run('order', () =>
      labAgentService.order({ patientId: patient.id, tests: picked, priority, ...(note.trim() && { note: note.trim() }), ...(repeat && { repeatAfterHours: hours }) })
    );
    if (!requests) return;
    setCreated(requests);
    onOrdered(requests);
  };

  const titleId = `${uid}-title`;
  const tryClose = () => closeGuard.current();
  const hint = !patient ? 'Search and pick the patient.' : picked.length === 0 ? 'Choose at least one test.' : !repeatOk ? 'Repeat after 1 to 72 hours.' : '';

  return createPortal(
    <div className="modal-overlay" onClick={tryClose}>
      <div ref={boxRef} className="modal-content-box admit-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id={titleId} className="admit-title">
            <FlaskConical size={18} color="var(--blue-text)" aria-hidden="true" />
            {created ? 'Order placed' : 'New lab order'}
          </h3>
          <button type="button" onClick={tryClose} disabled={busy !== null} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {created ? (
          <>
            <div className="modal-body admit-body">
              <div className="admit-notice is-info" role="status">
                <div className="admit-notice-body">
                  <p>
                    {created.length === 1 ? 'Request' : 'Requests'} {created.map((r) => r.number).join(' and ')} created for {patient?.name}.
                  </p>
                  {created.length > 1 && <p className="er-hint">The second request is the repeat, scheduled for later.</p>}
                </div>
              </div>
              <ul className="lab-created">
                {created.map((r) => (
                  <li key={r.id}>
                    <span className="lab-num">{r.number}</span>
                    <span className="er-hint">{r.lines.map((l) => l.label).join(', ')}</span>
                    {canPrint && (
                      <button type="button" className="btn-secondary btn-sm" onClick={() => { onPrint(r); onClose(); }}>
                        <Printer size={14} aria-hidden="true" />
                        Print labels
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {!canPrint && <p className="admit-hint">Labels print at the collection point.</p>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={(e) => void submit(e)}>
            <div className="modal-body admit-body">
              {patient ? (
                <div>
                  <span className="form-label">Patient</span>
                  <div className="admit-patient">
                    <div>
                      <div className="admit-patient-name">{patient.name}</div>
                      <div className="admit-patient-detail">{patient.uhid}{patient.age !== undefined ? ` · ${patient.age} yrs` : ''}{patient.gender ? ` · ${patient.gender}` : ''}</div>
                    </div>
                    {!initialPatient && (
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setPatient(null)}>
                        Change
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="form-label" htmlFor={`${uid}-search`}>Patient: name, UHID or phone</label>
                  <div className="admit-search">
                    <Search size={15} aria-hidden="true" />
                    <input id={`${uid}-search`} className="input-field" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
                  </div>
                  {q.length >= 2 && (
                    <div className="admit-listbox" style={{ position: 'static', marginTop: 6 }}>
                      {matches.length === 0 ? (
                        <p className="admit-listbox-empty">No patient found.</p>
                      ) : (
                        <ul>
                          {matches.map((p) => (
                            <li key={p.id}>
                              <button type="button" className="er-pick" onClick={() => setPatient(p)}>
                                <span className="admit-patient-name">{p.name}</span>
                                <span className="admit-patient-detail">{p.uhid} · {p.age} yrs · {p.gender}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="lab-tests-pick">
                <div className="lab-pick-head">
                  <span className="form-label">Tests</span>
                  <span className="admit-count" aria-live="polite">{picked.length} of {MAX_TESTS} chosen</span>
                </div>
                {!catalogue ? (
                  catalogueError ? (
                    <p className="er-error" role="alert">
                      {catalogueError}{' '}
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setLoadTries((n) => n + 1)}>
                        Try again
                      </button>
                    </p>
                  ) : (
                    <p className="data-empty">Loading the test list…</p>
                  )
                ) : (
                  groups.map((g) => (
                    <fieldset key={g.tube.key} className="admit-fieldset lab-tube-group">
                      <legend className="lab-tube-legend">{g.tube.label}</legend>
                      <div className="admit-options">
                        {g.tests.map((t) => {
                          const on = picked.includes(t.key);
                          const full = !on && picked.length >= MAX_TESTS;
                          return (
                            <label key={t.key} className={`admit-option${on ? ' is-on' : ''}`} style={full ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
                              <input type="checkbox" checked={on} disabled={full} onChange={() => toggle(t.key)} />
                              {t.label}
                              <span className="er-hint">{targetText(priority === 'stat' ? t.targets.stat : priority === 'urgent' ? t.targets.stat * 2 : t.targets.routine)}</span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  ))
                )}
              </div>

              <fieldset className="admit-fieldset">
                <legend className="form-label">Priority</legend>
                <div className="admit-options">
                  {PRIORITIES.map((p) => (
                    <label key={p} className={`admit-option${priority === p ? ' is-on' : ''}`}>
                      <input type="radio" name={`${uid}-priority`} value={p} checked={priority === p} onChange={() => setPriority(p)} />
                      {PRIORITY_LABEL[p]}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label className="form-label" htmlFor={`${uid}-note`}>Note (optional)</label>
                <textarea id={`${uid}-note`} className="input-field" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
                <p className="admit-hint"><span className="admit-count">{note.length} / 500</span></p>
              </div>

              <div className="lab-repeat">
                <label className="admit-stay">
                  <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />
                  Repeat once after
                </label>
                <label className="admit-stay">
                  <input className="input-field" type="number" inputMode="numeric" min={1} max={72} step={1} disabled={!repeat} value={repeatHours} onChange={(e) => setRepeatHours(e.target.value)} aria-label="Hours until the repeat" />
                  hours
                </label>
              </div>
              {hint && <p className="admit-hint">{hint}</p>}
            </div>
            {error && (
              <p className="admit-error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={tryClose} disabled={busy !== null}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={!ready || busy !== null}>
                {busy ? 'Placing order…' : 'Place order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
