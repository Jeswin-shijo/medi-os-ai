import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/appContextCore';
import { Patient } from '../../types';
import { patientService } from '../../services';
import { mockImagingStudies } from '../../mock/imagingData';
import { CHEST_XRAY_THUMB, USG_ABDOMEN_THUMB } from '../../mock/imagingThumbsData';
import { StudyThumb } from '../common/StudyThumb';
import { ConditionBadge } from '../common/ConditionBadge';
import { CONDITION_TONES, conditionStyle } from '../common/conditionStyles';
import { ScreenHeader } from '../common/ScreenHeader';
import { Avatar } from '../common/Avatar';
import { AiSparkle, AllergyIcon } from '../common/icons';
import {
  Search,
  Plus,
  Share,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Funnel,
  MoreHorizontal,
  MoreVertical,
  X,
  Phone,
  Mars,
  Venus,
  BadgeCheck,
  SquarePen,
  Cross,
  CircleCheck,
  History,
  Stethoscope,
  FolderOpen,
  Pill,
  HeartPulse,
  ScanLine,
  FileText,
  CalendarPlus,
  UserRound,
  Printer,
  type LucideIcon
} from 'lucide-react';

const PAGE_TABS = [
  'All Patients',
  "Today's Patients",
  'Inpatients',
  'Outpatients',
  'Follow-ups',
  'Recently Discharged',
  'My Patients'
] as const;
type PageTab = (typeof PAGE_TABS)[number];

const DRAWER_TABS = ['Overview', 'Timeline', 'Consultations', 'Lab Reports', 'Imaging'] as const;
type DrawerTab = (typeof DRAWER_TABS)[number];

const MY_DOCTOR = 'Dr. Shajin';
/** Registered patients in the hospital registry beyond the locally cached demo records. */
const REGISTRY_EXTRA = 330;

// Demo-only display details that the shared patient records don't carry.
const IP_NUMBERS: Record<string, string> = { 'p-1': 'IP-1256', 'p-2': 'IP-1257', 'p-3': 'IP-1258', 'p-5': 'IP-1259', 'p-7': 'IP-1260' };
const VISIT_OVERRIDE: Record<string, string> = { 'p-1': '26 Sep 2026 09:15 AM' };
const ABHA_LINKED = new Set(['p-1', 'p-2', 'p-7']);

const riskOf = (p: Patient): 'High' | 'Medium' | 'Low' => {
  if (p.status === 'Admitted' || p.visitType === 'IPD') return 'High';
  if (p.conditions.length + p.allergies.length >= 2) return 'Medium';
  return 'Low';
};

const splitVisit = (value: string) => {
  const m = value.match(/^(\d{1,2} \w{3} \d{4})\s*(.*)$/);
  return m ? { date: m[1], time: m[2] } : { date: value, time: '' };
};

const statusClass = (s: Patient['status']) =>
  s === 'Today' ? 'today' : s === 'Admitted' ? 'admitted' : s === 'Follow-up' ? 'follow-up' : 'scheduled';

// Small popover menu used by the row "⋯", panel "⋮", Import and More buttons.
interface MenuItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}
const PopMenu: React.FC<{ items: MenuItem[]; align?: 'left' | 'right'; up?: boolean; onClose: () => void }> = ({ items, align = 'right', up, onClose }) => (
  <div
    onClick={(e) => e.stopPropagation()}
    style={{
      position: 'absolute',
      [align]: 0,
      ...(up ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
      minWidth: 190,
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

// Labelled dropdown box of the filter row ("Department / All ⌄").
const FilterBox: React.FC<{ label: string; value: string; options: string[]; onChange: (v: string) => void; width: number }> = ({ label, value, options, onChange, width }) => (
  <label
    style={{
      position: 'relative',
      width,
      height: 46,
      padding: '5px 10px 0',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-sm)',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
      flexShrink: 0
    }}
  >
    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)', lineHeight: '15px' }}>{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        appearance: 'none',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontSize: 11.5,
        color: 'var(--text-secondary)',
        padding: '0 16px 0 0',
        height: 20,
        width: '100%',
        cursor: 'pointer'
      }}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
    <ChevronDown size={13} color="var(--text-secondary)" style={{ position: 'absolute', right: 8, bottom: 9, pointerEvents: 'none' }} />
  </label>
);

const thStyle: React.CSSProperties = { padding: '13px 8px' };
const tdStyle: React.CSSProperties = { padding: '5px 8px' };
const cellLine: React.CSSProperties = { fontSize: 12.5, lineHeight: '19px', color: 'var(--text-primary)', whiteSpace: 'nowrap' };

