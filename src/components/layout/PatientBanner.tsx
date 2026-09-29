import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/appContextCore';
import {
  ChevronRight,
  Phone,
  Mars,
  Venus,
  ClipboardList
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { AllergyIcon } from '../common/icons';
import { ConditionBadge } from '../common/ConditionBadge';
import { CLINICAL_TABS, type BannerTab } from './patientTabs';

export type { BannerTab };

export interface BannerMetric {
  label: string;
  value?: React.ReactNode;
  sub?: React.ReactNode;
}

interface PatientBannerProps {
  /** Right-hand metric cells. Defaults to Last Visit / Next Appointment / Department. */
  metrics?: BannerMetric[];
  /** Replaces the default "Patient Summary" button; pass null to hide it. */
  action?: React.ReactNode | null;
  /** Extra content rendered after the metric cells (e.g. a Consultation Type select). */
  extra?: React.ReactNode;
  tabs?: BannerTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  /** @deprecated use activeTab */
  currentSubtab?: string;
  showSubtabs?: boolean;
}

export const PatientBanner: React.FC<PatientBannerProps> = ({
  metrics,
  action,
  extra,
  tabs = CLINICAL_TABS,
  activeTab,
  onTabChange,
  currentSubtab,
  showSubtabs = true
}) => {
  const { activePatient, activeScreen, setActiveScreen } = useApp();
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollTabs, setCanScrollTabs] = useState(false);

  // Show the "›" affordance (as in the Consultation design) only while tabs overflow.
  useEffect(() => {
    const bar = tabsRef.current;
    if (!bar) return;
    const update = () => setCanScrollTabs(bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    bar.addEventListener('scroll', update);
    return () => {
      observer.disconnect();
      bar.removeEventListener('scroll', update);
    };
  }, [tabs, showSubtabs, activePatient]);

  if (!activePatient) return null;

  const [nextDate, ...nextTimeParts] = (activePatient.nextAppointment ?? '').split(/\s(?=\d{1,2}:\d{2})/);
  const cells: BannerMetric[] = metrics ?? [
    { label: 'Last Visit', value: activePatient.lastVisit },
    { label: 'Next Appointment', value: nextDate || '—', sub: nextTimeParts.join(' ') || undefined },
    { label: 'Department', value: activePatient.department }
  ];

  const selectedTab = (activeTab ?? currentSubtab ?? activeScreen).toLowerCase();
  const GenderIcon = activePatient.gender === 'Female' ? Venus : Mars;

  const handleTabClick = (tab: BannerTab) => {
    if (tab.screen && tab.screen !== activeScreen) {
      setActiveScreen(tab.screen);
    } else {
      onTabChange?.(tab.id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="patient-banner-card">
        {/* Identity */}
        <div className="patient-banner-left">
          <div className="patient-avatar-box">
            <Avatar name={activePatient.name} size={84} radius="44%" />
          </div>

          <div className="patient-info-meta">
            <h3>
              <span>{activePatient.name}</span>
              <GenderIcon size={18} strokeWidth={2.25} color={activePatient.gender === 'Female' ? '#db2777' : '#1a4fd6'} />
            </h3>
            <div className="patient-meta-sub">
              <span>{activePatient.age} years</span>
              <span className="patient-meta-sep" />
              <span>{activePatient.gender}</span>
              <span className="patient-meta-sep" />
              <span>UHID: {activePatient.uhid}</span>
            </div>
            <div className="patient-meta-phone">
              <Phone size={12} fill="currentColor" strokeWidth={0} />
              <span>{activePatient.phone}</span>
            </div>

            <div className="patient-badges-row">
              {activePatient.conditions.map((c) => <ConditionBadge key={c} condition={c} />)}
              {activePatient.allergies.map((allergy) => (
                <span key={allergy} className="badge-tag allergy">
                  <AllergyIcon />
                  <span>{allergy.startsWith('Allergy') ? allergy : `Allergy: ${allergy}`}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Metrics + action */}
        <div className="patient-banner-right">
          <div className="patient-banner-metrics">
            {cells.map((cell) => (
              <div key={cell.label} className="metric-column">
                <span className="metric-label">{cell.label}</span>
                {cell.value !== undefined && <span className="metric-value">{cell.value}</span>}
                {cell.sub && <span className="metric-sub">{cell.sub}</span>}
              </div>
            ))}
            {extra}
          </div>

          {action === undefined ? (
            <button className="btn-outline-blue patient-banner-action" onClick={() => setActiveScreen('patients')}>
              <ClipboardList size={18} />
              <span>Patient Summary</span>
            </button>
          ) : (
            action
          )}
        </div>
      </div>

      {showSubtabs && tabs.length > 0 && (
        <div className="subtabs-wrap">
          <div className="secondary-subtabs-bar" ref={tabsRef}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`subtab-pill-btn ${selectedTab === tab.id.toLowerCase() ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab)}
                >
                  <Icon size={15} strokeWidth={1.9} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          {canScrollTabs && (
            <button
              className="subtabs-scroll-btn"
              aria-label="More tabs"
              onClick={() => tabsRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
