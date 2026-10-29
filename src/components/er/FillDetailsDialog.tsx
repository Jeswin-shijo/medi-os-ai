import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserPen, X } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { patientService } from '../../services';
import type { ErVisit, Patient } from '../../types';
import { indianMobile } from '../../utils/er';
import { useErAction } from './useErAction';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface FillDetailsDialogProps {
  visit: ErVisit;
  onClose(): void;
  /** The details were saved: reload the board. */
  onSaved(): void;
}

/** Fill in the details of an emergency placeholder patient: name and phone are needed, the rest is optional. */
export const FillDetailsDialog: React.FC<FillDetailsDialogProps> = ({ visit, onClose, onSaved }) => {
  const { refreshPatients, showToast } = useApp();
  const uid = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const { busy, error, setError, run } = useErAction();
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState(visit.patientAge === null ? '' : String(visit.patientAge));
  const [gender, setGender] = useState<Patient['gender']>(visit.patientGender === 'Female' || visit.patientGender === 'Other' ? visit.patientGender : 'Male');
  const [address, setAddress] = useState('');
  // No closing while saving: the form stays until the answer is in.
  const closeGuard = useRef(onClose);
  useEffect(() => {
    closeGuard.current = () => {
      if (busy === null) onClose();
    };
  });

  useEffect(() => {
    boxRef.current?.querySelector<HTMLElement>('input')?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, [opener]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const box = boxRef.current;
      if (!box || e.defaultPrevented) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeGuard.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const at = document.activeElement;
      if (!box.contains(at) || (e.shiftKey ? at === first || at === box : at === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const mobile = indianMobile(phone);
  const phoneProblem = phone.trim() !== '' && !mobile;
  const ageNumber = Number(age);
  const ageProblem = age.trim() !== '' && !(Number.isInteger(ageNumber) && ageNumber >= 0 && ageNumber <= 130);
  const ready = name.trim().length >= 2 && !!mobile && !ageProblem;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || !mobile) return;
    const saved = await run('details', () =>
      patientService.updatePatient(visit.patientId, {
        name: name.trim(),
        phone: `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`,
        gender,
        ...(age.trim() !== '' && { age: ageNumber }),
        ...(address.trim() && ({ address: address.trim() } as Partial<Patient>))
      })
    );
    if (!saved) return;
    await refreshPatients().catch(() => undefined);
    showToast(`Details saved for ${visit.number}`);
    onSaved();
    onClose();
  };

  const titleId = `${uid}-title`;
  return createPortal(
    <div className="modal-overlay" onClick={() => closeGuard.current()}>
      <div ref={boxRef} className="modal-content-box admit-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id={titleId} className="admit-title">
            <UserPen size={18} color="var(--blue-text)" aria-hidden="true" />
            Fill in details
          </h3>
          <button type="button" onClick={() => closeGuard.current()} disabled={busy !== null} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={(e) => void submit(e)}>
          <div className="modal-body admit-body">
            <p className="er-hint">For {visit.number}. Name and phone are needed; the rest is optional.</p>
            <div>
              <label className="form-label" htmlFor={`${uid}-name`}>Full name *</label>
              <input id={`${uid}-name`} className="input-field" autoComplete="off" maxLength={100} value={name} onChange={(e) => { setError(null); setName(e.target.value); }} />
            </div>
            <div>
              <label className="form-label" htmlFor={`${uid}-phone`}>Phone *</label>
              <input
                id={`${uid}-phone`}
                className="input-field"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="98765 43210"
                maxLength={20}
                value={phone}
                aria-invalid={phoneProblem}
                aria-describedby={phoneProblem ? `${uid}-phone-err` : undefined}
                onChange={(e) => { setError(null); setPhone(e.target.value); }}
              />
              {phoneProblem && <p id={`${uid}-phone-err`} className="er-field-error">A 10-digit mobile number, starting with 6 to 9.</p>}
            </div>
            <div className="cols-2" style={{ gap: 12 }}>
              <div>
                <label className="form-label" htmlFor={`${uid}-age`}>Age</label>
                <input id={`${uid}-age`} className="input-field" type="number" inputMode="numeric" min={0} max={130} step={1} value={age} aria-invalid={ageProblem} onChange={(e) => setAge(e.target.value)} />
                {ageProblem && <p className="er-field-error">0 to 130</p>}
              </div>
              <div>
                <label className="form-label" htmlFor={`${uid}-sex`}>Sex</label>
                <select id={`${uid}-sex`} className="form-select" value={gender} onChange={(e) => setGender(e.target.value as Patient['gender'])}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor={`${uid}-address`}>Address (optional)</label>
              <input id={`${uid}-address`} className="input-field" autoComplete="off" maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
          {error && (
            <p className="admit-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => closeGuard.current()} disabled={busy !== null}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!ready || busy !== null}>
              {busy ? 'Saving…' : 'Save details'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
