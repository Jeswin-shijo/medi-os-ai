import React, { useRef, useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { PatientBanner, BannerTab } from '../layout/PatientBanner';
import { ScreenHeader } from '../common/ScreenHeader';
import { Avatar } from '../common/Avatar';
import { AiSparkle } from '../common/icons';
import { mockFollowUps, mockAIFollowUpRecommendations } from '../../mock/followUpsData';
import { FollowUpItem } from '../../types';
import {
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  CircleDot,
  CircleArrowLeft,
  Bell,
  SquareMenu,
  ChartColumn,
  Plus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  SquarePen,
  Phone,
  UsersRound,
  UserRound,
  CircleCheck,
  Check,
  Clock,
  RefreshCw,
  Send,
  CircleX
} from 'lucide-react';

type FuStatus = FollowUpItem['status'];
type DetailTab = 'Previous Visits' | 'Diagnosis' | 'Medications' | 'Lab Reports';

const FU_TABS: BannerTab[] = [
  { id: 'follow-up-list', label: 'Follow-up List', icon: CalendarCheck },
  { id: 'calendar-view', label: 'Calendar View', icon: CalendarDays },
  { id: 'pending', label: 'Pending Follow-ups', icon: CalendarClock },
  { id: 'missed', label: 'Missed Follow-ups', icon: CircleDot },
  { id: 'recalls', label: 'Recalls', icon: CircleArrowLeft },
  { id: 'reminders', label: 'Automated Reminders', icon: Bell },
  { id: 'templates', label: 'Follow-up Templates', icon: SquareMenu },
  { id: 'analytics', label: 'Analytics', icon: ChartColumn }
];

const STATUS_PILL: Record<FuStatus, string> = {
  Scheduled: 'green',
  Completed: 'blue',
  Pending: 'pending',
  Missed: 'missed',
  Overdue: 'overdue'
};

const TONES = {
  red: { bg: '#fde8ea', border: '#f8c9cf', fg: 'var(--red-dark)' },
  orange: { bg: '#fdf1d8', border: '#f6dca4', fg: '#b86e00' },
  blue: { bg: '#e3edfd', border: '#c5d7fb', fg: 'var(--blue-text)' },
  green: { bg: '#def5ea', border: '#b5e6cf', fg: 'var(--green-dark)' }
} as const;

const WEEK: { day: string; event?: { time: string; name: string; type: string; tone: keyof typeof TONES } }[] = [
  { day: 'Sun 20', event: { time: '09:00 AM', name: 'Selvi P', type: 'Chronic Care', tone: 'red' } },
  { day: 'Mon 21' },
  { day: 'Tue 22', event: { time: '11:30 AM', name: 'Rajesh Kumar', type: 'Medication Review', tone: 'orange' } },
  { day: 'Wed 23', event: { time: '10:00 AM', name: 'Mary Jeni', type: 'Lab Review', tone: 'blue' } },
  { day: 'Thu 24' },
  { day: 'Fri 25' },
  { day: 'Sat 26', event: { time: '10:30 AM', name: 'Arun Kumar', type: 'Review', tone: 'green' } }
];

const DETAIL_ROWS: Record<DetailTab, { date: string; title: string; sub: string; done: boolean }[]> = {
  'Previous Visits': [
    { date: '12 Sep 2026', title: 'OPD Consultation', sub: 'BP review, medication adjusted', done: true },
    { date: '18 Aug 2026', title: 'Follow-up', sub: 'Lab review, stable', done: true },
    { date: '10 Jul 2026', title: 'Initial Consultation', sub: 'Hypertension, Type 2 Diabetes', done: false }
  ],
  Diagnosis: [
    { date: '10 Jul 2026', title: 'Essential Hypertension', sub: 'ICD-10 I10 · On Amlodipine', done: true },
    { date: '10 Jul 2026', title: 'Type 2 Diabetes Mellitus', sub: 'ICD-10 E11.9 · On Metformin', done: true },
    { date: '12 Sep 2026', title: 'Dyslipidemia', sub: 'ICD-10 E78.5 · On Atorvastatin', done: false }
  ],
  Medications: [
    { date: '12 Sep 2026', title: 'Amlodipine 5 mg', sub: 'OD · Hypertension', done: true },
    { date: '12 Sep 2026', title: 'Metformin 500 mg', sub: 'BD · Type 2 Diabetes', done: true },
    { date: '12 Sep 2026', title: 'Levocetirizine 5 mg', sub: 'HS · Paused', done: false }
  ],
  'Lab Reports': [
    { date: '12 Sep 2026', title: 'HbA1c', sub: '7.2 % · Slightly high', done: false },
    { date: '12 Sep 2026', title: 'Lipid Profile', sub: 'LDL 118 mg/dL', done: true },
    { date: '18 Aug 2026', title: 'Kidney Function Test', sub: 'Within normal limits', done: true }
  ]
};

const REC_COLORS = ['var(--blue-primary)', 'var(--blue-primary)', 'var(--green-emerald)', 'var(--orange-amber)', '#f08c1a', 'var(--red-rose)'];

const th: React.CSSProperties = { padding: '9px 10px', fontSize: 11.5, fontWeight: 600 };
const td: React.CSSProperties = { padding: '5px 10px', fontSize: 11.5 };
const fieldIcon: React.CSSProperties = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-primary)' };
const selectStyle: React.CSSProperties = { height: 34, fontSize: 11.5, appearance: 'none', paddingRight: 30 };

