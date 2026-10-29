import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { erService } from '../../services';
import type { ErExpected, ErMode } from '../../types';
import { clinicNow, displayTime } from '../../utils/clinicDate';
import { MODE_LABEL } from '../../utils/er';
import { useErAction } from './useErAction';

const MODES: ErMode[] = ['walk-in', 'ambulance', 'referred'];
const MIN_MS = 60_000;

/** "due in 12 min" / "8 min overdue". Counted on the clinic clock, which is the clock expectedAt is stored in. */
const dueText = (e: ErExpected, now: number): { text: string; late: boolean } => {
  const m = Math.round((new Date(e.expectedAt).getTime() - now) / MIN_MS);
  const span = (n: number) => (n >= 120 ? `${Math.round(n / 60)} h` : `${n} min`);
  return m >= 0 ? { text: m === 0 ? 'due now' : `due in ${span(m)}`, late: false } : { text: `${span(-m)} overdue`, late: true };
};

interface Props {
  expected: ErExpected[];
  canAdd: boolean;
  onChanged(): void;
}

/** People the hospital has been told are on the way, above the queue. Staff can add one or remove one. */
export const ErExpectedArrivals: React.FC<Props> = ({ expected, canAdd, onChanged }) => {
  const [now, setNow] = useState(() => clinicNow().getTime());
  useEffect(() => {
    const t = window.setInterval(() => setNow(clinicNow().getTime()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const [adding, setAdding] = useState(false);
  const [complaint, setComplaint] = useState('');
  const [ageSex, setAgeSex] = useState('');
  const [mode, setMode] = useState<ErMode>('ambulance');
  const [eta, setEta] = useState('15');
  const [phone, setPhone] = useState('');
  const { busy, error, setError, run } = useErAction();
  const waiting = expected.filter((e) => e.state === 'waiting').sort((a, b) => new Date(a.expectedAt).getTime() - new Date(b.expectedAt).getTime());

  const etaNum = Number(eta);
  const etaOk = eta.trim() !== '' && Number.isInteger(etaNum) && etaNum >= 1 && etaNum <= 240;
  const valid = complaint.trim() !== '' && ageSex.trim() !== '' && etaOk;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setError(!etaOk ? 'ETA must be a whole number of minutes, 1 to 240.' : 'Add the complaint and the age and sex.');
      return;
    }
    const done = await run('add', () =>
      erService.addExpected({ complaint: complaint.trim(), ageSex: ageSex.trim(), mode, etaMinutes: etaNum, ...(phone.trim() && { phone: phone.trim() }) })
    );
    if (done) {
      setAdding(false);
      setComplaint('');
      setAgeSex('');
      setPhone('');
      setEta('15');
      onChanged();
    }
  };

  const remove = async (id: string) => {
    const done = await run(`remove-${id}`, () => erService.deleteExpected(id));
    if (done) onChanged();
  };

  return (
    <section className="medios-card bagent-card er-expected" aria-label="Expected arrivals">
      <div className="card-header-row">
        <div className="bagent-title-group">
          <h3 className="card-title">Expected arrivals</h3>
          <span className="bagent-hint">{waiting.length ? `${waiting.length} on the way` : ''}</span>
        </div>
        {canAdd && !adding && (
          <button type="button" className="btn-outline-blue btn-sm" onClick={() => setAdding(true)}>
            <Plus size={14} aria-hidden="true" /> Add
          </button>
        )}
      </div>

      {adding && (
        <form className="er-exp-form" onSubmit={(e) => void submit(e)}>
          <label className="er-exp-field er-exp-wide">
            <span className="form-label">Complaint *</span>
            <input className="input-field" value={complaint} maxLength={200} onChange={(e) => { setError(null); setComplaint(e.target.value); }} />
          </label>
          <label className="er-exp-field">
            <span className="form-label">Age and sex *</span>
            <input className="input-field" placeholder="45 M" value={ageSex} maxLength={40} onChange={(e) => { setError(null); setAgeSex(e.target.value); }} />
          </label>
          <label className="er-exp-field">
            <span className="form-label">Mode</span>
            <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value as ErMode)}>
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {MODE_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="er-exp-field">
            <span className="form-label">Arrives in (min) *</span>
            <input className="input-field" type="number" inputMode="numeric" min={1} max={240} step={1} value={eta} onChange={(e) => { setError(null); setEta(e.target.value); }} />
          </label>
          <label className="er-exp-field">
            <span className="form-label">Phone (optional)</span>
            <input className="input-field" type="tel" value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <div className="er-exp-actions">
            <button type="button" className="btn-secondary btn-sm" onClick={() => { setAdding(false); setError(null); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-sm" disabled={busy === 'add'}>
              {busy === 'add' ? 'Adding…' : 'Add arrival'}
            </button>
          </div>
        </form>
      )}
      {error && (
        <p className="er-error" role="alert">
          {error}
        </p>
      )}

      {waiting.length === 0 ? (
        <p className="data-empty">{adding ? '' : 'Nobody is on the way.'}</p>
      ) : (
        <ul className="er-exp-list">
          {waiting.map((e) => {
            const due = dueText(e, now);
            return (
              <li key={e.id} className="er-exp-card">
                <div className="er-exp-main">
                  <span className="er-name er-exp-complaint">{e.complaint}</span>
                  <span className="er-sub">
                    {e.ageSex} · {MODE_LABEL[e.mode]} · {displayTime(new Date(e.expectedAt))}
                  </span>
                </div>
                <span className={`status-pill sm ${due.late ? 'red' : 'blue'}`}>{due.text}</span>
                {canAdd && (
                  <button type="button" className="cs-ib" aria-label={`Remove expected arrival: ${e.complaint}`} disabled={busy === `remove-${e.id}`} onClick={() => void remove(e.id)}>
                    <X size={15} aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
