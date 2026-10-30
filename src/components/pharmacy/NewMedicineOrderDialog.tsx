import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Pill, Plus, Search, Trash2 } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { pharmacyAgentService } from '../../services';
import { errorMessage } from '../../services/api';
import { useErAction } from '../er/useErAction';
import type { Patient, PharmacyCatalogue, PharmacyCatalogueMedicine, PharmacyCheckResult, PharmacyFlag, PharmacyLineInput, PharmacyOrderView, PharmacyPriority } from '../../types';
import { PRIORITY_LABEL } from '../../utils/pharmacy';
import { LabDialogShell } from '../lab/LabDialogShell';
import { FlagRows } from './PharmacyFlags';

const MAX_LINES = 10;
const MATCH_LIMIT = 6;
const CHECK_MS = 400;
const PRIORITIES: PharmacyPriority[] = ['stat', 'urgent', 'routine'];
const DEFAULT_DAYS = '5';

type PatientLite = Pick<Patient, 'id' | 'name' | 'uhid'> & Partial<Pick<Patient, 'age' | 'gender' | 'allergies'>>;

interface Row {
  key: number;
  medicine: string;
  product: string;
  dose: string;
  route: string;
  frequency: string;
  days: string;
  note: string;
  /** The doctor knows about a red allergy on this line and says why. */
  known: boolean;
  reason: string;
}

interface NewMedicineOrderDialogProps {
  /** A fixed patient (an order from the patient's own page): the search is skipped. */
  initialPatient?: PatientLite;
  onClose(): void;
  /** After an order is saved: the lists reload. */
  onOrdered(order: PharmacyOrderView): void;
}

/** The line as the API takes it, or null while a field is not yet valid (no check is sent then). */
function toInput(r: Row, hasDuration: boolean): PharmacyLineInput | null {
  const dose = Number(r.dose);
  if (!r.dose.trim() || !Number.isFinite(dose) || dose <= 0 || dose > 100000) return null;
  const line: PharmacyLineInput = { medicine: r.medicine, product: r.product, dose, route: r.route, frequency: r.frequency };
  if (hasDuration) {
    const days = Number(r.days);
    if (!Number.isInteger(days) || days < 1 || days > 90) return null;
    line.durationDays = days;
  }
  if (r.note.trim()) line.note = r.note.trim();
  return line;
}

const redAllergy = (flags: PharmacyFlag[] | undefined) => (flags ?? []).some((f) => f.severity === 'red' && f.kind === 'allergy');

