import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/appContextCore';
import { PatientBanner } from '../layout/PatientBanner';
import { ScreenHeader } from '../common/ScreenHeader';
import { AutoTextarea } from '../common/AutoTextarea';
import { mockVoiceTranscript, mockGeneratedSOAP, mockQuickTemplates } from '../../mock/voiceToNotesData';
import {
  CalendarDays,
  Captions,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Copy,
  EllipsisVertical,
  FileText,
  Languages,
  ListChecks,
  Mic,
  MicVocal,
  NotebookPen,
  Pause,
  PhoneCall,
  Play,
  Plus,
  RefreshCw,
  Save,
  Scissors,
  Send,
  Settings,
  Sparkles,
  SquarePen,
  Stethoscope,
  type LucideIcon
} from 'lucide-react';

type SoapKey = 'subjective' | 'objective' | 'assessment' | 'plan';
type CenterTab = 'Transcription' | 'AI Clinical Note' | 'Summary' | 'Action Items';

const CENTER_TABS: { id: CenterTab; icon: LucideIcon }[] = [
  { id: 'Transcription', icon: Captions },
  { id: 'AI Clinical Note', icon: NotebookPen },
  { id: 'Summary', icon: FileText },
  { id: 'Action Items', icon: ListChecks }
];

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  'qt-1': ClipboardList,
  'qt-2': CalendarDays,
  'qt-3': FileText,
  'qt-4': Scissors,
  'qt-5': Send,
  'qt-6': PhoneCall
};

const SOAP_CHIPS: Record<SoapKey, { letter: string; title: string; color: string }> = {
  subjective: { letter: 'S', title: 'Subjective', color: 'var(--blue-primary)' },
  objective: { letter: 'O', title: 'Objective', color: 'var(--green-emerald)' },
  assessment: { letter: 'A', title: 'Assessment', color: 'var(--orange-amber)' },
  plan: { letter: 'P', title: 'Plan', color: '#7c3aed' }
};

const MODES = ['Consultation Mode', 'Dictation Mode', 'Procedure Mode'];
const LANGS = ['English', 'Tamil', 'Hindi'];

// Deterministic waveform profile (symmetric bars around the centre line).
const WAVE = Array.from({ length: 72 }, (_, i) => {
  const envelope = 0.55 + 0.45 * Math.sin(i * 0.21 + 0.6);
  const jitter = 0.45 + 0.55 * Math.abs(Math.sin(i * 1.93) * Math.cos(i * 0.67));
  return 6 + Math.round(envelope * jitter * 50);
});

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0
};
const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 12, color: 'var(--text-primary)', marginBottom: 3 };

/** Select with a leading icon, as in the Record Consultation panel. */
const IconSelect: React.FC<{
  icon: LucideIcon;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  label: string;
  prefix?: string;
}> = ({ icon: Icon, value, options, onChange, label, prefix }) => (
  <div style={{ position: 'relative' }}>
    <Icon size={15} style={{ position: 'absolute', left: 11, top: 9, color: 'var(--blue-text)', pointerEvents: 'none' }} />
    <select
      aria-label={label}
      className="form-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ height: 33, fontSize: 12, paddingLeft: 33, appearance: 'none', borderRadius: 6 }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {prefix ? `${prefix}${o}` : o}
        </option>
      ))}
    </select>
    <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: 10, color: 'var(--text-primary)', pointerEvents: 'none' }} />
  </div>
);

