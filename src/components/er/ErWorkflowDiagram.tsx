import React from 'react';
import { BedDouble, CalendarDays, ChevronRight, FlaskConical, Pill, type LucideIcon } from 'lucide-react';
import type { CoordinatorEvent } from '../../types';

const STEPS = ['Arrival', 'Triage', 'Doctor', 'Tests and treatment', 'Disposition'];

interface Linked {
  key: string;
  name: string;
  icon: LucideIcon;
  live: boolean;
}
const LINKED: Linked[] = [
  { key: 'bed', name: 'Bed', icon: BedDouble, live: true },
  { key: 'lab', name: 'Lab', icon: FlaskConical, live: false },
  { key: 'pharmacy', name: 'Pharmacy', icon: Pill, live: false },
  { key: 'scheduling', name: 'Scheduling', icon: CalendarDays, live: false }
];

/**
 * The ER's route in one line (it wraps on a narrow screen) and the agents it works with. When the Coordinator
 * passes a message to or from the ER, the matching part pulses once (280 ms); nothing pulses under reduced motion.
 */
export const ErWorkflowDiagram: React.FC<{ lastEvent: CoordinatorEvent | null }> = ({ lastEvent }) => {
  // The key restarts the one-off CSS animation on each new event; reduced motion turns it off in CSS.
  const target = lastEvent ? (lastEvent.from === 'bed' || lastEvent.to?.includes('bed') ? 'bed' : 'flow') : null;
  const pulseKey = lastEvent?.id ?? 'none';

  return (
    <div className="er-diagram">
      <ol key={`flow-${pulseKey}`} className={`er-flow${target === 'flow' ? ' is-pulse' : ''}`} aria-label="ER steps">
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
      <ul className="er-linked" aria-label="Agents the ER works with">
        {LINKED.map((a) => (
          <li key={a.key === 'bed' ? `bed-${pulseKey}` : a.key} className={`er-linked-tile${a.live ? '' : ' is-dim'}${a.key === 'bed' && target === 'bed' ? ' is-pulse' : ''}`}>
            <a.icon size={16} aria-hidden="true" />
            <span className="er-linked-name">{a.name}</span>
            <span className={`status-pill sm ${a.live ? 'green' : 'gray'}`}>{a.live ? 'Live' : 'Soon'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
