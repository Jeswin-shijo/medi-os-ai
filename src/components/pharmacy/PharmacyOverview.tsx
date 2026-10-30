import React, { useMemo, useState } from 'react';
import { CheckCheck, ClipboardList, MessageCircleQuestion, PackageMinus, ShieldCheck } from 'lucide-react';
import type { CoordinatorEvent, PharmacyOrderView, PharmacyOverview as PharmacyOverviewData } from '../../types';
import { displayTime } from '../../utils/clinicDate';
import { tableMin } from '../../utils/layout';
import {
  ORDER_FILTERS,
  PRIORITY_LABEL,
  PRIORITY_TONE,
  STORE_LABEL,
  expiryText,
  matchesOrderFilter,
  minutesText,
  orderStatus,
  percentText,
  type OrderFilter
} from '../../utils/pharmacy';
import { StatCard } from '../beds/StatCard';
import { PharmacyWorkflowDiagram } from './PharmacyWorkflowDiagram';

const RECENT_ROWS = 10;
const ALERT_ROWS = 5;

interface PharmacyOverviewProps {
  overview: PharmacyOverviewData | null;
  orders: PharmacyOrderView[] | null;
  /** The most orders the list holds; a list that long may be cut off. */
  orderLimit: number;
  error: string | null;
  lastEvent: CoordinatorEvent | null;
  onRetry(): void;
}

const Failed: React.FC<{ error: string; onRetry(): void }> = ({ error, onRetry }) => (
  <p className="data-empty" role="alert">
    {error}{' '}
    <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>
      Try again
    </button>
  </p>
);

/** The Overview tab: the cards, recent orders, the workflow, check time, stock alerts and performance. */
export const PharmacyOverview: React.FC<PharmacyOverviewProps> = ({ overview, orders, orderLimit, error, lastEvent, onRetry }) => (
  <div className="bagent-overview lab-body">
    {error && overview && (
      <p className="bagent-banner" role="alert">
        Showing the last figures loaded. {error}
      </p>
    )}
    {overview ? <Cards cards={overview.cards} /> : error ? <div className="medios-card"><Failed error={error} onRetry={onRetry} /></div> : <div className="medios-card data-empty">Loading the pharmacy…</div>}

    <RecentOrders orders={orders} orderLimit={orderLimit} ordersToday={overview?.cards.ordersToday.value ?? null} error={error} onRetry={onRetry} />

    <div className="cols-2 bagent-grid er-lower">
      <section className="medios-card bagent-card er-side" aria-label="Workflow">
        <div className="card-header-row">
          <h3 className="card-title">Pharmacy workflow</h3>
        </div>
        <PharmacyWorkflowDiagram lastEvent={lastEvent} />
      </section>
      <CheckTimeCard rows={overview?.checkTime} />
    </div>
    <div className="cols-2 bagent-grid er-lower">
      <StockAlertsCard alerts={overview?.stockAlerts} />
      <PerformanceCard performance={overview?.performance} />
    </div>
  </div>
);

const Cards: React.FC<{ cards: PharmacyOverviewData['cards'] }> = ({ cards }) => (
  <div className="cols-5 bagent-grid">
    <StatCard icon={ClipboardList} tone="blue" title="Orders today" data={cards.ordersToday} />
    <StatCard icon={ShieldCheck} tone="amber" title="To check" data={cards.toCheck} />
    <StatCard icon={MessageCircleQuestion} tone="red" title="Open queries" data={cards.openQueries} goodWhenUp={false} />
    <StatCard icon={CheckCheck} tone="green" title="Issued today" data={cards.issuedToday} />
    <StatCard icon={PackageMinus} tone="red" title="Low stock" data={cards.lowStock} goodWhenUp={false} />
  </div>
);

