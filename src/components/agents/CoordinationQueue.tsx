import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { AgentMessage, Priority, RequestType } from '../../types';
import { ago, agentName, PRIORITY_LABELS, PRIORITY_PILLS } from '../../utils/coordinator';

type Filter = 'all' | Priority;
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' }
];

interface CoordinationQueueProps {
  /** Open work, in the order the API sends it (emergencies first). */
  messages: AgentMessage[];
  loaded: boolean;
  error: string | null;
  selectedCaseId: string | null;
  onOpenCase(caseId: string): void;
  /** Request types the person may raise; empty hides the button. */
  requestTypes: RequestType[];
  onNewRequest(type: RequestType): void;
}

/** Open work waiting on an agent or a person: priority, summary, which agent, how long ago. */
export const CoordinationQueue: React.FC<CoordinationQueueProps> = ({ messages, loaded, error, selectedCaseId, onOpenCase, requestTypes, onNewRequest }) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const shown = filter === 'all' ? messages : messages.filter((m) => m.priority === filter);

  return (
    <section className="medios-card bagent-card co-card" aria-label="Coordination queue">
      <div className="card-header-row">
        <div className="bagent-title-group">
          <h3 className="card-title">Coordination queue</h3>
          <span className="bagent-hint">{messages.length ? `${messages.length} open` : 'None open'}</span>
        </div>
        {requestTypes.length > 0 && (
          <div className="co-newwrap" ref={menuRef}>
            <button type="button" className="btn-secondary btn-sm" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
              + New request
              <ChevronDown size={13} aria-hidden="true" />
            </button>
            {menu && (
              <div className="pop-menu co-menu" role="menu">
                {requestTypes.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      onNewRequest(t);
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="bagent-filters" role="group" aria-label="Filter by priority">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={`chip-btn${filter === f.id ? ' active' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {!loaded ? (
        <p className="data-empty" role={error ? 'alert' : undefined}>
          {error ?? 'Loading the queue…'}
        </p>
      ) : shown.length === 0 ? (
        <p className="data-empty">{messages.length ? 'Nothing open at this priority.' : 'Nothing is waiting. Open work shows up here.'}</p>
      ) : (
        <ul className="co-list">
          {shown.map((m) => {
            const body = (
              <>
                <span className="co-main">
                  <span className={`status-pill sm ${PRIORITY_PILLS[m.priority]}`}>{PRIORITY_LABELS[m.priority]}</span>
                  <span className="co-summary">{m.summary}</span>
                </span>
                <span className="co-meta">
                  <span>{agentName(m.from)}</span>
                  <span>{ago(m.createdAt, now)}</span>
                </span>
              </>
            );
            return (
              <li key={m.id} className="co-item">
                {m.case ? (
                  <button type="button" className="co-row" aria-current={m.case === selectedCaseId ? 'true' : undefined} onClick={() => onOpenCase(m.case as string)}>
                    {body}
                  </button>
                ) : (
                  <div className="co-row is-static">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
