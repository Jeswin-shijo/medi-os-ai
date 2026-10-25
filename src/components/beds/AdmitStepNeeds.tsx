import React, { useId, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import type { Need, Patient, RoomClass } from '../../types';
import { NEED_OPTIONS, ROOM_CLASS_OPTIONS, offersEmergency } from '../../utils/beds';

export const NOTES_MAX = 4000;
const MATCH_LIMIT = 8;

/** What step 1 collects. */
export interface AdmitForm {
  patientId: string;
  doctor: string;
  department: string;
  /** null: follow the default class for the patient's age and needs. */
  roomClass: RoomClass | null;
  needs: Need[];
  notes: string;
  /** Expected stay in days, as typed. */
  stay: string;
}

interface AdmitStepNeedsProps {
  form: AdmitForm;
  onChange: (patch: Partial<AdmitForm>) => void;
  /** The class the request will use: the one picked, or the default. */
  roomClass: RoomClass;
  /** Shown read-only in place of the patient search: a given patient, or the patient being moved. */
  fixedPatient?: { name: string; detail: string };
  patients: Patient[];
  onPickPatient: (patient: Patient) => void;
}

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean))).sort();
const patientDetail = (p: Patient) => `${p.uhid} · ${p.age} yrs · ${p.gender}`;

/** Step 1: who is admitted, by whom, to which class, with which needs. */
export const AdmitStepNeeds: React.FC<AdmitStepNeedsProps> = ({ form, onChange, roomClass, fixedPatient, patients, onPickPatient }) => {
  const doctors = useMemo(() => unique(patients.map((p) => p.doctor)), [patients]);
  const departments = useMemo(() => unique(patients.map((p) => p.department)), [patients]);
  const classes = ROOM_CLASS_OPTIONS.filter((o) => o.value !== 'emergency' || offersEmergency(form.department));
  const selected = patients.find((p) => p.id === form.patientId);

  const toggleNeed = (need: Need) =>
    onChange({ needs: form.needs.includes(need) ? form.needs.filter((n) => n !== need) : [...form.needs, need] });

  return (
    <>
      <div>
        {fixedPatient ? (
          <>
            <span className="form-label">Patient</span>
            <div className="admit-patient">
              <div>
                <div className="admit-patient-name">{fixedPatient.name}</div>
                <div className="admit-patient-detail">{fixedPatient.detail}</div>
              </div>
            </div>
          </>
        ) : selected ? (
          <>
            <span className="form-label">Patient *</span>
            <div className="admit-patient">
              <div>
                <div className="admit-patient-name">{selected.name}</div>
                <div className="admit-patient-detail">{patientDetail(selected)}</div>
              </div>
              <button type="button" className="btn-secondary btn-sm" onClick={() => onChange({ patientId: '' })}>
                Change
              </button>
            </div>
          </>
        ) : (
          <PatientPicker patients={patients} onPick={onPickPatient} />
        )}
      </div>

      <div className="cols-2" style={{ gap: 12 }}>
        <div>
          <label className="form-label" htmlFor="admit-doctor">Admitting doctor *</label>
          <input id="admit-doctor" className="input-field" list="admit-doctors" required maxLength={100} value={form.doctor} onChange={(e) => onChange({ doctor: e.target.value })} />
          <datalist id="admit-doctors">
            {doctors.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="form-label" htmlFor="admit-department">Department *</label>
          <input
            id="admit-department"
            className="input-field"
            list="admit-departments"
            required
            maxLength={100}
            value={form.department}
            onChange={(e) => onChange({ department: e.target.value })}
          />
          <datalist id="admit-departments">
            {departments.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
      </div>

      <fieldset className="admit-fieldset">
        <legend className="form-label">Room class</legend>
        <div className="admit-options">
          {classes.map((o) => (
            <label key={o.value} className={`admit-option${roomClass === o.value ? ' is-on' : ''}`}>
              <input type="radio" name="admit-class" value={o.value} checked={roomClass === o.value} onChange={() => onChange({ roomClass: o.value })} />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="admit-fieldset">
        <legend className="form-label">Needs</legend>
        <div className="admit-options">
          {NEED_OPTIONS.map(({ need, label }) => {
            const on = form.needs.includes(need);
            return (
              <button key={need} type="button" className={`admit-option${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggleNeed(need)}>
                {on && <Check size={13} aria-hidden="true" />}
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label className="form-label" htmlFor="admit-notes">Doctor's notes</label>
        <textarea
          id="admit-notes"
          className="input-field"
          rows={3}
          maxLength={NOTES_MAX}
          placeholder="e.g. SpO₂ 89% on room air, suspected pneumonia"
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
        <div className="admit-hint">
          <span className="admit-count">
            {form.notes.length} / {NOTES_MAX}
          </span>
        </div>
      </div>

      <div>
        <label className="form-label" htmlFor="admit-stay">Expected stay *</label>
        <div className="admit-stay">
          <input
            id="admit-stay"
            className="input-field"
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={90}
            step={1}
            value={form.stay}
            onChange={(e) => onChange({ stay: e.target.value })}
          />
          <span>days</span>
        </div>
        <p className="admit-hint">Used only for the cost estimate.</p>
      </div>
    </>
  );
};

/** Type to search patients by name, UHID or phone; arrow keys and Enter pick one. */
const PatientPicker: React.FC<{ patients: Patient[]; onPick: (patient: Patient) => void }> = ({ patients, onPick }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = q ? patients.filter((p) => p.name.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q) || (p.phone ?? '').includes(q)) : patients;
    return found.slice(0, MATCH_LIMIT);
  }, [patients, query]);
  const current = Math.min(active, Math.max(matches.length - 1, 0));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) setOpen(true);
      else if (matches.length) setActive((current + (e.key === 'ArrowDown' ? 1 : matches.length - 1)) % matches.length);
    } else if (e.key === 'Enter' && open) {
      e.preventDefault(); // picks a patient instead of submitting the step
      if (matches[current]) onPick(matches[current]);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault(); // closes the list, not the dialog
      setOpen(false);
    }
  };

  return (
    <>
      <label className="form-label" htmlFor="admit-patient-search">Patient *</label>
      <div className="admit-search">
        <Search size={15} aria-hidden="true" />
        <input
          id="admit-patient-search"
          className="input-field"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[current] ? `${listId}-${current}` : undefined}
          autoComplete="off"
          autoFocus
          placeholder="Search by name, UHID or phone"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && (
        <div className="admit-listbox">
          {matches.length ? (
            <ul id={listId} role="listbox" aria-label="Patients">
              {matches.map((p, i) => (
                <li
                  key={p.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === current}
                  onMouseDown={(e) => e.preventDefault()} // keeps focus in the search box
                  onMouseEnter={() => setActive(i)}
                  onClick={() => onPick(p)}
                >
                  <span className="admit-patient-name">{p.name}</span>
                  <span className="admit-patient-detail">
                    {patientDetail(p)}
                    {p.status === 'Admitted' && ' · Admitted'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p id={listId} className="admit-listbox-empty">
              No patient matches “{query.trim()}”.
            </p>
          )}
        </div>
      )}
    </>
  );
};
