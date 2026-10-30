import React, { useId, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { usePharmacy } from '../../hooks/usePharmacy';
import { PHARMACY_TAB_KEY, canCheckPharmacy, canOrderPharmacy, canReadPharmacy } from '../../utils/pharmacy';
import { ScreenHeader } from '../common/ScreenHeader';
import { LivePill } from '../beds/LivePill';
import { NewMedicineOrderDialog } from '../pharmacy/NewMedicineOrderDialog';
import { PharmacyCheckQueue } from '../pharmacy/PharmacyCheckQueue';
import { PharmacyOverview } from '../pharmacy/PharmacyOverview';

type Tab = 'overview' | 'to-check' | 'to-issue' | 'queries' | 'stock';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'to-check', label: 'To check' },
  { id: 'to-issue', label: 'To issue' },
  { id: 'queries', label: 'Queries' },
  { id: 'stock', label: 'Stock' }
];

const readTab = (): Tab => {
  try {
    const saved = sessionStorage.getItem(PHARMACY_TAB_KEY);
    return TABS.some((t) => t.id === saved) ? (saved as Tab) : 'overview';
  } catch {
    return 'overview';
  }
};

/** The Pharmacy Agent: medicine orders, checks, issue, queries and stock. */
export const PharmacyAgentScreen: React.FC = () => {
  const { user } = useApp();
  if (!canReadPharmacy(user?.role ?? '')) {
    return (
      <div className="page-scroll-body bagent">
        <section className="medios-card" role="alert">
          <p className="data-empty">You don&apos;t have access to the Pharmacy Agent.</p>
        </section>
      </div>
    );
  }
  return <PharmacyAgentPage />;
};

const PharmacyAgentPage: React.FC = () => {
  const pharmacy = usePharmacy();
  const { user } = useApp();
  const role = user?.role ?? '';
  const [ordering, setOrdering] = useState(false);
  const [tab, setTabState] = useState<Tab>(readTab);
  const tabsId = useId();
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  const setTab = (next: Tab) => {
    setTabState(next);
    try {
      sessionStorage.setItem(PHARMACY_TAB_KEY, next);
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
        title="Pharmacy Agent"
        badge={<LivePill live={pharmacy.live} />}
        subtitle="Checks medicine orders for allergy, clashes, dose and kidney function, queues them for the pharmacist and issues them from stock."
        actions={
          canOrderPharmacy(role) && (
            <button type="button" className="btn-primary" onClick={() => setOrdering(true)}>
              <Plus size={15} aria-hidden="true" />
              New order
            </button>
          )
        }
      />

      <div className="page-tabs" role="tablist" aria-label="Pharmacy Agent views">
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
          <PharmacyOverview overview={pharmacy.overview} orders={pharmacy.orders} orderLimit={pharmacy.orderLimit} error={pharmacy.error} lastEvent={pharmacy.lastEvent} onRetry={pharmacy.reload} />
        ) : tab === 'to-check' ? (
          <PharmacyCheckQueue lines={pharmacy.check} error={pharmacy.error} canCheck={canCheckPharmacy(role)} onRetry={pharmacy.reload} onChanged={pharmacy.reload} />
        ) : (
          <section className="medios-card">
            <p className="data-empty">Comes next.</p>
          </section>
        )}
      </div>

      {ordering && <NewMedicineOrderDialog onClose={() => setOrdering(false)} onOrdered={() => pharmacy.reload()} />}
    </div>
  );
};
