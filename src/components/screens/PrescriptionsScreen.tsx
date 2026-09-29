import React, { useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { PatientBanner, type BannerTab } from '../layout/PatientBanner';
import { ScreenHeader } from '../common/ScreenHeader';
import { AiSparkle } from '../common/icons';
import { mockPrescriptionItems, mockMedicationTemplates, mockDrugAlternatives } from '../../mock/prescriptionsData';
import type { PrescriptionItem } from '../../types';
import {
  Plus,
  Trash2,
  CircleCheck,
  Circle,
  ChevronDown,
  EllipsisVertical,
  Eye,
  Send,
  Save,
  SquarePlus,
  Sparkle,
  Zap,
  FileText,
  ArrowRight,
  X,
  SquareActivity,
  CircleArrowDown,
  Piano,
  CircleDot,
  Cross,
  MessageSquareText,
  CircleX,
  HousePlus,
  Phone
} from 'lucide-react';

/* Tab strip from the Prescription design; module tabs navigate, Patient Education is local. */
const RX_TABS: BannerTab[] = [
  { id: 'emr', label: 'Clinical Notes', icon: SquareActivity, screen: 'emr' },
  { id: 'vitals', label: 'Vitals', icon: CircleArrowDown, screen: 'vitals' },
  { id: 'lab-reports', label: 'Lab Reports', icon: FileText, screen: 'lab-reports' },
  { id: 'imaging', label: 'Imaging', icon: Piano, screen: 'imaging' },
  { id: 'prescriptions', label: 'Prescription', icon: CircleDot, screen: 'prescriptions' },
  { id: 'medications', label: 'Medications', icon: Cross, screen: 'medications' },
  { id: 'documents', label: 'Documents', icon: MessageSquareText, screen: 'documents' },
  { id: 'follow-ups', label: 'Follow-ups', icon: CircleX, screen: 'follow-ups' },
  { id: 'patient-education', label: 'Patient Education', icon: HousePlus }
];

const DIAGNOSES = [
  { code: 'I10', name: 'Primary Hypertension', type: 'Chronic' },
  { code: 'E11.9', name: 'Type 2 Diabetes Mellitus', type: 'Chronic' },
  { code: 'J06.9', name: 'Acute Upper Respiratory Infection', type: 'Acute' }
];

const PREVIOUS_RX = [
  { id: 'prx-1', date: '26 Sep 2026', type: 'Follow-up', meds: 5, color: 'var(--blue-primary)', filled: true },
  { id: 'prx-2', date: '12 Sep 2026', type: 'Consultation', meds: 4, color: 'var(--orange-amber)', filled: false },
  { id: 'prx-3', date: '05 Aug 2026', type: 'Follow-up', meds: 6, color: 'var(--green-emerald)', filled: true },
  { id: 'prx-4', date: '10 Jun 2026', type: 'Consultation', meds: 4, color: 'var(--red-rose)', filled: true }
];

const AI_SUGGESTIONS = [
  'Continue Amlodipine for BP control.',
  'Metformin to be continued. Monitor HbA1c.',
  'Consider Atorvastatin due to cardiovascular risk.',
  'Add PPI (Pantoprazole) if gastric symptoms.',
  'Paracetamol SOS for fever.'
];

const AI_TABS = ['Suggestions', 'Drug Interactions', 'Alternatives', 'Guidelines'] as const;
type AiTab = (typeof AI_TABS)[number];

const DOSE_OPTIONS = ['2.5 mg', '5 mg', '10 mg', '40 mg', '500 mg', '650 mg', '1 g', '5 ml', '10 ml'];
const FREQ_OPTIONS: PrescriptionItem['frequency'][] = ['OD', 'BD', 'TDS', 'QID', 'HS', 'SOS'];
const DURATION_OPTIONS = ['3 days', '5 days', '7 days', '14 days', '30 days', '60 days', '90 days', 'Continue'];
const INSTRUCTION_OPTIONS: PrescriptionItem['instructions'][] = ['After food', 'Before food', 'At night', 'SOS (Fever)', 'With warm water'];

const VITALS = [
  { label: 'BP', value: '140/90', unit: 'mmHg', alert: true },
  { label: 'HR', value: '86', unit: 'bpm' },
  { label: 'Temp', value: '98.4', unit: '°F' },
  { label: 'SpO₂', value: '98', unit: '%' }
];

const genericName = (item: PrescriptionItem) => (item.brand ?? item.medicine).replace(/\s+\d[\d.]*\s*(mg|ml|g)\b.*$/i, '');

/* WhatsApp mark: green bubble with a white handset. */
const WhatsAppMark: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <span style={{ width: size, height: size, borderRadius: '50%', background: '#25d366', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <Phone size={size * 0.55} color="#ffffff" fill="#ffffff" strokeWidth={0} />
  </span>
);

/* Compact select with a chevron, as in the prescription table. */
const CellSelect: React.FC<{ value: string; options: readonly string[]; onChange: (v: string) => void; width?: number | string; label: string }> = ({
  value,
  options,
  onChange,
  width = '100%',
  label
}) => {
  const list = options.includes(value) ? options : [value, ...options];
  return (
    <div style={{ position: 'relative', width }}>
      <select
        aria-label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          height: 30,
          padding: '0 20px 0 7px',
          appearance: 'none',
          border: '1px solid var(--border-color)',
          borderRadius: 5,
          background: '#ffffff',
          fontSize: 11.5,
          color: 'var(--text-primary)',
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        {list.map(o => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={13} strokeWidth={2} style={{ position: 'absolute', right: 6, top: 9, pointerEvents: 'none' }} />
    </div>
  );
};

const smallCardTitle: React.CSSProperties = { fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em' };

export const PrescriptionsScreen: React.FC = () => {
  const { activePatient, showToast } = useApp();
  const [items, setItems] = useState<PrescriptionItem[]>(mockPrescriptionItems);
  const [instructions, setInstructions] = useState(
    '•  Take medicines as advised.\n•  Maintain low salt diet.\n•  Monitor blood pressure and blood sugar regularly.\n•  Follow up after 2 weeks or earlier if symptoms persist.'
  );
  const [options, setOptions] = useState({
    printAdvice: true,
    includeDiagnosis: true,
    includeVitals: true,
    includeNextVisit: true,
    includeLabSummary: false
  });
  const [aiTab, setAiTab] = useState<AiTab>('Suggestions');
  const [showAddRow, setShowAddRow] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [consultType, setConsultType] = useState('Follow-up');
  const [selectedPrevRx, setSelectedPrevRx] = useState('prx-1');

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    showToast('Medicine removed from prescription');
  };

  const updateItem = (id: string, patch: Partial<PrescriptionItem>) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));
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
    showToast(`Digital Prescription sent via WhatsApp to ${activePatient?.name || 'patient'} (${activePatient?.phone ?? '+91 98765 43210'})!`, 'success');
  };

  const optionLabels: { key: keyof typeof options; label: string }[] = [
    { key: 'printAdvice', label: 'Print Advice' },
    { key: 'includeDiagnosis', label: 'Include Diagnosis' },
    { key: 'includeVitals', label: 'Include Vitals' },
    { key: 'includeNextVisit', label: 'Include Next Visit' },
    { key: 'includeLabSummary', label: 'Include Lab Summary' }
  ];

  const th: React.CSSProperties = { fontSize: 11, padding: '7px 4px', border: 'none', background: 'var(--bg-subtle)' };
  const td: React.CSSProperties = { padding: '9px 4px', borderBottom: '1px solid var(--border-subtle)' };
  const barBtn: React.CSSProperties = { height: 38, fontSize: 11, padding: '0 9px', gap: 6 };

  return (
    <div className="page-scroll-body">
      <ScreenHeader title="Prescription" subtitle="Create, manage and send prescriptions with AI assistance" />

      <PatientBanner
        metrics={[
          { label: 'Last Visit', value: activePatient?.lastVisit ?? '12 Sep 2026' },
          { label: "Today's Visit", value: '26 Sep 2026', sub: '09:15 AM' },
          { label: 'Department', value: activePatient?.department ?? 'General Medicine' }
        ]}
        action={null}
        extra={
          <div className="metric-column" style={{ minWidth: 210, border: 'none', borderLeft: '1px solid var(--border-color)', borderRadius: 0 }}>
            <span className="metric-label">Consultation Type</span>
            <select
              className="form-select"
              aria-label="Consultation Type"
              value={consultType}
              onChange={e => {
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
        tabs={RX_TABS}
        activeTab="prescriptions"
        onTabChange={id => id === 'patient-education' && showToast('Patient education leaflets: Hypertension, Diabetes diet', 'info')}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '308px minmax(0, 1fr) 366px', gap: 10, alignItems: 'stretch' }}>
        {/* ===== Left column ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          {/* Diagnosis / Problems */}
          <div className="medios-card" style={{ padding: '10px 10px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={smallCardTitle}>Diagnosis / Problems</span>
              <button className="btn-outline-blue btn-sm" style={{ fontSize: 'var(--fs-xs)', fontWeight: 400, gap: 6 }} onClick={() => showToast('ICD-10 selector opened')}>
                <Plus size={14} />
                <span>Add Diagnosis</span>
              </button>
            </div>
            <div style={{ marginTop: 6 }}>
              {DIAGNOSES.map((d, i) => (
                <div
                  key={d.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    height: 42,
                    padding: '0 4px',
                    borderTop: '1px solid var(--border-subtle)',
                    borderBottom: i === DIAGNOSES.length - 1 ? 'none' : undefined,
                    fontSize: 11.5
                  }}
                >
                  <span style={{ fontWeight: 700, minWidth: 30 }}>{d.code}</span>
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
                  <span className={`status-pill ${d.type === 'Chronic' ? 'red' : 'green'}`} style={{ height: 21, fontSize: 'var(--fs-xs)' }}>{d.type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Prescriptions */}
          <div className="medios-card" style={{ padding: '10px 10px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={smallCardTitle}>Previous Prescriptions</span>
              <button className="text-link" style={{ fontSize: 'var(--fs-sm)', fontWeight: 400 }} onClick={() => showToast('Opening prescription history', 'info')}>
                View All
              </button>
            </div>
            <div style={{ marginTop: 8 }}>
              {PREVIOUS_RX.map(rx => {
                const selected = selectedPrevRx === rx.id;
                return (
                  <div
                    key={rx.id}
                    onClick={() => {
                      setSelectedPrevRx(rx.id);
                      showToast(`${rx.type} prescription of ${rx.date} (${rx.meds} medications)`, 'info');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      height: 48,
                      padding: '0 12px',
                      cursor: 'pointer',
                      borderRadius: selected ? 6 : 0,
                      background: selected ? '#e6effd' : 'transparent',
                      boxShadow: selected ? 'inset 2px 0 0 var(--blue-primary)' : 'none',
                      borderBottom: selected ? '1px solid transparent' : '1px solid var(--border-subtle)'
                    }}
                  >
                    {rx.filled ? (
                      <CircleCheck size={14} fill={rx.color} color="#ffffff" strokeWidth={2.4} style={{ flexShrink: 0 }} />
                    ) : (
                      <Circle size={12} color={rx.color} strokeWidth={3.4} style={{ flexShrink: 0, margin: 1 }} />
                    )}
                    <div style={{ lineHeight: 1.4, fontSize: 'var(--fs-sm)' }}>
                      <div style={{ display: 'flex', gap: 14 }}>
                        <span style={{ fontWeight: 600, minWidth: 74 }}>{rx.date}</span>
                        <span>{rx.type}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>{rx.meds} medications</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Common Templates */}
          <div className="medios-card" style={{ padding: '10px 10px 10px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={smallCardTitle}>Common Templates</span>
              <button className="text-link" style={{ fontSize: 'var(--fs-sm)', fontWeight: 400 }} onClick={() => showToast('Template manager opened', 'info')}>
                Manage
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 8 }}>
              {mockMedicationTemplates.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => showToast(`Template "${tpl.title}" items loaded`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    height: 34,
                    padding: '0 8px 0 12px',
                    border: '1px solid var(--border-subtle)',
                    marginTop: -1,
                    cursor: 'pointer',
                    fontSize: 'var(--fs-sm)'
                  }}
                >
                  <FileText size={15} strokeWidth={1.9} />
                  <span style={{ flex: 1 }}>{tpl.title}</span>
                  <button
                    aria-label={`${tpl.title} options`}
                    onClick={e => {
                      e.stopPropagation();
                      showToast(`Edit, duplicate or delete "${tpl.title}"`, 'info');
                    }}
                    style={{ color: 'var(--blue-text)', display: 'flex' }}
                  >
                    <EllipsisVertical size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Center: New Prescription ===== */}
        <div className="medios-card" style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <h3 style={{ fontSize: 'var(--fs-h2)', fontWeight: 700 }}>New Prescription</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-outline-blue" style={{ fontSize: 'var(--fs-sm)' }} onClick={() => showToast('Saved as template')}>
                <SquarePlus size={16} />
                <span>Save as Template</span>
              </button>
              <button className="btn-ai" style={{ fontSize: 'var(--fs-sm)', background: 'var(--purple-ai)', borderColor: 'var(--purple-ai)' }} onClick={() => showToast('AI recommendations populated')}>
                <Sparkle size={15} />
                <span>AI Suggestion</span>
              </button>
            </div>
          </div>

          <table className="medios-table" style={{ marginTop: 14, tableLayout: 'fixed', fontSize: 11.5 }}>
            <colgroup>
              <col style={{ width: 24 }} />
              <col />
              <col style={{ width: 78 }} />
              <col style={{ width: 72 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 46 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...th, borderRadius: '6px 0 0 6px', paddingLeft: 8 }}>#</th>
                <th style={th}>Medicine / Brand</th>
                <th style={th}>Dose</th>
                <th style={th}>Frequency</th>
                <th style={th}>Duration</th>
                <th style={th}>Instructions</th>
                <th style={{ ...th, borderRadius: '0 6px 6px 0', textAlign: 'right', paddingRight: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ ...td, paddingLeft: 8, fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ ...td, lineHeight: 1.4 }}>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.medicine}</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 1 }}>{genericName(item)}</div>
                  </td>
                  <td style={td}>
                    <CellSelect label="Dose" value={item.dose} options={DOSE_OPTIONS} onChange={v => updateItem(item.id, { dose: v })} />
                  </td>
                  <td style={td}>
                    <CellSelect label="Frequency" value={item.frequency} options={FREQ_OPTIONS} onChange={v => updateItem(item.id, { frequency: v as PrescriptionItem['frequency'] })} />
                  </td>
                  <td style={td}>
                    <CellSelect label="Duration" value={item.duration} options={DURATION_OPTIONS} onChange={v => updateItem(item.id, { duration: v })} />
                  </td>
                  <td style={td}>
                    <CellSelect label="Instructions" value={item.instructions} options={INSTRUCTION_OPTIONS} onChange={v => updateItem(item.id, { instructions: v as PrescriptionItem['instructions'] })} />
                  </td>
                  <td style={{ ...td, textAlign: 'right', paddingRight: 10 }}>
                    <button aria-label={`Remove ${item.medicine}`} onClick={() => handleDeleteItem(item.id)} style={{ color: 'var(--red-rose)', display: 'inline-flex' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {showAddRow && (
                <tr>
                  <td style={{ ...td, paddingLeft: 8 }}>+</td>
                  <td style={td} colSpan={3}>
                    <input
                      type="text"
                      className="input-field"
                      autoFocus
                      placeholder="e.g. Tab Pantocid 40 mg"
                      value={newMedName}
                      onChange={e => setNewMedName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                      style={{ height: 30, fontSize: 11.5 }}
                    />
                  </td>
                  <td style={td} colSpan={2}>
                    <button className="btn-primary btn-sm" onClick={handleAddItem}>
                      Confirm Add
                    </button>
                  </td>
                  <td style={{ ...td, textAlign: 'right', paddingRight: 10 }}>
                    <button aria-label="Cancel" onClick={() => setShowAddRow(false)} style={{ display: 'inline-flex' }}>
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Actions under the table */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {[
              { label: 'Add Medicine', onClick: () => setShowAddRow(true) },
              { label: 'Add from Search', onClick: () => setShowAddRow(true) },
              { label: 'Add from Template', onClick: () => showToast('Template items imported') }
            ].map(b => (
              <button
                key={b.label}
                className="btn-outline-blue"
                style={{ flex: '1 1 auto', gap: 6, padding: '0 10px', fontSize: 11.5, background: b.label === 'Add Medicine' ? '#ffffff' : 'var(--bg-subtle)' }}
                onClick={b.onClick}
              >
                <Plus size={15} />
                <span>{b.label}</span>
              </button>
            ))}
            <button
              className="btn-secondary"
              style={{ flex: '1 1 auto', gap: 6, padding: '0 10px', fontSize: 11.5, color: 'var(--orange-dark)', background: 'var(--orange-light)', borderColor: 'transparent' }}
              onClick={() => showToast('Checked: No dangerous drug interactions found')}
            >
              <Zap size={15} color="var(--orange-amber)" />
              <span>Check Interactions</span>
            </button>
          </div>

          {/* Additional Instructions */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 7 }}>Additional Instructions</div>
            <div style={{ position: 'relative' }}>
              <textarea
                className="input-field"
                rows={4}
                maxLength={500}
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                style={{ minHeight: 0, height: 90, padding: '9px 16px 9px 22px', fontSize: 'var(--fs-sm)', lineHeight: 1.5, resize: 'none' }}
              />
              <span style={{ position: 'absolute', right: 12, bottom: 8, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                {instructions.length}/500
              </span>
            </div>
          </div>

          {/* Print options */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 12, fontSize: 'var(--fs-xs)' }}>
            {optionLabels.map(o => (
              <label key={o.key} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input
                  type="checkbox"
                  checked={options[o.key]}
                  onChange={e => setOptions({ ...options, [o.key]: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--blue-primary)', cursor: 'pointer' }}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>

          {/* Bottom action bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 16 }}>
            <button className="btn-outline-blue" style={{ ...barBtn, padding: '0 13px' }} onClick={() => showToast('Prescription preview window')}>
              <Eye size={15} />
              <span>Preview</span>
            </button>
            <button className="btn-outline-blue" style={barBtn} onClick={() => showToast('Sent to pharmacy queue')}>
              <Send size={15} />
              <span>Send to Pharmacy</span>
            </button>
            <button className="btn-whatsapp" style={{ ...barBtn, color: '#138a43', borderColor: '#cfe9d9' }} onClick={handleSendWhatsApp}>
              <WhatsAppMark size={16} />
              <span>Send to Patient (WhatsApp)</span>
            </button>
            <button className="btn-primary" style={{ ...barBtn, marginLeft: 'auto' }} onClick={() => showToast('Prescription saved into patient records!')}>
              <Save size={15} />
              <span>Save Prescription</span>
            </button>
          </div>
        </div>

        {/* ===== Right: AI assistant + vitals ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <div className="ai-assistant-card" style={{ padding: '10px 10px 10px', gap: 10 }}>
            <div className="ai-header-bar">
              <div className="ai-title-row" style={{ fontSize: 14.5, gap: 8, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                <AiSparkle size={20} />
                <span>AI Clinical Assistant (GPT-6 Astro)</span>
              </div>
              <button aria-label="Assistant options" onClick={() => showToast('Assistant settings', 'info')} style={{ display: 'flex', color: 'var(--blue-text)' }}>
                <EllipsisVertical size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              {AI_TABS.map(tab => (
                <button
                  key={tab}
                  className={`page-tab-btn ${aiTab === tab ? 'active' : ''}`}
                  style={{ flex: 1, height: 30, padding: '0 6px', justifyContent: 'center', fontSize: 11 }}
                  onClick={() => setAiTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {aiTab === 'Suggestions' && (
              <div className="ai-section" style={{ padding: '8px 10px 10px' }}>
                <div className="ai-section-title" style={{ fontSize: 11.5, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>AI</span>
                  <span>Suggestions for this Patient</span>
                </div>
                <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 'var(--fs-sm)' }}>
                  {AI_SUGGESTIONS.map((s, i) => (
                    <li key={s} style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontWeight: 600, minWidth: 12 }}>{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button className="btn-primary" style={{ height: 32, fontSize: 'var(--fs-sm)', padding: '0 24px' }} onClick={() => showToast('AI Suggestions applied to prescription items')}>
                    Apply to Prescription
                  </button>
                </div>
              </div>
            )}

            {aiTab === 'Drug Interactions' && (
              <div className="ai-section" style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 'var(--fs-sm)' }}>
                <div className="ai-section-title" style={{ fontSize: 11.5, marginBottom: 0 }}>Interaction Review ({items.length} medicines)</div>
                <p>Amlodipine + Metformin combination is well-tolerated. No cytochrome P450 contraindications.</p>
                <div style={{ background: 'var(--orange-light)', border: '1px solid var(--orange-border)', padding: '7px 10px', borderRadius: 6, color: 'var(--orange-dark)' }}>
                  <strong>Food Instruction:</strong> Metformin should be taken with or immediately after meals to reduce gastrointestinal upset.
                </div>
              </div>
            )}

            {aiTab === 'Alternatives' && (
              <div className="ai-section" style={{ padding: '8px 10px 10px', fontSize: 'var(--fs-sm)' }}>
                <div className="ai-section-title" style={{ fontSize: 11.5 }}>Cost-Effective Generic Options</div>
                <p>Generic equivalents are available for all {items.length} prescribed medicines. Switching can reduce monthly cost by ~38%.</p>
              </div>
            )}

            {aiTab === 'Guidelines' && (
              <div className="ai-section" style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--fs-sm)' }}>
                <div className="ai-section-title" style={{ fontSize: 11.5, marginBottom: 0 }}>Clinical Dosing Guidelines</div>
                <div>
                  <strong>Amlodipine:</strong> Initial 5 mg daily. Max 10 mg. No dose adjustment in renal impairment.
                </div>
                <div>
                  <strong>Metformin:</strong> Safe when eGFR &gt; 45 mL/min (Patient eGFR: 88 mL/min).
                </div>
              </div>
            )}

            {/* Drug Interaction Check */}
            <div className="ai-section" style={{ padding: '7px 8px 8px' }}>
              <div className="ai-section-title" style={{ fontSize: 11.5 }}>
                <AiSparkle size={13} />
                <span>Drug Interaction Check</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 36, padding: '0 10px', borderRadius: 6, background: 'var(--green-light)', border: '1px solid var(--green-border)', fontSize: 'var(--fs-sm)' }}>
                <CircleCheck size={16} fill="var(--green-emerald)" color="#ffffff" strokeWidth={2.4} />
                <span>No major drug interactions found.</span>
              </div>
            </div>

            {/* Suggested Alternatives */}
            <div className="ai-section" style={{ padding: '7px 8px 8px' }}>
              <div className="ai-section-title" style={{ fontSize: 11.5 }}>
                <AiSparkle size={13} />
                <span>Suggested Alternatives</span>
              </div>
              <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                {mockDrugAlternatives.map((alt, i) => (
                  <div
                    key={alt.original}
                    onClick={() => showToast(`${alt.original} → ${alt.brand}`, 'info')}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 18px 1fr',
                      alignItems: 'center',
                      gap: 8,
                      height: 29,
                      padding: '0 10px',
                      fontSize: 'var(--fs-sm)',
                      cursor: 'pointer',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)'
                    }}
                  >
                    <span>{alt.original}</span>
                    <ArrowRight size={13} strokeWidth={2.2} />
                    <span>{alt.brand}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Vitals */}
          <div className="medios-card" style={{ padding: '10px 10px 10px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>Recent Vitals</span>
              <button className="text-link" style={{ fontSize: 'var(--fs-sm)', fontWeight: 400 }} onClick={() => showToast('Opening vitals history', 'info')}>
                View All
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginTop: 10 }}>
              {VITALS.map(v => (
                <div
                  key={v.label}
                  style={{
                    padding: '7px 10px',
                    borderRadius: 6,
                    border: `1px solid ${v.alert ? 'var(--red-border)' : 'var(--border-color)'}`,
                    background: v.alert ? '#fdf2f3' : '#ffffff',
                    lineHeight: 1.35
                  }}
                >
                  <div style={{ fontSize: 'var(--fs-sm)' }}>{v.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: v.alert ? 'var(--red-rose)' : 'var(--text-primary)', marginTop: 3 }}>{v.value}</div>
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>{v.unit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
