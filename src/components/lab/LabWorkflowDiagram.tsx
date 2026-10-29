import React from 'react';
import { ChevronRight, TriangleAlert } from 'lucide-react';
import type { CoordinatorEvent } from '../../types';

const STEPS = ['Order', 'Collection', 'Processing', 'Validation', 'Report'];

/**
 * The Lab's route in one line (it wraps on a narrow screen) with the critical alert branch under it. When the
 * Coordinator passes a message from the Lab, the route pulses once (280 ms); a critical message pulses the
 * branch. Nothing pulses under reduced motion.
 */
export const LabWorkflowDiagram: React.FC<{ lastEvent: CoordinatorEvent | null }> = ({ lastEvent }) => {
  const critical = !!lastEvent?.summary && /critical/i.test(lastEvent.summary);
  // The key restarts the one-off CSS animation on each new event.
  const pulseKey = lastEvent?.id ?? 'none';
  return (
    <div className="er-diagram">
      <ol key={`flow-${pulseKey}`} className={`er-flow${lastEvent && !critical ? ' is-pulse' : ''}`} aria-label="Lab steps">
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
      <ul className="er-linked lab-branch" aria-label="Critical alert branch">
        <li key={`crit-${pulseKey}`} className={`er-linked-tile lab-critical-tile${critical ? ' is-pulse' : ''}`}>
          <TriangleAlert size={16} aria-hidden="true" />
          <span className="er-linked-name">Critical alert</span>
          <span className="lab-branch-note">A released critical value goes to the duty doctor to acknowledge, within 15 minutes.</span>
        </li>
      </ul>
    </div>
  );
};
