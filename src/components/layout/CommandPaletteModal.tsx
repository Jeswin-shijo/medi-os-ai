import React, { useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { ScreenId, Patient } from '../../types';
import { mockPatients } from '../../mock/patientsData';
import {
  Search,
  LayoutGrid,
  UsersRound,
  CalendarCheck,
  UserRoundSearch,
  FileAxis3d,
  ChartNoAxesGantt,
  FlaskConical,
  ImagePlay,
  FileSignature,
  CircleX,
  Files,
  Activity,
  CalendarFold,
  BookOpenText,
  Mic,
  Bell,
  MessageSquareMore,
  Settings,
  ArrowRight,
  CornerDownLeft,
  type LucideIcon
} from 'lucide-react';
import { AiSparkle, Capsules } from '../common/icons';
import { Avatar } from '../common/Avatar';

interface ModuleItem {
  id: ScreenId;
  label: string;
  hint: string;
  icon: LucideIcon;
}

// Same labels and icons as the sidebar (plus the patient sub-modules reached from the banner tabs).
const MODULES: ModuleItem[] = [
  { id: 'dashboard', label: 'Dashboard', hint: "Today's overview", icon: LayoutGrid },
  { id: 'patients', label: 'Patients', hint: 'Patient directory', icon: UsersRound },
  { id: 'appointments', label: 'Appointments', hint: 'Schedule & queue', icon: CalendarCheck },
  { id: 'consultation', label: 'Consultation', hint: 'SOAP workspace', icon: UserRoundSearch },
  { id: 'emr', label: 'EMR / Clinical Notes', hint: 'Medical records', icon: FileAxis3d },
  { id: 'timeline', label: 'Patient Timeline', hint: 'Encounter history', icon: ChartNoAxesGantt },
  { id: 'lab-reports', label: 'Lab Reports', hint: 'Investigations & trends', icon: FlaskConical },
  { id: 'imaging', label: 'Imaging (RIS)', hint: 'DICOM viewer', icon: ImagePlay },
  { id: 'prescriptions', label: 'Prescriptions', hint: 'Digital Rx', icon: FileSignature },
  { id: 'medications', label: 'Medications', hint: 'Adherence & reconciliation', icon: CircleX },
  { id: 'documents', label: 'Documents', hint: 'Clinical records', icon: Files },
  { id: 'vitals', label: 'Vitals', hint: 'Vital signs & trends', icon: Activity },
  { id: 'billing', label: 'Billing', hint: 'Invoices & payments', icon: CalendarFold },
  { id: 'follow-ups', label: 'Follow-ups', hint: 'Recalls & reminders', icon: Capsules },
  { id: 'hospital-knowledge', label: 'Hospital Knowledge', hint: 'SOPs & policies', icon: BookOpenText },
  { id: 'clinical-guidelines', label: 'Clinical Guidelines', hint: 'Evidence-based protocols', icon: BookOpenText },
  { id: 'voice-to-notes', label: 'Voice to Notes', hint: 'AI ambient scribe', icon: Mic },
  { id: 'tasks-alerts', label: 'Tasks & Alerts', hint: 'Clinical alerts', icon: Bell },
  { id: 'messages', label: 'Messages', hint: 'Chat & teleconsultation', icon: MessageSquareMore },
  { id: 'settings', label: 'Settings', hint: 'Hospital & AI settings', icon: Settings }
];

type Entry =
  | { kind: 'ai' }
  | { kind: 'patient'; patient: Patient }
  | { kind: 'module'; module: ModuleItem };

const kbd: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '20px',
  height: '20px',
  padding: '0 5px',
  borderRadius: 'var(--radius-xs)',
  backgroundColor: '#ffffff',
  border: '1px solid var(--border-color)',
  fontSize: 'var(--fs-2xs)',
  fontWeight: 500,
  color: 'var(--text-secondary)'
};

const sectionLabel: React.CSSProperties = {
  fontSize: 'var(--fs-xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  padding: '8px 10px 4px'
};

