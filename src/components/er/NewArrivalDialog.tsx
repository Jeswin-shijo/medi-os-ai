import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Siren, X } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { erService } from '../../services';
import { normalizeCardId } from '../../hooks/useCardReader';
import type { ErArrivalInput, ErComplaintInfo, ErExpected, ErMode, ErVisit, Patient } from '../../types';
import { MODE_LABEL } from '../../utils/er';
import { useErAction } from './useErAction';

type Tab = 'card' | 'search' | 'emergency';
const TABS: { id: Tab; label: string }[] = [
  { id: 'card', label: 'Card' },
  { id: 'search', label: 'Search' },
  { id: 'emergency', label: 'Emergency' }
];
const MODES: ErMode[] = ['walk-in', 'ambulance', 'referred'];
const MATCH_LIMIT = 6;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface NewArrivalDialogProps {
  complaints: ErComplaintInfo | null;
  /** The complaint list failed to load: an error with Try again shows instead of an empty list. */
  complaintsError?: boolean;
  onRetryComplaints?(): void;
  /** Arrivals still on their way (state `waiting`). */
  expected: ErExpected[];
  /** Visits already on the board: an arrival that returns one of these was already in the ER. */
  knownVisitIds: string[];
  onClose(): void;
  /** The new (or already open) visit: the page opens it in the panel. */
  onArrived(visit: ErVisit): void;
}

