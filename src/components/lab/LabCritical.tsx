import React, { useEffect, useId, useState } from 'react';
import { BellRing } from 'lucide-react';
import { labAgentService } from '../../services';
import { useErAction } from '../er/useErAction';
import type { LabCriticalRow, LabRequestView } from '../../types';
import { displayTime } from '../../utils/clinicDate';
import { minutesUntil, unitText } from '../../utils/lab';
import { LabDialogShell } from './LabDialogShell';

interface LabCriticalProps {
  rows: LabCriticalRow[] | null;
  /** Only for the note given with an acknowledgement. */
  requests: LabRequestView[] | null;
  error: string | null;
  canAck: boolean;
  onRetry(): void;
  /** After an acknowledgement: the Lab lists and the header bell reload. */
  onChanged(): void;
}

/** The Critical tab: every critical result nobody has acknowledged, and those acknowledged today. */
export const LabCritical: React.FC<LabCriticalProps> = ({ rows, requests, error, canAck, onRetry, onChanged }) => {
  const [now, setNow] = useState(() => Date.now());
  const [acking, setAcking] = useState<LabCriticalRow | null>(null);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="bagent-overview lab-body">
      <section className="medios-card bagent-card lab-card" aria-label="Critical results">
        <div className="card-header-row">
          <div className="bagent-title-group">
            <h3 className="card-title">Critical results</h3>
            <span className="bagent-hint">{rows ? `${rows.filter((c) => !c.ackAt).length} waiting for acknowledgement` : ''}</span>
          </div>
        </div>
        {!canAck && <p className="er-hint lab-readonly">You can see this list. The duty doctor acknowledges critical results.</p>}
        {!rows ? (
          error ? (
            <p className="data-empty" role="alert">
              {error}{' '}
              <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>
                Try again
              </button>
            </p>
          ) : (
            <p className="data-empty">Loading the critical results…</p>
          )
        ) : rows.length === 0 ? (
          <p className="data-empty">No critical results need attention.</p>
        ) : (
          <ul className="lab-crit lab-crit-list">
            {rows.map((c) => {
              const left = c.dueAt ? minutesUntil(c.dueAt, now) : null;
              const unit = unitText(c.unit);
              return (
                <li key={c.lineId} className={`lab-crit-row${c.ackAt ? '' : ' is-open'}`}>
                  <div className="lab-crit-main">
                    <span className="er-name">
                      {c.label}: {c.parameter} {c.value}
                      {unit ? ` ${unit}` : ''}
                      {c.amended ? ' (amended)' : ''}
                    </span>
                    <span className="er-sub lab-block">
                      {c.requestNumber} · ordered by {c.orderedBy || '—'}
                      {c.releasedAt ? ` · released ${displayTime(new Date(c.releasedAt))}` : ''}
                    </span>
                    {c.ackAt && (
                      <span className="er-sub lab-block">
                        Acknowledged by {c.ackBy ?? '—'} at {displayTime(new Date(c.ackAt))}
                        <AckNote requests={requests} lineId={c.lineId} />
                      </span>
                    )}
                  </div>
                  {c.ackAt ? (
                    <span className="status-pill sm green">Acknowledged</span>
                  ) : (
                    <span className="lab-crit-act">
                      {left !== null && left < 0 ? (
                        <span className="status-pill sm red">{-left} min overdue</span>
                      ) : left !== null ? (
                        <span className="status-pill sm orange">Acknowledge within {left} min</span>
                      ) : (
                        <span className="status-pill sm red">Not acknowledged</span>
                      )}
                      {canAck && (
                        <button type="button" className="btn-primary btn-sm" aria-label={`Acknowledge ${c.label} ${c.parameter}, ${c.requestNumber}`} onClick={() => setAcking(c)}>
                          Acknowledge
                        </button>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {acking && <AckDialog row={acking} onClose={() => setAcking(null)} onDone={onChanged} />}
    </div>
  );
};

/** The note given with an acknowledgement, from the request data. */
const AckNote: React.FC<{ requests: LabRequestView[] | null; lineId: string }> = ({ requests, lineId }) => {
  const note = requests?.flatMap((r) => r.lines).find((l) => l.id === lineId)?.critical?.ackNote;
  return note ? <> · “{note}”</> : null;
};

const AckDialog: React.FC<{ row: LabCriticalRow; onClose(): void; onDone(): void }> = ({ row, onClose, onDone }) => {
  const uid = useId();
  const { busy, error, run } = useErAction();
  const [note, setNote] = useState('');
  const unit = unitText(row.unit);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = note.trim();
    const ok = await run('ack', () => labAgentService.acknowledge(row.lineId, text || undefined));
    if (!ok) return;
    onDone();
    onClose();
  };

  return (
    <LabDialogShell title="Acknowledge critical result" icon={<BellRing size={18} color="var(--red-dark)" aria-hidden="true" />} busy={busy !== null} onClose={onClose}>
      <form onSubmit={(e) => void submit(e)}>
        <div className="modal-body admit-body">
          <p>
            <strong>
              {row.label}: {row.parameter} {row.value}
              {unit ? ` ${unit}` : ''}
            </strong>
            <span className="er-sub lab-block">
              {row.requestNumber} · ordered by {row.orderedBy || '—'}
            </span>
          </p>
          <div>
            <label className="form-label" htmlFor={`${uid}-note`}>
              Note (optional)
            </label>
            <textarea id={`${uid}-note`} className="input-field" rows={2} maxLength={300} placeholder="For example: patient informed, repeat sent" value={note} onChange={(e) => setNote(e.target.value)} />
            <p className="admit-hint">
              <span className="admit-count">{note.length} / 300</span>
            </p>
          </div>
        </div>
        {error && (
          <p className="admit-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy !== null}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy !== null}>
            {busy ? 'Acknowledging…' : 'Acknowledge'}
          </button>
        </div>
      </form>
    </LabDialogShell>
  );
};
