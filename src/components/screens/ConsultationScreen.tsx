import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/appContextCore';
import { PatientBanner } from '../layout/PatientBanner';
import { CLINICAL_TABS } from '../layout/patientTabs';
import { ScreenHeader } from '../common/ScreenHeader';
import { AiSparkle } from '../common/icons';
import { AutoTextarea } from '../common/AutoTextarea';
import { StudyThumb } from '../common/StudyThumb';
import { CHEST_XRAY_THUMB, USG_ABDOMEN_THUMB } from '../../mock/imagingThumbsData';
import { Patient, SoapNote } from '../../types';
import { consultationService, patientService } from '../../services';
import {
  mockAIConsiderations,
  mockConsultationRx,
  mockPatientEducation,
  mockRxTemplates,
  mockSoapTemplates,
  mockSuggestedInvestigations,
  mockSuggestedTreatmentPlan,
  mockVisitsTimeline,
  type ConsultationRxRow
} from '../../mock/consultationsData';
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Bold,
  BotMessageSquare,
  Check,
  CircleCheck,
  CircleGauge,
  Clock3,
  Cross,
  Ellipsis,
  EllipsisVertical,
  FileText,
  History,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Mic,
  Paperclip,
  Pill,
  Plus,
  Tablets,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  SquareActivity,
  Trash2,
  Underline,
  Waypoints,
  X
} from 'lucide-react';

type SoapKey = 'subjective' | 'objective' | 'assessment' | 'plan';
type AiTab = 'Clinical Suggestions' | 'Report Analysis' | 'Guidelines' | 'Patient Insights';
type WorkspaceTab = 'soap' | 'previous' | 'templates';

const AI_TABS: AiTab[] = ['Clinical Suggestions', 'Report Analysis', 'Guidelines', 'Patient Insights'];
const FREQUENCIES = ['OD', 'BD', 'TID', 'QID', 'HS', 'SOS'];
const INSTRUCTIONS = ['After food', 'Before food', 'Morning', 'At night', 'SOS'];

/* ---------- shared inline styles (dense Consultation design) ---------- */
const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0
};
const band: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  height: 33,
  padding: '0 12px 0 13px',
  background: 'linear-gradient(180deg, #f4f8fe 0%, #eef4fc 100%)',
  borderBottom: '1px solid var(--border-subtle)',
  flexShrink: 0
};
const bandTitle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap'
};
const innerCard: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '8px 11px 9px'
};
const subTitle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' };
const muted: React.CSSProperties = { fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 };
const link: React.CSSProperties = { fontSize: 11.5, color: 'var(--blue-text)' };
const softBlueBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
  height: 22,
  padding: '0 8px',
  borderRadius: 5,
  border: '1px solid var(--blue-border)',
  background: 'var(--blue-light)',
  color: 'var(--blue-text)',
  fontSize: 10,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  flexShrink: 0
};
const smallBtn: React.CSSProperties = { height: 27, padding: '0 16px', fontSize: 11, gap: 7 };
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
  height: 25,
  padding: '0 10px',
  background: 'linear-gradient(90deg, #f3eefe 0%, #f8f5ff 100%)',
  color: 'var(--purple-dark)',
  fontSize: 11,
  fontWeight: 600
};
const aiBody: React.CSSProperties = { padding: '6px 8px 8px 10px' };
const bulletList: React.CSSProperties = {
  listStyle: 'disc',
  paddingLeft: 14,
  fontSize: 11,
  lineHeight: '16px',
  color: 'var(--text-primary)'
};

/* ---------- small helpers ---------- */

/** Red "record" glyph used on the REC chip. */
const RecGlyph: React.FC = () => (
  <span
    aria-hidden="true"
    style={{
      width: 16,
      height: 13,
      borderRadius: 4,
      background: 'var(--red-rose)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffffff' }} />
  </span>
);

const LAB_RESULTS = [
  { name: 'HbA1c', value: '7.8 %', flag: 'High', valueColor: 'var(--red-dark)', icon: 'blue' },
  { name: 'Hemoglobin', value: '10.4 g/dL', flag: 'Low', valueColor: 'var(--red-dark)', icon: 'orange' },
  { name: 'WBC', value: '10,900 /µL', flag: 'High', valueColor: 'var(--orange-amber)', icon: 'orange' },
  { name: 'Platelets', value: '2.1 lakhs/µL', flag: 'Normal', valueColor: 'var(--text-primary)', icon: 'green' },
  { name: 'Creatinine', value: '1.0 mg/dL', flag: 'Normal', valueColor: 'var(--text-primary)', icon: 'green' }
] as const;

const CURRENT_MEDS = ['Amlodipine 5 mg (OD)', 'Metformin 500 mg (BD)', 'Atorvastatin 10 mg (OD)'];

const SOAP_META: Record<SoapKey, { letter: string; title: string; hint: string; tileBg: string; tileFg: string; aiLabel: string; aiToast: string }> = {
  subjective: {
    letter: 'S',
    title: 'Subjective',
    hint: '(Chief Complaint, History of Present Illness)',
    tileBg: 'var(--cyan-light)',
    tileFg: 'var(--blue-text)',
    aiLabel: 'AI Generate',
    aiToast: 'AI generated complaint summary from patient voice'
  },
  objective: {
    letter: 'O',
    title: 'Objective',
    hint: '(Examination Findings)',
    tileBg: 'var(--green-light)',
    tileFg: 'var(--green-dark)',
    aiLabel: 'Use AI Suggestions',
    aiToast: 'Objective data populated from recorded vitals'
  },
  assessment: {
    letter: 'A',
    title: 'Assessment',
    hint: '(Clinical Impression)',
    tileBg: 'var(--orange-light)',
    tileFg: '#c2410c',
    aiLabel: 'Use AI Suggestions',
    aiToast: 'Assessment updated based on viral presentation'
  },
  plan: {
    letter: 'P',
    title: 'Plan',
    hint: '(Investigations, Treatment, Advice, Follow-up)',
    tileBg: 'var(--green-light)',
    tileFg: 'var(--green-dark)',
    aiLabel: 'Use AI Suggestions',
    aiToast: 'Plan filled from ESC Clinical Guidelines'
  }
};

