import React, { useId, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { useLab } from '../../hooks/useLab';
import { useLabWorklist } from '../../hooks/useLabWorklist';
import { LAB_TAB_KEY, canAckLab, canBenchLab, canCollectLab, canOrderLab, canReadLab } from '../../utils/lab';
import type { LabRequestView } from '../../types';
import { ScreenHeader } from '../common/ScreenHeader';
import { LivePill } from '../beds/LivePill';
import { LabOverview } from '../lab/LabOverview';
import { LabOrders } from '../lab/LabOrders';
import { LabCollection } from '../lab/LabCollection';
import { LabLabels } from '../lab/LabLabels';
import { LabProcessing } from '../lab/LabProcessing';
import { LabResults } from '../lab/LabResults';
import { LabCritical } from '../lab/LabCritical';
import { NewLabOrderDialog } from '../lab/NewLabOrderDialog';

type Tab = 'overview' | 'orders' | 'collection' | 'processing' | 'results' | 'critical';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'collection', label: 'Collection' },
  { id: 'processing', label: 'Processing' },
  { id: 'results', label: 'Results' },
  { id: 'critical', label: 'Critical' }
];

const TAB_KEY = LAB_TAB_KEY;
const readTab = (): Tab => {
  try {
    const saved = sessionStorage.getItem(TAB_KEY);
    return TABS.some((t) => t.id === saved) ? (saved as Tab) : 'overview';
  } catch {
    return 'overview';
  }
};

/** The Lab Agent: orders, sample collection, testing, validation and critical results. */
export const LabAgentScreen: React.FC = () => {
  const { user } = useApp();
  const role = user?.role ?? '';
  if (!canReadLab(role)) {
    return (
      <div className="page-scroll-body bagent">
        <section className="medios-card" role="alert">
          <p className="data-empty">You don&apos;t have access to the Lab Agent.</p>
        </section>
      </div>
    );
  }
  return <LabAgentPage role={role} />;
};

const LabAgentPage: React.FC<{ role: string }> = ({ role }) => {
  const lab = useLab();
  const { refreshAlertCount } = useApp();
  const [tab, setTabState] = useState<Tab>(readTab);
  const canBench = canBenchLab(role);
  const bench = useLabWorklist(lab.requests, canBench && (tab === 'processing' || tab === 'results'));
  // After an action of this person's own: the Lab lists reload and the header bell recounts (criticals and acknowledgements move it).
  const changed = () => {
    lab.reload();
    void refreshAlertCount();
  };
  const tabsId = useId();
  const newOrderRef = useRef<HTMLButtonElement>(null);
  const [ordering, setOrdering] = useState(false);
  const [printing, setPrinting] = useState<{ id: string; number: string } | null>(null);
  const printRequest = (r: LabRequestView) => setPrinting({ id: r.id, number: r.number });
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  const setTab = (next: Tab) => {
    setTabState(next);
    try {
      sessionStorage.setItem(TAB_KEY, next);
    } catch {
      // Not remembered; the tabs still work.
    }
  };
  const onTabKey = (e: React.KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : step ? (index + step + TABS.length) % TABS.length : -1;
    if (to < 0) return;
    e.preventDefault();
    setTab(TABS[to].id);
    tabRefs.current[TABS[to].id]?.focus();
  };

  return (
    <div className="page-scroll-body bagent lab-screen">
      <ScreenHeader
        title="Lab Agent"
        badge={<LivePill live={lab.live} />}
        subtitle="Coordinates lab orders, sample collection, testing, result validation and reporting."
        actions={
          canOrderLab(role) && (
            <button ref={newOrderRef} type="button" className="btn-primary" onClick={() => setOrdering(true)}>
              <Plus size={15} aria-hidden="true" />
              New order
            </button>
          )
        }
      />

      <div className="page-tabs" role="tablist" aria-label="Lab Agent views">
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
        {tab === 'overview' ? (
          <LabOverview
            overview={lab.overview}
            requests={lab.requests}
            collection={lab.collection}
            critical={lab.critical}
            error={lab.error}
            lastEvent={lab.lastEvent}
            onRetry={lab.reload}
            onSeeCollection={() => setTab('collection')}
          />
        ) : tab === 'orders' ? (
          <LabOrders refresh={lab.requests} onChanged={lab.reload} onPrint={printRequest} />
        ) : tab === 'collection' ? (
          <LabCollection collection={lab.collection} error={lab.error} canCollect={canCollectLab(role)} onRetry={lab.reload} onChanged={lab.reload} onPrint={(r) => setPrinting(r)} />
        ) : tab === 'processing' ? (
          <LabProcessing canBench={canBench} worklist={bench.worklist} error={bench.error} onRetry={bench.retry} onChanged={changed} />
        ) : tab === 'results' ? (
          <LabResults canBench={canBench} worklist={bench.worklist} requests={lab.requests} error={bench.error} onRetry={bench.retry} onChanged={changed} />
        ) : (
          <LabCritical rows={lab.critical} requests={lab.requests} error={lab.error} canAck={canAckLab(role)} onRetry={lab.reload} onChanged={changed} />
        )}
      </div>

      {ordering && (
        <NewLabOrderDialog
          canPrint={canCollectLab(role)}
          onClose={() => setOrdering(false)}
          onOrdered={() => lab.reload()}
          onPrint={(r) => {
            // The order dialog closes and the label sheet opens; Orders keeps its own Print labels button.
            setOrdering(false);
            printRequest(r);
          }}
        />
      )}
      {printing && <LabLabels requestId={printing.id} requestNumber={printing.number} onClose={() => {
        setPrinting(null);
        // Labels opened from the order dialog have no button to return to: go back to New order.
        window.requestAnimationFrame(() => {
          if (!document.activeElement || document.activeElement === document.body) newOrderRef.current?.focus();
        });
      }} />}
    </div>
  );
};
