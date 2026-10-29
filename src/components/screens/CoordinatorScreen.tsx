import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Network, Route, ShieldAlert, Workflow } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { coordinatorService } from '../../services';
import { useCoordinatorList, useCoordinatorOverview, useCoordinatorStream } from '../../hooks/useCoordinator';
import { REQUEST_ROLES, followRequest } from '../../utils/beds';
import { cols, split } from '../../utils/layout';
import type { CoordinatorCardData, CoordinatorCardKey, CoordinatorEvent, CoordinatorSeriesPoint, RequestType, SnapshotRange } from '../../types';
import { ScreenHeader } from '../common/ScreenHeader';
import { LivePill } from '../beds/LivePill';
import { StatCard } from '../beds/StatCard';
import { RequestBedDialog } from '../beds/RequestBedDialog';
import { CoordinationQueue } from '../agents/CoordinationQueue';
import { AgentStatusTable } from '../agents/AgentStatusTable';
import { DecisionsLog } from '../agents/DecisionsLog';
import { CaseDetail } from '../agents/CaseDetail';
import { WorkflowDiagram, LEG_MS, type DiagramPulse } from '../agents/WorkflowDiagram';
import { ApprovalsList } from '../agents/ApprovalsList';
import { RulesPanel } from '../agents/RulesPanel';
import { AskBox } from '../agents/AskBox';

const RANGES: { id: SnapshotRange; label: string }[] = [
  { id: '24h', label: 'Last 24 hours' },
  { id: '7d', label: 'Last 7 days' }
];
const LOG_LIMIT = 50;
/** Dots on the diagram at once; more are dropped (the lists still show every message). */
const MAX_PULSES = 6;
const CARD_FIELD: Record<CoordinatorCardKey, keyof Omit<CoordinatorSeriesPoint, 'at'>> = {
  activeWorkflows: 'activeWorkflows',
  agentsCoordinated: 'agentsOnline',
  tasksRouted: 'tasksToday',
  escalations: 'escalations'
};

/** Hourly points as 4-hour averages (gaps skipped); null for a bucket with no data. */
function bucket(points: CoordinatorSeriesPoint[], field: keyof Omit<CoordinatorSeriesPoint, 'at'>): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < points.length; i += 4) {
    const known = points.slice(i, i + 4).map((p) => p[field]).filter((v): v is number => typeof v === 'number');
    out.push(known.length ? known.reduce((a, b) => a + b, 0) / known.length : null);
  }
  return out;
}

