import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PatientBanner } from '../layout/PatientBanner';
import { SoapNote, PrescriptionItem } from '../../types';
import { consultationService, prescriptionService } from '../../services';
import {
  Sparkles,
  Save,
  Send,
  Trash2,
  Plus,
  Printer,
  CheckCircle2,
  FileCheck,
  Share2,
  ExternalLink
} from 'lucide-react';

export const ConsultationScreen: React.FC = () => {
  const { activePatient, showToast, setActiveScreen } = useApp();
  const [soapNote, setSoapNote] = useState<SoapNote | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [aiTab, setAiTab] = useState<'Clinical Suggestions' | 'Report Analysis' | 'Guidelines' | 'Patient Insights'>('Clinical Suggestions');
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatResponse, setAiChatResponse] = useState<string | null>(null);

  // New Medicine inline form
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('650 mg');
  const [newMedFreq, setNewMedFreq] = useState<'OD' | 'BD' | 'TDS' | 'HS'>('TDS');
  const [newMedDuration, setNewMedDuration] = useState('3 Days');
  const [newMedInstruction, setNewMedInstruction] = useState<'After food' | 'Before food' | 'At night' | 'SOS (Fever)'>('After food');
  const [showAddMedRow, setShowAddMedRow] = useState(false);

  useEffect(() => {
    if (activePatient) {
      consultationService.getSoapNote(activePatient.uhid).then(setSoapNote);
      prescriptionService.getPrescription(activePatient.uhid).then((rec) => {
        setPrescriptions(rec.items);
      });
    }
  }, [activePatient]);

  if (!soapNote) return <div className="page-scroll-body">Loading consultation session...</div>;

  const handleSaveToEMR = async () => {
    await consultationService.saveSoapNote(soapNote);
    showToast('Consultation SOAP Note saved to EMR successfully!');
  };

  const handleAddMedicine = async () => {
    if (!newMedName) return;
    const newItem: PrescriptionItem = {
      id: `rx-${Date.now()}`,
      medicine: newMedName,
      dose: newMedDose,
      frequency: newMedFreq,
      duration: newMedDuration,
      route: 'Oral',
      instructions: newMedInstruction,
      status: 'Active'
    };
    const updated = [...prescriptions, newItem];
    setPrescriptions(updated);
    setNewMedName('');
    setShowAddMedRow(false);
    showToast(`Added ${newItem.medicine} to prescription`);
  };

  const handleDeleteMedicine = (id: string) => {
    setPrescriptions(prev => prev.filter(p => p.id !== id));
    showToast('Medicine removed from prescription');
  };

  const handleApplyAISuggestion = (suggestionText: string) => {
    setSoapNote(prev => {
      if (!prev) return null;
      return {
        ...prev,
        plan: `${prev.plan}\n• [AI] ${suggestionText}`
      };
    });
    showToast('AI suggestion applied to Plan!');
  };

  const handleAIChat = (customQuery?: string) => {
    const q = customQuery || aiChatInput;
    if (!q) return;
    setAiChatInput(q);
    setAiChatResponse(`GPT-6 Astro: Patient Arun Kumar has chronic Grade 1 HTN (BP 140/90) and Type 2 Diabetes with recent HbA1c 7.8%. Given upper respiratory symptoms for 3 days without wheeze, current regimen of Paracetamol 650mg TDS + hydration is safe. Amlodipine & Metformin should continue uninterrupted.`);
  };

  return (
    <div className="page-scroll-body">
      {/* Patient Banner with cross subtabs */}
      <PatientBanner currentSubtab="consultation" />

      {/* 3-Column Consultation Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '290px 1.4fr 1.1fr', gap: '20px' }}>
        {/* Left Column: Patient Quick Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Vitals Widget */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h4 style={{ fontSize: '0.86rem', fontWeight: 700 }}>Vitals</h4>
                <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Today, 09:15 AM</p>
              </div>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                onClick={() => showToast('Vitals recorded: BP 140/90, HR 86, SpO2 98%')}
              >
                + Add Vitals
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              <div style={{ background: '#fef2f2', padding: '8px 4px', borderRadius: '6px', textAlign: 'center', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>BP</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#dc2626' }}>140/90</div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>mmHg</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px 4px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>HR</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>86</div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>bpm</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px 4px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Temp</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>98.4</div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>°F</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px 4px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>SpO₂</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#059669' }}>98</div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>%</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '8px' }}>
              <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Weight</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>78 <span style={{ fontSize: '0.6rem', color: '#64748b' }}>kg</span></div>
              </div>
              <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Height</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>172 <span style={{ fontSize: '0.6rem', color: '#64748b' }}>cm</span></div>
              </div>
              <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>BMI</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#d97706' }}>26.4</div>
                <div style={{ fontSize: '0.58rem', color: '#d97706' }}>(Overweight)</div>
              </div>
            </div>
          </div>

          {/* Current Medications */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '0.84rem', fontWeight: 700 }}>Current Medications</h4>
              <span
                style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setActiveScreen('medications')}
              >
                View All
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span>Amlodipine 5 mg (OD)</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '0.72rem' }}>1-0-0</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span>Metformin 500 mg (BD)</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '0.72rem' }}>1-0-1</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span>Atorvastatin 10 mg (OD)</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '0.72rem' }}>0-1-0</span>
              </div>
            </div>
          </div>

          {/* Recent Lab Results */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 700 }}>Recent Lab Results</h4>
                <p style={{ fontSize: '0.7rem', color: '#64748b' }}>12 Sep 2026</p>
              </div>
              <span
                style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setActiveScreen('lab-reports')}
              >
                View All
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.76rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>HbA1c</span>
                <span style={{ color: '#dc2626', fontWeight: 700 }}>7.8 % <span style={{ fontSize: '0.68rem', backgroundColor: '#fee2e2', padding: '1px 5px', borderRadius: '4px' }}>High</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Hemoglobin</span>
                <span style={{ color: '#dc2626', fontWeight: 700 }}>10.4 g/dL <span style={{ fontSize: '0.68rem', backgroundColor: '#fee2e2', padding: '1px 5px', borderRadius: '4px' }}>Low</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>WBC</span>
                <span style={{ color: '#d97706', fontWeight: 700 }}>10,900 /µL <span style={{ fontSize: '0.68rem', backgroundColor: '#fef3c7', padding: '1px 5px', borderRadius: '4px' }}>High</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Platelets</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>2.1 lakhs/µL <span style={{ fontSize: '0.68rem', backgroundColor: '#d1fae5', padding: '1px 5px', borderRadius: '4px' }}>Normal</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Creatinine</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>1.0 mg/dL <span style={{ fontSize: '0.68rem', backgroundColor: '#d1fae5', padding: '1px 5px', borderRadius: '4px' }}>Normal</span></span>
              </div>
            </div>
            <button
              className="btn-secondary"
              style={{ width: '100%', marginTop: '10px', fontSize: '0.74rem', justifyContent: 'center' }}
              onClick={() => setActiveScreen('lab-reports')}
            >
              Show More Reports
            </button>
          </div>

          {/* Recent Imaging */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '0.84rem', fontWeight: 700 }}>Recent Imaging</h4>
              <span
                style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setActiveScreen('imaging')}
              >
                View All
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                onClick={() => setActiveScreen('imaging')}
              >
                <img
                  src="https://images.unsplash.com/photo-1516549655169-df83a0774514?w=100&auto=format&fit=crop&q=80"
                  alt="Chest X-Ray"
                  style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Chest X-Ray</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>12 Sep 2026 • <span style={{ color: '#059669' }}>Normal</span></div>
                </div>
              </div>

              <div
                style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                onClick={() => setActiveScreen('imaging')}
              >
                <img
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=100&auto=format&fit=crop&q=80"
                  alt="USG Abdomen"
                  style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>USG Abdomen</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>21 Mar 2026 • <span style={{ color: '#d97706' }}>Fatty liver (mild)</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Consultation Workspace & Prescriptions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Workspace Container */}
          <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Top Workspace Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800 }}>Consultation Workspace</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.74rem' }}>
                  SOAP Note
                </button>
                <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.74rem' }}>
                  Previous Notes
                </button>
                <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.74rem' }}>
                  Templates
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.74rem', color: '#dc2626' }}
                  onClick={() => setActiveScreen('voice-to-notes')}
                >
                  Voice to Note 🔴 REC
                </button>
              </div>
            </div>

            {/* S - Subjective */}
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.76rem' }}>S</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>Subjective</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>(Chief Complaint, History of Present Illness)</span>
                </div>
                <button
                  className="btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '0.72rem', color: '#2563eb' }}
                  onClick={() => showToast('AI generated complaint summary from patient voice')}
                >
                  <Sparkles size={12} />
                  <span>AI Generate</span>
                </button>
              </div>
              <textarea
                value={soapNote.subjective}
                onChange={(e) => setSoapNote({ ...soapNote, subjective: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#ffffff', resize: 'vertical' }}
              />
            </div>

            {/* O - Objective */}
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.76rem' }}>O</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>Objective</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>(Examination Findings)</span>
                </div>
                <button
                  className="btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '0.72rem', color: '#2563eb' }}
                  onClick={() => showToast('Objective data populated from recorded vitals')}
                >
                  <Sparkles size={12} />
                  <span>Use AI Suggestions</span>
                </button>
              </div>
              <textarea
                value={soapNote.objective}
                onChange={(e) => setSoapNote({ ...soapNote, objective: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#ffffff', resize: 'vertical' }}
              />
            </div>

            {/* A - Assessment */}
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.76rem' }}>A</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>Assessment</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>(Clinical Impression)</span>
                </div>
                <button
                  className="btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '0.72rem', color: '#2563eb' }}
                  onClick={() => showToast('Assessment updated based on viral presentation')}
                >
                  <Sparkles size={12} />
                  <span>Use AI Suggestions</span>
                </button>
              </div>
              <textarea
                value={soapNote.assessment}
                onChange={(e) => setSoapNote({ ...soapNote, assessment: e.target.value })}
                rows={2}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#ffffff', resize: 'vertical' }}
              />
            </div>

            {/* P - Plan */}
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.76rem' }}>P</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>Plan</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>(Investigations, Treatment, Advice, Follow-up)</span>
                </div>
                <button
                  className="btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '0.72rem', color: '#2563eb' }}
                  onClick={() => showToast('Plan filled from ESC Clinical Guidelines')}
                >
                  <Sparkles size={12} />
                  <span>Use AI Suggestions</span>
                </button>
              </div>
              <textarea
                value={soapNote.plan}
                onChange={(e) => setSoapNote({ ...soapNote, plan: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#ffffff', resize: 'vertical' }}
              />
            </div>

            {/* SOAP Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" onClick={() => showToast('Draft saved')}>
                  Save as Draft
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setSoapNote({ ...soapNote, subjective: '', objective: '', assessment: '', plan: '' })}
                >
                  Clear
                </button>
              </div>
              <button className="btn-primary" onClick={handleSaveToEMR}>
                <Save size={16} />
                <span>+ Save to EMR</span>
              </button>
            </div>
          </div>

          {/* Inline Prescription Workspace */}
          <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800 }}>Prescription</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" style={{ fontSize: '0.74rem', padding: '4px 8px' }}>
                  + Add from Template
                </button>
                <select style={{ fontSize: '0.74rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                  <option>Common</option>
                  <option>Hypertension</option>
                  <option>Diabetes</option>
                </select>
              </div>
            </div>

            <table className="medios-table" style={{ fontSize: '0.78rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '20px' }}>#</th>
                  <th>Medicine</th>
                  <th>Dose</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Instruction</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx, idx) => (
                  <tr key={rx.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{rx.medicine}</td>
                    <td>{rx.dose}</td>
                    <td><span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{rx.frequency}</span></td>
                    <td>{rx.duration}</td>
                    <td style={{ color: '#64748b' }}>{rx.instructions}</td>
                    <td>
                      <button onClick={() => handleDeleteMedicine(rx.id)} style={{ color: '#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}

                {showAddMedRow && (
                  <tr>
                    <td>+</td>
                    <td>
                      <input
                        type="text"
                        placeholder="Medicine name"
                        value={newMedName}
                        onChange={(e) => setNewMedName(e.target.value)}
                        style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Dose"
                        value={newMedDose}
                        onChange={(e) => setNewMedDose(e.target.value)}
                        style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                    <td>
                      <select
                        value={newMedFreq}
                        onChange={(e) => setNewMedFreq(e.target.value as any)}
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      >
                        <option>OD</option>
                        <option>BD</option>
                        <option>TDS</option>
                        <option>HS</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Duration"
                        value={newMedDuration}
                        onChange={(e) => setNewMedDuration(e.target.value)}
                        style={{ width: '65px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                    <td>
                      <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={handleAddMedicine}>
                        Add
                      </button>
                    </td>
                    <td>
                      <button onClick={() => setShowAddMedRow(false)} style={{ color: '#64748b' }}>
                        ✕
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" style={{ fontSize: '0.74rem' }} onClick={() => setShowAddMedRow(true)}>
                  <Plus size={14} />
                  <span>Add Medicine</span>
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.74rem' }}
                  onClick={() => showToast('Checked: No severe drug interactions detected')}
                >
                  <FileCheck size={14} />
                  <span>Check Interactions</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.74rem' }}
                  onClick={() => showToast('Prescription sent to hospital pharmacy queue')}
                >
                  <Printer size={14} />
                  <span>Print Prescription</span>
                </button>
                <button
                  className="btn-primary"
                  style={{ fontSize: '0.74rem' }}
                  onClick={() => showToast('Prescription sent directly to pharmacy dispensary')}
                >
                  Send to Pharmacy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Clinical Assistant (GPT-6 Astro) */}
        <div className="ai-assistant-card" style={{ gap: '14px' }}>
          {/* Header */}
          <div className="ai-header-bar">
            <div className="ai-title-row">
              <Sparkles size={18} />
              <span>AI Clinical Assistant (GPT-6 Astro)</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#7e22ce', cursor: 'pointer', fontWeight: 600 }}>
              Ask AI
            </span>
          </div>

          {/* AI Tabs */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e9d5ff', paddingBottom: '4px' }}>
            {(['Clinical Suggestions', 'Report Analysis', 'Guidelines', 'Patient Insights'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setAiTab(tab)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '3px 6px',
                  borderRadius: '4px',
                  background: aiTab === tab ? '#7e22ce' : 'transparent',
                  color: aiTab === tab ? '#ffffff' : '#7e22ce'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content: Clinical Considerations */}
          {aiTab === 'Clinical Suggestions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b21a8' }}>
                ✦ Clinical Considerations
              </div>

              {/* Consideration 1 */}
              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                    1. Acute upper respiratory infection
                  </span>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '2px 8px', color: '#2563eb' }}
                    onClick={() => handleApplyAISuggestion('Acute upper respiratory infection consideration applied')}
                  >
                    Apply
                  </button>
                </div>
                <ul style={{ fontSize: '0.74rem', color: '#475569', paddingLeft: '14px', lineHeight: 1.4 }}>
                  <li>Fever, cough, body ache for 3 days. Consider viral etiology.</li>
                  <li>Review for red flags: persistent fever, breathlessness.</li>
                </ul>
              </div>

              {/* Consideration 2 */}
              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                    2. Evaluate need for further investigation
                  </span>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '2px 8px', color: '#2563eb' }}
                    onClick={() => handleApplyAISuggestion('If symptoms persist > 5 days consider CBC, CRP, Chest X-Ray')}
                  >
                    Apply
                  </button>
                </div>
                <p style={{ fontSize: '0.74rem', color: '#475569' }}>
                  If symptoms persist &gt; 5 days, consider CBC, CRP, Chest X-ray.
                </p>
              </div>

              {/* Suggested Investigations */}
              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b21a8' }}>
                    ✦ Suggested Investigations
                  </span>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '2px 8px', color: '#2563eb' }}
                    onClick={() => handleApplyAISuggestion('Order CBC, CRP, Chest X-Ray if needed')}
                  >
                    + Add to Plan
                  </button>
                </div>
                <ul style={{ fontSize: '0.74rem', color: '#475569', paddingLeft: '14px' }}>
                  <li>CBC</li>
                  <li>CRP (if indicated)</li>
                  <li>Chest X-Ray (if symptoms persist)</li>
                </ul>
              </div>

              {/* Suggested Treatment Plan */}
              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b21a8' }}>
                    ✦ Suggested Treatment Plan
                  </span>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '2px 8px', color: '#2563eb' }}
                    onClick={() => handleApplyAISuggestion('Symptomatic treatment, review in 5 days')}
                  >
                    + Add to Plan
                  </button>
                </div>
                <ul style={{ fontSize: '0.74rem', color: '#475569', paddingLeft: '14px' }}>
                  <li>Symptomatic treatment</li>
                  <li>Review after 5 days</li>
                </ul>
              </div>

              {/* Patient Education Points */}
              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b21a8' }}>
                    ✦ Patient Education Points
                  </span>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '2px 8px', color: '#2563eb' }}
                    onClick={() => showToast('Education points sent to Arun Kumar via SMS/WhatsApp')}
                  >
                    Send to Patient
                  </button>
                </div>
                <ul style={{ fontSize: '0.74rem', color: '#475569', paddingLeft: '14px' }}>
                  <li>Adequate fluids and rest</li>
                  <li>Mask if in public places</li>
                  <li>Seek medical attention if fever persists, breathlessness or chest pain</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab Content: Report Analysis */}
          {aiTab === 'Report Analysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b21a8' }}>
                ✦ Diagnostic Synthesis & Lab Trends
              </div>
              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626' }}>
                  Glycemic Marker Elevation (HbA1c: 7.8%)
                </span>
                <p style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.45 }}>
                  HbA1c increased from 7.2% to 7.8% over last 6 months. Fasting blood sugar at 134 mg/dL. Consider titrating Metformin or adding SGLT2 inhibitor.
                </p>
                <button
                  className="btn-secondary"
                  style={{ alignSelf: 'flex-start', fontSize: '0.7rem', padding: '2px 8px', color: '#2563eb' }}
                  onClick={() => handleApplyAISuggestion('Assessment note: Sub-optimal glycemic control noted (HbA1c 7.8%)')}
                >
                  Insert into Assessment
                </button>
              </div>

              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669' }}>
                  Chest X-Ray Correlation
                </span>
                <p style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.45 }}>
                  12 Sep 2026 PA view shows clear lung fields and normal cardiac size. Lower respiratory tract infection is unlikely given current non-productive cough.
                </p>
              </div>
            </div>
          )}

          {/* Tab Content: Guidelines */}
          {aiTab === 'Guidelines' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b21a8' }}>
                ✦ Applicable Clinical Practice Guidelines
              </div>
              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                    ADA Standards of Care in Diabetes (2026)
                  </span>
                  <span style={{ fontSize: '0.66rem', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Class I</span>
                </div>
                <p style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.45 }}>
                  Target HbA1c &lt; 7.0% for non-pregnant adults without significant hypoglycemia. Routine microalbuminuria screening recommended annually.
                </p>
              </div>

              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                    ACC/AHA Hypertension Guidelines
                  </span>
                  <span style={{ fontSize: '0.66rem', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Class I</span>
                </div>
                <p style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.45 }}>
                  Target BP &lt; 130/80 mmHg in patients with confirmed Diabetes Mellitus. Continue Amlodipine 5mg; monitor sodium intake.
                </p>
              </div>
            </div>
          )}

          {/* Tab Content: Patient Insights */}
          {aiTab === 'Patient Insights' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b21a8' }}>
                ✦ Longitudinal Patient Insights
              </div>
              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                  Medication Adherence
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '92%', height: '100%', background: '#10b981' }} />
                  </div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669' }}>92% High</span>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#64748b' }}>Regular refills on Amlodipine and Metformin.</p>
              </div>

              <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b45309' }}>
                  Critical Allergy Reminder
                </span>
                <p style={{ fontSize: '0.74rem', color: '#92400e' }}>
                  Allergic to <strong>Penicillin</strong>. Avoid Amoxicillin, Ampicillin, Augmentin. Macrolides or Fluoroquinolones safe if antibiotics required.
                </p>
              </div>
            </div>
          )}

          {/* AI Response Display */}
          {aiChatResponse && (
            <div style={{ padding: '10px', borderRadius: '8px', background: '#faf5ff', border: '1px solid #d8b4fe', fontSize: '0.75rem', color: '#581c87', lineHeight: 1.4 }}>
              {aiChatResponse}
            </div>
          )}

          {/* Interactive Chat Input */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="ai-prompt-box">
              <input
                type="text"
                className="ai-prompt-input"
                placeholder="Ask anything about this patient..."
                value={aiChatInput}
                onChange={(e) => setAiChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAIChat()}
              />
              <button className="ai-send-btn" onClick={() => handleAIChat()}>
                <Send size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.7rem', padding: '4px', justifyContent: 'center' }}
                onClick={() => handleAIChat('Compare with previous visit')}
              >
                Compare with previous visit
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.7rem', padding: '4px', justifyContent: 'center' }}
                onClick={() => handleAIChat('Explain this lab report')}
              >
                Explain this lab report
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.7rem', padding: '4px', justifyContent: 'center' }}
                onClick={() => handleAIChat('What to consider?')}
              >
                What to consider?
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.7rem', padding: '4px', justifyContent: 'center' }}
                onClick={() => handleAIChat('Generate discharge summary')}
              >
                Generate discharge summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
