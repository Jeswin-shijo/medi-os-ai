import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { bedRequestService } from '../../services';
import { errorMessage } from '../../services/api';
import type { BedDecision, BedRequest, Need } from '../../types';
import {
  NEED_OPTIONS,
  PRIORITY_OPTIONS,
  PRIORITY_PILL,
  REQUEST_ROLES,
  REQUEST_STATE_META,
  TONE_PILL,
  dayAndTime,
  requestTypeLabel,
  roomClassLabel
} from '../../utils/beds';
import { AdmitDialog } from './AdmitDialog';

interface RequestDetailProps {
  request: BedRequest;
  role: string;
  /** Called after anything changed on the server (the screen reloads the request and the list). */
  onChanged(): void;
}

const needLabel = (need: Need) => NEED_OPTIONS.find((o) => o.need === need)?.label ?? need;
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Who made the decision. A canned AI answer says so. */
const deciderLabel = (d: BedDecision) => (d.by === 'ai' ? (d.sample ? 'AI (sample)' : 'AI') : d.by === 'rules' ? 'Rules' : 'Staff');

/** Everything about one request: its state, what was asked, what the agent found and decided, and the actions. */
export const RequestDetail: React.FC<RequestDetailProps> = ({ request: r, role, onChanged }) => {
  const { showToast, refreshAlertCount } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const canAct = REQUEST_ROLES.includes(role);
  const meta = REQUEST_STATE_META[r.state];
  const priority = PRIORITY_OPTIONS.find((o) => o.value === r.priority)?.label ?? r.priority;
  const decision = r.decision;

  const refreshed = () => {
    onChanged();
    void refreshAlertCount().catch(() => undefined);
  };
  const run = async (key: string, work: () => Promise<unknown>, done: string) => {
    setBusy(key);
    try {
      await work();
      showToast(done, 'success');
      setConfirmingCancel(false);
      refreshed();
    } catch (err) {
      showToast(errorMessage(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="medios-card bagent-card rd" aria-label={`Request for ${r.patientName}`}>
      <div className="rd-head">
        <div className="rd-who">
          <h3 className="card-title rd-name">{r.patientName}</h3>
          <span className="bagent-hint">
            {r.patientUhid} · {r.patientAge} yrs · {r.patientGender}
          </span>
        </div>
        <span key={r.state} className={`status-pill ${TONE_PILL[meta.tone]} rq-pop`}>
          {r.state === 'assigned' && <Check size={12} strokeWidth={2.6} aria-hidden="true" />}
          {meta.label}
        </span>
      </div>
      {r.stateReason && <p className={`rd-reason is-${meta.tone}`}>{r.stateReason}</p>}

      {canAct && (r.open || r.pendingNeeds.length > 0) && (
        <div className="rd-actions">
          {r.open &&
            r.pendingNeeds.map((p) => (
              <div key={p.need} className="rd-pending">
                <span className="rd-pending-text">
                  {needLabel(p.need)}: notes mention “{p.evidence}”
                </span>
                <button
                  type="button"
                  className="btn-primary rd-btn"
                  disabled={busy !== null}
                  onClick={() => run(`c-${p.need}`, () => bedRequestService.notesNeed(r.id, p.need, true), `${needLabel(p.need)} confirmed`)}
                >
                  Confirm {lower(needLabel(p.need))}
                </button>
                <button
                  type="button"
                  className="btn-secondary rd-btn"
                  disabled={busy !== null}
                  onClick={() => run(`d-${p.need}`, () => bedRequestService.notesNeed(r.id, p.need, false), `${needLabel(p.need)} dismissed`)}
                >
                  Dismiss
                </button>
              </div>
            ))}
          {(r.state === 'attention' || r.state === 'waiting') && (
            <button type="button" className="btn-primary rd-btn" disabled={busy !== null} onClick={() => setAssigning(true)}>
              Assign by hand
            </button>
          )}
          {r.open &&
            (confirmingCancel ? (
              <span className="rd-confirm swap-in">
                <span>Cancel this request?</span>
                <button
                  type="button"
                  className="btn-danger-soft rd-btn"
                  disabled={busy !== null}
                  onClick={() => run('cancel', () => bedRequestService.cancel(r.id), 'Request cancelled')}
                >
                  Yes, cancel
                </button>
                <button type="button" className="btn-secondary rd-btn" onClick={() => setConfirmingCancel(false)}>
                  Keep
                </button>
              </span>
            ) : (
              <button type="button" className="btn-secondary rd-btn" disabled={busy !== null} onClick={() => setConfirmingCancel(true)}>
                Cancel request
              </button>
            ))}
        </div>
      )}

      <h4 className="rd-h">Request</h4>
      <dl className="rd-facts">
        <div>
          <dt>Type</dt>
          <dd>{requestTypeLabel(r)}</dd>
        </div>
        <div>
          <dt>Room class</dt>
          <dd>{roomClassLabel(r.roomClass)}</dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>
            <span className={`status-pill sm ${PRIORITY_PILL[r.priority]}`}>{priority}</span>
          </dd>
        </div>
        <div>
          <dt>{r.type === 'transfer' ? 'From' : 'Department'}</dt>
          <dd>{r.fromBedLabel ?? r.department}</dd>
        </div>
        <div>
          <dt>Doctor</dt>
          <dd>{r.doctor}</dd>
        </div>
        <div>
          <dt>Expected stay</dt>
          <dd>
            {r.expectedStayDays} {r.expectedStayDays === 1 ? 'day' : 'days'}
          </dd>
        </div>
        <div>
          <dt>Requested</dt>
          <dd>
            {dayAndTime(r.requestedAt)} by {r.requestedByName}
          </dd>
        </div>
        {r.assignedBedLabel && (
          <div>
            <dt>Bed</dt>
            <dd>
              <strong>{r.assignedBedLabel}</strong>
              {r.assignedAt && ` · ${dayAndTime(r.assignedAt)}`}
            </dd>
          </div>
        )}
      </dl>
      <div className="rd-needs">
        <span className="rd-label">Needs</span>
        {r.needs.length === 0 && r.addedNeeds.length === 0 ? (
          <span className="bagent-hint">None</span>
        ) : (
          <ul className="rd-chips">
            {r.needs.map((n) => (
              <li key={n} className="status-pill sm blue">
                {needLabel(n)}
              </li>
            ))}
          </ul>
        )}
      </div>
      {r.addedNeeds.length > 0 && (
        <ul className="rd-list">
          {r.addedNeeds.map((n) => (
            <li key={n.need}>
              Added {lower(needLabel(n.need))}: notes mention “{n.evidence}”
            </li>
          ))}
        </ul>
      )}
      {r.resolvedNeeds.length > 0 && (
        <ul className="rd-list">
          {r.resolvedNeeds.map((n) => (
            <li key={`${n.need}-${n.at}`}>
              {needLabel(n.need)} {n.confirmed ? 'confirmed' : 'dismissed'} by {n.byName} — notes mention “{n.evidence}”
            </li>
          ))}
        </ul>
      )}
      {r.notes && (
        <p className="rd-notes">
          <span className="rd-label">Notes</span> {r.notes}
        </p>
      )}

      <h4 className="rd-h">Decision</h4>
      {decision ? (
        <div className="rd-decision">
          <p className="rd-decider">
            <span className={`status-pill sm ${decision.by === 'ai' ? 'purple' : decision.by === 'staff' ? 'green' : 'gray'}`}>{deciderLabel(decision)}</span>
            <span>
              chose <strong>{decision.bedLabel}</strong>
              {decision.wardName && ` in ${decision.wardName}`}
              {decision.ruleOverride && ' (rules overridden)'}
            </span>
          </p>
          {decision.reason && <p className="rd-text">{decision.reason}</p>}
          {decision.appliedRules.length > 0 && (
            <div className="rd-rules">
              <span className="rd-label">Rules applied</span>
              <ul className="rd-list">
                {decision.appliedRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
          )}
          {decision.candidates.length > 0 && (
            <div className="rd-rules">
              <span className="rd-label">Beds considered</span>
              <ol className="rd-cands">
                {decision.candidates.map((c) => (
                  <li key={c.bedId} className={c.bedId === decision.bedId ? 'is-chosen' : undefined}>
                    <span className="rd-cand-bed">{c.label}</span>
                    <span className="rd-cand-score">{c.score}</span>
                    <span className="rd-cand-why">{c.reason}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ) : (
        <p className="data-empty rd-empty">
          {r.state === 'cancelled' ? 'Cancelled before a bed was chosen.' : r.state === 'searching' ? 'The Bed Agent is looking for a bed.' : 'No bed has been chosen yet.'}
        </p>
      )}
      {r.attempts > 0 && !decision && <p className="bagent-hint">Tried {r.attempts} {r.attempts === 1 ? 'time' : 'times'}.</p>}
      {r.closedByName && r.state === 'cancelled' && <p className="bagent-hint">Cancelled by {r.closedByName}.</p>}

      {assigning && (
        <AdmitDialog
          fromRequest={r}
          onClose={() => setAssigning(false)}
          onDone={refreshed}
        />
      )}
    </section>
  );
};
