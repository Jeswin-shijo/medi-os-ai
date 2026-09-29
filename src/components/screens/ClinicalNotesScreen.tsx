import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PatientBanner } from '../layout/PatientBanner';
import { mockVisitsTimeline } from '../../mock/consultationsData';
import {
  Plus,
  Search,
  Sparkles,
  Save,
  Send,
  FileCheck2,
  Download,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Activity
} from 'lucide-react';

export const ClinicalNotesScreen: React.FC = () => {
  const { activePatient, showToast, setActiveScreen } = useApp();
  const [selectedVisitId, setSelectedVisitId] = useState('v1');
  const [noteType, setNoteType] = useState<'SOAP' | 'Structured Form' | 'Free Text'>('SOAP');
  const [isFinal, setIsFinal] = useState(false);

  // SOAP State
  const [subjective, setSubjective] = useState(
    'Patient reports fever for 3 days associated with mild cough and body ache. No breathlessness. Appetite slightly reduced. No chest pain. Known case of hypertension and type 2 diabetes. No recent travel. No sick contacts.'
  );
  const [objective, setObjective] = useState(
    'General: Alert, oriented\nRS: Bilateral air entry present, no added sounds\nCVS: S1 S2 normal\nAbdomen: Soft, non-tender\nSpO2: 98%\nBP: 140/90 mmHg\nHR: 86 bpm'
  );
  const [assessment, setAssessment] = useState(
    'Acute respiratory infection (likely viral).\nKnown HTN and Type 2 DM – fair control.\nNo evidence of lower respiratory tract involvement at present.'
  );
  const [plan, setPlan] = useState(
    '• Tab Paracetamol 650 mg – TID for 3 days\n• Adequate fluids and rest\n• Continue current medications\n• Review if symptoms persist or worsen\n• Follow-up after 5 days'
  );
  const [icdCode, setIcdCode] = useState('J06.9 Acute upper respiratory infection');
  const [freeTextNote, setFreeTextNote] = useState(
    'CLINICAL ENCOUNTER NOTE - 26 SEP 2026\nPatient: Arun Kumar (34M) | UHID: MHK202500321\nDr. Shajin | General Medicine\n\nCHIEF COMPLAINTS:\n- Fever and generalized body aches for 3 days.\n- Mild dry cough, throat irritation.\n\nPHYSICAL EXAMINATION:\n- General: Well oriented, alert, no signs of distress.\n- Vitals: BP 140/90 mmHg, HR 86 bpm, SpO2 98%, Temp 98.4 F.\n- Chest: Clear air entry bilaterally, no crepitations or wheezing.\n- ENT: Pharyngeal erythema present without exudates.\n\nIMPRESSION:\n- Acute Viral Pharyngitis / Upper Respiratory Tract Infection.\n- Essential Hypertension & Type 2 Diabetes Mellitus - under continued therapy.\n\nRECOMMENDATIONS:\n1. Tab Paracetamol 650mg TID after food for 3 days.\n2. Hydration therapy and salt water gargles.\n3. Continue Amlodipine 5mg OD and Metformin 500mg BD.\n4. Follow-up after 5 days if fever persists or dyspnea develops.'
  );

  return (
    <div className="page-scroll-body">
      <PatientBanner currentSubtab="emr" />

      {/* Main 3 Column EMR Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1.4fr 1.1fr', gap: '20px' }}>
        {/* Left Column: Visits Timeline */}
        <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Visits</h4>
            <button
              className="btn-primary"
              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
              onClick={() => showToast('New clinical encounter started')}
            >
              <Plus size={12} />
              <span>New Note</span>
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={14} className="search-icon-left" />
            <input
              type="text"
              className="global-search-input"
              style={{ width: '100%', height: '32px', fontSize: '0.78rem' }}
              placeholder="Search visits..."
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '560px' }}>
            {mockVisitsTimeline.map((visit) => {
              const isSelected = selectedVisitId === visit.id;
              return (
                <div
                  key={visit.id}
                  onClick={() => setSelectedVisitId(visit.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{visit.date}</span>
                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: isSelected ? '#bfdbfe' : '#f1f5f9', color: '#1e3a8a', fontWeight: 600 }}>
                      {visit.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {visit.time} • {visit.doctor}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#334155', fontWeight: 500, marginTop: '2px' }}>
                    {visit.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Clinical Note Editor */}
        <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800 }}>Clinical Note – 26 Sep 2026 (09:15 AM)</h3>
              <span className="status-pill in-consultation">Follow-up</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['SOAP', 'Structured Form', 'Free Text'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setNoteType(tab as any)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    background: noteType === tab ? '#2563eb' : '#f1f5f9',
                    color: noteType === tab ? '#ffffff' : '#64748b'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* S, O, A, P Editor */}
          {noteType === 'SOAP' && (
            <>
              {/* S */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    <span style={{ color: '#2563eb', marginRight: '6px' }}>S</span> Subjective (Patient complaints & history)
                  </span>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '2px 8px', color: '#2563eb' }}
                    onClick={() => showToast('Voice consultation transcription copied to Subjective')}
                  >
                    <Sparkles size={12} />
                    <span>Use AI (Fill from conversation)</span>
                  </button>
                </div>
                <textarea
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#ffffff' }}
                />
              </div>

              {/* O */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    <span style={{ color: '#10b981', marginRight: '6px' }}>O</span> Objective (Examination findings, vitals)
                  </span>
                  <label style={{ fontSize: '0.72rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked />
                    <span>Fill from Vitals</span>
                  </label>
                </div>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#ffffff' }}
                />
              </div>

              {/* A */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    <span style={{ color: '#f59e0b', marginRight: '6px' }}>A</span> Assessment (Clinical impression / differential)
                  </span>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '2px 8px', color: '#2563eb' }}
                    onClick={() => showToast('AI suggested differential impression inserted')}
                  >
                    <Sparkles size={12} />
                    <span>Get AI Suggestions</span>
                  </button>
                </div>
                <textarea
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#ffffff' }}
                />
              </div>

              {/* P */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    <span style={{ color: '#8b5cf6', marginRight: '6px' }}>P</span> Plan (Investigations, treatment, advice, follow-up)
                  </span>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '2px 8px', color: '#2563eb' }}
                    onClick={() => showToast('AI Treatment plan loaded')}
                  >
                    <Sparkles size={12} />
                    <span>Use AI Plan</span>
                  </button>
                </div>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#ffffff' }}
                />
              </div>
            </>
          )}

          {/* Free Text Editor */}
          {noteType === 'Free Text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                  Unstructured Clinical Free Text Note
                </span>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '2px 8px', color: '#2563eb' }}
                  onClick={() => showToast('AI Clinical text auto-formatted')}
                >
                  <Sparkles size={12} />
                  <span>AI Auto-Format</span>
                </button>
              </div>
              <textarea
                value={freeTextNote}
                onChange={(e) => setFreeTextNote(e.target.value)}
                rows={16}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontFamily: 'monospace', lineHeight: 1.5, background: '#ffffff' }}
              />
            </div>
          )}

          {/* Structured Form */}
          {noteType === 'Structured Form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a' }}>Chief Complaint (Primary Concern)</label>
                <input
                  type="text"
                  defaultValue="Fever for 3 days, mild dry cough, body aches"
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '4px' }}
                />
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a' }}>Systemic Examination</label>
                <input
                  type="text"
                  defaultValue="RS: Bilateral clear, CVS: S1 S2 normal, P/A: Soft, non-tender"
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '4px' }}
                />
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a' }}>Provisional Clinical Impression</label>
                <input
                  type="text"
                  defaultValue="Acute Viral Pharyngitis / Upper Respiratory Infection"
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '4px' }}
                />
              </div>
            </div>
          )}

          {/* Additional details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Diagnosis (ICD-10)</label>
              <input
                type="text"
                value={icdCode}
                onChange={(e) => setIcdCode(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Consultation Type</label>
              <select style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px', background: '#ffffff' }}>
                <option>Follow-up</option>
                <option>New Consultation</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Visit Type</label>
              <select style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px', background: '#ffffff' }}>
                <option>OPD</option>
                <option>IPD</option>
              </select>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} />
                <span>Mark as Final</span>
              </label>
              <button className="btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => showToast('Draft note saved')}>
                Save as Draft
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => showToast('Discharge summary generated as PDF')}>
                <Download size={14} />
                <span>Generate Discharge Summary</span>
              </button>
              <button className="btn-primary" style={{ fontSize: '0.75rem' }} onClick={() => showToast('Encounter and note permanently stored in EMR')}>
                <Save size={14} />
                <span>+ Save to EMR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Assistant (GPT-6 Astro) */}
        <div className="ai-assistant-card">
          <div className="ai-header-bar">
            <div className="ai-title-row">
              <Sparkles size={18} />
              <span>AI Clinical Assistant (GPT-6 Astro)</span>
            </div>
          </div>

          {/* AI Suggested Clinical Note Box */}
          <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e9d5ff', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7e22ce' }}>
              ✦ AI Suggested Clinical Note
            </div>
            <div style={{ fontSize: '0.74rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: 1.4 }}>
              <div><strong>S:</strong> Fever for 3 days, mild cough, body ache, reduced appetite.</div>
              <div><strong>O:</strong> Vitals stable. SpO2 98%. RS – normal. CVS – normal.</div>
              <div><strong>A:</strong> Acute respiratory infection (likely viral). Known HTN and T2DM.</div>
              <div><strong>P:</strong> Symptomatic treatment, continue current medications, review after 5 days.</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                className="btn-primary"
                style={{ fontSize: '0.7rem', padding: '4px 10px', background: '#7e22ce' }}
                onClick={() => showToast('AI Clinical note inserted into SOAP workspace')}
              >
                Insert to Note
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                onClick={() => showToast('Note regenerated with alternate phrasing')}
              >
                Regenerate
              </button>
            </div>
          </div>

          {/* Clinical Considerations */}
          <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e9d5ff', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7e22ce' }}>
              ✦ Clinical Considerations
            </div>
            <ol style={{ fontSize: '0.74rem', color: '#475569', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Acute upper respiratory infection:</strong> Consider viral etiology. Review if symptoms worsen.</li>
              <li><strong>Evaluate need for investigation:</strong> Consider CBC, CRP, Chest X-Ray if &gt; 5 days.</li>
              <li><strong>Review chronic conditions:</strong> Ensure BP and sugar control. Check medication adherence.</li>
            </ol>
          </div>

          {/* Relevant Guidelines (Hospital SOP) */}
          <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e9d5ff', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7e22ce' }}>
              ✦ Relevant Guidelines (Hospital SOP)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.74rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 600 }}>
                <CheckCircle2 size={14} />
                <span>Acute Respiratory Infection – SOP GM 4.2</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 600 }}>
                <CheckCircle2 size={14} />
                <span>Management of Hypertension – SOP GM 3.1</span>
              </div>
            </div>
          </div>

          {/* Bottom query input */}
          <div className="ai-prompt-box" style={{ marginTop: 'auto' }}>
            <input
              type="text"
              className="ai-prompt-input"
              placeholder="Ask anything about this patient..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') showToast('GPT-6 Astro: Analysis correlated with Hospital SOP');
              }}
            />
            <button className="ai-send-btn" onClick={() => showToast('GPT-6 Astro: Analysis correlated with Hospital SOP')}>
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Horizontal Context Bar (Vitals, Meds, Labs, Imaging) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a' }}>Vitals (26 Sep 2026 09:15 AM)</span>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '0.74rem' }}>
            <div>BP: <strong style={{ color: '#dc2626' }}>140/90</strong></div>
            <div>HR: <strong>86</strong></div>
            <div>Temp: <strong>98.4</strong></div>
            <div>SpO2: <strong style={{ color: '#059669' }}>98%</strong></div>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a' }}>Current Medications</span>
          <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '4px' }}>
            Amlodipine 5mg • Metformin 500mg • Atorvastatin 10mg
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a' }}>Recent Lab Reports</span>
          <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '4px' }}>
            HbA1c: <span style={{ color: '#dc2626', fontWeight: 700 }}>7.8%</span> • Hb: <span style={{ color: '#dc2626' }}>10.4</span> • WBC: 10,900
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a' }}>Recent Imaging</span>
          <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '4px' }}>
            Chest X-Ray (12 Sep – Normal) • USG Abdomen
          </div>
        </div>
      </div>
    </div>
  );
};
