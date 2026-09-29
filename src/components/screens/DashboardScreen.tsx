import React, { useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { ScreenId } from '../../types';
import { Avatar } from '../common/Avatar';
import { AiSparkle } from '../common/icons';
import {
  createLucideIcon,
  Users,
  UsersRound,
  FileText,
  FlaskConical,
  ImageIcon,
  ReceiptIndianRupee,
  ReceiptText,
  Send,
  Mic,
  EllipsisVertical,
  ChevronDown,
  ArrowUpRight,
  TriangleAlert,
  Pill,
  Clock,
  DatabaseBackup,
  ClipboardList,
  ShieldPlus,
  UserRoundSearch,
  CalendarClock,
  UserRoundPlus,
  CalendarDays,
  Folder,
  type LucideIcon
} from 'lucide-react';

/** "Rx" prescription glyph (not in Lucide). */
const RxIcon = createLucideIcon('rx', [
  ['path', { d: 'M6 20V4h5a4 4 0 0 1 0 8H6', key: 'r' }],
  ['path', { d: 'M10 12l9 9', key: 'leg' }],
  ['path', { d: 'M19 14l-7 7', key: 'x' }]
]);

// Tints sampled from the design (tile background / icon colour per KPI).
const TINTS = {
  blue: { tile: '#dadffc', icon: '#1f4fe0' },
  green: { tile: '#d2f2e6', icon: '#139a63' },
  red: { tile: '#fcdce3', icon: '#dc2238' },
  sky: { tile: '#d2e3fc', icon: '#1a5ce6' },
  orange: { tile: '#fde6cc', icon: '#e8590c' },
  purple: { tile: '#ecd9fd', icon: '#a12fd6' }
} as const;

type Tint = keyof typeof TINTS;

const KPIS: { tint: Tint; icon: LucideIcon; label: string; value: string; sub: React.ReactNode }[] = [
  { tint: 'blue', icon: Users, label: "Today's Appointments", value: '18', sub: '12 Completed  •  6 Pending' },
  {
    tint: 'green',
    icon: UsersRound,
    label: 'Total Patients',
    value: '124',
    sub: (
      <span style={{ color: 'var(--green-dark)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        +12 new today <ArrowUpRight size={13} />
      </span>
    )
  },
  { tint: 'red', icon: FileText, label: 'Consultations', value: '16', sub: '4 AI Notes Generated' },
  { tint: 'sky', icon: FlaskConical, label: 'Lab Reports', value: '28', sub: '5 Pending' },
  { tint: 'orange', icon: ImageIcon, label: 'Imaging Reports', value: '12', sub: '3 Pending' },
  { tint: 'purple', icon: ReceiptIndianRupee, label: 'Billing (Today)', value: '₹ 24,850', sub: '21 Invoices' }
];

const SCHEDULE = [
  { time: '09:00 AM', name: 'Mary Jeni', reason: 'Follow-up • Hypertension', status: 'Consulting', pill: 'consulting', photo: true },
  { time: '09:30 AM', name: 'Antony Raj', reason: 'New Patient • Diabetes', status: 'Completed', pill: 'completed', photo: true },
  { time: '10:00 AM', name: 'Selvi P', reason: 'Follow-up • Thyroid', status: 'Consulting', pill: 'consulting', photo: true },
  { time: '10:30 AM', name: 'Ramesh Kumar', reason: 'New Patient • Chest Pain', status: 'Waiting', pill: 'waiting', photo: false },
  { time: '11:00 AM', name: 'Latha S', reason: 'Follow-up • Diabetes', status: 'Scheduled', pill: 'scheduled', photo: false },
  { time: '11:30 AM', name: 'Daniel', reason: 'New Patient • Fever', status: 'Scheduled', pill: 'scheduled', photo: false }
];

const RECENT_PATIENTS = [
  { name: 'Mary Jeni', age: 28, gender: 'Female', reason: 'Hypertension follow-up', time: '10:12 AM', photo: true },
  { name: 'Antony Raj', age: 45, gender: 'Male', reason: 'Diabetes management', time: '09:32 AM', photo: true },
  { name: 'Selvi P', age: 32, gender: 'Female', reason: 'Thyroid review', time: '09:10 AM', photo: true },
  { name: 'Rajesh Kumar', age: 52, gender: 'Male', reason: 'Chest pain evaluation', time: '08:45 AM', photo: false },
  { name: 'Latha S', age: 41, gender: 'Female', reason: 'Lab result review', time: '08:20 AM', photo: false },
  { name: 'Daniel', age: 36, gender: 'Male', reason: 'Fever and cold', time: '08:05 AM', photo: false, color: '#9b3fe0' }
];

type AlertFilter = 'all' | 'critical' | 'followups' | 'lab' | 'system';

const ALERTS: { id: string; title: string; sub: string; time: string; type: Exclude<AlertFilter, 'all'>; icon: LucideIcon; tint: Tint; timeColor?: string }[] = [
  { id: 'a1', title: 'High WBC count: 14,500', sub: 'Mary Jeni | CBC', time: '09:30 AM', type: 'critical', icon: TriangleAlert, tint: 'red' },
  { id: 'a2', title: 'Drug interaction alert', sub: 'Amlodipine + Ibuprofen | Antony Raj', time: '09:15 AM', type: 'critical', icon: Pill, tint: 'orange' },
  { id: 'a3', title: 'Follow-up due', sub: 'Diabetes review | Selvi P', time: 'Today', type: 'followups', icon: Clock, tint: 'orange', timeColor: 'var(--red-rose)' },
  { id: 'a4', title: 'Lab report pending', sub: 'CBC, LFT | 4 patients', time: 'Today', type: 'lab', icon: FlaskConical, tint: 'sky', timeColor: 'var(--red-rose)' },
  { id: 'a5', title: 'Imaging report pending', sub: 'Chest X-Ray | 2 patients', time: 'Today', type: 'lab', icon: FileText, tint: 'purple' },
  { id: 'a6', title: 'System auto-backup complete', sub: 'Cloud PACS Storage', time: '04:00 AM', type: 'system', icon: DatabaseBackup, tint: 'blue' }
];

const ALERT_CHIPS: { id: AlertFilter; label: string }[] = [
  { id: 'all', label: 'All (12)' },
  { id: 'critical', label: 'Critical (4)' },
  { id: 'followups', label: 'Follow-ups (5)' },
  { id: 'lab', label: 'Lab (2)' },
  { id: 'system', label: 'System (1)' }
];

const PROMPT_ROWS: { label: string; icon: LucideIcon; prompt: string }[][] = [
  [
    { label: 'Summarize this patient', icon: ClipboardList, prompt: 'Summarize this patient' },
    { label: 'Suggest treatment', icon: ShieldPlus, prompt: 'Suggest treatment plan' },
    { label: 'Check drug interaction', icon: Pill, prompt: 'Check drug interaction' }
  ],
  [
    { label: 'Create clinical note', icon: FileText, prompt: 'Create clinical note' },
    { label: 'Interpret lab report', icon: UserRoundSearch, prompt: 'Interpret lab report' },
    { label: 'Follow-up plan', icon: CalendarClock, prompt: 'Follow-up plan' }
  ]
];

const FLOW = [
  { label: 'Completed', value: 82, pct: 66, color: 'var(--chart-green)' },
  { label: 'In Consultation', value: 16, pct: 13, color: 'var(--chart-blue)' },
  { label: 'Waiting', value: 12, pct: 10, color: 'var(--chart-orange)' },
  { label: 'Scheduled', value: 14, pct: 11, color: 'var(--chart-gray)' }
];

const CONSULT_TYPES = [
  { label: 'General', count: 8, color: 'var(--chart-blue)' },
  { label: 'Follow-up', count: 5, color: 'var(--chart-sky)' },
  { label: 'Diabetes', count: 4, color: 'var(--chart-green)' },
  { label: 'Hypertension', count: 3, color: 'var(--chart-orange)', valueColor: 'var(--orange-dark)' },
  { label: 'Others', count: 2, color: 'var(--chart-purple)' }
];

const QUICK_ACTIONS: { label: string; icon: LucideIcon; screen: ScreenId }[] = [
  { label: 'New Consultation', icon: UserRoundPlus, screen: 'consultation' },
  { label: 'Create Prescription', icon: RxIcon, screen: 'prescriptions' },
  { label: 'Order Lab Test', icon: FlaskConical, screen: 'lab-reports' },
  { label: 'Order Imaging', icon: ImageIcon, screen: 'imaging' },
  { label: 'Generate\nClinical Note', icon: FileText, screen: 'voice-to-notes' },
  { label: 'Schedule\nFollow-up', icon: CalendarDays, screen: 'follow-ups' },
  { label: 'View Patient\nEMR', icon: Folder, screen: 'emr' },
  { label: 'Create Invoice', icon: ReceiptText, screen: 'billing' }
];

// Layout: the design fits the whole dashboard in one 1536x1024 viewport. Narrower
// windows fall back to fewer columns (scoped here so shared CSS stays untouched).
const LAYOUT_CSS = `
.dash-page { height: 100%; padding-bottom: 28px; }
.dash-kpis { grid-template-columns: 220fr 198fr 195fr 185fr 197fr 216fr; }
.dash-main {
  flex: 1; min-height: 716px; margin-top: 6px; display: grid; gap: var(--gap);
  grid-template-columns: minmax(0, 436fr) minmax(0, 390fr) minmax(0, 426fr);
  grid-template-rows: minmax(0, 1fr) auto;
}
.dash-right { grid-column: 3; grid-row: 1 / span 2; min-height: 0; display: flex; flex-direction: column; gap: 12px; }
.dash-flow { grid-column: 1; grid-row: 2; }
.dash-consult { grid-column: 2; grid-row: 2; }
@media (max-width: 1500px) { .dash-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 1360px) {
  .dash-page { height: auto; min-height: 100%; }
  .dash-main { flex: none; min-height: 0; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: auto; }
  .dash-right { grid-column: 1 / -1; grid-row: auto; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dash-right > :last-child { grid-column: 1 / -1; }
  .dash-flow, .dash-consult { grid-column: auto; grid-row: auto; }
}
@media (max-width: 1024px) { .dash-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;

/** Compact "Today ⌄" period select used in the chart card headers. */
const PeriodSelect: React.FC = () => (
  <div style={{ position: 'relative', flexShrink: 0 }}>
    <select
      className="form-select"
      defaultValue="Today"
      aria-label="Period"
      style={{ height: 28, width: 76, padding: '0 28px 0 11px', fontSize: 'var(--fs-sm)', appearance: 'none', cursor: 'pointer' }}
    >
      <option>Today</option>
      <option>Week</option>
      <option>Month</option>
    </select>
    <ChevronDown size={14} style={{ position: 'absolute', right: 9, top: 7, pointerEvents: 'none', color: 'var(--text-primary)' }} />
  </div>
);

// Donut geometry: each segment's dash length and its start offset along the ring.
const DONUT_R = 67;
const DONUT_C = 2 * Math.PI * DONUT_R;
const DONUT_SEGMENTS = FLOW.map((seg, i) => ({
  ...seg,
  len: (seg.pct / 100) * DONUT_C,
  start: (FLOW.slice(0, i).reduce((sum, s) => sum + s.pct, 0) / 100) * DONUT_C
}));

const Donut: React.FC = () => (
  <div style={{ position: 'relative', width: 156, height: 156, flexShrink: 0 }}>
    <svg width="156" height="156" viewBox="0 0 156 156" style={{ transform: 'rotate(-90deg)' }}>
      {DONUT_SEGMENTS.map((seg) => (
        <circle
          key={seg.label}
          cx="78"
          cy="78"
          r={DONUT_R}
          fill="none"
          stroke={seg.color}
          strokeWidth="22"
          strokeDasharray={`${seg.len} ${DONUT_C - seg.len}`}
          strokeDashoffset={-seg.start}
        />
      ))}
    </svg>
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 23, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>124</span>
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>Total Patients</span>
    </div>
  </div>
);

export const DashboardScreen: React.FC = () => {
  const { setActiveScreen, showToast } = useApp();
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [alertsFilter, setAlertsFilter] = useState<AlertFilter>('all');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const filteredSchedule = SCHEDULE.filter((item) => {
    if (scheduleFilter === 'upcoming') return item.status !== 'Completed';
    if (scheduleFilter === 'completed') return item.status === 'Completed';
    return true;
  });

  const filteredAlerts = alertsFilter === 'all' ? ALERTS.slice(0, 5) : ALERTS.filter((a) => a.type === alertsFilter);

  const handleAskAI = (promptText?: string) => {
    const q = promptText || aiQuestion;
    if (!q) return;
    setAiQuestion(q);
    setAiAnswer(`GPT-6 Astro: Analysis complete for "${q}". Clinical findings cross-referenced with ESC & ADA guidelines. No acute contraindications found.`);
  };

  const maxBar = Math.max(...CONSULT_TYPES.map((b) => b.count));

  return (
    <div className="page-scroll-body dash-page">
      <style>{LAYOUT_CSS}</style>
      {/* Header */}
      <div className="screen-header-row" style={{ marginTop: -3 }}>
        <div className="screen-title-area">
          <h1>Dashboard</h1>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginTop: 3, lineHeight: 1.3 }}>
            Welcome back, Dr. Shajin 👋
          </div>
          <p style={{ marginTop: 0 }}>Here's your hospital overview for today.</p>
        </div>
        <div style={{ textAlign: 'right', paddingTop: 6, fontSize: 14, lineHeight: 1.45 }}>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Tue, 24 Sep 2026</div>
          <div style={{ color: 'var(--text-secondary)' }}>10:24 AM</div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="stat-cards-grid dash-kpis">
        {KPIS.map((kpi) => {
          const Icon = kpi.icon;
          const tint = TINTS[kpi.tint];
          return (
            <div key={kpi.label} className={`stat-card-item tint-${kpi.tint}`} style={{ height: 94, padding: '0 10px 0 14px', gap: 16 }}>
              <div className="stat-icon-wrapper" style={{ backgroundColor: tint.tile, color: tint.icon }}>
                <Icon size={27} strokeWidth={2.1} />
              </div>
              <div className="stat-data-box" style={{ whiteSpace: 'nowrap' }}>
                <span className="stat-label">{kpi.label}</span>
                <span className="stat-number">{kpi.value}</span>
                <span className="stat-sub">{kpi.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main grid: Schedule | Recent Patients | right column (AI, Tasks & Alerts, Quick Actions) */}
      <div className="dash-main">
        {/* Today's Schedule */}
        <div className="medios-card" style={{ padding: '14px 18px 14px 14px', minHeight: 0, overflow: 'hidden' }}>
          <div className="card-header-row" style={{ marginBottom: 10 }}>
            <h3 className="card-title">Today's Schedule</h3>
            <button className="text-link" style={{ fontSize: 13 }} onClick={() => setActiveScreen('appointments')}>
              View All
            </button>
          </div>

          <div className="card-tabs" style={{ margin: '0 -18px 4px -14px', gap: 0 }}>
            {(
              [
                { id: 'all', label: 'All (18)' },
                { id: 'upcoming', label: 'Upcoming (6)' },
                { id: 'completed', label: 'Completed (12)' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                className={`card-tab-btn ${scheduleFilter === tab.id ? 'active' : ''}`}
                style={{ height: 38, padding: '0 20px', fontSize: 13 }}
                onClick={() => setScheduleFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredSchedule.map((item) => (
              <div key={item.time} style={{ display: 'flex', alignItems: 'center', height: 56 }}>
                <span style={{ width: 70, flexShrink: 0, paddingLeft: 4, fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                  {item.time}
                </span>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    alignSelf: 'stretch',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 13,
                    paddingLeft: 12,
                    borderLeft: '1px solid var(--border-color)',
                    margin: '4px 0'
                  }}
                >
                  <Avatar name={item.name} size={40} initialsOnly={!item.photo} color={item.photo ? undefined : 'var(--chart-blue)'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{item.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.35, whiteSpace: 'nowrap' }}>{item.reason}</div>
                  </div>
                  <span className={`status-pill ${item.pill}`}>{item.status}</span>
                </div>
              </div>
            ))}
            {filteredSchedule.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>No appointments</div>
            )}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="medios-card" style={{ padding: '14px 15px', minHeight: 0, overflow: 'hidden' }}>
          <div className="card-header-row" style={{ marginBottom: 6 }}>
            <h3 className="card-title">Recent Patients</h3>
            <button className="text-link" style={{ fontSize: 13 }} onClick={() => setActiveScreen('patients')}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {RECENT_PATIENTS.map((pat) => (
              <div key={pat.name} style={{ display: 'flex', alignItems: 'center', gap: 13, height: 66 }}>
                <Avatar name={pat.name} size={42} initialsOnly={!pat.photo} color={pat.photo ? undefined : pat.color ?? 'var(--chart-blue)'} />
                <div style={{ flex: 1, minWidth: 0, lineHeight: 1.36 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{pat.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {pat.age} y • {pat.gender}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{pat.reason}</div>
                </div>
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginRight: 6 }}>{pat.time}</span>
                <button
                  className="btn-outline-blue btn-sm"
                  style={{ height: 26, padding: '0 12px', backgroundColor: 'var(--blue-light)', fontWeight: 400 }}
                  onClick={() => setActiveScreen('consultation')}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="dash-right">
          {/* AI Clinical Assistant */}
          <div className="ai-assistant-card" style={{ gap: 0, padding: '14px 12px 14px 13px', flexShrink: 0 }}>
            <div className="ai-header-bar">
              <div className="ai-title-row" style={{ fontSize: 14.5 }}>
                <AiSparkle size={22} />
                <span>AI Clinical Assistant (GPT-6 Astro)</span>
              </div>
              <button className="icon-btn" style={{ border: 'none', width: 24, height: 24, color: 'var(--blue-text)' }} aria-label="More options" onClick={() => showToast('AI assistant options')}>
                <EllipsisVertical size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 7, marginTop: 13 }}>
              <div className="ai-prompt-box" style={{ flex: 1 }}>
                <Mic size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  className="ai-prompt-input"
                  style={{ paddingRight: 12, fontSize: 13 }}
                  placeholder="Ask about a patient, guideline, treatment..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                />
              </div>
              <button className="ai-send-btn" style={{ position: 'static', width: 41, height: 40, flexShrink: 0 }} aria-label="Send" onClick={() => handleAskAI()}>
                <Send size={17} />
              </button>
            </div>

            {aiAnswer && (
              <div className="ai-section" style={{ marginTop: 10, fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', lineHeight: 1.4, padding: '8px 10px' }}>
                {aiAnswer}
              </div>
            )}

            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', margin: '9px 0 8px' }}>Try these examples:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PROMPT_ROWS.map((row, i) => (
                <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {row.map((chip) => {
                    const Icon = chip.icon;
                    return (
                      <button
                        key={chip.label}
                        className="prompt-chip-btn"
                        style={{ height: 26, padding: '0 6px', gap: 5, fontSize: 10 }}
                        onClick={() => handleAskAI(chip.prompt)}
                      >
                        <Icon size={12} />
                        <span>{chip.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Tasks & Alerts */}
          <div className="medios-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '14px 12px 5px 13px' }}>
            <div className="card-header-row" style={{ marginBottom: 10 }}>
              <h3 className="card-title">Tasks &amp; Alerts</h3>
              <button className="text-link" style={{ fontSize: 13 }} onClick={() => setActiveScreen('tasks-alerts')}>
                View All
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
              {ALERT_CHIPS.map((chip) => {
                const active = alertsFilter === chip.id;
                const critical = chip.id === 'critical' && !active;
                return (
                  <button
                    key={chip.id}
                    className={`chip-btn ${active ? 'active' : ''}`}
                    style={{
                      height: 27,
                      padding: '0 10px',
                      fontSize: 11.5,
                      ...(critical ? { backgroundColor: 'var(--red-light)', color: 'var(--red-dark)' } : {})
                    }}
                    onClick={() => setAlertsFilter(chip.id)}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {filteredAlerts.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>No alerts for {alertsFilter}</div>
              ) : (
                filteredAlerts.map((a, i) => {
                  const Icon = a.icon;
                  const tint = TINTS[a.tint];
                  return (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 26,
                        minHeight: 46,
                        padding: '5px 2px 5px 14px',
                        borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: tint.tile, color: tint.icon, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.95 }}>
                        <Icon size={19} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.sub}</div>
                      </div>
                      <span style={{ fontSize: 'var(--fs-sm)', color: a.timeColor ?? 'var(--text-primary)', flexShrink: 0 }}>{a.time}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="medios-card" style={{ padding: '9px 10px 11px 10px', flexShrink: 0 }}>
            <h3 className="card-title" style={{ padding: '0 4px', marginBottom: 8 }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
              {QUICK_ACTIONS.map((act) => {
                const Icon = act.icon;
                const label = act.label.replace('\n', ' ');
                return (
                  <button
                    key={act.label}
                    onClick={() => {
                      setActiveScreen(act.screen);
                      showToast(`Navigated to ${label}`);
                    }}
                    title={label}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      padding: '9px 2px 8px',
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      gap: 5,
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--blue-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card)')}
                  >
                    <Icon size={22} color="var(--blue-text)" strokeWidth={1.9} />
                    <span style={{ fontSize: 10.5, color: 'var(--text-primary)', lineHeight: 1.25, whiteSpace: 'pre-line', letterSpacing: '-0.1px' }}>
                      {act.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Patient Flow */}
        <div className="medios-card dash-flow" style={{ padding: '10px 16px 22px 14px' }}>
          <div className="card-header-row" style={{ marginBottom: 13 }}>
            <h3 className="card-title">Patient Flow</h3>
            <PeriodSelect />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingLeft: 4 }}>
            <Donut />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, flex: 1 }}>
              {FLOW.map((seg) => (
                <div key={seg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, lineHeight: 1.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: seg.color }} />
                    <span style={{ color: 'var(--text-primary)' }}>{seg.label}</span>
                  </div>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {seg.value} ({seg.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Consultation Types */}
        <div className="medios-card dash-consult" style={{ padding: '10px 15px 16px 15px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header-row" style={{ marginBottom: 13 }}>
            <h3 className="card-title">Consultation Types</h3>
            <PeriodSelect />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, height: 141, padding: '0 10px 0 8px', borderBottom: '1px solid var(--border-color)' }}>
            {CONSULT_TYPES.map((bar) => (
              <div key={bar.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: bar.valueColor ?? 'var(--text-primary)', lineHeight: 1.2 }}>{bar.count}</span>
                <div style={{ width: '100%', height: (bar.count / maxBar) * 120, backgroundColor: bar.color, borderRadius: '3px 3px 0 0' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 20, padding: '6px 10px 0 8px' }}>
            {CONSULT_TYPES.map((bar) => (
              <span key={bar.label} style={{ flex: 1, textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {bar.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
