import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { coordinatorService, pharmacyAgentService } from '../../services';
import { errorMessage } from '../../services/api';
import type { PharmacyPriority, PharmacySettings as PharmacySettingsData, RuleView } from '../../types';
import { PRIORITY_LABEL } from '../../utils/pharmacy';

const RULE_KEY = 'medicine-safety-checks';
const MAX_MIN = 1440;
const MAX_DAYS = 365;
const PRIORITIES: PharmacyPriority[] = ['stat', 'urgent', 'routine'];
const STAGES = [
  { key: 'check', label: 'Check', note: 'From the order to the pharmacist approving, querying or rejecting it.' },
  { key: 'issue', label: 'Issue', note: 'From approval to the medicine leaving the pharmacy (ER and ward orders).' },
  { key: 'query', label: 'Query answer', note: 'How long a doctor has to answer a pharmacist’s question.' }
] as const;

type Draft = { targets: Record<string, Record<string, string>>; days: string };
const toDraft = (s: PharmacySettingsData): Draft => ({
  targets: Object.fromEntries(STAGES.map((st) => [st.key, Object.fromEntries(PRIORITIES.map((p) => [p, String(s.targets[st.key][p])]))])),
  days: String(s.nearExpiryDays)
});

const whole = (raw: string, max: number): number | null => {
  const t = raw.trim();
  const n = Number(t);
  return t !== '' && Number.isInteger(n) && n >= 1 && n <= max ? n : null;
};

const Rule: React.FC = () => {
  const [rule, setRule] = useState<RuleView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    let alive = true;
    coordinatorService
      .rules()
      .then((rules) => alive && setRule(rules.find((r) => r.key === RULE_KEY) ?? null))
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [tries]);
  return (
    <section className="medios-card cs-card" aria-label="Medicine safety checks">
      <div className="card-header-row">
        <h3 className="card-title">Medicine safety checks</h3>
      </div>
      {!rule ? (
        <p className="data-empty" role={error ? 'alert' : undefined}>
          {error ?? 'Loading…'}
          {error && (
            <>
              {' '}
              <button type="button" className="btn-secondary btn-sm" onClick={() => { setError(null); setTries((n) => n + 1); }}>
                Try again
              </button>
            </>
          )}
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

/** Settings → Pharmacy (admin): targets per stage and priority, the near-expiry window and the locked safety rule. */
export const PharmacySettings: React.FC = () => {
  const { showToast } = useApp();
  const [values, setValues] = useState<Draft | null>(null);
  const [saved, setSaved] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let alive = true;
    pharmacyAgentService
      .settings()
      .then((s) => {
        if (!alive) return;
        setValues(toDraft(s));
        setSaved(toDraft(s));
      })
      .catch((err) => alive && setLoadError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [tries]);

  const changed = (stage: string, p: string) => !!values && !!saved && values.targets[stage][p] !== saved.targets[stage][p];
  const anyChanged = !!values && !!saved && (values.days !== saved.days || STAGES.some((st) => PRIORITIES.some((p) => changed(st.key, p))));

  const edit = (stage: string, p: string, v: string) => {
    if (!values) return;
    setError(null);
    setValues({ ...values, targets: { ...values.targets, [stage]: { ...values.targets[stage], [p]: v } } });
  };

  const save = async () => {
    if (!values || !saved) return;
    const targets: Record<string, Record<string, number>> = {};
    for (const st of STAGES) {
      for (const p of PRIORITIES) {
        if (!changed(st.key, p)) continue;
        const n = whole(values.targets[st.key][p], MAX_MIN);
        if (n === null) {
          setError(`${st.label}, ${PRIORITY_LABEL[p]}: use a whole number of minutes, 1 to ${MAX_MIN}.`);
          return;
        }
        targets[st.key] = { ...(targets[st.key] ?? {}), [p]: n };
      }
    }
    const body: { targets?: typeof targets; nearExpiryDays?: number } = {};
    if (Object.keys(targets).length) body.targets = targets;
    if (values.days !== saved.days) {
      const d = whole(values.days, MAX_DAYS);
      if (d === null) {
        setError(`Near-expiry window: use a whole number of days, 1 to ${MAX_DAYS}.`);
        return;
      }
      body.nearExpiryDays = d;
    }
    setSaving(true);
    setError(null);
    try {
      const next = toDraft(await pharmacyAgentService.saveSettings(body as never));
      setValues(next);
      setSaved(next);
      showToast('Pharmacy settings saved', 'success');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cs-wrap">
      <Rule />
      {!values || !saved ? (
        <p className="data-empty" role={loadError ? 'alert' : undefined}>
          {loadError ?? 'Loading targets…'}
          {loadError && (
            <>
              {' '}
              <button type="button" className="btn-secondary btn-sm" onClick={() => { setLoadError(null); setTries((n) => n + 1); }}>
                Try again
              </button>
            </>
          )}
        </p>
      ) : (
        <section className="medios-card cs-card" aria-label="Pharmacy targets">
          <div className="card-header-row">
            <h3 className="card-title">Targets</h3>
            {anyChanged && <span className="status-pill sm orange">Unsaved changes</span>}
          </div>
          <p className="co-note">Minutes for each stage, 1 to {MAX_MIN}. The Coordinator escalates a line that runs past its target.</p>
          <div className="table-scroll" style={{ ["--table-min" as string]: "0px" }}>
            <table className="ps-table">
              <thead>
                <tr>
                  <th scope="col">Priority</th>
                  {STAGES.map((st) => (
                    <th key={st.key} scope="col" title={st.note}>
                      {st.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRIORITIES.map((p) => (
                  <tr key={p}>
                    <th scope="row">{PRIORITY_LABEL[p]}</th>
                    {STAGES.map((st) => (
                      <td key={st.key}>
                        <span className="ls-inputs">
                          <input
                            id={`ps-${st.key}-${p}`}
                            aria-label={`${st.label} ${PRIORITY_LABEL[p]} target minutes`}
                            className="input-field"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={MAX_MIN}
                            step={1}
                            value={values.targets[st.key][p]}
                            onChange={(e) => edit(st.key, p, e.target.value)}
                          />
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="co-note ps-notes">
            {STAGES.map((st) => (
              <li key={st.key}>
                <strong>{st.label}:</strong> {st.note}
              </li>
            ))}
          </ul>
          <h4 className="ls-group">Near-expiry window</h4>
          <p className="co-note">A batch that expires within this many days shows as near expiry in stock.</p>
          <div className="ls-row">
            <span className="ls-row-name">Days before expiry</span>
            <span className="ls-inputs">
              <input
                id="ps-days"
                aria-label="Near-expiry window in days"
                className="input-field"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_DAYS}
                step={1}
                value={values.days}
                onChange={(e) => {
                  setError(null);
                  setValues({ ...values, days: e.target.value });
                }}
              />
              days
            </span>
          </div>
          {error && (
            <p className="cs-error" role="alert">
              {error}
            </p>
          )}
          <div className="cs-actions es-end">
            <button type="button" className="btn-primary" disabled={saving || !anyChanged} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
