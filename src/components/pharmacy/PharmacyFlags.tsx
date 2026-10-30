import React, { useState } from 'react';
import { AlertTriangle, Info, Sparkles } from 'lucide-react';
import { pharmacyAgentService } from '../../services';
import { errorMessage } from '../../services/api';
import type { PharmacyExplain, PharmacyFlag, PharmacyLineView } from '../../types';
import { sortedFlags } from '../../utils/pharmacy';

interface FlagRowsProps {
  flags: PharmacyFlag[];
  /** A saved line: each flag gets an Explain button. Without it (a preview) there is nothing to explain yet. */
  lineId?: string;
  canExplain?: boolean;
}

/** The flags of one line: their text, who confirmed or reviewed them, and Explain. */
export const FlagRows: React.FC<FlagRowsProps> = ({ flags, lineId, canExplain = false }) => {
  if (flags.length === 0) return null;
  return (
    <ul className="ph-flags" aria-label="Flags">
      {sortedFlags(flags).map((f) => (
        <FlagRow key={f.key} flag={f} lineId={lineId} canExplain={canExplain} />
      ))}
    </ul>
  );
};

const FlagRow: React.FC<{ flag: PharmacyFlag; lineId?: string; canExplain: boolean }> = ({ flag, lineId, canExplain }) => {
  const [busy, setBusy] = useState(false);
  const [explain, setExplain] = useState<PharmacyExplain | null>(null);
  const [error, setError] = useState<string | null>(null);
  const red = flag.severity === 'red';

  const run = async () => {
    if (!lineId || busy) return;
    setBusy(true);
    setError(null);
    try {
      setExplain(await pharmacyAgentService.explain(lineId, flag.key));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`ph-flag ${red ? 'is-red' : 'is-amber'}`}>
      <div className="ph-flag-main">
        {red ? <AlertTriangle size={14} aria-hidden="true" /> : <Info size={14} aria-hidden="true" />}
        <span className="ph-flag-text">
          <span className="ph-flag-sev">{red ? 'Red' : 'Amber'}</span> {flag.text}
        </span>
        {canExplain && lineId && (
          <button type="button" className="btn-secondary btn-sm ph-flag-btn" onClick={() => void run()} disabled={busy} aria-expanded={!!explain}>
            <Sparkles size={13} aria-hidden="true" />
            {busy ? 'Explaining…' : explain ? 'Explain again' : 'Explain'}
          </button>
        )}
      </div>
      {flag.confirmed && <p className="ph-flag-note">Doctor confirmed: {flag.confirmed.reason}</p>}
      {flag.reviewed && <p className="ph-flag-note">Allergy reviewed by {flag.reviewed.by}</p>}
      {explain && (
        <p className="ph-flag-explain" role="status">
          {explain.text} {explain.sample && <span className="status-pill sm purple">SAMPLE</span>}
        </p>
      )}
      {error && (
        <p className="er-error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
};

/** The flags of a saved line (the To check card and later tabs). */
export const PharmacyFlags: React.FC<{ line: PharmacyLineView; canExplain: boolean }> = ({ line, canExplain }) => (
  <FlagRows flags={line.flags} lineId={line.id} canExplain={canExplain} />
);