/** Register an arrival: a card tap, a patient search, or an unknown emergency patient. */
export const NewArrivalDialog: React.FC<NewArrivalDialogProps> = ({ complaints, complaintsError, onRetryComplaints, expected, knownVisitIds, onClose, onArrived }) => {
  const { patients } = useApp();
  const uid = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const { busy, error, setError, run } = useErAction();
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  // While the arrival is being registered, the dialog stays open: closing it could lead to a second placeholder.
  const closeGuard = useRef<() => void>(onClose);

  const [tab, setTab] = useState<Tab>('card');
  const [cardId, setCardId] = useState('');
  const [query, setQuery] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [approxAge, setApproxAge] = useState('');
  const [description, setDescription] = useState('');

  const [mode, setMode] = useState<ErMode>('walk-in');
  const [complaint, setComplaint] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [expectedId, setExpectedId] = useState('');
  /** Set when the patient already had an open visit: the dialog says so and offers it. */
  const [existing, setExisting] = useState<ErVisit | null>(null);

  useEffect(() => {
    closeGuard.current = () => {
      if (busy === null) onClose();
    };
  });
  const tryClose = () => closeGuard.current();

  const waiting = expected.filter((e) => e.state === 'waiting');
  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () => (q.length < 2 ? [] : patients.filter((p) => p.name.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q) || p.phone.includes(q)).slice(0, MATCH_LIMIT)),
    [patients, q]
  );

  useEffect(() => {
    const box = boxRef.current;
    if (box && !box.contains(document.activeElement)) box.querySelector<HTMLElement>('input, select')?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, [opener]);

  // Esc closes; Tab cycles inside the dialog.
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

  const pickExpected = (id: string) => {
    setExpectedId(id);
    const e = expected.find((x) => x.id === id);
    if (e) {
      setMode(e.mode);
      setComplaintText((t) => t || e.complaint.slice(0, 300));
    }
  };

  const age = Number(approxAge);
  const emergencyReady = approxAge.trim() !== '' && Number.isInteger(age) && age >= 0 && age <= 120 && description.trim().length > 0;
  const who: Pick<ErArrivalInput, 'patientId' | 'cardId' | 'emergency'> | null =
    tab === 'card'
      ? normalizeCardId(cardId).length >= 4
        ? { cardId: normalizeCardId(cardId) }
        : null
      : tab === 'search'
        ? patient
          ? { patientId: patient.id }
          : null
        : emergencyReady
          ? { emergency: { gender, approxAge: age, description: description.trim() } }
          : null;
  const ready = !!who && !!complaint;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!who || !complaint) return;
    const visit = await run('arrive', () =>
      erService.arrive({ ...who, mode, complaint, ...(complaintText.trim() && { complaintText: complaintText.trim() }), ...(expectedId && { expectedId }) })
    );
    if (!visit) return;
    if (knownVisitIds.includes(visit.id)) setExisting(visit);
    else {
      onArrived(visit);
      onClose();
    }
  };

  const hint =
    who && !complaint
      ? 'Choose the complaint to register the arrival.'
      : tab === 'card' && !who ? 'Tap the card on the reader, or type its number and press Enter.' : tab === 'search' && !who ? 'Search and pick the patient.' : tab === 'emergency' && !who ? 'Sex, a rough age and a short description are needed.' : '';
  const titleId = `${uid}-title`;

  return createPortal(
    <div className="modal-overlay" onClick={tryClose}>
      <div ref={boxRef} className="modal-content-box admit-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id={titleId} className="admit-title">
            <Siren size={18} color="var(--blue-text)" aria-hidden="true" />
            New arrival
          </h3>
          <button type="button" onClick={tryClose} disabled={busy !== null} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={(e) => void submit(e)}>
          <div className="modal-body admit-body">
            {existing ? (
              <div className="admit-notice is-info" role="status">
                <div className="admit-notice-body">
                  <p>
                    {existing.patientName} is already in the ER as {existing.number}. No new visit was made.
                  </p>
                  <div className="admit-notice-actions">
                    <button type="button" className="btn-primary btn-sm" onClick={() => { onArrived(existing); onClose(); }}>
                      Open {existing.number}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bagent-filters" role="tablist" aria-label="How the patient is identified">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      id={`${uid}-tab-${t.id}`}
                      aria-selected={tab === t.id}
                      aria-controls={`${uid}-panel`}
                      className={`chip-btn${tab === t.id ? ' active' : ''}`}
                      onClick={() => { setTab(t.id); setError(null); }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${tab}`} className="admit-section">
                  {tab === 'card' && (
                    <div>
                      <label className="form-label" htmlFor={`${uid}-card`}>Card number</label>
                      <input
                        id={`${uid}-card`}
                        className="input-field"
                        style={{ fontFamily: 'var(--font-mono)' }}
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        maxLength={60}
                        value={cardId}
                        onChange={(e) => { setError(null); setCardId(e.target.value); }}
                        placeholder="Tap the card on the reader"
                      />
                    </div>
                  )}
                  {tab === 'search' && (
                    <div>
                      {patient ? (
                        <>
                          <span className="form-label">Patient</span>
                          <div className="admit-patient">
                            <div>
                              <div className="admit-patient-name">{patient.name}</div>
                              <div className="admit-patient-detail">{patient.uhid} · {patient.age} yrs · {patient.gender}</div>
                            </div>
                            <button type="button" className="btn-secondary btn-sm" onClick={() => setPatient(null)}>
                              Change
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="form-label" htmlFor={`${uid}-search`}>Name, UHID or phone</label>
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
                        </>
                      )}
                    </div>
                  )}
                  {tab === 'emergency' && (
                    <>
                      <p className="er-hint">For a patient who cannot give details. A placeholder record is made; fill it in later.</p>
                      <div className="cols-2" style={{ gap: 12 }}>
                        <div>
                          <label className="form-label" htmlFor={`${uid}-sex`}>Sex *</label>
                          <select id={`${uid}-sex`} className="form-select" value={gender} onChange={(e) => setGender(e.target.value as typeof gender)}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label" htmlFor={`${uid}-age`}>Approximate age *</label>
                          <input id={`${uid}-age`} className="input-field" type="number" inputMode="numeric" min={0} max={120} step={1} value={approxAge} onChange={(e) => setApproxAge(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="form-label" htmlFor={`${uid}-desc`}>Description *</label>
                        <input id={`${uid}-desc`} className="input-field" maxLength={200} placeholder="Clothing, who brought them, anything to recognise them" value={description} onChange={(e) => setDescription(e.target.value)} />
                      </div>
                    </>
                  )}
                </div>

                <div className="cols-2" style={{ gap: 12 }}>
                  <div>
                    <label className="form-label" htmlFor={`${uid}-mode`}>Arrival mode</label>
                    <select id={`${uid}-mode`} className="form-select" value={mode} onChange={(e) => setMode(e.target.value as ErMode)}>
                      {MODES.map((m) => (
                        <option key={m} value={m}>{MODE_LABEL[m]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor={`${uid}-complaint`}>Complaint *</label>
                    <select id={`${uid}-complaint`} className="form-select" value={complaint} onChange={(e) => setComplaint(e.target.value)}>
                      <option value="">{complaints || !complaintsError ? 'Choose…' : 'Not loaded'}</option>
                      {complaints?.complaints.map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                    {!complaints && complaintsError && (
                      <p className="er-error" role="alert">
                        The complaint list did not load.{' '}
                        <button type="button" className="btn-secondary btn-sm" onClick={onRetryComplaints}>
                          Try again
                        </button>
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="form-label" htmlFor={`${uid}-text`}>In their words (optional)</label>
                  <input id={`${uid}-text`} className="input-field" maxLength={300} value={complaintText} onChange={(e) => setComplaintText(e.target.value)} />
                </div>
                {waiting.length > 0 && (
                  <div>
                    <label className="form-label" htmlFor={`${uid}-expected`}>Was this patient expected? (optional)</label>
                    <select id={`${uid}-expected`} className="form-select" value={expectedId} onChange={(e) => pickExpected(e.target.value)}>
                      <option value="">No</option>
                      {waiting.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.complaint} · {x.ageSex} · {MODE_LABEL[x.mode]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {hint && <p className="admit-hint">{hint}</p>}
              </>
            )}
          </div>
          {error && (
            <p className="admit-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={tryClose} disabled={busy !== null}>
              {existing ? 'Close' : 'Cancel'}
            </button>
            {!existing && (
              <button type="submit" className="btn-primary" disabled={!ready || busy !== null}>
                {busy ? 'Registering…' : 'Register arrival'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
