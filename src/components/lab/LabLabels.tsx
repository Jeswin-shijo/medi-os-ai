import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { labAgentService } from '../../services';
import { errorMessage } from '../../services/api';
import type { LabSampleLabel } from '../../types';
import { code128, code128Width, CODE128_HEIGHT } from '../../utils/code128';
import { displayDateTime } from '../../utils/clinicDate';
import { PRIORITY_LABEL } from '../../utils/lab';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** One sample label: a barcode, the sample number, the UHID, the tube and the tests. No patient name. */
const Label: React.FC<{ label: LabSampleLabel }> = ({ label }) => (
  <article className="lab-label" aria-label={`Label ${label.sampleNumber}`}>
    <svg className="lab-label-bars" viewBox={`0 0 ${code128Width(label.sampleNumber)} ${CODE128_HEIGHT}`} preserveAspectRatio="none" role="img" aria-label={`Barcode ${label.sampleNumber}`}>
      <path d={code128(label.sampleNumber)} fill="#000" />
    </svg>
    <div className="lab-label-number">{label.sampleNumber}</div>
    <div className="lab-label-row">
      <span>{label.patientUhid}</span>
      <strong>{label.tubeLabel}</strong>
    </div>
    <div className="lab-label-tests">{label.tests.join(', ')}</div>
    <div className="lab-label-row lab-label-foot">
      <span>{label.requestNumber} · {PRIORITY_LABEL[label.priority]}</span>
      <span>{displayDateTime(new Date(label.orderedAt))}</span>
    </div>
  </article>
);

interface LabLabelsProps {
  requestId: string;
  requestNumber: string;
  onClose(): void;
}

/** The print view for a request's sample labels. Print opens the browser's print box; the page itself is hidden while printing. */
export const LabLabels: React.FC<LabLabelsProps> = ({ requestId, requestNumber, onClose }) => {
  const uid = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [labels, setLabels] = useState<LabSampleLabel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opener] = useState(() => document.activeElement as HTMLElement | null);

  useEffect(() => {
    let alive = true;
    labAgentService
      .labels(requestId)
      .then((l) => alive && setLabels(l))
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [requestId]);

  // The print rule hides the rest of the page only while the label sheet is mounted.
  useEffect(() => {
    document.body.classList.add('lab-printing');
    return () => document.body.classList.remove('lab-printing');
  }, []);

  useEffect(() => {
    boxRef.current?.querySelector<HTMLElement>('button.btn-primary, button')?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, [opener, labels]);

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

  const titleId = `${uid}-title`;
  return createPortal(
    <div className="modal-overlay lab-print-root" onClick={onClose}>
      <div ref={boxRef} className="modal-content-box admit-dialog lab-labels-box" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header lab-no-print">
          <h3 id={titleId} className="admit-title">
            <Printer size={18} color="var(--blue-text)" aria-hidden="true" />
            Labels for {requestNumber}
          </h3>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body admit-body">
          {error ? (
            <p className="er-error" role="alert">{error}</p>
          ) : !labels ? (
            <p className="data-empty">Loading the labels…</p>
          ) : labels.length === 0 ? (
            <p className="data-empty">There are no samples to label for this request.</p>
          ) : (
            <>
              <p className="er-hint lab-no-print">{labels.length} {labels.length === 1 ? 'label' : 'labels'}, one for each tube. Stick each on its tube before collecting.</p>
              <div className="lab-label-sheet">
                {labels.map((l) => (
                  <Label key={l.sampleNumber} label={l} />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer lab-no-print">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn-primary" disabled={!labels || labels.length === 0} onClick={() => window.print()}>
            <Printer size={15} aria-hidden="true" />
            Print
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
