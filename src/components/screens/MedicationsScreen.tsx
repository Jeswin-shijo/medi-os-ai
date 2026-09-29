import React, { useRef, useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { PatientBanner, BannerTab } from '../layout/PatientBanner';
import { ScreenHeader } from '../common/ScreenHeader';
import { AiSparkle } from '../common/icons';
import { mockPrescriptionItems, mockAdherenceData } from '../../mock/prescriptionsData';
import { PrescriptionItem } from '../../types';
import {
  createLucideIcon,
  Plus,
  Search,
  Printer,
  Download,
  PenLine,
  EllipsisVertical,
  CircleCheck,
  CircleChevronDown,
  CalendarDays,
  ChevronDown,
  ClipboardPen,
  Timer,
  FileSpreadsheet,
  Landmark,
  SquareActivity,
  Anchor,
  Files,
  Clock,
  ShieldCheck,
  FileText,
  CircleDot,
  FileClock,
  Pause,
  Play,
  CircleStop,
  CheckCheck,
  Check,
  type LucideIcon
} from 'lucide-react';

/** Two crossed capsules — the "Medications" tab icon in the design. */
const CapsuleCross = createLucideIcon('capsule-cross', [
  ['rect', { x: '9', y: '2.5', width: '6', height: '19', rx: '3', key: 'v' }],
  ['rect', { x: '2.5', y: '9', width: '19', height: '6', rx: '3', key: 'h' }]
]);

type MedStatus = PrescriptionItem['status'];
type MedTab = 'Active' | 'Paused' | 'Stopped' | 'Completed';
type AiTab = 'Suggestions' | 'Interactions' | 'Dose Adjustments' | 'Guidelines';

const MED_TABS: BannerTab[] = [
  { id: 'emr', label: 'Clinical Notes', icon: ClipboardPen, screen: 'emr' },
  { id: 'vitals', label: 'Vitals', icon: Timer, screen: 'vitals' },
  { id: 'lab-reports', label: 'Lab Reports', icon: FileSpreadsheet, screen: 'lab-reports' },
  { id: 'imaging', label: 'Imaging', icon: Landmark, screen: 'imaging' },
  { id: 'prescriptions', label: 'Prescriptions', icon: SquareActivity, screen: 'prescriptions' },
  { id: 'medications', label: 'Medications', icon: CapsuleCross },
  { id: 'drug-interactions', label: 'Drug Interactions', icon: Anchor },
  { id: 'adherence', label: 'Adherence', icon: CircleCheck },
  { id: 'documents', label: 'Documents', icon: Files, screen: 'documents' },
  { id: 'history', label: 'History', icon: Clock, screen: 'timeline' }
];

/** Display names as shown in the design (the shared prescription mock carries "Tab …" prefixes). */
const toDisplay = (m: PrescriptionItem): PrescriptionItem => {
  const name = m.medicine.replace(/^(Tab|Syp|Cap|Inj)\s+/, '');
  if (/levocetirizine/i.test(name)) return { ...m, medicine: 'Levocetirizine 5 mg', brand: 'Levocetirizine', dose: '5 mg' };
  if (/paracetamol/i.test(name)) return { ...m, medicine: name, frequency: 'SOS' };
  return { ...m, medicine: name };
};

const INDICATIONS: { label: string; filter: string; count: number; icon: LucideIcon }[] = [
  { label: 'Hypertension', filter: 'Hypertension', count: 2, icon: SquareActivity },
  { label: 'Type 2 Diabetes', filter: 'Type 2 Diabetes', count: 2, icon: ShieldCheck },
  { label: 'Hyperlipidemia', filter: 'Hyperlipidemia', count: 1, icon: FileText },
  { label: 'Gastric Protection', filter: 'Gastric Protection', count: 1, icon: CircleDot }
];

const SUMMARY_TILES: { key: MedTab; label: string; bg: string; fg: string }[] = [
  { key: 'Active', label: 'Active Medications', bg: '#e6f8ef', fg: 'var(--green-dark)' },
  { key: 'Paused', label: 'Paused', bg: '#fef5ea', fg: '#e07b1d' },
  { key: 'Stopped', label: 'Stopped', bg: '#fdf1f3', fg: 'var(--red-rose)' },
  { key: 'Completed', label: 'Completed', bg: '#eff4fd', fg: 'var(--blue-text)' }
];

const RECENT_CHANGES: { date: string; med: string; note: string; tone: 'green' | 'orange' }[] = [
  { date: '12 Sep 2026', med: 'Levocetirizine 5 mg', note: 'Paused (symptoms improved)', tone: 'orange' },
  { date: '12 Sep 2026', med: 'Amlodipine 5 mg', note: 'Started', tone: 'green' },
  { date: '12 Sep 2026', med: 'Metformin 500 mg', note: 'Started', tone: 'green' },
  { date: '12 Sep 2026', med: 'Atorvastatin 10 mg', note: 'Started', tone: 'green' }
];

const AI_CONTENT: Record<AiTab, { title: string; items: string[] }> = {
  Suggestions: {
    title: 'AI Suggestions for this Patient',
    items: [
      'Continue Amlodipine 5 mg for BP control.',
      'Metformin dose is appropriate based on HbA1c.',
      'Consider adding ACE inhibitor if albuminuria present.',
      'Monitor LFT for Atorvastatin.',
      'Add PPI only if gastric symptoms persist.',
      'Ensure patient adherence and lifestyle modification.'
    ]
  },
  Interactions: {
    title: 'Interaction Review',
    items: [
      'Amlodipine + Atorvastatin: minor, monitor for myalgia.',
      'Metformin + Pantoprazole: no clinically relevant interaction.',
      'Levocetirizine: avoid with alcohol or sedatives.',
      'No contraindication with Penicillin allergy.'
    ]
  },
  'Dose Adjustments': {
    title: 'Dose Adjustment Notes',
    items: [
      'Metformin: no renal adjustment needed (eGFR > 60).',
      'Amlodipine: consider 10 mg if BP stays above 140/90.',
      'Atorvastatin: titrate to 20 mg if LDL not at target.',
      'Paracetamol: max 3 g/day given liver monitoring.'
    ]
  },
  Guidelines: {
    title: 'Relevant Guidelines',
    items: [
      'ESC/ESH 2026: BP target below 130/80 mmHg.',
      'ADA 2026: HbA1c target below 7% for most adults.',
      'ACC/AHA: moderate-intensity statin for diabetes 40+.',
      'Review PPI need every 4-8 weeks.'
    ]
  }
};

const MONITORING = [
  'Monitor BP weekly',
  'Check HbA1c after 3 months',
  'LFT after 6 months (Atorvastatin)',
  'Review need for PPI after 4 weeks'
];

const statusPill = (s: MedStatus) =>
  s === 'Active' ? 'active' : s === 'Paused' ? 'paused' : s === 'Stopped' ? 'red' : 'gray';

const th: React.CSSProperties = { padding: '9px 6px', fontSize: 11, fontWeight: 600, background: 'var(--bg-subtle)' };
const td: React.CSSProperties = { padding: '7px 6px', fontSize: 11, color: 'var(--text-secondary)' };
const cardTitle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' };
const fieldIcon: React.CSSProperties = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' };
const compactField: React.CSSProperties = { height: 32, fontSize: 11.5 };

/** Donut ring used in the Medication Adherence card. */
const AdherenceRing: React.FC<{ rate: number; name: string }> = ({ rate, name }) => {
  const r = 27;
  const c = 2 * Math.PI * r;
  const low = rate < 75;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 64, height: 64 }}>
        <svg width={64} height={64} viewBox="0 0 64 64" aria-hidden="true">
          <circle cx={32} cy={32} r={r} fill="none" stroke={low ? 'var(--red-light)' : 'var(--green-light)'} strokeWidth={6.5} />
          <circle
            cx={32}
            cy={32}
            r={r}
            fill="none"
            stroke={low ? 'var(--red-rose)' : 'var(--green-emerald)'}
            strokeWidth={6.5}
            strokeDasharray={`${(rate / 100) * c} ${c}`}
            transform="rotate(-90 32 32)"
          />
        </svg>
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 600 }}>
          {rate}%
        </span>
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>{name}</span>
    </div>
  );
};

