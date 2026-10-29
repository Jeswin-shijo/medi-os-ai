import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { coordinatorService } from '../../services';
import { errorMessage } from '../../services/api';
import { useCoordinatorList } from '../../hooks/useCoordinator';
import type { Approval, DutyTitle } from '../../types';
import { ago, agentName } from '../../utils/coordinator';

const ROLE_TARGETS = [
  { key: 'admin', label: 'Admin' },
  { key: 'doctor', label: 'Doctor' },
  { key: 'nurse', label: 'Nurse' },
  { key: 'staff', label: 'Front desk' }
];
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

interface ReassignDialogProps {
  approval: Approval;
  onClose(): void;
  onDone(): void;
}

/** Hand an approval to a duty title or a role, with a note saying why. */
const ReassignDialog: React.FC<ReassignDialogProps> = ({ approval, onClose, onDone }) => {
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [titles, setTitles] = useState<DutyTitle[] | null>(null);
  const [target, setTarget] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opener] = useState(() => document.activeElement as HTMLElement | null);

  useEffect(() => {
    let alive = true;
    coordinatorService
      .titles()
      .then((t) => alive && setTitles(t))
      .catch(() => alive && setTitles([]));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const box = boxRef.current;
    box?.querySelector<HTMLElement>('select')?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, [opener]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const box = boxRef.current;
      if (!box) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!box.contains(document.activeElement) || (e.shiftKey ? document.activeElement === first : document.activeElement === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const [kind, key] = target.split(':');
    if (!kind || !key) return setError('Choose who it should go to.');
    if (!note.trim()) return setError('Add a short note.');
    setBusy(true);
    setError(null);
    try {
      await coordinatorService.reassign(approval.id, { kind: kind as 'title' | 'role', key }, note.trim());
      onDone();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div ref={boxRef} className="modal-content-box co-reassign" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id={titleId} className="co-reassign-title">
            Reassign approval
          </h3>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={(e) => void submit(e)}>
          <div className="modal-body co-reassign-body">
            <p className="co-reassign-what">{approval.summary}</p>
            <div>
              <label className="form-label" htmlFor="co-reassign-to">
                Reassign to *
              </label>
              <select id="co-reassign-to" className="form-select" value={target} onChange={(e) => { setTarget(e.target.value); setError(null); }}>
                <option value="">Choose…</option>
                <optgroup label="Duty titles">
                  {(titles ?? []).map((t) => (
                    <option key={t.key} value={`title:${t.key}`}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Roles">
                  {ROLE_TARGETS.map((r) => (
                    <option key={r.key} value={`role:${r.key}`}>
                      {r.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="co-reassign-note">
                Note *
              </label>
              <textarea id="co-reassign-note" className="input-field" rows={3} maxLength={300} value={note} onChange={(e) => { setNote(e.target.value); setError(null); }} placeholder="Why it is going to them" />
            </div>
          </div>
          {error && (
            <p className="admit-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Reassigning…' : 'Reassign'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

interface ApprovalsListProps {
  version: number;
  onOpenCase(caseId: string): void;
}

/** Decisions waiting for a person: approve or reject in place, open the source, or hand it to someone else. */
export const ApprovalsList: React.FC<ApprovalsListProps> = ({ version, onOpenCase }) => {
  const { user, showToast, openBedRequest } = useApp();
  const role = user?.role ?? '';
  const fetchOpen = useCallback(() => coordinatorService.approvals('open'), []);
  const { items, loading, error, reload } = useCoordinatorList(fetchOpen, version);
  const [now, setNow] = useState(() => Date.now());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState<Approval | null>(null);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const decide = async (a: Approval, decision: 'approved' | 'rejected') => {
    if (busyId) return;
    setBusyId(a.id);
    try {
      await coordinatorService.act(a.id, decision);
      showToast(decision === 'approved' ? 'Approved' : 'Rejected', 'success');
      reload();
    } catch (err) {
      showToast(errorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };
  const close = useCallback(() => setReassigning(null), []);

  return (
    <section className="medios-card bagent-card co-card" aria-label="Approvals">
      <div className="card-header-row">
        <div className="bagent-title-group">
          <h3 className="card-title">Approvals</h3>
          <span className="bagent-hint">{items.length ? `${items.length} waiting` : 'None waiting'}</span>
        </div>
      </div>
      {loading ? (
        <p className="data-empty" role={error ? 'alert' : undefined}>
          {error ?? 'Loading approvals…'}
        </p>
      ) : items.length === 0 ? (
        <p className="data-empty" role={error ? 'alert' : undefined}>
          {error ?? 'Nothing is waiting for a decision.'}
        </p>
      ) : (
        <ul className="co-list co-approvals">
          {items.map((a) => {
            const mayDecide = a.roles.includes(role);
            const mayReassign = mayDecide || role === 'admin';
            const busy = busyId === a.id;
            const openTarget = a.source?.kind === 'bed-request' ? () => openBedRequest((a.source as { id: string }).id) : a.case ? () => onOpenCase(a.case as string) : null;
            return (
              <li key={a.id} className="co-item">
                <div className="co-approval">
                  <div className="co-approval-what">
                    {a.case ? (
                      <button type="button" className="co-approval-link co-summary" onClick={() => onOpenCase(a.case as string)}>
                        {a.summary}
                      </button>
                    ) : (
                      <span className="co-summary">{a.summary}</span>
                    )}
                    <span className="co-approval-meta">
                      {agentName(a.agent)}
                      {a.createdAt ? ` · ${ago(a.createdAt, now)}` : ''}
                      {a.assignedTo ? ` · with ${a.assignedTo.label}` : ''}
                    </span>
                  </div>
                  <div className="co-approval-actions">
                    {a.primary.kind === 'approve' && mayDecide && (
                      <>
                        <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => void decide(a, 'approved')}>
                          Approve
                        </button>
                        <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => void decide(a, 'rejected')}>
                          Reject
                        </button>
                      </>
                    )}
                    {a.primary.kind === 'open' && openTarget && (
                      <button type="button" className="btn-primary btn-sm" onClick={openTarget}>
                        Open
                      </button>
                    )}
                    {mayReassign && (
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setReassigning(a)}>
                        Reassign
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {reassigning && <ReassignDialog approval={reassigning} onClose={close} onDone={() => { showToast('Reassigned', 'success'); reload(); }} />}
    </section>
  );
};
