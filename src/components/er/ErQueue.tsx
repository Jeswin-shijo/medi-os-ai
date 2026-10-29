import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ErVisit, TriageColour } from '../../types';
import { displayTime } from '../../utils/clinicDate';
import { tableMin } from '../../utils/layout';
import { COLOUR_LABEL, STATUS_LABEL, TRIAGE_COLOURS, boardOrder, nextDeadline } from '../../utils/er';

type Filter = 'all' | TriageColour;
const FILTERS: { id: Filter; label: string }[] = [{ id: 'all', label: 'All' }, ...TRIAGE_COLOURS.map((c) => ({ id: c as Filter, label: COLOUR_LABEL[c] }))];

interface ErQueueProps {
  /** null while the board loads. */
  visits: ErVisit[] | null;
  error: string | null;
  /** Shown with the error when the first load failed. */
  onRetry(): void;
  complaintLabels: Record<string, string>;
  selectedId: string | null;
  onSelect(visit: ErVisit): void;
  expectedCount: number;
}

const ageSex = (visit: ErVisit): string => {
  const sex = visit.patientGender ? visit.patientGender[0].toUpperCase() : '';
  if (visit.patientAge === null && !sex) return '—';
  return `${visit.patientAge ?? '?'} ${sex}`.trim();
};

/** The people in the ER, most urgent first: untriaged, then red to green, then by arrival. */
export const ErQueue: React.FC<ErQueueProps> = ({ visits, error, onRetry, complaintLabels, selectedId, onSelect, expectedCount }) => {
  const [filter, setFilter] = useState<Filter>('all');
  // Deadlines pass with the clock, not only with data: re-check every 30 seconds.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const sorted = useMemo(() => (visits ? [...visits].sort(boardOrder) : []), [visits]);
  const shown = filter === 'all' ? sorted : sorted.filter((v) => v.colour === filter);
  const countOf = (f: Filter) => (f === 'all' ? sorted.length : sorted.filter((v) => v.colour === f).length);

  return (
    <section className="medios-card bagent-card er-queue" aria-label="ER queue">
      <div className="card-header-row">
        <div className="bagent-title-group">
          <h3 className="card-title">ER queue</h3>
          <span className="bagent-hint">
            {visits ? `${visits.length} in the ER` : ''}
            {expectedCount > 0 ? `${visits ? ' · ' : ''}${expectedCount} on the way` : ''}
          </span>
        </div>
      </div>
      <div className="bagent-filters" role="group" aria-label="Filter by triage colour">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={`chip-btn${filter === f.id ? ' active' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.id !== 'all' && <span className={`tri-dot ${f.id}`} aria-hidden="true" />}
            {f.label} {visits ? countOf(f.id) : ''}
          </button>
        ))}
      </div>
      {!visits ? (
        error ? (
          <p className="data-empty" role="alert">
            {error} <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>Try again</button>
          </p>
        ) : (
          <p className="data-empty">Loading the ER queue…</p>
        )
      ) : shown.length === 0 ? (
        <p className="data-empty">{sorted.length ? 'Nobody in the ER at this colour.' : 'Nobody is in the ER. New arrivals show up here.'}</p>
      ) : (
        <div className="table-scroll" style={tableMin(560)}>
          <table className="data-table er-table">
            <thead>
              <tr>
                <th scope="col">Patient</th>
                <th scope="col">Complaint</th>
                <th scope="col">Triage</th>
                <th scope="col">Status</th>
                <th scope="col">Bay</th>
                <th scope="col">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((v) => {
                const next = nextDeadline(v, now);
                const late = v.overdue;
                const selected = v.id === selectedId;
                return (
                  <tr key={v.id} className={`er-row${selected ? ' selected' : ''}${late ? ' is-late' : ''}`} onClick={() => onSelect(v)}>
                    <td>
                      <button type="button" className="er-select" aria-pressed={selected} onClick={(e) => { e.stopPropagation(); onSelect(v); }}>
                        <span className="er-name">{v.patientName}</span>
                        {v.detailsPending && <span className="status-pill sm gray er-pending">Details pending</span>}
                        <span className="er-sub">
                          {displayTime(new Date(v.arrivedAt))}
                          {ageSex(v) !== '—' ? ` · ${ageSex(v)}` : ''}
                          {!v.detailsPending ? ` · ${v.patientUhid}` : ''}
                        </span>
                      </button>
                    </td>
                    <td className="er-complaint">{v.complaintText || complaintLabels[v.complaint] || v.complaint}</td>
                    <td>
                      {v.colour ? <span className={`tri-pill ${v.colour}`}>{COLOUR_LABEL[v.colour]}</span> : <span className="tri-pill none">Not triaged</span>}
                    </td>
                    <td>{STATUS_LABEL[v.status]}</td>
                    <td>{v.bayName ?? '—'}</td>
                    <td>
                      {late || next ? (
                        <span className={next && next.minutes >= 0 && !late ? 'er-left' : 'er-late'} data-tip={next?.label || 'Past the time target'}>
                          {late && <AlertTriangle size={13} aria-hidden="true" />}
                          {next ? (next.minutes < 0 ? `${-next.minutes} min late` : `${next.minutes} min left`) : 'Late'}
                        </span>
                      ) : (
                        <span className="er-ok">—</span>
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
  );
};
