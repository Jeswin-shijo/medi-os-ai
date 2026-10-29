import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { coordinatorService } from '../../services';
import { errorMessage } from '../../services/api';
import { RulesPanel } from './RulesPanel';
import type { DutyTitle, Ladder, StaffUser } from '../../types';

interface DraftStep {
  title: string;
  /** Kept as text while typing. */
  wait: string;
}
interface DraftLadder {
  key: string;
  label: string;
  steps: DraftStep[];
}

const toDraft = (l: Ladder): DraftLadder => ({
  key: l.key,
  label: l.label,
  steps: l.steps.map((s) => ({ title: s.title, wait: String(s.waitMinutes) }))
});
const sig = (l: DraftLadder) => JSON.stringify(l.steps.map((s, i) => [s.title, i === l.steps.length - 1 ? '' : s.wait]));

const LadderCard: React.FC<{ ladder: Ladder; titles: DutyTitle[]; onSaved: () => void }> = ({ ladder, titles, onSaved }) => {
  const { showToast } = useApp();
  const [draft, setDraft] = useState<DraftLadder>(() => toDraft(ladder));
  const [saved, setSaved] = useState(() => sig(toDraft(ladder)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = sig(draft) !== saved;

  const setSteps = (steps: DraftStep[]) => {
    setError(null);
    setDraft((d) => ({ ...d, steps }));
  };
  const edit = (i: number, patch: Partial<DraftStep>) => setSteps(draft.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, by: -1 | 1) => {
    const steps = draft.steps.slice();
    [steps[i], steps[i + by]] = [steps[i + by], steps[i]];
    setSteps(steps);
  };
  const remove = (i: number) => setSteps(draft.steps.filter((_, j) => j !== i));
  const add = () => setSteps([...draft.steps, { title: titles[0]?.key ?? '', wait: '15' }]);

  const save = async () => {
    const last = draft.steps.length - 1;
    const bad = draft.steps.findIndex((s, i) => i < last && !(Number.isInteger(Number(s.wait)) && Number(s.wait) >= 1 && s.wait.trim() !== ''));
    if (bad >= 0) {
      setError(`Step ${bad + 1}: wait must be a whole number of minutes, 1 or more.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await coordinatorService.saveLadder({
        key: draft.key,
        label: draft.label,
        steps: draft.steps.map((s, i) => ({ title: s.title, waitMinutes: i === last ? 0 : Number(s.wait) }))
      });
      setSaved(sig(draft));
      showToast(`${draft.label} ladder saved`, 'success');
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="medios-card cs-card" aria-label={`${draft.label} ladder`}>
      <div className="card-header-row">
        <h3 className="card-title">{draft.label}</h3>
        {dirty && <span className="status-pill sm orange">Unsaved changes</span>}
      </div>
      <ol className="cs-steps">
        {draft.steps.map((s, i) => {
          const isLast = i === draft.steps.length - 1;
          return (
            <li key={i} className="cs-step">
              <span className="cs-step-n">{i + 1}</span>
              <select className="form-select cs-title-sel" aria-label={`Step ${i + 1} duty title`} value={s.title} onChange={(e) => edit(i, { title: e.target.value })}>
                {!titles.some((t) => t.key === s.title) && <option value={s.title}>{s.title}</option>}
                {titles.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
              {isLast ? (
                <span className="cs-wait cs-wait-none">Last step</span>
              ) : (
                <label className="cs-wait">
                  <span>wait</span>
                  <input className="input-field" type="number" inputMode="numeric" min={1} step={1} aria-label={`Step ${i + 1} wait in minutes`} value={s.wait} onChange={(e) => edit(i, { wait: e.target.value })} />
                  <span>min</span>
                </label>
              )}
              <span className="cs-step-btns">
                <button type="button" className="cs-ib" aria-label="Move step up" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp size={15} />
                </button>
                <button type="button" className="cs-ib" aria-label="Move step down" disabled={isLast} onClick={() => move(i, 1)}>
                  <ArrowDown size={15} />
                </button>
                <button type="button" className="cs-ib" aria-label="Remove step" disabled={draft.steps.length < 2} onClick={() => remove(i)}>
                  <X size={15} />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      {error && (
        <p className="cs-error" role="alert">
          {error}
        </p>
      )}
      <div className="cs-actions">
        <button type="button" className="btn-outline-blue" onClick={add}>
          <Plus size={15} /> Add step
        </button>
        <button type="button" className="btn-primary" disabled={saving || !dirty} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save ladder'}
        </button>
      </div>
    </section>
  );
};

const TitleRow: React.FC<{ title: DutyTitle; staff: StaffUser[]; onSaved: () => void }> = ({ title, staff, onSaved }) => {
  const { showToast } = useApp();
  const [label, setLabel] = useState(title.label);
  const [holders, setHolders] = useState<string[]>(title.holders);
  const [saved, setSaved] = useState(() => JSON.stringify([title.label, [...title.holders].sort()]));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState('');
  const dirty = JSON.stringify([label, [...holders].sort()]) !== saved;
  const byId = new Map(staff.map((s) => [s.id, s]));
  const free = staff.filter((s) => !holders.includes(s.id));

  const save = async () => {
    if (!label.trim()) {
      setError('Give the title a name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await coordinatorService.saveTitle({ key: title.key, label: label.trim(), holders });
      setLabel(label.trim());
      setSaved(JSON.stringify([label.trim(), [...holders].sort()]));
      showToast(`${label.trim()} saved`, 'success');
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="cs-title">
      <div className="cs-title-head">
        <input className="input-field" aria-label={`Name of title ${title.key}`} value={label} maxLength={60} onChange={(e) => { setLabel(e.target.value); setError(null); }} />
        {dirty && <span className="status-pill sm orange">Unsaved</span>}
      </div>
      <div className="cs-holders">
        {holders.map((id) => {
          const u = byId.get(id);
          return (
            <span key={id} className="cs-chip">
              {u ? u.name : 'Unknown user'}
              {u && <em>{u.role}</em>}
              <button type="button" aria-label={`Remove ${u?.name ?? 'user'} from ${label}`} onClick={() => { setHolders(holders.filter((h) => h !== id)); setError(null); }}>
                <X size={12} />
              </button>
            </span>
          );
        })}
        {holders.length === 0 && <span className="cs-none">No one holds this title — alerts go to admins.</span>}
      </div>
      <div className="cs-title-foot">
        <select className="form-select cs-add-sel" aria-label={`Add a holder to ${label}`} value={adding} disabled={free.length === 0} onChange={(e) => { if (e.target.value) { setHolders([...holders, e.target.value]); setError(null); } setAdding(''); }}>
          <option value="">{free.length ? 'Add a person…' : 'Everyone is added'}</option>
          {free.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.role})
            </option>
          ))}
        </select>
        <button type="button" className="btn-primary" disabled={saving || !dirty} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && (
        <p className="cs-error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
};

/** Settings → Coordinator (admin): escalation ladders, duty titles and the standing rules. */
export const CoordinatorSettings: React.FC = () => {
  const [ladders, setLadders] = useState<Ladder[] | null>(null);
  const [titles, setTitles] = useState<DutyTitle[] | null>(null);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    Promise.all([coordinatorService.ladders(), coordinatorService.titles(), coordinatorService.staff()])
      .then(([l, t, s]) => {
        if (!alive) return;
        setLadders(l);
        setTitles(t);
        setStaff(s);
        setError(null);
      })
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [tick]);
  const load = () => setTick((n) => n + 1);

  if (!ladders || !titles) {
    return (
      <p className="data-empty" role={error ? 'alert' : undefined}>
        {error ?? 'Loading Coordinator settings…'}
      </p>
    );
  }

  return (
    <div className="cs-wrap">
      <div>
        <h3 className="cs-h">Escalation ladders</h3>
        <p className="co-note">When an alert is not acknowledged in time, it moves to the next step. Each step is a duty title and how long to wait before moving on.</p>
        <div className="cols-2 cs-ladders">
          {ladders.map((l) => (
            <LadderCard key={l.key} ladder={l} titles={titles} onSaved={() => load()} />
          ))}
        </div>
      </div>
      <section className="medios-card cs-card" aria-label="Duty titles">
        <div className="card-header-row">
          <h3 className="card-title">Duty titles</h3>
        </div>
        <p className="co-note">Who holds each title right now. An alert for a title nobody holds goes to admins.</p>
        <ul className="cs-titles">
          {titles.map((t) => (
            <TitleRow key={t.key} title={t} staff={staff} onSaved={() => load()} />
          ))}
        </ul>
      </section>
      {/* Settings has no live stream, so the panel refreshes only on its own saves. */}
      <RulesPanel version={0} />
    </div>
  );
};
