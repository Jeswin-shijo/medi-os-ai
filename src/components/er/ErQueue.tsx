import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ErVisit, Patient, TriageColour } from '../../types';
import { displayTime } from '../../utils/clinicDate';
import { tableMin } from '../../utils/layout';
import { COLOUR_LABEL, STATUS_LABEL, TRIAGE_COLOURS, boardOrder, isPlaceholderName, overdueMinutes, placeholderGender } from '../../utils/er';

type Filter = 'all' | TriageColour;
const FILTERS: { id: Filter; label: string }[] = [{ id: 'all', label: 'All' }, ...TRIAGE_COLOURS.map((c) => ({ id: c as Filter, label: COLOUR_LABEL[c] }))];

interface ErQueueProps {
  /** null while the board loads. */
  visits: ErVisit[] | null;
  error: string | null;
  /** Doctor target in minutes per colour, from the overview. */
  doctorTargets: Partial<Record<TriageColour, number>>;
  complaintLabels: Record<string, string>;
  patients: Patient[];
  selectedId: string | null;
  onSelect(visit: ErVisit): void;
  expectedCount: number;
}

const ageSex = (visit: ErVisit, patient: Patient | undefined): string => {
  if (patient) return `${patient.age} ${patient.gender === 'Male' ? 'M' : patient.gender === 'Female' ? 'F' : 'O'}`;
  const g = placeholderGender(visit.patientName);
  return g ? g[0] : '—';
};

/** The people in the ER, most urgent first: untriaged, then red to green, then by arrival. */
export const ErQueue: React.FC<ErQueueProps> = ({ visits, error, doctorTargets, complaintLabels, patients, selectedId, onSelect, expectedCount }) => {
  const [filter, setFilter] = useState<Filter>('all');
  // Deadlines pass with the clock, not only with data: re-check every 30 seconds.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const sorted = useMemo(() => (visits ? [...visits].sort(boardOrder) : []), [visits]);
  const patientById = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
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
        <p className="data-empty" role={error ? 'alert' : undefined}>
          {error ?? 'Loading the ER queue…'}
        </p>
      ) : shown.length === 0 ? (
        <p className="data-empty">{sorted.length ? 'Nobody in the ER at this colour.' : 'Nobody is in the ER. New arrivals show up here.'}</p>
      ) : (
        <div className="table-scroll" style={tableMin(760)}>
          <table className="data-table er-table">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Patient</th>
                <th scope="col">Age/sex</th>
                <th scope="col">Complaint</th>
                <th scope="col">Triage</th>
                <th scope="col">Status</th>
                <th scope="col">Bay</th>
                <th scope="col">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((v) => {
                const late = overdueMinutes(v, doctorTargets, now);
                const placeholder = isPlaceholderName(v.patientName);
                const selected = v.id === selectedId;
                return (
                  <tr key={v.id} className={`er-row${selected ? ' selected' : ''}${late !== null ? ' is-late' : ''}`} onClick={() => onSelect(v)}>
                    <td className="er-time">{displayTime(new Date(v.arrivedAt))}</td>
                    <td>
                      <button type="button" className="er-select" aria-pressed={selected} onClick={(e) => { e.stopPropagation(); onSelect(v); }}>
                        <span className="er-name">{v.patientName}</span>
                        {placeholder && <span className="status-pill sm gray er-pending">Details pending</span>}
                        {!placeholder && <span className="er-sub">{v.patientUhid}</span>}
                      </button>
                    </td>
                    <td>{ageSex(v, patientById.get(v.patientId))}</td>
                    <td className="er-complaint">{v.complaintText || complaintLabels[v.complaint] || v.complaint}</td>
                    <td>
                      {v.colour ? <span className={`tri-pill ${v.colour}`}>{COLOUR_LABEL[v.colour]}</span> : <span className="tri-pill none">Not triaged</span>}
                    </td>
                    <td>{STATUS_LABEL[v.status]}</td>
                    <td>{v.bayName ?? '—'}</td>
                    <td>
                      {late !== null ? (
                        <span className="er-late" data-tip="Past the time target for this step">
                          <AlertTriangle size={13} aria-hidden="true" />
                          {late} min late
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
