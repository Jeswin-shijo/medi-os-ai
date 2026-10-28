import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { BedDouble, BrushCleaning, Ban, Hotel, UsersRound } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { useBedBoard } from '../../hooks/useBedBoard';
import { useBedOverview, useBedSeries } from '../../hooks/useBedOverview';
import { bedService } from '../../services';
import { errorMessage } from '../../services/api';
import { REQUEST_ROLES, announceRequest, followRequest, groupBoard, planFloors } from '../../utils/beds';
import { cols, split } from '../../utils/layout';
import type { BedBoard, BedOverview, BedRequestEvent, BoardBed, StatCardData, TypeRow } from '../../types';
import { ScreenHeader } from '../common/ScreenHeader';
import { BedTotalsBar, type FloorFilter } from '../beds/BedTotalsBar';
import { WardTiles } from '../beds/WardTiles';
import { BedPanel } from '../beds/BedPanel';
import { AdmitDialog } from '../beds/AdmitDialog';
import { RequestBedDialog } from '../beds/RequestBedDialog';
import { FloorPlan } from '../beds/FloorPlan';
import { LivePill } from '../beds/LivePill';
import { StatCard } from '../beds/StatCard';
import { UnitStatusCards } from '../beds/UnitStatusCards';
import { RoomsOverview } from '../beds/RoomsOverview';
import { CleaningList } from '../beds/CleaningList';
import { MovementLog } from '../beds/MovementLog';
import { SuggestionList, type SuggestionTarget } from '../beds/SuggestionList';
import { OccupancyRing } from '../beds/charts/OccupancyRing';
import { TrendChart } from '../beds/charts/TrendChart';

type Tab = 'overview' | 'map';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'map', label: 'Bed map' }
];
const MOVEMENT_ROWS = 6;

/** What the request dialog opens for: a new admission or a transfer. */
type RequestTarget = Pick<React.ComponentProps<typeof RequestBedDialog>, 'transferFrom'>;