const LAB_SUMMARY = [
  { name: 'HbA1c', value: '7.8 %', color: 'var(--red-dark)', icon: 'var(--blue-text)', done: false },
  { name: 'Hemoglobin', value: '10.4 g/dL ↓', color: 'var(--red-dark)', icon: 'var(--orange-amber)', done: false },
  { name: 'Creatinine', value: '1.0 mg/dL', color: 'var(--text-primary)', icon: 'var(--green-emerald)', done: true },
  { name: 'WBC', value: '10,900 /µL', color: 'var(--orange-dark)', icon: 'var(--orange-amber)', done: false }
];

const MEDICATIONS = [
  { name: 'Amlodipine 5 mg (OD)', dose: '1-0-0' },
  { name: 'Metformin 500 mg (BD)', dose: '1-0-1' },
  { name: 'Atorvastatin 10 mg (OD)', dose: '0-1-0' }
];

const IMAGING = [
  { id: mockImagingStudies[0]?.id, title: 'Chest X-Ray', date: '12 Sep 2026', result: 'Normal', color: 'var(--green-emerald)', thumb: CHEST_XRAY_THUMB },
  { id: mockImagingStudies[1]?.id, title: 'USG Abdomen', date: '21 Mar 2026', result: 'Fatty liver (mild)', color: 'var(--orange-amber)', thumb: USG_ABDOMEN_THUMB }
];

const miniCard: React.CSSProperties = {
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  background: '#ffffff'
};

const sectionTitle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 };

