import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { PatientBanner, type BannerTab } from '../layout/PatientBanner';
import { ScreenHeader } from '../common/ScreenHeader';
import { AiSparkle } from '../common/icons';
import { mockMedicationTemplates, mockDrugAlternatives } from '../../mock/prescriptionsData';
import type { PrescriptionItem, PrescriptionRecord } from '../../types';
import { prescriptionService } from '../../services';
import { errorMessage } from '../../services/api';
import { useLoader } from '../../hooks/useLoader';
import { usePatientChart } from '../../hooks/usePatientChart';
import { displayDate } from '../../utils/clinicDate';
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
import { tableMin, ws3 } from '../../utils/layout';

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

const AI_TABS = ['Suggestions', 'Drug Interactions', 'Alternatives', 'Guidelines'] as const;
type AiTab = (typeof AI_TABS)[number];

const DOSE_OPTIONS = ['2.5 mg', '5 mg', '10 mg', '40 mg', '500 mg', '650 mg', '1 g', '5 ml', '10 ml'];
const FREQ_OPTIONS: PrescriptionItem['frequency'][] = ['OD', 'BD', 'TDS', 'QID', 'HS', 'SOS'];
const DURATION_OPTIONS = ['3 days', '5 days', '7 days', '14 days', '30 days', '60 days', '90 days', 'Continue'];
const INSTRUCTION_OPTIONS: NonNullable<PrescriptionItem['instructions']>[] = ['After food', 'Before food', 'At night', 'SOS (Fever)', 'With warm water'];

const DEFAULT_OPTIONS: PrescriptionRecord['options'] = {
  printAdvice: true,
  includeDiagnosis: true,
  includeVitals: true,
  includeNextVisit: true,
  includeLabSummary: false
};