export const CommandPaletteModal: React.FC = () => {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, setActiveScreen, setActivePatient, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  if (!isCommandPaletteOpen) return null;

  const q = query.trim().toLowerCase();
  const patients = mockPatients
    .filter(p => p.name.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q) || p.phone.includes(q))
    .slice(0, 5);
  const modules = MODULES.filter(m => m.label.toLowerCase().includes(q) || m.hint.toLowerCase().includes(q));
  const showAi = !q || 'ai voice scribe notes gpt'.includes(q) || q.includes('ai');

  const entries: Entry[] = [
    ...(showAi ? [{ kind: 'ai' } as Entry] : []),
    ...patients.map(patient => ({ kind: 'patient', patient }) as Entry),
    ...modules.map(module => ({ kind: 'module', module }) as Entry)
  ];
  const current = Math.min(activeIndex, Math.max(entries.length - 1, 0));

  const close = () => {
    setIsCommandPaletteOpen(false);
    setQuery('');
    setActiveIndex(0);
  };

  const select = (entry: Entry) => {
    if (entry.kind === 'ai') {
      setActiveScreen('voice-to-notes');
    } else if (entry.kind === 'patient') {
      setActivePatient(entry.patient);
      setActiveScreen('consultation');
      showToast(`Loaded ${entry.patient.name} (${entry.patient.uhid}) into Consultation`);
    } else {
      setActiveScreen(entry.module.id);
    }
    close();
  };

  const moveTo = (index: number) => {
    setActiveIndex(index);
    requestAnimationFrame(() => document.getElementById(`cmdk-item-${index}`)?.scrollIntoView({ block: 'nearest' }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown' && entries.length) {
      e.preventDefault();
      moveTo((current + 1) % entries.length);
    } else if (e.key === 'ArrowUp' && entries.length) {
      e.preventDefault();
      moveTo((current - 1 + entries.length) % entries.length);
    } else if (e.key === 'Enter' && entries[current]) {
      e.preventDefault();
      select(entries[current]);
    }
  };

  const rowStyle = (index: number): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '7px 10px',
    borderRadius: 'var(--radius-md)',
    textAlign: 'left',
    backgroundColor: index === current ? 'var(--bg-hover)' : 'transparent',
    boxShadow: index === current ? 'inset 2px 0 0 var(--blue-primary)' : 'none'
  });

  const aiIndex = showAi ? 0 : -1;
  const patientOffset = showAi ? 1 : 0;
  const moduleOffset = patientOffset + patients.length;

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '11vh' }} onClick={close}>
      <div
        className="modal-content-box"
        role="dialog"
        aria-label="Command palette"
        style={{ maxWidth: '640px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px', height: '56px', borderBottom: '1px solid var(--border-color)' }}>
          <Search size={18} strokeWidth={2} color="var(--text-primary)" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search patients by name, UHID, phone or jump to a module..."
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: 'var(--text-primary)' }}
          />
          <button style={{ ...kbd, cursor: 'pointer', height: '22px', padding: '0 7px' }} onClick={close} title="Close">
            Esc
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '440px', overflowY: 'auto', padding: '8px' }}>
          {showAi && (
            <button
              id={`cmdk-item-${aiIndex}`}
              className="ai-section"
              onClick={() => select({ kind: 'ai' })}
              onMouseEnter={() => setActiveIndex(aiIndex)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                textAlign: 'left',
                marginBottom: '4px',
                borderColor: current === aiIndex ? 'var(--purple-border)' : undefined
              }}
            >
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--purple-border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <AiSparkle size={17} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 'var(--fs-body)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Launch AI Voice Scribe (GPT-6 Astro)
                </span>
                <span style={{ display: 'block', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                  Ambient clinical listening & automatic SOAP note generation
                </span>
              </span>
              <Mic size={16} color="var(--purple-dark)" />
            </button>
          )}

          {patients.length > 0 && (
            <div>
              <div style={sectionLabel}>Patients</div>
              {patients.map((p, i) => {
                const index = patientOffset + i;
                return (
                  <button
                    key={p.id}
                    id={`cmdk-item-${index}`}
                    style={rowStyle(index)}
                    onClick={() => select({ kind: 'patient', patient: p })}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <Avatar name={p.name} size={32} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 'var(--fs-body)', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                      <span style={{ display: 'block', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        UHID: {p.uhid} · {p.age} yrs · {p.gender} · {p.department}
                      </span>
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 500,
                        color: 'var(--blue-text)',
                        opacity: index === current ? 1 : 0.75
                      }}
                    >
                      Open Consultation
                      <ArrowRight size={13} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {modules.length > 0 && (
            <div>
              <div style={sectionLabel}>Hospital Modules</div>
              {modules.map((m, i) => {
                const index = moduleOffset + i;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    id={`cmdk-item-${index}`}
                    style={rowStyle(index)}
                    onClick={() => select({ kind: 'module', module: m })}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: index === current ? 'var(--bg-tab-active)' : 'var(--bg-tab)',
                        color: index === current ? 'var(--blue-text)' : 'var(--text-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={16} strokeWidth={1.9} />
                    </span>
                    <span style={{ flex: 1, fontSize: 'var(--fs-body)', fontWeight: 500, color: 'var(--text-primary)' }}>{m.label}</span>
                    <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{m.hint}</span>
                    {index === current && <CornerDownLeft size={13} color="var(--text-muted)" />}
                  </button>
                );
              })}
            </div>
          )}

          {entries.length === 0 && (
            <div style={{ padding: '32px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--fs-h4)', fontWeight: 600, color: 'var(--text-primary)' }}>No results for “{query}”</div>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginTop: '4px' }}>
                Try a patient name, UHID, phone number or module name
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '0 16px',
            height: '42px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-subtle)'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.svg" alt="" width={22} height={22} />
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>MediOS AI</span>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Powered by GPT-6 Astro</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={kbd}>↑</span>
              <span style={kbd}>↓</span>
              Navigate
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={kbd}>↵</span>
              Open
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={kbd}>⌘ K</span>
              Toggle
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
