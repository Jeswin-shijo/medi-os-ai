import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScreenId, Patient } from '../../types';
import { mockPatients } from '../../mock/patientsData';
import {
  Search,
  X,
  User,
  LayoutDashboard,
  Calendar,
  UserCheck,
  FileText,
  History,
  FlaskConical,
  ImageIcon,
  FileSignature,
  Pill,
  FileCode,
  HeartPulse,
  Receipt,
  Repeat,
  BookOpen,
  Mic,
  Bell,
  MessageSquare,
  Settings,
  Sparkles
} from 'lucide-react';

export const CommandPaletteModal: React.FC = () => {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, setActiveScreen, setActivePatient, showToast } = useApp();
  const [query, setQuery] = useState('');

  if (!isCommandPaletteOpen) return null;

  const screens: { id: ScreenId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients Directory', icon: User },
    { id: 'appointments', label: 'Appointments Schedule', icon: Calendar },
    { id: 'consultation', label: 'Patient Consultation & SOAP Workspace', icon: UserCheck },
    { id: 'emr', label: 'EMR & Clinical Notes', icon: FileText },
    { id: 'timeline', label: 'Patient Longitudinal Timeline', icon: History },
    { id: 'lab-reports', label: 'Laboratory Reports & Diagnostic Trends', icon: FlaskConical },
    { id: 'imaging', label: 'Imaging (RIS) & DICOM Viewer', icon: ImageIcon },
    { id: 'prescriptions', label: 'Digital Prescriptions', icon: FileSignature },
    { id: 'medications', label: 'Medications & Adherence', icon: Pill },
    { id: 'documents', label: 'Clinical Documents & Medical Records', icon: FileCode },
    { id: 'vitals', label: 'Patient Vitals & Biometrics Dashboard', icon: HeartPulse },
    { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
    { id: 'follow-ups', label: 'Patient Follow-ups & Recalls', icon: Repeat },
    { id: 'hospital-knowledge', label: 'Hospital Knowledge Base', icon: BookOpen },
    { id: 'clinical-guidelines', label: 'Evidence-Based Clinical Guidelines', icon: FileText },
    { id: 'voice-to-notes', label: 'Voice to Notes (AI Ambient Scribe)', icon: Mic },
    { id: 'tasks-alerts', label: 'Tasks & Clinical Alerts', icon: Bell },
    { id: 'messages', label: 'Messages & Teleconsultation', icon: MessageSquare },
    { id: 'settings', label: 'Hospital & AI Assistant Settings', icon: Settings }
  ];

  const filteredPatients = mockPatients.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.uhid.toLowerCase().includes(query.toLowerCase()) ||
    p.phone.includes(query)
  );

  const filteredScreens = screens.filter(s =>
    s.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectPatient = (patient: Patient) => {
    setActivePatient(patient);
    setActiveScreen('consultation');
    setIsCommandPaletteOpen(false);
    showToast(`Loaded ${patient.name} (${patient.uhid}) into Consultation`);
  };

  const handleSelectScreen = (screenId: ScreenId) => {
    setActiveScreen(screenId);
    setIsCommandPaletteOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsCommandPaletteOpen(false)}>
      <div
        className="modal-content-box"
        style={{ maxWidth: '640px', padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #e2e8f0', gap: '10px' }}>
          <Search size={20} color="#64748b" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a patient name, UHID, or jump to screen..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.95rem',
              color: '#0f172a'
            }}
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '12px' }}>
          {/* Quick AI Clinical Action */}
          <div
            onClick={() => {
              setActiveScreen('voice-to-notes');
              setIsCommandPaletteOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#f5f3ff',
              border: '1px solid #ddd6fe',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            <div style={{ color: '#8b5cf6' }}>
              <Sparkles size={18} />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b21a8' }}>
                Launch AI Voice Scribe (GPT-6 Astro)
              </p>
              <p style={{ fontSize: '0.74rem', color: '#7c3aed' }}>
                Ambient clinical listening & automatic SOAP note generation
              </p>
            </div>
          </div>

          {/* Patients Section */}
          {filteredPatients.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 10px' }}>
                Patients
              </div>
              {filteredPatients.slice(0, 5).map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: '#334155' }}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0f172a' }}>{p.name}</span>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', marginLeft: '8px' }}>UHID: {p.uhid}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#3b82f6', fontWeight: 600 }}>Open Consultation →</span>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Screens */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 10px' }}>
              Hospital Modules
            </div>
            {filteredScreens.map(s => {
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectScreen(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Icon size={16} />
                  <span style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 500 }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
