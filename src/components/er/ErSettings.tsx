import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { coordinatorService, erService } from '../../services';
import { errorMessage } from '../../services/api';
import type { ErBay, ErBayKind, ErComplaintInfo, RuleView } from '../../types';

const KIND_LABEL: Record<ErBayKind, string> = { resus: 'Resus', bay: 'Bay', stretcher: 'Stretcher' };
const KINDS: ErBayKind[] = ['resus', 'bay', 'stretcher'];
const AUTO_KEY = 'er-auto-pathways';

interface DraftBay {
  /** Local key; the server id once saved. */
  key: string;
  id?: string;
  name: string;
  kind: ErBayKind;
  outOfUse: boolean;
  /** The visit number when a patient is in the bay: it can then be neither removed nor taken out of use. */
  holds: string | null;
}

const toDraft = (b: ErBay): DraftBay => ({ key: b.id, id: b.id, name: b.name, kind: b.kind, outOfUse: b.outOfUse, holds: b.visitId ? (b.visitNumber ?? 'a patient') : null });
const bayPayload = (bays: DraftBay[]) => bays.map((b) => ({ ...(b.id && { id: b.id }), name: b.name.trim(), kind: b.kind, outOfUse: b.outOfUse }));

let newKey = 0;

const BaysEditor: React.FC = () => {
  const { showToast } = useApp();
  const [bays, setBays] = useState<DraftBay[] | null>(null);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    erService
      .bays()
      .then((list) => {
        if (!alive) return;
        const draft = list.map(toDraft);
        setBays(draft);
        setSaved(JSON.stringify(bayPayload(draft)));
      })
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, []);

  if (!bays) {
    return (
      <p className="data-empty" role={error ? 'alert' : undefined}>
        {error ?? 'Loading bays…'}
      </p>
    );
  }
  const dirty = JSON.stringify(bayPayload(bays)) !== saved;
  const edit = (key: string, patch: Partial<DraftBay>) => {
    setError(null);
    setBays(bays.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  };
  const add = () => {
    setError(null);
    setBays([...bays, { key: `new-${++newKey}`, name: '', kind: 'bay', outOfUse: false, holds: null }]);
  };
  const remove = (key: string) => {
    setError(null);
    setBays(bays.filter((b) => b.key !== key));
  };

  const save = async () => {
    const names = bays.map((b) => b.name.trim());
    if (names.some((n) => !n)) {
      setError('Every bay needs a name.');
      return;
    }
    if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) {
      setError('Two bays have the same name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const list = (await erService.saveBays(bayPayload(bays))).map(toDraft);
      setBays(list);
      setSaved(JSON.stringify(bayPayload(list)));
      showToast('ER bays saved', 'success');
    } catch (err) {
      // The server's message (for example a 409 for a bay that holds a patient) stays next to the buttons.
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const counts = KINDS.map((k) => `${bays.filter((b) => b.kind === k).length} ${KIND_LABEL[k].toLowerCase()}`).join(', ');
  return (
    <section className="medios-card cs-card" aria-label="ER bays">
      <div className="card-header-row">
        <h3 className="card-title">Bays</h3>
        {dirty && <span className="status-pill sm orange">Unsaved changes</span>}
      </div>
      <p className="co-note">{counts}. A bay with a patient in it can't be removed or taken out of use.</p>
      <ul className="es-bays">
        {bays.map((b, i) => (
          <li key={b.key} className="es-bay">
            <input className="input-field es-bay-name" aria-label={`Bay ${i + 1} name`} value={b.name} maxLength={40} onChange={(e) => edit(b.key, { name: e.target.value })} />
            <select className="form-select es-bay-kind" aria-label={`${b.name || `Bay ${i + 1}`} kind`} value={b.kind} onChange={(e) => edit(b.key, { kind: e.target.value as ErBayKind })}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
            <label className="es-check" title={b.holds ? `${b.holds} is in this bay` : undefined}>
              <input type="checkbox" checked={b.outOfUse} disabled={b.holds !== null} aria-label={`${b.name || `Bay ${i + 1}`} out of use`} onChange={(e) => edit(b.key, { outOfUse: e.target.checked })} />
              {b.holds ? `${b.holds} here` : 'Out of use'}
            </label>
            <button type="button" className="cs-ib es-bay-x" aria-label={`Remove ${b.name || `bay ${i + 1}`}`} disabled={b.holds !== null} onClick={() => remove(b.key)}>
              <X size={15} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p className="cs-error" role="alert">
          {error}
        </p>
      )}
      <div className="cs-actions">
        <button type="button" className="btn-outline-blue" onClick={add}>
          <Plus size={15} aria-hidden="true" /> Add bay
        </button>
        <button type="button" className="btn-primary" disabled={saving || !dirty} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save bays'}
        </button>
      </div>
    </section>
  );
};

const TargetsEditor: React.FC = () => {
  const { showToast } = useApp();
  const [info, setInfo] = useState<ErComplaintInfo | null>(null);
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([erService.complaints(), erService.targets()])
      .then(([c, t]) => {
        if (!alive) return;
        const text = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, String(v)]));
        setInfo(c);
        setValues(text);
        setSaved(JSON.stringify(text));
      })
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, []);

  if (!info || !values) {
    return (
      <p className="data-empty" role={error ? 'alert' : undefined}>
        {error ?? 'Loading targets…'}
      </p>
    );
  }
  const dirty = JSON.stringify(values) !== saved;
  const keys = info.pathways.flatMap((p) => p.steps.map((s) => ({ key: `${p.key}.${s.key}`, label: `${p.label} — ${s.label}` })));

  const save = async () => {
    const out: Record<string, number> = {};
    for (const { key, label } of keys) {
      const raw = (values[key] ?? '').trim();
      const n = Number(raw);
      if (raw === '' || !Number.isInteger(n) || n < 1 || n > 240) {
        setError(`${label}: use a whole number of minutes, 1 to 240.`);
        return;
      }
      out[key] = n;
    }
    setSaving(true);
    setError(null);
    try {
      const next = await erService.saveTargets(out);
      const text = Object.fromEntries(Object.entries(next).map(([k, v]) => [k, String(v)]));
      setValues(text);
      setSaved(JSON.stringify(text));
      showToast('Pathway targets saved', 'success');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="medios-card cs-card" aria-label="Pathway targets">
      <div className="card-header-row">
        <h3 className="card-title">Pathway targets</h3>
        {dirty && <span className="status-pill sm orange">Unsaved changes</span>}
      </div>
      <p className="co-note">Minutes from arrival by which each step should be done, 1 to 240.</p>
      <ul className="es-targets">
        {keys.map(({ key, label }) => (
          <li key={key} className="es-target">
            <label htmlFor={`es-t-${key}`}>{label}</label>
            <span className="es-target-in">
              <input
                id={`es-t-${key}`}
                className="input-field"
                type="number"
                inputMode="numeric"
                min={1}
                max={240}
                step={1}
                value={values[key] ?? ''}
                onChange={(e) => {
                  setError(null);
                  setValues({ ...values, [key]: e.target.value });
                }}
              />
              min
            </span>
          </li>
        ))}
      </ul>
      {error && (
        <p className="cs-error" role="alert">
          {error}
        </p>
      )}
      <div className="cs-actions es-end">
        <button type="button" className="btn-primary" disabled={saving || !dirty} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save targets'}
        </button>
      </div>
    </section>
  );
};

