import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ErComplaintInfo, ErTriageSuggestion, ErVisit, ErVitals, TriageColour } from '../../types';
import { erService } from '../../services';
import { errorMessage } from '../../services/api';
import { COLOUR_LABEL, COLOUR_RANK, TRIAGE_COLOURS } from '../../utils/er';
import { SampleBadge } from '../common/SampleBadge';
import { useErAction } from './useErAction';

const SUGGEST_DEBOUNCE_MS = 300;

/** The ranges match the server's checks. */
const FIELDS: { key: keyof ErVitals; label: string; min: number; max: number; step: number }[] = [
  { key: 'spo2', label: 'SpO₂ (%)', min: 50, max: 100, step: 1 },
  { key: 'bpSystolic', label: 'BP systolic', min: 40, max: 300, step: 1 },
  { key: 'bpDiastolic', label: 'BP diastolic', min: 20, max: 200, step: 1 },
  { key: 'heartRate', label: 'Heart rate', min: 20, max: 250, step: 1 },
  { key: 'respiratoryRate', label: 'Resp. rate', min: 4, max: 80, step: 1 },
  { key: 'temperature', label: 'Temp (°C)', min: 30, max: 45, step: 0.1 }
];
const PAIN_MAX = 10;

type Typed = Partial<Record<keyof ErVitals, string>>;

interface Parsed {
  vitals: ErVitals;
  pain: number | undefined;
  /** One message per field that is out of range or not a number. */
  problems: Partial<Record<keyof ErVitals | 'pain', string>>;
}

function parse(typed: Typed, pain: string): Parsed {
  const vitals: ErVitals = {};
  const problems: Parsed['problems'] = {};
  for (const f of FIELDS) {
    const raw = (typed[f.key] ?? '').trim();
    if (!raw) continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < f.min || n > f.max) problems[f.key] = `${f.min} to ${f.max}`;
    else vitals[f.key] = n;
  }
  let painScore: number | undefined;
  if (pain.trim()) {
    const n = Number(pain);
    if (!Number.isInteger(n) || n < 0 || n > PAIN_MAX) problems.pain = `Whole number, 0 to ${PAIN_MAX}`;
    else painScore = n;
  }
  return { vitals, pain: painScore, problems };
}

const startValues = (v: ErVitals | null): Typed => Object.fromEntries(FIELDS.map((f) => [f.key, v?.[f.key] === undefined ? '' : String(v[f.key])]));

interface TriageFormProps {
  visit: ErVisit;
  complaints: ErComplaintInfo | null;
  onDone(visit: ErVisit): void;
}

