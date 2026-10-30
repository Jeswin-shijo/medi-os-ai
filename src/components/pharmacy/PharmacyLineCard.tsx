import React from 'react';
import { useNow } from '../../hooks/useNow';
import { Clock } from 'lucide-react';
import type { PharmacyLineView } from '../../types';
import { PRIORITY_LABEL, PRIORITY_TONE, ROUTE_LABEL, STORE_LABEL, doseText, dueText } from '../../utils/pharmacy';
import { PharmacyFlags } from './PharmacyFlags';

interface PharmacyLineCardProps {
  line: PharmacyLineView;
  /** Buttons and forms under the card. */
  actions?: React.ReactNode;
  canExplain?: boolean;
  /** Which time to count down: the check (default) or the issue. */
  due?: 'check' | 'issue';
}

/** One medicine line: the patient, the medicine, the flags and the time left. */
export const PharmacyLineCard: React.FC<PharmacyLineCardProps> = ({ line, actions, canExplain = true, due = 'check' }) => {
  const now = useNow();
  const p = line.patient;
  const left = dueText(due === 'check' ? line.checkDueAt : line.issueDueAt, now);
  const where = p.location.ward ? `${p.location.area} · ${p.location.ward}` : p.location.area;
  const hasRed = line.flags.some((f) => f.severity === 'red');
  return (
    <li className={`ph-card${hasRed ? ' has-red' : ''}`}>
      <div className="ph-card-head">
        <div className="ph-card-patient">
          <span className="er-name">{p.name}</span>
          <span className="er-sub lab-block">{p.uhid} · {where}</span>
        </div>
        <div className="ph-card-tags">
          <span className="lab-num">{line.orderNumber}</span>
          <span className={`status-pill sm ${PRIORITY_TONE[line.priority]}`}>{PRIORITY_LABEL[line.priority]}</span>
          {left && (
            <span className={`ph-due${left.late ? ' is-late' : ''}`}>
              <Clock size={12} aria-hidden="true" />
              {left.text}
            </span>
          )}
        </div>
      </div>
      <dl className="ph-facts">
        <div>
          <dt>Allergies</dt>
          <dd>{p.allergies.length ? p.allergies.join(', ') : 'None recorded'}</dd>
        </div>
        <div>
          <dt>Weight</dt>
          <dd>{p.weightKg === null ? '—' : `${p.weightKg} kg`}</dd>
        </div>
        <div>
          <dt>Age</dt>
          <dd>{p.age === null ? '—' : `${p.age} yrs`}</dd>
        </div>
        <div>
          <dt>eGFR</dt>
          <dd>{p.egfr === null ? '—' : p.egfr}</dd>
        </div>
      </dl>
      <div className="ph-med">
        <span className="ph-med-name">{line.productLabel || line.medicineLabel}</span>
        <span className="ph-med-dose">
          {doseText(line, line.productLabel || line.medicineLabel)} · {ROUTE_LABEL[line.route] ?? line.route}
          {line.quantity !== null ? ` · ${line.quantity} ${line.issueUnit}` : ''}
          {` · ${STORE_LABEL[line.defaultStore]}`}
        </span>
        {line.note && <span className="er-hint ph-med-note">Note: {line.note}</span>}
      </div>
      <PharmacyFlags line={line} canExplain={canExplain} />
      {actions}
    </li>
  );
};
