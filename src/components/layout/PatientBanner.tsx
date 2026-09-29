import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScreenId } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Heart,
  Activity,
  FileText,
  UserCheck,
  History,
  FlaskConical,
  ImageIcon,
  Pill,
  FileSignature,
  FileCode,
  HeartPulse,
  Receipt,
  Repeat
} from 'lucide-react';

interface PatientBannerProps {
  currentSubtab?: string;
  showSubtabs?: boolean;
}

export const PatientBanner: React.FC<PatientBannerProps> = ({ currentSubtab, showSubtabs = true }) => {
  const { activePatient, setActiveScreen, showToast } = useApp();

  if (!activePatient) return null;

  const clinicalSubtabs: { id: ScreenId | string; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'consultation', label: 'Consultation', icon: UserCheck },
    { id: 'emr', label: 'Clinical Notes', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: History },
    { id: 'lab-reports', label: 'Lab Reports', icon: FlaskConical },
    { id: 'imaging', label: 'Imaging', icon: ImageIcon },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileSignature },
    { id: 'documents', label: 'Documents', icon: FileCode },
    { id: 'vitals', label: 'Vitals', icon: HeartPulse },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'follow-ups', label: 'Follow-ups', icon: Repeat }
  ];

  const handleSubtabClick = (tabId: string) => {
    setActiveScreen(tabId as ScreenId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top Banner Card */}
      <div className="patient-banner-card">
        {/* Left Profile & Meta */}
        <div className="patient-banner-left">
          <div className="patient-avatar-box">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
              alt={activePatient.name}
            />
          </div>

          <div className="patient-info-meta">
            <h3>
              <span>{activePatient.name}</span>
              <span style={{ color: '#3b82f6', fontSize: '1.05rem' }}>♂</span>
            </h3>
            <div className="patient-meta-sub">
              <span>{activePatient.age} years</span>
              <span>•</span>
              <span>{activePatient.gender}</span>
              <span>•</span>
              <span>UHID: {activePatient.uhid}</span>
              <span>•</span>
              <span>{activePatient.phone}</span>
            </div>

            <div className="patient-badges-row">
              <span className="badge-tag hypertension">
                <Heart size={12} />
                <span>Hypertension</span>
              </span>
              <span className="badge-tag diabetes">
                <Activity size={12} />
                <span>Type 2 Diabetes</span>
              </span>
              <span className="badge-tag allergy">
                <AlertTriangle size={12} />
                <span>Allergy: Penicillin</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Metrics & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div className="patient-banner-metrics">
            <div className="metric-column">
              <span className="metric-label">Last Visit</span>
              <span className="metric-value">{activePatient.lastVisit}</span>
            </div>

            <div className="metric-column">
              <span className="metric-label">Today's Visit</span>
              <span className="metric-value">26 Sep 2026</span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>09:15 AM</span>
            </div>

            <div className="metric-column">
              <span className="metric-label">Department</span>
              <span className="metric-value">{activePatient.department}</span>
            </div>

            <div className="metric-column">
              <span className="metric-label">Consultation Type</span>
              <div style={{ marginTop: '3px' }}>
                <select
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: '#f8fafc',
                    cursor: 'pointer'
                  }}
                  defaultValue="Follow-up"
                >
                  <option value="Follow-up">Follow-up</option>
                  <option value="New Consultation">New Consultation</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Teleconsultation">Teleconsultation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Previous / Next Patient Quick Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => showToast('Navigated to previous patient: Rekha S')}
            >
              <ChevronLeft size={14} />
              <span>Previous Patient</span>
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => showToast('Navigated to next patient: David Raj')}
            >
              <span>Next Patient</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Clinical Subtabs Bar */}
      {showSubtabs && (
        <div className="secondary-subtabs-bar">
          {clinicalSubtabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = (currentSubtab || '').toLowerCase() === tab.id.toLowerCase();
            return (
              <button
                key={tab.id}
                className={`subtab-pill-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleSubtabClick(tab.id)}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
