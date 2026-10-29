import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BedDouble, X } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { bedRequestService } from '../../services';
import { errorMessage } from '../../services/api';
import type { BedAdmission, BedRequest, BedRequestPriority, Need, Patient, RoomClass } from '../../types';
import { PRIORITY_OPTIONS, defaultRoomClass, offersEmergency } from '../../utils/beds';
import { AdmitStepNeeds, type AdmitForm } from './AdmitStepNeeds';

interface RequestBedDialogProps {
  /** Request a bed for this patient (the patient field is then fixed). */
  patient?: Patient;
  /** Pre-select this patient but leave the patient field changeable (used by the Coordinator's Ask box). */
  initialPatient?: { id: string; uhid: string };
  /** Move an admitted patient out of this bed: pre-filled from the admission. */
  transferFrom?: { bedId: string; admission: BedAdmission };
  onClose(): void;
  /** Called once the request is sent; the Bed Agent takes it from there. */
  onSubmitted(request: BedRequest): void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** One short form: who, the needs and a priority. The Bed Agent picks the bed, with no one to approve it. */
export const RequestBedDialog: React.FC<RequestBedDialogProps> = ({ patient, initialPatient, transferFrom, onClose, onSubmitted }) => {
  const { patients } = useApp();
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const moving = transferFrom?.admission;
  const [form, setForm] = useState<AdmitForm>(() =>
    moving
      ? {
          patientId: moving.patient.id,
          doctor: moving.doctor,
          department: moving.department,
          roomClass: moving.roomClass,
          needs: [...moving.needs],
          notes: moving.notes,
          stay: String(moving.expectedStayDays)
        }
      : (() => {
          const start = patient ?? (initialPatient ? (patients.find((p) => p.id === initialPatient.id) ?? patients.find((p) => p.uhid === initialPatient.uhid)) : undefined);
          return { patientId: start?.id ?? initialPatient?.id ?? '', doctor: start?.doctor ?? '', department: start?.department ?? '', roomClass: null, needs: [], notes: '', stay: '3' };
        })()
  );
  const [priority, setPriority] = useState<BedRequestPriority>('medium');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The control that opened the dialog, read during the first render: before autoFocus moves focus into the dialog. */
  const [opener] = useState(() => document.activeElement as HTMLElement | null);

  const selected = patient ?? patients.find((p) => p.id === form.patientId);
  const age = moving?.patient.age ?? selected?.age;
  const roomClass: RoomClass =
    form.roomClass && (form.roomClass !== 'emergency' || offersEmergency(form.department)) ? form.roomClass : defaultRoomClass(age, form.needs as Need[]);

  useEffect(() => {
    const box = boxRef.current;
    if (box && !box.contains(document.activeElement)) (bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? box).focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, [opener]);

  // Esc closes; Tab cycles inside the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const box = boxRef.current;
      if (!box || e.defaultPrevented) return;
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
      const at = document.activeElement;
      if (!box.contains(at) || (e.shiftKey ? at === first || at === box : at === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const change = (patch: Partial<AdmitForm>) => {
    setError(null);
    setForm((f) => ({ ...f, ...patch }));
  };
  const pickPatient = (p: Patient) => change({ patientId: p.id, doctor: p.doctor, department: p.department, roomClass: null });

  const fixedPatient = moving
    ? { name: moving.patient.name, detail: `${moving.patient.uhid} · ${moving.patient.age} yrs · ${moving.patient.gender}` }
    : patient
      ? { name: patient.name, detail: `${patient.uhid} · ${patient.age} yrs · ${patient.gender}` }
      : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!form.patientId) return setError('Choose a patient first.');
    setBusy(true);
    setError(null);
    try {
      const request = await bedRequestService.create({
        type: transferFrom ? 'transfer' : 'admission',
        ...(transferFrom && { fromBedId: transferFrom.bedId }),
        patientId: form.patientId,
        roomClass,
        needs: form.needs,
        department: form.department.trim(),
        doctor: form.doctor.trim(),
        expectedStayDays: Number(form.stay),
        notes: form.notes,
        priority
      });
      onSubmitted(request);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div ref={boxRef} className="modal-content-box admit-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id={titleId} className="admit-title">
            <BedDouble size={18} color="var(--blue-text)" aria-hidden="true" />
            {transferFrom ? 'Transfer patient' : 'Admit patient'}
          </h3>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={(e) => void submit(e)}>
          <div ref={bodyRef} className="modal-body admit-body" tabIndex={-1}>
            <AdmitStepNeeds form={form} onChange={change} roomClass={roomClass} fixedPatient={fixedPatient} patients={patients} onPickPatient={pickPatient} />
            <fieldset className="admit-fieldset">
              <legend className="form-label">Priority</legend>
              <div className="admit-options">
                {PRIORITY_OPTIONS.map((o) => (
                  <label key={o.value} className={`admit-option${priority === o.value ? ' is-on' : ''}`}>
                    <input type="radio" name="request-priority" value={o.value} checked={priority === o.value} onChange={() => setPriority(o.value)} />
                    {o.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="admit-hint">The Bed Agent picks the best free bed and assigns it. No one needs to approve.</p>
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
              {busy ? 'Sending…' : 'Find a bed'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
