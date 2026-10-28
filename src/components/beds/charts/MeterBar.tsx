import React from 'react';
import { meterTone, type MeterTone } from '../../../utils/beds';

interface MeterBarProps {
  value: number;
  max: number;
  /** Defaults to the share of `max`: danger at 85% or more, warn at 70% or more. */
  tone?: MeterTone;
  /** For screen readers, e.g. "ICU 75% full". */
  label?: string;
}

/** A thin occupancy bar. It grows in once; later changes slide to the new width. */
export const MeterBar: React.FC<MeterBarProps> = ({ value, max, tone, label }) => {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <span
      className={`meter is-${tone ?? meterTone(value, max)}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <span className="meter-fill" style={{ width: `${pct}%` }} />
    </span>
  );
};
