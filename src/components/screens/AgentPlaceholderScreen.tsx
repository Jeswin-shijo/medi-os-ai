import React from 'react';
import { AGENT_LIST, type AgentKey } from '../../types';
import { ScreenHeader } from '../common/ScreenHeader';

const FACTS: { id: 'job' | 'owns' | 'neverDoes'; label: string }[] = [
  { id: 'job', label: 'Its job' },
  { id: 'owns', label: 'What it owns' },
  { id: 'neverDoes', label: 'What it never does' }
];

/** The page of an agent that is not built yet: what it will do, and what it will never do. */
export const AgentPlaceholderScreen: React.FC<{ agent: AgentKey }> = ({ agent }) => {
  const info = AGENT_LIST.find((a) => a.key === agent);
  if (!info) return null;
  return (
    <div className="screen-container">
      <ScreenHeader title={`${info.name} Agent`} subtitle="Planned agent" badge={<span className="agent-soon-pill">Not built yet</span>} />
      <section className="agent-placeholder" aria-label={`${info.name} Agent plan`}>
        {FACTS.map((f) => (
          <div key={f.id} className="agent-placeholder-row">
            <h2>{f.label}</h2>
            <p>{info[f.id]}</p>
          </div>
        ))}
        <p className="agent-placeholder-note">Not built yet. Until then, the Coordinator keeps every case moving and your team handles this work as today.</p>
      </section>
    </div>
  );
};
