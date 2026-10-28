import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { settingsService } from '../../services';
import { errorMessage } from '../../services/api';
import type { SettingsState } from '../../types';

type AiKey = 'bedAutoAllocate' | 'bedSuggestions';

interface BedAgentSettingsProps {
  /** Who may change each switch. Allocating automatically is admin only. */
  role: string;
  /** Called after a switch was saved (the Settings screen refreshes its AI status). */
  onSaved?(ai: SettingsState['ai']): void;
}

const ROWS: { key: AiKey; title: string; desc: string; roles: string[] }[] = [
  {
    key: 'bedAutoAllocate',
    title: 'Allocate beds automatically',
    desc: 'The Bed Agent assigns a bed to each request on its own, within the hospital rules. When off, every request goes to the team as Needs attention.',
    roles: ['admin']
  },
  {
    key: 'bedSuggestions',
    title: 'AI bed suggestions',
    desc: 'The AI reorders the allowed beds and explains the best few. When off, staff see the rule-based list.',
    roles: ['admin', 'doctor']
  }
];

/** The Bed Agent's two switches, loaded and saved through the settings API. */
export const BedAgentSettings: React.FC<BedAgentSettingsProps> = ({ role, onSaved }) => {
  const { showToast } = useApp();
  const [ai, setAi] = useState<SettingsState['ai'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<AiKey | null>(null);

  useEffect(() => {
    let alive = true;
    settingsService
      .getSettings()
      .then((s) => alive && setAi(s.ai))
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, []);

  const save = async (key: AiKey, value: boolean) => {
    if (!ai) return;
    setSaving(key);
    try {
      // Only the switch that changed: the rest of the AI section is saved by the Settings screen.
      const patch: Partial<SettingsState['ai']> = {};
      patch[key] = value;
      const saved = await settingsService.saveSettings({ ai: patch });
      setAi(saved.ai);
      showToast(`${ROWS.find((r) => r.key === key)?.title} is ${saved.ai[key] ? 'on' : 'off'}`, 'success');
      onSaved?.(saved.ai);
    } catch (err) {
      showToast(`Failed to save: ${errorMessage(err)}`, 'error');
    } finally {
      setSaving(null);
    }
  };

  if (!ai) return <p className="data-empty" role={error ? 'alert' : undefined}>{error ?? 'Loading settings…'}</p>;

  return (
    <div className="bas">
      {ROWS.map((row) => {
        const allowed = row.roles.includes(role);
        return (
          <div key={row.key} className="bas-row">
            <div className="bas-text">
              <div className="bas-title">{row.title}</div>
              <div className="bas-desc">{row.desc}</div>
            </div>
            <label className="switch-label" style={!allowed || saving ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
              <input type="checkbox" aria-label={row.title} checked={ai[row.key]} disabled={!allowed || saving !== null} onChange={(e) => void save(row.key, e.target.checked)} />
              <span className="switch-slider"></span>
            </label>
          </div>
        );
      })}
      <p className="bagent-hint">Who gets notified: coming soon</p>
    </div>
  );
};
