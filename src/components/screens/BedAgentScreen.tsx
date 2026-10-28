import React, { useId, useRef, useState } from 'react';
import { BedDouble, BrushCleaning, LogOut, UserRoundPlus, UsersRound } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { useBedBoard } from '../../hooks/useBedBoard';
import { useBedOverview } from '../../hooks/useBedOverview';
import { useBedRequests, type BedRequestFilter } from '../../hooks/useBedRequests';
import { REQUEST_ROLES, followRequest } from '../../utils/beds';
import { cols } from '../../utils/layout';
import type { BedOverview, BedRequest } from '../../types';
import { ScreenHeader } from '../common/ScreenHeader';
import { LivePill } from '../beds/LivePill';
import { StatCard } from '../beds/StatCard';
import { AvailabilityTable } from '../beds/AvailabilityTable';
import { RequestQueue } from '../beds/RequestQueue';
import { SuggestionList, type SuggestionTarget } from '../beds/SuggestionList';
import { MovementLog } from '../beds/MovementLog';
import { DischargePlan } from '../beds/DischargePlan';
import { RequestBedDialog } from '../beds/RequestBedDialog';

type Tab = 'overview' | 'requests' | 'discharge' | 'utilization' | 'settings';

const TABS: { id: Tab; label: string; adminOnly?: boolean }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'requests', label: 'Requests' },
  { id: 'discharge', label: 'Discharge planning' },
  { id: 'utilization', label: 'Utilization' },
  { id: 'settings', label: 'Settings', adminOnly: true }
];

const ALL_REQUESTS: BedRequestFilter = {};
/** The overview's queue shows the newest few. */
const QUEUE_ROWS = 8;
const PLAN_ROWS = 6;
const MOVEMENT_ROWS = 6;

