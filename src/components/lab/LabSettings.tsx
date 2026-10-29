import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { coordinatorService, labAgentService } from '../../services';
import { errorMessage } from '../../services/api';
import type { LabCatalogue, LabCatalogueTest, LabLimits, LabTargets, RuleView } from '../../types';
import { displayDateTime } from '../../utils/clinicDate';
import { unitText } from '../../utils/lab';

const RULE_KEY = 'critical-lab-escalation';
const MAX_MIN = 4320;

type TargetDraft = Record<string, { stat: string; routine: string }>;
const targetDraft = (t: LabTargets): TargetDraft => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, { stat: String(v.stat), routine: String(v.routine) }]));

const TargetsCard: React.FC<{ catalogue: LabCatalogue }> = ({ catalogue }) => {
  const { showToast } = useApp();
  const [values, setValues] = useState<TargetDraft | null>(null);
  const [saved, setSaved] = useState<TargetDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    labAgentService
      .targets()
      .then((t) => {
        if (!alive) return;
        setValues(targetDraft(t));
        setSaved(targetDraft(t));
      })
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, []);

  if (!values || !saved) {
    return (
      <p className="data-empty" role={error ? 'alert' : undefined}>
        {error ?? 'Loading targets…'}
      </p>
    );
  }
  const changedKeys = Object.keys(values).filter((k) => values[k].stat !== saved[k]?.stat || values[k].routine !== saved[k]?.routine);
  const edit = (test: string, side: 'stat' | 'routine', v: string) => {
    setError(null);
    setValues({ ...values, [test]: { ...values[test], [side]: v } });
  };

  const save = async () => {
    const body: Record<string, { stat?: number; routine?: number }> = {};
    for (const key of changedKeys) {
      const label = catalogue.tests.find((t) => t.key === key)?.label ?? key;
      const entry: { stat?: number; routine?: number } = {};
      for (const side of ['stat', 'routine'] as const) {
        const n = Number(values[key][side].trim());
        if (values[key][side].trim() === '' || !Number.isInteger(n) || n < 1 || n > MAX_MIN) {
          setError(`${label}: use a whole number of minutes, 1 to ${MAX_MIN}.`);
          return;
        }
        if (values[key][side] !== saved[key]?.[side]) entry[side] = n;
      }
      body[key] = entry;
    }
    setSaving(true);
    setError(null);
    try {
      const next = targetDraft(await labAgentService.saveTargets(body));
      setValues(next);
      setSaved(next);
      showToast('Turnaround targets saved', 'success');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="medios-card cs-card" aria-label="Turnaround targets">
      <div className="card-header-row">
        <h3 className="card-title">Turnaround targets</h3>
        {changedKeys.length > 0 && <span className="status-pill sm orange">Unsaved changes</span>}
      </div>
      <p className="co-note">Minutes from the order to a released result, 1 to {MAX_MIN}. An urgent order gets twice the STAT time.</p>
      <ul className="es-targets">
        {catalogue.tests.map((t) => (
          <li key={t.key} className="ls-row">
            <span className="ls-row-name">{t.label}</span>
            <span className="ls-inputs">
              <label htmlFor={`lt-${t.key}-stat`}>STAT</label>
              <input id={`lt-${t.key}-stat`} className="input-field" type="number" inputMode="numeric" min={1} max={MAX_MIN} step={1} value={values[t.key]?.stat ?? ''} onChange={(e) => edit(t.key, 'stat', e.target.value)} />
              <label htmlFor={`lt-${t.key}-routine`}>Routine</label>
              <input id={`lt-${t.key}-routine`} className="input-field" type="number" inputMode="numeric" min={1} max={MAX_MIN} step={1} value={values[t.key]?.routine ?? ''} onChange={(e) => edit(t.key, 'routine', e.target.value)} />
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
        <button type="button" className="btn-primary" disabled={saving || changedKeys.length === 0} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save targets'}
        </button>
      </div>
    </section>
  );
};

type LimitDraft = Record<string, { low: string; high: string }>;
const limitDraft = (l: LabLimits['limits']): LimitDraft => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, { low: v.low == null ? '' : String(v.low), high: v.high == null ? '' : String(v.high) }]));
const rangeText = (p: LabCatalogueTest['parameters'][number]) => `Reference ${p.range}${unitText(p.unit) ? ` ${unitText(p.unit)}` : ''}`;

