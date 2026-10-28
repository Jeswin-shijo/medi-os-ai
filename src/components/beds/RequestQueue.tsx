import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import type { BedRequest, BedRequestState } from '../../types';
import { PRIORITY_OPTIONS, PRIORITY_PILL, REQUEST_STATE_META, TONE_PILL, clockOrDay, requestTypeLabel, roomClassLabel } from '../../utils/beds';

interface RequestQueueProps {
  /** Newest first. Mount the list once the first page has loaded, so only later arrivals slide in. */
  requests: BedRequest[];
  onOpen(r: BedRequest): void;
  /** Two-line rows at any width (the overview card); otherwise a table-like row once there is room. */
  compact?: boolean;
  selectedId?: string | null;
}

/**
 * Every request starts as Searching, but the agent often decides within milliseconds. A request that arrives
 * while the list is open shows that step for this long, then its real state.
 */
const SEARCHING_FOR_MS = 1200;

const PRIORITY_LABEL = Object.fromEntries(PRIORITY_OPTIONS.map((o) => [o.value, o.label]));

const newest = (rs: BedRequest[]) => rs.reduce((max, r) => (r.requestedAt > max ? r.requestedAt : max), '');

/** The state pill: Searching shimmers; a change after the first render pops in (Bed assigned with a tick). */
const StatePill: React.FC<{ state: BedRequestState }> = ({ state }) => {
  const [shown, setShown] = useState({ state, changed: false });
  if (shown.state !== state) setShown({ state, changed: true });
  const meta = REQUEST_STATE_META[state];
  const cls = ['status-pill', TONE_PILL[meta.tone], state === 'searching' && 'rq-searching', shown.changed && 'rq-pop'].filter(Boolean).join(' ');
  return (
    <span key={state} className={cls}>
      {state === 'assigned' && <Check size={12} strokeWidth={2.6} aria-hidden="true" />}
      {meta.label}
    </span>
  );
};

/** The live list of bed requests: time, patient, request (type, from → to), priority and state. */
export const RequestQueue: React.FC<RequestQueueProps> = ({ requests, onOpen, compact, selectedId }) => {
  // Requests newer than anything seen so far are arrivals: they slide in and show Searching first.
  // Older ones (a further page, a changed filter) just appear.
  const [seen, setSeen] = useState(() => ({ newest: newest(requests), arrived: new Set<string>(), searching: new Set<string>() }));
  const arrivals = requests.filter((r) => r.requestedAt > seen.newest);
  if (arrivals.length) {
    const ids = arrivals.map((r) => r.id);
    setSeen({
      newest: newest(arrivals),
      arrived: new Set([...seen.arrived, ...ids]),
      searching: new Set([...seen.searching, ...arrivals.filter((r) => r.state !== 'cancelled').map((r) => r.id)])
    });
  }

  useEffect(() => {
    if (!seen.searching.size) return;
    const timer = window.setTimeout(() => setSeen((s) => ({ ...s, searching: new Set() })), SEARCHING_FOR_MS);
    return () => window.clearTimeout(timer);
  }, [seen.searching]);

  if (!requests.length) return <p className="data-empty">No bed requests yet.</p>;

  return (
    <div className={`rq${compact ? ' is-compact' : ''}`}>
      <div className="rq-head" aria-hidden="true">
        <span>Time</span>
        <span>Patient</span>
        <span>Request</span>
        <span>Priority</span>
        <span>Status</span>
      </div>
      <ul className="rq-list">
        {requests.map((r) => {
          const state = seen.searching.has(r.id) ? 'searching' : r.state;
          // While it shows Searching, the row names the class asked for; the bed appears with "Bed assigned".
          const bed = state === 'searching' ? undefined : r.assignedBedLabel;
          return (
            <li key={r.id} className={`rq-row${seen.arrived.has(r.id) ? ' rq-row-enter' : ''}`}>
              <button type="button" className="rq-btn" aria-current={r.id === selectedId ? 'true' : undefined} onClick={() => onOpen(r)}>
                <span className="rq-time">{clockOrDay(r.requestedAt)}</span>
                <span className="rq-who">{r.patientName}</span>
                {/* Where from gives way first, so the bed it went to stays readable. */}
                <span className="rq-what">
                  <span className="rq-type">{requestTypeLabel(r)}</span>
                  <span className="rq-from">{r.fromBedLabel ?? r.department}</span>
                  <span className="rq-arrow">→</span>
                  <span className={`rq-to${bed ? ' rq-bed' : ''}`}>{bed ?? roomClassLabel(r.roomClass)}</span>
                </span>
                <span className="rq-prio">
                  <span className={`status-pill sm ${PRIORITY_PILL[r.priority]}`}>{PRIORITY_LABEL[r.priority]}</span>
                </span>
                <span className="rq-state">
                  <StatePill state={state} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
