import React, { useState } from 'react';
import type { AgentMessage } from '../../types';
import { dayAndTime } from '../../utils/beds';
import { agentName, agentNames, typeLabel } from '../../utils/coordinator';

const ResultPill: React.FC<{ m: AgentMessage }> = ({ m }) => {
  if (m.resolvedAt) return <span className="status-pill sm green">Resolved</span>;
  if (m.state === 'failed') return <span className="status-pill sm red">Failed</span>;
  if (m.state === 'pending') return <span className="status-pill sm orange">Pending</span>;
  return <span className="status-pill sm blue">Delivered</span>;
};

interface DecisionsLogProps {
  /** Latest first. */
  messages: AgentMessage[];
  loaded: boolean;
  error: string | null;
  selectedCaseId: string | null;
  onOpenCase(caseId: string): void;
}

const newest = (ms: AgentMessage[]) => ms.reduce((max, m) => (m.createdAt > max ? m.createdAt : max), '');

/** Every message the Coordinator routed: when, what triggered it, who it went to, and how it ended. */
export const DecisionsLog: React.FC<DecisionsLogProps> = ({ messages, loaded, error, selectedCaseId, onOpenCase }) => {
  // Only rows newer than what the first load showed slide in (240 ms); the first page just appears.
  const [baseline, setBaseline] = useState<string | null>(null);
  if (loaded && baseline === null) setBaseline(newest(messages));
  const isNew = (m: AgentMessage) => baseline !== null && m.createdAt > baseline;

  return (
    <section className="medios-card bagent-card co-card" aria-label="Decisions log">
      <div className="card-header-row">
        <div className="bagent-title-group">
          <h3 className="card-title">Decisions log</h3>
          <span className="bagent-hint">Latest 50</span>
        </div>
      </div>
      {!loaded ? (
        <p className="data-empty" role={error ? 'alert' : undefined}>
          {error ?? 'Loading the log…'}
        </p>
      ) : messages.length === 0 ? (
        <p className="data-empty">Nothing routed yet.</p>
      ) : (
        <ul className="co-list co-log">
          {messages.map((m) => {
            const body = (
              <>
                <span className="co-log-time">{dayAndTime(m.createdAt)}</span>
                <span className="co-log-what">
                  <span className="co-summary">{m.summary}</span>
                  <span className="co-log-action">
                    {agentName(m.from)} → {agentNames(m.to) || 'no one'} · {typeLabel(m.type)}
                  </span>
                </span>
                <span className="co-log-result">
                  <ResultPill m={m} />
                </span>
              </>
            );
            return (
              <li key={m.id} className={`co-item${isNew(m) ? ' co-row-enter' : ''}`}>
                {m.case ? (
                  <button type="button" className="co-row co-logrow" aria-current={m.case === selectedCaseId ? 'true' : undefined} onClick={() => onOpenCase(m.case as string)}>
                    {body}
                  </button>
                ) : (
                  <div className="co-row co-logrow is-static">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
