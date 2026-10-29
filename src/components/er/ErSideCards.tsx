import React, { useEffect, useState } from 'react';
import { bedService, coordinatorService, erService } from '../../services';
import { errorMessage } from '../../services/api';
import type { AgentMessage, DutyTitle, ErBay, ErBayKind, ErOverview, TypeRow } from '../../types';
import { displayTime } from '../../utils/clinicDate';
import { MeterBar } from '../beds/charts/MeterBar';

const EVENT_LIMIT = 8;

/** Loads on mount and again whenever `refreshKey` changes; the last good answer stays on screen if a reload fails. */
function useLoaded<T>(load: () => Promise<T>, refreshKey: number): { data: T | null; error: string | null } {
  const [state, setState] = useState<{ data: T | null; error: string | null }>({ data: null, error: null });
  useEffect(() => {
    let alive = true;
    load()
      .then((data) => alive && setState({ data, error: null }))
      .catch((err) => alive && setState((s) => ({ ...s, error: errorMessage(err) })));
    return () => {
      alive = false;
    };
  }, [load, refreshKey]);
  return state;
}

const Failed: React.FC<{ error: string }> = ({ error }) => (
  <p className="data-empty" role="alert">
    {error}
  </p>
);

const BAY_ROWS: { kind: ErBayKind; label: string }[] = [
  { kind: 'resus', label: 'Resus' },
  { kind: 'bay', label: 'Bays' },
  { kind: 'stretcher', label: 'Stretchers' }
];
const loadCapacity = () => Promise.all([erService.bays(), bedService.overview()]);