/** What the autonomous Bed Agent is doing: live figures, the request queue, movements and suggestions. */
export const BedAgentScreen: React.FC = () => {
  const { user, showToast, refreshAlertCount, setActiveScreen } = useApp();
  const role = user?.role ?? '';
  const { version, live, reload } = useBedBoard();
  const { overview, error } = useBedOverview(version);
  const queue = useBedRequests(ALL_REQUESTS, version);
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const tabsId = useId();
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  const tabs = TABS.filter((t) => !t.adminOnly || role === 'admin');
  const openRequest = (r: BedRequest) => {
    setSelectedRequestId(r.id);
    setTab('requests');
  };
  const onSuggestion = (target: SuggestionTarget) => {
    // Cleaning and the bed map live on Beds & Rooms; the rest are tabs here.
    if (target === 'cleaning' || target === 'bed-map') setActiveScreen('beds');
    else setTab(target);
  };
  const onTabKey = (e: React.KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : step ? (index + step + tabs.length) % tabs.length : -1;
    if (to < 0) return;
    e.preventDefault();
    setTab(tabs[to].id);
    tabRefs.current[tabs[to].id]?.focus();
  };

  return (
    <div className="page-scroll-body bagent">
      <ScreenHeader
        title="Bed Agent"
        badge={<LivePill live={live} />}
        subtitle="Allocates beds on its own within the hospital's rules. Alerts the team when it can't."
        actions={
          REQUEST_ROLES.includes(role) && (
            <button className="btn-primary" onClick={() => setRequesting(true)}>
              Admit patient
            </button>
          )
        }
      />

      <div className="page-tabs" role="tablist" aria-label="Bed Agent views">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            id={`${tabsId}-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`${tabsId}-panel`}
            tabIndex={tab === t.id ? 0 : -1}
            className={`page-tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onTabKey(e, i)}
          >
            {t.label}
            {t.id === 'requests' && !!overview?.openRequests && <span className="bagent-tab-count">{overview.openRequests}</span>}
          </button>
        ))}
      </div>

      <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`} className="bagent-panel">
        {error && overview && (
          <p className="bagent-banner" role="alert">
            Showing the last figures loaded. {error}
          </p>
        )}

        {tab === 'overview' &&
          (overview ? (
            <Overview
              overview={overview}
              queue={queue}
              onOpenRequest={openRequest}
              onViewRequests={() => setTab('requests')}
              onViewDischarges={() => setTab('discharge')}
              onSuggestion={onSuggestion}
            />
          ) : (
            <div className="medios-card data-empty" role={error ? 'alert' : undefined}>
              {error ?? 'Loading the Bed Agent…'}
            </div>
          ))}

        {tab === 'requests' && (
          <section className="medios-card bagent-card">
            <div className="card-header-row">
              <h3 className="card-title">Bed requests</h3>
            </div>
            {queue.loaded ? (
              <RequestQueue requests={queue.requests} onOpen={(r) => setSelectedRequestId(r.id)} selectedId={selectedRequestId} />
            ) : (
              <p className="data-empty">{queue.error ?? 'Loading requests…'}</p>
            )}
            <p className="bagent-soon">Filters and the full decision for each request are coming next.</p>
          </section>
        )}
        {tab === 'discharge' && <Placeholder what="The full discharge plan" />}
        {tab === 'utilization' && <Placeholder what="Bed use over 24 hours and 7 days" />}
        {tab === 'settings' && <Placeholder what="The Bed Agent's settings" />}
      </div>

      {requesting && (
        <RequestBedDialog
          onClose={() => setRequesting(false)}
          onSubmitted={(r) => {
            followRequest(r.id, { showToast, refreshAlertCount }, r.patientName);
            void reload();
          }}
        />
      )}
    </div>
  );
};

const Placeholder: React.FC<{ what: string }> = ({ what }) => <div className="medios-card data-empty">{what} will show here soon.</div>;

interface OverviewProps {
  overview: BedOverview;
  queue: ReturnType<typeof useBedRequests>;
  onOpenRequest(r: BedRequest): void;
  onViewRequests(): void;
  onViewDischarges(): void;
  onSuggestion(target: SuggestionTarget): void;
}

/** Five figures, then availability, the queue and suggestions, then movements and the discharge plan. */
const Overview: React.FC<OverviewProps> = ({ overview, queue, onOpenRequest, onViewRequests, onViewDischarges, onSuggestion }) => {
  const { cards } = overview;
  return (
    <div className="bagent-overview">
      <div className="cols-5 bagent-grid">
        <StatCard icon={BedDouble} tone="green" title="Available beds" data={cards.available} />
        <StatCard icon={UsersRound} tone="purple" title="Occupied beds" data={cards.occupied} goodWhenUp={false} />
        <StatCard icon={BrushCleaning} tone="red" title="Cleaning / blocked" data={cards.cleaningBlocked} goodWhenUp={false} />
        <StatCard icon={LogOut} tone="amber" title="Expected discharges" data={cards.expectedDischarges} />
        <StatCard icon={UserRoundPlus} tone="blue" title="Expected admissions" data={cards.expectedAdmissions} />
      </div>

      <div className="cols-3 bagent-grid bagent-trio" style={cols('minmax(0, 1.15fr) minmax(0, 1.1fr) minmax(0, 0.85fr)')}>
        <AvailabilityTable rows={overview.byType} />
        <section className="medios-card bagent-card">
          <div className="card-header-row">
            <div className="bagent-title-group">
              <h3 className="card-title">Request queue</h3>
              <span className="bagent-hint">{overview.openRequests ? `${overview.openRequests} open` : 'None open'}</span>
            </div>
            <button type="button" className="text-link bagent-link" onClick={onViewRequests}>
              View all
            </button>
          </div>
          {queue.loaded ? (
            <RequestQueue compact requests={queue.requests.slice(0, QUEUE_ROWS)} onOpen={onOpenRequest} />
          ) : (
            <p className="data-empty">{queue.error ?? 'Loading requests…'}</p>
          )}
        </section>
        <SuggestionList suggestions={overview.suggestions} onAction={onSuggestion} />
      </div>

      <div className="cols-2 bagent-grid bagent-pair">
        <MovementLog movements={overview.movements} limit={MOVEMENT_ROWS} />
        <DischargePlan items={overview.dischargePlan} limit={PLAN_ROWS} onViewAll={onViewDischarges} />
      </div>
    </div>
  );
};
