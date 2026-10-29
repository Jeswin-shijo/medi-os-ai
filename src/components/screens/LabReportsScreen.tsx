import React, { useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { PatientBanner, type BannerTab } from '../layout/PatientBanner';
import { ScreenHeader } from '../common/ScreenHeader';
import { AiSparkle } from '../common/icons';
import type { LabParameter, LabTestReport, LabTrend } from '../../types';
import { labService } from '../../services';
import { useLoader } from '../../hooks/useLoader';
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleX,
  Circle,
  EllipsisVertical,
  LockKeyholeOpen,
  RefreshCcwDot,
  SquarePen,
  SquareActivity,
  TrendingUp,
  ImageUpscale,
  SquarePlus,
  Compass,
  MapPin,
  TriangleAlert,
  FileImage,
  ChartColumnBig,
  Hexagon,
  ClipboardPen,
  SquareCheckBig,
  type LucideIcon
} from 'lucide-react';
import { tableMin, ws3 } from '../../utils/layout';

/* Screen-internal tab strip (Lab Reports design). Documents opens the Documents module. */
const LAB_TABS: BannerTab[] = [
  { id: 'lab-reports', label: 'Lab Reports', icon: SquareActivity },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'compare', label: 'Compare Reports', icon: ImageUpscale },
  { id: 'request', label: 'Request New Test', icon: SquarePlus },
  { id: 'orders', label: 'Lab Orders', icon: Compass },
  { id: 'sample-tracking', label: 'Sample Tracking', icon: MapPin },
  { id: 'critical-alerts', label: 'Critical Alerts', icon: TriangleAlert },
  { id: 'documents', label: 'Documents', icon: FileImage, screen: 'documents' }
];

const CATEGORIES = ['All', 'Blood', 'Urine', 'Biochemistry', 'Hematology', 'Others'];
const REPORT_TABS = ['Results', 'Trends', 'Report Details', 'Previous Reports'];

/* List markers per report (blue = viewing, rings = pending review, red = abnormal). */
type Marker = { color: string; filled: boolean };
const markerFor = (status: LabTestReport['status']): Marker =>
  status === 'Abnormal'
    ? { color: 'var(--red-rose)', filled: true }
    : status === 'Pending'
      ? { color: 'var(--orange-amber)', filled: false }
      : { color: 'var(--chart-green)', filled: true };

/** Chart series for one parameter, with a y range padded around its values. */
type TrendSeries = { unit: string; min: number; max: number; points: { date: string; value: number; time?: string }[] };
/** Another point in the list shares this one's date: its time is then shown too. */
const sameDay = (list: { date: string; time?: string }[], p: { date: string; time?: string }) => list.filter((q) => q.date === p.date).length > 1;
const toSeries = (trend: LabTrend): TrendSeries => {
  const values = trend.history.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = Math.max((hi - lo) * 0.25, Math.abs(hi) * 0.05, 0.5);
  return { unit: trend.unit, min: Math.floor(lo - pad), max: Math.ceil(hi + pad), points: trend.history };
};
const RANGE_POINTS: Record<string, number> = { '3M': 2, '6M': 3, '1Y': 4, All: Number.MAX_SAFE_INTEGER };

const isAbnormal = (p: LabParameter) => p.status !== 'Normal';

const StatusMarker: React.FC<{ marker: Marker; selected: boolean }> = ({ marker, selected }) => {
  if (selected) return <CircleCheck size={14} fill="var(--blue-primary)" color="#ffffff" strokeWidth={2.4} />;
  if (!marker.filled) return <Circle size={12} color={marker.color} strokeWidth={3.4} style={{ margin: 1 }} />;
  return <CircleCheck size={14} fill={marker.color} color="#ffffff" strokeWidth={2.4} />;
};

/* Reference-range gauge: pale track, darker normal band, coloured value dot. */
const RangeGauge: React.FC<{ param: LabParameter }> = ({ param }) => {
  const pos = Math.min(94, Math.max(6, param.relativePosition ?? 50));
  const abnormal = isAbnormal(param);
  return (
    <div style={{ position: 'relative', width: 88, height: 6, borderRadius: 3, background: '#e9eef7' }}>
      {abnormal && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            borderRadius: 3,
            background: 'rgba(224, 45, 60, 0.16)',
            ...(pos < 50 ? { left: 0, width: '30%' } : { right: 0, width: '30%' })
          }}
        />
      )}
      <div style={{ position: 'absolute', left: '32%', width: '36%', top: 0, bottom: 0, background: '#d7e0ef' }} />
      <div
        style={{
          position: 'absolute',
          left: `${pos}%`,
          top: '50%',
          width: 10,
          height: 10,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          background: abnormal ? 'var(--red-rose)' : 'var(--green-emerald)',
          boxShadow: '0 0 0 1.5px #ffffff'
        }}
      />
    </div>
  );
};

