import React, { useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { PatientBanner } from '../layout/PatientBanner';
import { ScreenHeader } from '../common/ScreenHeader';
import { AiSparkle } from '../common/icons';
import { mockHistoricalVitals } from '../../mock/vitalsData';
import { VitalsRecord } from '../../types';
import {
  Activity,
  HeartPulse,
  Heart,
  Droplet,
  Thermometer,
  Scale,
  Wind,
  Gauge,
  Plus,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  CircleCheck,
  CircleAlert,
  RefreshCw,
  SquarePen,
  X,
  type LucideIcon
} from 'lucide-react';

type ChartTab = 'BP' | 'Glucose' | 'Pulse' | 'BMI';
type Range = '1M' | '3M' | '6M' | '1Y' | 'All';

const CHART_TABS: { id: ChartTab; label: string; hint: string }[] = [
  { id: 'BP', label: 'Blood Pressure', hint: 'Normal: Systolic < 120 mmHg · Diastolic < 80 mmHg' },
  { id: 'Glucose', label: 'Fasting Glucose', hint: 'Normal fasting: 70–100 mg/dL · Pre-diabetes: 100–125 mg/dL' },
  { id: 'Pulse', label: 'Pulse Rate', hint: 'Normal resting heart rate: 60–100 bpm' },
  { id: 'BMI', label: 'Weight & BMI', hint: 'Normal BMI: 18.5–24.9 kg/m² · Overweight: 25.0–29.9 kg/m²' }
];

const RANGE_DAYS: Record<Range, number> = { '1M': 31, '3M': 92, '6M': 183, '1Y': 366, All: Infinity };
const TODAY = new Date('26 Sep 2026');

const recordDate = (v: VitalsRecord) => v.recordedAt.replace('Today, ', '').split(',')[0];

// ---- Clinical classification (drives tiles, pills and the AI panel) ----
type Status = { label: string; pill: string };

const bpStatus = (sys: number, dia: number): Status => {
  if (sys >= 160 || dia >= 100) return { label: 'Stage 2 HTN', pill: 'critical' };
  if (sys >= 140 || dia >= 90) return { label: 'Stage 1 HTN', pill: 'high' };
  if (sys >= 120 || dia >= 80) return { label: 'Elevated', pill: 'waiting' };
  return { label: 'Normal', pill: 'normal' };
};
const pulseStatus = (hr: number): Status =>
  hr > 100 ? { label: 'Tachycardia', pill: 'high' } : hr < 60 ? { label: 'Bradycardia', pill: 'waiting' } : { label: 'Normal Sinus', pill: 'normal' };
const spo2Status = (s: number): Status =>
  s < 90 ? { label: 'Hypoxia', pill: 'critical' } : s < 95 ? { label: 'Low', pill: 'waiting' } : { label: 'Room Air', pill: 'normal' };
const tempStatus = (t: number): Status =>
  t > 100.4 ? { label: 'Febrile', pill: 'high' } : t > 99.5 ? { label: 'Low-grade', pill: 'waiting' } : t < 97 ? { label: 'Low', pill: 'waiting' } : { label: 'Normothermic', pill: 'normal' };
const respStatus = (r: number): Status =>
  r > 20 ? { label: 'Tachypnea', pill: 'waiting' } : r < 12 ? { label: 'Bradypnea', pill: 'waiting' } : { label: 'Normal', pill: 'normal' };
const glucoseStatus = (g?: number): Status => {
  if (!g) return { label: 'Not recorded', pill: 'gray' };
  if (g > 150) return { label: 'High', pill: 'high' };
  if (g >= 100) return { label: 'Above Target', pill: 'waiting' };
  return { label: 'Normal', pill: 'normal' };
};
const bmiPill: Record<VitalsRecord['bmiStatus'], string> = { Normal: 'normal', Overweight: 'waiting', Obese: 'high', Underweight: 'waiting' };
const rowStatusPill: Record<VitalsRecord['status'], string> = { Normal: 'normal', Warning: 'waiting', Critical: 'critical' };

// ---- Trend chart ----
interface Series {
  name: string;
  color: string;
  values: number[];
  labelBelow?: boolean;
  format?: (v: number) => string;
}

const TrendChart: React.FC<{
  labels: string[];
  series: Series[];
  domain: [number, number];
  ticks: number[];
  refLines?: { value: number; label: string }[];
}> = ({ labels, series, domain, ticks, refLines = [] }) => {
  const W = 820;
  const H = 210;
  const pad = { l: 40, r: 78, t: 22, b: 28 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const [min, max] = domain;
  const x = (i: number) => (labels.length === 1 ? pad.l + plotW / 2 : pad.l + 20 + (i * (plotW - 40)) / (labels.length - 1));
  const y = (v: number) => pad.t + (1 - (Math.min(Math.max(v, min), max) - min) / (max - min)) * plotH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} style={{ stroke: 'var(--border-subtle)' }} />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" style={{ fill: 'var(--text-muted)' }}>
            {t}
          </text>
        </g>
      ))}
      {refLines.map((r) => (
        <g key={r.label}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={y(r.value)}
            y2={y(r.value)}
            strokeDasharray="5 4"
            style={{ stroke: 'var(--green-emerald)', opacity: 0.7 }}
          />
          <text x={W - pad.r + 8} y={y(r.value) + 4} fontSize="10.5" style={{ fill: 'var(--green-dark)' }}>
            {r.label}
          </text>
        </g>
      ))}
      {series.map((s) => (
        <g key={s.name}>
          <polyline
            fill="none"
            strokeWidth="2.25"
            strokeLinejoin="round"
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            style={{ stroke: s.color }}
          />
          {s.values.map((v, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(v)} r="4" stroke="#ffffff" strokeWidth="2" style={{ fill: s.color }} />
              <text
                x={x(i)}
                y={s.labelBelow ? y(v) + 17 : y(v) - 9}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                style={{ fill: s.color }}
              >
                {s.format ? s.format(v) : v}
              </text>
            </g>
          ))}
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={`${l}-${i}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" style={{ fill: 'var(--text-muted)' }}>
          {l}
        </text>
      ))}
    </svg>
  );
};

export const VitalsScreen: React.FC = () => {
  const { activePatient, showToast } = useApp();
  const [vitalsList, setVitalsList] = useState<VitalsRecord[]>(mockHistoricalVitals);
  const [timeRange, setTimeRange] = useState<Range>('1Y');
  const [activeChartTab, setActiveChartTab] = useState<ChartTab>('BP');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Form states for new vitals
  const [newSys, setNewSys] = useState('138');
  const [newDia, setNewDia] = useState('88');
  const [newPulse, setNewPulse] = useState('82');
  const [newSpo2, setNewSpo2] = useState('98');
  const [newTemp, setNewTemp] = useState('98.4');
  const [newResp, setNewResp] = useState('18');
  const [newGlucose, setNewGlucose] = useState('124');
  const [newWeight, setNewWeight] = useState('78');
  const [newHeight, setNewHeight] = useState('172');
  const [newNotes, setNewNotes] = useState('');

  if (!activePatient) {
    return (
      <div className="page-scroll-body">
        <div className="medios-card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
          <h3 className="card-title">No active patient selected</h3>
        </div>
      </div>
    );
  }

  const latestVitals = vitalsList[0] || mockHistoricalVitals[0];
  const previousVitals = vitalsList[1];
  const oldestVitals = vitalsList[vitalsList.length - 1];

  // Live BMI calculation
  const calcWeight = parseFloat(newWeight) || 0;
  const calcHeight = (parseFloat(newHeight) || 0) / 100;
  const calcBmi = calcHeight > 0 ? (calcWeight / (calcHeight * calcHeight)).toFixed(1) : '0';
  const getBmiStatus = (bmi: number): 'Normal' | 'Overweight' | 'Underweight' | 'Obese' => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = parseInt(newSys) || 120;
    const dia = parseInt(newDia) || 80;
    const pulse = parseInt(newPulse) || 72;
    const spo2 = parseInt(newSpo2) || 98;
    const temp = parseFloat(newTemp) || 98.6;
    const resp = parseInt(newResp) || 16;
    const weight = parseFloat(newWeight) || 70;
    const height = parseFloat(newHeight) || 170;
    const bmiNum = parseFloat(calcBmi) || 24;

    const newRecord: VitalsRecord = {
      id: `vit-${Date.now()}`,
      uhid: activePatient.uhid,
      recordedAt: 'Today, 26 Sep 2026, 09:20 AM',
      recordedBy: 'Dr. Shajin (Consultation)',
      bpSystolic: sys,
      bpDiastolic: dia,
      heartRate: pulse,
      temperature: temp,
      spo2: spo2,
      respiratoryRate: resp,
      bloodSugarFasting: parseInt(newGlucose) || undefined,
      weightKg: weight,
      heightCm: height,
      bmi: bmiNum,
      bmiStatus: getBmiStatus(bmiNum),
      status: sys >= 140 || dia >= 90 ? 'Warning' : 'Normal',
      notes: newNotes || 'Routine consultation vitals check.'
    };

    setVitalsList([newRecord, ...vitalsList]);
    setIsRecordModalOpen(false);
    showToast('New vitals recorded and trends updated successfully');
  };

  // ---- Latest vitals tiles ----
  const bpDelta = previousVitals ? latestVitals.bpSystolic - previousVitals.bpSystolic : 0;
  const weightDelta = oldestVitals ? +(latestVitals.weightKg - oldestVitals.weightKg).toFixed(1) : 0;
  const bmiState: Status = { label: latestVitals.bmiStatus, pill: bmiPill[latestVitals.bmiStatus] };

  const tiles: {
    label: string;
    icon: LucideIcon;
    iconColor: string;
    value: React.ReactNode;
    unit: string;
    status?: Status;
    note: React.ReactNode;
    alert?: boolean;
  }[] = [
    {
      label: 'Blood Pressure',
      icon: Activity,
      iconColor: 'var(--red-rose)',
      value: `${latestVitals.bpSystolic}/${latestVitals.bpDiastolic}`,
      unit: 'mmHg',
      status: bpStatus(latestVitals.bpSystolic, latestVitals.bpDiastolic),
      alert: latestVitals.bpSystolic >= 140 || latestVitals.bpDiastolic >= 90,
      note: previousVitals ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: bpDelta > 0 ? 'var(--red-dark)' : 'var(--green-dark)' }}>
          {bpDelta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {bpDelta > 0 ? '+' : ''}{bpDelta}
        </span>
      ) : null
    },
    { label: 'Pulse Rate', icon: Heart, iconColor: 'var(--red-rose)', value: latestVitals.heartRate, unit: 'bpm', status: pulseStatus(latestVitals.heartRate), note: '60–100' },
    { label: 'SpO₂', icon: Wind, iconColor: 'var(--chart-blue)', value: latestVitals.spo2, unit: '%', status: spo2Status(latestVitals.spo2), note: '≥ 95%' },
    { label: 'Temperature', icon: Thermometer, iconColor: 'var(--orange-amber)', value: latestVitals.temperature, unit: '°F', status: tempStatus(latestVitals.temperature), note: 'Oral' },
    { label: 'Resp. Rate', icon: Gauge, iconColor: 'var(--cyan-lab)', value: latestVitals.respiratoryRate, unit: '/min', status: respStatus(latestVitals.respiratoryRate), note: '12–20' },
    {
      label: 'Fasting Glucose',
      icon: Droplet,
      iconColor: 'var(--purple-ai)',
      value: latestVitals.bloodSugarFasting ?? '—',
      unit: 'mg/dL',
      status: glucoseStatus(latestVitals.bloodSugarFasting),
      note: '70–100'
    },
    {
      label: 'Weight',
      icon: Scale,
      iconColor: 'var(--text-secondary)',
      value: latestVitals.weightKg,
      unit: 'kg',
      note: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: weightDelta <= 0 ? 'var(--green-dark)' : 'var(--orange-dark)' }}>
          {weightDelta <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
          {weightDelta > 0 ? '+' : ''}{weightDelta} kg since {oldestVitals ? recordDate(oldestVitals).slice(3) : '—'}
        </span>
      )
    },
    { label: 'BMI', icon: HeartPulse, iconColor: 'var(--orange-dark)', value: latestVitals.bmi, unit: 'kg/m²', status: bmiState, note: `Ht ${latestVitals.heightCm} cm` }
  ];

  // ---- Trend data ----
  const chartRecords = [...vitalsList]
    .filter((v) => (TODAY.getTime() - new Date(recordDate(v)).getTime()) / 86400000 <= RANGE_DAYS[timeRange])
    .reverse();
  const chartLabels = chartRecords.map((v) => recordDate(v).slice(0, 6));
  const chartProps = (() => {
    switch (activeChartTab) {
      case 'BP':
        return {
          series: [
            { name: 'Systolic', color: 'var(--red-rose)', values: chartRecords.map((v) => v.bpSystolic) },
            { name: 'Diastolic', color: 'var(--chart-blue)', values: chartRecords.map((v) => v.bpDiastolic), labelBelow: true }
          ],
          domain: [60, 170] as [number, number],
          ticks: [60, 80, 100, 120, 140, 160],
          refLines: [{ value: 120, label: 'Target 120' }, { value: 80, label: 'Target 80' }]
        };
      case 'Glucose':
        return {
          series: [{ name: 'Fasting Glucose', color: 'var(--chart-purple)', values: chartRecords.map((v) => v.bloodSugarFasting ?? 0) }],
          domain: [60, 170] as [number, number],
          ticks: [60, 80, 100, 120, 140, 160],
          refLines: [{ value: 100, label: 'Normal 100' }]
        };
      case 'Pulse':
        return {
          series: [{ name: 'Pulse Rate', color: 'var(--chart-green)', values: chartRecords.map((v) => v.heartRate), format: (n: number) => `${n}` }],
          domain: [50, 110] as [number, number],
          ticks: [50, 60, 70, 80, 90, 100, 110],
          refLines: [{ value: 100, label: 'Max 100' }, { value: 60, label: 'Min 60' }]
        };
      default:
        return {
          series: [{ name: 'BMI', color: 'var(--chart-orange)', values: chartRecords.map((v) => v.bmi), format: (n: number) => n.toFixed(1) }],
          domain: [23, 29] as [number, number],
          ticks: [23, 24, 25, 26, 27, 28, 29],
          refLines: [{ value: 25, label: 'BMI 25' }]
        };
    }
  })();

  // ---- AI observations (derived from the log) ----
  const highBpCount = vitalsList.filter((v) => v.bpSystolic >= 140 || v.bpDiastolic >= 90).length;
  const glucoseValues = vitalsList.map((v) => v.bloodSugarFasting).filter((g): g is number => !!g);
  const spo2Values = vitalsList.map((v) => v.spo2);
  const observations: { text: string; ok: boolean }[] = [
    { text: `BP ≥ 140/90 in ${highBpCount} of ${vitalsList.length} readings`, ok: highBpCount === 0 },
    {
      text: `Fasting glucose ${Math.min(...glucoseValues)}–${Math.max(...glucoseValues)} mg/dL, above target`,
      ok: Math.max(...glucoseValues) < 100
    },
    { text: `Weight ${weightDelta > 0 ? 'up' : 'down'} ${Math.abs(weightDelta)} kg since ${oldestVitals ? recordDate(oldestVitals) : '—'}`, ok: weightDelta <= 0 },
    { text: `SpO₂ stable at ${Math.min(...spo2Values)}–${Math.max(...spo2Values)}% on room air`, ok: true }
  ];

  const numberField = (id: string, label: string, value: string, set: (v: string) => void, opts: { required?: boolean; step?: string } = {}) => (
    <div>
      <label className="form-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        step={opts.step}
        required={opts.required}
        className="input-field"
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </div>
  );

  const liveBmiStatus = getBmiStatus(parseFloat(calcBmi));

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="Vitals"
        subtitle="Monitor vital signs, trends and biometric history"
        actions={
          <>
            <button className="btn-secondary" onClick={() => showToast('Vitals longitudinal report exported as CSV/PDF')}>
              <Download size={18} />
              <span>Export Trends</span>
            </button>
            <button className="btn-secondary" onClick={() => window.print()}>
              <Printer size={18} />
              <span>Print Sheet</span>
            </button>
            <button className="btn-primary" onClick={() => setIsRecordModalOpen(true)}>
              <Plus size={18} />
              <span>Record New Vitals</span>
            </button>
          </>
        }
      />

      <PatientBanner activeTab="vitals" />

      {/* Latest vitals */}
      <div className="medios-card">
        <div className="card-header-row" style={{ marginBottom: '10px' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span>Latest Vitals</span>
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 400, color: 'var(--text-secondary)' }}>
              ({latestVitals.recordedAt.replace('Today, ', '')}) · {latestVitals.recordedBy}
            </span>
          </h3>
          <button className="text-link" onClick={() => setIsRecordModalOpen(true)}>+ Add Vitals</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.label}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 11px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minWidth: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                  <Icon size={14} color={t.iconColor} strokeWidth={2} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2, color: t.alert ? 'var(--red-dark)' : 'var(--text-primary)' }}>
                    {t.value}
                  </span>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{t.unit}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', minHeight: '22px' }}>
                  {t.status && <span className={`status-pill ${t.status.pill}`} style={{ padding: '0 7px' }}>{t.status.label}</span>}
                  <span style={{ whiteSpace: 'nowrap' }}>{t.note}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trends + AI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) clamp(300px, 26vw, 372px)', gap: 'var(--gap)', alignItems: 'stretch' }}>
        <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div className="card-header-row" style={{ marginBottom: '8px' }}>
            <h3 className="card-title">Vitals Trends</h3>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(Object.keys(RANGE_DAYS) as Range[]).map((r) => (
                <button key={r} className={`chip-btn ${timeRange === r ? 'active' : ''}`} onClick={() => setTimeRange(r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="card-tabs">
            {CHART_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`card-tab-btn ${activeChartTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveChartTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', margin: '10px 0 4px', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
            <span>{CHART_TABS.find((t) => t.id === activeChartTab)?.hint}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {chartProps.series.map((s) => (
                <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-primary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color }} />
                  {s.name}
                </span>
              ))}
            </span>
          </div>

          {chartRecords.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', minHeight: '160px' }}>
              No readings in the selected period
            </div>
          ) : (
            <TrendChart labels={chartLabels} {...chartProps} />
          )}
        </div>

        <div className="ai-assistant-card">
          <div className="ai-header-bar">
            <div className="ai-title-row">
              <AiSparkle size={20} />
              <span>AI Vitals Summary (GPT-6 Astro)</span>
            </div>
            <button className="icon-btn" style={{ width: '28px', height: '28px' }} title="Regenerate" onClick={() => showToast('AI vitals summary regenerated', 'info')}>
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="ai-section">
            <div className="ai-section-title">
              <AiSparkle size={12} />
              <span>Key Observations</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {observations.map((o) => (
                <div key={o.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: 'var(--fs-sm)' }}>
                  {o.ok ? (
                    <CircleCheck size={14} color="#ffffff" fill="var(--green-emerald)" style={{ flexShrink: 0, marginTop: '1px' }} />
                  ) : (
                    <CircleAlert size={14} color="#ffffff" fill="var(--red-rose)" style={{ flexShrink: 0, marginTop: '1px' }} />
                  )}
                  <span>{o.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ai-section">
            <div className="ai-section-title" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                <AiSparkle size={12} />
                <span>Recommendations</span>
              </span>
              <button
                className="btn-outline-blue btn-sm"
                style={{ height: '24px', fontSize: 'var(--fs-xs)', padding: '0 8px', backgroundColor: 'var(--blue-light)' }}
                onClick={() => showToast('Vitals recommendations added to care plan')}
              >
                <SquarePen size={12} />
                <span>Add to Plan</span>
              </button>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: 'var(--fs-sm)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li>Home BP monitoring twice daily for 2 weeks</li>
              <li>Review Amlodipine dose if BP stays &gt; 140/90</li>
              <li>Repeat HbA1c in 3 months; reinforce diet plan</li>
              <li>Continue weight loss – target BMI &lt; 25</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Historical log */}
      <div className="medios-card">
        <div className="card-header-row" style={{ marginBottom: '4px' }}>
          <h3 className="card-title">Vitals History ({vitalsList.length} Entries)</h3>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Sorted from most recent to oldest entry</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="medios-table">
            <thead>
              <tr>
                <th>Recorded Date & Time</th>
                <th>BP (Sys/Dia)</th>
                <th>Heart Rate</th>
                <th>SpO₂</th>
                <th>Temp</th>
                <th>Resp Rate</th>
                <th>Fasting Sugar</th>
                <th>Weight / BMI</th>
                <th>Recorded By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vitalsList.map((v) => {
                const bpHigh = v.bpSystolic >= 140 || v.bpDiastolic >= 90;
                return (
                  <tr key={v.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <CalendarDays size={13} color="var(--text-muted)" />
                        <span>{v.recordedAt}</span>
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: bpHigh ? 'var(--red-dark)' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {v.bpSystolic}/{v.bpDiastolic} mmHg
                    </td>
                    <td>{v.heartRate} bpm</td>
                    <td style={{ color: v.spo2 < 95 ? 'var(--red-dark)' : 'var(--text-primary)' }}>{v.spo2}%</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{v.temperature} °F</td>
                    <td>{v.respiratoryRate} /min</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{v.bloodSugarFasting ? `${v.bloodSugarFasting} mg/dL` : '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600 }}>{v.weightKg} kg</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>({v.bmi} · {v.bmiStatus})</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{v.recordedBy}</td>
                    <td>
                      <span className={`status-pill ${rowStatusPill[v.status]}`}>{v.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record New Vitals Modal */}
      {isRecordModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsRecordModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HeartPulse size={18} color="var(--red-rose)" />
                <span>Record Patient Vitals</span>
              </h3>
              <button className="icon-btn" title="Close" onClick={() => setIsRecordModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleRecordSubmit}>
              <div className="modal-body">
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 'var(--fs-sm)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Recording for <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{activePatient.name}</strong> · UHID:{' '}
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{activePatient.uhid}</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                  {numberField('vit-sys', 'Systolic BP (mmHg) *', newSys, setNewSys, { required: true })}
                  {numberField('vit-dia', 'Diastolic BP (mmHg) *', newDia, setNewDia, { required: true })}
                  {numberField('vit-pulse', 'Heart Rate (bpm) *', newPulse, setNewPulse, { required: true })}
                  {numberField('vit-spo2', 'SpO₂ (%) *', newSpo2, setNewSpo2, { required: true })}
                  <div>
                    <label className="form-label" htmlFor="vit-temp">Temperature (°F) *</label>
                    <input
                      id="vit-temp"
                      type="text"
                      required
                      className="input-field"
                      value={newTemp}
                      onChange={(e) => setNewTemp(e.target.value)}
                    />
                  </div>
                  {numberField('vit-resp', 'Resp. Rate (/min)', newResp, setNewResp)}
                  {numberField('vit-weight', 'Weight (kg) *', newWeight, setNewWeight, { required: true, step: '0.1' })}
                  {numberField('vit-height', 'Height (cm) *', newHeight, setNewHeight, { required: true })}
                  {numberField('vit-glucose', 'Fasting Sugar (mg/dL)', newGlucose, setNewGlucose)}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>Calculated BMI</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: 'var(--fs-h3)', fontWeight: 700 }}>{calcBmi}</span>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>kg/m²</span>
                    <span className={`status-pill ${bmiPill[liveBmiStatus]}`}>{liveBmiStatus}</span>
                  </span>
                </div>

                <div>
                  <label className="form-label" htmlFor="vit-notes">Clinical Observations / Notes</label>
                  <textarea
                    id="vit-notes"
                    rows={2}
                    className="input-field"
                    placeholder="Enter any context or patient symptoms at the time of recording..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsRecordModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
