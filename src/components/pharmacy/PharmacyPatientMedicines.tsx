import React, { useCallback, useEffect, useState } from 'react';
import { Pill, TriangleAlert } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { pharmacyAgentService } from '../../services';
import { errorMessage } from '../../services/api';
import { useCoordinatorStream } from '../../hooks/useCoordinator';
import type { CoordinatorEvent, Patient, PharmacyLineView } from '../../types';
import { displayTime } from '../../utils/clinicDate';
import { LINE_STATUS_LABEL, PRIORITY_LABEL, PRIORITY_TONE, canOrderPharmacy, doseText } from '../../utils/pharmacy';
import { NewMedicineOrderDialog } from './NewMedicineOrderDialog';

type FixedPatient = Pick<Patient, 'id' | 'name' | 'uhid'> & Partial<Pick<Patient, 'age' | 'gender'>>;

interface MedicineOrderFlowProps {
  patient: FixedPatient;
  onClose(): void;
  /** After an order is saved. */
  onOrdered?(): void;
}

/** "Order medicines" for one fixed patient. */
export const MedicineOrderFlow: React.FC<MedicineOrderFlowProps> = ({ patient, onClose, onOrdered }) => (
  <NewMedicineOrderDialog initialPatient={patient} onClose={onClose} onOrdered={() => onOrdered?.()} />
);

const statusTone = (l: PharmacyLineView) => (l.status === 'issued' ? 'green' : l.status === 'query' ? 'orange' : l.status === 'to-check' || l.status === 'approved' ? 'blue' : 'gray');

interface Props {
  patientId: string;
  /** Only lines ordered at or after this time (an ER visit's arrival). */
  since?: string;
  /** Shows Order medicines when the role may order. */
  patient?: FixedPatient;
  title?: string;
}

/** A patient's medicine lines: name, priority, status and red-flag count. Refreshes on Pharmacy events. */
export const PharmacyPatientMedicines: React.FC<Props> = ({ patientId, since, patient, title = 'Medicines' }) => {
  const { user } = useApp();
  const role = user?.role ?? '';
  const [lines, setLines] = useState<PharmacyLineView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [events, setEvents] = useState(0);
  const [manual, setManual] = useState(0);

  const onEvent = useCallback((e: CoordinatorEvent) => {
    if (e.from === 'pharmacy') setEvents((n) => n + 1);
  }, []);
  const { sync } = useCoordinatorStream({ onEvent });
  const version = sync + events + manual;

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(
      () => {
        pharmacyAgentService
          .patientLines(patientId, since)
          .then((list) => {
            if (!alive) return;
            setLines(list);
            setError(null);
          })
          .catch((err) => alive && setError(errorMessage(err)));
      },
      version === 0 ? 0 : 300
    );
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [patientId, since, version]);

  const retry = () => {
    setError(null);
    setManual((n) => n + 1);
  };

  return (
    <section className="er-section" aria-label={title}>
      <div className="er-section-head">
        <h4 className="er-section-title">{title}</h4>
        {patient && canOrderPharmacy(role) && (
          <button type="button" className="btn-secondary btn-sm er-push" onClick={() => setOrdering(true)}>
            <Pill size={13} aria-hidden="true" /> Order medicines
          </button>
        )}
      </div>
      {lines === null ? (
        <p className="er-hint" role={error ? 'alert' : undefined}>
          {error ?? 'Loading medicines…'}
          {error && (
            <>
              {' '}
              <button type="button" className="btn-secondary btn-sm" onClick={retry}>
                Try again
              </button>
            </>
          )}
        </p>
      ) : lines.length === 0 ? (
        <p className="er-hint">No medicines ordered{since ? ' for this visit' : ''}.</p>
      ) : (
        <ul className="lpt-list">
          {lines.map((line) => {
            const live = line.status !== 'cancelled' && line.status !== 'rejected' && line.status !== 'stopped';
            const red = live ? line.flags.filter((f) => f.severity === 'red').length : 0;
            return (
              <li key={line.id} className="lpt-row">
                <span className="lpt-name">
                  {line.productLabel || line.medicineLabel}
                  <span className="er-hint lpt-dose"> {doseText(line)}</span>
                </span>
                <span className="lpt-tags">
                  <span className={`status-pill sm ${PRIORITY_TONE[line.priority]}`}>{PRIORITY_LABEL[line.priority]}</span>
                  <span className={`status-pill sm ${statusTone(line)}`}>{LINE_STATUS_LABEL[line.status]}</span>
                  {red > 0 && (
                    <span className="status-pill sm red">
                      <TriangleAlert size={11} aria-hidden="true" /> {red} red flag{red === 1 ? '' : 's'}
                    </span>
                  )}
                </span>
                {line.status === 'issued' && line.issued && <span className="er-hint lpt-time">Issued {displayTime(new Date(line.issued.at))}</span>}
              </li>
            );
          })}
        </ul>
      )}
      {error && lines !== null && (
        <p className="er-error" role="alert">
          {error}
        </p>
      )}
      {ordering && patient && <MedicineOrderFlow patient={patient} onClose={() => setOrdering(false)} onOrdered={() => setManual((n) => n + 1)} />}
    </section>
  );
};