const LimitsCard: React.FC<{ catalogue: LabCatalogue }> = ({ catalogue }) => {
  const { showToast } = useApp();
  const [data, setData] = useState<LabLimits | null>(null);
  const [values, setValues] = useState<LimitDraft>({});
  const [saved, setSaved] = useState<LimitDraft>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = (l: LabLimits) => {
    setData(l);
    setValues(limitDraft(l.limits));
    setSaved(limitDraft(l.limits));
  };
  useEffect(() => {
    let alive = true;
    labAgentService
      .limits()
      .then((l) => alive && load(l))
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, []);

  if (!data) {
    return (
      <p className="data-empty" role={error ? 'alert' : undefined}>
        {error ?? 'Loading limits…'}
      </p>
    );
  }
  const get = (src: LimitDraft, key: string) => src[key] ?? { low: '', high: '' };
  const changedKeys = Object.keys({ ...saved, ...values }).filter((k) => get(values, k).low !== get(saved, k).low || get(values, k).high !== get(saved, k).high);
  const edit = (key: string, side: 'low' | 'high', v: string) => {
    setError(null);
    setValues({ ...values, [key]: { ...get(values, key), [side]: v } });
  };

  const save = async () => {
    const body: Record<string, { low?: number | null; high?: number | null }> = {};
    for (const key of changedKeys) {
      const entry: { low?: number | null; high?: number | null } = {};
      for (const side of ['low', 'high'] as const) {
        const raw = get(values, key)[side].trim();
        if (raw !== '' && !Number.isFinite(Number(raw))) {
          setError(`${key}: the ${side} limit must be a number, or blank for none.`);
          return;
        }
        if (raw !== get(saved, key)[side].trim()) entry[side] = raw === '' ? null : Number(raw);
      }
      body[key] = entry;
    }
    setSaving(true);
    setError(null);
    try {
      load(await labAgentService.saveLimits(body));
      showToast('Critical limits saved', 'success');
    } catch (err) {
      // Some of the server's 400 messages don't name the key: with one changed limit, say which.
      const message = errorMessage(err);
      const named = changedKeys.some((k) => message.includes(k));
      setError(named ? message : changedKeys.length === 1 ? `${labelOf(changedKeys[0])}: ${message}` : `${message} Nothing was saved; check the changed limits.`);
    } finally {
      setSaving(false);
    }
  };

  const labelOf = (key: string) => {
    const [test, ...rest] = key.split('.');
    return `${catalogue.tests.find((t) => t.key === test)?.label ?? test} — ${rest.join('.')}`;
  };

  return (
    <section className="medios-card cs-card" aria-label="Critical limits">
      <div className="card-header-row">
        <h3 className="card-title">Critical limits</h3>
        {changedKeys.length > 0 && <span className="status-pill sm orange">Unsaved changes</span>}
      </div>
      <p className="co-note">A result below the low limit or above the high limit is critical and must be acknowledged by a doctor. Leave a side blank for no limit. A critical low can't be above the reference low, and a critical high can't be below the reference high.</p>
      {catalogue.tests.map((t) => (
        <div key={t.key} role="group" aria-label={t.label}>
          <h4 className="ls-group">{t.label}</h4>
          {t.parameters.map((p) => {
            const key = `${t.key}.${p.name}`;
            return (
              <div key={key} className="ls-row">
                <span className="ls-row-name">
                  {p.name}
                  <small>{p.text ? 'Text result' : rangeText(p)}</small>
                </span>
                {p.text ? (
                  <span className="ls-text">{data.limits[key]?.anyAbnormalText ? 'Any growth is critical' : 'No numeric limits'}</span>
                ) : (
                  <span className="ls-inputs">
                    <label htmlFor={`ll-${key}-low`}>Low</label>
                    <input id={`ll-${key}-low`} className="input-field" type="number" inputMode="decimal" step="any" value={get(values, key).low} onChange={(e) => edit(key, 'low', e.target.value)} aria-label={`${labelOf(key)} critical low`} />
                    <label htmlFor={`ll-${key}-high`}>High</label>
                    <input id={`ll-${key}-high`} className="input-field" type="number" inputMode="decimal" step="any" value={get(values, key).high} onChange={(e) => edit(key, 'high', e.target.value)} aria-label={`${labelOf(key)} critical high`} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
      {error && (
        <p className="cs-error" role="alert">
          {error}
        </p>
      )}
      <div className="cs-actions es-end">
        <button type="button" className="btn-primary" disabled={saving || changedKeys.length === 0} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save limits'}
        </button>
      </div>
      <h4 className="ls-group">Change history</h4>
      {data.history.length === 0 ? (
        <p className="co-note">No changes yet.</p>
      ) : (
        <ul className="ls-history">
          {[...data.history].reverse().map((h, i) => (
            <li key={`${h.at}-${i}`}>
              <span>
                <strong>{h.by}</strong>
                <span className="ls-when"> · {displayDateTime(new Date(h.at))}</span>
              </span>
              {h.changes.map((c) => (
                <span key={c.key} className="co-note">
                  {labelOf(c.key)}: {fmt(c.from)} → {fmt(c.to)}
                </span>
              ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const fmt = (v: unknown): string => {
  if (v === null || v === undefined) return 'none';
  if (typeof v === 'object') {
    const o = v as { low?: number | null; high?: number | null; anyAbnormalText?: boolean };
    if (o.anyAbnormalText) return 'any growth';
    return [o.low != null ? `low ${o.low}` : '', o.high != null ? `high ${o.high}` : ''].filter(Boolean).join(', ') || 'none';
  }
  return String(v);
};

/** The escalation rule: locked on, so it has no switch. */
const EscalationRule: React.FC = () => {
  const [rule, setRule] = useState<RuleView | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    coordinatorService
      .rules()
      .then((rules) => alive && setRule(rules.find((r) => r.key === RULE_KEY) ?? null))
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, []);
  return (
    <section className="medios-card cs-card" aria-label="Escalation rule">
      <div className="card-header-row">
        <h3 className="card-title">Escalation</h3>
      </div>
      {!rule ? (
        <p className="data-empty" role={error ? 'alert' : undefined}>
          {error ?? 'Loading…'}
        </p>
      ) : (
        <div className="es-rule">
          <span className="co-rule-text">
            <span className="co-rule-label">{rule.label}</span>
            <span className="co-rule-desc">{rule.description}</span>
          </span>
          <span className="status-pill sm green">
            <Lock size={11} aria-hidden="true" /> {rule.value ? 'Locked on' : 'Locked off'}
          </span>
        </div>
      )}
    </section>
  );
};

/** Settings → Lab (admin): turnaround targets, critical limits with their history, and the locked escalation rule. */
export const LabSettings: React.FC = () => {
  const [catalogue, setCatalogue] = useState<LabCatalogue | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    labAgentService
      .catalogue()
      .then((c) => alive && setCatalogue(c))
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, []);
  return (
    <div className="cs-wrap">
      <EscalationRule />
      {!catalogue ? (
        <p className="data-empty" role={error ? 'alert' : undefined}>
          {error ?? 'Loading the test list…'}
        </p>
      ) : (
        <div className="cols-2 es-pair">
          <TargetsCard catalogue={catalogue} />
          <LimitsCard catalogue={catalogue} />
        </div>
      )}
    </div>
  );
};
