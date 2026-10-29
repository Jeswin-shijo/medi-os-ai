import React, { useId, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { useLab } from '../../hooks/useLab';
import { canOrderLab, canReadLab } from '../../utils/lab';
import { ScreenHeader } from '../common/ScreenHeader';
import { LivePill } from '../beds/LivePill';
import { LabOverview } from '../lab/LabOverview';

type Tab = 'overview' | 'orders' | 'collection' | 'processing' | 'results' | 'critical';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'collection', label: 'Collection' },
  { id: 'processing', label: 'Processing' },
  { id: 'results', label: 'Results' },
  { id: 'critical', label: 'Critical' }
];

const TAB_KEY = 'mediosLabTab';
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
  const [tab, setTabState] = useState<Tab>(readTab);
  const tabsId = useId();
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
            // Ordering opens here in the next step.
            <button type="button" className="btn-primary">
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
        ) : (
          <section className="medios-card lab-next" aria-label="Comes next">
            <h3 className="card-title">Comes next</h3>
            <p className="data-empty">The {TABS.find((t) => t.id === tab)?.label} tab is not built yet. It arrives in the next steps of the Lab Agent.</p>
          </section>
        )}
      </div>
    </div>
  );
};