export const MedicationsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [meds, setMeds] = useState<PrescriptionItem[]>(() => mockPrescriptionItems.map(toDisplay));
  const [medTab, setMedTab] = useState<MedTab>('Active');
  const [bannerTab, setBannerTab] = useState('medications');
  const [aiTab, setAiTab] = useState<AiTab>('Suggestions');
  const [searchMed, setSearchMed] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [indicationFilter, setIndicationFilter] = useState('All Indications');
  const [prescriberFilter, setPrescriberFilter] = useState('All Prescribers');
  const [dateRange, setDateRange] = useState('');
  const [adherencePeriod, setAdherencePeriod] = useState('Last 30 Days');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [changes, setChanges] = useState(RECENT_CHANGES);
  const adherenceRef = useRef<HTMLDivElement>(null);

  // "Active" lists every current medication (active + paused), as in the design.
  const inTab = (m: PrescriptionItem, tab: MedTab) =>
    tab === 'Active' ? m.status === 'Active' || m.status === 'Paused' : m.status === tab;
  const countFor = (tab: MedTab) => meds.filter((m) => inTab(m, tab)).length;

  const filteredMeds = meds.filter((m) => {
    const q = searchMed.toLowerCase();
    const matchesSearch = !q || m.medicine.toLowerCase().includes(q) || (m.brand ?? '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All Status' || m.status === statusFilter;
    const matchesIndication = indicationFilter === 'All Indications' || m.indication === indicationFilter;
    return inTab(m, medTab) && matchesSearch && matchesStatus && matchesIndication;
  });

  const resetFilters = () => {
    setSearchMed('');
    setStatusFilter('All Status');
    setIndicationFilter('All Indications');
    setPrescriberFilter('All Prescribers');
    setDateRange('');
  };

  const updateStatus = (id: string, status: MedStatus) => {
    const med = meds.find((m) => m.id === id);
    setMeds((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    setMenuFor(null);
    if (!med) return;
    const note = status === 'Active' ? 'Resumed' : status === 'Paused' ? 'Paused' : status;
    setChanges((prev) => [{ date: 'Today', med: med.medicine, note, tone: status === 'Active' || status === 'Completed' ? ('green' as const) : ('orange' as const) }, ...prev].slice(0, 4));
    showToast(`${med.medicine} marked ${status.toLowerCase()}`);
  };

  const handleBannerTab = (id: string) => {
    setBannerTab(id);
    if (id === 'drug-interactions') {
      setAiTab('Interactions');
      showToast('Drug interaction review opened');
    } else if (id === 'adherence') {
      adherenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Medication adherence overview');
    }
  };

  const ai = AI_CONTENT[aiTab];

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="Medications"
        subtitle="View, manage and monitor patient medications"
        actions={
          <>
            <button className="btn-outline-blue" onClick={() => showToast('Medication reconciliation report matched')}>
              <CircleChevronDown size={17} />
              <span>Medication Reconciliation</span>
            </button>
            <button className="btn-primary" onClick={() => showToast('Add medication drawer opened')}>
              <Plus size={18} />
              <span>Add Medication</span>
            </button>
          </>
        }
      />

      <PatientBanner tabs={MED_TABS} activeTab={bannerTab} onTabChange={handleBannerTab} />

      <div style={{ display: 'grid', gridTemplateColumns: '252px minmax(0, 1fr) 354px', gap: 12, alignItems: 'stretch' }}>
        {/* Left column: summary, indications, filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div className="medios-card" style={{ padding: '14px 12px 12px' }}>
            <div style={{ ...cardTitle, marginBottom: 10 }}>Medication Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {SUMMARY_TILES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setMedTab(t.key)}
                  style={{
                    background: t.bg,
                    borderRadius: 8,
                    padding: '10px 12px',
                    minHeight: 76,
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    color: t.fg
                  }}
                >
                  <span style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.2 }}>{countFor(t.key)}</span>
                  <span style={{ fontSize: 12, lineHeight: 1.45, marginTop: 4 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="medios-card" style={{ padding: '12px 12px 6px' }}>
            <div style={{ ...cardTitle, fontSize: 13.5, marginBottom: 6 }}>Indications</div>
            {INDICATIONS.map((ind, i) => {
              const Icon = ind.icon;
              const active = indicationFilter === ind.filter;
              return (
                <button
                  key={ind.label}
                  onClick={() => setIndicationFilter(active ? 'All Indications' : ind.filter)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '0 10px',
                    height: 33,
                    fontSize: 11.5,
                    color: active ? 'var(--blue-text)' : 'var(--text-primary)',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={13} strokeWidth={2} />
                  <span style={{ flex: 1 }}>{ind.label}</span>
                  <span style={{ fontWeight: 500 }}>{ind.count}</span>
                </button>
              );
            })}
          </div>

          <div className="medios-card" style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={cardTitle}>Filters</span>
              <button className="text-link" onClick={resetFilters}>Reset</button>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ ...fieldIcon, left: 11 }} />
              <input
                type="text"
                className="input-field"
                style={{ ...compactField, paddingLeft: 32, fontSize: 11 }}
                placeholder="Search medication..."
                value={searchMed}
                onChange={(e) => setSearchMed(e.target.value)}
              />
            </div>
            {[
              { value: statusFilter, set: setStatusFilter, options: ['All Status', 'Active', 'Paused', 'Stopped', 'Completed'] },
              { value: indicationFilter, set: setIndicationFilter, options: ['All Indications', ...INDICATIONS.map((i) => i.filter), 'Allergic Rhinitis', 'Fever / Pain'] },
              { value: prescriberFilter, set: setPrescriberFilter, options: ['All Prescribers', 'Dr. Shajin', 'Dr. Priya', 'Dr. Ravi'] }
            ].map((f) => (
              <div key={f.options[0]} style={{ position: 'relative' }}>
                <select
                  className="form-select"
                  style={{ ...compactField, appearance: 'none', paddingRight: 30 }}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                >
                  {f.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ ...fieldIcon, right: 10, color: 'var(--text-primary)' }} />
              </div>
            ))}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                style={{ ...compactField, height: 36, paddingRight: 32 }}
                placeholder="Start Date - End Date"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              />
              <CalendarDays size={14} style={{ ...fieldIcon, right: 10, color: 'var(--text-secondary)' }} />
            </div>
          </div>
        </div>

        {/* Center column: current medications, adherence, recent changes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div className="medios-card" style={{ padding: '10px 12px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ fontSize: 'var(--fs-h2)', fontWeight: 700 }}>Current Medications</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-outline-blue" style={{ fontSize: 11.5, height: 34, padding: '0 12px' }} onClick={() => showToast('Medication list printed')}>
                  <Printer size={14} />
                  <span>Print Medication List</span>
                </button>
                <button className="btn-outline-blue" style={{ fontSize: 11.5, height: 34, padding: '0 12px' }} onClick={() => showToast('Medications exported')}>
                  <Download size={14} />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(['Active', 'Paused', 'Stopped', 'Completed'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`chip-btn ${medTab === tab ? 'active' : ''}`}
                  style={{ height: 34, padding: '0 14px', fontSize: 11.5 }}
                  onClick={() => setMedTab(tab)}
                >
                  {tab} ({countFor(tab)})
                </button>
              ))}
            </div>

            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'visible' }}>
              <table className="medios-table">
                <thead>
                  <tr>
                    <th style={{ ...th, width: 26, paddingLeft: 10, borderTopLeftRadius: 8 }}>#</th>
                    <th style={th}>Medicine / Brand</th>
                    <th style={th}>Dose</th>
                    <th style={th}>Frequency</th>
                    <th style={th}>Route</th>
                    <th style={th}>Indication</th>
                    <th style={th}>Start Date</th>
                    <th style={th}>Status</th>
                    <th style={{ ...th, width: 62, textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', borderTopRightRadius: 8 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeds.map((m, idx) => (
                    <tr key={m.id}>
                      <td style={{ ...td, paddingLeft: 10, color: 'var(--text-primary)' }}>{idx + 1}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)' }}>{m.medicine}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>{m.brand}</div>
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{m.dose}</td>
                      <td style={td}>{m.frequency}</td>
                      <td style={td}>{m.route}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{m.indication}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{m.startDate || '12 Sep 2026'}</td>
                      <td style={td}>
                        <span className={`status-pill ${statusPill(m.status)}`}>{m.status}</span>
                      </td>
                      <td style={{ ...td, borderLeft: '1px solid var(--border-subtle)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                          <button aria-label={`Edit ${m.medicine}`} style={{ color: 'var(--blue-text)', display: 'flex' }} onClick={() => showToast(`Edit ${m.medicine}`)}>
                            <PenLine size={15} />
                          </button>
                          <button aria-label="More actions" style={{ color: 'var(--text-primary)', display: 'flex' }} onClick={() => setMenuFor(menuFor === m.id ? null : m.id)}>
                            <EllipsisVertical size={15} />
                          </button>
                        </div>
                        {menuFor === m.id && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 20 }} onClick={() => setMenuFor(null)} />
                            <div
                              style={{
                                position: 'absolute',
                                right: 6,
                                top: 'calc(100% - 6px)',
                                zIndex: 21,
                                background: '#ffffff',
                                border: '1px solid var(--border-color)',
                                borderRadius: 8,
                                boxShadow: 'var(--shadow-md)',
                                padding: 4,
                                minWidth: 150
                              }}
                            >
                              {[
                                m.status === 'Paused'
                                  ? { label: 'Resume', icon: Play, status: 'Active' as const }
                                  : { label: 'Pause', icon: Pause, status: 'Paused' as const },
                                { label: 'Stop', icon: CircleStop, status: 'Stopped' as const },
                                { label: 'Mark Completed', icon: CheckCheck, status: 'Completed' as const }
                              ]
                                .filter((a) => a.status !== m.status)
                                .map((a) => (
                                  <button
                                    key={a.label}
                                    onClick={() => updateStatus(m.id, a.status)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', fontSize: 12, borderRadius: 6, textAlign: 'left' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    <a.icon size={13} />
                                    <span>{a.label}</span>
                                  </button>
                                ))}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredMeds.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ ...td, textAlign: 'center', padding: '28px 8px', color: 'var(--text-muted)' }}>
                        No {medTab.toLowerCase()} medications match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
            <div ref={adherenceRef} className="medios-card" style={{ padding: '10px 12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
                <span style={{ ...cardTitle, fontSize: 14.5 }}>Medication Adherence</span>
                <div style={{ position: 'relative' }}>
                  <select
                    className="form-select"
                    style={{ height: 29, width: 102, fontSize: 11, padding: '0 24px 0 9px', appearance: 'none' }}
                    value={adherencePeriod}
                    onChange={(e) => {
                      setAdherencePeriod(e.target.value);
                      showToast(`Adherence shown for ${e.target.value.toLowerCase()}`, 'info');
                    }}
                  >
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Last 90 Days</option>
                  </select>
                  <ChevronDown size={13} style={{ ...fieldIcon, right: 8, color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0' }}>
                {mockAdherenceData.map((adh) => (
                  <AdherenceRing key={adh.name} rate={adh.rate} name={adh.name} />
                ))}
              </div>
            </div>

            <div className="medios-card" style={{ padding: '10px 12px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ ...cardTitle, fontSize: 14 }}>Recent Changes</span>
                <button className="text-link" style={{ fontSize: 11.5, fontWeight: 400 }} onClick={() => showToast('Opening full medication change log', 'info')}>
                  View All
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 4, top: 10, bottom: 26, width: 1, background: 'var(--border-color)' }} />
                {changes.map((c, i) => (
                  <div key={`${c.med}-${c.note}-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 0, position: 'relative' }}>
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        marginTop: 4,
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: c.tone === 'orange' ? '#ffffff' : 'var(--green-emerald)',
                        border: c.tone === 'orange' ? '2.5px solid #ea8a1f' : 'none',
                        position: 'relative',
                        zIndex: 1
                      }}
                    >
                      {c.tone === 'green' && <Check size={6} color="#ffffff" strokeWidth={4} />}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: '80px 1fr',
                        marginLeft: 14,
                        paddingBottom: 7,
                        marginBottom: 6,
                        borderBottom: i === changes.length - 1 ? 'none' : '1px solid var(--border-subtle)'
                      }}
                    >
                      <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>{c.date}</span>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-primary)' }}>{c.med}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>{c.note}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: AI Medication Assistant */}
        <div className="ai-assistant-card" style={{ padding: '12px 12px', gap: 12 }}>
          <div className="ai-title-row" style={{ fontSize: 'var(--fs-h4)', gap: 12, paddingLeft: 4 }}>
            <AiSparkle size={20} />
            <span>AI Medication Assistant (GPT-6 Astro)</span>
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
            {(Object.keys(AI_CONTENT) as AiTab[]).map((t) => (
              <button
                key={t}
                className={`page-tab-btn ${aiTab === t ? 'active' : ''}`}
                style={{ height: 34, padding: '0 8px', fontSize: 11, flex: t === 'Dose Adjustments' ? '1.3 1 0' : '1 1 0', justifyContent: 'center', minWidth: 0 }}
                onClick={() => setAiTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ border: '1px solid #ece6fb', borderRadius: 8, overflow: 'hidden' }}>
            <div className="ai-section-title" style={{ background: 'var(--purple-light)', padding: '7px 10px', margin: 0, fontSize: 11 }}>
              <AiSparkle size={13} />
              <span>{ai.title}</span>
            </div>
            <div style={{ padding: '10px 12px 10px' }}>
              <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11.5, color: 'var(--text-primary)' }}>
                {ai.items.map((s, i) => (
                  <li key={s} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontWeight: 600, minWidth: 12 }}>{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn-primary" style={{ width: 190, height: 35, fontSize: 11.5 }} onClick={() => showToast('AI recommendations saved')}>
                  Apply Suggestions
                </button>
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid #ece6fb', borderRadius: 8, overflow: 'hidden' }}>
            <div className="ai-section-title" style={{ background: 'var(--purple-light)', padding: '7px 10px', margin: 0, fontSize: 11 }}>
              <AiSparkle size={13} />
              <span>Drug Interaction Check</span>
            </div>
            <div style={{ background: '#e9f8f1', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CircleCheck size={20} color="#ffffff" fill="var(--green-emerald)" strokeWidth={2.2} />
              <span style={{ flex: 1, fontSize: 11.5, color: 'var(--green-dark)' }}>No major drug interactions found.</span>
              <button className="btn-outline-blue" style={{ height: 31, fontSize: 11.5, padding: '0 12px' }} onClick={() => showToast('Full interaction database rechecked: Clear')}>
                Recheck
              </button>
            </div>
          </div>

          <div style={{ border: '1px solid #ece6fb', borderRadius: 8, overflow: 'hidden' }}>
            <div className="ai-section-title" style={{ background: 'var(--purple-light)', padding: '7px 10px', margin: 0, fontSize: 11 }}>
              <AiSparkle size={13} />
              <span>Monitoring &amp; Follow-up</span>
            </div>
            <div style={{ padding: '2px 12px 10px' }}>
              {MONITORING.map((item, i) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    height: 33,
                    fontSize: 11.5,
                    color: 'var(--text-primary)',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)'
                  }}
                >
                  <FileClock size={13} strokeWidth={2} />
                  <span>{item}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <button className="btn-outline-blue" style={{ height: 32, fontSize: 11.5, padding: '0 16px' }} onClick={() => showToast('Items scheduled in Follow-ups calendar')}>
                  Add to Follow-up
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
