import React, { useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { PatientBanner, type BannerTab } from '../layout/PatientBanner';
import { ScreenHeader } from '../common/ScreenHeader';
import { AiSparkle } from '../common/icons';
import { AutoTextarea } from '../common/AutoTextarea';
import { StudyThumb } from '../common/StudyThumb';
import { CHEST_XRAY_THUMB, USG_ABDOMEN_THUMB } from '../../mock/imagingThumbsData';
import { mockOlderVisits, mockVisitsTimeline } from '../../mock/consultationsData';
import {
  Activity,
  Bold,
  CalendarClock,
  ChevronDown,
  CircleCheck,
  Clock3,
  Cross,
  EllipsisVertical,
  FileSignature,
  FileText,
  Files,
  FlaskConical,
  History,
  ImagePlay,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Paperclip,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Table2,
  TriangleAlert,
  CircleCheckBig,
  Unlink,
  Waves,
  ClipboardPlus,
  ClipboardList
} from 'lucide-react';

type NoteType = 'SOAP' | 'Structured Form' | 'Free Text';
type SoapKey = 'subjective' | 'objective' | 'assessment' | 'plan';
type AiTab = 'Suggestions' | 'Report Analysis' | 'Guidelines' | 'Patient Insights';

/** Tab strip exactly as in the EMR design. */
const EMR_TABS: BannerTab[] = [
  { id: 'emr', label: 'Clinical Notes', icon: FileText, screen: 'emr' },
  { id: 'timeline', label: 'History Timeline', icon: History, screen: 'timeline' },
  { id: 'vitals', label: 'Vitals', icon: Activity, screen: 'vitals' },
  { id: 'lab-reports', label: 'Lab Reports', icon: FlaskConical, screen: 'lab-reports' },
  { id: 'imaging', label: 'Imaging', icon: ImagePlay, screen: 'imaging' },
  { id: 'medications', label: 'Medications', icon: Pill, screen: 'medications' },
  { id: 'prescriptions', label: 'Prescriptions', icon: FileSignature, screen: 'prescriptions' },
  { id: 'documents', label: 'Documents', icon: Files, screen: 'documents' },
  { id: 'care-plan', label: 'Care Plan', icon: CircleCheck },
  { id: 'allergies', label: 'Allergies', icon: TriangleAlert },
  { id: 'follow-ups', label: 'Follow-ups', icon: CalendarClock, screen: 'follow-ups' }
];

const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0
};
const softBlueBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
  height: 21,
  padding: '0 8px',
  borderRadius: 5,
  border: '1px solid var(--blue-border)',
  background: 'var(--blue-light)',
  color: 'var(--blue-text)',
  fontSize: 10,
  fontWeight: 400,
  whiteSpace: 'nowrap',
  flexShrink: 0
};
const aiBlock: React.CSSProperties = {
  border: '1px solid #ebe5fb',
  borderRadius: 'var(--radius-md)',
  background: '#ffffff',
  overflow: 'hidden',
  flexShrink: 0
};
const aiBlockHead: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  height: 24,
  padding: '0 10px',
  background: 'linear-gradient(90deg, #f3eefe 0%, #f8f5ff 100%)',
  color: 'var(--purple-dark)',
  fontSize: 11,
  fontWeight: 500
};
const miniTitle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' };
const viewAll: React.CSSProperties = { fontSize: 11, color: 'var(--blue-text)' };
const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 10.5, lineHeight: '14px', color: 'var(--text-primary)', marginBottom: 2 };
const fieldBox: React.CSSProperties = { height: 26, fontSize: 10.5, padding: '0 9px', borderRadius: 5 };

const SOAP_META: Record<SoapKey, { letter: string; title: string; hint: string; tileBg: string; tileFg: string }> = {
  subjective: { letter: 'S', title: 'Subjective', hint: 'Patient’s complaints, history and symptoms', tileBg: '#dcecfd', tileFg: 'var(--blue-text)' },
  objective: { letter: 'O', title: 'Objective', hint: 'Examination findings, vitals, systemic examination', tileBg: 'var(--green-light)', tileFg: 'var(--green-dark)' },
  assessment: { letter: 'A', title: 'Assessment', hint: 'Clinical impression / differential diagnosis', tileBg: 'var(--orange-light)', tileFg: '#d4570b' },
  plan: { letter: 'P', title: 'Plan', hint: 'Investigations, treatment, advice, follow-up', tileBg: '#efe7fe', tileFg: 'var(--purple-dark)' }
};

