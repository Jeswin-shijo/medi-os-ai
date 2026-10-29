import React, { useCallback, useEffect, useState } from 'react';
import { FlaskConical, TriangleAlert } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { labAgentService } from '../../services';
import { errorMessage } from '../../services/api';
import { useCoordinatorStream } from '../../hooks/useCoordinator';
import type { CoordinatorEvent, LabLineView, LabRequestView, Patient } from '../../types';
import { displayTime } from '../../utils/clinicDate';
import { LINE_STATUS_LABEL, PRIORITY_LABEL, PRIORITY_TONE, canCollectLab, canOrderLab } from '../../utils/lab';
import { LabLabels } from './LabLabels';
import { NewLabOrderDialog } from './NewLabOrderDialog';

type FixedPatient = Pick<Patient, 'id' | 'name' | 'uhid'> & Partial<Pick<Patient, 'age' | 'gender'>>;

interface LabOrderFlowProps {
  patient: FixedPatient;
  role: string;
  onClose(): void;
  /** After an order is saved. */
  onOrdered?(): void;
}

/** "Order tests" for one fixed patient: the order dialog, then the label print view when asked for. */
export const LabOrderFlow: React.FC<LabOrderFlowProps> = ({ patient, role, onClose, onOrdered }) => {
  const [printing, setPrinting] = useState<{ id: string; number: string } | null>(null);
  return (
    <>
      {!printing && (
        <NewLabOrderDialog
          initialPatient={patient}
          canPrint={canCollectLab(role)}
          onClose={onClose}
          onOrdered={() => onOrdered?.()}
          onPrint={(r) => setPrinting({ id: r.id, number: r.number })}
        />
      )}
      {printing && <LabLabels requestId={printing.id} requestNumber={printing.number} onClose={onClose} />}
    </>
  );
};

interface Row {
  line: LabLineView;
  request: LabRequestView;
}

interface LabPatientTestsProps {
  patientId: string;
  /** Only lines ordered at or after this time (an ER visit's arrival). */
  since?: string;
  /** Show Order tests (the role may order). */
  patient?: FixedPatient;
  /** Hide the title when the parent already has one. */
  title?: string;
}

/** A patient's lab lines: label, priority, status, a critical badge and the release time. Refreshes on Lab events. */
export const LabPatientTests: React.FC<LabPatientTestsProps> = ({ patientId, since, patient, title = 'Tests' }) => {
  const { user } = useApp();
  const role = user?.role ?? '';
  const [requests, setRequests] = useState<LabRequestView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [labEvents, setLabEvents] = useState(0);
  const [manual, setManual] = useState(0);

  const onEvent = useCallback((e: CoordinatorEvent) => {
    if (e.from === 'lab') setLabEvents((n) => n + 1);
  }, []);
  const { sync } = useCoordinatorStream({ onEvent });
  const version = sync + labEvents + manual;

  useEffect(() => {
    let alive = true;
    // A burst of events costs one request; the first load is immediate.
    const timer = window.setTimeout(
      () => {
        labAgentService
          .patientRequests(patientId)
          .then((list) => {
            if (!alive) return;
            setRequests(list);
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
  }, [patientId, version]);

  const sinceMs = since ? new Date(since).getTime() : null;
  const rows: Row[] = (requests ?? [])
    .filter((r) => sinceMs === null || new Date(r.orderedAt).getTime() >= sinceMs)
    .flatMap((request) => request.lines.map((line) => ({ line, request })));

  return (
    <section className="er-section" aria-label={title}>
      <div className="er-section-head">
        <h4 className="er-section-title">{title}</h4>
        {patient && canOrderLab(role) && (
          <button type="button" className="btn-secondary btn-sm er-push" onClick={() => setOrdering(true)}>
            <FlaskConical size={13} aria-hidden="true" /> Order tests
          </button>
        )}
      </div>
      {requests === null ? (
        <p className="er-hint" role={error ? 'alert' : undefined}>
          {error ?? 'Loading tests…'}
        </p>
      ) : rows.length === 0 ? (
        <p className="er-hint">No tests ordered{since ? ' for this visit' : ''}.</p>
      ) : (
        <ul className="lpt-list">
          {rows.map(({ line, request }) => {
            const critical = line.critical?.active && line.status !== 'cancelled';
            return (
              <li key={line.id} className="lpt-row">
                <span className="lpt-name">{line.label}</span>
                <span className="lpt-tags">
                  <span className={`status-pill sm ${PRIORITY_TONE[request.priority]}`}>{PRIORITY_LABEL[request.priority]}</span>
                  <span className={`status-pill sm ${line.status === 'released' ? 'green' : line.status === 'cancelled' ? 'gray' : 'blue'}`}>{LINE_STATUS_LABEL[line.status]}</span>
                  {critical && (
                    <span className="status-pill sm red">
                      <TriangleAlert size={11} aria-hidden="true" /> Critical
                    </span>
                  )}
                </span>
                {line.status === 'released' && line.releasedAt && <span className="er-hint lpt-time">Released {displayTime(new Date(line.releasedAt))}</span>}
              </li>
            );
          })}
        </ul>
      )}
      {error && requests !== null && (
        <p className="er-error" role="alert">
          {error}
        </p>
      )}
      {ordering && patient && <LabOrderFlow patient={patient} role={role} onClose={() => setOrdering(false)} onOrdered={() => setManual((n) => n + 1)} />}
    </section>
  );
};
