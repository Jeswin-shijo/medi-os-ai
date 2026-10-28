import React from 'react';
import { CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { AgentSuggestion } from '../../types';

export type SuggestionTarget = AgentSuggestion['action']['target'];

interface SuggestionListProps {
  suggestions: AgentSuggestion[];
  /** Each button only navigates: the screen decides where a target is. */
  onAction(target: SuggestionTarget): void;
}

const TONE = {
  warn: { icon: TriangleAlert, cls: 'is-warn' },
  info: { icon: Info, cls: 'is-info' },
  ok: { icon: CircleCheck, cls: 'is-ok' }
} as const;

/** What the Bed Agent's rules notice in the live figures, each with a button to the right place. Rule-based, not AI. */
export const SuggestionList: React.FC<SuggestionListProps> = ({ suggestions, onAction }) => (
  <section className="medios-card bagent-card">
    <div className="card-header-row">
      <h3 className="card-title">Suggestions</h3>
      <span className="bagent-hint">From the live bed figures</span>
    </div>
    {suggestions.length === 0 ? (
      <p className="data-empty">Nothing to suggest right now.</p>
    ) : (
      <ul className="sugg-list">
        {suggestions.map((s) => {
          const { icon: Icon, cls } = TONE[s.tone];
          return (
            <li key={s.id} className={`sugg-item ${cls}`}>
              <span className="sugg-icon" aria-hidden="true">
                <Icon size={17} strokeWidth={2} />
              </span>
              <div className="sugg-body">
                <div className="sugg-text">
                  <p className="sugg-title">{s.title}</p>
                  <p className="sugg-detail">{s.detail}</p>
                </div>
                <button type="button" className="btn-outline-blue btn-sm sugg-btn" onClick={() => onAction(s.action.target)}>
                  {s.action.label}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);
