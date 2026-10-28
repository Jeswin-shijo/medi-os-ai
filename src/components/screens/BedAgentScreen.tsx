import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { BedDouble, BrushCleaning, LogOut, UserRoundPlus, UsersRound } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { errorMessage } from '../../services/api';
import { useBedBoard } from '../../hooks/useBedBoard';
import { useBedOverview, useBedSeries } from '../../hooks/useBedOverview';
import { useBedRequests, type BedRequestFilter } from '../../hooks/useBedRequests';
import { REQUEST_ROLES, announceRequest, followRequest } from '../../utils/beds';
import { cols, split } from '../../utils/layout';
import { bedRequestService } from '../../services';
import type { BedOverview, BedRequest, BedRequestEvent, SnapshotRange } from '../../types';
import { ScreenHeader } from '../common/ScreenHeader';
import { LivePill } from '../beds/LivePill';
import { StatCard } from '../beds/StatCard';
import { AvailabilityTable } from '../beds/AvailabilityTable';
import { RequestQueue } from '../beds/RequestQueue';
import { SuggestionList, type SuggestionTarget } from '../beds/SuggestionList';
import { MovementLog } from '../beds/MovementLog';
import { DischargePlan } from '../beds/DischargePlan';
import { RequestBedDialog } from '../beds/RequestBedDialog';
import { RequestDetail } from '../beds/RequestDetail';
import { BedAgentSettings } from '../beds/BedAgentSettings';
import { TrendChart } from '../beds/charts/TrendChart';

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
  const { user, showToast, refreshAlertCount, setActiveScreen, focusRequestId, clearFocusRequest } = useApp();
  const role = user?.role ?? '';
  // Anyone watching hears when the Bed Agent can't place a patient, and the bell keeps up.
  const onRequest = useCallback((event: BedRequestEvent) => announceRequest(event, { showToast, refreshAlertCount }), [showToast, refreshAlertCount]);
  const { version, live, reload } = useBedBoard({ onRequest });
  const { overview, error } = useBedOverview(version);
  const queue = useBedRequests(ALL_REQUESTS, version);
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requestFilter, setRequestFilter] = useState<FilterId>('all');
  const tabsId = useId();
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  // An alert's "Open request" lands here: show that request, whatever filter was on. Adjusted while rendering
  // (not in an effect); the effect only hands the focus back, and `seenFocus` lets the same request be opened twice.
  const [seenFocus, setSeenFocus] = useState<string | null>(null);
  if (focusRequestId !== seenFocus && (focusRequestId || seenFocus)) {
    setSeenFocus(focusRequestId);
    if (focusRequestId) {
      setSelectedRequestId(focusRequestId);
      setRequestFilter('all');
      setTab('requests');
    }
  }
  useEffect(() => {
    if (focusRequestId) clearFocusRequest();
  }, [focusRequestId, clearFocusRequest]);

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
          <RequestsTab
            version={version}
            role={role}
            filterId={requestFilter}
            onFilter={setRequestFilter}
            selectedId={selectedRequestId}
            onSelect={setSelectedRequestId}
            onChanged={() => void reload()}
          />
        )}
        {tab === 'discharge' &&
          (overview ? <DischargePlan items={overview.dischargePlan} /> : <div className="medios-card data-empty">{error ?? 'Loading the discharge plan…'}</div>)}
        {tab === 'utilization' && <UtilizationTab version={version} overview={overview} error={error} />}
        {tab === 'settings' && role === 'admin' && (
          <section className="medios-card bagent-card">
            <div className="card-header-row">
              <h3 className="card-title">Bed Agent settings</h3>
            </div>
            <BedAgentSettings role={role} />
          </section>
        )}
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

type FilterId = 'all' | 'admissions' | 'transfers' | 'step-downs' | 'waiting' | 'attention';

const FILTERS: { id: FilterId; label: string; filter: BedRequestFilter }[] = [
  { id: 'all', label: 'All', filter: {} },
  { id: 'admissions', label: 'Admissions', filter: { type: 'admission' } },
  { id: 'transfers', label: 'Transfers', filter: { type: 'transfer' } },
  { id: 'step-downs', label: 'Step-downs', filter: { type: 'step-down' } },
  { id: 'waiting', label: 'Waiting', filter: { state: 'waiting' } },
  { id: 'attention', label: 'Needs attention', filter: { state: 'attention' } }
];

