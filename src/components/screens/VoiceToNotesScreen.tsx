import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PatientBanner } from '../layout/PatientBanner';
import { mockVoiceTranscript, mockGeneratedSOAP, mockQuickTemplates } from '../../mock/voiceToNotesData';
import {
  Mic,
  Pause,
  Square,
  Sparkles,
  Copy,
  RotateCcw,
  Save,
  FileSignature,
  Edit2,
  Settings,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

export const VoiceToNotesScreen: React.FC = () => {
  const { showToast, setActiveScreen } = useApp();
  const [isRecording, setIsRecording] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(138); // 00:02:18
  const [centerTab, setCenterTab] = useState('Transcription');
  const [autoDetectMedical, setAutoDetectMedical] = useState(true);

  // Timer tick effect when recording
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePause = () => {
    setIsRecording(!isRecording);
    showToast(isRecording ? 'Recording paused' : 'Recording resumed');
  };

  const handleStop = () => {
    setIsRecording(false);
    showToast('Consultation recording finished. AI Clinical Note synthesized!');
  };

  return (
    <div className="page-scroll-body">
      <PatientBanner currentSubtab="consultation" />

      {/* Screen Header */}
      <div className="screen-header-row" style={{ marginTop: '4px' }}>
        <div className="screen-title-area">
          <h1 style={{ fontSize: '1.4rem' }}>Voice to Notes</h1>
          <p>Convert your consultation speech into structured clinical notes with AI</p>
        </div>
        <div className="screen-header-actions">
          <button className="btn-secondary">
            <Mic size={14} color="#2563eb" />
            <span>Consultation Mode ▼</span>
          </button>
          <button className="btn-secondary">
            <Settings size={14} />
            <span>Settings</span>
          </button>
          <button className="btn-secondary">
            <HelpCircle size={14} />
            <span>How it works?</span>
          </button>
        </div>
      </div>

      {/* 3-Column Layout: Record Console | Live Dual-party Transcription | Generated SOAP Note */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1.4fr 1.2fr', gap: '20px' }}>
        {/* Left Column: Recording Console */}
        <div className="medios-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 800 }}>Record Consultation</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span>Online</span>
            </div>
          </div>

          {/* Big Mic Button with Pulsing Wave */}
          <div style={{ position: 'relative', marginTop: '10px' }}>
            {isRecording && (
              <div
                style={{
                  position: 'absolute',
                  inset: '-10px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.2)',
                  animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                }}
              />
            )}
            <button
              onClick={handlePause}
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: '#ef4444',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(239, 68, 68, 0.35)',
                cursor: 'pointer'
              }}
            >
              <Mic size={34} />
            </button>
          </div>

          {/* Timer & Status */}
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
              00:{formatTimer(timerSeconds)}
            </div>
            <div style={{ fontSize: '0.74rem', color: isRecording ? '#dc2626' : '#64748b', fontWeight: 600 }}>
              {isRecording ? 'Recording...' : 'Paused'}
            </div>
          </div>

          {/* Animated Audio Waveform */}
          <div className="waveform-bars-container">
            {[4, 12, 28, 44, 20, 36, 48, 16, 32, 44, 24, 40, 18, 30, 48, 22, 14, 38, 26, 12].map((height, i) => (
              <div
                key={i}
                className="wave-bar"
                style={{
                  height: isRecording ? `${height}px` : '6px',
                  animationDelay: `${(i % 5) * 0.15}s`
                }}
              />
            ))}
          </div>

          {/* Pause / Stop Control Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
            <button
              className="btn-outline-blue"
              style={{ justifyContent: 'center', padding: '6px' }}
              onClick={handlePause}
            >
              <Pause size={14} />
              <span>{isRecording ? 'Pause' : 'Resume'}</span>
            </button>
            <button
              className="btn-secondary"
              style={{ justifyContent: 'center', padding: '6px', color: '#dc2626', borderColor: '#fca5a5' }}
              onClick={handleStop}
            >
              <Square size={14} />
              <span>Stop</span>
            </button>
          </div>

          {/* Configuration Dropdowns */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', marginTop: '4px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Mic:</label>
              <select style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#f8fafc', marginTop: '2px' }}>
                <option>MacBook Pro Microphone</option>
                <option>Bluetooth Headset</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#334155', cursor: 'pointer' }}>
              <input type="checkbox" checked={autoDetectMedical} onChange={(e) => setAutoDetectMedical(e.target.checked)} />
              <span>Auto-detect medical terms</span>
            </label>

            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Language</label>
              <select style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#f8fafc', marginTop: '2px' }}>
                <option>English (Auto-detect)</option>
                <option>Tamil</option>
                <option>Hindi</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Specialty</label>
              <select style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#f8fafc', marginTop: '2px' }}>
                <option>General Medicine</option>
                <option>Cardiology</option>
                <option>Pediatrics</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Note Template</label>
              <select style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#f8fafc', marginTop: '2px' }}>
                <option>SOAP (Default)</option>
                <option>Follow-up</option>
                <option>Discharge</option>
              </select>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '6px', padding: '10px' }}
            onClick={() => showToast('Generated clinical SOAP note synthesized from speech!')}
          >
            <Sparkles size={16} />
            <span>Generate Clinical Note</span>
          </button>
        </div>

        {/* Center Column: Live Dual-Party Real-time Dialogue */}
        <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            <div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800 }}>Live Transcription</h3>
              <p style={{ fontSize: '0.72rem', color: '#64748b' }}>Real-time speech to text</p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', background: '#f1f5f9', fontWeight: 600 }}>English</span>
              <button style={{ color: '#64748b' }}>•••</button>
            </div>
          </div>

          {/* Subtabs: Transcription, AI Clinical Note, Summary, Action Items */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
            {['Transcription', 'AI Clinical Note', 'Summary', 'Action Items'].map(tab => (
              <button
                key={tab}
                onClick={() => setCenterTab(tab)}
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '4px',
                  background: centerTab === tab ? '#eff6ff' : 'transparent',
                  color: centerTab === tab ? '#2563eb' : '#64748b'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Speech dialogue container */}
          {centerTab === 'Transcription' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '520px', paddingRight: '6px' }}>
              {mockVoiceTranscript.map((line) => {
                const isDoctor = line.speaker === 'Doctor';
                return (
                  <div
                    key={line.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: isDoctor ? '#f8fafc' : '#ffffff',
                      border: '1px solid #f1f5f9'
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', minWidth: '38px', marginTop: '2px' }}>
                      {line.time}
                    </span>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isDoctor ? '#dbeafe' : '#dcfce7',
                        color: isDoctor ? '#1d4ed8' : '#15803d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        flexShrink: 0
                      }}
                    >
                      {isDoctor ? '🩺' : '👤'}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isDoctor ? '#2563eb' : '#059669', marginRight: '6px' }}>
                        {line.speaker}:
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.45 }}>
                        {line.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {centerTab === 'AI Clinical Note' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>AI Extracted SOAP Draft</div>
              <div><strong>Subjective:</strong> Fever for 3 days, mild cough, body ache. No chest pain or dyspnea.</div>
              <div><strong>Objective:</strong> Bilateral vesicular breath sounds, no rales. Throat congested. Vitals stable.</div>
              <div><strong>Assessment:</strong> Acute Viral Upper Respiratory Tract Infection (J06.9). Known HTN & T2DM.</div>
              <div><strong>Plan:</strong> Paracetamol 650mg TDS x 3 days. Hydration. Review in 5 days.</div>
            </div>
          )}

          {centerTab === 'Summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff', fontSize: '0.78rem' }}>
              <div style={{ fontWeight: 800, color: '#6b21a8' }}>Consultation Executive Summary</div>
              <p style={{ color: '#4c1d95', lineHeight: 1.45, margin: 0 }}>
                34-year-old male present for evaluation of acute viral prodrome. Current baseline medications (Amlodipine, Metformin) to be continued without alteration. Symptomatic relief prescribed with Paracetamol.
              </p>
            </div>
          )}

          {centerTab === 'Action Items' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>Extracted Action Items</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span>Issue Paracetamol 650mg TDS x 3 days prescription</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span>Order CBC & CRP if fever persists &gt; 5 days</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span>Schedule follow-up review for 01 Oct 2026</span>
              </label>
            </div>
          )}

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center' }}>
            🎙️ Recording will be transcribed in real-time. Click "Generate Clinical Note" when finished.
          </div>
        </div>

        {/* Right Column: Generated Structured SOAP Note */}
        <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 800 }}>Generated Clinical Note (SOAP)</h3>
            <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
              <Edit2 size={12} />
              <span>Edit</span>
            </button>
          </div>

          {/* S */}
          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2563eb', marginBottom: '4px' }}>
              S • Subjective
            </div>
            <p style={{ fontSize: '0.75rem', color: '#334155', lineHeight: 1.4 }}>
              {mockGeneratedSOAP.subjective}
            </p>
          </div>

          {/* O */}
          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981', marginBottom: '4px' }}>
              O • Objective
            </div>
            <ul style={{ fontSize: '0.74rem', color: '#334155', paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {mockGeneratedSOAP.objective.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>

          {/* A */}
          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f59e0b', marginBottom: '4px' }}>
              A • Assessment
            </div>
            <ul style={{ fontSize: '0.74rem', color: '#334155', paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {mockGeneratedSOAP.assessment.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>

          {/* P */}
          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#8b5cf6', marginBottom: '4px' }}>
              P • Plan
            </div>
            <ul style={{ fontSize: '0.74rem', color: '#334155', paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {mockGeneratedSOAP.plan.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          {/* Note Bottom Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: 'auto', paddingTop: '6px' }}>
            <button className="btn-secondary" style={{ fontSize: '0.7rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('Copied to clipboard')}>
              <Copy size={12} />
              <span>Copy</span>
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.7rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('Note regenerated')}>
              <RotateCcw size={12} />
              <span>Regenerate</span>
            </button>
            <button className="btn-primary" style={{ fontSize: '0.7rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('Saved directly to Patient EMR')}>
              <Save size={12} />
              <span>Save to EMR</span>
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.7rem', padding: '6px', justifyContent: 'center' }} onClick={() => setActiveScreen('prescriptions')}>
              <FileSignature size={12} />
              <span>Prescribe</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Templates */}
      <div className="medios-card" style={{ padding: '14px' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 800, display: 'block', marginBottom: '10px' }}>
          Quick Templates
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {mockQuickTemplates.map(tpl => (
            <div
              key={tpl.id}
              onClick={() => showToast(`Applied ${tpl.title} template structure`)}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{tpl.title}</div>
              <div style={{ fontSize: '0.66rem', color: '#64748b' }}>{tpl.subtitle}</div>
            </div>
          ))}
          <div
            onClick={() => showToast('Create custom template builder')}
            style={{
              background: '#eff6ff',
              border: '1px dashed #bfdbfe',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb' }}>+ Custom Template</div>
            <div style={{ fontSize: '0.66rem', color: '#3b82f6' }}>Create your own</div>
          </div>
        </div>
      </div>
    </div>
  );
};