/** Vitals, complaint and pain; the rules suggest a colour live, and the nurse confirms or picks another. */
export const TriageForm: React.FC<TriageFormProps> = ({ visit, complaints, onDone }) => {
  const uid = useId();
  const { busy, error, setError, run } = useErAction();
  const [complaint, setComplaint] = useState(visit.complaint);
  const [typed, setTyped] = useState<Typed>(() => startValues(visit.vitals));
  const [pain, setPain] = useState(visit.painScore === null ? '' : String(visit.painScore));
  const [colour, setColour] = useState<TriageColour | null>(null);
  const [reason, setReason] = useState('');
  const picked = useRef(false);

  const [suggestion, setSuggestion] = useState<ErTriageSuggestion | null>(null);
  const [checking, setChecking] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const latest = useRef(0);

  const parsed = useMemo(() => parse(typed, pain), [typed, pain]);
  const problemCount = Object.keys(parsed.problems).length;
  // A stable key for the effect: the numbers, not the typed text.
  const inputKey = JSON.stringify([complaint, parsed.vitals, parsed.pain, problemCount]);

  useEffect(() => {
    if (!complaint || problemCount) {
      // Anything still on its way is now out of date.
      latest.current++;
      return;
    }
    const id = ++latest.current;
    setChecking(true);
    const timer = window.setTimeout(() => {
      erService
        .suggestTriage({ complaint, vitals: parsed.vitals, painScore: parsed.pain })
        .then((s) => {
          // An answer that arrives after a newer request was sent is out of date.
          if (id !== latest.current) return;
          setSuggestion(s);
          setSuggestError(null);
          setChecking(false);
          if (!picked.current) setColour(s.colour);
        })
        .catch((err) => {
          if (id !== latest.current) return;
          setSuggestError(errorMessage(err));
          setChecking(false);
        });
    }, SUGGEST_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // inputKey carries the parsed values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey]);

  // Invalid readings stop any check in flight, so it cannot show as still running.
  const showChecking = checking && problemCount === 0;
  const lower = colour !== null && suggestion !== null && COLOUR_RANK[colour] > COLOUR_RANK[suggestion.colour];
  const canSave = !!complaint && !!colour && problemCount === 0 && (!lower || reason.trim().length > 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || !colour) return;
    const saved = await run('triage', () =>
      erService.triage(visit.id, {
        complaint,
        ...(Object.keys(parsed.vitals).length > 0 && { vitals: parsed.vitals }),
        ...(parsed.pain !== undefined && { painScore: parsed.pain }),
        colour,
        ...(lower && { reason: reason.trim() })
      })
    );
    if (saved) onDone(saved);
  };

  return (
    <form className="er-triage" onSubmit={(e) => void submit(e)} aria-label="Triage">
      <div>
        <label className="form-label" htmlFor={`${uid}-complaint`}>Complaint *</label>
        <select id={`${uid}-complaint`} className="form-select" value={complaint} onChange={(e) => { setError(null); setComplaint(e.target.value); }}>
          {!complaints && <option value={complaint}>{complaint}</option>}
          {complaints?.complaints.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="er-vitals">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="form-label" htmlFor={`${uid}-${f.key}`}>{f.label}</label>
            <input
              id={`${uid}-${f.key}`}
              className="input-field"
              type="number"
              inputMode="decimal"
              min={f.min}
              max={f.max}
              step={f.step}
              value={typed[f.key] ?? ''}
              aria-invalid={!!parsed.problems[f.key]}
              aria-describedby={parsed.problems[f.key] ? `${uid}-${f.key}-err` : undefined}
              onChange={(e) => { setError(null); setTyped((t) => ({ ...t, [f.key]: e.target.value })); }}
            />
            {parsed.problems[f.key] && <p id={`${uid}-${f.key}-err`} className="er-field-error">{parsed.problems[f.key]}</p>}
          </div>
        ))}
        <div>
          <label className="form-label" htmlFor={`${uid}-pain`}>Pain (0 to {PAIN_MAX})</label>
          <input
            id={`${uid}-pain`}
            className="input-field"
            type="number"
            inputMode="numeric"
            min={0}
            max={PAIN_MAX}
            step={1}
            value={pain}
            aria-invalid={!!parsed.problems.pain}
            aria-describedby={parsed.problems.pain ? `${uid}-pain-err` : undefined}
            onChange={(e) => { setError(null); setPain(e.target.value); }}
          />
          {parsed.problems.pain && <p id={`${uid}-pain-err`} className="er-field-error">{parsed.problems.pain}</p>}
        </div>
      </div>

      <div className="er-suggest" aria-live="polite" aria-busy={showChecking}>
        <div className="er-suggest-head">
          <span className="form-label" style={{ margin: 0 }}>Suggested colour</span>
          {suggestion && <span className={`tri-pill ${suggestion.colour}`}>{COLOUR_LABEL[suggestion.colour]}</span>}
          {suggestion?.sample && <SampleBadge />}
          {showChecking && <span className="er-hint">Checking…</span>}
        </div>
        {suggestError && <p className="er-field-error">{suggestError}</p>}
        {suggestion ? (
          <>
            <ul className="er-reasons">
              {suggestion.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {suggestion.explanation && <p className="er-explain">{suggestion.explanation}</p>}
          </>
        ) : (
          !suggestError && <p className="er-hint">{problemCount ? 'Fix the readings marked above to get a suggestion.' : 'Choose a complaint to get a suggestion.'}</p>
        )}
      </div>

      <fieldset className="admit-fieldset">
        <legend className="form-label">Triage colour *</legend>
        <div className="admit-options">
          {TRIAGE_COLOURS.map((c) => (
            <label key={c} className={`admit-option${colour === c ? ' is-on' : ''}`}>
              <input type="radio" name={`${uid}-colour`} value={c} checked={colour === c} onChange={() => { picked.current = true; setColour(c); }} />
              <span className={`tri-dot ${c}`} aria-hidden="true" />
              {COLOUR_LABEL[c]}
              {suggestion?.colour === c && <span className="er-hint">suggested</span>}
            </label>
          ))}
        </div>
      </fieldset>

      {lower && (
        <div>
          <label className="form-label" htmlFor={`${uid}-reason`}>Why lower than suggested? *</label>
          <input id={`${uid}-reason`} className="input-field" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} required />
        </div>
      )}

      {error && (
        <p className="er-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={!canSave || busy !== null}>
        {busy === 'triage' ? 'Saving…' : 'Confirm triage'}
      </button>
    </form>
  );
};