export const PatientsScreen: React.FC = () => {
  const { activePatient, setActivePatient, setActiveScreen, showToast } = useApp();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<PageTab>('All Patients');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('p-1');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set(['p-1']));
  const [drawerSubtab, setDrawerSubtab] = useState<DrawerTab>('Overview');
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Filters
  const [department, setDepartment] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState('Today');
  const [doctorFilter, setDoctorFilter] = useState('Me');
  const [riskFilter, setRiskFilter] = useState('All');
  const [sortByStatus, setSortByStatus] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // New Patient Form State
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newPhone, setNewPhone] = useState('');
  const [newBloodGroup, setNewBloodGroup] = useState('B+');
  const [newDepartment, setNewDepartment] = useState('General Medicine');
  const [newConditions, setNewConditions] = useState('');

  useEffect(() => {
    patientService.getPatients().then((list) => {
      setPatients(list);
      if (list.length === 0) return;
      const current = activePatient && list.find((p) => p.id === activePatient.id);
      if (current) {
        setSelectedPatientId(current.id);
      } else {
        setActivePatient(list[0]);
        setSelectedPatientId(list[0].id);
      }
    });
    // Load once on mount; later selections are driven by handleSelectPatient.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close any open popover menu on outside click.
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

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatientId(p.id);
    setActivePatient(p);
  };

  const openFor = (p: Patient, screen: Parameters<typeof setActiveScreen>[0]) => {
    setActivePatient(p);
    setActiveScreen(screen);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    const conditionArr = newConditions ? newConditions.split(',').map((c) => c.trim()) : ['Hypertension'];
    const added = await patientService.addPatient({
      uhid: `MHK202500${Math.floor(100 + Math.random() * 900)}`,
      name: newName,
      age: parseInt(newAge) || 30,
      gender: newGender,
      phone: newPhone,
      bloodGroup: newBloodGroup,
      visitType: 'OPD',
      status: 'Today',
      department: newDepartment,
      lastVisit: 'Today',
      doctor: MY_DOCTOR,
      conditions: conditionArr,
      allergies: []
    });

    const refreshed = await patientService.getPatients();
    setPatients(refreshed);
    handleSelectPatient(added);
    setIsAddPatientOpen(false);
    showToast(`Patient ${added.name} successfully registered!`);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDepartment('All');
    setStatusFilter('All');
    setDateRange('Today');
    setDoctorFilter('Me');
    setRiskFilter('All');
    setSortByStatus(false);
    setActiveTab('All Patients');
    setPage(1);
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredPatients = patients
    .filter((p) => {
      if (q && !(p.name.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q) || p.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) || (IP_NUMBERS[p.id] || '').toLowerCase().includes(q))) return false;
      if (activeTab === "Today's Patients" && p.status !== 'Today') return false;
      if (activeTab === 'Inpatients' && p.visitType !== 'IPD') return false;
      if (activeTab === 'Outpatients' && p.visitType !== 'OPD') return false;
      if (activeTab === 'Follow-ups' && p.status !== 'Follow-up') return false;
      if (activeTab === 'Recently Discharged' && p.status !== 'Discharged') return false;
      if (activeTab === 'My Patients' && p.doctor !== MY_DOCTOR) return false;
      if (department !== 'All' && p.department !== department) return false;
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (doctorFilter.startsWith('Dr.') && p.doctor !== doctorFilter) return false;
      if (riskFilter !== 'All' && riskOf(p) !== riskFilter) return false;
      return true;
    })
    .sort((a, b) => (sortByStatus ? a.status.localeCompare(b.status) : 0));

  const isUnfiltered =
    !q && activeTab === 'All Patients' && department === 'All' && statusFilter === 'All' && !doctorFilter.startsWith('Dr.') && riskFilter === 'All';
  const totalCount = isUnfiltered ? REGISTRY_EXTRA + patients.length : filteredPatients.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / rowsPerPage));
  const localPages = Math.max(1, Math.ceil(filteredPatients.length / rowsPerPage));
  const currentPage = Math.min(page, localPages);
  const pageRows = filteredPatients.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const firstRow = pageRows.length ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const lastRow = (currentPage - 1) * rowsPerPage + pageRows.length;

  const goToPage = (n: number) => {
    if (n < 1 || n > pageCount) return;
    if (n > localPages) {
      showToast(`Loading page ${n} of ${pageCount} from the hospital registry…`, 'info');
      return;
    }
    setPage(n);
  };

  const pageButtons: (number | '…')[] =
    pageCount <= 7
      ? Array.from({ length: pageCount }, (_, i) => i + 1)
      : currentPage <= 4
        ? [1, 2, 3, 4, 5, '…', pageCount]
        : [1, '…', currentPage - 1, currentPage, currentPage + 1, '…', pageCount];

  const allVisibleChecked = pageRows.length > 0 && pageRows.every((p) => checkedIds.has(p.id));
  const toggleChecked = (id: string) =>
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAllVisible = () =>
    setCheckedIds((prev) => {
      const next = new Set(prev);
      pageRows.forEach((p) => (allVisibleChecked ? next.delete(p.id) : next.add(p.id)));
      return next;
    });

  const departments = ['All', ...Array.from(new Set(patients.map((p) => p.department)))];

  const rowMenuItems = (p: Patient): MenuItem[] => [
    { label: 'View Profile', icon: UserRound, onClick: () => handleSelectPatient(p) },
    { label: 'Start Consultation', icon: Stethoscope, onClick: () => openFor(p, 'consultation') },
    { label: 'Open EMR', icon: FolderOpen, onClick: () => openFor(p, 'emr') },
    { label: 'Book Appointment', icon: CalendarPlus, onClick: () => openFor(p, 'appointments') }
  ];

  const summaryText =
    selectedPatient?.aiSummary?.summary ||
    `${selectedPatient?.age}-year-old ${selectedPatient?.gender.toLowerCase()} under ${selectedPatient?.department}. Last visit ${selectedPatient?.lastVisit}. No recent hospital admissions.`;
  const keyPoints = selectedPatient?.aiSummary?.keyPoints || [
    `Known: ${selectedPatient?.conditions.join(', ') || 'no chronic conditions'}`,
    'Vitals stable at last visit',
    'No pending investigations'
  ];
  const v = selectedPatient?.vitals;
  const vitals = [
    { label: 'BP', value: v ? `${v.bpSystolic}/${v.bpDiastolic}` : '140/90', unit: 'mmHg', alert: v ? v.bpSystolic >= 140 : true },
    { label: 'HR', value: String(v?.heartRate ?? 86), unit: 'bpm', alert: false },
    { label: 'Temp', value: String(v?.temperature ?? 98.4), unit: '°F', alert: false },
    { label: 'SpO₂', value: String(v?.spo2 ?? 98), unit: '%', alert: false }
  ];

  const recordCard: React.CSSProperties = { background: 'var(--bg-subtle)', padding: '9px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 'var(--fs-sm)' };

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="Patients"
        subtitle="View, search and manage all your patients"
        actions={
          <>
            <button className="btn-primary" onClick={() => setIsAddPatientOpen(true)}>
              <Plus size={18} />
              <span>Add New Patient</span>
            </button>
            <div style={{ position: 'relative' }}>
              <button className="btn-secondary" style={{ paddingRight: 12 }} onClick={toggleMenu('import')}>
                <Share size={16} color="var(--blue-text)" />
                <span>Import</span>
                <span style={{ width: 1, height: 22, background: 'var(--border-color)', margin: '0 2px 0 8px' }} />
                <ChevronDown size={16} />
              </button>
              {openMenu === 'import' && (
                <PopMenu
                  onClose={() => setOpenMenu(null)}
                  items={[
                    { label: 'Import from CSV / Excel', icon: FileText, onClick: () => showToast('Importing records from CSV…') },
                    { label: 'Import from EMR', icon: FolderOpen, onClick: () => showToast('Importing records from EMR...') },
                    { label: 'Link ABHA records', icon: BadgeCheck, onClick: () => showToast('Fetching ABHA-linked records…') }
                  ]}
                />
              )}
            </div>
          </>
        }
      />

      {/* Page tabs */}
      <div className="page-tabs">
        {PAGE_TABS.map((tab) => (
          <button
            key={tab}
            className={`page-tab-btn ${activeTab === tab ? 'active' : ''}`}
            style={{ fontSize: 12.5, padding: '0 16px' }}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table column + patient panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 480px', gap: 12, alignItems: 'stretch', marginTop: -10 }}>
        <div className="medios-card" style={{ padding: '14px 10px 10px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Filter row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 0 2px' }}>
            <div style={{ position: 'relative', width: 222, flexShrink: 0, height: 40, display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: '#ffffff' }}>
              <input
                type="text"
                placeholder="Search by name, UHID, phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', padding: '0 0 0 12px', fontSize: 'var(--fs-sm)' }}
              />
              <span style={{ width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                <Search size={15} />
              </span>
            </div>
            <FilterBox label="Department" value={department} options={departments} width={84} onChange={(val) => { setDepartment(val); setPage(1); }} />
            <FilterBox label="Status" value={statusFilter} options={['All', 'Today', 'Admitted', 'Follow-up', 'Discharged']} width={66} onChange={(val) => { setStatusFilter(val); setPage(1); }} />
            <FilterBox
              label="Date Range"
              value={dateRange}
              options={['Today', 'This Week', 'This Month', 'Last 3 Months', 'All Time']}
              width={88}
              onChange={(val) => {
                setDateRange(val);
                showToast(`Visit date range set to ${val}`, 'info');
              }}
            />
            <FilterBox label="Doctor" value={doctorFilter} options={['Me', 'Dr. Ravi', 'Dr. Priya']} width={68} onChange={(val) => { setDoctorFilter(val); setPage(1); }} />
            <FilterBox label="Risk" value={riskFilter} options={['All', 'High', 'Medium', 'Low']} width={56} onChange={(val) => { setRiskFilter(val); setPage(1); }} />
            <button
              onClick={() => showToast('Advanced filters: blood group, insurance, age band — coming soon', 'info')}
              style={{ width: 80, height: 46, flexShrink: 0, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}
            >
              <Funnel size={13} />
              <span>More Filters</span>
            </button>
            <button className="text-link" style={{ fontSize: 12.5, marginLeft: 'auto', paddingRight: 4 }} onClick={resetFilters}>
              Reset
            </button>
          </div>

          {/* Patients table */}
          <table className="medios-table" style={{ tableLayout: 'fixed', marginTop: 18 }}>
            <colgroup>
              <col style={{ width: 32 }} />
              <col style={{ width: 30 }} />
              <col />
              <col style={{ width: 95 }} />
              <col style={{ width: 119 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 93 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 66 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle}>
                  <input type="checkbox" checked={allVisibleChecked} onChange={toggleAllVisible} aria-label="Select all patients on this page" />
                </th>
                <th style={thStyle}>#</th>
                <th style={{ ...thStyle, paddingLeft: 12 }}>Patient</th>
                <th style={thStyle}>Age / Gender</th>
                <th style={thStyle}>UHID / IP No</th>
                <th style={thStyle}>Visit Type</th>
                <th style={thStyle}>Last Visit</th>
                <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => setSortByStatus((s) => !s)} title="Sort by status">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    Status
                    <ChevronsUpDown size={11} color={sortByStatus ? 'var(--blue-text)' : 'var(--border-strong)'} />
                  </span>
                </th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '40px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No patients match “{activeTab}” with the current filters</div>
                    <button className="btn-secondary btn-sm" onClick={resetFilters}>
                      Reset filters
                    </button>
                  </td>
                </tr>
              )}
              {pageRows.map((pat, index) => {
                const isSelected = selectedPatient?.id === pat.id;
                const visit = splitVisit(VISIT_OVERRIDE[pat.id] || pat.lastVisit);
                return (
                  <tr key={pat.id} className={isSelected ? 'selected' : ''} onClick={() => handleSelectPatient(pat)} style={{ cursor: 'pointer', height: 59 }}>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={checkedIds.has(pat.id)} onChange={() => toggleChecked(pat.id)} aria-label={`Select ${pat.name}`} />
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{firstRow + index}</td>
                    <td style={{ ...tdStyle, paddingLeft: 2, paddingRight: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={pat.name} size={40} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, lineHeight: '16px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{pat.name}</span>
                            {ABHA_LINKED.has(pat.id) && (
                              <span title="ABHA ID linked" style={{ display: 'inline-flex' }}>
                                <BadgeCheck size={11} color="var(--blue-text)" />
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', lineHeight: '13px', whiteSpace: 'nowrap' }}>{pat.phone}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
                            {pat.conditions.map((c) => {
                              const { tone, icon: Icon } = conditionStyle(c);
                              return (
                                <span
                                  key={c}
                                  title={c}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 3, height: 17, maxWidth: '100%', padding: '0 4px', borderRadius: 'var(--radius-xs)', fontSize: 10, lineHeight: 1, background: CONDITION_TONES[tone].bg, color: CONDITION_TONES[tone].fg, whiteSpace: 'nowrap' }}
                                >
                                  <Icon size={9} strokeWidth={2.6} style={{ flexShrink: 0 }} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={cellLine}>{pat.age} Yrs</div>
                      <div style={cellLine}>{pat.gender}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ ...cellLine, fontSize: 'var(--fs-sm)' }}>{pat.uhid}</div>
                      {IP_NUMBERS[pat.id] && <div style={{ ...cellLine, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{IP_NUMBERS[pat.id]}</div>}
                    </td>
                    <td style={tdStyle}>
                      <span className={`status-pill ${pat.visitType === 'OPD' ? 'green' : 'red'}`} style={{ minWidth: 50, height: 26, fontSize: 'var(--fs-sm)', fontWeight: 500 }}>
                        {pat.visitType}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ ...cellLine, fontSize: 'var(--fs-sm)' }}>{visit.date}</div>
                      {visit.time && <div style={{ ...cellLine, fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{visit.time}</div>}
                    </td>
                    <td style={tdStyle}>
                      <span className={`status-pill ${statusClass(pat.status)}`} style={{ height: 24, padding: '0 11px', fontSize: 'var(--fs-sm)' }}>
                        {pat.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button className="icon-btn" style={{ width: 40, height: 30 }} onClick={toggleMenu(`row-${pat.id}`)} aria-label={`Actions for ${pat.name}`}>
                          <MoreHorizontal size={16} color="var(--blue-text)" />
                        </button>
                        {openMenu === `row-${pat.id}` && <PopMenu items={rowMenuItems(pat)} onClose={() => setOpenMenu(null)} up={index >= pageRows.length - 3 && index > 2} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 4px 2px', marginTop: 'auto', fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
            <span>
              Showing {firstRow} to {lastRow} of {totalCount} patients
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }} aria-label="Previous page">
                <ChevronLeft size={15} />
              </button>
              {pageButtons.map((n, i) =>
                n === '…' ? (
                  <span key={`gap-${i}`} style={{ width: 26, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    onClick={() => goToPage(n)}
                    style={{
                      minWidth: 26,
                      height: 26,
                      padding: '0 4px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--fs-sm)',
                      border: n === currentPage ? '1px solid var(--blue-border)' : '1px solid transparent',
                      background: n === currentPage ? 'var(--blue-light)' : 'transparent',
                      color: n === currentPage ? 'var(--blue-text)' : 'var(--text-primary)'
                    }}
                  >
                    {n}
                  </button>
                )
              )}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }} aria-label="Next page">
                <ChevronRight size={15} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Rows per page</span>
              <select
                className="form-select"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                style={{ width: 56, height: 30, padding: '0 8px', fontSize: 'var(--fs-sm)' }}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right patient profile panel */}
        {selectedPatient && (
          <div className="medios-card" style={{ padding: '14px 12px 12px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <Avatar name={selectedPatient.name} size={76} />
              <div style={{ flex: 1, minWidth: 0, paddingTop: 6 }}>
                <h3 style={{ fontSize: 16.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {selectedPatient.name}
                  {selectedPatient.gender === 'Female' ? <Venus size={15} color="var(--blue-text)" strokeWidth={2.4} /> : <Mars size={15} color="var(--blue-text)" strokeWidth={2.4} />}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: 'var(--text-primary)', marginTop: 5, whiteSpace: 'nowrap' }}>
                  <span>{selectedPatient.age} years</span>
                  <span className="patient-meta-sep" />
                  <span>{selectedPatient.gender}</span>
                  <span className="patient-meta-sep" />
                  <span>UHID: {selectedPatient.uhid}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', marginTop: 3 }}>
                  <Phone size={12} fill="currentColor" strokeWidth={0} />
                  <span>{selectedPatient.phone}</span>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <button className="icon-btn" onClick={toggleMenu('panel')} aria-label="Patient options">
                  <MoreVertical size={16} />
                </button>
                {openMenu === 'panel' && (
                  <PopMenu
                    onClose={() => setOpenMenu(null)}
                    items={[
                      { label: 'Book Appointment', icon: CalendarPlus, onClick: () => openFor(selectedPatient, 'appointments') },
                      { label: 'Patient Documents', icon: FileText, onClick: () => openFor(selectedPatient, 'documents') },
                      { label: 'Print Summary', icon: Printer, onClick: () => showToast(`Preparing summary of ${selectedPatient.name} for print…`) }
                    ]}
                  />
                )}
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', padding: '0 2px' }}>
              {selectedPatient.conditions.map((c) => <ConditionBadge key={c} condition={c} />)}
              {selectedPatient.allergies.map((allergy) => (
                <span key={allergy} className="badge-tag allergy">
                  <AllergyIcon />
                  <span>{allergy.startsWith('Allergy') ? allergy : `Allergy: ${allergy}`}</span>
                </span>
              ))}
            </div>

            {/* Drawer tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {DRAWER_TABS.map((t) => (
                <button
                  key={t}
                  className={`page-tab-btn ${drawerSubtab === t ? 'active' : ''}`}
                  style={{ height: 34, padding: '0 10px', fontSize: 12.5, flex: '1 1 auto', justifyContent: 'center' }}
                  onClick={() => setDrawerSubtab(t)}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => setDrawerSubtab(DRAWER_TABS[(DRAWER_TABS.indexOf(drawerSubtab) + 1) % DRAWER_TABS.length])}
                style={{ width: 22, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}
                aria-label="Next tab"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {drawerSubtab === 'Overview' && (
              <>
                {/* AI summary + vitals */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 170px', gap: 8 }}>
                  <div style={{ ...miniCard, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px 5px 8px', background: 'linear-gradient(90deg, var(--purple-light), #eef3fe)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--purple-dark)', fontWeight: 600, fontSize: 12.5 }}>
                        <AiSparkle size={16} />
                        <span>AI Patient Summary</span>
                      </div>
                      <button
                        className="btn-outline-blue"
                        style={{ height: 24, padding: '0 9px', fontSize: 'var(--fs-xs)', gap: 5, borderColor: 'var(--border-color)' }}
                        onClick={() => showToast(`AI Clinical insights refreshed for ${selectedPatient.name}`)}
                      >
                        <SquarePen size={12} />
                        <span>Ask AI</span>
                      </button>
                    </div>
                    <div style={{ padding: '7px 10px 8px' }}>
                      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{summaryText}</p>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', margin: '8px 0 3px' }}>Key Points</div>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {keyPoints.map((kp) => {
                          const up = kp.endsWith('↑');
                          return (
                            <li key={kp} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', lineHeight: '18px' }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-emerald)', flexShrink: 0 }} />
                              <span>
                                {up ? kp.slice(0, -1).trimEnd() : kp}
                                {up && <span style={{ color: 'var(--red-rose)', fontWeight: 700 }}> ↑</span>}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  <div style={{ ...miniCard, padding: '7px 8px 8px', display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'start' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Vitals <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 400 }}>(Last Visit)</span>
                      </span>
                      <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>12 Sep 2026</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {vitals.map((vt) => (
                        <div key={vt.label} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '7px 9px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <span style={{ fontSize: 11.5, color: 'var(--text-primary)', lineHeight: '15px' }}>{vt.label}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: vt.alert ? 'var(--red-rose)' : 'var(--text-primary)', lineHeight: '20px' }}>{vt.value}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: '14px' }}>{vt.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Current Medications */}
                <div style={{ ...miniCard, padding: '8px 10px 9px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={sectionTitle}>
                      <Cross size={15} color="var(--blue-text)" fill="var(--blue-text)" />
                      Current Medications
                    </span>
                    <button className="text-link" style={{ fontSize: 12.5, fontWeight: 400 }} onClick={() => openFor(selectedPatient, 'medications')}>
                      View All
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {MEDICATIONS.map((m) => (
                      <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 26, padding: '0 12px 0 8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                        <CircleCheck size={15} color="#ffffff" fill="var(--green-emerald)" strokeWidth={2.4} />
                        <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-primary)' }}>{m.name}</span>
                        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{m.dose}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Lab Summary + Recent Imaging */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 8 }}>
                  <div style={{ ...miniCard, padding: '8px 10px 4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={sectionTitle}>
                        <Cross size={15} color="var(--blue-text)" fill="var(--blue-text)" />
                        Recent Lab Summary
                      </span>
                      <button className="text-link" style={{ fontSize: 12.5, fontWeight: 400 }} onClick={() => openFor(selectedPatient, 'lab-reports')}>
                        View All
                      </button>
                    </div>
                    {LAB_SUMMARY.map((l, i) => (
                      <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, borderBottom: i < LAB_SUMMARY.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                        {l.done ? (
                          <CircleCheck size={15} color="#ffffff" fill={l.icon} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                        ) : (
                          <CircleCheck size={15} color={l.icon} strokeWidth={2} style={{ flexShrink: 0 }} />
                        )}
                        <span style={{ width: 74, marginLeft: 2, fontSize: 12.5, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{l.name}</span>
                        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: l.color, whiteSpace: 'nowrap' }}>{l.value}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>12 Sep 2026</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ ...miniCard, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={sectionTitle}>
                        <ScanLine size={15} color="var(--blue-text)" strokeWidth={2.2} />
                        Recent Imaging
                      </span>
                      <button className="text-link" style={{ fontSize: 12.5, fontWeight: 400 }} onClick={() => openFor(selectedPatient, 'imaging')}>
                        View All
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {IMAGING.map((im) => (
                        <button key={im.id ?? im.title} onClick={() => openFor(selectedPatient, 'imaging')} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                          <StudyThumb src={im.thumb} alt={im.title} width={56} height={56} />
                          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{im.title}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-2xs)', color: 'var(--text-secondary)' }}>
                              <History size={11} />
                              {im.date}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-2xs)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: im.color, flexShrink: 0 }} />
                              {im.result}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB CONTENT: Timeline */}
            {drawerSubtab === 'Timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={sectionTitle}>Recent Patient Encounters</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { date: '26 Sep 2026', title: 'Follow-up Consultation', doctor: 'Dr. Shajin', type: 'Consultation' },
                    { date: '26 Sep 2026', title: 'Triage Vitals Check-in', doctor: 'Nurse Anjali', type: 'Vitals' },
                    { date: '12 Sep 2026', title: 'Chest X-Ray (PA View)', doctor: 'Dr. Ravi', type: 'Imaging' },
                    { date: '12 Sep 2026', title: 'HbA1c & Fasting Glucose', doctor: 'Central Lab', type: 'Lab' }
                  ].map((evt, i) => (
                    <div key={i} style={recordCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>
                        <span>{evt.date}</span>
                        <span style={{ color: 'var(--blue-text)', fontWeight: 500 }}>{evt.type}</span>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2, fontSize: 12.5 }}>{evt.title}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)' }}>{evt.doctor}</div>
                    </div>
                  ))}
                </div>
                <button className="btn-outline-blue" style={{ width: '100%' }} onClick={() => openFor(selectedPatient, 'timeline')}>
                  Open Full Longitudinal Timeline →
                </button>
              </div>
            )}

            {/* TAB CONTENT: Consultations */}
            {drawerSubtab === 'Consultations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={sectionTitle}>Consultation Records</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ ...recordCard, background: 'var(--blue-light)', borderColor: 'var(--blue-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: 'var(--blue-text)' }}>
                      <span>26 Sep 2026 • 09:15 AM</span>
                      <span className="status-pill waiting">In Progress</span>
                    </div>
                    <div style={{ color: 'var(--text-primary)', marginTop: 3 }}>Reason: Fever, mild cough for 3 days</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)' }}>Dr. Shajin • General Medicine</div>
                  </div>
                  <div style={recordCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <span>12 Sep 2026 • 10:00 AM</span>
                      <span className="status-pill completed">Completed</span>
                    </div>
                    <div style={{ color: 'var(--text-primary)', marginTop: 3 }}>BP & Diabetes 3-month review</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)' }}>Dr. Shajin • General Medicine</div>
                  </div>
                </div>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => openFor(selectedPatient, 'consultation')}>
                  Open Consultation Workspace
                </button>
              </div>
            )}

            {/* TAB CONTENT: Lab Reports */}
            {drawerSubtab === 'Lab Reports' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={sectionTitle}>Recent Lab Tests</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={recordCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>HbA1c (Glycated Hb)</span>
                      <span style={{ color: 'var(--red-dark)', fontWeight: 700 }}>7.8% (High)</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>Ref: &lt; 5.7% • 12 Sep 2026</div>
                  </div>
                  <div style={recordCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>Fasting Blood Glucose</span>
                      <span style={{ color: 'var(--red-dark)', fontWeight: 700 }}>134 mg/dL (High)</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>Ref: 70–100 mg/dL • 12 Sep 2026</div>
                  </div>
                </div>
                <button className="btn-outline-blue" style={{ width: '100%' }} onClick={() => openFor(selectedPatient, 'lab-reports')}>
                  View Full Lab Diagnostic Workspace →
                </button>
              </div>
            )}

            {/* TAB CONTENT: Imaging */}
            {drawerSubtab === 'Imaging' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={sectionTitle}>Imaging & Radiology Studies</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={recordCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>Chest X-Ray (PA View)</span>
                      <span style={{ color: 'var(--green-dark)', fontWeight: 600 }}>Clear</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>12 Sep 2026 • Dr. Ravi (Radiology)</div>
                  </div>
                  <div style={recordCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>USG Whole Abdomen</span>
                      <span style={{ color: 'var(--orange-dark)', fontWeight: 600 }}>Grade 1 Fatty Liver</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>21 Mar 2026 • Dr. Ravi (Radiology)</div>
                  </div>
                </div>
                <button className="btn-outline-blue" style={{ width: '100%' }} onClick={() => openFor(selectedPatient, 'imaging')}>
                  Open DICOM Imaging Workspace →
                </button>
              </div>
            )}

            {/* Bottom action bar */}
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
              <button className="btn-primary" style={{ flex: '1.35 1 0', height: 38, fontSize: 'var(--fs-sm)', padding: '0 10px' }} onClick={() => openFor(selectedPatient, 'consultation')}>
                <Stethoscope size={16} />
                <span>Start Consultation</span>
              </button>
              <button className="btn-outline-blue" style={{ flex: '1.1 1 0', height: 38, fontSize: 'var(--fs-sm)', padding: '0 8px', borderColor: 'var(--border-color)' }} onClick={() => openFor(selectedPatient, 'emr')}>
                <FolderOpen size={15} />
                <span>View Full EMR</span>
              </button>
              <button className="btn-outline-blue" style={{ flex: '0.9 1 0', height: 38, fontSize: 'var(--fs-sm)', padding: '0 8px', borderColor: 'var(--border-color)' }} onClick={() => openFor(selectedPatient, 'prescriptions')}>
                <Pill size={15} />
                <span>Prescribe</span>
              </button>
              <div style={{ position: 'relative', flex: '0.75 1 0', display: 'flex' }}>
                <button className="btn-outline-blue" style={{ flex: 1, height: 38, fontSize: 'var(--fs-sm)', padding: '0 8px', borderColor: 'var(--border-color)' }} onClick={toggleMenu('more')}>
                  <MoreHorizontal size={15} />
                  <span>More</span>
                </button>
                {openMenu === 'more' && (
                  <PopMenu
                    up
                    onClose={() => setOpenMenu(null)}
                    items={[
                      { label: 'Patient Timeline', icon: History, onClick: () => openFor(selectedPatient, 'timeline') },
                      { label: 'Vitals', icon: HeartPulse, onClick: () => openFor(selectedPatient, 'vitals') },
                      { label: 'Documents', icon: FileText, onClick: () => openFor(selectedPatient, 'documents') },
                      { label: 'Book Follow-up', icon: CalendarPlus, onClick: () => openFor(selectedPatient, 'follow-ups') }
                    ]}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add New Patient Modal */}
      {isAddPatientOpen && (
        <div className="modal-overlay" onClick={() => setIsAddPatientOpen(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register New Patient</h3>
              <button onClick={() => setIsAddPatientOpen(false)} style={{ color: 'var(--text-muted)' }} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreatePatient}>
              <div className="modal-body">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input type="text" required className="input-field" placeholder="e.g. Arun Kumar" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Age *</label>
                    <input type="number" required className="input-field" placeholder="e.g. 34" value={newAge} onChange={(e) => setNewAge(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Gender *</label>
                    <select className="form-select" value={newGender} onChange={(e) => setNewGender(e.target.value as 'Male' | 'Female' | 'Other')}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Phone Number *</label>
                    <input type="tel" required className="input-field" placeholder="+91 98765 43210" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Blood Group</label>
                    <select className="form-select" value={newBloodGroup} onChange={(e) => setNewBloodGroup(e.target.value)}>
                      <option>A+</option>
                      <option>B+</option>
                      <option>O+</option>
                      <option>AB+</option>
                      <option>O-</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Department</label>
                  <select className="form-select" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)}>
                    <option>General Medicine</option>
                    <option>Cardiology</option>
                    <option>Endocrinology</option>
                    <option>Surgery</option>
                    <option>Pediatrics</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Known Conditions (comma-separated)</label>
                  <input type="text" className="input-field" placeholder="e.g. Hypertension, Type 2 Diabetes" value={newConditions} onChange={(e) => setNewConditions(e.target.value)} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddPatientOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