type Interactions = { key: string; warnings: string[]; checked: number };

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
  const uhid = activePatient?.uhid;
  const { chart } = usePatientChart(uhid);
  const [history, setHistory] = useState<{ uhid: string; list: PrescriptionRecord[] } | null>(null);
  const { loading } = useLoader(
    async () => (uhid ? { uhid, list: await prescriptionService.getPrescriptions(uhid) } : null),
    setHistory,
    [uhid]
  );
  const prescriptions = history && history.uhid === uhid ? history.list : [];
  // Editor state: the prescription being written (`id` absent until first saved).
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [instructions, setInstructions] = useState('');
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [interactions, setInteractions] = useState<Interactions | null>(null);
  const [aiTab, setAiTab] = useState<AiTab>('Suggestions');
  const [showAddRow, setShowAddRow] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [consultType, setConsultType] = useState('Follow-up');

  /** Loads a stored prescription into the editor, or starts a blank one. */
  const openPrescription = (rx: PrescriptionRecord | undefined) => {
    setEditingId(rx?.id);
    setItems(rx?.items ?? []);
    setInstructions(rx?.additionalInstructions ?? '');
    setOptions(rx?.options ?? DEFAULT_OPTIONS);
    if (rx?.type) setConsultType(rx.type);
  };

  // Open the latest prescription whenever the patient (or their list) loads.
  const latestKey = history ? `${history.uhid}:${history.list[0]?.id ?? 'none'}` : '';
  useEffect(() => {
    if (history && history.uhid === uhid) openPrescription(history.list[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestKey]);

  // Re-check interactions whenever the medicine list changes.
  const medicineNames = items.map(i => i.medicine).filter(Boolean);
  const interactionKey = medicineNames.join('|');
  useEffect(() => {
    if (medicineNames.length < 2) return;
    let current = true;
    prescriptionService
      .checkInteractions(medicineNames)
      .then(r => current && setInteractions({ key: interactionKey, warnings: r.warnings, checked: r.checkedMedicinesCount }))
      .catch(() => current && setInteractions(null));
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactionKey]);
  const interactionResult: Interactions | null =
    medicineNames.length < 2
      ? { key: interactionKey, warnings: [], checked: medicineNames.length }
      : interactions?.key === interactionKey
        ? interactions
        : null;

  const diagnoses = chart?.visits[0]?.icd10 ?? [];
  const activeMeds = chart?.medications.filter(m => m.status === 'Active') ?? [];
  const v = activePatient?.vitals;
  const vitalTiles = [
    { label: 'BP', value: v ? `${v.bpSystolic}/${v.bpDiastolic}` : '—', unit: 'mmHg', alert: !!v && (v.bpSystolic >= 140 || v.bpDiastolic >= 90) },
    { label: 'HR', value: v?.heartRate !== undefined ? String(v.heartRate) : '—', unit: 'bpm', alert: false },
    { label: 'Temp', value: v?.temperature !== undefined ? String(v.temperature) : '—', unit: '°F', alert: false },
    { label: 'SpO₂', value: v?.spo2 !== undefined ? String(v.spo2) : '—', unit: '%', alert: false }
  ];

  const savePrescription = async () => {
    if (!activePatient) return;
    const incomplete = items.filter(i => !i.dose || !i.duration);
    if (incomplete.length) {
      showToast(`Set dose and duration for ${incomplete.map(i => i.medicine).join(', ')}`, 'warning');
      return;
    }
    const current = prescriptions.find(p => p.id === editingId);
    try {
      const saved = await prescriptionService.savePrescription({
        id: editingId,
        uhid: activePatient.uhid,
        date: current?.date ?? displayDate(),
        doctor: current?.doctor ?? '',
        type: consultType,
        // Item ids are local; the server assigns its own.
        items: items.map(({ id: _id, ...rest }) => rest) as PrescriptionItem[],
        additionalInstructions: instructions,
        options
      });
      setHistory(prev =>
        prev && prev.uhid === saved.uhid
          ? { ...prev, list: editingId ? prev.list.map(p => (p.id === saved.id ? saved : p)) : [saved, ...prev.list] }
          : prev
      );
      setEditingId(saved.id);
      setItems(saved.items);
      showToast('Prescription saved to the patient record');
    } catch (err) {
      showToast(`Prescription not saved: ${errorMessage(err)}`, 'error');
    }
  };

  /** Copies the patient's active medications into this prescription (skipping ones already listed). */
  const applyCurrentMedications = () => {
    const present = new Set(items.map(i => i.medicine.toLowerCase()));
    const toAdd = activeMeds.filter(m => !present.has(m.medicine.toLowerCase()));
    if (!toAdd.length) {
      showToast('All current medications are already on this prescription', 'info');
      return;
    }
    setItems(prev => [
      ...prev,
      ...toAdd.map(
        (m): PrescriptionItem => ({
          id: `new-${m.id}`,
          medicine: m.medicine,
          brand: m.brand,
          dose: m.dose,
          frequency: m.frequency,
          duration: m.duration,
          route: m.route,
          instructions: INSTRUCTION_OPTIONS.find(o => o === m.instructions),
          indication: m.indication,
          status: 'Active'
        })
      )
    ]);
    showToast(`Added ${toAdd.length} current medication${toAdd.length === 1 ? '' : 's'}`);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    showToast('Medicine removed from prescription');
  };

  const updateItem = (id: string, patch: Partial<PrescriptionItem>) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));
  };

  const handleAddItem = () => {
    if (!newMedName) return;
    // Dose and duration stay blank until the prescriber picks them.
    const newItem: PrescriptionItem = {
      id: `new-${Date.now()}`,
      medicine: newMedName,
      dose: '',
      frequency: 'OD',
      duration: '',
      route: 'Oral',
      status: 'Active'
    };
    setItems([...items, newItem]);
    setNewMedName('');
    setShowAddRow(false);
    showToast(`Added ${newItem.medicine}`);
  };

  const handleSendWhatsApp = () => {
    showToast('WhatsApp delivery is not connected yet; print or share the PDF instead.', 'info');
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
          { label: 'Last Visit', value: activePatient?.lastVisit || '—' },
          { label: "Today's Visit", value: displayDate() },
          { label: 'Department', value: activePatient?.department || '—' }
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

      <div className="ws-3" style={{ ...ws3('308px', '366px'), gap: 10, alignItems: 'stretch' }}>
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
              {!diagnoses.length && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', padding: '6px 4px 10px' }}>{chart ? 'No diagnoses recorded in the latest note.' : 'Loading…'}</p>}
              {diagnoses.map((d, i) => (
                <div
                  key={d.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    height: 42,
                    padding: '0 4px',
                    borderTop: '1px solid var(--border-subtle)',
                    borderBottom: i === diagnoses.length - 1 ? 'none' : undefined,
                    fontSize: 11.5
                  }}
                >
                  <span style={{ fontWeight: 700, minWidth: 30 }}>{d.code}</span>
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.description}</span>
                  <span className={`status-pill ${d.type === 'Chronic' ? 'red' : 'green'}`} style={{ height: 21, fontSize: 'var(--fs-xs)' }}>{d.type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Prescriptions */}
          <div className="medios-card" style={{ padding: '10px 10px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={smallCardTitle}>Previous Prescriptions</span>
              <button className="text-link" style={{ fontSize: 'var(--fs-sm)', fontWeight: 400 }} onClick={() => openPrescription(undefined)}>
                New Prescription
              </button>
            </div>
            <div style={{ marginTop: 8 }}>
              {!prescriptions.length && (
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', padding: '4px 4px 8px' }}>{loading ? 'Loading…' : 'No prescriptions yet. The one you write here will be the first.'}</p>
              )}
              {prescriptions.map((rx, i) => {
                const selected = editingId === rx.id;
                const color = i === 0 ? 'var(--blue-primary)' : 'var(--green-emerald)';
                return (
                  <div
                    key={rx.id}
                    onClick={() => openPrescription(rx)}
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
                    {selected ? (
                      <CircleCheck size={14} fill={color} color="#ffffff" strokeWidth={2.4} style={{ flexShrink: 0 }} />
                    ) : (
                      <Circle size={12} color={color} strokeWidth={3.4} style={{ flexShrink: 0, margin: 1 }} />
                    )}
                    <div style={{ lineHeight: 1.4, fontSize: 'var(--fs-sm)' }}>
                      <div style={{ display: 'flex', gap: 14 }}>
                        <span style={{ fontWeight: 600, minWidth: 74 }}>{rx.date}</span>
                        <span>{rx.type || 'Prescription'}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>{rx.items.length} medication{rx.items.length === 1 ? '' : 's'}</div>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ fontSize: 'var(--fs-h2)', fontWeight: 700 }}>New Prescription</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
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

          <div className="table-scroll" style={tableMin(600)}>
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
                      <CellSelect label="Instructions" value={item.instructions ?? ''} options={INSTRUCTION_OPTIONS} onChange={v => updateItem(item.id, { instructions: (v || undefined) as PrescriptionItem['instructions'] })} />
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
          </div>

          {/* Actions under the table */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
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
              onClick={() =>
                showToast(
                  !interactionResult
                    ? 'Interaction check unavailable'
                    : interactionResult.warnings.length
                      ? `${interactionResult.warnings.length} possible interaction(s) — see the assistant panel`
                      : 'No interactions found in the built-in list',
                  interactionResult?.warnings.length ? 'warning' : 'info'
                )
              }
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
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px 14px', marginTop: 12, fontSize: 'var(--fs-xs)' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 'auto', paddingTop: 16 }}>
            <button className="btn-outline-blue" style={{ ...barBtn, padding: '0 13px' }} onClick={() => showToast('Prescription preview window')}>
              <Eye size={15} />
              <span>Preview</span>
            </button>
            <button className="btn-outline-blue" style={barBtn} onClick={() => showToast('Pharmacy integration is not connected yet', 'info')}>
              <Send size={15} />
              <span>Send to Pharmacy</span>
            </button>
            <button className="btn-whatsapp" style={{ ...barBtn, color: '#138a43', borderColor: '#cfe9d9' }} onClick={handleSendWhatsApp}>
              <WhatsAppMark size={16} />
              <span>Send to Patient (WhatsApp)</span>
            </button>
            <button className="btn-primary" style={{ ...barBtn, marginLeft: 'auto' }} onClick={savePrescription} disabled={!activePatient}>
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
                  <span>Current medications to review</span>
                </div>
                <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 'var(--fs-sm)' }}>
                  {!activeMeds.length && <li style={{ color: 'var(--text-muted)' }}>{chart ? 'No active medications on record.' : 'Loading…'}</li>}
                  {activeMeds.map((m, i) => (
                    <li key={m.id} style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontWeight: 600, minWidth: 12 }}>{i + 1}.</span>
                      <span>
                        {m.medicine} {m.dose} {m.frequency}
                        {m.indication ? ` — ${m.indication}` : ''}
                      </span>
                    </li>
                  ))}
                </ol>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button className="btn-primary" style={{ height: 32, fontSize: 'var(--fs-sm)', padding: '0 24px' }} onClick={applyCurrentMedications} disabled={!activeMeds.length}>
                    Add to Prescription
                  </button>
                </div>
              </div>
            )}

            {aiTab === 'Drug Interactions' && (
              <div className="ai-section" style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 'var(--fs-sm)' }}>
                <div className="ai-section-title" style={{ fontSize: 11.5, marginBottom: 0 }}>Interaction Review ({items.length} medicines)</div>
{!interactionResult ? (
                  <span style={{ color: 'var(--text-muted)' }}>Checking…</span>
                ) : interactionResult.warnings.length ? (
                  interactionResult.warnings.map(w => (
                    <div key={w} style={{ background: 'var(--orange-light)', border: '1px solid var(--orange-border)', padding: '7px 10px', borderRadius: 6, color: 'var(--orange-dark)' }}>
                      {w}
                    </div>
                  ))
                ) : (
                  <p>No interactions found among {interactionResult.checked} medicine{interactionResult.checked === 1 ? '' : 's'} in the built-in interaction list.</p>
                )}
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>The built-in list covers a few common drugs only; confirm with a full drug reference.</p>
              </div>
            )}

            {aiTab === 'Alternatives' && (
              <div className="ai-section" style={{ padding: '8px 10px 10px', fontSize: 'var(--fs-sm)' }}>
                <div className="ai-section-title" style={{ fontSize: 11.5 }}>Cost-Effective Generic Options</div>
                <p>Common generic and brand equivalents are listed under Suggested Alternatives below.</p>
              </div>
            )}

            {aiTab === 'Guidelines' && (
              <div className="ai-section" style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--fs-sm)' }}>
                <div className="ai-section-title" style={{ fontSize: 11.5, marginBottom: 0 }}>Clinical Dosing Guidelines</div>
                <div>
                  <strong>Amlodipine:</strong> Initial 5 mg daily. Max 10 mg. No dose adjustment in renal impairment.
                </div>
                <div>
                  <strong>Metformin:</strong> Use when eGFR &gt; 45 mL/min; check the latest renal function first.
                </div>
              </div>
            )}

            {/* Drug Interaction Check */}
            <div className="ai-section" style={{ padding: '7px 8px 8px' }}>
              <div className="ai-section-title" style={{ fontSize: 11.5 }}>
                <AiSparkle size={13} />
                <span>Drug Interaction Check</span>
              </div>
              {interactionResult?.warnings.length ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 36, padding: '6px 10px', borderRadius: 6, background: 'var(--orange-light)', border: '1px solid var(--orange-border)', fontSize: 'var(--fs-sm)', color: 'var(--orange-dark)' }}>
                  <Zap size={16} color="var(--orange-amber)" />
                  <span>{interactionResult.warnings.length} possible interaction{interactionResult.warnings.length === 1 ? '' : 's'} — see Drug Interactions.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 36, padding: '0 10px', borderRadius: 6, background: 'var(--green-light)', border: '1px solid var(--green-border)', fontSize: 'var(--fs-sm)' }}>
                  <CircleCheck size={16} fill="var(--green-emerald)" color="#ffffff" strokeWidth={2.4} />
                  <span>{interactionResult ? 'No interactions in the built-in list.' : 'Checking…'}</span>
                </div>
              )}
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
              {vitalTiles.map(v => (
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
