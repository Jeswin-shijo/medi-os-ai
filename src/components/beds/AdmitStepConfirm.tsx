import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { floorLabel, formatRate } from '../../utils/beds';
import type { BedOption } from './AdmitStepBed';

interface AdmitStepConfirmProps {
  patientName: string;
  /** The bed being left, for a transfer. */
  fromLabel?: string;
  bed: BedOption;
  doctor: string;
  stayDays: number;
  /** Why this bed, when the choice needed a reason. */
  reason?: string;
  ruleOverride: boolean;
  /** When the server's hold on the bed runs out (real clock). */
  holdExpiresAt: number;
}

/** Whole seconds left, as m:ss. */
const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Step 3: what is about to happen, and the hold counting down. */
export const AdmitStepConfirm: React.FC<AdmitStepConfirmProps> = ({ patientName, fromLabel, bed, doctor, stayDays, reason, ruleOverride, holdExpiresAt }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const left = holdExpiresAt - now;
  const estimate = `₹${(bed.ratePerDay * stayDays).toLocaleString('en-IN')}`;

  return (
    <div className="admit-section">
      <p className="admit-summary">
        {fromLabel ? 'Move ' : 'Admit '}
        <strong>{patientName}</strong>
        {fromLabel ? ` from ${fromLabel} to ` : ' to '}
        <strong>{bed.label}</strong>.
      </p>
      <div className={`admit-notice ${left > 0 ? 'is-info' : 'is-warn'}`} role="timer" aria-label="Bed hold">
        <Clock size={15} aria-hidden="true" />
        <div className="admit-notice-body">
          <p>{left > 0 ? 'This bed is held for you for 5 minutes' : 'The hold on this bed has run out. You will be asked to choose a bed again.'}</p>
          {left > 0 && <strong className="admit-countdown">{clock(left)} left</strong>}
        </div>
      </div>
      <dl className="admit-facts">
        <dt>Bed</dt>
        <dd>{bed.label}</dd>
        <dt>Floor</dt>
        <dd>
          {floorLabel(bed.floor)} · {bed.wardName}
        </dd>
        <dt>Rate</dt>
        <dd>{formatRate(bed.ratePerDay)}</dd>
        <dt>Expected stay</dt>
        <dd>
          {stayDays} {stayDays === 1 ? 'day' : 'days'} · about {estimate}
        </dd>
        <dt>Doctor</dt>
        <dd>{doctor || 'Not set'}</dd>
        {reason && (
          <>
            <dt>{ruleOverride ? 'Override reason' : 'Reason'}</dt>
            <dd>{reason}</dd>
          </>
        )}
      </dl>
    </div>
  );
};
