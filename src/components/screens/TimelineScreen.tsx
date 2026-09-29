import React, { useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { PatientBanner } from '../layout/PatientBanner';
import { ScreenHeader } from '../common/ScreenHeader';
import { AiSparkle } from '../common/icons';
import { mockTimelineEvents } from '../../mock/timelineData';
import { ScreenId, TimelineEvent } from '../../types';
import {
  ChartNoAxesGantt,
  Search,
  UserRoundSearch,
  FlaskConical,
  ImagePlay,
  FileSignature,
  Activity,
  Siren,
  BedDouble,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  Plus,
  Clock,
  UserRound,
  Building2,
  CircleCheck,
  CircleAlert,
  RefreshCw,
  SquarePen,
  X,
  type LucideIcon
} from 'lucide-react';

type Category = TimelineEvent['category'];
type Tone = 'blue' | 'orange' | 'purple' | 'cyan' | 'green' | 'red' | 'gray';

const TONES: Record<Tone, { fg: string; bg: string }> = {
  blue: { fg: 'var(--blue-text)', bg: 'var(--blue-light)' },
  orange: { fg: 'var(--orange-dark)', bg: 'var(--orange-light)' },
  purple: { fg: 'var(--purple-dark)', bg: 'var(--purple-light)' },
  cyan: { fg: 'var(--cyan-lab)', bg: 'var(--cyan-light)' },
  green: { fg: 'var(--green-dark)', bg: 'var(--green-light)' },
  red: { fg: 'var(--red-dark)', bg: 'var(--red-light)' },
  gray: { fg: 'var(--gray-pill-text)', bg: 'var(--gray-pill-bg)' }
};

const CATEGORY_META: Record<Category, { icon: LucideIcon; tone: Tone; action?: { label: string; screen: ScreenId } }> = {
  Consultation: { icon: UserRoundSearch, tone: 'blue', action: { label: 'Go to Consultation', screen: 'consultation' } },
  Lab: { icon: FlaskConical, tone: 'orange', action: { label: 'View Full Lab Report', screen: 'lab-reports' } },
  Imaging: { icon: ImagePlay, tone: 'purple', action: { label: 'View DICOM Images', screen: 'imaging' } },
  Prescription: { icon: FileSignature, tone: 'cyan', action: { label: 'View Prescription', screen: 'prescriptions' } },
  Vitals: { icon: Activity, tone: 'green', action: { label: 'Open Vitals Dashboard', screen: 'vitals' } },
  Emergency: { icon: Siren, tone: 'red' },
  Admission: { icon: BedDouble, tone: 'gray' }
};

const STATUS_PILL: Record<TimelineEvent['status'], string> = {
  Completed: 'completed',
  'In Progress': 'in-progress',
  Scheduled: 'scheduled',
  Reviewed: 'purple'
};

const FILTERS: { label: string; category?: Category }[] = [
  { label: 'All Events' },
  { label: 'Consultations', category: 'Consultation' },
  { label: 'Lab Orders', category: 'Lab' },
  { label: 'Imaging', category: 'Imaging' },
  { label: 'Prescriptions', category: 'Prescription' },
  { label: 'Vitals Checks', category: 'Vitals' },
  { label: 'Emergency', category: 'Emergency' }
];

const pillStyle = (tone: Tone): React.CSSProperties => ({ backgroundColor: TONES[tone].bg, color: TONES[tone].fg });

const AI_KEY_EVENTS: { text: string; ok: boolean }[] = [
  { text: 'HbA1c 7.8% – sub-optimal glycaemic control', ok: false },
  { text: 'BP 136–142 / 86–92 mmHg over the last 4 visits', ok: false },
  { text: 'Grade 1 fatty liver on USG abdomen (21 Mar)', ok: false },
  { text: 'Chest X-Ray clear – no active disease (12 Sep)', ok: true },
  { text: 'ER visit (10 Jan) – non-cardiac chest pain', ok: true }
];

const AI_RECOMMENDATIONS = [
  'Repeat HbA1c in 3 months (Dec 2026)',
  'Home BP log; review Amlodipine dose if > 140/90',
  'Complete Preventive Cardiology referral (TMT)',
  'Repeat LFT and USG abdomen in 6 months'
];

export const TimelineScreen: React.FC = () => {
  const { activePatient, showToast, setActiveScreen } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<string>('All Events');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'tl-1': true,
    'tl-2': true,
    'tl-3': true
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('Consultation');
  const [newNotes, setNewNotes] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(mockTimelineEvents);

  if (!activePatient) {
    return (
      <div className="page-scroll-body">
        <div className="medios-card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
          <h3 className="card-title">No active patient selected</h3>
        </div>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const countOf = (category?: Category) =>
    category ? timelineEvents.filter(e => e.category === category).length : timelineEvents.length;

  const query = searchQuery.toLowerCase();
  const activeFilter = FILTERS.find(f => f.label === selectedFilter);
  const filteredEvents = timelineEvents.filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(query) ||
      event.subtitle.toLowerCase().includes(query) ||
      event.doctor.toLowerCase().includes(query) ||
      (event.details?.diagnosis && event.details.diagnosis.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    return !activeFilter?.category || event.category === activeFilter.category;
  });

  const labTests = timelineEvents
    .filter(e => e.category === 'Lab')
    .reduce((sum, e) => sum + (e.details?.testsConducted?.length ?? 0), 0);
  const activeRx = timelineEvents
    .filter(e => e.category === 'Prescription')
    .reduce((sum, e) => sum + (e.details?.medicationsCount ?? 0), 0);
  const oldestDate = timelineEvents[timelineEvents.length - 1]?.date;

  const overviewTiles: { label: string; value: number; sub: string; tone: Tone; filter: string }[] = [
    { label: 'Total Events', value: timelineEvents.length, sub: `Since ${oldestDate ?? '—'}`, tone: 'blue', filter: 'All Events' },
    { label: 'Consultations', value: countOf('Consultation'), sub: 'OPD visits', tone: 'blue', filter: 'Consultations' },
    { label: 'Lab Panels', value: countOf('Lab'), sub: `${labTests} tests`, tone: 'orange', filter: 'Lab Orders' },
    { label: 'Imaging Studies', value: countOf('Imaging'), sub: 'X-Ray, USG', tone: 'purple', filter: 'Imaging' },
    { label: 'Prescriptions', value: countOf('Prescription'), sub: `${activeRx} active Rx`, tone: 'cyan', filter: 'Prescriptions' },
    { label: 'Emergency', value: countOf('Emergency'), sub: 'ER visits', tone: 'red', filter: 'Emergency' }
  ];

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please enter an event title', 'warning');
      return;
    }

    const newEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      uhid: activePatient.uhid,
      date: 'Today, 26 Sep 2026',
      time: 'Just now',
      category: newCategory,
      title: newTitle,
      subtitle: 'Manual Clinical Entry',
      doctor: 'Dr. Shajin',
      department: 'General Medicine',
      status: 'Completed',
      details: {
        notes: newNotes
      }
    };

    setTimelineEvents([newEvent, ...timelineEvents]);
    setExpandedIds(prev => ({ ...prev, [newEvent.id]: true }));
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewNotes('');
    showToast('Clinical milestone recorded successfully');
  };

  const detailRow = (label: string, value: React.ReactNode) => (
    <>
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{value}</span>
    </>
  );

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="Patient Timeline"
        subtitle="Chronological view of all clinical encounters, investigations and treatments"
        actions={
          <>
            <button className="btn-secondary" onClick={() => showToast('Timeline exported as clinical summary PDF')}>
              <Download size={18} />
              <span>Export Summary</span>
            </button>
            <button className="btn-secondary" onClick={() => window.print()}>
              <Printer size={18} />
              <span>Print</span>
            </button>
            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={18} />
              <span>Add Event / Note</span>
            </button>
          </>
        }
      />

      <PatientBanner activeTab="timeline" />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) clamp(300px, 26vw, 372px)', gap: 'var(--gap)', alignItems: 'start' }}>
        {/* Timeline */}
        <div className="medios-card">
          <div className="card-header-row" style={{ marginBottom: '10px' }}>
            <div className="card-title-group">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChartNoAxesGantt size={18} color="var(--blue-text)" />
                <span>Clinical Timeline</span>
              </h3>
              <p>
                {timelineEvents.length} events · {oldestDate} – {timelineEvents[0]?.date.replace('Today, ', '')}
              </p>
            </div>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                className="input-field"
                style={{ height: '32px', paddingLeft: '32px', fontSize: 'var(--fs-sm)' }}
                placeholder="Search events, diagnosis, doctor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
            {FILTERS.map((f) => (
              <button
                key={f.label}
                className={`chip-btn ${selectedFilter === f.label ? 'active' : ''}`}
                onClick={() => setSelectedFilter(f.label)}
              >
                {f.label} ({countOf(f.category)})
              </button>
            ))}
          </div>

          {filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
              <ChartNoAxesGantt size={32} color="var(--border-strong)" style={{ margin: '0 auto 10px auto' }} />
              <p style={{ fontWeight: 600, fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>
                No events found matching your search
              </p>
              <button
                className="btn-secondary btn-sm"
                style={{ marginTop: '12px' }}
                onClick={() => { setSelectedFilter('All Events'); setSearchQuery(''); }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '14px' }}>
              {filteredEvents.map((event, index) => {
                const isExpanded = !!expandedIds[event.id];
                const isLast = index === filteredEvents.length - 1;
                const meta = CATEGORY_META[event.category];
                const Icon = meta.icon;
                const tone = TONES[meta.tone];

                return (
                  <div key={event.id} style={{ display: 'grid', gridTemplateColumns: '96px 34px minmax(0, 1fr)', columnGap: '12px' }}>
                    {/* Date / time */}
                    <div style={{ textAlign: 'right', paddingTop: '6px' }}>
                      <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {event.date.replace('Today, ', '')}
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '1px' }}>
                        <Clock size={11} />
                        <span>{event.time}</span>
                      </div>
                    </div>

                    {/* Node + spine */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: tone.bg,
                          color: tone.fg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 0 0 4px #ffffff'
                        }}
                      >
                        <Icon size={17} strokeWidth={1.9} />
                      </div>
                      {!isLast && <div style={{ width: '2px', flex: 1, minHeight: '24px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />}
                    </div>

                    {/* Event card */}
                    <div
                      style={{
                        minWidth: 0,
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        marginBottom: isLast ? 0 : '12px',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className="status-pill" style={pillStyle(meta.tone)}>{event.category}</span>
                            <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{event.title}</span>
                          </div>
                          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: '3px' }}>
                            {event.subtitle}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span className={`status-pill ${STATUS_PILL[event.status]}`}>{event.status}</span>
                          <button
                            className="icon-btn"
                            style={{ width: '28px', height: '28px' }}
                            title={isExpanded ? 'Collapse' : 'Expand'}
                            onClick={() => toggleExpand(event.id)}
                          >
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginTop: '6px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <UserRound size={13} />
                          <span style={{ color: 'var(--text-secondary)' }}>{event.doctor}</span>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Building2 size={13} />
                          <span style={{ color: 'var(--text-secondary)' }}>{event.department}</span>
                        </span>
                      </div>

                      {isExpanded && event.details && (
                        <div
                          style={{
                            marginTop: '10px',
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px 12px',
                            fontSize: 'var(--fs-sm)'
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: '78px minmax(0, 1fr)', rowGap: '6px', columnGap: '10px' }}>
                            {event.details.diagnosis &&
                              detailRow('Diagnosis', <span style={{ color: 'var(--blue-text)', fontWeight: 500 }}>{event.details.diagnosis}</span>)}
                            {event.details.vitalsSummary && detailRow('Vitals', event.details.vitalsSummary)}
                            {event.details.notes && detailRow('Notes', event.details.notes)}
                            {event.details.testsConducted &&
                              detailRow(
                                'Tests Done',
                                <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {event.details.testsConducted.map((t) => (
                                    <span key={t} className="status-pill gray">{t}</span>
                                  ))}
                                </span>
                              )}
                          </div>

                          {meta.action && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                              <button className="btn-outline-blue btn-sm" onClick={() => setActiveScreen(meta.action!.screen)}>
                                {meta.action.label}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)', position: 'sticky', top: 0 }}>
          <div className="medios-card">
            <div className="card-header-row">
              <h3 className="card-title">Timeline Overview</h3>
              <button className="text-link" onClick={() => setSelectedFilter('All Events')}>View All</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              {overviewTiles.map((tile) => (
                <button
                  key={tile.label}
                  onClick={() => setSelectedFilter(tile.filter)}
                  style={{
                    textAlign: 'left',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: TONES[tile.tone].bg,
                    border: selectedFilter === tile.filter ? `1px solid ${TONES[tile.tone].fg}` : '1px solid transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px'
                  }}
                >
                  <span style={{ fontSize: 'var(--fs-stat)', fontWeight: 700, color: TONES[tile.tone].fg, lineHeight: 1.15 }}>{tile.value}</span>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{tile.label}</span>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{tile.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ai-assistant-card">
            <div className="ai-header-bar">
              <div className="ai-title-row">
                <AiSparkle size={20} />
                <span>AI Timeline Summary (GPT-6 Astro)</span>
              </div>
              <button className="icon-btn" style={{ width: '28px', height: '28px' }} title="Regenerate" onClick={() => showToast('AI timeline summary regenerated', 'info')}>
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="ai-section">
              <div className="ai-section-title">
                <AiSparkle size={12} />
                <span>Key Events</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {AI_KEY_EVENTS.map((item) => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                    {item.ok ? (
                      <CircleCheck size={14} color="#ffffff" fill="var(--green-emerald)" style={{ flexShrink: 0, marginTop: '1px' }} />
                    ) : (
                      <CircleAlert size={14} color="#ffffff" fill="var(--red-rose)" style={{ flexShrink: 0, marginTop: '1px' }} />
                    )}
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ai-section">
              <div className="ai-section-title">
                <AiSparkle size={12} />
                <span>Clinical Interpretation</span>
              </div>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {activePatient.age}-year-old {activePatient.gender.toLowerCase()} with hypertension and type 2 diabetes,{' '}
                {timelineEvents.length} encounters in 9 months. Chronic disease control is fair – BP and glycaemic targets
                not yet met. Acute URTI under evaluation today.
              </p>
            </div>

            <div className="ai-section">
              <div className="ai-section-title" style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                  <AiSparkle size={12} />
                  <span>Recommendations</span>
                </span>
                <button
                  className="btn-outline-blue btn-sm"
                  style={{ height: '24px', fontSize: 'var(--fs-xs)', padding: '0 8px', backgroundColor: 'var(--blue-light)' }}
                  onClick={() => showToast('Recommendations added to care plan')}
                >
                  <SquarePen size={12} />
                  <span>Add to Plan</span>
                </button>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {AI_RECOMMENDATIONS.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Add Milestone Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChartNoAxesGantt size={18} color="var(--blue-text)" />
                <span>Record Clinical Milestone</span>
              </h3>
              <button className="icon-btn" title="Close" onClick={() => setIsAddModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddMilestone}>
              <div className="modal-body">
                <div>
                  <label className="form-label" htmlFor="tl-title">Event Title *</label>
                  <input
                    id="tl-title"
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Follow-up after blood pressure stabilization"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="tl-category">Category</label>
                  <select
                    id="tl-category"
                    className="form-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Category)}
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Lab">Lab Investigation</option>
                    <option value="Imaging">Imaging / Radiology</option>
                    <option value="Prescription">Prescription / Medication</option>
                    <option value="Vitals">Vitals Check</option>
                    <option value="Emergency">Emergency Encounter</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" htmlFor="tl-notes">Clinical Notes & Summary</label>
                  <textarea
                    id="tl-notes"
                    rows={4}
                    className="input-field"
                    placeholder="Document clinical observations, diagnosis, or recommendations..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
