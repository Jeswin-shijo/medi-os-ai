import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { coordinatorService } from '../../services';
import { errorMessage } from '../../services/api';
import type { CoordinatorCaseDetail, CoordinatorClock } from '../../types';
import { dayAndTime } from '../../utils/beds';
import { agentName, agentNames, PRIORITY_LABELS, PRIORITY_PILLS, realDayAndTime, timeLeft, typeLabel } from '../../utils/coordinator';

interface CaseDetailProps {
  caseId: string;
  /** Goes up on every live event, so the case refetches. */
  version: number;
  /** The case heading, which takes focus when the case opens. */
  headingRef?: React.Ref<HTMLHeadingElement>;
  /** Called once, when the case first shows its details (or its error): the page can scroll to it then. */
  onShown?(): void;
  onClose(): void;
}

const KINDS: Record<string, string> = { ipd: 'In-patient admission', opd: 'Out-patient visit', er: 'Emergency visit' };

/** One case: who it is for, its state, the agents on it, running clocks and the whole timeline, oldest first. */
export const CaseDetail: React.FC<CaseDetailProps> = ({ caseId, version, headingRef, onShown, onClose }) => {
  const [loaded, setLoaded] = useState<{ id: string; detail: CoordinatorCaseDetail } | null>(null);
  const [failed, setFailed] = useState<{ id: string; message: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const shownId = useRef<string | null>(null);
  useEffect(() => {
    let alive = true;
    // A newly opened case loads at once; later live changes wait 300 ms so a burst costs one request.
    const wait = shownId.current === caseId ? 300 : 0;
    shownId.current = caseId;
    const timer = window.setTimeout(() => {
      coordinatorService
        .case(caseId)
        .then((detail) => {
          if (!alive) return;
          setLoaded({ id: caseId, detail });
          setFailed(null);
        })
        .catch((err) => alive && setFailed({ id: caseId, message: errorMessage(err) }));
    }, wait);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [caseId, version]);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(t);
  }, []);

  const detail = loaded && loaded.id === caseId ? loaded.detail : null;
  const error = failed && failed.id === caseId ? failed.message : null;
  const c = detail?.case;
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current || !(detail || error)) return;
    shown.current = true;
    onShown?.();
  }, [detail, error, onShown]);
  // Running clocks and expired ones (an expired clock that was met late says how late).
  const clocks = detail?.clocks.filter((k) => k.state === 'running' || k.state === 'expired') ?? [];
  const clockText = (k: CoordinatorClock): { text: string; late: boolean } => {
    if (k.state === 'expired' && k.stoppedAt) {
      const min = Math.max(1, Math.ceil((new Date(k.stoppedAt).getTime() - new Date(k.dueAt).getTime()) / 60_000));
      return { text: `met ${min} min late`, late: true };
    }
    const left = timeLeft(k.dueAt, now);
    return { text: left.text, late: left.late || k.state === 'expired' };
  };

  return (
    <aside className="medios-card bagent-card co-case" aria-label="Case details">
      <div className="card-header-row">
        <h3 ref={headingRef} className="card-title co-case-title" tabIndex={-1}>
          {c ? c.number : 'Case'}
        </h3>
        <button type="button" className="icon-btn" aria-label="Close case" onClick={onClose}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      {!c ? (
        <p className="data-empty" role={error ? 'alert' : undefined}>
          {error ?? 'Loading the case…'}
        </p>
      ) : (
        <>
          {error && (
            <p className="bagent-banner" role="alert">
              Showing the last details loaded. {error}
            </p>
          )}
          <p className="co-case-patient">
            <span className="co-case-name">{c.patientName}</span>
            <span className="co-case-uhid">{c.patientUhid}</span>
          </p>
          <dl className="co-facts">
            <div>
              <dt>Kind</dt>
              <dd>{KINDS[c.kind] ?? typeLabel(c.kind)}</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>
                <span className={`status-pill sm ${c.state === 'open' ? 'green' : 'gray'}`}>{c.state === 'open' ? 'Open' : 'Closed'}</span>{' '}
                <span className={`status-pill sm ${PRIORITY_PILLS[c.priority]}`}>{PRIORITY_LABELS[c.priority]}</span>
              </dd>
            </div>
            <div>
              <dt>Agents</dt>
              <dd>{agentNames(c.agents) || 'None yet'}</dd>
            </div>
            {c.openedAt && (
              <div>
                <dt>Opened</dt>
                <dd>{dayAndTime(c.openedAt)}</dd>
              </div>
            )}
            {c.closedAt && (
              <div>
                <dt>Closed</dt>
                <dd>
                  {dayAndTime(c.closedAt)}
                  {c.closedReason ? `, ${c.closedReason}` : ''}
                </dd>
              </div>
            )}
          </dl>

          <h4 className="co-sub">Clocks</h4>
          {clocks.length === 0 ? (
            <p className="co-none">No deadline running.</p>
          ) : (
            <ul className="co-clocks">
              {clocks.map((k) => {
                const { text, late } = clockText(k);
                return (
                  <li key={k.id} className={late ? 'is-late' : undefined}>
                    <span className="co-clock-name">{typeLabel(k.def)}</span>
                    <span className="co-clock-left">
                      {text}
                      {k.escalation ? ' · escalated' : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <h4 className="co-sub">Timeline</h4>
          {detail && detail.timeline.length === 0 ? (
            <p className="co-none">No messages yet.</p>
          ) : (
            <ol className="co-timeline">
              {detail?.timeline.map((m) => (
                <li key={m.id}>
                  <span className="co-tl-time">{realDayAndTime(m.createdAt)}</span>
                  <span className="co-tl-text">{m.summary}</span>
                  <span className="co-tl-meta">
                    {agentName(m.from)} → {agentNames(m.to) || 'no one'} · {typeLabel(m.type)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </aside>
  );
};