/** The Coordinator rule that starts the fast-track pathways when the triage matches. */
const AutoPathways: React.FC = () => {
  const { showToast } = useApp();
  const [rule, setRule] = useState<RuleView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    coordinatorService
      .rules()
      .then((rules) => alive && setRule(rules.find((r) => r.key === AUTO_KEY) ?? null))
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, []);

  const change = async (value: boolean) => {
    setSaving(true);
    setError(null);
    try {
      setRule(await coordinatorService.setRule(AUTO_KEY, value));
      showToast(`Start pathways automatically turned ${value ? 'on' : 'off'}`, 'success');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="medios-card cs-card" aria-label="Pathway automation">
      <div className="card-header-row">
        <h3 className="card-title">Pathways</h3>
      </div>
      {!rule ? (
        <p className="data-empty" role={error ? 'alert' : undefined}>
          {error ?? 'Loading…'}
        </p>
      ) : (
        <div className="es-rule">
          <span className="co-rule-text">
            <span className="co-rule-label">Start pathways automatically</span>
            <span className="co-rule-desc">{rule.description}</span>
          </span>
          <label className="switch-label">
            <input type="checkbox" role="switch" checked={rule.value} disabled={saving || rule.locked} aria-label="Start pathways automatically" onChange={(e) => void change(e.target.checked)} />
            <span className="switch-slider" />
          </label>
        </div>
      )}
      {rule && error && (
        <p className="cs-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
};

/** Settings → ER (admin): the bays, the pathway targets, and whether pathways start by themselves. */
export const ErSettings: React.FC = () => (
  <div className="cs-wrap">
    <AutoPathways />
    <div className="cols-2 es-pair">
      <BaysEditor />
      <TargetsEditor />
    </div>
  </div>
);
