import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PatientBanner } from '../layout/PatientBanner';
import { mockPrescriptionItems, mockMedicationTemplates, mockDrugAlternatives } from '../../mock/prescriptionsData';
import { PrescriptionItem } from '../../types';
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Share2,
  Send,
  Eye,
  FileSignature,
  FileText,
  AlertTriangle,
  Zap,
  MessageCircle,
  FolderOpen
} from 'lucide-react';

export const PrescriptionsScreen: React.FC = () => {
  const { activePatient, showToast } = useApp();
  const [items, setItems] = useState<PrescriptionItem[]>(mockPrescriptionItems);
  const [instructions, setInstructions] = useState(
    '• Take medicines as advised.\n• Maintain low salt diet.\n• Monitor blood pressure and blood sugar regularly.\n• Follow up after 2 weeks or earlier if symptoms persist.'
  );
  const [options, setOptions] = useState({
    printAdvice: true,
    includeDiagnosis: true,
    includeVitals: true,
    includeNextVisit: true,
    includeLabSummary: false
  });
  const [aiTab, setAiTab] = useState<'Suggestions' | 'Drug Interactions' | 'Alternatives' | 'Guidelines'>('Suggestions');
  const [showAddRow, setShowAddRow] = useState(false);
  const [newMedName, setNewMedName] = useState('');

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    showToast('Medicine removed from prescription');
  };

  const handleAddItem = () => {
    if (!newMedName) return;
    const newItem: PrescriptionItem = {
      id: `rx-${Date.now()}`,
      medicine: newMedName,
      dose: '500 mg',
      frequency: 'BD',
      duration: '14 days',
      route: 'Oral',
      instructions: 'After food',
      status: 'Active'
    };
    setItems([...items, newItem]);
    setNewMedName('');
    setShowAddRow(false);
    showToast(`Added ${newItem.medicine}`);
  };

  const handleSendWhatsApp = () => {
    showToast(`Digital Prescription sent via WhatsApp to ${activePatient?.name || 'patient'} (+91 98765 43210)!`, 'success');
  };

  return (
    <div className="page-scroll-body">
      <PatientBanner currentSubtab="prescriptions" />

      {/* Screen Title */}
      <div className="screen-header-row" style={{ marginTop: '4px' }}>
        <div className="screen-title-area">
          <h1 style={{ fontSize: '1.4rem' }}>Prescription</h1>
          <p>Create, manage and send prescriptions with AI assistance</p>
        </div>
      </div>

      {/* 3-Column Prescription Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1.5fr 1fr', gap: '20px' }}>
        {/* Left Column: Diagnoses, Previous Prescriptions & Templates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Diagnosis / Problems */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Diagnosis / Problems</span>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.7rem', padding: '2px 8px', color: '#2563eb' }}
                onClick={() => showToast('ICD-10 selector opened')}
              >
                + Add Diagnosis
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a' }}>I10</span>
                  <span style={{ fontSize: '0.74rem', color: '#334155', marginLeft: '6px' }}>Primary Hypertension</span>
                </div>
                <span style={{ fontSize: '0.66rem', padding: '1px 6px', borderRadius: '4px', background: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>
                  Chronic
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a' }}>E11.9</span>
                  <span style={{ fontSize: '0.74rem', color: '#334155', marginLeft: '6px' }}>Type 2 Diabetes Mellitus</span>
                </div>
                <span style={{ fontSize: '0.66rem', padding: '1px 6px', borderRadius: '4px', background: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>
                  Chronic
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a' }}>J06.9</span>
                  <span style={{ fontSize: '0.74rem', color: '#334155', marginLeft: '6px' }}>Acute Upper Respiratory Infection</span>
                </div>
                <span style={{ fontSize: '0.66rem', padding: '1px 6px', borderRadius: '4px', background: '#dcfce7', color: '#16a34a', fontWeight: 600 }}>
                  Acute
                </span>
              </div>
            </div>
          </div>

          {/* Previous Prescriptions */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Previous Prescriptions</span>
              <span style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>View All</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.76rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#eff6ff', padding: '8px', borderRadius: '6px' }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#1e3a8a' }}>• 26 Sep 2026</span>
                  <span style={{ color: '#64748b', marginLeft: '6px' }}>Follow-up</span>
                </div>
                <span style={{ color: '#2563eb', fontSize: '0.7rem' }}>5 medications</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px' }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#334155' }}>• 12 Sep 2026</span>
                  <span style={{ color: '#64748b', marginLeft: '6px' }}>Consultation</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '0.7rem' }}>4 medications</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px' }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#334155' }}>• 05 Aug 2026</span>
                  <span style={{ color: '#64748b', marginLeft: '6px' }}>Follow-up</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '0.7rem' }}>6 medications</span>
              </div>
            </div>
          </div>

          {/* Common Templates */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Common Templates</span>
              <span style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>Manage</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {mockMedicationTemplates.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => showToast(`Template "${tpl.title}" items loaded`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    fontSize: '0.76rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={14} color="#64748b" />
                    <span>{tpl.title}</span>
                  </div>
                  <span style={{ color: '#94a3b8' }}>•••</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Prescription Editor & Actions */}
        <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>New Prescription</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => showToast('Saved as template')}>
                Save as Template
              </button>
              <button
                className="btn-primary"
                style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#7e22ce' }}
                onClick={() => showToast('AI recommendations populated')}
              >
                <Sparkles size={14} />
                <span>AI Suggestion</span>
              </button>
            </div>
          </div>

          {/* Medicines Table */}
          <table className="medios-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ width: '20px' }}>#</th>
                <th>Medicine / Brand</th>
                <th>Dose</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Instructions</th>
                <th style={{ width: '40px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.medicine}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{item.brand || item.medicine}</div>
                  </td>
                  <td>
                    <select defaultValue={item.dose} style={{ padding: '3px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      <option>{item.dose}</option>
                      <option>2.5 mg</option>
                      <option>5 mg</option>
                      <option>10 mg</option>
                      <option>500 mg</option>
                      <option>650 mg</option>
                    </select>
                  </td>
                  <td>
                    <select defaultValue={item.frequency} style={{ padding: '3px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                      <option>OD</option>
                      <option>BD</option>
                      <option>TDS</option>
                      <option>HS</option>
                    </select>
                  </td>
                  <td>
                    <select defaultValue={item.duration} style={{ padding: '3px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      <option>{item.duration}</option>
                      <option>5 days</option>
                      <option>14 days</option>
                      <option>30 days</option>
                      <option>Continue</option>
                    </select>
                  </td>
                  <td>
                    <select defaultValue={item.instructions} style={{ padding: '3px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      <option>{item.instructions}</option>
                      <option>After food</option>
                      <option>Before food</option>
                      <option>At night</option>
                      <option>SOS (Fever)</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleDeleteItem(item.id)} style={{ color: '#ef4444' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {showAddRow && (
                <tr>
                  <td>+</td>
                  <td>
                    <input
                      type="text"
                      placeholder="e.g. Tab Pantocid 40mg"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td colSpan={4}>
                    <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.74rem' }} onClick={handleAddItem}>
                      Confirm Add
                    </button>
                  </td>
                  <td>
                    <button onClick={() => setShowAddRow(false)}>✕</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Action Row Under Table */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn-secondary" style={{ fontSize: '0.74rem' }} onClick={() => setShowAddRow(true)}>
              <Plus size={12} />
              <span>Add Medicine</span>
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.74rem' }} onClick={() => setShowAddRow(true)}>
              <Plus size={12} />
              <span>Add from Search</span>
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.74rem' }} onClick={() => showToast('Template items imported')}>
              <Plus size={12} />
              <span>Add from Template</span>
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.74rem', color: '#d97706' }} onClick={() => showToast('Checked: No dangerous drug interactions found')}>
              <Zap size={12} />
              <span>Check Interactions</span>
            </button>
          </div>

          {/* Additional Instructions */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Additional Instructions</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>131/500</span>
            </div>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#f8fafc' }}
            />
          </div>

          {/* Print Checkboxes */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.76rem', color: '#334155' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input type="checkbox" checked={options.printAdvice} onChange={(e) => setOptions({ ...options, printAdvice: e.target.checked })} />
              <span>Print Advice</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input type="checkbox" checked={options.includeDiagnosis} onChange={(e) => setOptions({ ...options, includeDiagnosis: e.target.checked })} />
              <span>Include Diagnosis</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input type="checkbox" checked={options.includeVitals} onChange={(e) => setOptions({ ...options, includeVitals: e.target.checked })} />
              <span>Include Vitals</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input type="checkbox" checked={options.includeNextVisit} onChange={(e) => setOptions({ ...options, includeNextVisit: e.target.checked })} />
              <span>Include Next Visit</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input type="checkbox" checked={options.includeLabSummary} onChange={(e) => setOptions({ ...options, includeLabSummary: e.target.checked })} />
              <span>Include Lab Summary</span>
            </label>
          </div>

          {/* Bottom Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" style={{ fontSize: '0.76rem' }} onClick={() => showToast('Prescription preview window')}>
                <Eye size={14} />
                <span>Preview</span>
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.76rem' }} onClick={() => showToast('Sent to pharmacy queue')}>
                <Send size={14} />
                <span>Send to Pharmacy</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {/* WhatsApp Button matching screenshot */}
              <button className="btn-whatsapp" onClick={handleSendWhatsApp}>
                <MessageCircle size={15} />
                <span>Send to Patient (WhatsApp)</span>
              </button>
              <button className="btn-primary" onClick={() => showToast('Prescription saved into patient records!')}>
                <FileSignature size={15} />
                <span>Save Prescription</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Assistant (GPT-6 Astro) & Vitals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* AI Clinical Assistant Card */}
          <div className="ai-assistant-card">
            <div className="ai-header-bar">
              <div className="ai-title-row">
                <Sparkles size={16} />
                <span>AI Clinical Assistant (GPT-6 Astro)</span>
              </div>
            </div>

            {/* Subtabs */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e9d5ff', paddingBottom: '4px' }}>
              {(['Suggestions', 'Drug Interactions', 'Alternatives', 'Guidelines'] as const).map(tab => (
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

            {/* Suggestions content */}
            {aiTab === 'Suggestions' && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7e22ce', marginBottom: '6px' }}>
                  AI Suggestions for this Patient
                </div>
                <ol style={{ fontSize: '0.74rem', color: '#475569', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Continue Amlodipine for BP control.</li>
                  <li>Metformin to be continued. Monitor HbA1c.</li>
                  <li>Consider Atorvastatin due to cardiovascular risk.</li>
                  <li>Add PPI (Pantoprazole) if gastric symptoms.</li>
                  <li>Paracetamol SOS for fever.</li>
                </ol>
                <button
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '8px', fontSize: '0.72rem', justifyContent: 'center' }}
                  onClick={() => showToast('AI Suggestions applied to prescription items')}
                >
                  Apply to Prescription
                </button>
              </div>
            )}

            {/* Drug Interaction Check Box */}
            {aiTab === 'Drug Interactions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 700, fontSize: '0.76rem' }}>
                    <CheckCircle2 size={14} />
                    <span>No Major Drug Interactions</span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#065f46', marginTop: '4px' }}>
                    Amlodipine + Metformin combination is well-tolerated. No cytochrome P450 contraindications.
                  </p>
                </div>
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '8px 10px', borderRadius: '6px', fontSize: '0.72rem', color: '#92400e' }}>
                  <strong>Food Instruction:</strong> Metformin should be taken with or immediately after meals to reduce gastrointestinal upset.
                </div>
              </div>
            )}

            {/* Suggested Alternatives */}
            {aiTab === 'Alternatives' && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7e22ce', marginBottom: '6px' }}>
                  ✦ Suggested Cost-Effective Alternatives
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.74rem', color: '#475569' }}>
                  {mockDrugAlternatives.map((alt, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span>{alt.original}</span>
                      <span style={{ fontWeight: 600, color: '#2563eb' }}>→ {alt.brand}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guidelines */}
            {aiTab === 'Guidelines' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.74rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7e22ce' }}>
                  ✦ Clinical Dosing Guidelines
                </div>
                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <strong>Amlodipine:</strong> Initial 5mg daily. Max 10mg. Dose adjustments not required in renal impairment.
                </div>
                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <strong>Metformin:</strong> Safe when eGFR &gt; 45 mL/min (Patient eGFR: 88 mL/min).
                </div>
              </div>
            )}
          </div>

          {/* Recent Vitals Card */}
          <div className="medios-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Recent Vitals</span>
              <span style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>View All</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              <div style={{ textAlign: 'center', background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>BP</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#dc2626' }}>140/90</div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>mmHg</div>
              </div>
              <div style={{ textAlign: 'center', background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>HR</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800 }}>86</div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>bpm</div>
              </div>
              <div style={{ textAlign: 'center', background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Temp</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800 }}>98.4</div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>°F</div>
              </div>
              <div style={{ textAlign: 'center', background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>SpO₂</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#059669' }}>98</div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
