import React from 'react';
import { ChevronRight, MessageCircleQuestion } from 'lucide-react';
import type { CoordinatorEvent } from '../../types';

const STEPS = ['Order', 'Checks', 'Pharmacist', 'Issue'];

/**
 * The Pharmacy's route in one line (it wraps on a narrow screen) with the query branch under it. When the
 * Coordinator passes a message from Pharmacy, the route pulses once (280 ms); a query message pulses the
 * branch. Nothing pulses under reduced motion.
 */
export const PharmacyWorkflowDiagram: React.FC<{ lastEvent: CoordinatorEvent | null }> = ({ lastEvent }) => {
  const query = !!lastEvent?.summary && /query/i.test(lastEvent.summary);
  // The key restarts the one-off CSS animation on each new event.
  const pulseKey = lastEvent?.id ?? 'none';
  return (
    <div className="er-diagram">
      <ol key={`flow-${pulseKey}`} className={`er-flow${lastEvent && !query ? ' is-pulse' : ''}`} aria-label="Pharmacy steps">
        {STEPS.map((s, i) => (
          <li key={s} className="er-flow-step">
            <span className="er-flow-n" aria-hidden="true">
              {i + 1}
            </span>
            {s}
            {i < STEPS.length - 1 && <ChevronRight size={14} className="er-flow-arrow" aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <ul className="er-linked lab-branch" aria-label="Query branch">
        <li key={`query-${pulseKey}`} className={`er-linked-tile ph-query-tile${query ? ' is-pulse' : ''}`}>
          <MessageCircleQuestion size={16} aria-hidden="true" />
          <span className="er-linked-name">Query to the doctor</span>
          <span className="lab-branch-note">
            The pharmacist can query the doctor instead of approving. The doctor changes, keeps or cancels the line, and it goes back to the pharmacist.
          </span>
        </li>
      </ul>
    </div>
  );
};