export const ConsultationScreen: React.FC = () => {
  const { activePatient, setActivePatient, showToast, setActiveScreen } = useApp();
  const [soapNote, setSoapNote] = useState<SoapNote | null>(null);
  const [prescriptions, setPrescriptions] = useState<ConsultationRxRow[]>(mockConsultationRx);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [consultType, setConsultType] = useState('Follow-up');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('soap');
  const [subjFormat, setSubjFormat] = useState({ bold: false, italic: false, underline: false });
  const [aiTab, setAiTab] = useState<AiTab>('Clinical Suggestions');
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatResponse, setAiChatResponse] = useState<string | null>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  // Prescription editing
  const [rxSearch, setRxSearch] = useState('');
  const [rxTemplate, setRxTemplate] = useState('Common');
  const [rxMenuId, setRxMenuId] = useState<string | null>(null);
  const [showAddMedRow, setShowAddMedRow] = useState(false);
  const [newMed, setNewMed] = useState<Omit<ConsultationRxRow, 'id'>>({
    medicine: '',
    dose: '650 mg',
    frequency: 'TID',
    duration: '3 Days',
    instruction: 'After food'
  });

  useEffect(() => {
    if (activePatient) {
      consultationService.getSoapNote(activePatient.uhid).then(setSoapNote);
    }
  }, [activePatient]);

  useEffect(() => {
    patientService.getPatients().then(setPatients);
  }, []);

  if (!soapNote) return <div className="page-scroll-body">Loading consultation session...</div>;

  const vitals = activePatient?.vitals;
  const updateSoap = (key: SoapKey, value: string) => setSoapNote((prev) => (prev ? { ...prev, [key]: value } : prev));

  const switchPatient = (direction: 1 | -1) => {
    if (!patients.length || !activePatient) return;
    const idx = patients.findIndex((p) => p.uhid === activePatient.uhid);
    const next = patients[(idx + direction + patients.length) % patients.length];
    setActivePatient(next);
    showToast(`Now consulting ${next.name} (${next.uhid})`, 'info');
  };

  const handleSaveToEMR = async () => {
    await consultationService.saveSoapNote(soapNote);
    showToast('Consultation SOAP Note saved to EMR successfully!');
  };

  const handleApplyAISuggestion = (suggestionText: string) => {
    setSoapNote((prev) => (prev ? { ...prev, plan: `${prev.plan}\n• [AI] ${suggestionText}` } : prev));
    showToast('AI suggestion applied to Plan!');
  };

  const applyConsideration = (id: string, text: string) => {
    if (appliedIds.includes(id)) return;
    setAppliedIds((prev) => [...prev, id]);
    handleApplyAISuggestion(text);
  };

  const handleAIChat = (customQuery?: string) => {
    const q = customQuery || aiChatInput;
    if (!q) return;
    setAiChatInput(q);
    setAiChatResponse(
      `GPT-6 Astro: Patient ${activePatient?.name ?? 'Arun Kumar'} has chronic Grade 1 HTN (BP 140/90) and Type 2 Diabetes with recent HbA1c 7.8%. Given upper respiratory symptoms for 3 days without wheeze, current regimen of Paracetamol 650mg TID + hydration is safe. Amlodipine & Metformin should continue uninterrupted.`
    );
  };

  const applySoapTemplate = (tpl: (typeof mockSoapTemplates)[number]) => {
    setSoapNote((prev) =>
      prev ? { ...prev, subjective: tpl.subjective, objective: tpl.objective, assessment: tpl.assessment, plan: tpl.plan } : prev
    );
    setWorkspaceTab('soap');
    showToast(`${tpl.title} template applied to SOAP note`);
  };

  /** Prefix each line of the Subjective field with a bullet / number. */
  const toggleSubjectiveList = (kind: 'bullet' | 'number' | 'check') => {
    const lines = soapNote.subjective.split('\n').map((l) => l.replace(/^(•|\d+\.|☐)\s*/, ''));
    const marker = (i: number) => (kind === 'bullet' ? '• ' : kind === 'number' ? `${i + 1}. ` : '☐ ');
    updateSoap('subjective', lines.map((l, i) => `${marker(i)}${l}`).join('\n'));
  };

  // ----- Prescription handlers -----
  const handleAddMedicine = () => {
    if (!newMed.medicine.trim()) {
      showToast('Enter a medicine name first', 'warning');
      return;
    }
    const item: ConsultationRxRow = { ...newMed, medicine: newMed.medicine.trim(), id: `crx-${Date.now()}` };
    setPrescriptions((prev) => [...prev, item]);
    setNewMed((m) => ({ ...m, medicine: '' }));
    setShowAddMedRow(false);
    showToast(`Added ${item.medicine} to prescription`);
  };

  const handleDeleteMedicine = (id: string) => {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
    showToast('Medicine removed from prescription');
  };

  const handleEditMedicine = (row: ConsultationRxRow) => {
    setPrescriptions((prev) => prev.filter((p) => p.id !== row.id));
    setNewMed({ medicine: row.medicine, dose: row.dose, frequency: row.frequency, duration: row.duration, instruction: row.instruction });
    setShowAddMedRow(true);
    setRxMenuId(null);
  };

  const handleDuplicateMedicine = (row: ConsultationRxRow) => {
    setPrescriptions((prev) => [...prev, { ...row, id: `crx-${Date.now()}` }]);
    setRxMenuId(null);
    showToast(`${row.medicine} duplicated`);
  };

  const handleAddFromTemplate = () => {
    const existing = new Set(prescriptions.map((p) => p.medicine.toLowerCase()));
    const toAdd = (mockRxTemplates[rxTemplate] ?? []).filter((t) => !existing.has(t.medicine.toLowerCase()));
    if (!toAdd.length) {
      showToast(`All ${rxTemplate} template medicines are already added`, 'info');
      return;
    }
    setPrescriptions((prev) => [...prev, ...toAdd.map((t, i) => ({ ...t, id: `crx-${Date.now()}-${i}` }))]);
    showToast(`Added ${toAdd.length} medicine(s) from ${rxTemplate} template`);
  };

  const handleRxSearch = () => {
    if (!rxSearch.trim()) return;
    setNewMed((m) => ({ ...m, medicine: rxSearch.trim() }));
    setShowAddMedRow(true);
    setRxSearch('');
  };

  const renderSoapSection = (key: SoapKey) => {
    const meta = SOAP_META[key];
    const isSubjective = key === 'subjective';
    const toolbar = [
      { icon: Bold, label: 'Bold', onClick: () => setSubjFormat((f) => ({ ...f, bold: !f.bold })), active: subjFormat.bold },
      { icon: Italic, label: 'Italic', onClick: () => setSubjFormat((f) => ({ ...f, italic: !f.italic })), active: subjFormat.italic },
      { icon: Underline, label: 'Underline', onClick: () => setSubjFormat((f) => ({ ...f, underline: !f.underline })), active: subjFormat.underline, sep: true },
      { icon: List, label: 'Bulleted list', onClick: () => toggleSubjectiveList('bullet') },
      { icon: ListOrdered, label: 'Numbered list', onClick: () => toggleSubjectiveList('number') },
      { icon: ListTodo, label: 'Checklist', onClick: () => toggleSubjectiveList('check'), sep: true },
      { icon: AtSign, label: 'Mention', onClick: () => showToast('Mention a colleague: type @name', 'info') },
      { icon: Link2, label: 'Insert link', onClick: () => showToast('Link to report or document inserted', 'info') },
      { icon: Ellipsis, label: 'More', onClick: () => showToast('More formatting options coming soon', 'info') }
    ];

    return (
      <div key={key} style={{ display: 'flex', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 38,
            borderRadius: 7,
            background: meta.tileBg,
            color: meta.tileFg,
            fontSize: 20,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 1
          }}
        >
          {meta.letter}
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            background: '#fbfcfe',
            padding: '3px 8px 5px 9px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)' }}>{meta.title}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.hint}</span>
            </div>
            <button style={softBlueBtn} onClick={() => showToast(meta.aiToast)}>
              <Sparkles size={10} />
              <span>{meta.aiLabel}</span>
            </button>
          </div>
          <div
            style={{
              marginTop: 2,
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              background: '#ffffff',
              padding: isSubjective ? '1px 9px 3px' : '3px 9px'
            }}
          >
            {isSubjective && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 18, marginBottom: 1, marginLeft: -4 }}>
                {toolbar.map(({ icon: Icon, label, onClick, active, sep }) => (
                  <React.Fragment key={label}>
                    <button
                      title={label}
                      aria-label={label}
                      onClick={onClick}
                      style={{
                        width: 20,
                        height: 18,
                        borderRadius: 3,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: active ? 'var(--blue-text)' : 'var(--text-primary)',
                        background: active ? 'var(--blue-light)' : 'transparent'
                      }}
                    >
                      <Icon size={12} strokeWidth={2.2} />
                    </button>
                    {sep && <span style={{ width: 1, height: 12, background: 'var(--border-color)', margin: '0 4px' }} />}
                  </React.Fragment>
                ))}
              </div>
            )}
            <AutoTextarea
              label={meta.title}
              value={soapNote[key]}
              onChange={(v) => updateSoap(key, v)}
              style={
                isSubjective
                  ? {
                      fontWeight: subjFormat.bold ? 600 : 400,
                      fontStyle: subjFormat.italic ? 'italic' : 'normal',
                      textDecoration: subjFormat.underline ? 'underline' : 'none'
                    }
                  : key === 'plan'
                    ? { lineHeight: '13.5px' }
                    : undefined
              }
            />
          </div>
        </div>
      </div>
    );
  };

  const labIcon = (kind: 'blue' | 'orange' | 'green') =>
    kind === 'green' ? (
      <CircleCheck size={15} fill="var(--green-emerald)" color="#ffffff" strokeWidth={2.4} />
    ) : (
      <CircleCheck size={14} color={kind === 'blue' ? 'var(--blue-text)' : 'var(--orange-amber)'} strokeWidth={2} />
    );

  const flagStyle = (flag: string): React.CSSProperties =>
    flag === 'Normal'
      ? { background: 'var(--green-light)', color: 'var(--green-dark)' }
      : { background: 'var(--red-light)', color: 'var(--red-dark)' };

  const vitalCell = (label: React.ReactNode, value: React.ReactNode, unit: string, opts?: { alert?: boolean }) => (
    <div
      style={{
        border: `1px solid ${opts?.alert ? '#fbe3e7' : 'var(--border-subtle)'}`,
        background: opts?.alert ? '#fdf0f2' : '#ffffff',
        borderRadius: 6,
        padding: '4px 9px',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: '14px' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, lineHeight: '18px', color: opts?.alert ? 'var(--red-dark)' : 'var(--text-primary)' }}>
        {value}
      </span>
      <span style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: '13px', whiteSpace: 'nowrap' }}>{unit}</span>
    </div>
  );

  const rxCell: React.CSSProperties = {
    padding: '0 10px',
    height: 22,
    fontSize: 11,
    color: 'var(--text-primary)',
    borderTop: '1px solid var(--border-color)',
    borderBottom: '1px solid var(--border-color)',
    background: '#ffffff',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    lineHeight: '20px'
  };
  const rxHead: React.CSSProperties = { padding: '0 10px 3px', fontSize: 10.5, fontWeight: 600, textAlign: 'left', color: 'var(--text-primary)', whiteSpace: 'nowrap' };
  const rxInput: React.CSSProperties = { height: 20, padding: '0 5px', fontSize: 10.5, border: '1px solid var(--border-strong)', borderRadius: 4, background: '#ffffff', width: '100%' };

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="Consultation"
        subtitle="Patient consultation, clinical notes, AI suggestions and prescription"
        actions={
          <>
            <button className="btn-outline-blue" onClick={() => switchPatient(-1)}>
              <ArrowLeft size={16} />
              <span>Previous Patient</span>
            </button>
            <button className="btn-outline-blue" onClick={() => switchPatient(1)}>
              <span>Next Patient</span>
              <ArrowRight size={16} />
            </button>
          </>
        }
      />

      <PatientBanner
        metrics={[
          { label: 'Last Visit', value: activePatient?.lastVisit ?? '—' },
          { label: "Today's Visit", value: soapNote.visitDate, sub: soapNote.visitTime },
          { label: 'Department', value: activePatient?.department ?? soapNote.department }
        ]}
        action={null}
        extra={
          <div className="metric-column" style={{ minWidth: 190 }}>
            <span className="metric-label">Consultation Type</span>
            <select
              className="form-select"
              aria-label="Consultation Type"
              value={consultType}
              onChange={(e) => {
                setConsultType(e.target.value);
                showToast(`Consultation type set to ${e.target.value}`, 'info');
              }}
              style={{ height: 32, marginTop: 6, fontSize: 12.5, padding: '0 10px' }}
            >
              <option>Follow-up</option>
              <option>New Consultation</option>
              <option>Review</option>
              <option>Teleconsultation</option>
            </select>
          </div>
        }
        tabs={CLINICAL_TABS}
        activeTab="consultation"
      />

      {/* 3-column consultation layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 300fr) minmax(0, 540fr) minmax(0, 440fr)',
          gap: 10,
          alignItems: 'stretch'
        }}
      >
        {/* ===== Left: Patient Quick Info ===== */}
        <div style={{ ...card, background: '#fbfcfe' }}>
          <div style={band}>
            <span style={bandTitle}>
              <Cross size={15} color="var(--blue-text)" strokeWidth={2.2} />
              Patient Quick Info
            </span>
            <button style={link} onClick={() => setActiveScreen('patients')}>
              View Full Profile
            </button>
          </div>

          <div style={{ padding: 5, display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
            {/* Vitals */}
            <div style={innerCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ ...subTitle, fontSize: 12.5 }}>Vitals</span>
                  <span style={muted}>(Today, {vitals?.recordedAt.split(', ')[1] ?? '09:15 AM'})</span>
                </span>
                <button style={softBlueBtn} onClick={() => setActiveScreen('vitals')}>
                  <Plus size={11} />
                  <span>Add Vitals</span>
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 0.85fr', gap: 5 }}>
                {vitalCell('BP', `${vitals?.bpSystolic ?? 140}/${vitals?.bpDiastolic ?? 90}`, 'mmHg', { alert: true })}
                {vitalCell('HR', vitals?.heartRate ?? 86, 'bpm')}
                {vitalCell('Temp', vitals?.temperature ?? 98.4, '°F')}
                {vitalCell(
                  <>
                    SpO<sub style={{ fontSize: 8 }}>2</sub>
                  </>,
                  vitals?.spo2 ?? 98,
                  '%'
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1.45fr', gap: 5, marginTop: 5 }}>
                {vitalCell('Weight', vitals?.weightKg ?? 78, 'kg')}
                {vitalCell('Height', vitals?.heightCm ?? 172, 'cm')}
                {vitalCell('BMI', vitals?.bmi ?? 26.4, `(${vitals?.bmiStatus ?? 'Overweight'})`)}
              </div>
            </div>

            {/* Current Medications */}
            <div style={innerCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ ...subTitle, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Cross size={14} color="var(--blue-text)" strokeWidth={2.2} />
                  Current Medications
                </span>
                <button style={link} onClick={() => setActiveScreen('medications')}>
                  View All
                </button>
              </div>
              {CURRENT_MEDS.map((med, i) => (
                <div
                  key={med}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    height: 23,
                    padding: '0 2px 0 4px',
                    borderTop: i ? '1px solid var(--border-subtle)' : 'none'
                  }}
                >
                  <CircleCheck size={15} fill="var(--green-emerald)" color="#ffffff" strokeWidth={2.4} />
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)' }}>{med}</span>
                  <button aria-label={`${med} options`} onClick={() => setActiveScreen('medications')} style={{ color: 'var(--text-primary)', display: 'flex' }}>
                    <EllipsisVertical size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Recent Lab Results */}
            <div style={innerCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={subTitle}>Recent Lab Results</span>
                  <span style={muted}>(12 Sep 2026)</span>
                </span>
                <button style={link} onClick={() => setActiveScreen('lab-reports')}>
                  View All
                </button>
              </div>
              {LAB_RESULTS.map((lab, i) => (
                <div
                  key={lab.name}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '18px 96px 1fr auto',
                    alignItems: 'center',
                    gap: 8,
                    height: 23,
                    padding: '0 0 0 3px',
                    borderTop: i ? '1px solid var(--border-subtle)' : 'none',
                    fontSize: 11.5
                  }}
                >
                  {labIcon(lab.icon)}
                  <span style={{ color: 'var(--text-primary)' }}>{lab.name}</span>
                  <span style={{ color: lab.valueColor, whiteSpace: 'nowrap' }}>{lab.value}</span>
                  <span style={{ ...flagStyle(lab.flag), fontSize: 10, height: 18, padding: '0 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center' }}>
                    ({lab.flag})
                  </span>
                </div>
              ))}
              <button
                onClick={() => setActiveScreen('lab-reports')}
                style={{ ...softBlueBtn, width: '100%', height: 26, fontSize: 10.5, marginTop: 5, background: '#edf4fe' }}
              >
                Show More Reports
              </button>
            </div>

            {/* Recent Imaging */}
            <div style={{ ...innerCard, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ ...subTitle, fontSize: 12.5 }}>Recent Imaging</span>
                <button style={link} onClick={() => setActiveScreen('imaging')}>
                  View All
                </button>
              </div>
              {[
                { title: 'Chest X-Ray', date: '12 Sep 2026', result: 'Normal', dot: 'var(--green-emerald)', color: 'var(--green-dark)', thumb: <StudyThumb src={CHEST_XRAY_THUMB} alt="Chest X-Ray" /> },
                {
                  title: 'USG Abdomen',
                  date: '21 Mar 2026',
                  result: 'Fatty liver (mild)',
                  dot: 'var(--orange-amber)',
                  color: 'var(--text-secondary)',
                  thumb: <StudyThumb src={USG_ABDOMEN_THUMB} alt="USG Abdomen" />
                }
              ].map((img, i) => (
                <button
                  key={img.title}
                  onClick={() => setActiveScreen('imaging')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    width: '100%',
                    textAlign: 'left',
                    padding: '4px 4px 4px 4px',
                    borderTop: i ? '1px solid var(--border-subtle)' : 'none',
                    marginTop: i ? 4 : 0
                  }}
                >
                  {img.thumb}
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{img.title}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--text-secondary)' }}>
                      <Clock3 size={10} />
                      {img.date}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: img.color }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: img.dot }} />
                      {img.result}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Center: Consultation Workspace + Prescription ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <div style={{ ...card, background: '#fbfcfe' }}>
            <div style={band}>
              <span style={{ ...bandTitle, fontSize: 13 }}>
                <SquareActivity size={15} strokeWidth={2} />
                Consultation Workspace
              </span>
            </div>

            <div style={{ padding: '3px 12px 6px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Workspace tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 1 }}>
                {(
                  [
                    { id: 'soap', label: 'SOAP Note' },
                    { id: 'previous', label: 'Previous Notes' },
                    { id: 'templates', label: 'Templates' }
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    className={`page-tab-btn ${workspaceTab === t.id ? 'active' : ''}`}
                    style={{ height: 25, padding: '0 17px', fontSize: 11, gap: 6 }}
                    onClick={() => setWorkspaceTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
                <button
                  className="page-tab-btn"
                  style={{ height: 25, padding: '0 17px', fontSize: 11, gap: 6 }}
                  onClick={() => setActiveScreen('voice-to-notes')}
                >
                  <Mic size={12} />
                  Voice to Note
                </button>
                <button
                  onClick={() => {
                    showToast('Recording started – opening Voice to Notes', 'info');
                    setActiveScreen('voice-to-notes');
                  }}
                  style={{
                    marginLeft: 11,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 24,
                    padding: '0 8px 0 6px',
                    borderRadius: 5,
                    border: '1px solid var(--red-border)',
                    background: '#ffffff',
                    color: 'var(--red-dark)',
                    fontSize: 10.5,
                    fontWeight: 500
                  }}
                >
                  <RecGlyph />
                  REC
                </button>
              </div>

              {workspaceTab === 'soap' && (
                <>
                  {(['subjective', 'objective', 'assessment', 'plan'] as const).map(renderSoapSection)}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 1 }}>
                    <button className="btn-secondary" style={{ ...smallBtn, padding: '0 20px' }} onClick={() => showToast('Draft saved')}>
                      <Save size={13} />
                      <span>Save as Draft</span>
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ ...smallBtn, padding: '0 18px' }}
                      onClick={() => {
                        setSoapNote({ ...soapNote, subjective: '', objective: '', assessment: '', plan: '' });
                        showToast('SOAP note cleared', 'info');
                      }}
                    >
                      <RotateCcw size={12} />
                      <span>Clear</span>
                    </button>
                    <button className="btn-primary" style={{ ...smallBtn, marginLeft: 'auto', width: 178 }} onClick={handleSaveToEMR}>
                      <Plus size={13} />
                      <span>Save to EMR</span>
                    </button>
                  </div>
                </>
              )}

              {workspaceTab === 'previous' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {mockVisitsTimeline.slice(1).map((v) => (
                    <div key={v.id} style={{ ...innerCard, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FileText size={15} color="var(--blue-text)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>
                          {v.date} · {v.type}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {v.time} • {v.doctor} • {v.reason}
                        </div>
                      </div>
                      <button className="btn-outline-blue btn-sm" style={{ height: 24, fontSize: 11 }} onClick={() => setActiveScreen('emr')}>
                        Open in EMR
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {workspaceTab === 'templates' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                  {mockSoapTemplates.map((tpl) => (
                    <button key={tpl.id} onClick={() => applySoapTemplate(tpl)} style={{ ...innerCard, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{tpl.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{tpl.subtitle}</span>
                      <span style={{ fontSize: 10.5, color: 'var(--blue-text)', marginTop: 4 }}>Use template →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prescription */}
          <div style={{ ...card, padding: '4px 12px 8px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 27 }}>
              <span style={{ ...bandTitle, fontSize: 12, marginRight: 4 }}>
                <Tablets size={15} strokeWidth={2} />
                Prescription
              </span>
              <input
                className="input-field"
                placeholder="Search medicine..."
                value={rxSearch}
                onChange={(e) => setRxSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRxSearch()}
                style={{ width: 146, height: 24, fontSize: 10.5, padding: '0 9px', background: 'var(--bg-subtle)' }}
              />
              <button className="btn-outline-blue" style={{ height: 24, padding: '0 10px', fontSize: 10.5, gap: 6 }} onClick={handleAddFromTemplate}>
                <Plus size={12} />
                Add from Template
              </button>
              <select
                className="form-select"
                aria-label="Prescription template"
                value={rxTemplate}
                onChange={(e) => setRxTemplate(e.target.value)}
                style={{ width: 104, height: 26, fontSize: 10.5, padding: '0 8px', marginLeft: 'auto' }}
              >
                {Object.keys(mockRxTemplates).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px', marginTop: 2 }}>
              <thead>
                <tr>
                  <th style={{ ...rxHead, width: 26 }}>#</th>
                  <th style={rxHead}>Medicine</th>
                  <th style={rxHead}>Dose</th>
                  <th style={rxHead}>Frequency</th>
                  <th style={rxHead}>Duration</th>
                  <th style={rxHead}>Instruction</th>
                  <th style={{ ...rxHead, width: 30 }} />
                  <th style={{ ...rxHead, width: 30 }} />
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx, idx) => (
                  <tr key={rx.id}>
                    <td style={{ ...rxCell, borderLeft: '1px solid var(--border-color)', borderRadius: '5px 0 0 5px' }}>{idx + 1}</td>
                    <td style={rxCell}>{rx.medicine}</td>
                    <td style={rxCell}>{rx.dose}</td>
                    <td style={rxCell}>{rx.frequency}</td>
                    <td style={rxCell}>{rx.duration}</td>
                    <td style={rxCell}>{rx.instruction}</td>
                    <td style={{ ...rxCell, padding: 0, textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', position: 'relative' }}>
                      <button aria-label={`${rx.medicine} options`} onClick={() => setRxMenuId(rxMenuId === rx.id ? null : rx.id)} style={{ display: 'flex', margin: '0 auto', color: 'var(--text-primary)' }}>
                        <EllipsisVertical size={13} />
                      </button>
                      {rxMenuId === rx.id && <div style={{ position: 'fixed', inset: 0, zIndex: 4 }} onClick={() => setRxMenuId(null)} />}
                      {rxMenuId === rx.id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 22,
                            zIndex: 5,
                            background: '#ffffff',
                            border: '1px solid var(--border-color)',
                            borderRadius: 6,
                            boxShadow: 'var(--shadow-md)',
                            padding: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: 96
                          }}
                        >
                          {[
                            { label: 'Edit', onClick: () => handleEditMedicine(rx) },
                            { label: 'Duplicate', onClick: () => handleDuplicateMedicine(rx) }
                          ].map((a) => (
                            <button key={a.label} onClick={a.onClick} style={{ textAlign: 'left', fontSize: 11, padding: '4px 8px', borderRadius: 4 }}>
                              {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ ...rxCell, padding: 0, textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-color)', borderRadius: '0 5px 5px 0' }}>
                      <button aria-label={`Remove ${rx.medicine}`} onClick={() => handleDeleteMedicine(rx.id)} style={{ display: 'flex', margin: '0 auto', color: 'var(--red-rose)' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}

                {showAddMedRow && (
                  <tr>
                    <td style={{ ...rxCell, borderLeft: '1px solid var(--blue-border)', borderColor: 'var(--blue-border)', borderRadius: '5px 0 0 5px' }}>
                      <Plus size={11} />
                    </td>
                    <td style={{ ...rxCell, borderColor: 'var(--blue-border)', padding: '0 4px' }}>
                      <input autoFocus placeholder="Medicine name" value={newMed.medicine} onChange={(e) => setNewMed({ ...newMed, medicine: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleAddMedicine()} style={rxInput} />
                    </td>
                    <td style={{ ...rxCell, borderColor: 'var(--blue-border)', padding: '0 4px' }}>
                      <input placeholder="Dose" value={newMed.dose} onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })} style={{ ...rxInput, width: 58 }} />
                    </td>
                    <td style={{ ...rxCell, borderColor: 'var(--blue-border)', padding: '0 4px' }}>
                      <select value={newMed.frequency} onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })} style={rxInput}>
                        {FREQUENCIES.map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ ...rxCell, borderColor: 'var(--blue-border)', padding: '0 4px' }}>
                      <input placeholder="Duration" value={newMed.duration} onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })} style={{ ...rxInput, width: 62 }} />
                    </td>
                    <td style={{ ...rxCell, borderColor: 'var(--blue-border)', padding: '0 4px' }}>
                      <select value={newMed.instruction} onChange={(e) => setNewMed({ ...newMed, instruction: e.target.value })} style={rxInput}>
                        {INSTRUCTIONS.map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ ...rxCell, borderColor: 'var(--blue-border)', padding: 0, textAlign: 'center' }}>
                      <button aria-label="Add medicine" onClick={handleAddMedicine} style={{ display: 'inline-flex', color: 'var(--green-dark)' }}>
                        <Check size={14} />
                      </button>
                    </td>
                    <td style={{ ...rxCell, borderColor: 'var(--blue-border)', borderRight: '1px solid var(--blue-border)', padding: 0, textAlign: 'center', borderRadius: '0 5px 5px 0' }}>
                      <button aria-label="Cancel" onClick={() => setShowAddMedRow(false)} style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>
                        <X size={13} />
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto', paddingTop: 5 }}>
              <button
                className="btn-outline-blue"
                style={{ height: 28, padding: '0 7px', fontSize: 10.5, gap: 4, background: '#f3f7fe', flexShrink: 0 }}
                onClick={() => setShowAddMedRow(true)}
              >
                <Plus size={12} />
                Add Medicine
              </button>
              <button
                style={{ ...softBlueBtn, height: 26, fontSize: 9, gap: 2, padding: '0 4px', background: 'var(--red-light)', borderColor: 'transparent', color: 'var(--red-dark)' }}
                onClick={() => showToast('Checked: No severe drug interactions detected')}
              >
                <Pill size={9} />
                Check Interactions
              </button>
              <button
                style={{ ...softBlueBtn, height: 26, fontSize: 9, gap: 2, padding: '0 4px', background: 'var(--purple-light)', borderColor: 'transparent', color: 'var(--purple-dark)' }}
                onClick={() => showToast('Alternatives: Dolo 650, Calpol 650, Crocin Advance', 'info')}
              >
                <Pill size={9} />
                View Alternatives
              </button>
              <button className="btn-outline-blue" style={{ height: 30, padding: '0 7px', fontSize: 10, marginLeft: 'auto', flexShrink: 0 }} onClick={() => showToast('Prescription sent to printer')}>
                Print Prescription
              </button>
              <button className="btn-primary" style={{ height: 30, padding: '0 8px', fontSize: 10, flexShrink: 0 }} onClick={() => showToast('Prescription sent directly to pharmacy dispensary')}>
                Send to Pharmacy
              </button>
            </div>
          </div>
        </div>

        {/* ===== Right: AI Clinical Assistant ===== */}
        <div style={{ ...card, background: '#fbfcfe' }}>
          <div style={{ ...band, height: 40 }}>
            <span style={{ ...bandTitle, fontSize: 15, gap: 9 }}>
              <AiSparkle size={20} />
              AI Clinical Assistant (GPT-6 Astro)
            </span>
            <button style={{ ...link, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => aiInputRef.current?.focus()}>
              <BotMessageSquare size={14} />
              Ask AI
            </button>
          </div>

          <div style={{ padding: '6px 12px 10px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', gap: 7 }}>
              {AI_TABS.map((tab) => (
                <button
                  key={tab}
                  className={`page-tab-btn ${aiTab === tab ? 'active' : ''}`}
                  style={{ height: 28, padding: '0 8px', fontSize: 11, flex: '1 1 auto', justifyContent: 'center' }}
                  onClick={() => setAiTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {aiTab === 'Clinical Suggestions' && (
              <>
                <div style={aiBlock}>
                  <div style={aiBlockHead}>
                    <AiSparkle size={13} />
                    Clinical Considerations
                  </div>
                  <div style={{ ...aiBody, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {mockAIConsiderations.map((c, i) => {
                      const applied = appliedIds.includes(c.id);
                      return (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: '17px' }}>
                              <span style={{ display: 'inline-block', width: 18 }}>{i + 1}.</span>
                              {c.title.replace(/^\d+\.\s*/, '')}
                            </div>
                            <ul style={{ ...bulletList, paddingLeft: 28, fontSize: 10.5, lineHeight: '15px' }}>
                              {c.bullets.map((b) => (
                                <li key={b}>{b}</li>
                              ))}
                            </ul>
                          </div>
                          <button
                            style={{ ...softBlueBtn, height: 24, fontSize: 11, padding: '0 12px', minWidth: 50, ...(applied ? { background: 'var(--green-light)', color: 'var(--green-dark)', borderColor: 'var(--green-border)' } : {}) }}
                            onClick={() => applyConsideration(c.id, c.bullets.join(' '))}
                          >
                            {applied ? (
                              <>
                                <Check size={11} /> Applied
                              </>
                            ) : (
                              'Apply'
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {[
                  { title: 'Suggested Investigations', items: mockSuggestedInvestigations, action: 'Add to Plan', onClick: () => handleApplyAISuggestion('Order CBC, CRP, Chest X-Ray if needed') },
                  { title: 'Suggested Treatment Plan', items: mockSuggestedTreatmentPlan, action: 'Add to Plan', onClick: () => handleApplyAISuggestion('Symptomatic treatment, review in 5 days') },
                  {
                    title: 'Patient Education Points',
                    items: mockPatientEducation,
                    action: 'Send to Patient',
                    onClick: () => showToast(`Education points sent to ${activePatient?.name ?? 'patient'} via SMS/WhatsApp`)
                  }
                ].map((sec) => (
                  <div key={sec.title} style={aiBlock}>
                    <div style={aiBlockHead}>
                      <AiSparkle size={13} />
                      {sec.title}
                    </div>
                    <div style={{ ...aiBody, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <ul style={{ ...bulletList, flex: 1, fontSize: 11.5, lineHeight: '18px' }}>
                        {sec.items.map((it) => (
                          <li key={it}>{it}</li>
                        ))}
                      </ul>
                      <button
                        className="btn-outline-blue"
                        style={{ height: 26, padding: '0 10px', fontSize: 11, gap: 4, marginTop: 1 }}
                        onClick={sec.onClick}
                      >
                        {sec.action === 'Add to Plan' && <Plus size={11} />}
                        {sec.action}
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {aiTab === 'Report Analysis' && (
              <div style={aiBlock}>
                <div style={aiBlockHead}>
                  <AiSparkle size={13} />
                  Diagnostic Synthesis &amp; Lab Trends
                </div>
                <div style={{ ...aiBody, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--red-dark)' }}>Glycemic Marker Elevation (HbA1c: 7.8%)</div>
                    <p style={{ fontSize: 11, lineHeight: '16px', color: 'var(--text-secondary)' }}>
                      HbA1c increased from 7.2% to 7.8% over last 6 months. Fasting blood sugar at 134 mg/dL. Consider titrating Metformin or adding SGLT2 inhibitor.
                    </p>
                    <button
                      style={{ ...softBlueBtn, marginTop: 5 }}
                      onClick={() => handleApplyAISuggestion('Assessment note: Sub-optimal glycemic control noted (HbA1c 7.8%)')}
                    >
                      Insert into Assessment
                    </button>
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--green-dark)' }}>Chest X-Ray Correlation</div>
                    <p style={{ fontSize: 11, lineHeight: '16px', color: 'var(--text-secondary)' }}>
                      12 Sep 2026 PA view shows clear lung fields and normal cardiac size. Lower respiratory tract infection is unlikely given current non-productive cough.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {aiTab === 'Guidelines' && (
              <div style={aiBlock}>
                <div style={aiBlockHead}>
                  <AiSparkle size={13} />
                  Applicable Clinical Practice Guidelines
                </div>
                <div style={{ ...aiBody, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    {
                      title: 'ADA Standards of Care in Diabetes (2026)',
                      text: 'Target HbA1c < 7.0% for non-pregnant adults without significant hypoglycemia. Routine microalbuminuria screening recommended annually.'
                    },
                    {
                      title: 'ACC/AHA Hypertension Guidelines',
                      text: 'Target BP < 130/80 mmHg in patients with confirmed Diabetes Mellitus. Continue Amlodipine 5mg; monitor sodium intake.'
                    }
                  ].map((g) => (
                    <div key={g.title}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600 }}>{g.title}</span>
                        <span className="status-pill blue" style={{ height: 18, fontSize: 10 }}>
                          Class I
                        </span>
                      </div>
                      <p style={{ fontSize: 11, lineHeight: '16px', color: 'var(--text-secondary)' }}>{g.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiTab === 'Patient Insights' && (
              <div style={aiBlock}>
                <div style={aiBlockHead}>
                  <AiSparkle size={13} />
                  Longitudinal Patient Insights
                </div>
                <div style={{ ...aiBody, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 600 }}>Medication Adherence</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 7, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: '92%', height: '100%', background: 'var(--green-emerald)' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green-dark)' }}>92% High</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>Regular refills on Amlodipine and Metformin.</p>
                  </div>
                  <div style={{ background: 'var(--orange-light)', border: '1px solid var(--orange-border)', borderRadius: 6, padding: '6px 9px' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--orange-dark)' }}>Critical Allergy Reminder</div>
                    <p style={{ fontSize: 11, color: 'var(--orange-dark)', lineHeight: '16px' }}>
                      Allergic to <strong>Penicillin</strong>. Avoid Amoxicillin, Ampicillin, Augmentin. Macrolides or Fluoroquinolones safe if antibiotics required.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {aiChatResponse && (
              <div
                style={{
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: 'var(--purple-light)',
                  border: '1px solid var(--purple-border)',
                  fontSize: 11,
                  lineHeight: '16px',
                  color: 'var(--purple-dark)',
                  position: 'relative',
                  paddingRight: 24
                }}
              >
                {aiChatResponse}
                <button aria-label="Dismiss" onClick={() => setAiChatResponse(null)} style={{ position: 'absolute', top: 5, right: 5, display: 'flex', color: 'var(--purple-dark)' }}>
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Ask box + quick prompts */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 2 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 38,
                  border: '1px solid var(--border-color)',
                  borderRadius: 7,
                  background: '#ffffff',
                  overflow: 'hidden'
                }}
              >
                <button
                  aria-label="Attach file"
                  onClick={() => showToast('Attach a report or image for AI analysis', 'info')}
                  style={{ width: 32, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', background: 'var(--bg-subtle)' }}
                >
                  <Paperclip size={14} />
                </button>
                <input
                  ref={aiInputRef}
                  type="text"
                  placeholder="Ask anything about this patient..."
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAIChat()}
                  style={{ flex: 1, minWidth: 0, height: '100%', border: 'none', outline: 'none', padding: '0 11px', fontSize: 11.5, background: 'transparent' }}
                />
                <button
                  aria-label="Send"
                  onClick={() => handleAIChat()}
                  style={{ width: 34, height: 30, marginRight: 3, borderRadius: 5, background: 'var(--blue-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Send size={14} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px' }}>
                {[
                  { label: 'Compare with previous visit', icon: History },
                  { label: 'Explain this lab report', icon: CircleGauge },
                  { label: 'What to consider?', icon: Waypoints },
                  { label: 'Generate discharge summary', icon: FileText }
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    className="prompt-chip-btn"
                    style={{ height: 30, fontSize: 10.5, color: 'var(--blue-text)', gap: 8, padding: '0 10px' }}
                    onClick={() => handleAIChat(label)}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