/** Order medicines for a patient. Fixed rules flag each line live; a red allergy needs the doctor's reason. */
export const NewMedicineOrderDialog: React.FC<NewMedicineOrderDialogProps> = ({ initialPatient, onClose, onOrdered }) => {
  const { patients } = useApp();
  const uid = useId();
  const nextKey = useRef(1);
  const { busy, error, setError, run } = useErAction();

  const [catalogue, setCatalogue] = useState<PharmacyCatalogue | null>(null);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const [loadTries, setLoadTries] = useState(0);
  const [patientQuery, setPatientQuery] = useState('');
  const [medQuery, setMedQuery] = useState('');
  const [patient, setPatient] = useState<PatientLite | null>(initialPatient ?? null);
  const [rows, setRows] = useState<Row[]>([]);
  const [priority, setPriority] = useState<PharmacyPriority>('routine');
  const [note, setNote] = useState('');
  const [created, setCreated] = useState<PharmacyOrderView | null>(null);

  // The live check: what the last request said, whether one is running, and its own error.
  const [result, setResult] = useState<PharmacyCheckResult | null>(null);
  const [checkedFor, setCheckedFor] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    pharmacyAgentService
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

  const medicineOf = (key: string): PharmacyCatalogueMedicine | undefined => catalogue?.medicines.find((m) => m.key === key);
  const hasDuration = useCallback((frequency: string) => catalogue?.frequencies.find((f) => f.key === frequency)?.hasDuration ?? frequency !== 'STAT', [catalogue]);
  /** A new patient or a new product: no allergy confirmation carries over, whoever or whatever it was written for. */
  const choosePatient = (p: PatientLite | null) => {
    setPatient(p);
    setResult(null);
    setCheckedFor('');
    setCheckError(null);
    setRows((rs) => rs.map((r) => ({ ...r, known: false, reason: '' })));
  };

  const pq = patientQuery.trim().toLowerCase();
  const patientMatches = useMemo(
    () => (pq.length < 2 ? [] : patients.filter((p) => p.name.toLowerCase().includes(pq) || p.uhid.toLowerCase().includes(pq) || p.phone.includes(pq)).slice(0, MATCH_LIMIT)),
    [patients, pq]
  );

  const mq = medQuery.trim().toLowerCase();
  const medMatches = useMemo(() => {
    if (!catalogue || mq.length < 1) return [];
    return catalogue.medicines
      .filter((m) => m.name.toLowerCase().includes(mq) || m.key.toLowerCase().includes(mq) || (m.aliases ?? []).some((a) => a.toLowerCase().includes(mq)) || m.classLabel.toLowerCase().includes(mq) || m.products.some((p) => p.label.toLowerCase().includes(mq)))
      .slice(0, MATCH_LIMIT);
  }, [catalogue, mq]);

  const addMedicine = (m: PharmacyCatalogueMedicine) => {
    const p = m.products[0];
    if (!p || rows.length >= MAX_LINES) return;
    setError(null);
    setRows((rs) => [
      ...rs,
      { key: nextKey.current++, medicine: m.key, product: p.key, dose: String(p.strength), route: p.routes[0] ?? 'oral', frequency: 'OD', days: DEFAULT_DAYS, note: '', known: false, reason: '' }
    ]);
    setMedQuery('');
  };
  const patchRow = (key: number, patch: Partial<Row>) => {
    setError(null);
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };
  const changeProduct = (r: Row, productKey: string) => {
    const p = medicineOf(r.medicine)?.products.find((x) => x.key === productKey);
    if (!p) return;
    patchRow(r.key, { known: false, reason: '', product: productKey, dose: String(p.strength), route: p.routes.includes(r.route) ? r.route : (p.routes[0] ?? r.route) });
  };

  // The lines the check sends. It is a string, so an unchanged form does not call again.
  const inputs = useMemo(() => rows.map((r) => toInput(r, hasDuration(r.frequency))), [rows, hasDuration]);
  const allValid = rows.length > 0 && inputs.every((l) => l !== null);
  const checkKey = patient && allValid ? JSON.stringify([patient.id, inputs]) : '';

  useEffect(() => {
    if (!checkKey) return;
    // The key holds everything the request needs, so the effect depends on it alone.
    const [patientId, lines] = JSON.parse(checkKey) as [string, PharmacyLineInput[]];
    let alive = true;
    const timer = window.setTimeout(() => {
      setChecking(true);
      pharmacyAgentService
        .check({ patientId, lines })
        .then((r) => {
          if (!alive) return;
          setResult(r);
          setCheckedFor(checkKey);
          setCheckError(null);
        })
        .catch((err) => alive && setCheckError(errorMessage(err)))
        .finally(() => alive && setChecking(false));
    }, CHECK_MS);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [checkKey]);

  const fresh = !!checkKey && checkedFor === checkKey && !checking && !checkError && result !== null;
  const flagsOf = (i: number): PharmacyFlag[] | undefined => (fresh ? result.lines[i]?.flags : undefined);
  const unconfirmed = fresh ? rows.filter((r, i) => redAllergy(flagsOf(i)) && !(r.known && r.reason.trim())).length : 0;
  const redCount = fresh ? result.lines.reduce((n, l) => n + l.flags.filter((f) => f.severity === 'red').length, 0) : 0;
  const ready = !!patient && allValid && fresh && unconfirmed === 0;

  const hint = !patient
    ? 'Search and pick the patient.'
    : rows.length === 0
      ? 'Add at least one medicine.'
      : !allValid
        ? 'Check the dose and the days: a dose above 0, and 1 to 90 days.'
        : checkError
          ? 'The safety check did not finish. Change a field or try again.'
          : !fresh
            ? 'Checking the safety rules…'
            : unconfirmed > 0
              ? `Confirm ${unconfirmed === 1 ? 'the red allergy' : `${unconfirmed} red allergies`} above to place the order.`
              : '';

  // The last answer's facts stay on screen while the next check runs.
  const facts = result?.patient ?? null;
  const allergies = facts?.allergies ?? patient?.allergies;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !ready) return;
    const lines = rows.map((r, i) => {
      const line = inputs[i] as PharmacyLineInput;
      return redAllergy(flagsOf(i)) ? { ...line, confirm: { reason: r.reason.trim() } } : line;
    });
    const order = await run('order', () => pharmacyAgentService.placeOrder({ patientId: patient.id, priority, ...(note.trim() && { note: note.trim() }), lines }));
    if (!order) return;
    setCreated(order);
    onOrdered(order);
  };

  return (
    <LabDialogShell title={created ? 'Order placed' : 'New medicine order'} icon={<Pill size={18} color="var(--blue-text)" aria-hidden="true" />} busy={busy !== null} onClose={onClose}>
      {created ? (
        <>
          <div className="modal-body admit-body">
            <div className="admit-notice is-info" role="status">
              <div className="admit-notice-body">
                <p>
                  Order <strong className="lab-num">{created.number}</strong> placed for {created.patientName}. The pharmacist will check it.
                </p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={(e) => void submit(e)}>
          <div className="modal-body admit-body ph-order-body">
            {patient ? (
              <div>
                <span className="form-label">Patient</span>
                <div className="admit-patient">
                  <div>
                    <div className="admit-patient-name">{patient.name}</div>
                    <div className="admit-patient-detail">
                      {patient.uhid}
                      {patient.age !== undefined ? ` · ${patient.age} yrs` : ''}
                      {patient.gender ? ` · ${patient.gender}` : ''}
                    </div>
                  </div>
                  {!initialPatient && (
                    <button type="button" className="btn-secondary btn-sm" onClick={() => choosePatient(null)}>
                      Change
                    </button>
                  )}
                </div>
                <dl className="ph-facts ph-order-facts">
                  <div className="ph-fact-wide">
                    <dt>Allergies</dt>
                    <dd>{allergies === undefined ? '—' : allergies.length ? allergies.join(', ') : 'No allergies recorded'}</dd>
                  </div>
                  <div>
                    <dt>Weight</dt>
                    <dd>{facts ? (facts.weightKg === null ? 'Not recorded' : `${facts.weightKg} kg`) : '—'}</dd>
                  </div>
                  <div>
                    <dt>Age</dt>
                    <dd>{facts ? (facts.age === null ? '—' : `${facts.age} yrs`) : patient.age !== undefined ? `${patient.age} yrs` : '—'}</dd>
                  </div>
                  <div>
                    <dt>eGFR</dt>
                    <dd>{facts ? (facts.egfr === null ? 'Not recorded' : facts.egfr) : '—'}</dd>
                  </div>
                </dl>
                {!facts && <p className="admit-hint">Weight and kidney function show once you add a medicine.</p>}
              </div>
            ) : (
              <div>
                <label className="form-label" htmlFor={`${uid}-patient`}>Patient: name, UHID or phone</label>
                <div className="admit-search">
                  <Search size={15} aria-hidden="true" />
                  <input id={`${uid}-patient`} className="input-field" autoComplete="off" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} />
                </div>
                {pq.length >= 2 && (
                  <div className="admit-listbox" style={{ position: 'static', marginTop: 6 }}>
                    {patientMatches.length === 0 ? (
                      <p className="admit-listbox-empty">No patient found.</p>
                    ) : (
                      <ul>
                        {patientMatches.map((p) => (
                          <li key={p.id}>
                            <button type="button" className="er-pick" onClick={() => choosePatient(p)}>
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

            <div className="ph-meds">
              <div className="lab-pick-head">
                <span className="form-label">Medicines</span>
                <span className="admit-count" aria-live="polite">{rows.length} of {MAX_LINES} added</span>
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
                  <p className="data-empty">Loading the medicine list…</p>
                )
              ) : (
                <>
                  <div>
                    <label className="form-label" htmlFor={`${uid}-med`}>Find a medicine: name or group</label>
                    <div className="admit-search">
                      <Search size={15} aria-hidden="true" />
                      <input id={`${uid}-med`} className="input-field" autoComplete="off" disabled={rows.length >= MAX_LINES} placeholder="For example ibuprofen" value={medQuery} onChange={(e) => setMedQuery(e.target.value)} />
                    </div>
                    {mq.length >= 1 && (
                      <div className="admit-listbox" style={{ position: 'static', marginTop: 6 }}>
                        {medMatches.length === 0 ? (
                          <p className="admit-listbox-empty">No medicine matches. Ask the pharmacist to add it.</p>
                        ) : (
                          <ul>
                            {medMatches.map((m) => (
                              <li key={m.key}>
                                <button type="button" className="er-pick" onClick={() => addMedicine(m)}>
                                  <span className="admit-patient-name"><Plus size={13} aria-hidden="true" /> {m.name}</span>
                                  <span className="admit-patient-detail">{m.classLabel}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  {rows.map((r, i) => (
                    <LineEditor
                      key={r.key}
                      uid={`${uid}-l${r.key}`}
                      row={r}
                      medicine={medicineOf(r.medicine)}
                      catalogue={catalogue}
                      flags={flagsOf(i)}
                      onPatch={(p) => patchRow(r.key, p)}
                      onProduct={(k) => changeProduct(r, k)}
                      onRemove={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                    />
                  ))}
                  {rows.length > 0 && (
                    <p className="ph-check-state" role="status" aria-live="polite">
                      {checkError ? <span className="ph-check-fail">{checkError}</span> : checking || (allValid && !fresh) ? 'Checking…' : fresh ? (redCount ? `${redCount} red ${redCount === 1 ? 'flag' : 'flags'} found.` : 'No red flags found.') : ''}
                    </p>
                  )}
                </>
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
              <label className="form-label" htmlFor={`${uid}-note`}>Order note (optional)</label>
              <textarea id={`${uid}-note`} className="input-field" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
              <p className="admit-hint"><span className="admit-count">{note.length} / 500</span></p>
            </div>
            {hint && <p className="admit-hint">{hint}</p>}
          </div>
          {error && (
            <p className="admit-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={busy !== null}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!ready || busy !== null}>
              {busy ? 'Placing order…' : 'Place order'}
            </button>
          </div>
        </form>
      )}
    </LabDialogShell>
  );
};

interface LineEditorProps {
  uid: string;
  row: Row;
  medicine: PharmacyCatalogueMedicine | undefined;
  catalogue: PharmacyCatalogue;
  /** The live flags for this line; undefined while a check is pending. */
  flags: PharmacyFlag[] | undefined;
  onPatch(p: Partial<Row>): void;
  onProduct(key: string): void;
  onRemove(): void;
}

const LineEditor: React.FC<LineEditorProps> = ({ uid, row, medicine, catalogue, flags, onPatch, onProduct, onRemove }) => {
  const product = medicine?.products.find((p) => p.key === row.product);
  const routes = product?.routes ?? [row.route];
  const withDuration = catalogue.frequencies.find((f) => f.key === row.frequency)?.hasDuration ?? row.frequency !== 'STAT';
  const allergy = redAllergy(flags);
  return (
    <fieldset className={`ph-line${flags?.some((f) => f.severity === 'red') ? ' has-red' : ''}`}>
      <legend className="ph-line-legend">{medicine?.name ?? row.medicine}</legend>
      <div className="ph-line-grid">
        <div className="ph-f-product">
          <label className="form-label" htmlFor={`${uid}-prod`}>Product</label>
          <select id={`${uid}-prod`} className="form-select" value={row.product} onChange={(e) => onProduct(e.target.value)}>
            {(medicine?.products ?? []).map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor={`${uid}-dose`}>Dose{product ? ` (${product.unit})` : ''}</label>
          <input id={`${uid}-dose`} className="input-field" type="number" inputMode="decimal" min={0} step="any" value={row.dose} onChange={(e) => onPatch({ dose: e.target.value })} />
        </div>
        <div>
          <label className="form-label" htmlFor={`${uid}-route`}>Route</label>
          <select id={`${uid}-route`} className="form-select" value={row.route} onChange={(e) => onPatch({ route: e.target.value })}>
            {routes.map((rt) => (
              <option key={rt} value={rt}>{catalogue.routes.find((x) => x.key === rt)?.label ?? rt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor={`${uid}-freq`}>Frequency</label>
          <select id={`${uid}-freq`} className="form-select" value={row.frequency} onChange={(e) => onPatch({ frequency: e.target.value })}>
            {catalogue.frequencies.map((f) => (
              <option key={f.key} value={f.key}>{f.key}</option>
            ))}
          </select>
        </div>
        {withDuration && (
          <div>
            <label className="form-label" htmlFor={`${uid}-days`}>Days</label>
            <input id={`${uid}-days`} className="input-field" type="number" inputMode="numeric" min={1} max={90} step={1} value={row.days} onChange={(e) => onPatch({ days: e.target.value })} />
          </div>
        )}
      </div>
      <div>
        <label className="form-label" htmlFor={`${uid}-note`}>Line note (optional)</label>
        <input id={`${uid}-note`} className="input-field" maxLength={500} value={row.note} onChange={(e) => onPatch({ note: e.target.value })} />
      </div>

      {flags && flags.length > 0 && <FlagRows flags={flags} />}
      {flags && flags.length === 0 && <p className="er-hint">No flags on this line.</p>}

      {allergy && (
        <div className="ph-confirm">
          <label className="admit-stay">
            <input type="checkbox" checked={row.known} onChange={(e) => onPatch({ known: e.target.checked })} />
            I know about this allergy
          </label>
          <label className="form-label" htmlFor={`${uid}-why`}>Reason for ordering it anyway</label>
          <textarea id={`${uid}-why`} className="input-field" rows={2} maxLength={300} disabled={!row.known} value={row.reason} onChange={(e) => onPatch({ reason: e.target.value })} />
          <p className="admit-hint"><span className="admit-count">{row.reason.length} / 300</span></p>
        </div>
      )}
      <div className="ph-line-end">
        <button type="button" className="btn-secondary btn-sm" onClick={onRemove}>
          <Trash2 size={13} aria-hidden="true" />
          Remove
        </button>
      </div>
    </fieldset>
  );
};