/** Bays, resus and stretchers in use, and the free ICU and HDU beds. */
export const ErCapacityCard: React.FC<{ refreshKey: number }> = ({ refreshKey }) => {
  const { data, error } = useLoaded(loadCapacity, refreshKey);
  const bays: ErBay[] = data?.[0] ?? [];
  const units: TypeRow[] = data?.[1].byType ?? [];
  const unit = (type: 'icu' | 'hdu') => units.find((u) => u.type === type);

  return (
    <section className="medios-card bagent-card er-side" aria-label="ER capacity">
      <div className="card-header-row">
        <h3 className="card-title">ER capacity</h3>
      </div>
      {!data ? (
        error ? <Failed error={error} /> : <p className="data-empty">Loading capacity…</p>
      ) : (
        <>
          {error && <Failed error={`Showing the last figures loaded. ${error}`} />}
          <ul className="er-cap">
            {BAY_ROWS.map(({ kind, label }) => {
              const usable = bays.filter((b) => b.kind === kind && !b.outOfUse);
              const used = usable.filter((b) => b.visitId !== null).length;
              return (
                <li key={kind} className="er-cap-row">
                  <span className="er-cap-label">{label}</span>
                  <span className="er-cap-count">
                    {used} of {usable.length} in use
                  </span>
                  <MeterBar value={used} max={usable.length} label={`${label}: ${used} of ${usable.length} in use`} />
                </li>
              );
            })}
            {(['icu', 'hdu'] as const).map((type) => {
              const u = unit(type);
              return (
                <li key={type} className="er-cap-row">
                  <span className="er-cap-label">{type.toUpperCase()} beds</span>
                  <span className="er-cap-count">{u ? `${u.free} free of ${u.total}` : '—'}</span>
                  {u && <MeterBar value={u.total - u.free} max={u.total} label={`${type.toUpperCase()}: ${u.free} free of ${u.total}`} />}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
};

const ON_DUTY = [
  { key: 'er-nurse-in-charge', label: 'ER nurse in charge' },
  { key: 'er-consultant', label: 'ER consultant' }
];
const loadDuty = () => coordinatorService.titles();

/** Who holds the ER duty titles: the names come with the titles, so every ER role sees them. */
export const ErStaffCard: React.FC<{ refreshKey: number }> = ({ refreshKey }) => {
  const { data: titles, error } = useLoaded<DutyTitle[]>(loadDuty, refreshKey);
  return (
    <section className="medios-card bagent-card er-side" aria-label="Staff on duty">
      <div className="card-header-row">
        <h3 className="card-title">Staff on duty</h3>
      </div>
      {!titles ? (
        error ? <Failed error={error} /> : <p className="data-empty">Loading…</p>
      ) : (
        <ul className="er-duty">
          {ON_DUTY.map(({ key, label }) => {
            const title = titles.find((t) => t.key === key);
            const names = title?.holderNames ?? [];
            return (
              <li key={key} className="er-duty-row">
                <span className="er-cap-label">{title?.label ?? label}</span>
                {names.length ? <span className="er-duty-who">{names.join(', ')}</span> : <span className="er-hint">Nobody assigned — alerts go to admins</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

const loadEvents = () => coordinatorService.messages({ agent: 'er', sort: 'recent', limit: EVENT_LIMIT });

/** The latest Coordinator messages to or from the ER, newest first. */
export const ErEventsCard: React.FC<{ refreshKey: number }> = ({ refreshKey }) => {
  const { data, error } = useLoaded<AgentMessage[]>(loadEvents, refreshKey);
  return (
    <section className="medios-card bagent-card er-side" aria-label="Recent ER events">
      <div className="card-header-row">
        <h3 className="card-title">Recent ER events</h3>
      </div>
      {!data ? (
        error ? <Failed error={error} /> : <p className="data-empty">Loading events…</p>
      ) : data.length === 0 ? (
        <p className="data-empty">Nothing yet. Messages between the ER and other agents show here.</p>
      ) : (
        <ul className="er-events">
          {data.slice(0, EVENT_LIMIT).map((m) => (
            <li key={m.id} className="er-event">
              <span className="er-event-text">{m.summary}</span>
              <span className="er-hint er-time">{displayTime(new Date(m.createdAt))}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const minutes = (n: number | null) => (n === null ? '—' : `${n} min`);

/** Today's triage time, on-time rate, stay, and arrivals by hour. */
export const ErPerformanceCard: React.FC<{ performance: ErOverview['performance'] | undefined }> = ({ performance }) => {
  const hours = performance?.arrivalsByHour ?? [];
  const peak = Math.max(1, ...hours);
  const total = hours.reduce((a, b) => a + b, 0);
  return (
    <section className="medios-card bagent-card er-side" aria-label="Performance today">
      <div className="card-header-row">
        <h3 className="card-title">Performance today</h3>
      </div>
      {!performance ? (
        <p className="data-empty">Loading…</p>
      ) : (
        <>
          <dl className="er-perf">
            <div>
              <dt>Avg triage time</dt>
              <dd>{minutes(performance.avgTriageMin)}</dd>
            </div>
            <div>
              <dt>On-time response</dt>
              <dd>{performance.onTimePct === null ? '—' : `${performance.onTimePct}%`}</dd>
            </div>
            <div>
              <dt>Avg stay</dt>
              <dd>{minutes(performance.avgStayMin)}</dd>
            </div>
          </dl>
          <p className="er-hint er-bars-title">Arrivals by hour ({total} today)</p>
          <div className="er-bars" role="img" aria-label={`Arrivals by hour today: ${total} in all, the busiest hour had ${Math.max(...hours, 0)}`}>
            {hours.map((n, h) => (
              <span key={h} className="er-bar" title={`${String(h).padStart(2, '0')}:00 — ${n} ${n === 1 ? 'arrival' : 'arrivals'}`}>
                <span className="er-bar-fill" style={{ height: `${n === 0 ? 2 : Math.max(8, (n / peak) * 100)}%` }} />
              </span>
            ))}
          </div>
          <div className="er-bars-axis er-hint" aria-hidden="true">
            <span>00</span>
            <span>06</span>
            <span>12</span>
            <span>18</span>
            <span>23</span>
          </div>
        </>
      )}
    </section>
  );
};