export const BedsScreen: React.FC = () => {
  const { user, showToast, refreshAlertCount, setActiveScreen } = useApp();
  const role = user?.role ?? '';
  // Anyone watching hears when the Bed Agent can't place a patient, and the bell keeps up.
  const onRequest = useCallback((event: BedRequestEvent) => announceRequest(event, { showToast, refreshAlertCount }), [showToast, refreshAlertCount]);
  const { board, error, reload, version, live } = useBedBoard({ onRequest });
  const { overview, error: overviewError } = useBedOverview(version);
  const [tab, setTab] = useState<Tab>('overview');
  const tabsId = useId();
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const [floor, setFloor] = useState<FloorFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Admit here: the manual flow for a picked free bed. */
  const [manualBedId, setManualBedId] = useState<string | null>(null);
  const [request, setRequest] = useState<RequestTarget | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => (board ? groupBoard(board, floor) : []), [board, floor]);
  const selected = board?.beds.find((b) => b.id === selectedId) ?? null;
  const selectedWard = selected ? board?.wards.find((w) => w.id === selected.wardId) : undefined;

  useEffect(() => {
    if (selectedId && panelRef.current && window.matchMedia('(max-width: 1099px)').matches) {
      panelRef.current.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }, [selectedId]);

  const openMap = (opts: { floor?: FloorFilter; bedId?: string }) => {
    setFloor(opts.floor ?? 'all');
    setSelectedId(opts.bedId ?? null);
    setTab('map');
  };
  const onUnit = (row: TypeRow) => {
    const ward = board?.wards.find((w) => w.type === row.type);
    openMap({ floor: ward ? ward.floor : 'all' });
  };
  const onCleaningRow = (bedId: string) => {
    const bed = board?.beds.find((b) => b.id === bedId);
    const ward = bed && board?.wards.find((w) => w.id === bed.wardId);
    openMap({ floor: ward ? ward.floor : 'all', bedId });
  };
  const onSuggestion = (target: SuggestionTarget) => {
    if (target === 'bed-map') setTab('map');
    else if (target === 'cleaning') setTab('overview');
    else setActiveScreen('bed-agent');
  };
  const onTabKey = (e: React.KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : step ? (index + step + TABS.length) % TABS.length : -1;
    if (to < 0) return;
    e.preventDefault();
    setTab(TABS[to].id);
    tabRefs.current[TABS[to].id]?.focus();
  };

  const onAdmit = (bedId: string) => setManualBedId(bedId);
  const onTransfer = async (bed: BoardBed) => {
    if (!bed.patient) return;
    try {
      // The admission's class, needs and notes (the board leaves them out): the transfer reruns the rules with them.
      const admission = await bedService.admission(bed.id);
      setRequest({ transferFrom: { bedId: bed.id, admission } });
    } catch (err) {
      showToast(errorMessage(err), 'error');
    }
  };

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="Beds & Rooms"
        badge={<LivePill live={live} />}
        subtitle="Every bed and room at a glance"
        actions={
          REQUEST_ROLES.includes(role) && (
            <button className="btn-primary" onClick={() => setRequest({})}>
              Admit patient
            </button>
          )
        }
      />
      <div className="page-tabs" role="tablist" aria-label="Beds & Rooms views">
        {TABS.map((t, i) => (
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
          </button>
        ))}
      </div>
      <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`} className="bagent-panel">
        {!board && <p style={{ color: error ? 'var(--red-dark)' : 'var(--text-muted)', fontSize: 13 }}>{error ?? 'Loading beds…'}</p>}
        {board && tab === 'overview' && (
          <>
            {overviewError && overview && (
              <p className="bagent-banner" role="alert">
                Showing the last figures loaded. {overviewError}
              </p>
            )}
            {overview ? (
              <Overview board={board} overview={overview} role={role} version={version} onUnit={onUnit} onCleaningRow={onCleaningRow} onSuggestion={onSuggestion} onAdmit={onAdmit} onTransfer={onTransfer} onChanged={reload} />
            ) : (
              <div className="medios-card data-empty" role={overviewError ? 'alert' : undefined}>
                {overviewError ?? 'Loading the overview…'}
              </div>
            )}
          </>
        )}
        {board && tab === 'map' && (
          <>
            {error && <p style={{ color: 'var(--red-dark)', fontSize: 12 }}>Showing the last loaded board. {error}</p>}
            <BedTotalsBar totals={board.totals} floor={floor} onFloor={setFloor} />
            <div className="split" style={{ ...split('340px'), gap: 16, marginTop: 14, alignItems: 'start' }}>
              <div className="ward-list">
                {groups.map((g) => (
                  <WardTiles key={g.ward.id} ward={g.ward} beds={g.beds} free={g.free} selectedId={selectedId} onSelect={setSelectedId} />
                ))}
                {groups.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No beds on this floor.</p>}
              </div>
              <div ref={panelRef} className="bed-side">
                {selected && selectedWard ? (
                  <BedPanel
                    key={selected.id}
                    bed={selected}
                    ward={selectedWard}
                    role={role}
                    onAdmit={onAdmit}
                    onTransfer={onTransfer}
                    onChanged={reload}
                  />
                ) : (
                  <div className="medios-card bed-hint">Select a bed to see details</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      {manualBedId && <AdmitDialog preselectBedId={manualBedId} onClose={() => setManualBedId(null)} onDone={reload} />}
      {request && (
        <RequestBedDialog
          {...request}
          onClose={() => setRequest(null)}
          onSubmitted={(r) => {
            followRequest(r.id, { showToast, refreshAlertCount }, r.patientName);
            void reload();
          }}
        />
      )}
    </div>
  );
};

interface OverviewProps {
  board: BedBoard;
  overview: BedOverview;
  role: string;
  version: number;
  onUnit(row: TypeRow): void;
  onCleaningRow(bedId: string): void;
  onSuggestion(target: SuggestionTarget): void;
  onAdmit(bedId: string): void;
  onTransfer(bed: BoardBed): void;
  onChanged(): void;
}

/** The card's own note is replaced by the share of all beds. */
const share = (data: StatCardData, total: number): StatCardData => ({
  ...data,
  note: `${total > 0 ? Math.round((data.value / total) * 100) : 0}% of beds`
});

const Overview: React.FC<OverviewProps> = ({ board, overview, role, version, onUnit, onCleaningRow, onSuggestion, onAdmit, onTransfer, onChanged }) => {
  const [floorPick, setFloorPick] = useState<number | null>(null);
  const [planSelectedId, setPlanSelectedId] = useState<string | null>(null);
  const floors = planFloors(board);
  const planFloor = floorPick !== null && floors.includes(floorPick) ? floorPick : (floors[0] ?? 0);
  const changeFloor = (f: number) => {
    setFloorPick(f);
    setPlanSelectedId(null);
  };
  const planBed = board.beds.find((b) => b.id === planSelectedId) ?? null;
  const planWard = planBed ? board.wards.find((w) => w.id === planBed.wardId) : undefined;
  const { cards, totals } = overview;
  const { points } = useBedSeries('24h', version);
  const all = totals.total;
  const segments = [
    { label: 'Occupied', value: totals.occupied, color: 'var(--purple-ai)' },
    { label: 'Available', value: totals.free, color: 'var(--green-emerald)' },
    { label: 'Cleaning', value: totals.cleaning, color: 'var(--orange-amber)' },
    { label: 'Blocked', value: totals.blocked, color: 'var(--red-rose)' },
    ...(totals.held > 0 ? [{ label: 'Held', value: totals.held, color: 'var(--blue-primary)' }] : [])
  ];
  return (
    <div className="bagent-overview">
      <div className="cols-5 bagent-grid">
        <StatCard icon={Hotel} tone="slate" title="Total beds" data={share(cards.total, all)} />
        <StatCard icon={UsersRound} tone="purple" title="Occupied" data={share(cards.occupied, all)} goodWhenUp={false} />
        <StatCard icon={BedDouble} tone="green" title="Available" data={share(cards.available, all)} />
        <StatCard icon={BrushCleaning} tone="amber" title="Cleaning" data={share(cards.cleaning, all)} goodWhenUp={false} />
        <StatCard icon={Ban} tone="red" title="Blocked" data={share(cards.blocked, all)} goodWhenUp={false} />
      </div>

      <div className="cols-2 bagent-grid bagent-pair-always">
        <section className="medios-card bagent-card">
          <div className="card-header-row">
            <h3 className="card-title">Bed occupancy</h3>
          </div>
          <OccupancyRing segments={segments} centerValue={`${totals.percentFull}%`} centerLabel="occupied" />
        </section>
        <UnitStatusCards rows={overview.byType} onOpen={onUnit} />
      </div>

      <section className="medios-card bagent-card floorplan-slot">
        <div className="card-header-row">
          <h3 className="card-title">Floor plan</h3>
        </div>
        <div className="split" style={{ ...split('320px'), gap: 16, alignItems: 'start' }}>
          <FloorPlan board={board} floor={planFloor} onFloor={changeFloor} selectedId={planSelectedId} onSelect={setPlanSelectedId} />
          <div className="bed-side">
            {planBed && planWard ? (
              <BedPanel key={planBed.id} bed={planBed} ward={planWard} role={role} onAdmit={onAdmit} onTransfer={onTransfer} onChanged={onChanged} />
            ) : (
              <div className="medios-card bed-hint">Select a bed to see details</div>
            )}
          </div>
        </div>
      </section>

      <div className="cols-3 bagent-grid bagent-trio" style={cols('minmax(0, 0.7fr) minmax(0, 1.4fr) minmax(0, 1fr)')}>
        <RoomsOverview rows={overview.byType} />
        <MovementLog compact movements={overview.movements} limit={MOVEMENT_ROWS} />
        <CleaningList board={board} role={role} onOpen={onCleaningRow} />
      </div>

      <div className="cols-2 bagent-grid bagent-pair-always">
        <section className="medios-card bagent-card">
          <div className="card-header-row">
            <h3 className="card-title">Occupancy trend</h3>
            <span className="bagent-hint">Last 24 hours</span>
          </div>
          <TrendChart
            points={points}
            series={[
              { key: 'occupied', label: 'Occupied', color: 'var(--purple-ai)' },
              { key: 'free', label: 'Available', color: 'var(--green-emerald)' }
            ]}
          />
        </section>
        <SuggestionList suggestions={overview.suggestions} onAction={onSuggestion} />
      </div>
    </div>
  );
};
