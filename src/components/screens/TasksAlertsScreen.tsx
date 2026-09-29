import React, { useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { mockTasksAlerts, mockCriticalAlerts, mockAITaskSuggestions, mockTodayReminders } from '../../mock/tasksAlertsData';
import { TaskAlertItem } from '../../types';
import { ScreenHeader } from '../common/ScreenHeader';
import { AiSparkle } from '../common/icons';
import {
  createLucideIcon,
  Plus,
  Search,
  Funnel,
  CalendarDays,
  LayoutList,
  SquareKanban,
  ClipboardList,
  TriangleAlert,
  Clock,
  FlaskConical,
  ImageIcon,
  Eye,
  Phone,
  Pill,
  FileText,
  Siren,
  Server,
  EllipsisVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Heart,
  CalendarCheck,
  Triangle,
  CirclePlus,
  Bell,
  UsersRound,
  CircleCheck,
  type LucideIcon
} from 'lucide-react';

/** Lungs glyph for the chest X-ray alert (not in Lucide). */
const Lungs = createLucideIcon('lungs', [
  ['path', { d: 'M12 4v7', key: 't' }],
  ['path', { d: 'M12 11l-2.5 2.5M12 11l2.5 2.5', key: 'b' }],
  ['path', { d: 'M9 7.5C6.5 7.5 5 12 5 15.5 5 18 6 19 7.5 19S10 18 10 16v-5', key: 'l' }],
  ['path', { d: 'M15 7.5c2.5 0 4 4.5 4 8 0 2.5-1 3.5-2.5 3.5S14 18 14 16v-5', key: 'r' }]
]);

/** Solid red tile with a white lungs glyph (design's "Chest X-Ray abnormal" icon). */
const XRayAlertIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <span style={{ width: size, height: size, borderRadius: 6, backgroundColor: 'var(--red-rose)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <Lungs size={size - 4} color="#ffffff" strokeWidth={2.2} />
  </span>
);

/** Column widths (px) measured on the design's 857px-wide table. */
const COL_WIDTHS = [37, 38, 156, 113, 129, 78, 126, 103, 77];

const TABS = ['All', 'My Tasks', 'Follow-ups', 'Lab Alerts', 'Imaging Alerts', 'Medication Alerts', 'System Alerts'] as const;

type TaskType = TaskAlertItem['type'];

/** Row icon + colour per task type (as drawn in the design). */
const TYPE_ICON: Record<TaskType, { icon: LucideIcon; color: string }> = {
  'Lab Alert': { icon: TriangleAlert, color: 'var(--red-rose)' },
  'Follow-up': { icon: Phone, color: 'var(--blue-text)' },
  Medication: { icon: Pill, color: 'var(--blue-text)' },
  'Imaging Alert': { icon: ImageIcon, color: 'var(--blue-text)' },
  'Patient Communication': { icon: Phone, color: 'var(--green-emerald)' },
  Documentation: { icon: FileText, color: 'var(--blue-text)' },
  'Preventive Care': { icon: Siren, color: 'var(--red-rose)' },
  'Medication Alert': { icon: TriangleAlert, color: 'var(--orange-amber)' },
  System: { icon: Server, color: 'var(--text-secondary)' }
};

const TYPE_PILL: Record<TaskType, string> = {
  'Lab Alert': 'red',
  'Imaging Alert': 'red',
  'Medication Alert': 'red',
  'Follow-up': 'blue',
  Medication: 'blue',
  Documentation: 'blue',
  'Patient Communication': 'blue',
  System: 'blue',
  'Preventive Care': 'green'
};

const PRIORITY_PILL = { High: 'high', Medium: 'medium', Low: 'green' } as const;
const STATUS_PILL = { Pending: 'pending', Scheduled: 'green', 'In Progress': 'in-progress', Completed: 'completed' } as const;

/** Primary row action shown before the ⋮ menu (design: eye / calendar / phone). */
const ROW_ACTION: Record<string, 'schedule' | 'call'> = {
  'ta-2': 'schedule',
  'ta-6': 'schedule',
  'ta-7': 'call',
  'ta-10': 'call',
  'ta-14': 'schedule',
  'ta-17': 'call',
  'ta-27': 'call'
};

const KPIS = [
  { tab: 'My Tasks', tint: 'sky', tile: '#d4e6fe', icon: ClipboardList, iconColor: 'var(--blue-text)', value: '12', label: 'Pending Tasks', sub: '6 high priority', subColor: 'var(--text-secondary)' },
  { tab: 'Critical', tint: 'red', tile: '#fedde6', icon: TriangleAlert, iconColor: 'var(--red-rose)', value: '4', valueColor: 'var(--red-dark)', label: 'Critical Alerts', labelWeight: 600, sub: 'Requires attention', subColor: 'var(--red-dark)' },
  { tab: 'Follow-ups', tint: 'orange', tile: '#fdeadb', icon: Clock, iconColor: '#e8680d', value: '8', label: 'Follow-ups Due', sub: 'Today', subColor: 'var(--orange-dark)' },
  { tab: 'Lab Alerts', tint: 'green', tile: '#d6f3e9', icon: FlaskConical, iconColor: 'var(--green-emerald)', value: '6', label: 'Lab Results Pending', sub: 'Review reports', subColor: 'var(--green-dark)' },
  { tab: 'Imaging Alerts', tint: 'purple', tile: '#e9dcfe', icon: ImageIcon, iconColor: '#7c2fe0', value: '2', label: 'Imaging Results', sub: 'Unread reports', subColor: 'var(--purple-dark)' }
] as const;

const CRITICAL_META: Record<string, { icon: LucideIcon | React.FC<{ size?: number }>; fill?: boolean; badgeBg: string; badgeColor: string }> = {
  Lab: { icon: TriangleAlert, badgeBg: '#fbdde6', badgeColor: 'var(--red-dark)' },
  Imaging: { icon: XRayAlertIcon, badgeBg: '#fbdcec', badgeColor: '#c0267a' },
  Medication: { icon: TriangleAlert, badgeBg: 'var(--orange-light)', badgeColor: 'var(--orange-dark)' },
  Vitals: { icon: Heart, fill: true, badgeBg: 'var(--blue-light)', badgeColor: 'var(--blue-text)' }
};

const REMINDER_ICON: Record<(typeof mockTodayReminders)[number]['kind'], { icon: LucideIcon; color: string }> = {
  lab: { icon: CalendarCheck, color: 'var(--blue-text)' },
  'follow-up': { icon: Phone, color: 'var(--blue-text)' },
  imaging: { icon: ImageIcon, color: 'var(--blue-text)' },
  diabetes: { icon: Triangle, color: 'var(--text-primary)' },
  call: { icon: Phone, color: 'var(--green-emerald)' }
};

// Design proportions at 1536px; narrower windows get fewer columns (scoped CSS).
const LAYOUT_CSS = `
.ta-kpis { display: grid; gap: var(--gap); grid-template-columns: minmax(0, 225fr) minmax(0, 225fr) minmax(0, 225fr) minmax(0, 256fr) minmax(0, 291fr); }
.ta-main { display: grid; gap: var(--gap); margin-top: 5px; grid-template-columns: minmax(0, 879fr) minmax(0, 396fr); }
.ta-right { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
@media (max-width: 1480px) { .ta-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 1400px) {
  .ta-main { grid-template-columns: minmax(0, 1fr); }
  .ta-right { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 1024px) { .ta-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;

const cell: React.CSSProperties = { padding: '0 4px', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' };
const headCell: React.CSSProperties = { padding: '0 4px', height: 30, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left', whiteSpace: 'nowrap', background: 'var(--bg-body)', borderBottom: 'none' };
const line1: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 };
const line2: React.CSSProperties = { fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4, whiteSpace: 'nowrap' };
const pill: React.CSSProperties = { fontSize: 11, height: 22, padding: '0 8px', border: '1px solid rgba(15, 26, 61, 0.06)' };
const checkbox: React.CSSProperties = { width: 15, height: 15, accentColor: 'var(--blue-primary)', cursor: 'pointer', verticalAlign: 'middle' };
const ctrlBtn: React.CSSProperties = { height: 33, padding: '0 16px', fontWeight: 400 };

export const TasksAlertsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [tasks, setTasks] = useState<TaskAlertItem[]>(mockTasksAlerts);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState(mockAITaskSuggestions);
  const [view, setView] = useState<'list' | 'board'>('list');
  const [todayOnly, setTodayOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskAlertItem['priority']>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | TaskAlertItem['status']>('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t)));
    showToast('Task status updated');
  };

  const toggleSuggestion = (id: string) => {
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)));
  };

  const selectTab = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const q = search.toLowerCase();
  const filteredTasks = tasks.filter((t) => {
    if (q && !t.title.toLowerCase().includes(q) && !t.patientName.toLowerCase().includes(q)) return false;
    if (todayOnly && !t.dueDateTime.startsWith('Today')) return false;
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    switch (activeTab) {
      case 'My Tasks':
        return t.status === 'Pending' || t.status === 'In Progress';
      case 'Critical':
        return t.priority === 'High';
      case 'Follow-ups':
        return t.type === 'Follow-up';
      case 'Lab Alerts':
        return t.type === 'Lab Alert';
      case 'Imaging Alerts':
        return t.type === 'Imaging Alert';
      case 'Medication Alerts':
        return t.type === 'Medication' || t.type === 'Medication Alert';
      case 'System Alerts':
        return t.category === 'System';
      default:
        return true;
    }
  });

  const pageCount = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageTasks = filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allPageDone = pageTasks.length > 0 && pageTasks.every((t) => t.status === 'Completed');

  const toggleAllOnPage = () => {
    const ids = new Set(pageTasks.map((t) => t.id));
    setTasks((prev) => prev.map((t) => (ids.has(t.id) ? { ...t, status: allPageDone ? 'Pending' : 'Completed' } : t)));
    showToast(allPageDone ? 'Tasks marked as pending' : `${ids.size} tasks marked complete`);
  };

  const renderDue = (due: string) => {
    if (due.startsWith('Today ')) {
      return (
        <>
          <div style={line1}>Today</div>
          <div style={{ ...line2, color: 'var(--text-primary)' }}>{due.slice(6)}</div>
        </>
      );
    }
    return <div style={line1}>{due}</div>;
  };

  const rowAction = (task: TaskAlertItem) => {
    const kind = ROW_ACTION[task.id];
    const Icon = kind === 'schedule' ? CalendarDays : kind === 'call' ? Phone : Eye;
    const msg = kind === 'schedule' ? `Reschedule: ${task.title}` : kind === 'call' ? `Calling ${task.patientName}...` : `Viewing task: ${task.title}`;
    return (
      <button style={{ color: 'var(--blue-text)', display: 'inline-flex', padding: 2 }} aria-label={kind ?? 'view'} onClick={() => showToast(msg, 'info')}>
        <Icon size={18} />
      </button>
    );
  };

  const pageBtn = (active = false): React.CSSProperties => ({
    width: 29,
    height: 31,
    borderRadius: 6,
    border: `1px solid ${active ? 'var(--blue-text)' : 'var(--border-strong)'}`,
    background: active ? 'var(--blue-light)' : 'var(--bg-card)',
    color: active ? 'var(--blue-text)' : 'var(--text-primary)',
    fontSize: 13,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  });

  return (
    <div className="page-scroll-body" style={{ paddingTop: 4, paddingBottom: 22 }}>
      <style>{LAYOUT_CSS}</style>
      <ScreenHeader
        title="Tasks & Alerts"
        subtitle="Stay on top of your clinical tasks, patient follow-ups and important alerts"
        actions={
          <button className="btn-primary" style={{ height: 38, padding: '0 22px 0 20px', gap: 10 }} onClick={() => showToast('Create new task form opened')}>
            <Plus size={19} />
            <span>New Task</span>
          </button>
        }
      />

      {/* Tabs + view controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: -6, borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.45)', borderRadius: '8px 8px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => selectTab(tab)}
                style={{
                  height: 44,
                  minWidth: tab === 'All' ? 70 : undefined,
                  padding: '0 20px',
                  fontSize: 13.5,
                  fontWeight: active ? 500 : 400,
                  color: active ? 'var(--blue-text)' : 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  boxShadow: active ? 'inset 0 -3px 0 var(--blue-text)' : 'none',
                  background: active ? 'var(--bg-card)' : 'transparent',
                  borderRadius: '8px 8px 0 0'
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0, paddingRight: 6 }}>
          <button
            className="btn-outline-blue"
            style={{ ...ctrlBtn, width: 90, backgroundColor: showFilters ? 'var(--blue-light)' : undefined }}
            onClick={() => setShowFilters((v) => !v)}
          >
            <Funnel size={15} />
            <span>Filters</span>
          </button>
          <button
            className="btn-outline-blue"
            style={{ ...ctrlBtn, width: 90, backgroundColor: todayOnly ? 'var(--blue-light)' : undefined }}
            onClick={() => {
              setTodayOnly((v) => !v);
              setPage(1);
            }}
          >
            <CalendarDays size={15} />
            <span>Today</span>
          </button>
          <div style={{ display: 'flex', marginLeft: 10, border: '1px solid var(--blue-border)', borderRadius: 6, overflow: 'hidden', background: 'var(--bg-card)' }}>
            {(
              [
                { id: 'list', label: 'List', icon: LayoutList },
                { id: 'board', label: 'Board', icon: SquareKanban }
              ] as const
            ).map((v) => {
              const active = view === v.id;
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  style={{
                    width: 86,
                    height: 31,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 13,
                    background: active ? 'var(--blue-primary)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-primary)'
                  }}
                >
                  {active && <Icon size={15} />}
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="ta-kpis">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <button
              key={k.label}
              className={`stat-card-item tint-${k.tint}`}
              style={{ padding: '15px 14px', alignItems: 'flex-start', gap: 16, textAlign: 'left', height: 105 }}
              onClick={() => selectTab(k.tab)}
            >
              <div className="stat-icon-wrapper" style={{ width: 48, height: 48, backgroundColor: k.tile, color: k.iconColor }}>
                <Icon size={26} strokeWidth={2.2} />
              </div>
              <div className="stat-data-box" style={{ whiteSpace: 'nowrap' }}>
                <span className="stat-number" style={{ fontSize: 25, lineHeight: 1.2, marginTop: 0, color: 'valueColor' in k ? k.valueColor : undefined }}>
                  {k.value}
                </span>
                <span style={{ fontSize: 14, fontWeight: 'labelWeight' in k ? k.labelWeight : 500, color: 'var(--text-primary)', marginTop: 2 }}>{k.label}</span>
                <span style={{ fontSize: 12, color: k.subColor, marginTop: 2 }}>{k.sub}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main: table | right column */}
      <div className="ta-main">
        {/* Tasks table */}
        <div className="medios-card" style={{ padding: '10px 10px 10px 10px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 2px 12px 2px' }}>
            <h3 className="card-title">Tasks &amp; Alerts ({tasks.length})</h3>
            <div style={{ display: 'flex', width: 318, height: 32, border: '1px solid var(--border-strong)', borderRadius: 6, overflow: 'hidden', background: 'var(--bg-card)' }}>
              <input
                type="text"
                placeholder="Search tasks, patients..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', padding: '0 10px', fontSize: 12, background: 'transparent' }}
              />
              <span style={{ width: 32, borderLeft: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                <Search size={15} />
              </span>
            </div>
          </div>

          {showFilters && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 2px 10px', fontSize: 'var(--fs-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Priority</span>
              <select className="form-select" style={{ width: 120, height: 30, fontSize: 12 }} value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value as typeof priorityFilter); setPage(1); }}>
                {['All', 'High', 'Medium', 'Low'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>Status</span>
              <select className="form-select" style={{ width: 130, height: 30, fontSize: 12 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}>
                {['All', 'Pending', 'Scheduled', 'In Progress', 'Completed'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <button className="text-link" style={{ marginLeft: 'auto' }} onClick={() => { setPriorityFilter('All'); setStatusFilter('All'); setTodayOnly(false); }}>
                Clear filters
              </button>
            </div>
          )}

          {view === 'list' ? (
            <table className="medios-table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                {COL_WIDTHS.map((w, i) => (
                  <col key={i} style={{ width: `${((w / 857) * 100).toFixed(2)}%` }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...headCell, paddingLeft: 8, borderRadius: '6px 0 0 6px' }}>
                    <input type="checkbox" style={checkbox} checked={allPageDone} onChange={toggleAllOnPage} aria-label="Toggle all on page" />
                  </th>
                  <th style={headCell} />
                  <th style={headCell}>Task / Alert</th>
                  <th style={headCell}>Patient</th>
                  <th style={headCell}>Type</th>
                  <th style={headCell}>Priority</th>
                  <th style={headCell}>Due Date / Time</th>
                  <th style={headCell}>Status</th>
                  <th style={{ ...headCell, borderRadius: '0 6px 6px 0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageTasks.map((task) => {
                  const isDone = task.status === 'Completed';
                  const meta = TYPE_ICON[task.type];
                  const TypeIcon = meta.icon;
                  return (
                    <tr key={task.id} style={{ height: 54, opacity: isDone ? 0.6 : 1 }}>
                      <td style={{ ...cell, paddingLeft: 8 }}>
                        <input type="checkbox" style={checkbox} checked={isDone} onChange={() => toggleTask(task.id)} aria-label={`Mark ${task.title} complete`} />
                      </td>
                      <td style={{ ...cell, paddingLeft: 8 }}>
                        <TypeIcon size={19} color={meta.color} style={{ display: 'block' }} />
                      </td>
                      <td style={cell}>
                        <div style={{ ...line1, textDecoration: isDone ? 'line-through' : 'none' }}>{task.title}</div>
                        {task.subtitle && <div style={{ ...line2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.subtitle}</div>}
                      </td>
                      <td style={cell}>
                        <div style={line1}>{task.patientName}</div>
                        <div style={line2}>{task.uhid}</div>
                      </td>
                      <td style={cell}>
                        <span
                          className={`status-pill ${TYPE_PILL[task.type]}`}
                          style={task.type.length > 16 ? { ...pill, fontSize: 10.5, padding: '0 5px', letterSpacing: '-0.2px' } : pill}
                        >
                          {task.type}
                        </span>
                      </td>
                      <td style={cell}>
                        <span className={`status-pill ${PRIORITY_PILL[task.priority]}`} style={pill}>
                          {task.priority}
                        </span>
                      </td>
                      <td style={cell}>{renderDue(task.dueDateTime)}</td>
                      <td style={cell}>
                        <span className={`status-pill ${STATUS_PILL[task.status]}`} style={pill}>
                          {task.status}
                        </span>
                      </td>
                      <td style={cell}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 22, paddingLeft: 6 }}>
                          {rowAction(task)}
                          <button style={{ color: 'var(--text-primary)', display: 'inline-flex', padding: 2 }} aria-label="More actions" onClick={() => showToast(`More actions for "${task.title}"`, 'info')}>
                            <EllipsisVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pageTasks.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ ...cell, height: 80, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No tasks match the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, flex: 1, minHeight: 0 }}>
              {(['Pending', 'Scheduled', 'In Progress', 'Completed'] as const).map((status) => {
                const col = pageTasks.filter((t) => t.status === status);
                return (
                  <div key={status} style={{ background: 'var(--bg-body)', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{status}</span>
                      <span className={`status-pill ${STATUS_PILL[status]}`} style={pill}>
                        {col.length}
                      </span>
                    </div>
                    {col.map((task) => {
                      const meta = TYPE_ICON[task.type];
                      const TypeIcon = meta.icon;
                      return (
                        <div key={task.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                            <TypeIcon size={15} color={meta.color} style={{ flexShrink: 0, marginTop: 2 }} />
                            <span style={{ ...line1, flex: 1 }}>{task.title}</span>
                            <input type="checkbox" style={checkbox} checked={task.status === 'Completed'} onChange={() => toggleTask(task.id)} aria-label={`Mark ${task.title} complete`} />
                          </div>
                          <span style={line2}>
                            {task.patientName} • {task.dueDateTime}
                          </span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <span className={`status-pill ${TYPE_PILL[task.type]}`} style={{ ...pill, fontSize: 10.5 }}>
                              {task.type}
                            </span>
                            <span className={`status-pill ${PRIORITY_PILL[task.priority]}`} style={{ ...pill, fontSize: 10.5 }}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', padding: '14px 2px 0' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Showing {filteredTasks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredTasks.length)} of {filteredTasks.length} tasks
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <button style={{ ...pageBtn(), color: 'var(--text-muted)' }} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button key={n} style={pageBtn(n === currentPage)} onClick={() => setPage(n)}>
                  {n}
                </button>
              ))}
              <button style={pageBtn()} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page">
                <ChevronRight size={15} />
              </button>
              <div style={{ position: 'relative', marginLeft: 17 }}>
                <select
                  className="form-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  style={{ width: 112, height: 31, fontSize: 13, padding: '0 34px 0 10px', appearance: 'none', cursor: 'pointer', borderColor: 'var(--border-strong)' }}
                  aria-label="Rows per page"
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 30, borderLeft: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <ChevronDown size={15} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="ta-right">
          {/* AI Task Suggestions */}
          <div className="ai-assistant-card" style={{ gap: 0, padding: '12px 14px 12px 12px' }}>
            <div className="ai-header-bar" style={{ marginBottom: 8 }}>
              <div className="ai-title-row" style={{ fontSize: 14.5, gap: 9 }}>
                <AiSparkle size={20} />
                <span>AI Task Suggestions (GPT-6 Astro)</span>
              </div>
              <button style={{ color: 'var(--blue-text)', display: 'inline-flex' }} aria-label="AI suggestion options" onClick={() => showToast('AI suggestion settings', 'info')}>
                <EllipsisVertical size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {suggestions.map((s) => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12.5, color: s.checked ? 'var(--text-muted)' : 'var(--text-primary)', cursor: 'pointer', lineHeight: 1.45, paddingLeft: 3 }}>
                  <input type="checkbox" style={checkbox} checked={s.checked} onChange={() => toggleSuggestion(s.id)} />
                  <span style={{ textDecoration: s.checked ? 'line-through' : 'none' }}>{s.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Critical Alerts */}
          <div className="medios-card" style={{ padding: '12px 12px 10px 12px', backgroundColor: '#fef4f7', borderColor: '#f8d7df' }}>
            <div className="card-header-row" style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--red-dark)', fontWeight: 700, fontSize: 15.5 }}>
                <TriangleAlert size={22} fill="var(--red-rose)" color="#ffffff" strokeWidth={2.2} />
                <span>Critical Alerts ({mockCriticalAlerts.length})</span>
              </div>
              <button className="text-link" style={{ fontSize: 13 }} onClick={() => selectTab('Critical')}>
                View All
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {mockCriticalAlerts.map((ca) => {
                const meta = CRITICAL_META[ca.badge] ?? CRITICAL_META.Lab;
                const Icon = meta.icon;
                return (
                  <div key={ca.id} style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 35, paddingLeft: 6 }}>
                    {Icon === XRayAlertIcon ? (
                      <XRayAlertIcon size={19} />
                    ) : (
                      <Icon size={19} color="var(--red-rose)" fill={meta.fill ? 'var(--red-rose)' : 'none'} style={{ flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ca.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {ca.patient} | {ca.time}
                      </div>
                    </div>
                    <span className="status-pill" style={{ ...pill, backgroundColor: meta.badgeBg, color: meta.badgeColor, height: 23, flexShrink: 0 }}>
                      {ca.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Schedule & Reminders */}
          <div className="medios-card" style={{ padding: '10px 14px 7px 12px' }}>
            <div className="card-header-row" style={{ marginBottom: 6 }}>
              <h3 className="card-title" style={{ fontSize: 15.5 }}>Today's Schedule &amp; Reminders</h3>
              <button className="text-link" style={{ fontSize: 13 }} onClick={() => { setTodayOnly(true); setPage(1); showToast('Showing tasks due today', 'info'); }}>
                View All
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {mockTodayReminders.map((r) => {
                const meta = REMINDER_ICON[r.kind];
                const Icon = meta.icon;
                return (
                  <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '70px 36px minmax(0, 1fr) 96px', alignItems: 'center', height: 25, fontSize: 12.5 }}>
                    <span style={{ color: 'var(--text-secondary)', paddingLeft: 3 }}>{r.time}</span>
                    <span style={{ display: 'flex', alignItems: 'center', height: '100%', borderLeft: '1px dotted var(--border-strong)', paddingLeft: 10 }}>
                      <Icon size={15} color={meta.color} />
                    </span>
                    <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.task}</span>
                    <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{r.patient}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="medios-card" style={{ padding: '9px 10px 8px 10px', flex: 1 }}>
            <h3 className="card-title" style={{ fontSize: 15, marginBottom: 8 }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {(
                [
                  { label: 'Create Task', icon: CirclePlus, msg: 'Create Task' },
                  { label: 'Set Reminder', icon: Bell, msg: 'Set Reminder' },
                  { label: 'Assign Task', icon: UsersRound, msg: 'Assign Task' },
                  { label: 'Mark Complete', icon: CircleCheck, msg: 'Marked all completed' }
                ] as const
              ).map((a) => {
                const Icon = a.icon;
                return (
                  <button key={a.label} className="btn-outline-blue" style={{ height: 35, fontSize: 13, borderColor: 'var(--blue-border)' }} onClick={() => showToast(a.msg)}>
                    <Icon size={15} />
                    <span>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