const FilterSelect: React.FC<{ value: string; onChange: (v: string) => void; options: string[]; width: number }> = ({ value, onChange, options, width }) => (
  <div style={{ position: 'relative', width, flexShrink: 0 }}>
    <select className="form-select" style={selectStyle} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
    <ChevronDown size={14} style={{ ...fieldIcon, right: 10 }} />
  </div>
);

export const FollowUpsScreen: React.FC = () => {
  const { showToast, activePatient } = useApp();
  const [followUps, setFollowUps] = useState<FollowUpItem[]>(mockFollowUps);
  const [selectedId, setSelectedId] = useState('fu-1');
  const [subTab, setSubTab] = useState('follow-up-list');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [doctorFilter, setDoctorFilter] = useState('All Doctors');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('10 / page');
  const [detailTab, setDetailTab] = useState<DetailTab>('Previous Visits');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const selectedItem = followUps.find((f) => f.id === selectedId) || followUps[0];

  const filtered = followUps.filter((f) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || f.patientName.toLowerCase().includes(q) || f.uhid.toLowerCase().includes(q) || f.followUpType.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (typeFilter !== 'All Types' && f.followUpType !== typeFilter) return false;
    if (statusFilter !== 'All Status' && f.status !== statusFilter) return false;
    if (subTab === 'pending') return f.status === 'Pending' || f.status === 'Scheduled';
    if (subTab === 'missed') return f.status === 'Missed' || f.status === 'Overdue';
    if (subTab === 'recalls') return f.followUpType.toLowerCase().includes('recall') || f.status === 'Completed';
    return true;
  });

  const handleTab = (id: string) => {
    setSubTab(id);
    const tab = FU_TABS.find((t) => t.id === id);
    if (id === 'calendar-view') calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (id === 'reminders' || id === 'templates' || id === 'analytics') showToast(`${tab?.label} opened`, 'info');
  };

  const updateStatus = (id: string, status: FuStatus) => {
    const item = followUps.find((f) => f.id === id);
    setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
    setMenuFor(null);
    if (item) showToast(`${item.patientName}'s follow-up marked ${status.toLowerCase()}`);
  };

  const typeLabel = selectedItem.followUpType === 'Review' ? 'Review Consultation' : selectedItem.followUpType;

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="Follow-ups"
        subtitle="Schedule, track and manage patient follow-ups with AI assistance"
        actions={
          <>
            <button className="btn-outline-blue" onClick={() => showToast('Opening follow-up scheduler')}>
              <CalendarDays size={17} />
              <span>Schedule Follow-up</span>
            </button>
            <button className="btn-primary" onClick={() => showToast('New follow-up created')}>
              <Plus size={18} />
              <span>New Follow-up</span>
            </button>
          </>
        }
      />

      <PatientBanner
        metrics={[
          { label: 'Last Visit', value: activePatient?.lastVisit ?? '12 Sep 2026' },
          { label: 'Next Follow-up', value: '26 Sep 2026', sub: '10:30 AM' },
          { label: 'Total Follow-ups', value: '4' }
        ]}
        tabs={FU_TABS}
        activeTab={subTab}
        onTabChange={handleTab}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 408px', columnGap: 12, rowGap: 14 }}>
        {/* Filter row */}
        <div style={{ display: 'flex', gap: 9, alignItems: 'center', minWidth: 0 }}>
          <button
            className="input-field"
            style={{ height: 34, width: 222, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, padding: '0 12px' }}
            onClick={() => showToast('Date range picker opened', 'info')}
          >
            <span>01 Sep 2026 – 30 Dec 2026</span>
            <CalendarDays size={15} color="var(--text-secondary)" />
          </button>
          <div style={{ width: 9 }} />
          <FilterSelect value={typeFilter} onChange={setTypeFilter} width={120} options={['All Types', ...Array.from(new Set(mockFollowUps.map((f) => f.followUpType)))]} />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} width={126} options={['All Status', 'Scheduled', 'Completed', 'Pending', 'Missed', 'Overdue']} />
          <FilterSelect value={deptFilter} onChange={setDeptFilter} width={131} options={['All Departments', 'General Medicine', 'Cardiology', 'Endocrinology']} />
          <FilterSelect value={doctorFilter} onChange={setDoctorFilter} width={131} options={['All Doctors', 'Dr. Shajin', 'Dr. Priya', 'Dr. Ravi']} />
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="input-field"
            style={{ height: 34, fontSize: 11.5, paddingRight: 44 }}
            placeholder="Search by patient name, UHID, diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 34, borderLeft: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
            <Search size={15} />
          </span>
        </div>

        {/* Left column: table + calendar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div className="medios-card" style={{ padding: '0 0 7px' }}>
            <table className="medios-table">
              <thead>
                <tr>
                  <th style={{ ...th, width: 44, textAlign: 'center' }}>#</th>
                  <th style={th}>Patient</th>
                  <th style={{ ...th, borderLeft: '1px solid var(--border-subtle)' }}>Last Visit</th>
                  <th style={{ ...th, borderLeft: '1px solid var(--border-subtle)' }}>Follow-up Date</th>
                  <th style={th}>Follow-up Type</th>
                  <th style={th}>Status</th>
                  <th style={th}>Assigned To</th>
                  <th style={{ ...th, width: 98, textAlign: 'center', borderLeft: '1px solid var(--border-subtle)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const isSelected = selectedId === item.id;
                  return (
                    <tr key={item.id} onClick={() => setSelectedId(item.id)} className={isSelected ? 'selected' : ''} style={{ cursor: 'pointer' }}>
                      <td style={{ ...td, textAlign: 'center', fontWeight: 500 }}>{idx + 1}</td>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <Avatar name={item.patientName} size={36} />
                          <div style={{ lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 600 }}>{item.patientName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.uhid}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span>{item.age} yrs</span>
                              <span style={{ width: 1, height: 10, background: 'var(--border-strong)' }} />
                              <span>{item.gender}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{item.lastVisit}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600 }}>{item.followUpDate}</div>
                        <div style={{ marginTop: 2 }}>{item.followUpTime}</div>
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{item.followUpType}</td>
                      <td style={td}>
                        <span className={`status-pill ${STATUS_PILL[item.status]}`} style={{ height: 24, minWidth: 66, padding: '0 11px' }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{item.assignedTo}</td>
                      <td style={{ ...td, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26 }}>
                          <button aria-label="Reschedule" style={{ color: 'var(--blue-text)', display: 'flex' }} onClick={() => showToast(`Reschedule ${item.patientName}'s follow-up`, 'info')}>
                            <CalendarDays size={18} />
                          </button>
                          <button aria-label="More actions" style={{ display: 'flex' }} onClick={() => setMenuFor(menuFor === item.id ? null : item.id)}>
                            <EllipsisVertical size={16} />
                          </button>
                        </div>
                        {menuFor === item.id && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 20 }} onClick={() => setMenuFor(null)} />
                            <div
                              style={{
                                position: 'absolute',
                                right: 10,
                                top: 'calc(100% - 8px)',
                                zIndex: 21,
                                background: '#ffffff',
                                border: '1px solid var(--border-color)',
                                borderRadius: 8,
                                boxShadow: 'var(--shadow-md)',
                                padding: 4,
                                minWidth: 160
                              }}
                            >
                              {[
                                { label: 'Mark Completed', icon: Check, status: 'Completed' as const },
                                { label: 'Mark Missed', icon: CircleX, status: 'Missed' as const },
                                { label: 'Set Scheduled', icon: CalendarCheck, status: 'Scheduled' as const }
                              ]
                                .filter((a) => a.status !== item.status)
                                .map((a) => (
                                  <button
                                    key={a.label}
                                    onClick={() => updateStatus(item.id, a.status)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', fontSize: 12, borderRadius: 6, textAlign: 'left' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    <a.icon size={13} />
                                    <span>{a.label}</span>
                                  </button>
                                ))}
                              <button
                                onClick={() => {
                                  setMenuFor(null);
                                  showToast(`Reminder sent to ${item.patientName} (SMS + WhatsApp)`);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', fontSize: 12, borderRadius: 6, textAlign: 'left' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                              >
                                <Send size={13} />
                                <span>Send Reminder</span>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ ...td, textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                      No follow-ups match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px 0' }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Showing {filtered.length ? 1 : 0}–{filtered.length} of {filtered.length === followUps.length ? 42 : filtered.length} follow-ups</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button className="icon-btn" style={{ width: 24, height: 24, color: 'var(--text-muted)' }} aria-label="Previous page" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft size={13} />
                  </button>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      className="icon-btn"
                      style={{
                        width: 24,
                        height: 24,
                        fontSize: 11.5,
                        borderColor: page === n ? 'var(--blue-primary)' : 'var(--border-color)',
                        background: page === n ? 'var(--blue-light)' : '#ffffff',
                        color: page === n ? 'var(--blue-text)' : 'var(--text-primary)'
                      }}
                      onClick={() => {
                        setPage(n);
                        if (n !== 1) showToast(`Page ${n} of follow-ups`, 'info');
                      }}
                    >
                      {n}
                    </button>
                  ))}
                  <button className="icon-btn" style={{ width: 24, height: 24 }} aria-label="Next page" onClick={() => setPage((p) => Math.min(5, p + 1))}>
                    <ChevronRight size={13} />
                  </button>
                </div>
                <div style={{ position: 'relative', width: 112 }}>
                  <select className="form-select" style={{ height: 26, fontSize: 11.5, appearance: 'none', padding: '0 28px 0 10px' }} value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
                    <option>10 / page</option>
                    <option>20 / page</option>
                    <option>50 / page</option>
                  </select>
                  <ChevronDown size={13} style={{ ...fieldIcon, right: 9 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Follow-up calendar */}
          <div ref={calendarRef} className="medios-card" style={{ padding: '7px 10px 9px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>Follow-up Calendar (This Month)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button className="icon-btn" style={{ width: 26, height: 24, background: 'var(--bg-tab)', border: 'none', color: 'var(--blue-text)' }} aria-label="Previous week" onClick={() => showToast('Previous week', 'info')}>
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Sep 2026</span>
                <button className="icon-btn" style={{ width: 26, height: 24, background: 'var(--bg-tab)', border: 'none', color: 'var(--blue-text)' }} aria-label="Next week" onClick={() => showToast('Next week', 'info')}>
                  <ChevronRight size={14} />
                </button>
              </div>
              <span />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
              {WEEK.map((d, i) => {
                const tone = d.event ? TONES[d.event.tone] : null;
                return (
                  <div key={d.day} style={{ borderLeft: i === 0 ? 'none' : '1px solid var(--border-subtle)', minWidth: 0 }}>
                    <div style={{ fontSize: 10, textAlign: 'center', padding: '3px 0', borderBottom: '1px solid var(--border-subtle)' }}>{d.day}</div>
                    <div style={{ padding: '5px 7px', height: 61 }}>
                      {d.event && tone && (
                        <button
                          onClick={() => {
                            const match = followUps.find((f) => f.patientName === d.event?.name);
                            if (match) setSelectedId(match.id);
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            textAlign: 'left',
                            background: tone.bg,
                            border: `1px solid ${tone.border}`,
                            borderRadius: 4,
                            padding: '3px 6px',
                            fontSize: 10,
                            lineHeight: 1.48,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: tone.fg }}>
                            <Clock size={10} strokeWidth={2.5} />
                            <span>{d.event.time}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-primary)', fontSize: 10.5 }}>
                            <CircleDot size={10} strokeWidth={2.5} color={tone.fg} />
                            <span>{d.event.name}</span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: 9.5, paddingLeft: 15, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.event.type}</div>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: details + AI recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div className="medios-card" style={{ padding: '12px 12px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Follow-up Details</span>
              <button className="btn-outline-blue" style={{ height: 28, fontSize: 11.5, padding: '0 9px', gap: 6 }} onClick={() => showToast(`Editing follow-up for ${selectedItem.patientName}`, 'info')}>
                <SquarePen size={13} />
                <span>Edit</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', marginTop: 2, paddingLeft: 12 }}>
              <Avatar name={selectedItem.patientName} size={72} />
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedItem.patientName}</div>
                <div>UHID: {selectedItem.uhid}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>{selectedItem.age} years</span>
                  <span style={{ width: 1, height: 11, background: 'var(--border-strong)' }} />
                  <span>{selectedItem.gender}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={11} fill="currentColor" strokeWidth={0} />
                  <span>+91 98765 43210</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '115px 26px 1fr auto', alignItems: 'center', rowGap: 6, fontSize: 11.5, marginTop: 8, paddingLeft: 6 }}>
              <span>Follow-up Date</span>
              <CalendarDays size={14} />
              <span style={{ gridColumn: 'span 2' }}>
                {selectedItem.followUpDate}, {selectedItem.followUpTime}
              </span>
              <span>Follow-up Type</span>
              <UsersRound size={14} />
              <span style={{ gridColumn: 'span 2' }}>{typeLabel}</span>
              <span>Status</span>
              {selectedItem.status === 'Scheduled' || selectedItem.status === 'Completed' ? (
                <CircleCheck size={14} color="#ffffff" fill="var(--green-emerald)" />
              ) : selectedItem.status === 'Pending' ? (
                <Clock size={14} color="var(--orange-amber)" strokeWidth={2.4} />
              ) : (
                <CircleX size={14} color="#ffffff" fill="var(--red-rose)" />
              )}
              <span style={{ gridColumn: 'span 2' }}>
                <span className={`status-pill ${STATUS_PILL[selectedItem.status]}`} style={{ height: 22 }}>
                  {selectedItem.status}
                </span>
              </span>
              <span>Assigned To</span>
              <UserRound size={14} />
              <span style={{ gridColumn: 'span 2' }}>{selectedItem.assignedTo}</span>
              <span>Reminder</span>
              <Bell size={14} />
              <span>{selectedItem.id === 'fu-1' ? selectedItem.reminders : '1 day before (SMS + WhatsApp)'}</span>
              <button className="text-link" style={{ fontSize: 11.5, fontWeight: 400, paddingRight: 6 }} onClick={() => showToast('Reminder settings opened', 'info')}>
                Edit
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              {(Object.keys(DETAIL_ROWS) as DetailTab[]).map((t) => (
                <button
                  key={t}
                  className={`page-tab-btn ${detailTab === t ? 'active' : ''}`}
                  style={{ height: 33, padding: '0 6px', fontSize: 11.5, flex: t === 'Previous Visits' ? '1.2 1 0' : '1 1 0', justifyContent: 'center', minWidth: 0 }}
                  onClick={() => setDetailTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 6 }}>
              {DETAIL_ROWS[detailTab].map((v, i, arr) => (
                <div
                  key={v.title}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '14px 84px 1fr auto',
                    columnGap: 10,
                    alignItems: 'center',
                    padding: '6px 6px 6px 4px',
                    borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border-subtle)'
                  }}
                >
                  {v.done ? (
                    <CircleCheck size={14} color="#ffffff" fill="var(--green-emerald)" strokeWidth={2.4} />
                  ) : (
                    <span style={{ width: 13, height: 13, borderRadius: '50%', border: '3.5px solid var(--orange-amber)', boxSizing: 'border-box' }} />
                  )}
                  <span style={{ fontSize: 11.5, alignSelf: 'start', paddingTop: 1 }}>{v.date}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11.5 }}>{v.title}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 1 }}>{v.sub}</div>
                  </div>
                  <button className="btn-outline-blue" style={{ height: 26, width: 54, fontSize: 11.5, padding: 0 }} onClick={() => showToast(`Opening ${v.title} (${v.date})`, 'info')}>
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="ai-assistant-card" style={{ padding: '8px 12px 10px', gap: 6, flex: 1 }}>
            <div className="ai-header-bar">
              <div className="ai-title-row" style={{ fontSize: 12.2, gap: 9, whiteSpace: 'nowrap' }}>
                <AiSparkle size={20} />
                <span>AI Follow-up Recommendations (GPT-6 Astro)</span>
              </div>
              <button className="btn-outline-blue" style={{ height: 24, fontSize: 11, padding: '0 7px', gap: 5 }} onClick={() => showToast('Recommendations regenerated with latest labs')}>
                <RefreshCw size={11} />
                <span>Regenerate</span>
              </button>
            </div>
            <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {mockAIFollowUpRecommendations.map((rec, i) => (
                <li key={rec}>
                  <button
                    onClick={() => showToast(`Added: ${rec}`)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, height: 21, fontSize: 11.5, textAlign: 'left', color: 'var(--text-primary)' }}
                  >
                    <span
                      style={{
                        width: 15,
                        height: 15,
                        borderRadius: '50%',
                        background: REC_COLORS[i % REC_COLORS.length],
                        color: '#ffffff',
                        fontSize: 9,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec}</span>
                    <ChevronRight size={14} color="var(--text-secondary)" />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
