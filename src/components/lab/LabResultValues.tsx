import React from 'react';
import type { LabResultRow } from '../../types';
import { flagLabel, flagTone, unitText } from '../../utils/lab';

/** A line's values with their flags: the words always show beside the colour. */
export const LabResultValues: React.FC<{ results: LabResultRow[] }> = ({ results }) => (
  <ul className="lab-values">
    {results.map((r) => {
      const unit = unitText(r.unit);
      return (
        <li key={r.param} className={r.critical ? 'is-critical' : undefined}>
          <span className="lab-values-name">{r.param}</span>
          <span className="lab-values-value">
            {r.value}
            {unit ? ` ${unit}` : ''}
          </span>
          <span className={`status-pill sm ${flagTone(r.flag, r.critical)}`}>{flagLabel(r.flag, r.critical)}</span>
        </li>
      );
    })}
  </ul>
);