export const VoiceToNotesScreen: React.FC = () => {
  const { showToast, setActiveScreen, activePatient } = useApp();
  const [isRecording, setIsRecording] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(138); // 00:02:18
  const [centerTab, setCenterTab] = useState<CenterTab>('Transcription');
  const [autoDetectMedical, setAutoDetectMedical] = useState(true);
  const [mode, setMode] = useState(MODES[0]);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [mic, setMic] = useState('MacBook Pro Microphone');
  const [language, setLanguage] = useState('English (Auto-detect)');
  const [specialty, setSpecialty] = useState('General Medicine');
  const [noteTemplate, setNoteTemplate] = useState('SOAP (Default)');
  const [transcriptLang, setTranscriptLang] = useState(LANGS[0]);
  const [activeTemplate, setActiveTemplate] = useState('qt-1');
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState({
    subjective: mockGeneratedSOAP.subjective,
    objective: mockGeneratedSOAP.objective.join('\n'),
    assessment: mockGeneratedSOAP.assessment.join('\n'),
    plan: mockGeneratedSOAP.plan.join('\n')
  });

  // Timer tick effect when recording
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => setTimerSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
  };

  const handlePause = () => {
    setIsRecording(!isRecording);
    showToast(isRecording ? 'Recording paused' : 'Recording resumed');
  };

  const handleStop = () => {
    setIsRecording(false);
    showToast('Consultation recording finished. AI Clinical Note synthesized!');
  };

  const handleCopy = async () => {
    const text = (Object.keys(SOAP_CHIPS) as SoapKey[]).map((k) => `${SOAP_CHIPS[k].title}:\n${note[k]}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard may be unavailable (e.g. insecure context) */
    }
    showToast('Copied to clipboard');
  };

  const applyTemplate = (id: string, title: string) => {
    setActiveTemplate(id);
    if (id === 'qt-1') setNoteTemplate('SOAP (Default)');
    if (id === 'qt-2') setNoteTemplate('Follow-up');
    if (id === 'qt-3') setNoteTemplate('Discharge');
    showToast(`Applied ${title} template structure`);
  };

  return (
    <div className="page-scroll-body">
      <style>{`
        @keyframes vtnWave { 0%, 100% { transform: scaleY(0.45); } 50% { transform: scaleY(1); } }
        @keyframes vtnPing { 0% { transform: scale(0.92); opacity: 0.55; } 100% { transform: scale(1.18); opacity: 0; } }
      `}</style>

      <ScreenHeader
        title="Voice to Notes"
        subtitle="Convert your consultation speech into structured clinical notes with AI"
        actions={
          <>
            <div style={{ position: 'relative' }}>
              <button className="btn-outline-blue" style={{ background: '#f1f6fe', gap: 12 }} onClick={() => setShowModeMenu((v) => !v)}>
                <Mic size={17} />
                <span>{mode}</span>
                <ChevronDown size={15} />
              </button>
              {showModeMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => setShowModeMenu(false)} />}
              {showModeMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 46,
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-md)',
                    padding: 4
                  }}
                >
                  {MODES.map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        setShowModeMenu(false);
                        showToast(`${m} enabled`, 'info');
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '7px 10px', fontSize: 12.5, borderRadius: 5 }}
                    >
                      {m}
                      {m === mode && <Check size={14} color="var(--blue-text)" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-secondary" onClick={() => setActiveScreen('settings')}>
              <Settings size={17} color="var(--blue-text)" />
              <span>Settings</span>
            </button>
            <button
              className="btn-secondary"
              onClick={() => showToast('Speak naturally – GPT-6 Astro separates doctor & patient speech, then drafts a SOAP note you can edit and save to EMR.', 'info')}
            >
              <CircleHelp size={17} />
              <span>How it works?</span>
            </button>
          </>
        }
      />

      <PatientBanner showSubtabs={false} />

      {/* 3 columns: Record console | Live transcription | Generated SOAP note */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 320fr) minmax(0, 487fr) minmax(0, 451fr)', gap: 14, alignItems: 'stretch' }}>
        {/* Left: recording console */}
        <div style={{ ...cardStyle, padding: '12px 14px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15.5, fontWeight: 700 }}>Record Consultation</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 24,
                padding: '0 9px',
                borderRadius: 5,
                background: isRecording ? 'var(--green-light)' : 'var(--gray-pill-bg)',
                color: isRecording ? 'var(--green-dark)' : 'var(--gray-pill-text)',
                fontSize: 11.5
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: '50%', border: `2.5px solid ${isRecording ? 'var(--green-emerald)' : '#9aa3b5'}` }} />
              {isRecording ? 'Online' : 'Paused'}
            </span>
          </div>

          {/* Big mic button with pulsing halo */}
          <div style={{ position: 'relative', width: 128, height: 128, margin: '8px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, #fde4e7 55%, #fef1f3 100%)' }} />
            {isRecording && (
              <span style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: 'rgba(224, 45, 60, 0.18)', animation: 'vtnPing 1.6s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
            )}
            <button
              aria-label={isRecording ? 'Pause recording' : 'Resume recording'}
              onClick={handlePause}
              style={{
                position: 'relative',
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #f2434f 0%, #e22a38 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 14px rgba(224, 45, 60, 0.3)'
              }}
            >
              <Mic size={38} strokeWidth={1.9} />
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <div style={{ fontSize: 19, fontWeight: 700, lineHeight: '24px', fontVariantNumeric: 'tabular-nums' }}>{formatTimer(timerSeconds)}</div>
            <div style={{ fontSize: 12.5, color: isRecording ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: 1 }}>{isRecording ? 'Recording...' : 'Paused'}</div>
          </div>

          {/* Audio waveform */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, margin: '10px 0 12px' }} aria-hidden="true">
            {WAVE.map((h, i) => (
              <span
                key={i}
                style={{
                  width: 2,
                  height: isRecording ? h : 4,
                  borderRadius: 2,
                  background: i % 9 === 4 ? 'var(--blue-text)' : 'var(--chart-blue)',
                  opacity: 0.55 + (h / 50) * 0.45,
                  animation: isRecording ? `vtnWave ${0.9 + (i % 5) * 0.15}s ease-in-out ${(i % 7) * 0.08}s infinite` : 'none',
                  transition: 'height 0.2s ease'
                }}
              />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button className="btn-secondary" style={{ height: 36, fontSize: 13, gap: 10, color: 'var(--blue-text)' }} onClick={handlePause}>
              {isRecording ? <Pause size={15} fill="currentColor" strokeWidth={0} /> : <Play size={15} fill="currentColor" strokeWidth={0} />}
              <span>{isRecording ? 'Pause' : 'Resume'}</span>
            </button>
            <button className="btn-secondary" style={{ height: 36, fontSize: 13, gap: 10, color: 'var(--red-dark)' }} onClick={handleStop}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--red-rose)' }} />
              <span>Stop</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <IconSelect icon={Mic} label="Microphone" value={mic} onChange={setMic} options={['MacBook Pro Microphone', 'Bluetooth Headset', 'USB Desk Microphone']} prefix="Mic: " />

            <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12, cursor: 'pointer', margin: '2px 0' }}>
              <input
                type="checkbox"
                checked={autoDetectMedical}
                onChange={(e) => setAutoDetectMedical(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: 'var(--blue-primary)' }}
              />
              <span>Auto-detect medical terms</span>
            </label>

            <div>
              <label style={fieldLabel}>Language</label>
              <IconSelect icon={Languages} label="Language" value={language} onChange={setLanguage} options={['English (Auto-detect)', 'Tamil', 'Hindi', 'Malayalam']} />
            </div>
            <div>
              <label style={fieldLabel}>Specialty</label>
              <IconSelect icon={Stethoscope} label="Specialty" value={specialty} onChange={setSpecialty} options={['General Medicine', 'Cardiology', 'Pediatrics', 'Endocrinology']} />
            </div>
            <div>
              <label style={fieldLabel}>Note Template</label>
              <IconSelect icon={FileText} label="Note Template" value={noteTemplate} onChange={setNoteTemplate} options={['SOAP (Default)', 'Follow-up', 'Discharge']} />
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 12 }}>
            <button
              className="btn-primary"
              style={{ width: '100%', height: 37, fontSize: 13, gap: 10 }}
              onClick={() => showToast('Generated clinical SOAP note synthesized from speech!')}
            >
              <Sparkles size={16} />
              <span>Generate Clinical Note</span>
            </button>
          </div>
        </div>

        {/* Center: live transcription */}
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 4, padding: '4px 6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            {CENTER_TABS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                className={`page-tab-btn ${centerTab === id ? 'active' : ''}`}
                style={{ height: 36, padding: '0 16px', fontSize: 11.5, gap: 6, borderRadius: '6px 6px 0 0', background: centerTab === id ? 'var(--bg-card)' : undefined }}
                onClick={() => setCenterTab(id)}
              >
                <Icon size={13} />
                {id}
              </button>
            ))}
          </div>

          <div style={{ padding: '12px 12px 12px 15px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15.5, fontWeight: 700, lineHeight: '20px' }}>{centerTab === 'Transcription' ? 'Live Transcription' : centerTab}</h3>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {centerTab === 'Transcription' ? 'Real-time speech to text' : 'Generated from the live conversation'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="chip-btn"
                  style={{ height: 30, padding: '0 12px', fontSize: 12.5 }}
                  onClick={() => {
                    const next = LANGS[(LANGS.indexOf(transcriptLang) + 1) % LANGS.length];
                    setTranscriptLang(next);
                    showToast(`Transcript language: ${next}`, 'info');
                  }}
                >
                  {transcriptLang}
                </button>
                <button className="icon-btn" aria-label="Transcript options" style={{ width: 30, height: 30 }} onClick={() => showToast('Download transcript or change speaker labels', 'info')}>
                  <EllipsisVertical size={15} />
                </button>
              </div>
            </div>

            {centerTab === 'Transcription' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', minHeight: 0 }}>
                {mockVoiceTranscript.map((line) => {
                  const isDoctor = line.speaker === 'Doctor';
                  return (
                    <div
                      key={line.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '38px 22px 46px 1fr',
                        columnGap: 8,
                        alignItems: 'start',
                        padding: '9px 10px',
                        borderRadius: 6,
                        background: '#f9fafd',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <span style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: '22px', fontVariantNumeric: 'tabular-nums' }}>{line.time}</span>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: isDoctor ? 'var(--blue-primary)' : 'var(--green-emerald)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <MicVocal size={12} />
                      </span>
                      <span style={{ fontSize: 11.5, fontWeight: 600, lineHeight: '22px' }}>{line.speaker}</span>
                      <span style={{ fontSize: 11.5, lineHeight: '20px', color: 'var(--text-primary)', paddingTop: 1 }}>{line.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {centerTab === 'AI Clinical Note' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', background: '#f9fafd', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 12, lineHeight: '18px' }}>
                <div style={{ fontWeight: 700 }}>AI Extracted SOAP Draft</div>
                <div>
                  <strong>Subjective:</strong> Feeling better on medication, occasional headache. No giddiness, cough or swelling.
                </div>
                <div>
                  <strong>Objective:</strong> BP 128/82 mmHg, pulse 78/min regular, weight 72 kg. Systemic examination normal.
                </div>
                <div>
                  <strong>Assessment:</strong> Hypertension – controlled. Type 2 DM on treatment (last HbA1c 7.2).
                </div>
                <div>
                  <strong>Plan:</strong> Continue Amlodipine 5 mg OD & Metformin 500 mg BD. Repeat HbA1c, CBC, RFT, LFT next month.
                </div>
              </div>
            )}

            {centerTab === 'Summary' && (
              <div style={{ padding: '10px 12px', background: 'var(--purple-light)', borderRadius: 8, border: '1px solid var(--purple-border)', fontSize: 12, lineHeight: '18px' }}>
                <div style={{ fontWeight: 600, color: 'var(--purple-dark)', marginBottom: 4 }}>Consultation Executive Summary</div>
                <p style={{ color: 'var(--text-primary)' }}>
                  {activePatient?.age ?? 34}-year-old {activePatient?.gender?.toLowerCase() ?? 'male'} reviewed for hypertension and type 2 diabetes. BP controlled on
                  Amlodipine; occasional headache only. Continue current medications, repeat blood tests next month and follow up in 4 weeks.
                </p>
              </div>
            )}

            {centerTab === 'Action Items' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', background: '#f9fafd', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 12 }}>
                {['Continue Amlodipine 5 mg OD and Metformin 500 mg BD', 'Order HbA1c, CBC, RFT, LFT for next month', 'Schedule follow-up review in 4 weeks', 'Share home BP monitoring advice with patient'].map((item) => (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--blue-primary)' }} />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 10px',
                borderRadius: 7,
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                fontSize: 10.3,
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap'
              }}
            >
              <MicVocal size={16} color="var(--blue-text)" style={{ flexShrink: 0 }} />
              <span>Recording will be transcribed in real-time. Click “Generate Clinical Note” when finished.</span>
            </div>
          </div>
        </div>

        {/* Right: generated SOAP note */}
        <div style={{ ...cardStyle, padding: '12px 14px 12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 700 }}>Generated Clinical Note (SOAP)</h3>
            <button
              className="btn-secondary"
              style={{ height: 30, padding: '0 12px', fontSize: 12.5, color: 'var(--blue-text)', gap: 7 }}
              onClick={() => {
                if (isEditing) showToast('Clinical note updated');
                setIsEditing((v) => !v);
              }}
            >
              {isEditing ? <Check size={14} /> : <SquarePen size={14} />}
              <span>{isEditing ? 'Done' : 'Edit'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            {(Object.keys(SOAP_CHIPS) as SoapKey[]).map((key) => {
              const chip = SOAP_CHIPS[key];
              return (
                <div key={key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span
                      style={{
                        width: 23,
                        height: 23,
                        borderRadius: 5,
                        background: chip.color,
                        color: '#ffffff',
                        fontSize: 12.5,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {chip.letter}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{chip.title}</span>
                  </div>
                  {isEditing ? (
                    <div style={{ border: '1px solid var(--blue-border)', borderRadius: 6, padding: '4px 8px', background: '#ffffff' }}>
                      <AutoTextarea label={chip.title} value={note[key]} onChange={(v) => setNote((n) => ({ ...n, [key]: v }))} style={{ fontSize: 12.5, lineHeight: '19px' }} />
                    </div>
                  ) : key === 'subjective' ? (
                    <p style={{ fontSize: 12.5, lineHeight: '20px', whiteSpace: 'pre-line' }}>{note.subjective}</p>
                  ) : (
                    <ul style={{ listStyle: 'disc', paddingLeft: 26, fontSize: 12.5, lineHeight: '20px' }}>
                      {note[key]
                        .split('\n')
                        .filter(Boolean)
                        .map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 5, marginTop: 'auto', paddingTop: 10 }}>
            <button className="btn-secondary" style={{ height: 30, padding: '0 9px', fontSize: 11, gap: 5, color: 'var(--blue-text)', borderColor: 'var(--blue-border)' }} onClick={handleCopy}>
              <Copy size={13} />
              <span>Copy</span>
            </button>
            <button className="btn-secondary" style={{ height: 30, padding: '0 9px', fontSize: 11, gap: 5, color: 'var(--blue-text)', borderColor: 'var(--blue-border)' }} onClick={() => showToast('Note regenerated')}>
              <RefreshCw size={13} />
              <span>Regenerate</span>
            </button>
            <button className="btn-primary" style={{ height: 30, padding: '0 10px', fontSize: 11, gap: 6 }} onClick={() => showToast('Saved directly to Patient EMR')}>
              <Save size={13} />
              <span>Save to EMR</span>
            </button>
            <button
              className="btn-secondary"
              style={{ height: 30, padding: '0 9px', fontSize: 11, gap: 5, color: 'var(--blue-text)', borderColor: 'var(--blue-border)' }}
              onClick={() => setActiveScreen('prescriptions')}
            >
              <span style={{ fontSize: 13, fontWeight: 700, fontStyle: 'italic', lineHeight: 1 }}>℞</span>
              <span>Create Prescription</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick templates */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Quick Templates</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 158px))', gap: 10 }}>
          {mockQuickTemplates.map((tpl) => {
            const Icon = TEMPLATE_ICONS[tpl.id] ?? FileText;
            const active = activeTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl.id, tpl.title)}
                style={{
                  ...cardStyle,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  height: 48,
                  padding: '0 12px',
                  textAlign: 'left',
                  background: active ? '#eef4fe' : '#ffffff',
                  borderColor: active ? 'var(--blue-border)' : 'var(--border-color)',
                  borderRadius: 7
                }}
              >
                <Icon size={21} color={active ? 'var(--blue-text)' : 'var(--text-primary)'} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 500, color: active ? 'var(--blue-text)' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>{tpl.title}</span>
                  <span style={{ fontSize: 10.5, color: active ? 'var(--blue-text)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.subtitle}</span>
                </span>
              </button>
            );
          })}
          <button
            onClick={() => showToast('Create custom template builder')}
            style={{ ...cardStyle, flexDirection: 'row', alignItems: 'center', gap: 12, height: 48, padding: '0 12px', textAlign: 'left', borderRadius: 7 }}
          >
            <Plus size={22} color="var(--blue-text)" strokeWidth={1.8} style={{ flexShrink: 0 }} />
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11.5, fontWeight: 500 }}>Custom Template</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>Create your own</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