const NOTE_TEMPLATES = ['General Consultation', 'Follow-up Visit', 'Hypertension Review', 'Diabetes Review'];

export const ClinicalNotesScreen: React.FC = () => {
  const { activePatient, showToast, setActiveScreen } = useApp();
  const [activeTab, setActiveTab] = useState('emr');
  const [selectedVisitId, setSelectedVisitId] = useState('v1');
  const [visitQuery, setVisitQuery] = useState('');
  const [showOlder, setShowOlder] = useState(false);
  const [noteType, setNoteType] = useState<NoteType>('SOAP');
  const [showTemplates, setShowTemplates] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [fillFromVitals, setFillFromVitals] = useState(true);
  const [aiTab, setAiTab] = useState<AiTab>('Suggestions');
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [consultType, setConsultType] = useState('Follow-up');
  const [visitType, setVisitType] = useState('OPD');

  // SOAP State
  const [soap, setSoap] = useState<Record<SoapKey, string>>({
    subjective:
      'Patient reports fever for 3 days associated with mild cough and body ache.\nNo breathlessness. Appetite slightly reduced. No chest pain.\nKnown case of hypertension and type 2 diabetes.\nNo recent travel. No sick contacts.',
    objective: 'General: Alert, oriented\nRS: Bilateral air entry present, no added sounds\nCVS: S1 S2 normal\nAbdomen: Soft, non-tender\nSpO₂: 98%',
    assessment: 'Acute respiratory infection (likely viral).\nKnown HTN and Type 2 DM – fair control.\nNo evidence of lower respiratory tract involvement at present.',
    plan: '•  Tab Paracetamol 650 mg – TID for 3 days\n•  Adequate fluids and rest\n•  Continue current medications\n•  Review if symptoms persist or worsen\n•  Follow-up after 5 days'
  });
  const [icdCode, setIcdCode] = useState('J06.9');
  const [icdDesc, setIcdDesc] = useState('Acute upper respiratory infection');
  const [structured, setStructured] = useState({
    chiefComplaint: 'Fever for 3 days, mild dry cough, body aches',
    examination: 'RS: Bilateral clear, CVS: S1 S2 normal, P/A: Soft, non-tender',
    impression: 'Acute Viral Pharyngitis / Upper Respiratory Infection'
  });
  const [freeTextNote, setFreeTextNote] = useState(
    'CLINICAL ENCOUNTER NOTE - 26 SEP 2026\nPatient: Arun Kumar (34M) | UHID: MHK202500321\nDr. Shajin | General Medicine\n\nCHIEF COMPLAINTS:\n- Fever and generalized body aches for 3 days.\n- Mild dry cough, throat irritation.\n\nPHYSICAL EXAMINATION:\n- General: Well oriented, alert, no signs of distress.\n- Vitals: BP 140/90 mmHg, HR 86 bpm, SpO2 98%, Temp 98.4 F.\n- Chest: Clear air entry bilaterally, no crepitations or wheezing.\n- ENT: Pharyngeal erythema present without exudates.\n\nIMPRESSION:\n- Acute Viral Pharyngitis / Upper Respiratory Tract Infection.\n- Essential Hypertension & Type 2 Diabetes Mellitus - under continued therapy.\n\nRECOMMENDATIONS:\n1. Tab Paracetamol 650mg TID after food for 3 days.\n2. Hydration therapy and salt water gargles.\n3. Continue Amlodipine 5mg OD and Metformin 500mg BD.\n4. Follow-up after 5 days if fever persists or dyspnea develops.'
  );

  const allVisits = showOlder ? [...mockVisitsTimeline, ...mockOlderVisits] : mockVisitsTimeline;
  const q = visitQuery.trim().toLowerCase();
  const visits = q ? allVisits.filter((v) => `${v.date} ${v.type} ${v.doctor} ${v.reason}`.toLowerCase().includes(q)) : allVisits;
  const selectedVisit = allVisits.find((v) => v.id === selectedVisitId) ?? mockVisitsTimeline[0];
  const vitals = activePatient?.vitals;

  const updateSoap = (key: SoapKey, value: string) => setSoap((prev) => ({ ...prev, [key]: value }));

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    const tab = EMR_TABS.find((t) => t.id === id);
    if (tab && !tab.screen) showToast(`${tab.label}: showing entries from the clinical record`, 'info');
  };

  const handleAsk = () => {
    if (!aiQuery.trim()) return;
    setAiAnswer(
      `GPT-6 Astro: ${aiQuery.trim()} — Findings correlate with Hospital SOP GM 4.2 (Acute Respiratory Infection). Continue symptomatic care, keep BP < 130/80 and review HbA1c trend (7.8%).`
    );
    showToast('GPT-6 Astro: Analysis correlated with Hospital SOP');
  };

  const listPrefix = (kind: 'bullet' | 'number' | 'check') => {
    const lines = soap.subjective.split('\n').map((l) => l.replace(/^(•|\d+\.|☐)\s*/, ''));
    updateSoap('subjective', lines.map((l, i) => `${kind === 'bullet' ? '• ' : kind === 'number' ? `${i + 1}. ` : '☐ '}${l}`).join('\n'));
  };

  const renderSectionAction = (key: SoapKey) => {
    if (key === 'objective') {
      return (
        <label style={{ ...softBlueBtn, cursor: 'pointer', gap: 6 }}>
          <input
            type="checkbox"
            checked={fillFromVitals}
            onChange={(e) => {
              setFillFromVitals(e.target.checked);
              if (e.target.checked) showToast('Objective findings synced with latest vitals');
            }}
            style={{ width: 11, height: 11, accentColor: 'var(--blue-primary)' }}
          />
          Fill from Vitals
        </label>
      );
    }
    const cfg = {
      subjective: { label: 'Use AI (Fill from conversation)', toast: 'Voice consultation transcription copied to Subjective' },
      assessment: { label: 'Get AI Suggestions', toast: 'AI suggested differential impression inserted' },
      plan: { label: 'Use AI Plan', toast: 'AI Treatment plan loaded' }
    }[key];
    return (
      <button style={softBlueBtn} onClick={() => showToast(cfg.toast)}>
        <Sparkles size={10} />
        {cfg.label}
      </button>
    );
  };

  const renderSoapSection = (key: SoapKey) => {
    const meta = SOAP_META[key];
    const isSubjective = key === 'subjective';
    const toolbar = [
      { icon: Bold, label: 'Bold' },
      { icon: Italic, label: 'Italic', sep: true },
      { icon: List, label: 'Bulleted list', onClick: () => listPrefix('bullet') },
      { icon: ListOrdered, label: 'Numbered list', onClick: () => listPrefix('number') },
      { icon: ListTodo, label: 'Checklist', onClick: () => listPrefix('check'), sep: true },
      { icon: Table2, label: 'Insert table' },
      { icon: Link2, label: 'Insert link' },
      { icon: Unlink, label: 'Remove link' },
      { icon: Waves, label: 'Clear formatting' }
    ];
    return (
      <div key={key} style={{ display: 'flex', gap: 9 }}>
        <div
          style={{
            width: 40,
            height: 35,
            borderRadius: 7,
            background: meta.tileBg,
            color: meta.tileFg,
            fontSize: 21,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 2
          }}
        >
          {meta.letter}
        </div>
        <div style={{ flex: 1, minWidth: 0, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: '#fbfcfe', padding: '2px 7px 4px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <span style={{ fontSize: 10.5, fontWeight: 600 }}>{meta.title}</span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.hint}</span>
            </div>
            {renderSectionAction(key)}
          </div>
          <div style={{ marginTop: 2, border: '1px solid var(--border-subtle)', borderRadius: 5, background: '#ffffff', padding: isSubjective ? '0 8px 2px' : '2px 8px' }}>
            {isSubjective && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 16, marginLeft: -3, borderBottom: '1px solid var(--border-subtle)', marginBottom: 2 }}>
                {toolbar.map(({ icon: Icon, label, onClick, sep }) => (
                  <React.Fragment key={label}>
                    <button
                      title={label}
                      aria-label={label}
                      onClick={onClick ?? (() => showToast(`${label} applied`, 'info'))}
                      style={{ width: 19, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}
                    >
                      <Icon size={11} strokeWidth={2.2} />
                    </button>
                    {sep && <span style={{ width: 1, height: 11, background: 'var(--border-color)', margin: '0 3px' }} />}
                  </React.Fragment>
                ))}
              </div>
            )}
            <AutoTextarea label={meta.title} value={soap[key]} onChange={(v) => updateSoap(key, v)} style={{ fontSize: 10.5, lineHeight: '13px' }} />
          </div>
        </div>
      </div>
    );
  };

  const vitalCells = [
    { label: 'BP', value: `${vitals?.bpSystolic ?? 140}/${vitals?.bpDiastolic ?? 90}`, unit: 'mmHg', alert: true },
    { label: 'HR', value: vitals?.heartRate ?? 86, unit: 'bpm' },
    { label: 'Temp', value: vitals?.temperature ?? 98.4, unit: '°F' },
    { label: 'SpO₂', value: vitals?.spo2 ?? 98, unit: '%' },
    { label: 'Weight', value: vitals?.weightKg ?? 78, unit: 'kg' },
    { label: 'BMI', value: vitals?.bmi ?? 26.4, unit: `(${vitals?.bmiStatus ?? 'Overweight'})` }
  ];

  return (
    <div className="page-scroll-body">
      <ScreenHeader title="EMR / Clinical Notes" subtitle="View and manage complete medical records" />

      <PatientBanner
        metrics={[
          { label: 'Last Visit', value: activePatient?.lastVisit ?? '—' },
          {
            label: 'Next Appointment',
            value: activePatient?.nextAppointment?.replace(/\s\d{1,2}:\d{2}.*$/, '') ?? '—',
            sub: activePatient?.nextAppointment?.match(/\d{1,2}:\d{2}.*$/)?.[0]
          },
          { label: 'Department', value: activePatient?.department ?? '—' }
        ]}
        extra={
          <div className="metric-column" style={{ minWidth: 100 }}>
            <span className="metric-label">Blood Group</span>
            <span className="metric-value">{activePatient?.bloodGroup ?? '—'}</span>
          </div>
        }
        action={
          <button className="btn-outline-blue patient-banner-action" style={{ minWidth: 150, height: 40, padding: '0 14px', marginLeft: 12 }} onClick={() => setActiveScreen('patients')}>
            <ClipboardList size={17} />
            <span>Patient Summary</span>
          </button>
        }
        tabs={EMR_TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Main 3-column EMR layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 244fr) minmax(0, 643fr) minmax(0, 394fr)', gap: 10, alignItems: 'stretch' }}>
        {/* Left: Visits timeline */}
        <div style={{ ...card, padding: '8px 9px 9px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, paddingLeft: 3 }}>Visits</h4>
            <button className="btn-primary" style={{ height: 28, padding: '0 14px', fontSize: 11, gap: 7 }} onClick={() => showToast('New clinical encounter started')}>
              <Plus size={14} />
              <span>New Note</span>
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: 8, color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="input-field"
              style={{ height: 29, fontSize: 10.5, paddingLeft: 30, borderRadius: 5 }}
              placeholder="Search visits..."
              value={visitQuery}
              onChange={(e) => setVisitQuery(e.target.value)}
            />
          </div>

          {/* Scroll area is absolutely positioned so the list never stretches the row. */}
          <div style={{ position: 'relative', flex: 1, marginTop: 7, minHeight: 240 }}>
            <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
            <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 8, top: 14, bottom: 14, width: 1, background: 'var(--border-strong)' }} />
            {visits.map((visit, i) => {
              const isSelected = selectedVisitId === visit.id;
              return (
                <button
                  key={visit.id}
                  onClick={() => setSelectedVisitId(visit.id)}
                  style={{
                    position: 'relative',
                    display: 'grid',
                    gridTemplateColumns: '18px 87px 1fr',
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 4px 8px 0',
                    borderRadius: 6,
                    background: isSelected ? '#e8f0fd' : 'transparent',
                    borderTop: i && !isSelected && selectedVisitId !== visits[i - 1]?.id ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    marginLeft: 0
                  }}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: visit.color,
                      boxShadow: `0 0 0 2.5px ${isSelected ? '#cfe0fb' : '#eef1f6'}`,
                      marginTop: 5,
                      marginLeft: 4,
                      position: 'relative'
                    }}
                  />
                  <span style={{ display: 'flex', flexDirection: 'column', paddingLeft: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: '18px' }}>{visit.date}</span>
                    {isSelected && <span style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: '17px' }}>{visit.time}</span>}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', fontSize: 10.8, lineHeight: '17.5px', color: 'var(--text-primary)' }}>
                    <span>{visit.type}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{visit.doctor}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{visit.reason}</span>
                  </span>
                </button>
              );
            })}
            {!visits.length && <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '12px 4px' }}>No visits match “{visitQuery}”.</div>}
            </div>
            </div>
          </div>

          <button
            className="btn-secondary"
            style={{ width: '100%', height: 29, fontSize: 11, color: 'var(--blue-text)', marginTop: 7, flexShrink: 0 }}
            onClick={() => {
              if (showOlder) {
                showToast('All visits loaded', 'info');
              } else {
                setShowOlder(true);
                showToast(`${mockOlderVisits.length} older visits loaded`);
              }
            }}
          >
            Load More
          </button>
        </div>

        {/* Center: Clinical Note editor */}
        <div style={{ ...card, padding: '6px 10px 7px 11px', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, height: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>
              Clinical Note - {selectedVisit.date} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-secondary)' }}>({selectedVisit.time})</span>
            </h3>
            <span className="status-pill blue" style={{ height: 20, fontSize: 10.5, padding: '0 8px', marginLeft: 6 }}>
              {selectedVisit.type}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, position: 'relative' }}>
            {(['SOAP', 'Structured Form', 'Free Text'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setNoteType(tab)}
                style={{
                  height: 24,
                  padding: tab === 'SOAP' ? '0 22px' : '0 16px',
                  borderRadius: 5,
                  fontSize: 10,
                  background: noteType === tab ? 'var(--blue-primary)' : 'var(--bg-tab)',
                  color: noteType === tab ? '#ffffff' : 'var(--text-primary)'
                }}
              >
                {tab}
              </button>
            ))}
            <button
              className="btn-secondary"
              style={{ height: 24, padding: '0 9px 0 11px', fontSize: 10.5, color: 'var(--blue-text)', borderColor: 'var(--blue-border)', marginLeft: 6, gap: 8, minWidth: 84 }}
              onClick={() => setShowTemplates((v) => !v)}
            >
              Templates
              <ChevronDown size={13} />
            </button>
            {showTemplates && <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setShowTemplates(false)} />}
            {showTemplates && (
              <div
                style={{
                  position: 'absolute',
                  top: 28,
                  right: 0,
                  zIndex: 10,
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  boxShadow: 'var(--shadow-md)',
                  padding: 4,
                  minWidth: 170
                }}
              >
                {NOTE_TEMPLATES.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setShowTemplates(false);
                      setNoteType('SOAP');
                      showToast(`${t} template applied`);
                    }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', fontSize: 11, padding: '5px 8px', borderRadius: 4 }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {noteType === 'SOAP' && (['subjective', 'objective', 'assessment', 'plan'] as const).map(renderSoapSection)}

          {noteType === 'Free Text' && (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 9px', background: '#fbfcfe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>Unstructured Clinical Free Text Note</span>
                <button style={softBlueBtn} onClick={() => showToast('AI Clinical text auto-formatted')}>
                  <Sparkles size={10} />
                  AI Auto-Format
                </button>
              </div>
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 5, background: '#ffffff', padding: '5px 8px' }}>
                <AutoTextarea label="Free text note" value={freeTextNote} onChange={setFreeTextNote} style={{ fontSize: 10.5, lineHeight: '14px', fontFamily: 'var(--font-mono)' }} />
              </div>
            </div>
          )}

          {noteType === 'Structured Form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(
                [
                  { key: 'chiefComplaint', label: 'Chief Complaint (Primary Concern)' },
                  { key: 'examination', label: 'Systemic Examination' },
                  { key: 'impression', label: 'Provisional Clinical Impression' }
                ] as const
              ).map((f) => (
                <div key={f.key} style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 9px', background: '#fbfcfe' }}>
                  <label style={{ ...fieldLabel, fontWeight: 600 }}>{f.label}</label>
                  <input className="input-field" style={fieldBox} value={structured[f.key]} onChange={(e) => setStructured({ ...structured, [f.key]: e.target.value })} />
                </div>
              ))}
            </div>
          )}

          {/* Additional details + actions */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '4px 8px 6px', marginTop: 'auto' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, lineHeight: '14px', marginBottom: 2 }}>Additional Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.18fr 0.97fr', gap: 8 }}>
              <div>
                <label style={fieldLabel}>Diagnosis (ICD-10)</label>
                <div style={{ display: 'flex', alignItems: 'center', height: 26, border: '1px solid var(--border-color)', borderRadius: 5, padding: '0 8px', gap: 12, background: '#ffffff' }}>
                  <input aria-label="ICD-10 code" value={icdCode} onChange={(e) => setIcdCode(e.target.value)} style={{ width: 36, border: 'none', outline: 'none', fontSize: 10.5, fontWeight: 500 }} />
                  <input aria-label="Diagnosis" value={icdDesc} onChange={(e) => setIcdDesc(e.target.value)} style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 10.5 }} />
                  <button aria-label="Search ICD-10" onClick={() => showToast('ICD-10 suggestions: J06.9, J00, J02.9, R50.9', 'info')} style={{ display: 'flex', color: 'var(--text-primary)' }}>
                    <Search size={13} />
                  </button>
                </div>
              </div>
              <div>
                <label style={fieldLabel}>Consultation Type</label>
                <select className="form-select" style={fieldBox} value={consultType} onChange={(e) => setConsultType(e.target.value)}>
                  <option>Follow-up</option>
                  <option>New Consultation</option>
                  <option>Review</option>
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Visit Type</label>
                <select className="form-select" style={fieldBox} value={visitType} onChange={(e) => setVisitType(e.target.value)}>
                  <option>OPD</option>
                  <option>IPD</option>
                  <option>Emergency</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 1.3fr 1fr', alignItems: 'center', gap: 8, marginTop: 5 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 10.5, cursor: 'pointer', paddingLeft: 4 }}>
                <input type="checkbox" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} style={{ width: 13, height: 13, accentColor: 'var(--blue-primary)' }} />
                <span>Mark as Final</span>
              </label>
              <button className="btn-outline-blue" style={{ height: 28, fontSize: 10.5 }} onClick={() => showToast('Draft note saved')}>
                Save as Draft
              </button>
              <button className="btn-outline-blue" style={{ height: 28, fontSize: 10.5, gap: 7 }} onClick={() => showToast('Discharge summary generated as PDF')}>
                <ClipboardPlus size={13} />
                Generate Discharge Summary
              </button>
              <button
                className="btn-primary"
                style={{ height: 28, fontSize: 11 }}
                onClick={() => showToast(isFinal ? 'Final note permanently stored in EMR' : 'Encounter and note stored in EMR')}
              >
                <Plus size={15} />
                Save to EMR
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI Clinical Assistant */}
        <div style={{ ...card, padding: '7px 10px 9px', gap: 7, background: '#fbfcfe' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 26 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>
              <AiSparkle size={19} />
              AI Clinical Assistant (GPT-6 Astro)
            </span>
            <button aria-label="Assistant options" onClick={() => showToast('Assistant settings', 'info')} style={{ display: 'flex', color: 'var(--text-primary)' }}>
              <EllipsisVertical size={15} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
            {(['Suggestions', 'Report Analysis', 'Guidelines', 'Patient Insights'] as const).map((tab) => (
              <button
                key={tab}
                className={`page-tab-btn ${aiTab === tab ? 'active' : ''}`}
                style={{ height: 26, padding: '0 6px', fontSize: 10.5, flex: '1 1 auto', justifyContent: 'center' }}
                onClick={() => setAiTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {aiTab === 'Suggestions' && (
            <>
              <div style={aiBlock}>
                <div style={aiBlockHead}>
                  <AiSparkle size={13} />
                  AI Suggested Clinical Note
                </div>
                <div style={{ padding: '5px 10px 8px 11px' }}>
                  {[
                    ['S:', 'Fever for 3 days, mild cough, body ache, reduced appetite.'],
                    ['O:', 'Vitals stable. SpO₂ 98%. RS – normal. CVS – normal.'],
                    ['A:', 'Acute respiratory infection (likely viral). Known HTN and T2DM.'],
                    ['P:', 'Symptomatic treatment, continue current medications, review after 5 days.']
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '21px 1fr', fontSize: 10.5, lineHeight: '15px', padding: '2px 0', color: 'var(--text-primary)' }}>
                      <strong style={{ fontWeight: 600 }}>{k}</strong>
                      <span>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                    <button className="btn-primary" style={{ height: 30, width: 128, fontSize: 11.5 }} onClick={() => showToast('AI Clinical note inserted into SOAP workspace')}>
                      Insert to Note
                    </button>
                    <button className="btn-outline-blue" style={{ height: 30, width: 148, fontSize: 11.5 }} onClick={() => showToast('Note regenerated with alternate phrasing')}>
                      <RefreshCw size={13} />
                      Regenerate
                    </button>
                    <button aria-label="More AI note actions" onClick={() => showToast('Copy, share or discard the AI draft', 'info')} style={{ marginLeft: 'auto', display: 'flex', color: 'var(--text-primary)' }}>
                      <EllipsisVertical size={15} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={aiBlock}>
                <div style={aiBlockHead}>
                  <AiSparkle size={13} />
                  Clinical Considerations
                </div>
                <div style={{ padding: '4px 10px 6px 11px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { title: 'Acute upper respiratory infection', bullets: ['Consider viral etiology.', 'Review if symptoms persist or worsen.'] },
                    { title: 'Evaluate need for further investigation', bullets: ['Consider CBC, CRP, Chest X-Ray if symptoms persist > 5 days.'] },
                    { title: 'Review chronic conditions', bullets: ['Ensure BP and sugar control.', 'Check adherence to current medications.'] }
                  ].map((c, i) => (
                    <div key={c.title}>
                      <div style={{ fontSize: 10.8, fontWeight: 600, lineHeight: '16px' }}>
                        <span style={{ display: 'inline-block', width: 20 }}>{i + 1}.</span>
                        {c.title}
                      </div>
                      <ul style={{ listStyle: 'disc', paddingLeft: 33, fontSize: 10.3, lineHeight: '15.5px', color: 'var(--text-primary)' }}>
                        {c.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div style={aiBlock}>
                <div style={aiBlockHead}>
                  <AiSparkle size={13} />
                  Relevant Guidelines (Hospital SOP)
                </div>
                <div style={{ padding: '4px 10px 6px 11px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {['Acute Respiratory Infection – SOP GM 4.2', 'Management of Hypertension – SOP GM 3.1'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setActiveScreen('clinical-guidelines')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, height: 22, textAlign: 'left', color: 'var(--text-primary)' }}
                    >
                      <CircleCheck size={14} fill="var(--green-emerald)" color="#ffffff" strokeWidth={2.4} />
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {aiTab === 'Report Analysis' && (
            <div style={aiBlock}>
              <div style={aiBlockHead}>
                <AiSparkle size={13} />
                Report Analysis
              </div>
              <div style={{ padding: '6px 11px 8px', fontSize: 10.8, lineHeight: '16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p>
                  <strong style={{ color: 'var(--red-dark)' }}>HbA1c 7.8% (High)</strong> – up from 7.2% six months ago; glycaemic control sub-optimal.
                </p>
                <p>
                  <strong style={{ color: 'var(--red-dark)' }}>Hemoglobin 10.4 g/dL (Low)</strong> – mild anaemia, consider iron studies.
                </p>
                <p>
                  <strong style={{ color: 'var(--orange-dark)' }}>WBC 10,900 /µL (High)</strong> – mild leukocytosis consistent with acute infection.
                </p>
              </div>
            </div>
          )}

          {aiTab === 'Guidelines' && (
            <div style={aiBlock}>
              <div style={aiBlockHead}>
                <AiSparkle size={13} />
                Clinical Guidelines
              </div>
              <div style={{ padding: '6px 11px 8px', fontSize: 10.8, lineHeight: '16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p>
                  <strong>ADA 2026:</strong> Target HbA1c &lt; 7.0% for most non-pregnant adults.
                </p>
                <p>
                  <strong>ACC/AHA:</strong> Target BP &lt; 130/80 mmHg in patients with diabetes.
                </p>
                <button style={{ ...softBlueBtn, alignSelf: 'flex-start' }} onClick={() => setActiveScreen('clinical-guidelines')}>
                  Open Clinical Guidelines
                </button>
              </div>
            </div>
          )}

          {aiTab === 'Patient Insights' && (
            <div style={aiBlock}>
              <div style={aiBlockHead}>
                <AiSparkle size={13} />
                Patient Insights
              </div>
              <ul style={{ listStyle: 'disc', padding: '6px 11px 8px 26px', fontSize: 10.8, lineHeight: '17px' }}>
                {(activePatient?.aiSummary?.keyPoints ?? []).map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </div>
          )}

          {aiAnswer && (
            <div style={{ padding: '6px 9px', borderRadius: 6, background: 'var(--purple-light)', border: '1px solid var(--purple-border)', fontSize: 10.8, lineHeight: '15px', color: 'var(--purple-dark)' }}>
              {aiAnswer}
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: 38, border: '1px solid var(--border-color)', borderRadius: 7, background: '#ffffff', overflow: 'hidden' }}>
              <button aria-label="Attach file" onClick={() => showToast('Attach a report for AI analysis', 'info')} style={{ width: 32, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <Paperclip size={14} />
              </button>
              <input
                type="text"
                placeholder="Ask anything about this patient..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                style={{ flex: 1, minWidth: 0, height: '100%', border: 'none', outline: 'none', padding: '0 10px', fontSize: 10.5 }}
              />
            </div>
            <button aria-label="Send" onClick={handleAsk} style={{ width: 40, height: 38, borderRadius: 7, background: 'var(--blue-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom context row: Vitals / Current Medications / Recent Lab Reports / Recent Imaging */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 384fr) minmax(0, 329fr) minmax(0, 340fr) minmax(0, 218fr)', gap: 10 }}>
        <div style={{ ...card, padding: '6px 10px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={miniTitle}>
              <Clock3 size={13} color="var(--blue-text)" strokeWidth={2.2} />
              <span style={{ fontSize: 12.5 }}>Vitals</span>
              <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-secondary)' }}>({vitals?.recordedAt.replace(',', '') ?? '26 Sep 2026 09:15 AM'})</span>
            </span>
            <button style={{ ...viewAll, display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => setActiveScreen('vitals')}>
              <Plus size={12} />
              Add Vitals
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr 1fr 0.85fr 0.95fr 1.4fr', gap: 5 }}>
            {vitalCells.map((c) => (
              <div key={c.label} style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '5px 4px 5px 8px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 10.5, lineHeight: '15px' }}>{c.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, lineHeight: '19px', color: c.alert ? 'var(--red-dark)' : 'var(--text-primary)' }}>{c.value}</span>
                <span style={{ fontSize: 9.5, lineHeight: '15px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.unit}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card, padding: '6px 10px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={miniTitle}>
              <Cross size={13} color="var(--blue-text)" strokeWidth={2.2} />
              Current Medications
            </span>
            <button style={viewAll} onClick={() => setActiveScreen('medications')}>
              View All
            </button>
          </div>
          {[
            ['Amlodipine 5 mg (OD)', '1-0-0'],
            ['Metformin 500 mg (BD)', '1-0-1'],
            ['Atorvastatin 10 mg (OD)', '0-1-0']
          ].map(([name, dose], i) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 25, padding: '0 8px 0 7px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
              <CircleCheck size={14} fill="var(--green-emerald)" color="#ffffff" strokeWidth={2.4} />
              <span style={{ flex: 1, fontSize: 10.8 }}>{name}</span>
              <span style={{ fontSize: 10.8, color: 'var(--text-secondary)' }}>{dose}</span>
            </div>
          ))}
        </div>

        <div style={{ ...card, padding: '6px 10px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={miniTitle}>
              <FlaskConical size={13} color="var(--blue-text)" strokeWidth={2.2} />
              Recent Lab Reports
            </span>
            <button style={viewAll} onClick={() => setActiveScreen('lab-reports')}>
              View All
            </button>
          </div>
          {[
            { name: 'HbA1c', value: '7.8 %', color: 'var(--red-dark)', icon: 'var(--blue-text)' },
            { name: 'Hemoglobin', value: '10.4 g/dL', color: 'var(--red-dark)', icon: 'var(--red-rose)' },
            { name: 'WBC', value: '10,900 /µL', color: 'var(--orange-amber)', icon: 'var(--orange-amber)' }
          ].map((lab, i) => (
            <div key={lab.name} style={{ display: 'grid', gridTemplateColumns: '16px 1fr auto 80px', alignItems: 'center', gap: 9, height: 25, padding: '0 4px 0 6px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
              <CircleCheck size={13} color={lab.icon} strokeWidth={2.2} />
              <span style={{ fontSize: 11 }}>{lab.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: lab.color }}>{lab.value}</span>
              <span style={{ fontSize: 9.8, color: 'var(--text-secondary)', textAlign: 'right' }}>12 Sep 2026</span>
            </div>
          ))}
        </div>

        <div style={{ ...card, padding: '7px 9px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ ...miniTitle, fontSize: 11 }}>
              <CircleCheckBig size={12} color="var(--blue-text)" strokeWidth={2.2} />
              Recent Imaging
            </span>
            <button style={{ ...viewAll, fontSize: 10.5 }} onClick={() => setActiveScreen('imaging')}>
              View All
            </button>
          </div>
          {[
            { title: 'Chest X-Ray', date: '12 Sep 2026', result: 'Normal', dot: 'var(--green-emerald)', thumb: <StudyThumb src={CHEST_XRAY_THUMB} alt="Chest X-Ray" width={46} height={42} /> },
            { title: 'USG Abdomen', date: '21 Mar 2026', result: 'Fatty liver (mild)', dot: 'var(--orange-amber)', thumb: <StudyThumb src={USG_ABDOMEN_THUMB} alt="USG Abdomen" width={46} height={42} /> }
          ].map((img) => (
            <button key={img.title} onClick={() => setActiveScreen('imaging')} style={{ display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left', padding: '1px 0' }}>
              {img.thumb}
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: '14px', minWidth: 0 }}>
                <span style={{ fontSize: 10.8, fontWeight: 600 }}>{img.title}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9.5, color: 'var(--text-secondary)' }}>
                  <Clock3 size={9} />
                  {img.date}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: img.dot }} />
                  {img.result}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
