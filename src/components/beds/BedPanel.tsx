import React, { useState } from 'react';
import { Ban, Sparkles } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { bedService } from '../../services';
import { errorMessage } from '../../services/api';
import type { BoardBed, BoardWard } from '../../types';
import { ADMIT_ROLES, BED_STATE_META, HOUSEKEEPING_ROLES, floorLabel, sinceLabel } from '../../utils/beds';

const FEATURE_LABEL: Record<string, string> = {
  oxygen: 'Oxygen',
  monitor: 'Monitor',
  ventilator: 'Ventilator',
  nearNurses: 'Near nurses',
  singleRoom: 'Single room',
  attendantBed: 'Attendant bed'
};

interface BedPanelProps {
  bed: BoardBed;
  ward: BoardWard;
  role: string;
  onAdmit: (bedId: string) => void;
  onTransfer: (bed: BoardBed) => void;
  onChanged: () => void;
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Details of the selected bed and the actions its state and the viewer's role allow. */
export const BedPanel: React.FC<BedPanelProps> = ({ bed, ward, role, onAdmit, onTransfer, onChanged }) => {
  const { showToast } = useApp();
  const [busy, setBusy] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmDischarge, setConfirmDischarge] = useState(false);
  const canAdmit = ADMIT_ROLES.includes(role);
  const canClean = HOUSEKEEPING_ROLES.includes(role);
  const meta = BED_STATE_META[bed.state];
  const Icon = meta.icon;

  const run = async (action: () => Promise<unknown>, done: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      showToast(done, 'success');
      setBlocking(false);
      setReason('');
      setConfirmDischarge(false);
      onChanged();
    } catch (err) {
      showToast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const patient = bed.patient;
  return (
    <aside className="medios-card bed-panel swap-in" aria-label={`Bed ${bed.label}`}>
      <div className="bed-panel-head">
        <h3>{bed.label}</h3>
        <span className="bed-panel-state">
          <span className="bed-panel-dot" style={{ background: meta.fill, border: `1px solid ${meta.border}` }} aria-hidden="true" />
          {Icon && <Icon size={12} aria-hidden="true" />}
          {bed.state === 'occupied' && bed.sample ? 'Occupied (sample)' : meta.label}
          {bed.since && <span className="bed-panel-since"> {sinceLabel(bed.since)}</span>}
        </span>
      </div>

      <dl className="bed-facts">
        <dt>Ward</dt>
        <dd>{ward.name}</dd>
        <dt>Floor</dt>
        <dd>{floorLabel(ward.floor)}</dd>
        <dt>Rate</dt>
        <dd>₹{ward.ratePerDay.toLocaleString('en-IN')} / day</dd>
        {bed.room && (
          <>
            <dt>Room</dt>
            <dd>{bed.room}</dd>
          </>
        )}
      </dl>

      {bed.features.length > 0 && (
        <div className="bed-chips">
          {bed.features.map((f) => (
            <span key={f} className="status-pill gray sm">
              {FEATURE_LABEL[f] ?? f}
            </span>
          ))}
        </div>
      )}

      {bed.state === 'occupied' && patient && (
        <dl className="bed-facts bed-patient">
          <dt>Patient</dt>
          <dd>{patient.name}</dd>
          <dt>UHID</dt>
          <dd>{patient.uhid}</dd>
          <dt>Admitted</dt>
          <dd>{day(patient.admittedAt)}</dd>
        </dl>
      )}

      {bed.state === 'blocked' && (
        <p className="bed-reason">
          <Ban size={12} aria-hidden="true" /> {bed.blockedReason || 'No reason recorded'}
        </p>
      )}
      {bed.state === 'held' && (
        <p className="bed-reason">
          <Sparkles size={12} aria-hidden="true" /> {bed.heldByMe ? 'Held for you while you admit.' : 'Held by another user.'}
        </p>
      )}

      {confirmDischarge && (
        <div className="bed-confirm" role="alertdialog" aria-label="Confirm discharge">
          <p>Discharge {patient?.name ?? 'this patient'} and free this bed for cleaning?</p>
          <div className="bed-actions">
            <button className="btn-danger-soft btn-sm" disabled={busy} onClick={() => run(() => bedService.discharge(bed.id), 'Patient discharged. Bed sent for cleaning.')}>
              Discharge
            </button>
            <button className="btn-secondary btn-sm" disabled={busy} onClick={() => setConfirmDischarge(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {blocking && (
        <form
          className="bed-confirm"
          onSubmit={(e) => {
            e.preventDefault();
            if (reason.trim()) void run(() => bedService.block(bed.id, reason.trim()), 'Bed blocked.');
          }}
        >
          <label htmlFor="bed-block-reason">Reason for blocking</label>
          <input
            id="bed-block-reason"
            className="input-field"
            value={reason}
            maxLength={200}
            autoFocus
            required
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Broken rail"
          />
          <div className="bed-actions">
            <button type="submit" className="btn-danger-soft btn-sm" disabled={busy || !reason.trim()}>
              Block bed
            </button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setBlocking(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {!confirmDischarge && !blocking && (
        <div className="bed-actions">
          {bed.state === 'free' && canAdmit && (
            <button className="btn-primary btn-sm" disabled={busy} onClick={() => onAdmit(bed.id)}>
              Admit here
            </button>
          )}
          {bed.state === 'free' && canClean && (
            <button className="btn-secondary btn-sm" disabled={busy} onClick={() => setBlocking(true)}>
              Block
            </button>
          )}
          {bed.state === 'occupied' && patient && canAdmit && (
            <button className="btn-outline-blue btn-sm" disabled={busy} onClick={() => onTransfer(bed)}>
              Transfer
            </button>
          )}
          {bed.state === 'occupied' && canAdmit && (
            <button className="btn-danger-soft btn-sm" disabled={busy} onClick={() => (patient ? setConfirmDischarge(true) : void run(() => bedService.discharge(bed.id), 'Bed sent for cleaning.'))}>
              Discharge
            </button>
          )}
          {bed.state === 'cleaning' && canClean && (
            <button className="btn-primary btn-sm" disabled={busy} onClick={() => run(() => bedService.clean(bed.id), 'Bed cleaned and free.')}>
              Mark cleaned
            </button>
          )}
          {bed.state === 'blocked' && canClean && (
            <button className="btn-secondary btn-sm" disabled={busy} onClick={() => run(() => bedService.unblock(bed.id), 'Bed unblocked.')}>
              Unblock
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