/** The Coordinator: what it routed, what is open, how each agent is doing, and any case in detail. */
export const CoordinatorScreen: React.FC = () => {
  const { user, showToast, refreshAlertCount } = useApp();
  const role = user?.role ?? '';
  const [pulses, setPulses] = useState<DiagramPulse[]>([]);
  const pulseSeq = useRef(0);
  const onEvent = useCallback((event: CoordinatorEvent) => {
    if (event.kind !== 'message' || !event.from || !event.to?.length) return;
    const from = event.from;
    const fresh = event.to.map((to) => ({ id: `p${++pulseSeq.current}`, from, to }));
    setPulses((prev) => [...prev, ...fresh].slice(-MAX_PULSES));
    // A dot takes up to two legs; clear it from the list shortly after.
    window.setTimeout(() => setPulses((prev) => prev.filter((p) => !fresh.some((f) => f.id === p.id))), LEG_MS * 2 + 200);
  }, []);
  const { version, live } = useCoordinatorStream({ onEvent });
  const { overview, error } = useCoordinatorOverview(version);
  const fetchOpen = useCallback(() => coordinatorService.messages({ openWork: true }), []);
  const fetchLog = useCallback(() => coordinatorService.messages({ limit: LOG_LIMIT }), []);
  const open = useCoordinatorList(fetchOpen, version);
  const log = useCoordinatorList(fetchLog, version);
  // 24 hours uses each card's own sparkline; 7 days uses the hourly history in 4-hour averages. Trend % stays the 24 h one.
  const [range, setRange] = useState<SnapshotRange>('24h');
  const [week, setWeek] = useState<CoordinatorSeriesPoint[] | null>(null);
  const [weekFailed, setWeekFailed] = useState(false);
  const hasWeek = useRef(false);
  useEffect(() => {
    if (range !== '7d') return;
    let alive = true;
    const timer = window.setTimeout(
      () => {
        coordinatorService
          .snapshots('7d')
          .then((r) => {
            if (!alive) return;
            hasWeek.current = true;
            setWeek(r.points);
            setWeekFailed(false);
          })
          .catch(() => alive && setWeekFailed(true));
      },
      hasWeek.current ? 300 : 0
    );
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [range, version]);
  const card = (key: CoordinatorCardKey): CoordinatorCardData | undefined => {
    const base = overview?.cards[key];
    if (!base || range !== '7d' || !week || weekFailed) return base;
    return { ...base, spark: bucket(week, CARD_FIELD[key]) };
  };
  const [caseId, setCaseId] = useState<string | null>(null);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [prefill, setPrefill] = useState<{ id: string; uhid: string } | undefined>(undefined);
  const caseRef = useRef<HTMLDivElement>(null);

  const canRequest = REQUEST_ROLES.includes(role);
  useEffect(() => {
    if (!canRequest) return;
    let alive = true;
    coordinatorService
      .requestTypes()
      .then((types) => alive && setRequestTypes(types))
      .catch(() => alive && setRequestTypes([]));
    return () => {
      alive = false;
    };
  }, [canRequest]);

  const openCase = (id: string) => {
    setCaseId(id);
    // Stacked layout: the case sits below, so bring it into view.
    if (window.matchMedia('(max-width: 1100px)').matches) {
      window.requestAnimationFrame(() => caseRef.current?.scrollIntoView({ block: 'nearest' }));
    }
  };
  const cards = overview?.cards;

  const content = (
    <div className="bagent-overview co-body">
      {error && overview && (
        <p className="bagent-banner" role="alert">
          Showing the last figures loaded. {error}
        </p>
      )}
      {range === '7d' && weekFailed && <p className="co-note">7-day history unavailable</p>}
      {cards ? (
        <div className="cols-4 bagent-grid">
          <StatCard icon={Workflow} tone="blue" title="Active workflows" data={card('activeWorkflows') ?? cards.activeWorkflows} />
          <StatCard icon={Network} tone="green" title="Agents coordinated" data={{ ...(card('agentsCoordinated') ?? cards.agentsCoordinated), total: cards.agentsCoordinated.total ?? 9 }} />
          <StatCard icon={Route} tone="purple" title="Tasks routed today" data={card('tasksRouted') ?? cards.tasksRouted} />
          <StatCard icon={ShieldAlert} tone="red" title="Escalations" data={card('escalations') ?? cards.escalations} goodWhenUp={false} />
        </div>
      ) : (
        <div className="medios-card data-empty" role={error ? 'alert' : undefined}>
          {error ?? 'Loading the Coordinator…'}
        </div>
      )}

      <div className="cols-3 bagent-grid co-trio" style={cols('minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr)')}>
        <CoordinationQueue
          messages={open.items}
          loaded={!open.loading}
          error={open.error}
          selectedCaseId={caseId}
          onOpenCase={openCase}
          requestTypes={canRequest ? requestTypes : []}
          onNewRequest={() => {
            setPrefill(undefined);
            setRequesting(true);
          }}
        />
        <section className="medios-card bagent-card co-card" aria-label="Workflow diagram">
          <div className="card-header-row">
            <h3 className="card-title">Workflow diagram</h3>
          </div>
          {overview ? (
            <WorkflowDiagram agents={overview.agents} pulses={pulses} />
          ) : (
            <p className="data-empty" role={error ? 'alert' : undefined}>
              {error ?? 'Loading the diagram…'}
            </p>
          )}
        </section>
        <div className="co-stack">
          <AgentStatusTable agents={overview?.agents ?? null} error={error} />
          <RulesPanel version={version} />
        </div>
      </div>

      <div className="cols-2 bagent-grid bagent-pair-always">
        <DecisionsLog messages={log.items} loaded={!log.loading} error={log.error} selectedCaseId={caseId} onOpenCase={openCase} />
        <ApprovalsList version={version} onOpenCase={openCase} />
      </div>

      <AskBox
        onOpenCase={openCase}
        onOpenRequestForm={(patient) => {
          setPrefill(patient);
          setRequesting(true);
        }}
      />
    </div>
  );

  return (
    <div className="page-scroll-body bagent">
      <ScreenHeader
        title="Coordinator Agent"
        badge={<LivePill live={live} />}
        subtitle="Routes work between the agents, watches every deadline and escalates when something is stuck."
        actions={
          <select className="form-select co-range" aria-label="Time range" value={range} onChange={(e) => setRange(e.target.value as SnapshotRange)}>
            {RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        }
      />

      {caseId ? (
        <div className="split bagent-split co-split" style={split('minmax(320px, 380px)')}>
          {content}
          <div ref={caseRef} className="bagent-detail">
            <CaseDetail key={caseId} caseId={caseId} version={version} onClose={() => setCaseId(null)} />
          </div>
        </div>
      ) : (
        content
      )}

      {requesting && (
        <RequestBedDialog
          initialPatient={prefill}
          onClose={() => {
            setRequesting(false);
            setPrefill(undefined);
          }}
          onSubmitted={(r) => {
            followRequest(r.id, { showToast, refreshAlertCount }, r.patientName);
            open.reload();
            log.reload();
          }}
        />
      )}
    </div>
  );
};
