import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { CoordinatorEvent, LabCollectionItem, LabCriticalRow, LabOverview as LabOverviewData, LabRequestView } from '../../types';
import { displayTime } from '../../utils/clinicDate';
import { tableMin } from '../../utils/layout';
import {
  ORDER_FILTERS,
  PRIORITY_LABEL,
  PRIORITY_TONE,
  criticalFirstText,
  criticalWho,
  dueText,
  locationText,
  matchesOrderFilter,
  minutesText,
  minutesUntil,
  percentText,
  requestStatus,
  type OrderFilter
} from '../../utils/lab';
import { LabOverviewCards } from './LabOverviewCards';
import { LabWorkflowDiagram } from './LabWorkflowDiagram';

const RECENT_ROWS = 10;
const QUEUE_ROWS = 8;

interface LabOverviewProps {
  overview: LabOverviewData | null;
  requests: LabRequestView[] | null;
  collection: LabCollectionItem[] | null;
  critical: LabCriticalRow[] | null;
  error: string | null;
  lastEvent: CoordinatorEvent | null;
  onRetry(): void;
  /** "See all" on the collection preview. */
  onSeeCollection(): void;
}

const Failed: React.FC<{ error: string; onRetry(): void }> = ({ error, onRetry }) => (
  <p className="data-empty" role="alert">
    {error}{' '}
    <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>
      Try again
    </button>
  </p>
);

/** The Overview tab: the cards, recent orders, the collection preview, the workflow, turnaround, performance and criticals. */
export const LabOverview: React.FC<LabOverviewProps> = ({ overview, requests, collection, critical, error, lastEvent, onRetry, onSeeCollection }) => {
  // Deadlines pass with the clock, not only with data: re-check every 30 seconds.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="bagent-overview lab-body">
      {error && overview && (
        <p className="bagent-banner" role="alert">
          Showing the last figures loaded. {error}
        </p>
      )}
      {overview ? <LabOverviewCards cards={overview.cards} /> : error ? <div className="medios-card"><Failed error={error} onRetry={onRetry} /></div> : <div className="medios-card data-empty">Loading the lab…</div>}

      <RecentOrders requests={requests} error={error} onRetry={onRetry} />
      <CollectionPreview collection={collection} error={error} onRetry={onRetry} now={now} onSeeAll={onSeeCollection} />

      <div className="cols-2 bagent-grid er-lower">
        <section className="medios-card bagent-card er-side" aria-label="Workflow">
          <div className="card-header-row">
            <h3 className="card-title">Lab workflow</h3>
          </div>
          <LabWorkflowDiagram lastEvent={lastEvent} />
        </section>
        <PerformanceCard performance={overview?.performance} />
      </div>
      <div className="cols-2 bagent-grid er-lower">
        <TatCard rows={overview?.tatByTest} />
        <CriticalCard rows={critical} error={error} onRetry={onRetry} now={now} />
      </div>
    </div>
  );
};

