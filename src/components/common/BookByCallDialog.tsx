import React, { useEffect, useState } from 'react';
import { PhoneCall, X, CalendarClock } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { callAgentService, BookingCallRequest } from '../../services';
import { errorMessage } from '../../services/api';
import { AgentCall, OfferedSlot } from '../../types';
import { isoDay } from '../../utils/clinicDate';

const APPOINTMENT_TYPES = ['Follow-up', 'Consultation', 'General OPD', 'Teleconsultation', 'Routine Checkup'];

interface Props {
  /** Pre-selected patient; the user can still change it unless a follow-up is attached. */
  uhid?: string;
  visitReason?: string;
  followUpId?: string;
  onClose: () => void;
  /** Receives the request; the caller starts and follows the call (see useCallRunner). */
  onSubmit: (start: () => Promise<AgentCall>) => void;
}

/** Asks the AI agent to phone a patient and book them into one of two free slots. */
export const BookByCallDialog: React.FC<Props> = ({ uhid, visitReason = '', followUpId, onClose, onSubmit }) => {
  const { patients } = useApp();
  const [patientUhid, setPatientUhid] = useState(uhid ?? '');
  const [reason, setReason] = useState(visitReason);
  const [type, setType] = useState('Follow-up');
  const [fromDate, setFromDate] = useState(isoDay());
  const [slots, setSlots] = useState<{ from: string; list: OfferedSlot[] } | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);

  const patient = patients.find((p) => p.uhid === patientUhid);

  useEffect(() => {
    let current = true;
    callAgentService
      .getFreeSlots(fromDate)
      .then((list) => {
        if (!current) return;
        setSlots({ from: fromDate, list });
        setSlotError(null);
      })
      .catch((err) => {
        if (current) setSlotError(errorMessage(err));
      });
    return () => {
      current = false;
    };
  }, [fromDate]);

  const offered = slots?.from === fromDate ? slots.list : null;
  const blocked = !!patient?.doNotCall;
  // Follow-ups can name a UHID with no patient record; the agent needs one to book against.
  const unregistered = !!patientUhid && !patient;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || blocked) return;
    const request: BookingCallRequest = { uhid: patient.uhid, visitReason: reason.trim() || undefined, appointmentType: type, fromDate, followUpId };
    onSubmit(() => callAgentService.bookAppointment(request));
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PhoneCall size={18} color="var(--blue-text)" />
            Book by AI call
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div>
              <label className="form-label" htmlFor="book-patient">Patient *</label>
              <select id="book-patient" required className="form-select" value={patientUhid} disabled={!!followUpId} onChange={(e) => setPatientUhid(e.target.value)}>
                <option value="" disabled>
                  Select a registered patient
                </option>
                {unregistered && (
                  <option value={patientUhid} disabled>
                    {patientUhid} (not registered)
                  </option>
                )}
                {patients.map((p) => (
                  <option key={p.uhid} value={p.uhid}>
                    {p.name} · {p.uhid}
                  </option>
                ))}
              </select>
              {unregistered && (
                <p style={{ marginTop: 6, fontSize: 'var(--fs-sm)', color: 'var(--red-dark)' }}>
                  {patientUhid} is not a registered patient. Register them on the Patients screen before the agent can book.
                </p>
              )}
              {blocked && (
                <p style={{ marginTop: 6, fontSize: 'var(--fs-sm)', color: 'var(--red-dark)' }}>
                  The agent cannot call {patient.name}: {patient.doNotCallReason || 'marked do-not-call'}.
                </p>
              )}
            </div>

            <div>
              <label className="form-label" htmlFor="book-reason">Reason for the visit</label>
              <input
                id="book-reason"
                className="input-field"
                maxLength={120}
                placeholder="e.g. Thyroid review with TSH results"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <p style={{ marginTop: 4, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>The agent says this to the patient, so keep it plain and non-alarming.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" htmlFor="book-type">Appointment type</label>
                <select id="book-type" className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                  {APPOINTMENT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="book-from">Earliest day</label>
                <input id="book-from" type="date" className="input-field" min={isoDay()} value={fromDate} onChange={(e) => e.target.value && setFromDate(e.target.value)} />
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 6 }}>
                <CalendarClock size={14} color="var(--blue-text)" />
                The agent will offer
              </div>
              {slotError ? (
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--red-dark)' }}>{slotError}</p>
              ) : !offered ? (
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Finding free slots…</p>
              ) : offered.length ? (
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 'var(--fs-sm)', lineHeight: 1.7 }}>
                  {offered.map((s) => (
                    <li key={`${s.date} ${s.time}`}>{s.label}</li>
                  ))}
                </ol>
              ) : (
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--red-dark)' }}>No free slots in the next 14 days. Open more sessions in the AI Call Agent settings.</p>
              )}
              <p style={{ marginTop: 6, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                Slots are checked again when the call goes out. If the patient picks one, it is booked and marked confirmed.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!patient || blocked || !offered?.length}>
              <PhoneCall size={15} />
              Call patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
