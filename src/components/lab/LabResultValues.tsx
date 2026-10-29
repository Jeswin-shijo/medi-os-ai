import React from 'react';
import type { LabAmendment, LabResultRow } from '../../types';
import { flagLabel, flagTone, unitText } from '../../utils/lab';

/** A line's values with their flags: the words always show beside the colour. */
export const LabResultValues: React.FC<{ results: LabResultRow[]; /** For an amendment awaiting validation: the released values each row replaces. */ previous?: LabAmendment['previous'] }> = ({ results, previous }) => (
  <ul className="lab-values">
    {results.map((r) => {
      const unit = unitText(r.unit);
      const was = previous?.find((p) => p.param === r.param);
      const wasUnit = was ? unitText(was.unit) : '';
      const changed = !!was && String(was.value) !== String(r.value);
      return (
        <li key={r.param} className={r.critical ? 'is-critical' : undefined}>
          <span className="lab-values-name">{r.param}</span>
          <span className="lab-values-value">
            {r.value}
            {unit ? ` ${unit}` : ''}
          </span>
          {r.comment && <span className="lab-comment">{r.comment}</span>}
          {changed && was && (
            <span className="lab-was">
              Was {was.value}
              {wasUnit ? ` ${wasUnit}` : ''}
            </span>
          )}
          <span className={`status-pill sm ${flagTone(r.flag, r.critical)}`}>{flagLabel(r.flag, r.critical)}</span>
        </li>
      );
    })}
  </ul>
);