const RecentOrders: React.FC<{ requests: LabRequestView[] | null; error: string | null; onRetry(): void }> = ({ requests, error, onRetry }) => {
  const [filter, setFilter] = useState<OrderFilter>('all');
  const all = useMemo(() => requests ?? [], [requests]);
  const shown = useMemo(() => all.filter((r) => matchesOrderFilter(r, filter)), [all, filter]);
  const countOf = (f: OrderFilter) => all.filter((r) => matchesOrderFilter(r, f)).length;
  return (
    <section className="medios-card bagent-card lab-card" aria-label="Recent orders">
      <div className="card-header-row">
        <div className="bagent-title-group">
          <h3 className="card-title">Recent orders</h3>
          <span className="bagent-hint">Live, newest first</span>
        </div>
      </div>
      <div className="bagent-filters" role="group" aria-label="Filter orders">
        {ORDER_FILTERS.map((f) => (
          <button key={f.id} type="button" className={`chip-btn${f.id === 'critical' ? ' critical' : ''}${filter === f.id ? ' active' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label} {requests ? countOf(f.id) : ''}
          </button>
        ))}
      </div>
      {!requests ? (
        error ? <Failed error={error} onRetry={onRetry} /> : <p className="data-empty">Loading orders…</p>
      ) : shown.length === 0 ? (
        <p className="data-empty">{all.length ? 'No orders match this filter.' : 'No lab orders yet. New orders show up here.'}</p>
      ) : (
        <>
          <div className="table-scroll" style={tableMin(640)}>
            <table className="data-table lab-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Patient</th>
                  <th scope="col">Tests</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Ordered</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {shown.slice(0, RECENT_ROWS).map((r) => {
                  const status = requestStatus(r);
                  const tests = r.lines.map((l) => l.label).join(', ');
                  return (
                    <tr key={r.id}>
                      <td className="lab-num">{r.number}</td>
                      <td>
                        <span className="er-name">{r.patientName}</span>
                        <span className="er-sub lab-block">{r.patientUhid}{r.done ? '' : ` · ${locationText(r.location)}`}</span>
                      </td>
                      <td className="lab-tests" data-tip={tests}>{tests}</td>
                      <td><span className={`status-pill sm ${PRIORITY_TONE[r.priority]}`}>{PRIORITY_LABEL[r.priority]}</span></td>
                      <td className="lab-time">{displayTime(new Date(r.orderedAt))}</td>
                      <td><span className={`status-pill sm ${status.tone}`}>{status.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {shown.length > RECENT_ROWS && <p className="er-hint lab-more">Showing the latest {RECENT_ROWS} of {shown.length}. The Orders tab will list them all.</p>}
        </>
      )}
    </section>
  );
};

const CollectionPreview: React.FC<{ collection: LabCollectionItem[] | null; error: string | null; onRetry(): void; now: number; onSeeAll(): void }> = ({ collection, error, onRetry, now, onSeeAll }) => (
  <section className="medios-card bagent-card lab-card" aria-label="Sample collection queue">
    <div className="card-header-row">
      <div className="bagent-title-group">
        <h3 className="card-title">Sample collection queue</h3>
        <span className="bagent-hint">{collection ? `${collection.length} waiting` : ''}</span>
      </div>
      {collection && collection.length > 0 && (
        <button type="button" className="btn-secondary btn-sm" onClick={onSeeAll}>
          See all
        </button>
      )}
    </div>
    {!collection ? (
      error ? <Failed error={error} onRetry={onRetry} /> : <p className="data-empty">Loading the collection queue…</p>
    ) : collection.length === 0 ? (
      <p className="data-empty">No samples are waiting to be collected.</p>
    ) : (
      <div className="table-scroll" style={tableMin(640)}>
        <table className="data-table lab-table">
          <thead>
            <tr>
              <th scope="col">Sample</th>
              <th scope="col">Patient</th>
              <th scope="col">Tests</th>
              <th scope="col">Tube</th>
              <th scope="col">Priority</th>
              <th scope="col">Collect by</th>
            </tr>
          </thead>
          <tbody>
            {collection.slice(0, QUEUE_ROWS).map((s) => {
              const left = minutesUntil(s.collectBy, now);
              const late = left < 0;
              return (
                <tr key={s.sampleId} className={s.overdue || late ? 'is-late' : undefined}>
                  <td className="lab-num">
                    {s.sampleNumber}
                    <span className="lab-block lab-deadline-narrow">
                      {late ? (
                        <span className="status-pill sm red lab-delayed">
                          <AlertTriangle size={12} aria-hidden="true" />
                          {-left} min late
                        </span>
                      ) : (
                        <span className="er-hint">{left} min left</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className="er-name">{s.patientName}</span>
                    <span className="er-sub lab-block">{s.patientUhid} · {locationText(s.location)}</span>
                  </td>
                  <td className="lab-tests" data-tip={s.tests.join(', ')}>{s.tests.join(', ')}</td>
                  <td>{s.tubeLabel}</td>
                  <td><span className={`status-pill sm ${PRIORITY_TONE[s.priority]}`}>{PRIORITY_LABEL[s.priority]}</span></td>
                  <td>
                    <span className="lab-time">{displayTime(new Date(s.collectBy))}</span>{' '}
                    {late ? (
                      <span className="status-pill sm red lab-delayed" data-tip={`${-left} min past the collection time`}>
                        <AlertTriangle size={12} aria-hidden="true" />
                        Delayed
                      </span>
                    ) : (
                      <span className="er-hint">{left} min left</span>
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

const TatCard: React.FC<{ rows: LabOverviewData['tatByTest'] | undefined }> = ({ rows }) => (
  <section className="medios-card bagent-card er-side" aria-label="Turnaround by test">
    <div className="card-header-row">
      <h3 className="card-title">Turnaround by test</h3>
      <span className="bagent-hint">Today</span>
    </div>
    {!rows ? (
      <p className="data-empty">Loading…</p>
    ) : rows.length === 0 ? (
      <p className="data-empty">No results released yet today.</p>
    ) : (
      <div className="table-scroll" style={tableMin(360)}>
        <table className="data-table lab-table">
          <thead>
            <tr>
              <th scope="col">Test</th>
              <th scope="col">Avg</th>
              <th scope="col">Target</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.test}>
                <td>{r.label}</td>
                <td className="lab-time">{minutesText(r.avgMin)}</td>
                <td className="lab-time">{r.targetMin} min</td>
                <td>
                  {r.onTime === null ? <span className="er-ok">—</span> : <span className={`status-pill sm ${r.onTime ? 'green' : 'red'}`}>{r.onTime ? 'On time' : 'Late'}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

const PerformanceCard: React.FC<{ performance: LabOverviewData['performance'] | undefined }> = ({ performance }) => {
  const hours = performance?.ordersByHour ?? [];
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
          <dl className="er-perf lab-perf">
            <div>
              <dt>Avg turnaround</dt>
              <dd>{minutesText(performance.avgTatMin)}</dd>
            </div>
            <div>
              <dt>On-time results</dt>
              <dd>{percentText(performance.onTimePct)}</dd>
            </div>
            <div>
              <dt>Collected on time</dt>
              <dd>{percentText(performance.collectionOnTimePct)}</dd>
            </div>
            <div>
              <dt>Rejection rate</dt>
              <dd>{percentText(performance.rejectionRate)}</dd>
            </div>
          </dl>
          <p className="er-hint er-bars-title">Orders by hour ({total} today)</p>
          <div className="er-bars" role="img" aria-label={`Orders by hour today: ${total} in all, the busiest hour had ${Math.max(...hours, 0)}`}>
            {hours.map((n, h) => (
              <span key={h} className="er-bar" title={`${String(h).padStart(2, '0')}:00 — ${n} ${n === 1 ? 'order' : 'orders'}`}>
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

const CriticalCard: React.FC<{ rows: LabCriticalRow[] | null; error: string | null; onRetry(): void; now: number }> = ({ rows, error, onRetry, now }) => (
  <section className="medios-card bagent-card er-side" aria-label="Critical results">
    <div className="card-header-row">
      <h3 className="card-title">Critical results</h3>
    </div>
    {!rows ? (
      error ? <Failed error={error} onRetry={onRetry} /> : <p className="data-empty">Loading…</p>
    ) : rows.length === 0 ? (
      <p className="data-empty">No critical results need attention.</p>
    ) : (
      <ul className="lab-crit">
        {rows.map((c) => {
          const left = c.dueAt ? minutesUntil(c.dueAt, now) : null;
          return (
            <li key={c.lineId} className={`lab-crit-row${c.ackAt ? '' : ' is-open'}`}>
              <div className="lab-crit-main">
                <span className="er-name">{c.patientName || c.label}</span>
                <span className="er-sub lab-block">{criticalWho({ ...c, patientName: undefined })}</span>
                <span className="er-sub lab-block">
                  {c.label}: {criticalFirstText(c)}
                  {c.pendingAmendment && <span className="status-pill sm orange lab-tag">Amendment pending</span>}
                </span>
                <span className="er-sub lab-block">
                  {c.requestNumber} · ordered by {c.orderedBy || '—'}
                  {c.releasedAt ? ` · released ${displayTime(new Date(c.releasedAt))}` : ''}
                </span>
              </div>
              {c.ackAt ? (
                <span className="status-pill sm green">Acknowledged by {c.ackBy ?? '—'}</span>
              ) : left !== null ? (
                <span className={`status-pill sm ${left < 0 ? 'red' : 'orange'}`}>{dueText(left)}</span>
              ) : (
                <span className="status-pill sm red">Not acknowledged</span>
              )}
            </li>
          );
        })}
      </ul>
    )}
  </section>
);
