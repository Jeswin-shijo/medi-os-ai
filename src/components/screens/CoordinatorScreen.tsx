import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Network, Route, ShieldAlert, Workflow } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { coordinatorService } from '../../services';
import { useCoordinatorList, useCoordinatorOverview, useCoordinatorStream } from '../../hooks/useCoordinator';
import { REQUEST_ROLES, followRequest } from '../../utils/beds';
import { cols, split } from '../../utils/layout';
import type { RequestType, SnapshotRange } from '../../types';
import { ScreenHeader } from '../common/ScreenHeader';
import { LivePill } from '../beds/LivePill';
import { StatCard } from '../beds/StatCard';
import { RequestBedDialog } from '../beds/RequestBedDialog';
import { CoordinationQueue } from '../agents/CoordinationQueue';
import { AgentStatusTable } from '../agents/AgentStatusTable';
import { DecisionsLog } from '../agents/DecisionsLog';
import { CaseDetail } from '../agents/CaseDetail';

const RANGES: { id: SnapshotRange; label: string }[] = [
  { id: '24h', label: 'Last 24 hours' },
  { id: '7d', label: 'Last 7 days' }
];
const LOG_LIMIT = 50;

/** The Coordinator: what it routed, what is open, how each agent is doing, and any case in detail. */
export const CoordinatorScreen: React.FC = () => {
  const { user, showToast, refreshAlertCount } = useApp();
  const role = user?.role ?? '';
  const { version, live } = useCoordinatorStream();
  const { overview, error } = useCoordinatorOverview(version);
  const fetchOpen = useCallback(() => coordinatorService.messages({ openWork: true }), []);
  const fetchLog = useCallback(() => coordinatorService.messages({ limit: LOG_LIMIT }), []);
  const open = useCoordinatorList(fetchOpen, version);
  const log = useCoordinatorList(fetchLog, version);
  // Changing the range will switch the diagram's counts once it lands; the cards always show the last 24 hours.
  const [range, setRange] = useState<SnapshotRange>('24h');
  const [caseId, setCaseId] = useState<string | null>(null);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [requesting, setRequesting] = useState(false);
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
      {cards ? (
        <div className="cols-4 bagent-grid">
          <StatCard icon={Workflow} tone="blue" title="Active workflows" data={cards.activeWorkflows} />
          <StatCard icon={Network} tone="green" title="Agents coordinated" data={{ ...cards.agentsCoordinated, total: cards.agentsCoordinated.total ?? 9 }} />
          <StatCard icon={Route} tone="purple" title="Tasks routed today" data={cards.tasksRouted} />
          <StatCard icon={ShieldAlert} tone="red" title="Escalations" data={cards.escalations} goodWhenUp={false} />
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
          onNewRequest={() => setRequesting(true)}
        />
        <section className="medios-card bagent-card co-card co-slot" aria-label="Workflow diagram">
          <div className="card-header-row">
            <h3 className="card-title">Workflow diagram</h3>
          </div>
          <p className="data-empty">The agent diagram arrives in the next update.</p>
        </section>
        <AgentStatusTable agents={overview?.agents ?? null} error={error} />
      </div>

      <div className="cols-2 bagent-grid bagent-pair-always">
        <DecisionsLog messages={log.items} loaded={!log.loading} error={log.error} selectedCaseId={caseId} onOpenCase={openCase} />
        <section className="medios-card bagent-card co-card co-slot" aria-label="Approvals">
          <div className="card-header-row">
            <h3 className="card-title">Approvals</h3>
          </div>
          <p className="data-empty">Approvals arrive in the next update.</p>
        </section>
      </div>
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
          onClose={() => setRequesting(false)}
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