/* Line chart for the Trends card (y axis min..max, points spread across the width). */
const TrendChart: React.FC<{ series: TrendSeries; count: number; height?: number; width?: number }> = ({ series, count, height = 128, width = 346 }) => {
  const W = width;
  const H = height;
  const left = 30, right = 16, top = 12, bottom = 24;
  const pts = series.points.slice(-count);
  const ticks = 5;
  const yOf = (v: number) => top + (1 - (v - series.min) / (series.max - series.min)) * (H - top - bottom);
  const xOf = (i: number) => (pts.length === 1 ? (left + W - right) / 2 : left + 22 + (i * (W - left - right - 44)) / (pts.length - 1));
  const line = pts.map((p, i) => `${xOf(i)},${yOf(p.value)}`).join(' ');
  const area = `M${xOf(0)},${H - bottom} L${line.split(' ').join(' L')} L${xOf(pts.length - 1)},${H - bottom} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }} role="img" aria-label="Trend chart">
      <defs>
        <linearGradient id="labTrendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e02d3c" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#e02d3c" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks }, (_, i) => {
        const v = series.min + ((series.max - series.min) / (ticks - 1)) * i;
        const y = yOf(v);
        return (
          <g key={i}>
            <line x1={left} x2={W - right} y1={y} y2={y} stroke="var(--border-subtle)" />
            <text x={left - 8} y={y + 3.5} fontSize="10" textAnchor="end" fill="var(--text-secondary)">
              {Number.isInteger(v) ? v : v.toFixed(1)}
            </text>
          </g>
        );
      })}
      <line x1={left} x2={left} y1={top} y2={H - bottom} stroke="var(--chart-gray)" />
      <line x1={left} x2={W - right} y1={H - bottom} y2={H - bottom} stroke="var(--chart-gray)" />
      <path d={area} fill="url(#labTrendFill)" />
      <polyline fill="none" stroke="var(--red-rose)" strokeWidth="2" points={line} />
      {pts.map((p, i) => (
        <g key={`${p.date}|${p.time ?? i}`}>
          <circle cx={xOf(i)} cy={yOf(p.value)} r="3.5" fill="var(--red-rose)" />
          <text x={xOf(i)} y={yOf(p.value) - 8} fontSize="10" textAnchor="middle" fill="var(--red-rose)">
            {p.value}
          </text>
          <line x1={xOf(i)} x2={xOf(i)} y1={H - bottom} y2={H - bottom + 4} stroke="var(--chart-gray)" />
          <text x={xOf(i)} y={H - 7} fontSize="10" textAnchor="middle" fill="var(--text-secondary)">
            {sameDay(pts, p) && p.time ? `${p.date} ${p.time}` : p.date}
          </text>
        </g>
      ))}
    </svg>
  );
};

const RELATED_ACTIONS: { label: string; icon: LucideIcon; toast: string }[] = [
  { label: 'Order Follow-up Test', icon: ClipboardPen, toast: 'Order tests from Patients or the Lab Agent' },
  { label: 'Compare with Previous', icon: SquareCheckBig, toast: 'See the Previous Reports tab for this patient\'s earlier results' },
  { label: 'Explain this Result', icon: Compass, toast: 'AI explanations are not connected yet' },
  { label: 'Add to Clinical Note', icon: SquarePen, toast: 'Copy findings into the note from the EMR screen' }
];

const sectionHeading = (label: string) => (
  <div className="ai-section-title" style={{ fontSize: 'var(--fs-xs)', marginBottom: 5 }}>
    <AiSparkle size={11} />
    <span>{label}</span>
  </div>
);

export const LabReportsScreen: React.FC = () => {
  const { showToast, activePatient } = useApp();
  const uhid = activePatient?.uhid;
  const [loaded, setLoaded] = useState<{ uhid: string; reports: LabTestReport[]; trends: LabTrend[] } | null>(null);
  const { loading } = useLoader(
    async () => (uhid ? { uhid, reports: await labService.getReports(uhid), trends: await labService.getTrends(uhid) } : null),
    setLoaded,
    [uhid]
  );
  const reports = loaded && loaded.uhid === uhid ? loaded.reports : [];
  const trends = loaded && loaded.uhid === uhid ? loaded.trends : [];
  const [selectedReportId, setSelectedReportId] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [subTab, setSubTab] = useState('Results');
  const [pageTab, setPageTab] = useState('lab-reports');
  const [searchTest, setSearchTest] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [trendParam, setTrendParam] = useState('');
  const [trendRange, setTrendRange] = useState('1Y');

  const currentReport = reports.find(r => r.id === selectedReportId) || reports[0];
  const otherReports = reports.filter(r => r.id !== currentReport?.id);

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.testName.toLowerCase().includes(searchTest.toLowerCase());
    if (activeCategory === 'All') return matchesSearch;
    return matchesSearch && r.category === activeCategory;
  });

  const handlePageTab = (id: string) => {
    setPageTab(id);
    const tab = LAB_TABS.find(t => t.id === id);
    if (id === 'lab-reports') setSubTab('Results');
    else if (id === 'trends') setSubTab('Trends');
    else if (id === 'compare') setSubTab('Previous Reports');
    else if (tab) showToast(`${tab.label} opened`, 'info');
  };

  const [nextDate, ...nextTime] = (activePatient?.nextAppointment ?? '').split(/\s(?=\d{1,2}:\d{2})/);
  const trend = trends.find(t => t.parameter === trendParam) ?? trends[0];
  const series = trend ? toSeries(trend) : null;
  const noTrends = <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', padding: '12px 4px' }}>{loading ? 'Loading…' : 'Trends appear once a parameter has been measured at least twice.'}</p>;

  return (
    <div className="page-scroll-body">
      <ScreenHeader title="Lab Reports" subtitle="View, analyze and track all laboratory investigations" />

      <PatientBanner
        metrics={[
          { label: 'Last Visit', value: activePatient?.lastVisit || '—' },
          { label: 'Next Appointment', value: nextDate || '—', sub: nextTime.join(' ') || undefined },
          { label: 'Blood Group', value: activePatient?.bloodGroup || '—' }
        ]}
        tabs={LAB_TABS}
        activeTab={pageTab}
        onTabChange={handlePageTab}
      />

      {/* 3-column layout: reports list / report detail / AI summary */}
      <div className="ws-3" style={{ ...ws3('320px', '376px'), gap: 10, alignItems: 'stretch', flex: '1 0 auto' }}>
        {/* Left: Reports & Investigations */}
        <div className="medios-card" style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 0 0 0' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.015em', whiteSpace: 'nowrap' }}>Reports & Investigations</h4>
            <button className="btn-primary" style={{ fontSize: 'var(--fs-sm)', padding: '0 14px' }} onClick={() => showToast('New investigation order form opened')}>
              <Plus size={16} />
              <span>New Request</span>
            </button>
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: 2, borderRadius: 6, background: 'var(--bg-subtle)' }}>
            {CATEGORIES.map(cat => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    height: 24,
                    padding: active ? '0 8px' : '0 5px',
                    borderRadius: 4,
                    fontSize: 'var(--fs-xs)',
                    fontWeight: active ? 500 : 400,
                    whiteSpace: 'nowrap',
                    color: active ? 'var(--blue-text)' : 'var(--text-primary)',
                    background: active ? 'var(--blue-light)' : 'transparent',
                    border: `1px solid ${active ? 'var(--blue-border)' : 'transparent'}`
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: 10, height: 32, border: '1px solid var(--border-color)', borderRadius: 6, background: '#ffffff' }}>
            <Search size={14} color="var(--text-secondary)" style={{ marginLeft: 10, flexShrink: 0 }} />
            <input
              type="text"
              style={{ flex: 1, minWidth: 0, height: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '0 8px', fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}
              placeholder="Search test name..."
              value={searchTest}
              onChange={(e) => setSearchTest(e.target.value)}
            />
            <button
              aria-label="Search"
              onClick={() => showToast(`${filteredReports.length} report(s) match "${searchTest || 'all'}"`, 'info')}
              style={{ width: 32, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <Search size={14} />
            </button>
          </div>

          {/* Reports list */}
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10, flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {filteredReports.map(rep => {
              const isSelected = selectedReportId === rep.id;
              const marker = markerFor(rep.status);
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    minHeight: 60,
                    padding: '8px 12px 8px 14px',
                    cursor: 'pointer',
                    borderRadius: isSelected ? 6 : 0,
                    background: isSelected ? '#e6effd' : 'transparent',
                    boxShadow: isSelected ? 'inset 2px 0 0 var(--blue-primary)' : 'none',
                    borderBottom: isSelected ? '1px solid transparent' : '1px solid var(--border-subtle)'
                  }}
                >
                  <StatusMarker marker={marker} selected={isSelected} />
                  <div style={{ flex: 1, minWidth: 0, lineHeight: 1.5 }}>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{rep.date}</div>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: isSelected ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {rep.testName}
                    </div>
                  </div>
                  {rep.amended && (
                    <span className="status-pill orange" style={{ height: 20, fontSize: 'var(--fs-xs)' }} data-tip={rep.amendedAt ? `Amended ${rep.amendedAt}` : 'Amended'}>
                      Amended
                    </span>
                  )}
                  <span className={`status-pill ${rep.status === 'Abnormal' ? 'red' : rep.status === 'Pending' ? 'orange' : 'green'}`} style={{ height: 20, fontSize: 'var(--fs-xs)' }}>
                    {rep.status}
                  </span>
                </div>
              );
            })}
            {filteredReports.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
                {loading ? 'Loading reports…' : reports.length ? 'No reports match this filter.' : 'No lab reports for this patient yet.'}
              </div>
            )}
          </div>

          <button
            className="btn-outline-blue"
            style={{ width: '100%', height: 32, marginTop: 8, fontSize: 'var(--fs-sm)', background: 'var(--bg-tab)', borderColor: 'var(--blue-border)' }}
            onClick={() => showToast('All reports for this patient are loaded', 'info')}
          >
            Load More Reports
          </button>
        </div>

        {!currentReport ? (
          <div className="medios-card ws-span-rest" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="data-empty">{loading ? 'Loading lab reports…' : 'Select a report to view its results.'}</p>
          </div>
        ) : (
        <>
        {/* Center: report detail */}
        <div className="medios-card" style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em' }}>{currentReport.testName}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', marginTop: 4, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                <span style={{ whiteSpace: 'nowrap' }}>{currentReport.date} | {currentReport.time}</span>
                <span className={`status-pill ${currentReport.status === 'Abnormal' ? 'red' : 'green'}`} style={{ height: 19, fontSize: 'var(--fs-xs)' }}>
                  {currentReport.status}
                </span>
                {currentReport.amended && (
                  <span className="status-pill orange" style={{ height: 19, fontSize: 'var(--fs-xs)', whiteSpace: 'nowrap' }}>
                    Amended{currentReport.amendedAt ? ` ${currentReport.amendedAt}` : ''}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-outline-blue"
                style={{ height: 36, fontSize: 'var(--fs-xs)', padding: '0 14px' }}
                onClick={() => showToast(`Downloaded ${currentReport.testName} PDF`)}
              >
                <LockKeyholeOpen size={15} />
                <span>Download PDF</span>
              </button>
              <button className="icon-btn" style={{ width: 36, height: 36 }} aria-label="More options" onClick={() => showToast('Share, print or archive this report', 'info')}>
                <EllipsisVertical size={16} />
              </button>
            </div>
          </div>

          {/* Report tabs */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {REPORT_TABS.map(tab => (
              <button
                key={tab}
                className={`page-tab-btn ${subTab === tab ? 'active' : ''}`}
                style={{ height: 30, padding: '0 14px', fontSize: 'var(--fs-sm)' }}
                onClick={() => setSubTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {subTab === 'Results' && (
            <div className="table-scroll" style={tableMin(560)}>
              <table className="medios-table" style={{ marginTop: 14, fontSize: 11.5, tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '23%' }} />
                  <col style={{ width: '10.5%' }} />
                  <col style={{ width: '17.5%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '5%' }} />
                </colgroup>
                <thead>
                  <tr>
                    {['Test Name', 'Result', 'Reference Range', 'Unit', 'Status'].map(h => (
                      <th key={h} style={{ fontSize: 11, padding: '6px 6px 7px', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                    ))}
                    <th colSpan={2} style={{ padding: 0, borderLeft: '1px solid var(--border-color)' }} aria-label="Range" />
                  </tr>
                </thead>
                <tbody>
                  {currentReport.groups.map((group, gi) => (
                    <React.Fragment key={group.category}>
                      {gi > 0 && (
                        <tr aria-hidden="true">
                          <td colSpan={7} style={{ height: 9, padding: 0, border: 'none' }} />
                        </tr>
                      )}
                      <tr
                        onClick={() => setCollapsed(c => ({ ...c, [group.category]: !c[group.category] }))}
                        style={{ cursor: 'pointer', background: 'var(--bg-tab)' }}
                      >
                        <td colSpan={7} style={{ padding: '5px 6px', fontWeight: 600, fontSize: 11.5, border: 'none' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <ChevronDown size={13} strokeWidth={2.4} style={{ transform: collapsed[group.category] ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }} />
                            {group.category}
                          </span>
                        </td>
                      </tr>
                      {!collapsed[group.category] &&
                        group.parameters.map(param => {
                          const abnormal = isAbnormal(param);
                          return (
                            <tr
                              key={param.name}
                              style={{ cursor: 'pointer' }}
                              onClick={() => showToast(`${param.name}: ${param.result} ${param.unit} (ref ${param.referenceRange})`, 'info')}
                            >
                              <td style={{ padding: '3px 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{param.name}</td>
                              <td style={{ padding: '3px 6px', fontWeight: 700, color: abnormal || param.critical ? 'var(--red-rose)' : 'var(--green-dark)' }}>
                                {param.result}
                                {param.comment && <span style={{ fontWeight: 400, color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}> · {param.comment}</span>}
                              </td>
                              <td style={{ padding: '3px 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{param.referenceRange}</td>
                              <td style={{ padding: '3px 6px', whiteSpace: 'nowrap' }}>{param.unit}</td>
                              <td style={{ padding: '3px 6px' }}>
                                <span className={`status-pill ${abnormal || param.critical ? 'red' : 'green'}`} style={{ height: 19, padding: '0 7px', fontSize: 11 }}>
                                  {param.critical ? `Critical ${param.status.toLowerCase()}`.replace(/ (normal|abnormal)$/, '') : param.status}
                                </span>
                              </td>
                              <td style={{ padding: '3px 6px 3px 10px' }}>
                                <RangeGauge param={param} />
                              </td>
                              <td style={{ padding: '3px 4px', textAlign: 'right' }}>
                                <ChevronRight size={14} strokeWidth={2} />
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {subTab === 'Trends' && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Longitudinal Biomarker Trends</span>
                {trend && (
                  <select className="form-select" style={{ width: 170, height: 30, fontSize: 'var(--fs-xs)' }} value={trend.parameter} onChange={e => setTrendParam(e.target.value)}>
                    {trends.map(t => <option key={t.parameter}>{t.parameter}</option>)}
                  </select>
                )}
              </div>
              {trend && series ? (
                <>
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                      {trend.parameter} ({series.unit}) · last {series.points.length} results
                    </div>
                    <TrendChart series={series} count={series.points.length} height={200} width={512} />
                  </div>
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 12px', fontSize: 'var(--fs-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>
                        {trend.parameter}
                        {trend.targetRange && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> (Reference {trend.targetRange})</span>}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>Latest {Math.min(3, trend.history.length)} results</span>
                    </div>
                    <div style={{ display: 'flex', gap: 18 }}>
                      {trend.history.slice(-3).map((h, hi, last) => (
                        <div key={`${h.date}|${h.time ?? hi}`}>
                          <div style={{ fontWeight: 700 }}>
                            {h.value} {trend.unit}
                          </div>
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{sameDay(last, h) && h.time ? `${h.date} ${h.time}` : h.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                noTrends
              )}
            </div>
          )}

          {subTab === 'Report Details' && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Report Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Test', value: currentReport.testName },
                  { label: 'Category', value: currentReport.category },
                  { label: 'Collected', value: `${currentReport.date}, ${currentReport.time}` },
                  { label: 'Status', value: currentReport.status }
                ].map(d => (
                  <div key={d.label} style={{ background: 'var(--bg-subtle)', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>{d.label}</div>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{d.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subTab === 'Previous Reports' && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Historical Lab Encounters</div>
              {!otherReports.length && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>No other reports for this patient.</p>}
              {otherReports.map(r => (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedReportId(r.id);
                    setSubTab('Results');
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border-color)', cursor: 'pointer' }}
                >
                  <div>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{r.testName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>{r.date} • {r.category}</div>
                  </div>
                  <span className={`status-pill ${r.status === 'Abnormal' ? 'red' : r.status === 'Pending' ? 'orange' : 'completed'}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: AI summary, trends, related actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div className="ai-assistant-card" style={{ padding: '10px 8px', gap: 6 }}>
            <div className="ai-header-bar">
              <div className="ai-title-row" style={{ fontSize: 14, gap: 8, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                <AiSparkle size={20} />
                <span>AI Lab Summary (GPT-6 Astro)</span>
              </div>
              <button className="btn-outline-blue" style={{ height: 32, fontSize: 'var(--fs-sm)', padding: '0 12px' }} onClick={() => showToast('AI Lab interpretation refreshed')}>
                <RefreshCcwDot size={15} />
                <span>Regenerate</span>
              </button>
            </div>

            <div className="ai-section" style={{ padding: '7px 7px 7px 8px' }}>
              {sectionHeading('Key Findings')}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3, fontSize: 'var(--fs-xs)' }}>
                {!currentReport.aiSummary && <li style={{ color: 'var(--text-muted)' }}>No interpretation recorded for this report.</li>}
                {(currentReport.aiSummary?.findings ?? []).map(f => {
                  const ok = /normal/i.test(f) && !/abnormal/i.test(f);
                  const Icon = ok ? CircleCheck : CircleX;
                  return (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <Icon size={12} fill={ok ? 'var(--green-emerald)' : 'var(--red-rose)'} color="#ffffff" strokeWidth={2.4} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{f}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="ai-section" style={{ padding: '7px 7px 7px 8px' }}>
              {sectionHeading('Clinical Interpretation')}
              <p style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.6 }}>{currentReport.aiSummary?.interpretation || '—'}</p>
            </div>

            <div className="ai-section" style={{ padding: '7px 7px 7px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {sectionHeading('Recommendations')}
                <button
                  className="btn-outline-blue"
                  style={{ height: 22, padding: '0 7px', gap: 5, fontSize: 10.5, fontWeight: 400, background: 'var(--blue-light)', marginTop: -4 }}
                  onClick={() => showToast('Recommendations added to Consultation Plan')}
                >
                  <SquarePen size={11} />
                  <span>Add to Plan</span>
                </button>
              </div>
              <ul style={{ paddingLeft: 15, display: 'flex', flexDirection: 'column', gap: 1, fontSize: 'var(--fs-xs)' }}>
                {(currentReport.aiSummary?.recommendations ?? []).map(r => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="medios-card" style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Trends */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700 }}>
                  <ChartColumnBig size={16} strokeWidth={2.2} />
                  Trends
                </span>
                <button className="text-link" style={{ fontSize: 'var(--fs-sm)', fontWeight: 400 }} onClick={() => handlePageTab('trends')}>
                  View All Trends
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, padding: '0 4px' }}>
                <select className="form-select" style={{ width: 152, height: 28, fontSize: 'var(--fs-xs)', padding: '0 8px' }} value={trend?.parameter ?? ''} onChange={e => setTrendParam(e.target.value)} disabled={!trend}>
                  {trends.map(t => <option key={t.parameter}>{t.parameter}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 6, background: 'var(--bg-tab)' }}>
                  {['3M', '6M', '1Y', 'All'].map(range => {
                    const active = trendRange === range;
                    return (
                      <button
                        key={range}
                        onClick={() => setTrendRange(range)}
                        style={{
                          height: 24,
                          minWidth: 32,
                          padding: '0 8px',
                          borderRadius: 4,
                          fontSize: 'var(--fs-xs)',
                          fontWeight: active ? 500 : 400,
                          color: active ? 'var(--blue-text)' : 'var(--text-primary)',
                          background: active ? 'var(--blue-light)' : 'transparent',
                          border: `1px solid ${active ? 'var(--blue-border)' : 'transparent'}`
                        }}
                      >
                        {range}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ marginTop: 6 }}>
                {series ? <TrendChart series={series} count={RANGE_POINTS[trendRange]} height={118} /> : noTrends}
              </div>
            </div>

            {/* Related actions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-xs)', fontWeight: 600, padding: '0 4px' }}>
                <Hexagon size={14} strokeWidth={2.2} />
                Related Actions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginTop: 8 }}>
                {RELATED_ACTIONS.map(a => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.label}
                      onClick={() => showToast(a.toast, 'info')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        height: 66,
                        padding: '6px 4px',
                        borderRadius: 6,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-subtle)',
                        fontSize: 10.5,
                        lineHeight: 1.35,
                        color: 'var(--text-primary)',
                        textAlign: 'center'
                      }}
                    >
                      <Icon size={16} color="var(--blue-text)" />
                      <span>{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};