interface RequestsTabProps {
  version: number;
  role: string;
  filterId: FilterId;
  onFilter(id: FilterId): void;
  selectedId: string | null;
  onSelect(id: string): void;
  onChanged(): void;
}

/** Filter chips, the full request list with "Load more", and the selected request's decision beside it (below on narrow screens). */
const RequestsTab: React.FC<RequestsTabProps> = ({ version, role, filterId, onFilter, selectedId, onSelect, onChanged }) => {
  const list = useBedRequests((FILTERS.find((f) => f.id === filterId) ?? FILTERS[0]).filter, version);
  const [detail, setDetail] = useState<BedRequest | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const row = list.requests.find((r) => r.id === selectedId);
  // The list row changes whenever the request does, so this refetches the full request (with its notes) on each change.
  const rowStamp = row ? `${row.state}|${row.stateSince}|${row.attempts}` : '';

  useEffect(() => {
    if (!selectedId) return;
    let alive = true;
    bedRequestService
      .get(selectedId)
      .then((r) => {
        if (!alive) return;
        setDetail(r);
        setDetailError(null);
      })
      .catch((err) => alive && setDetailError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [selectedId, version, rowStamp]);

  const select = (r: BedRequest) => {
    onSelect(r.id);
    // Stacked layout: the detail sits below the list, so bring it into view.
    if (window.matchMedia('(max-width: 1100px)').matches) {
      window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: 'nearest' }));
    }
  };
  const more = async () => {
    setLoadingMore(true);
    await list.loadMore();
    setLoadingMore(false);
  };
  const shown = detail && detail.id === selectedId ? detail : null;

  return (
    <div className="bagent-requests">
      <div className="bagent-filters" role="group" aria-label="Filter requests">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={`chip-btn${filterId === f.id ? ' active' : ''}`} aria-pressed={filterId === f.id} onClick={() => onFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="split bagent-split" style={split('minmax(340px, 440px)')}>
        <section className="medios-card bagent-card">
          <div className="card-header-row">
            <h3 className="card-title">Bed requests</h3>
          </div>
          {list.loaded && list.error && (
            <p className="bagent-banner" role="alert">
              Showing the last list loaded. {list.error}
            </p>
          )}
          {list.loaded ? (
            <>
              {list.requests.length === 0 && filterId !== 'all' ? (
                <p className="data-empty">No requests match this filter.</p>
              ) : (
                <RequestQueue requests={list.requests} onOpen={select} selectedId={selectedId} />
              )}
              {list.hasMore && (
                <button type="button" className="btn-secondary bagent-more" disabled={loadingMore} onClick={() => void more()}>
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              )}
            </>
          ) : (
            <p className="data-empty" role={list.error ? 'alert' : undefined}>
              {list.error ?? 'Loading requests…'}
            </p>
          )}
        </section>
        <div ref={detailRef} className="bagent-detail">
          {shown ? (
            <RequestDetail key={shown.id} request={shown} role={role} onChanged={onChanged} />
          ) : (
            <div className="medios-card data-empty" role={detailError ? 'alert' : undefined}>
              {selectedId ? (detailError ?? 'Loading the request…') : 'Select a request to see what the Bed Agent decided and why.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RANGES: { id: SnapshotRange; label: string }[] = [
  { id: '24h', label: '24 hours' },
  { id: '7d', label: '7 days' }
];
const TREND_SERIES = [
  { key: 'occupied' as const, label: 'Occupied', color: 'var(--blue-primary)' },
  { key: 'free' as const, label: 'Free', color: 'var(--green-emerald)' }
];

/** Occupied and free beds over 24 hours or 7 days, with the availability table under it. */
const UtilizationTab: React.FC<{ version: number; overview: BedOverview | null; error: string | null }> = ({ version, overview, error }) => {
  const [range, setRange] = useState<SnapshotRange>('24h');
  const { points } = useBedSeries(range, version);
  return (
    <div className="bagent-overview">
      <section className="medios-card bagent-card">
        <div className="card-header-row">
          <h3 className="card-title">Bed use over time</h3>
          <div className="bagent-filters" role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button key={r.id} type="button" className={`chip-btn${range === r.id ? ' active' : ''}`} aria-pressed={range === r.id} onClick={() => setRange(r.id)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <TrendChart key={`${range}-${points[0]?.hour ?? ''}`} points={points} series={TREND_SERIES} />
      </section>
      {overview ? <AvailabilityTable rows={overview.byType} /> : <div className="medios-card data-empty">{error ?? 'Loading availability…'}</div>}
    </div>
  );
};

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
