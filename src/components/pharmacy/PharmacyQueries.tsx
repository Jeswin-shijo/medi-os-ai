import React, { useMemo, useState } from 'react';
import { useNow } from '../../hooks/useNow';
import type { PharmacyLineView } from '../../types';
import { displayDateTime } from '../../utils/clinicDate';
import { tableMin } from '../../utils/layout';
import { PRIORITY_LABEL, PRIORITY_TONE, QUERY_KIND_LABEL, doseText, dueText, hasOpenQuery } from '../../utils/pharmacy';
import { QueryAnswerDialog } from './QueryAnswerDialog';

const OUTCOME_TEXT: Record<string, string> = {
  change: 'Changed',
  keep: 'Kept',
  cancel: 'Cancelled',
  stop: 'Stopped',
  switch: 'Switched',
  wait: 'Waiting for stock'
};

interface PharmacyQueriesProps {
  lines: PharmacyLineView[] | null;
  error: string | null;
  canAnswer: boolean;
  onRetry(): void;
  /** After an answer: the lists and the header bell reload. */
  onChanged(): void;
}

/** The Queries tab: questions waiting for a doctor, then those answered in the last 24 hours. */
export const PharmacyQueries: React.FC<PharmacyQueriesProps> = ({ lines, error, canAnswer, onRetry, onChanged }) => {
  const now = useNow();
  const [answering, setAnswering] = useState<string | null>(null);
  const { open, answered } = useMemo(() => ({ open: (lines ?? []).filter(hasOpenQuery), answered: (lines ?? []).filter((l) => l.query?.answer) }), [lines]);

  return (
    <div className="bagent-overview lab-body">
      <section className="medios-card bagent-card lab-card" aria-label="Open queries">
        <div className="card-header-row">
          <div className="bagent-title-group">
            <h3 className="card-title">Open queries</h3>
            <span className="bagent-hint">{lines ? `${open.length} waiting for a doctor` : ''}</span>
          </div>
        </div>
        {!canAnswer && <p className="er-hint lab-readonly">You can see the questions. The ordering doctor answers them.</p>}
        {!lines ? (
          error ? (
            <p className="data-empty" role="alert">
              {error}{' '}
              <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>
                Try again
              </button>
            </p>
          ) : (
            <p className="data-empty">Loading the queries…</p>
          )
        ) : open.length === 0 ? (
          <p className="data-empty">No query is waiting for an answer.</p>
        ) : (
          <div className="table-scroll" style={tableMin(620)}>
            <table className="data-table lab-table">
              <thead>
                <tr>
                  <th scope="col">About</th>
                  <th scope="col">Medicine</th>
                  <th scope="col">Patient</th>
                  <th scope="col">Time left</th>
                  <th scope="col">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {open.map((l) => {
                  const q = l.query!;
                  const left = dueText(q.dueAt, now);
                  return (
                    <tr key={l.id} className={left?.late ? 'is-late' : undefined}>
                      <td>
                        <span className={`status-pill sm ${q.kind === 'stock' ? 'blue' : 'orange'}`}>{QUERY_KIND_LABEL[q.kind] ?? q.kind}</span>
                        <span className="er-sub lab-block ph-q-text">{q.question}</span>
                      </td>
                      <td>
                        <span className="er-name">{l.productLabel || l.medicineLabel}</span>
                        <span className="er-sub lab-block">
                          {doseText(l)} · {l.orderNumber}{' '}
                          <span className={`status-pill sm ${PRIORITY_TONE[l.priority]}`}>{PRIORITY_LABEL[l.priority]}</span>
                        </span>
                      </td>
                      <td>
                        <span className="er-name">{l.patient.name}</span>
                        <span className="er-sub lab-block">{l.patient.uhid}</span>
                        <span className="er-sub lab-block">Ordered by {l.orderedBy.name}</span>
                      </td>
                      <td className={left?.late ? 'ph-due is-late' : undefined}>{left?.text ?? '—'}</td>
                      <td>
                        {canAnswer && (
                          <button type="button" className="btn-primary btn-sm" aria-label={`Answer the query about ${l.productLabel || l.medicineLabel} for ${l.patient.name}`} onClick={() => setAnswering(l.id)}>
                            Answer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {lines && (
        <section className="medios-card bagent-card lab-card" aria-label="Answered in the last 24 hours">
          <div className="card-header-row">
            <div className="bagent-title-group">
              <h3 className="card-title">Answered in the last 24 hours</h3>
              <span className="bagent-hint">{answered.length}</span>
            </div>
          </div>
          {answered.length === 0 ? (
            <p className="data-empty">Nothing was answered in the last 24 hours.</p>
          ) : (
            <div className="table-scroll" style={tableMin(680)}>
              <table className="data-table lab-table">
                <thead>
                  <tr>
                    <th scope="col">About</th>
                    <th scope="col">Medicine</th>
                    <th scope="col">Patient</th>
                    <th scope="col">Answer</th>
                    <th scope="col">Answered</th>
                  </tr>
                </thead>
                <tbody>
                  {answered.map((l) => {
                    const a = l.query!.answer!;
                    return (
                      <tr key={`${l.id}:${l.query!.seq}`}>
                        <td>{QUERY_KIND_LABEL[l.query!.kind] ?? l.query!.kind}</td>
                        <td>
                          <span className="er-name">{l.productLabel || l.medicineLabel}</span>
                          <span className="er-sub lab-block">{doseText(l)} · {l.orderNumber}</span>
                        </td>
                        <td>
                          <span className="er-name">{l.patient.name}</span>
                          <span className="er-sub lab-block">{l.patient.uhid}</span>
                        </td>
                        <td>
                          <span className="status-pill sm green">{OUTCOME_TEXT[a.outcome] ?? a.outcome}</span>
                          <span className="er-sub lab-block ph-q-text">
                            {a.by.name}
                            {a.reason ? `: ${a.reason}` : ''}
                          </span>
                        </td>
                        <td className="lab-time">{displayDateTime(new Date(a.at))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {answering && <QueryAnswerDialog lineId={answering} onClose={() => setAnswering(null)} onDone={onChanged} />}
    </div>
  );
};
