import React, { useCallback, useRef, useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { coordinatorService } from '../../services';
import { errorMessage } from '../../services/api';
import { useCoordinatorList } from '../../hooks/useCoordinator';
import { agentName } from '../../utils/coordinator';
import type { RuleView } from '../../types';

/** The Coordinator's standing rules. Admins switch the ones that can change; everyone else reads them. */
export const RulesPanel: React.FC<{ version: number }> = ({ version }) => {
  const { user, showToast } = useApp();
  const isAdmin = user?.role === 'admin';
  const fetchRules = useCallback(() => coordinatorService.rules(), []);
  const { items, loading, error, reload } = useCoordinatorList(fetchRules, version);
  /** What the person just chose, shown until the saved value has come back (or the save failed). `n` tells saves apart. */
  const [pending, setPending] = useState<Record<string, { value: boolean; n: number }>>({});
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const saves = useRef(0);

  const change = async (rule: RuleView, value: boolean) => {
    setFailure(null);
    const n = ++saves.current;
    setPending((p) => ({ ...p, [rule.key]: { value, n } }));
    const drop = () =>
      setPending((p) => {
        if (p[rule.key]?.n !== n) return p; // a newer toggle of this rule owns the entry now
        const next = { ...p };
        delete next[rule.key];
        return next;
      });
    try {
      await coordinatorService.setRule(rule.key, value);
      showToast(`${rule.label} turned ${value ? 'on' : 'off'}`, 'success');
      // Keep the chosen value until the refreshed list is in.
      await reload();
      drop();
    } catch (err) {
      const message = errorMessage(err);
      setFailure({ key: rule.key, message });
      showToast(message, 'error');
      drop();
    }
  };

  return (
    <section className="medios-card bagent-card co-card" aria-label="Coordination rules">
      <div className="card-header-row">
        <h3 className="card-title">Coordination rules</h3>
      </div>
      {loading ? (
        <p className="data-empty" role={error ? 'alert' : undefined}>
          {error ?? 'Loading rules…'}
        </p>
      ) : (
        <>
          <ul className="co-list co-rules">
            {items.map((r) => {
              const coming = !!r.comingWith;
              const value = r.locked && !coming ? true : (pending[r.key]?.value ?? r.value);
              const note = coming ? `Coming with the ${agentName(r.comingWith as string)} Agent` : r.locked ? 'Always on' : null;
              const canSwitch = isAdmin && !r.locked && !coming;
              return (
                <li key={r.key} className={`co-item co-rule${coming ? ' is-dim' : ''}`}>
                  <span className="co-rule-text">
                    <span className="co-rule-label">{r.label}</span>
                    <span className="co-rule-desc">{r.description}</span>
                    {note && <span className="co-rule-note">{note}</span>}
                    {failure?.key === r.key && (
                      <span className="co-rule-error" role="alert">
                        {failure.message}
                      </span>
                    )}
                  </span>
                  {isAdmin || r.locked || coming ? (
                    <label className="switch-label">
                      <input type="checkbox" role="switch" checked={coming ? false : value} disabled={!canSwitch || r.key in pending} aria-label={r.label} onChange={(e) => void change(r, e.target.checked)} />
                      <span className="switch-slider" />
                    </label>
                  ) : (
                    <span className={`status-pill sm ${value ? 'green' : 'gray'}`}>{value ? 'On' : 'Off'}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {!isAdmin && <p className="co-rules-foot">Only an admin can change these</p>}
        </>
      )}
    </section>
  );
};
