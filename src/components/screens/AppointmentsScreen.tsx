import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/appContextCore';
import { Appointment, Patient } from '../../types';
import { appointmentService, patientService } from '../../services';
import { mockPreviousAppointments, mockUpcomingAppointments } from '../../mock/appointmentsData';
import { ScreenHeader } from '../common/ScreenHeader';
import { Avatar } from '../common/Avatar';
import { AllergyIcon, DiabetesDots, HypertensionIcon } from '../common/icons';
import {
  CalendarDays,
  CalendarClock,
  Plus,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  MoreHorizontal,
  Settings,
  Phone,
  Mars,
  Venus,
  SquareUserRound,
  NotebookPen,
  BadgeCheck,
  Pencil,
  SquarePen,
  Stethoscope,
  ArrowRight,
  FolderOpen,
  Pill,
  History,
  FileText,
  Printer,
  Download,
  UserX,
  Timer,
  X,
  Activity,
  type LucideIcon
} from 'lucide-react';

const VIEW_TABS = ['Daily View', 'Calendar View', 'List View', 'Follow-ups', 'Waiting List', 'Canceled / No Show', 'Teleconsultation'] as const;
type ViewTab = (typeof VIEW_TABS)[number];

/** The demo's "today". */
const TODAY = '2026-09-26';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toIso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const parseIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const fmtDate = (iso: string) => {
  const d = parseIso(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
const shiftIso = (iso: string, days: number) => {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
};
const toMinutes = (time: string) => {
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
};

// Doctor schedule sessions — unchecking one hides the appointments in that block.
const SESSIONS = [
  { id: 'opd', name: 'General OPD', time: '9:00 AM – 1:00 PM', color: 'var(--blue-primary)', tint: 'var(--blue-light)', from: 0, to: 13 * 60 },
  { id: 'fu', name: 'Follow-up', time: '2:00 PM – 4:00 PM', color: 'var(--green-emerald)', tint: 'var(--green-light)', from: 13 * 60, to: 16 * 60 },
  { id: 'tele', name: 'Teleconsultation', time: '4:00 PM – 5:00 PM', color: 'var(--purple-ai)', tint: 'var(--purple-light)', from: 16 * 60, to: 24 * 60 }
];

const STATUS_META: Record<Appointment['status'], { pill: string; dot: string }> = {
  'Checked In': { pill: 'checked-in', dot: 'var(--green-emerald)' },
  Waiting: { pill: 'waiting', dot: 'var(--orange-amber)' },
  'In Consultation': { pill: 'in-consultation', dot: 'var(--blue-primary)' },
  Scheduled: { pill: 'scheduled', dot: '#a3adbf' },
  Completed: { pill: 'completed', dot: 'var(--green-emerald)' },
  Canceled: { pill: 'red', dot: 'var(--red-rose)' }
};

// Walk-ins already checked in / waiting at reception today (not booked through this list).
const WALK_INS = { checkedIn: 6, waiting: 1 };

const VISIT_REASON: Record<string, string> = { 'apt-1': 'Blood pressure review' };

const tagBadge = (tag: string) => {
  const t = tag.toLowerCase();
  if (t.startsWith('allerg'))
    return (
      <span key={tag} className="badge-tag allergy" style={badgeSm}>
        <AllergyIcon size={13} />
        <span>{tag}</span>
      </span>
    );
  if (t.includes('diabet'))
    return (
      <span key={tag} className="badge-tag diabetes" style={badgeSm}>
        <DiabetesDots size={12} />
        <span>{tag}</span>
      </span>
    );
  if (t.includes('hypertension') || t.includes('chest') || t.includes('cardio'))
    return (
      <span key={tag} className="badge-tag hypertension" style={badgeSm}>
        <HypertensionIcon size={13} />
        <span>{tag}</span>
      </span>
    );
  return (
    <span key={tag} className="badge-tag neutral" style={badgeSm}>
      <Activity size={12} />
      <span>{tag}</span>
    </span>
  );
};
const badgeSm: React.CSSProperties = { fontSize: 'var(--fs-2xs)', height: 22, padding: '0 8px', gap: 6 };

interface MenuItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}
const PopMenu: React.FC<{ items: MenuItem[]; up?: boolean; onClose: () => void }> = ({ items, up, onClose }) => (
  <div
    onClick={(e) => e.stopPropagation()}
    style={{
      position: 'absolute',
      right: 0,
      ...(up ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
      minWidth: 180,
      background: '#ffffff',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      padding: 4,
      zIndex: 50,
      textAlign: 'left'
    }}
  >
    {items.map(({ label, icon: Icon, onClick }) => (
      <button
        key={label}
        onClick={() => {
          onClose();
          onClick();
        }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Icon size={14} color="var(--text-secondary)" />
        <span>{label}</span>
      </button>
    ))}
  </div>
);

const SelectBox: React.FC<{ label: string; value: string; options: string[]; onChange: (v: string) => void }> = ({ label, value, options, onChange }) => (
  <div>
    <label className="form-label" style={{ fontSize: 12.5, marginBottom: 4 }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <select className="form-select" value={value} onChange={(e) => onChange(e.target.value)} style={{ appearance: 'none', height: 34, fontSize: 12.5, paddingRight: 30, cursor: 'pointer' }}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={15} color="var(--text-primary)" style={{ position: 'absolute', right: 10, top: 10, pointerEvents: 'none' }} />
    </div>
  </div>
);

const cardTitle: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' };
const detailRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-primary)', minHeight: 20 };

export const AppointmentsScreen: React.FC = () => {
  const { setActiveScreen, setActivePatient, showToast } = useApp();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedAptId, setSelectedAptId] = useState<string>('apt-1');
  const [viewTab, setViewTab] = useState<ViewTab>('Daily View');
  const [isAddAptModalOpen, setIsAddAptModalOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'details' | 'quick'>('details');

  // Date + calendar
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [calMonth, setCalMonth] = useState(() => {
    const d = parseIso(TODAY);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  // Filters
  const [sessionsOn, setSessionsOn] = useState<Record<string, boolean>>({ opd: true, fu: true, tele: true });
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All');
  const [slotFilter, setSlotFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Notes (local edits)
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

  // Add Appointment State
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [time, setTime] = useState('11:00 AM');
  const [type, setType] = useState('Follow-up');
  const [condition, setCondition] = useState('');

  useEffect(() => {
    appointmentService.getAppointments().then(setAppointments);
    patientService.getPatients().then(setPatients);
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenu]);

  const toggleMenu = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenu((cur) => (cur === id ? null : id));
  };

  const selectDate = (iso: string) => {
    setSelectedDate(iso);
    const d = parseIso(iso);
    setCalMonth({ y: d.getFullYear(), m: d.getMonth() });
    setPage(1);
  };

  const dayAppointments = appointments.filter((a) => a.date === selectedDate);
  const q = search.trim().toLowerCase();

  const displayedAppointments = dayAppointments.filter((apt) => {
    if (viewTab === 'Follow-ups' && !apt.type.toLowerCase().includes('follow-up')) return false;
    if (viewTab === 'Waiting List' && apt.status !== 'Waiting') return false;
    if (viewTab === 'Canceled / No Show' && apt.status !== 'Canceled') return false;
    if (viewTab === 'Teleconsultation' && !(apt.type === 'Teleconsultation' || apt.notes?.toLowerCase().includes('tele'))) return false;
    const mins = toMinutes(apt.time);
    const session = SESSIONS.find((s) => mins >= s.from && mins < s.to);
    if (session && !sessionsOn[session.id]) return false;
    if (typeFilter === 'OPD Consultation' && apt.type.toLowerCase().includes('follow-up')) return false;
    if (typeFilter === 'Follow-up' && !apt.type.toLowerCase().includes('follow-up')) return false;
    if (typeFilter === 'Teleconsultation' && apt.type !== 'Teleconsultation') return false;
    if (typeFilter === 'Emergency' && !apt.type.toLowerCase().includes('emergency')) return false;
    if (statusFilter !== 'All' && apt.status !== statusFilter) return false;
    if (slotFilter.startsWith('Morning') && mins >= 13 * 60) return false;
    if (slotFilter.startsWith('Afternoon') && mins < 13 * 60) return false;
    if (q && !(apt.patientName.toLowerCase().includes(q) || apt.uhid.toLowerCase().includes(q) || apt.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')))) return false;
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(displayedAppointments.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pageRows = displayedAppointments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const firstRow = pageRows.length ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const lastRow = (currentPage - 1) * rowsPerPage + pageRows.length;

  const selectedApt = appointments.find((a) => a.id === selectedAptId) || pageRows[0] || appointments[0];
  const selectedPatient = selectedApt ? patients.find((p) => p.uhid === selectedApt.uhid) : undefined;

  const count = (s: Appointment['status']) => dayAppointments.filter((a) => a.status === s).length;
  const isToday = selectedDate === TODAY;
  const kpis = [
    { label: 'Checked In', value: count('Checked In') + (isToday ? WALK_INS.checkedIn : 0), color: 'var(--green-dark)', bg: '#eefaf5', border: 'var(--green-border)', filter: 'Checked In' },
    { label: 'Waiting', value: count('Waiting') + (isToday ? WALK_INS.waiting : 0), color: 'var(--orange-dark)', bg: '#fef5e8', border: 'var(--orange-border)', filter: 'Waiting' },
    { label: 'In Consultation', value: count('In Consultation'), color: 'var(--blue-text)', bg: '#edf3fe', border: 'var(--blue-border)', filter: 'In Consultation' },
    { label: 'Completed', value: count('Completed'), color: 'var(--purple-dark)', bg: '#f6f2fe', border: 'var(--purple-border)', filter: 'Completed' }
  ];

  const handleUpdateStatus = async (id: string, newStatus: Appointment['status']) => {
    await appointmentService.updateStatus(id, newStatus);
    const updated = await appointmentService.getAppointments();
    setAppointments(updated);
    showToast(`Appointment status updated to ${newStatus}`);
  };

  const openPatientScreen = (apt: Appointment, screen: Parameters<typeof setActiveScreen>[0]) => {
    const p = patients.find((x) => x.uhid === apt.uhid);
    if (p) setActivePatient(p);
    setActiveScreen(screen);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName) return;

    const newApt = await appointmentService.addAppointment({
      uhid: `MHK202500${Math.floor(100 + Math.random() * 900)}`,
      patientName,
      age: parseInt(age) || 30,
      gender: 'Male',
      phone: '+91 98765 00000',
      time,
      date: selectedDate,
      type,
      condition: condition || 'General Consultation',
      status: 'Scheduled',
      notes: 'Scheduled via appointment portal'
    });

    const refreshed = await appointmentService.getAppointments();
    setAppointments(refreshed);
    setSelectedAptId(newApt.id);
    setIsAddAptModalOpen(false);
    showToast(`Appointment created for ${patientName} at ${time}!`);
  };

  const resetFilters = () => {
    setTypeFilter('All Types');
    setStatusFilter('All');
    setSlotFilter('All');
    setSearch('');
    setSessionsOn({ opd: true, fu: true, tele: true });
    setPage(1);
  };

  // Mini calendar cells (Sunday first, 5–6 weeks).
  const firstDow = new Date(calMonth.y, calMonth.m, 1).getDay();
  const daysInMonth = new Date(calMonth.y, calMonth.m + 1, 0).getDate();
  const weeks = Math.ceil((firstDow + daysInMonth) / 7);
  const calCells = Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(calMonth.y, calMonth.m, i - firstDow + 1);
    return { iso: toIso(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: d.getMonth() === calMonth.m };
  });
  const shiftMonth = (delta: number) =>
    setCalMonth(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const note = selectedApt ? (noteEdits[selectedApt.id] ?? selectedApt.notes ?? '') : '';

  const statusLine = (apt: Appointment) => {
    switch (apt.status) {
      case 'Checked In':
        return { text: `Checked In  -  ${apt.checkedInTime || apt.time}`, color: 'var(--green-dark)' };
      case 'In Consultation':
        return { text: `In Consultation  -  ${apt.consultationDuration || '00:12:35'}`, color: 'var(--blue-text)' };
      case 'Waiting':
        return { text: 'Waiting in lobby', color: 'var(--orange-dark)' };
      case 'Completed':
        return { text: 'Consultation completed', color: 'var(--green-dark)' };
      case 'Canceled':
        return { text: 'Appointment canceled', color: 'var(--red-dark)' };
      default:
        return { text: 'Scheduled – not checked in', color: 'var(--text-secondary)' };
    }
  };

  const rowMenu = (apt: Appointment): MenuItem[] => [
    { label: 'Mark as Waiting', icon: Timer, onClick: () => handleUpdateStatus(apt.id, 'Waiting') },
    { label: 'Reschedule', icon: CalendarClock, onClick: () => showToast(`Reschedule request sent to front desk for ${apt.patientName}`, 'info') },
    { label: 'Open EMR', icon: FolderOpen, onClick: () => openPatientScreen(apt, 'emr') },
    { label: 'Cancel / No Show', icon: UserX, onClick: () => handleUpdateStatus(apt.id, 'Canceled') }
  ];

  const outlineBtn: React.CSSProperties = { height: 34, padding: '0 12px', fontSize: 'var(--fs-sm)', borderColor: 'var(--border-strong)' };

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="Appointments"
        subtitle="Manage your appointments, schedule and follow-ups"
        actions={
          <>
            <button className="btn-outline-blue" style={{ borderColor: 'var(--border-strong)', padding: '0 20px' }} onClick={() => showToast('Schedule block slot added for 1:00 PM - 2:00 PM')}>
              <CalendarDays size={16} />
              <span>Block Time</span>
            </button>
            <button className="btn-primary" style={{ padding: '0 22px' }} onClick={() => setIsAddAptModalOpen(true)}>
              <Plus size={18} />
              <span>Add Appointment</span>
            </button>
            <div style={{ position: 'relative' }}>
              <button className="btn-secondary" style={{ width: 44, padding: 0, background: 'var(--bg-tab)', borderColor: 'var(--bg-tab)' }} onClick={toggleMenu('header')} aria-label="More options">
                <MoreVertical size={17} color="var(--blue-text)" />
              </button>
              {openMenu === 'header' && (
                <PopMenu
                  onClose={() => setOpenMenu(null)}
                  items={[
                    { label: 'Print Day Schedule', icon: Printer, onClick: () => showToast(`Preparing schedule for ${fmtDate(selectedDate)} for print…`) },
                    { label: 'Export to CSV', icon: Download, onClick: () => showToast('Appointments exported to CSV') },
                    { label: 'Schedule Settings', icon: Settings, onClick: () => setActiveScreen('settings') }
                  ]}
                />
              )}
            </div>
          </>
        }
      />

      {/* View tabs + date navigator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
        <div className="page-tabs">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab}
              className={`page-tab-btn ${viewTab === tab ? 'active' : ''}`}
              style={{ fontSize: 12.5, padding: '0 17px' }}
              onClick={() => {
                setViewTab(tab);
                setPage(1);
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 40, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: '#ffffff' }}>
            <button onClick={() => selectDate(shiftIso(selectedDate, -1))} style={{ width: 32, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Previous day">
              <ChevronLeft size={15} />
            </button>
            <span style={{ padding: '0 14px', height: '100%', display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {fmtDate(selectedDate)}
            </span>
            <button onClick={() => selectDate(shiftIso(selectedDate, 1))} style={{ width: 32, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Next day">
              <ChevronRight size={15} />
            </button>
          </div>
          <button className="btn-outline-blue" style={{ height: 40, width: 94, fontSize: 12.5, borderColor: 'var(--border-strong)' }} onClick={() => selectDate(TODAY)}>
            Today
          </button>
        </div>
      </div>

      {/* 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '258px minmax(0, 1fr) 375px', gap: 12, alignItems: 'stretch' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {/* Mini calendar */}
          <div className="medios-card" style={{ padding: '20px 12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 0 10px', marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                {MONTHS_LONG[calMonth.m]} {calMonth.y}
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => shiftMonth(-1)} style={{ padding: 2, display: 'flex' }} aria-label="Previous month">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => shiftMonth(1)} style={{ padding: 2, display: 'flex' }} aria-label="Next month">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: 11.5, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
              {WEEKDAYS.map((w) => (
                <span key={w} style={{ lineHeight: '22px' }}>
                  {w}
                </span>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2, textAlign: 'center' }}>
              {calCells.map((c) => {
                const selected = c.iso === selectedDate;
                const hasApts = c.inMonth && appointments.some((a) => a.date === c.iso);
                return (
                  <button
                    key={c.iso}
                    onClick={() => selectDate(c.iso)}
                    style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
                    title={hasApts ? 'Has appointments' : undefined}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: selected ? 600 : 400,
                        background: selected ? 'var(--blue-primary)' : 'transparent',
                        color: selected ? '#ffffff' : c.inMonth ? 'var(--text-primary)' : '#b3bccb'
                      }}
                    >
                      {c.day}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doctor schedule */}
          <div className="medios-card" style={{ padding: '16px 14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={cardTitle}>Doctor Schedule</span>
              <button onClick={() => setActiveScreen('settings')} style={{ display: 'flex', padding: 2 }} aria-label="Schedule settings">
                <Settings size={15} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {SESSIONS.map((s) => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sessionsOn[s.id]}
                    onChange={() => {
                      setSessionsOn((prev) => ({ ...prev, [s.id]: !prev[s.id] }));
                      setPage(1);
                    }}
                    style={{ width: 16, height: 16, accentColor: 'var(--blue-primary)', flexShrink: 0 }}
                  />
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: s.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)', lineHeight: '17px' }}>{s.name}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: '16px' }}>{s.time}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="medios-card" style={{ padding: '18px 12px 14px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={cardTitle}>Filters</span>
              <button className="text-link" style={{ fontWeight: 400 }} onClick={resetFilters}>
                Reset
              </button>
            </div>
            <SelectBox label="Appointment Type" value={typeFilter} options={['All Types', 'OPD Consultation', 'Follow-up', 'Teleconsultation', 'Emergency']} onChange={(v) => { setTypeFilter(v); setPage(1); }} />
            <SelectBox label="Patient Status" value={statusFilter} options={['All', 'Checked In', 'Waiting', 'In Consultation', 'Scheduled', 'Completed', 'Canceled']} onChange={(v) => { setStatusFilter(v); setPage(1); }} />
            <SelectBox label="Time Slot" value={slotFilter} options={['All', 'Morning (09:00 - 13:00)', 'Afternoon (13:00 - 17:00)']} onChange={(v) => { setSlotFilter(v); setPage(1); }} />
            <div style={{ display: 'flex', height: 38, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: '#ffffff', marginTop: 6 }}>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, UHID or phone..."
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', padding: '0 0 0 12px', fontSize: 'var(--fs-sm)' }}
              />
              <span style={{ width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border-subtle)' }}>
                <Search size={15} />
              </span>
            </div>
          </div>
        </div>

        {/* Center: timeline list */}
        <div className="medios-card" style={{ padding: '12px 12px 10px 6px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 0 10px 6px', borderBottom: '1px solid var(--border-subtle)', marginLeft: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
              <h3 style={{ fontSize: 17.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {isToday ? 'Today' : WEEKDAYS[parseIso(selectedDate).getDay()]}, {fmtDate(selectedDate)}
              </h3>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', background: 'var(--bg-tab)', borderRadius: 'var(--radius-xs)', padding: '3px 7px', whiteSpace: 'nowrap' }}>
                {dayAppointments.length} Appointments
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {kpis.map((k) => (
                <button
                  key={k.label}
                  onClick={() => {
                    setStatusFilter((cur) => (cur === k.filter ? 'All' : k.filter));
                    setPage(1);
                  }}
                  title={`Show ${k.label}`}
                  style={{
                    minWidth: 66,
                    height: 50,
                    padding: '0 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: k.bg,
                    border: `1px solid ${statusFilter === k.filter ? k.color : k.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: k.color
                  }}
                >
                  <span style={{ fontSize: 17, fontWeight: 700, lineHeight: '20px' }}>{k.value}</span>
                  <span style={{ fontSize: 10, lineHeight: '13px', whiteSpace: 'nowrap' }}>{k.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Queue */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {pageRows.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                  No appointments {dayAppointments.length ? `for "${viewTab}" with the current filters` : `on ${fmtDate(selectedDate)}`}
                </p>
                <button
                  className="btn-secondary btn-sm"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    setViewTab('Daily View');
                    resetFilters();
                    if (!dayAppointments.length) selectDate(TODAY);
                  }}
                >
                  {dayAppointments.length ? 'Clear filters' : 'Back to today'}
                </button>
              </div>
            ) : (
              pageRows.map((apt, i) => {
                const isSelected = selectedApt?.id === apt.id;
                const meta = STATUS_META[apt.status];
                const prevColor = i === 0 ? '#d5dce7' : STATUS_META[pageRows[i - 1].status].dot;
                const lineColor = (c: string) => (c === '#a3adbf' ? '#d5dce7' : c);
                return (
                  <div
                    key={apt.id}
                    onClick={() => {
                      setSelectedAptId(apt.id);
                      setEditingNote(false);
                    }}
                    style={{ display: 'flex', alignItems: 'center', minHeight: 67, cursor: 'pointer', position: 'relative', background: isSelected ? '#f5f8fe' : 'transparent', borderRadius: 'var(--radius-sm)' }}
                  >
                    {/* timeline gutter */}
                    <div style={{ width: 16, alignSelf: 'stretch', position: 'relative', flexShrink: 0 }}>
                      <span style={{ position: 'absolute', left: 7, top: 0, height: '50%', width: 1.5, background: lineColor(prevColor) }} />
                      {i < pageRows.length - 1 && <span style={{ position: 'absolute', left: 7, top: '50%', bottom: 0, width: 1.5, background: lineColor(meta.dot) }} />}
                      <span style={{ position: 'absolute', left: 3, top: 'calc(50% - 5px)', width: 10, height: 10, borderRadius: '50%', background: meta.dot, boxShadow: '0 0 0 2px #ffffff' }} />
                    </div>
                    <span style={{ width: 63, paddingLeft: 7, fontSize: 12, color: 'var(--text-primary)', flexShrink: 0, whiteSpace: 'nowrap' }}>{apt.time}</span>

                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 14, alignSelf: 'stretch', borderBottom: i < pageRows.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingLeft: 12 }}>
                      <Avatar name={apt.patientName} size={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: '17px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{apt.patientName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-secondary)', lineHeight: '16px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          <span>{apt.age} Yrs</span>
                          <span style={{ width: 1, height: 10, background: 'var(--border-strong)' }} />
                          <span>{apt.gender}</span>
                          <span style={{ width: 1, height: 10, background: 'var(--border-strong)' }} />
                          <span>{apt.uhid}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: '17px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{apt.condition}</div>
                      </div>

                      <span style={{ width: 88, flexShrink: 0, display: 'flex' }}>
                        <span className={`status-pill ${meta.pill}`} style={{ height: 26, minWidth: 78, padding: '0 8px', fontSize: 11.5, borderColor: apt.status === 'In Consultation' ? 'var(--blue-border)' : 'transparent' }}>
                          {apt.status}
                        </span>
                      </span>

                      <div style={{ width: 124, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: apt.status === 'In Consultation' ? 'space-between' : 'flex-start', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                        {apt.status === 'Checked In' && (
                          <button className="btn-primary" style={{ width: 118, height: 34, fontSize: 11.5, padding: 0 }} onClick={() => openPatientScreen(apt, 'consultation')}>
                            Start Consultation
                          </button>
                        )}
                        {apt.status === 'Waiting' && (
                          <button className="btn-outline-blue" style={{ ...outlineBtn, width: 118, fontSize: 11.5 }} onClick={() => showToast(`Calling patient: ${apt.patientName}`)}>
                            Call Patient
                          </button>
                        )}
                        {apt.status === 'In Consultation' && (
                          <>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green-emerald)' }} />
                              {apt.consultationDuration || '00:12:35'}
                            </span>
                            <button className="btn-outline-blue" style={{ ...outlineBtn, width: 56, padding: 0, fontSize: 11.5 }} onClick={() => openPatientScreen(apt, 'consultation')}>
                              View
                            </button>
                          </>
                        )}
                        {apt.status === 'Scheduled' && (
                          <button className="btn-outline-blue" style={{ ...outlineBtn, width: 76, padding: 0, fontSize: 11.5 }} onClick={() => handleUpdateStatus(apt.id, 'Checked In')}>
                            Check In
                          </button>
                        )}
                        {apt.status === 'Completed' && (
                          <button className="btn-outline-blue" style={{ ...outlineBtn, width: 76, padding: 0, fontSize: 11.5 }} onClick={() => openPatientScreen(apt, 'emr')}>
                            Summary
                          </button>
                        )}
                        {apt.status === 'Canceled' && (
                          <button className="btn-outline-blue" style={{ ...outlineBtn, width: 76, padding: 0, fontSize: 11.5 }} onClick={() => handleUpdateStatus(apt.id, 'Scheduled')}>
                            Restore
                          </button>
                        )}
                      </div>
                      <div style={{ position: 'relative', flexShrink: 0, marginLeft: 5 }} onClick={(e) => e.stopPropagation()}>
                        <button className="icon-btn" style={{ width: 36, height: 34, borderColor: 'var(--border-strong)' }} onClick={toggleMenu(`row-${apt.id}`)} aria-label={`More actions for ${apt.patientName}`}>
                          <MoreHorizontal size={16} color="var(--blue-text)" />
                        </button>
                        {openMenu === `row-${apt.id}` && <PopMenu items={rowMenu(apt)} onClose={() => setOpenMenu(null)} up={i >= pageRows.length - 3 && i > 2} />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 4px 8px', fontSize: 12.5, color: 'var(--text-primary)' }}>
            <span>
              Showing {firstRow} to {lastRow} of {displayedAppointments.length} appointments
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} style={{ width: 28, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)' }} aria-label="Previous page">
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  style={{
                    width: 28,
                    height: 30,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    border: `1px solid ${n === currentPage ? 'var(--blue-border)' : 'var(--border-color)'}`,
                    background: n === currentPage ? 'var(--blue-light)' : '#ffffff',
                    color: n === currentPage ? 'var(--blue-text)' : 'var(--blue-text)'
                  }}
                >
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(pageCount, currentPage + 1))} disabled={currentPage === pageCount} style={{ width: 28, height: 30, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Next page">
                <ChevronRight size={15} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>Rows per page</span>
              <select
                className="form-select"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                style={{ width: 76, height: 32, fontSize: 12.5 }}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: selected appointment */}
        {selectedApt && (
          <div className="medios-card" style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <Avatar name={selectedApt.patientName} size={68} />
              <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {selectedApt.patientName}
                  {selectedApt.gender === 'Female' ? <Venus size={15} color="var(--blue-text)" strokeWidth={2.4} /> : <Mars size={15} color="var(--blue-text)" strokeWidth={2.4} />}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 11.5, color: 'var(--text-primary)', marginTop: 3 }}>
                  <span>{selectedApt.age} Years</span>
                  <span className="patient-meta-sep" />
                  <span>{selectedApt.gender}</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-primary)', marginTop: 1 }}>UHID: {selectedApt.uhid}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-primary)', marginTop: 1 }}>
                  <Phone size={11} fill="currentColor" strokeWidth={0} />
                  <span>{selectedApt.phone}</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setDetailTab('quick')} aria-label="Patient quick info">
                <MoreVertical size={16} color="var(--blue-text)" />
              </button>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {(selectedApt.tags?.length ? selectedApt.tags : [...(selectedPatient?.conditions ?? []), ...(selectedPatient?.allergies ?? [])]).map(tagBadge)}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              {([
                ['details', 'Appointment Details'],
                ['quick', 'Patient Quick Info']
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  className={`card-tab-btn ${detailTab === id ? 'active' : ''}`}
                  style={{ flex: 1, height: 36, padding: 0, fontSize: 12, color: detailTab === id ? undefined : 'var(--text-primary)' }}
                  onClick={() => setDetailTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {detailTab === 'details' ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, padding: '2px 4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ ...detailRow, width: 160 }}>
                      <CalendarDays size={15} />
                      {fmtDate(selectedApt.date)}
                    </span>
                    <span style={detailRow}>
                      <Clock size={15} />
                      {selectedApt.time}
                    </span>
                  </div>
                  <span style={detailRow}>
                    <SquareUserRound size={15} />
                    {selectedApt.type}
                  </span>
                  <span style={detailRow}>
                    <NotebookPen size={15} />
                    {VISIT_REASON[selectedApt.id] || selectedApt.condition}
                  </span>
                  <span style={{ ...detailRow, color: statusLine(selectedApt).color, fontWeight: 600, whiteSpace: 'pre' }}>
                    <BadgeCheck size={15} color="var(--text-primary)" />
                    {statusLine(selectedApt).text}
                  </span>
                </div>

                {/* Note */}
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '8px 8px 8px 10px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  {editingNote ? (
                    <textarea
                      className="input-field"
                      autoFocus
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      style={{ minHeight: 48, fontSize: 'var(--fs-sm)', padding: '6px 8px' }}
                    />
                  ) : (
                    <p style={{ flex: 1, fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', lineHeight: 1.45 }}>{note || 'No notes for this appointment.'}</p>
                  )}
                  <button
                    className="icon-btn"
                    style={{ width: 30, height: 30 }}
                    onClick={() => {
                      if (editingNote) {
                        setNoteEdits((prev) => ({ ...prev, [selectedApt.id]: noteDraft }));
                        setEditingNote(false);
                        showToast('Appointment note saved');
                      } else {
                        setNoteDraft(note);
                        setEditingNote(true);
                      }
                    }}
                    aria-label={editingNote ? 'Save note' : 'Edit note'}
                  >
                    <Pencil size={14} color="var(--blue-text)" />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 14 }}>
                  <button className="btn-outline-blue" style={{ height: 40, fontSize: 12.5, padding: 0, borderColor: 'var(--border-strong)' }} onClick={() => showToast(`Reschedule request sent to front desk for ${selectedApt.patientName}`, 'info')}>
                    <CalendarClock size={14} />
                    Reschedule
                  </button>
                  <button className="btn-danger-soft" style={{ height: 40, fontSize: 12.5, padding: 0 }} onClick={() => handleUpdateStatus(selectedApt.id, 'Canceled')}>
                    Cancel
                  </button>
                  <button
                    className="btn-outline-blue"
                    style={{ height: 40, fontSize: 12.5, padding: 0, borderColor: 'var(--border-strong)' }}
                    onClick={() => {
                      setNoteDraft(note ? `${note}\n` : '');
                      setEditingNote(true);
                    }}
                  >
                    <SquarePen size={14} />
                    Add Note
                  </button>
                </div>

                {/* Previous appointments */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>Previous Appointments</span>
                    <button className="text-link" style={{ fontSize: 11.5, fontWeight: 400 }} onClick={() => openPatientScreen(selectedApt, 'timeline')}>
                      View All
                    </button>
                  </div>
                  {mockPreviousAppointments.map((p, i) => (
                    <div key={p.date} style={{ display: 'grid', gridTemplateColumns: '18px 92px 94px 1fr', alignItems: 'center', height: 27, fontSize: 11.5, color: 'var(--text-secondary)', borderBottom: i < mockPreviousAppointments.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: i === 0 ? '#5f7896' : 'var(--green-emerald)', boxShadow: `0 0 0 3px ${i === 0 ? '#e3e9f2' : 'var(--green-light)'}` }} />
                      <span>{p.date}</span>
                      <span style={{ color: 'var(--text-primary)' }}>{p.type}</span>
                      <span>{p.notes}</span>
                    </div>
                  ))}
                </div>

                {/* Upcoming appointments */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>Upcoming Appointments</span>
                    <button className="text-link" style={{ fontSize: 11.5, fontWeight: 400 }} onClick={() => openPatientScreen(selectedApt, 'follow-ups')}>
                      View All
                    </button>
                  </div>
                  {mockUpcomingAppointments.map((u) => (
                    <div key={u.date} style={{ display: 'grid', gridTemplateColumns: '18px 92px 94px 1fr', alignItems: 'center', height: 27, fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--orange-amber)' }} />
                      <span>{u.date}</span>
                      <span style={{ color: 'var(--text-primary)' }}>{u.type}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />
                        {u.time}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '0 4px' }}>
                {[
                  ['Blood Group', selectedPatient?.bloodGroup ?? '—'],
                  ['Department', selectedPatient?.department ?? 'General Medicine'],
                  ['Consulting Doctor', selectedPatient?.doctor ?? 'Dr. Shajin'],
                  ['Last Visit', selectedPatient?.lastVisit ?? '—'],
                  ['Visit Type', selectedPatient?.visitType ?? 'OPD'],
                  ['Allergies', selectedPatient?.allergies.length ? selectedPatient.allergies.join(', ').replace(/Allergy:\s*/g, '') : 'None known'],
                  ['Insurance', selectedPatient?.insurance ? `${selectedPatient.insurance.provider} (${selectedPatient.insurance.policyNumber})` : 'Self-pay'],
                  [
                    'Last Vitals',
                    selectedPatient?.vitals ? `BP ${selectedPatient.vitals.bpSystolic}/${selectedPatient.vitals.bpDiastolic} • HR ${selectedPatient.vitals.heartRate} • SpO₂ ${selectedPatient.vitals.spo2}%` : 'Not recorded'
                  ]
                ].map(([k, val]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' }}>{val}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="btn-outline-blue" style={{ flex: 1, borderColor: 'var(--border-strong)' }} onClick={() => openPatientScreen(selectedApt, 'timeline')}>
                    <History size={14} />
                    Timeline
                  </button>
                  <button className="btn-outline-blue" style={{ flex: 1, borderColor: 'var(--border-strong)' }} onClick={() => openPatientScreen(selectedApt, 'documents')}>
                    <FileText size={14} />
                    Documents
                  </button>
                </div>
              </div>
            )}

            {/* Big start button + bottom actions */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 12 }}>
              <button className="btn-primary" style={{ width: '100%', height: 50, fontSize: 13.5, position: 'relative' }} onClick={() => openPatientScreen(selectedApt, 'consultation')}>
                <Stethoscope size={17} />
                <span>Start Consultation</span>
                <ArrowRight size={18} style={{ position: 'absolute', right: 16 }} />
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.9fr', gap: 14 }}>
                <button className="btn-outline-blue" style={{ height: 42, fontSize: 12, padding: 0, borderColor: 'var(--border-strong)' }} onClick={() => openPatientScreen(selectedApt, 'emr')}>
                  <FolderOpen size={15} />
                  <span>View Full EMR</span>
                </button>
                <button className="btn-outline-blue" style={{ height: 42, fontSize: 12, padding: 0, borderColor: 'var(--border-strong)' }} onClick={() => openPatientScreen(selectedApt, 'prescriptions')}>
                  <Pill size={15} />
                  <span>Prescribe</span>
                </button>
                <div style={{ position: 'relative', display: 'flex' }}>
                  <button className="btn-outline-blue" style={{ flex: 1, height: 42, fontSize: 12, padding: 0, borderColor: 'var(--border-strong)' }} onClick={toggleMenu('more')}>
                    <MoreHorizontal size={15} />
                    <span>More</span>
                  </button>
                  {openMenu === 'more' && (
                    <PopMenu
                      up
                      onClose={() => setOpenMenu(null)}
                      items={[
                        { label: 'Lab Reports', icon: FileText, onClick: () => openPatientScreen(selectedApt, 'lab-reports') },
                        { label: 'Patient Timeline', icon: History, onClick: () => openPatientScreen(selectedApt, 'timeline') },
                        { label: 'Billing', icon: FolderOpen, onClick: () => openPatientScreen(selectedApt, 'billing') }
                      ]}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Appointment Modal */}
      {isAddAptModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddAptModalOpen(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule New Appointment</h3>
              <button onClick={() => setIsAddAptModalOpen(false)} style={{ color: 'var(--text-muted)' }} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment}>
              <div className="modal-body">
                <div>
                  <label className="form-label">Patient Name *</label>
                  <input type="text" required className="input-field" placeholder="e.g. Arun Kumar" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Age</label>
                    <input type="number" className="input-field" placeholder="e.g. 34" value={age} onChange={(e) => setAge(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Time Slot *</label>
                    <select className="form-select" value={time} onChange={(e) => setTime(e.target.value)}>
                      <option>09:00 AM</option>
                      <option>09:30 AM</option>
                      <option>10:00 AM</option>
                      <option>10:30 AM</option>
                      <option>11:00 AM</option>
                      <option>11:30 AM</option>
                      <option>02:00 PM</option>
                      <option>04:30 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Appointment Type</label>
                    <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                      <option>Follow-up</option>
                      <option>General OPD</option>
                      <option>Emergency</option>
                      <option>Teleconsultation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Chief Complaint / Purpose</label>
                  <input type="text" className="input-field" placeholder="e.g. Hypertension follow-up, Fever review" value={condition} onChange={(e) => setCondition(e.target.value)} />
                </div>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>Booking for {fmtDate(selectedDate)}</p>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddAptModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