const RecentOrders: React.FC<{ orders: PharmacyOrderView[] | null; orderLimit: number; ordersToday: number | null; error: string | null; onRetry(): void }> = ({ orders, orderLimit, ordersToday, error, onRetry }) => {
  const [filter, setFilter] = useState<OrderFilter>('all');
  const all = useMemo(() => orders ?? [], [orders]);
  const shown = useMemo(() => all.filter((o) => matchesOrderFilter(o, filter)), [all, filter]);
  // The list holds at most `orderLimit` orders. When it is full, more may exist: the counts then read "N+", and
  // "All" uses the Orders today figure when that is higher.
  const cut = all.length >= orderLimit;
  const countOf = (f: OrderFilter) => {
    const n = all.filter((o) => matchesOrderFilter(o, f)).length;
    const total = f === 'all' && cut ? Math.max(n, ordersToday ?? 0) : n;
    return cut ? `${total}+` : String(total);
  };
  const totalText = cut ? `${Math.max(shown.length, filter === 'all' ? (ordersToday ?? 0) : 0)} or more` : String(shown.length);
  return (
    <section className="medios-card bagent-card lab-card" aria-label="Recent orders">
      <div className="card-header-row">
        <div className="bagent-title-group">
          <h3 className="card-title">Recent orders</h3>
          <span className="bagent-hint">Live, newest first. The chips count orders; the cards above count medicine lines.</span>
        </div>
      </div>
      <div className="bagent-filters" role="group" aria-label="Filter orders">
        {ORDER_FILTERS.map((f) => (
          <button key={f.id} type="button" className={`chip-btn${f.id === 'flagged' ? ' critical' : ''}${filter === f.id ? ' active' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label} {orders ? countOf(f.id) : ''}
          </button>
        ))}
      </div>
      {!orders ? (
        error ? <Failed error={error} onRetry={onRetry} /> : <p className="data-empty">Loading orders…</p>
      ) : shown.length === 0 ? (
        <p className="data-empty">{all.length ? 'No orders match this filter.' : 'No medicine orders yet. New orders show up here.'}</p>
      ) : (
        <>
          <div className="table-scroll" style={tableMin(680)}>
            <table className="data-table lab-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Patient</th>
                  <th scope="col">Medicines</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Ordered</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {shown.slice(0, RECENT_ROWS).map((o) => {
                  const status = orderStatus(o);
                  const medicines = o.lines.map((l) => l.medicineLabel).join(', ');
                  const flagged = matchesOrderFilter(o, 'flagged');
                  return (
                    <tr key={o.id}>
                      <td className="lab-num">{o.number}</td>
                      <td>
                        <span className="er-name">{o.patientName}</span>
                        <span className="er-sub lab-block">{o.patientUhid} · {o.ward ? `${o.setting} · ${o.ward}` : o.setting}</span>
                      </td>
                      <td className="lab-tests" data-tip={medicines}>{medicines}</td>
                      <td><span className={`status-pill sm ${PRIORITY_TONE[o.priority]}`}>{PRIORITY_LABEL[o.priority]}</span></td>
                      <td className="lab-time">{displayTime(new Date(o.orderedAt))}</td>
                      <td>
                        <span className={`status-pill sm ${status.tone}`}>{status.label}</span>
                        {flagged && <span className="status-pill sm red lab-tag">Flagged</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {shown.length > RECENT_ROWS && <p className="er-hint lab-more">Showing the latest {RECENT_ROWS} of {totalText}.</p>}
        </>
      )}
    </section>
  );
};

const CheckTimeCard: React.FC<{ rows: PharmacyOverviewData['checkTime'] | undefined }> = ({ rows }) => (
  <section className="medios-card bagent-card er-side" aria-label="Check time against target">
    <div className="card-header-row">
      <h3 className="card-title">Check time against target</h3>
      <span className="bagent-hint">Today</span>
    </div>
    {!rows ? (
      <p className="data-empty">Loading…</p>
    ) : (
      <div className="table-scroll" style={tableMin(360)}>
        <table className="data-table lab-table">
          <thead>
            <tr>
              <th scope="col">Priority</th>
              <th scope="col">Checked</th>
              <th scope="col">Avg</th>
              <th scope="col">Target</th>
              <th scope="col">On time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.priority}>
                <td><span className={`status-pill sm ${PRIORITY_TONE[r.priority]}`}>{PRIORITY_LABEL[r.priority]}</span></td>
                <td className="lab-time">{r.count}</td>
                <td className="lab-time">{minutesText(r.avgMin)}</td>
                <td className="lab-time">{r.targetMin} min</td>
                <td>
                  {r.onTimePct === null ? <span className="er-ok">—</span> : <span className={`status-pill sm ${r.onTimePct >= 80 ? 'green' : r.onTimePct >= 50 ? 'orange' : 'red'}`}>{r.onTimePct}%</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

const AlertGroup: React.FC<{ title: string; tone: string; count: number; children: React.ReactNode }> = ({ title, tone, count, children }) => (
  <div className="ph-alert-group">
    <div className="ph-alert-head">
      <span className="er-name">{title}</span>
      <span className={`status-pill sm ${count ? tone : 'gray'}`}>{count}</span>
    </div>
    {count === 0 ? <p className="er-hint ph-alert-none">None</p> : <ul className="ph-alert-list">{children}</ul>}
  </div>
);

const StockAlertsCard: React.FC<{ alerts: PharmacyOverviewData['stockAlerts'] | undefined }> = ({ alerts }) => (
  <section className="medios-card bagent-card er-side" aria-label="Stock alerts">
    <div className="card-header-row">
      <h3 className="card-title">Stock alerts</h3>
    </div>
    {!alerts ? (
      <p className="data-empty">Loading…</p>
    ) : (
      <>
        <AlertGroup title="Low stock" tone="red" count={alerts.low.length}>
          {alerts.low.slice(0, ALERT_ROWS).map((r) => (
            <li key={`${r.product}:${r.store}`} className="ph-alert-row">
              <span className="ph-alert-what">{r.label} <span className="er-hint">({STORE_LABEL[r.store]})</span></span>
              <span className="ph-alert-qty">{r.usable} left · level {r.reorderLevel}</span>
            </li>
          ))}
        </AlertGroup>
        <AlertGroup title="Near expiry" tone="orange" count={alerts.nearExpiry.length}>
          {alerts.nearExpiry.slice(0, ALERT_ROWS).map((b) => (
            <li key={`${b.product}:${b.store}:${b.batchNo}`} className="ph-alert-row">
              <span className="ph-alert-what">{b.label} <span className="er-hint">({b.store === 'er' ? 'ER' : 'Main'} · batch {b.batchNo})</span></span>
              <span className="ph-alert-qty">{b.quantity} · expires {expiryText(b.expiry)}</span>
            </li>
          ))}
        </AlertGroup>
        <AlertGroup title="Expired" tone="red" count={alerts.expired.length}>
          {alerts.expired.slice(0, ALERT_ROWS).map((b) => (
            <li key={`${b.product}:${b.store}:${b.batchNo}`} className="ph-alert-row">
              <span className="ph-alert-what">{b.label} <span className="er-hint">({b.store === 'er' ? 'ER' : 'Main'} · batch {b.batchNo})</span></span>
              <span className="ph-alert-qty">{b.quantity} · expired {expiryText(b.expiry)}</span>
            </li>
          ))}
        </AlertGroup>
      </>
    )}
  </section>
);

const PerformanceCard: React.FC<{ performance: PharmacyOverviewData['performance'] | undefined }> = ({ performance }) => {
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
              <dt>Avg check time</dt>
              <dd>{minutesText(performance.avgCheckMin)}</dd>
            </div>
            <div>
              <dt>Checked on time</dt>
              <dd>{percentText(performance.checkOnTimePct)}</dd>
            </div>
            <div>
              <dt>Queries answered on time</dt>
              <dd>{percentText(performance.queriesOnTimePct)}</dd>
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
