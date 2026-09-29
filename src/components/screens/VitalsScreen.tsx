import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PatientBanner } from '../layout/PatientBanner';
import { mockHistoricalVitals } from '../../mock/vitalsData';
import { VitalsRecord } from '../../types';
import {
  HeartPulse,
  Activity,
  Heart,
  Droplets,
  Thermometer,
  Scale,
  Wind,
  Plus,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Sparkles
} from 'lucide-react';

export const VitalsScreen: React.FC = () => {
  const { activePatient, showToast } = useApp();
  const [vitalsList, setVitalsList] = useState<VitalsRecord[]>(mockHistoricalVitals);
  const [timeRange, setTimeRange] = useState<string>('3 Months');
  const [activeChartTab, setActiveChartTab] = useState<'BP' | 'Glucose' | 'Pulse' | 'BMI'>('BP');
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
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3>No active patient selected</h3>
      </div>
    );
  }

  const latestVitals = vitalsList[0] || mockHistoricalVitals[0];

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

  return (
    <div className="page-scroll-body">
      {/* Patient Workstation Banner with Subtabs */}
      <PatientBanner currentSubtab="vitals" />

      {/* Screen Header and Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HeartPulse size={20} color="#dc2626" />
            <span>Patient Vitals & Biometrics Monitoring</span>
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
            Hemodynamic parameters, longitudinal trends, BMI metrics & historical logs for {activePatient.name}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.76rem', padding: '6px 12px' }}
            onClick={() => showToast('Vitals longitudinal report exported as CSV/PDF')}
          >
            <Download size={14} />
            <span>Export Trends</span>
          </button>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.76rem', padding: '6px 12px' }}
            onClick={() => window.print()}
          >
            <Printer size={14} />
            <span>Print Sheet</span>
          </button>
          <button
            className="btn-primary"
            style={{ fontSize: '0.76rem', padding: '6px 14px' }}
            onClick={() => setIsRecordModalOpen(true)}
          >
            <Plus size={14} />
            <span>Record New Vitals</span>
          </button>
        </div>
      </div>

      {/* 6 Key Live Vitals Gauge Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
        {/* Blood Pressure Card */}
        <div
          className="medios-card"
          style={{
            padding: '14px',
            borderLeft: '4px solid #dc2626',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Blood Pressure</span>
            <Activity size={16} color="#dc2626" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#dc2626' }}>
              {latestVitals.bpSystolic}/{latestVitals.bpDiastolic}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>mmHg</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span style={{ color: '#dc2626', fontWeight: 700, background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
              Stage 1 HTN
            </span>
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <TrendingUp size={12} color="#dc2626" />
              <span>+4 mmHg</span>
            </span>
          </div>
        </div>

        {/* Heart Rate Card */}
        <div
          className="medios-card"
          style={{
            padding: '14px',
            borderLeft: '4px solid #10b981',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Pulse Rate</span>
            <Heart size={16} color="#10b981" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
              {latestVitals.heartRate}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>bpm</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span style={{ color: '#065f46', fontWeight: 700, background: '#d1fae5', padding: '2px 6px', borderRadius: '4px' }}>
              Normal Sinus
            </span>
            <span style={{ color: '#64748b' }}>60–100 bpm</span>
          </div>
        </div>

        {/* SpO2 Card */}
        <div
          className="medios-card"
          style={{
            padding: '14px',
            borderLeft: '4px solid #0284c7',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Oxygen (SpO2)</span>
            <Wind size={16} color="#0284c7" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
              {latestVitals.spo2}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span style={{ color: '#075985', fontWeight: 700, background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
              Room Air
            </span>
            <span style={{ color: '#64748b' }}>&ge; 95%</span>
          </div>
        </div>

        {/* Temperature Card */}
        <div
          className="medios-card"
          style={{
            padding: '14px',
            borderLeft: '4px solid #f59e0b',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Temperature</span>
            <Thermometer size={16} color="#f59e0b" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
              {latestVitals.temperature}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>°F</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span style={{ color: '#92400e', fontWeight: 700, background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
              Normothermic
            </span>
            <span style={{ color: '#64748b' }}>Oral</span>
          </div>
        </div>

        {/* Blood Glucose Card */}
        <div
          className="medios-card"
          style={{
            padding: '14px',
            borderLeft: '4px solid #8b5cf6',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Blood Glucose</span>
            <Droplets size={16} color="#8b5cf6" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
              {latestVitals.bloodSugarFasting || 128}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>mg/dL</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span style={{ color: '#5b21b6', fontWeight: 700, background: '#ede9fe', padding: '2px 6px', borderRadius: '4px' }}>
              Fasting • Fair
            </span>
            <span style={{ color: '#64748b' }}>70–100 Target</span>
          </div>
        </div>

        {/* BMI & Weight Card */}
        <div
          className="medios-card"
          style={{
            padding: '14px',
            borderLeft: '4px solid #ea580c',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>BMI / Weight</span>
            <Scale size={16} color="#ea580c" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
              {latestVitals.bmi}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>kg/m²</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span style={{ color: '#9a3412', fontWeight: 700, background: '#ffedd5', padding: '2px 6px', borderRadius: '4px' }}>
              {latestVitals.weightKg} kg (Overweight)
            </span>
            <span style={{ color: '#64748b' }}>Ht: {latestVitals.heightCm} cm</span>
          </div>
        </div>
      </div>

      {/* Visual Graphical Trend Panel with Tab Selector */}
      <div className="medios-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Chart Metric Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['BP', 'Glucose', 'Pulse', 'BMI'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveChartTab(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeChartTab === tab ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: activeChartTab === tab ? '#eff6ff' : '#f8fafc',
                  color: activeChartTab === tab ? '#2563eb' : '#64748b'
                }}
              >
                {tab === 'BP' && 'Blood Pressure Trend (Sys/Dia)'}
                {tab === 'Glucose' && 'Fasting Glucose Trend'}
                {tab === 'Pulse' && 'Pulse & SpO2 Stability'}
                {tab === 'BMI' && 'Weight & BMI Evolution'}
              </button>
            ))}
          </div>

          {/* Time range selector */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['Last 7 Days', '1 Month', '3 Months', '1 Year', 'All'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  border: timeRange === r ? '1px solid #2563eb' : 'none',
                  background: timeRange === r ? '#2563eb' : '#f1f5f9',
                  color: timeRange === r ? '#ffffff' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Simulated SVG Chart */}
        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.74rem', color: '#64748b' }}>
            <span>
              {activeChartTab === 'BP' && 'Normal Threshold: Systolic < 120 mmHg • Diastolic < 80 mmHg'}
              {activeChartTab === 'Glucose' && 'Normal Fasting: 70–100 mg/dL • Pre-diabetes: 100–125 mg/dL'}
              {activeChartTab === 'Pulse' && 'Normal Resting Heart Rate: 60–100 bpm'}
              {activeChartTab === 'BMI' && 'Normal BMI: 18.5–24.9 kg/m² • Overweight: 25.0–29.9 kg/m²'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {activeChartTab === 'BP' ? (
                <>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontWeight: 600 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }} />
                    Systolic
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', fontWeight: 600 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                    Diastolic
                  </span>
                </>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#7c3aed', fontWeight: 600 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} />
                  Recorded Trend
                </span>
              )}
            </div>
          </div>

          {/* SVG Trend Polyline Graph */}
          <div style={{ position: 'relative', width: '100%', height: '180px' }}>
            <svg viewBox="0 0 800 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="800" y2="30" stroke="#e2e8f0" strokeDasharray="4 4" />
              <line x1="0" y1="75" x2="800" y2="75" stroke="#e2e8f0" strokeDasharray="4 4" />
              <line x1="0" y1="120" x2="800" y2="120" stroke="#e2e8f0" strokeDasharray="4 4" />
              <line x1="0" y1="165" x2="800" y2="165" stroke="#cbd5e1" />

              {activeChartTab === 'BP' && (
                <>
                  {/* Systolic Polyline (Red) */}
                  <polyline
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="3"
                    points="60,35 200,65 340,75 480,55 620,68 740,60"
                  />
                  {/* Diastolic Polyline (Blue) */}
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    points="60,95 200,120 340,125 480,115 620,122 740,118"
                  />
                  {/* Data Points */}
                  {[
                    { x: 60, sys: 152, dia: 96, date: '10 Jan' },
                    { x: 200, sys: 134, dia: 84, date: '15 Mar' },
                    { x: 340, sys: 142, dia: 92, date: '20 Jun' },
                    { x: 480, sys: 136, dia: 86, date: '05 Aug' },
                    { x: 620, sys: 138, dia: 88, date: '12 Sep' },
                    { x: 740, sys: 140, dia: 90, date: '26 Sep' }
                  ].map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={p.sys > 140 ? 35 + (160 - p.sys) : 60} r="5" fill="#dc2626" stroke="#fff" strokeWidth="2" />
                      <text x={p.x} y={p.sys > 140 ? 25 : 50} fontSize="11" fill="#dc2626" fontWeight="bold" textAnchor="middle">{p.sys}</text>
                      <circle cx={p.x} cy={p.dia > 90 ? 95 : 120} r="5" fill="#2563eb" stroke="#fff" strokeWidth="2" />
                      <text x={p.x} y={p.dia > 90 ? 110 : 135} fontSize="11" fill="#2563eb" fontWeight="bold" textAnchor="middle">{p.dia}</text>
                      <text x={p.x} y="178" fontSize="10" fill="#64748b" textAnchor="middle">{p.date}</text>
                    </g>
                  ))}
                </>
              )}

              {activeChartTab === 'Glucose' && (
                <>
                  <polyline
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="3"
                    points="60,40 200,110 340,90 480,105 620,70 740,85"
                  />
                  {[
                    { x: 60, val: 145, date: '10 Jan' },
                    { x: 200, val: 118, date: '15 Mar' },
                    { x: 340, val: 130, date: '20 Jun' },
                    { x: 480, val: 122, date: '05 Aug' },
                    { x: 620, val: 134, date: '12 Sep' },
                    { x: 740, val: 128, date: '26 Sep' }
                  ].map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={180 - p.val} r="5" fill="#7c3aed" stroke="#fff" strokeWidth="2" />
                      <text x={p.x} y={170 - p.val} fontSize="11" fill="#7c3aed" fontWeight="bold" textAnchor="middle">{p.val}</text>
                      <text x={p.x} y="178" fontSize="10" fill="#64748b" textAnchor="middle">{p.date}</text>
                    </g>
                  ))}
                </>
              )}

              {activeChartTab === 'Pulse' && (
                <>
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    points="60,50 200,105 340,95 480,100 620,95 740,85"
                  />
                  {[
                    { x: 60, val: 98, date: '10 Jan' },
                    { x: 200, val: 78, date: '15 Mar' },
                    { x: 340, val: 84, date: '20 Jun' },
                    { x: 480, val: 80, date: '05 Aug' },
                    { x: 620, val: 82, date: '12 Sep' },
                    { x: 740, val: 86, date: '26 Sep' }
                  ].map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={180 - p.val} r="5" fill="#10b981" stroke="#fff" strokeWidth="2" />
                      <text x={p.x} y={170 - p.val} fontSize="11" fill="#10b981" fontWeight="bold" textAnchor="middle">{p.val} bpm</text>
                      <text x={p.x} y="178" fontSize="10" fill="#64748b" textAnchor="middle">{p.date}</text>
                    </g>
                  ))}
                </>
              )}

              {activeChartTab === 'BMI' && (
                <>
                  <polyline
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="3"
                    points="60,50 200,60 340,70 480,85 620,95 740,100"
                  />
                  {[
                    { x: 60, val: 27.4, wt: 81, date: '10 Jan' },
                    { x: 200, val: 27.2, wt: 80.5, date: '15 Mar' },
                    { x: 340, val: 27.0, wt: 80, date: '20 Jun' },
                    { x: 480, val: 26.7, wt: 79, date: '05 Aug' },
                    { x: 620, val: 26.5, wt: 78.5, date: '12 Sep' },
                    { x: 740, val: 26.4, wt: 78, date: '26 Sep' }
                  ].map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={p.val * 3} r="5" fill="#ea580c" stroke="#fff" strokeWidth="2" />
                      <text x={p.x} y={p.val * 3 - 8} fontSize="11" fill="#ea580c" fontWeight="bold" textAnchor="middle">{p.wt} kg ({p.val})</text>
                      <text x={p.x} y="178" fontSize="10" fill="#64748b" textAnchor="middle">{p.date}</text>
                    </g>
                  ))}
                </>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Historical Vitals Log Table */}
      <div className="medios-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
            Historical Vitals Log ({vitalsList.length} Entries)
          </h3>
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Sorted from most recent to oldest entry
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="medios-table" style={{ fontSize: '0.78rem' }}>
            <thead>
              <tr>
                <th>Recorded Date & Time</th>
                <th>BP (Sys/Dia)</th>
                <th>Heart Rate</th>
                <th>SpO2</th>
                <th>Temp</th>
                <th>Resp Rate</th>
                <th>Fasting Sugar</th>
                <th>Weight / BMI</th>
                <th>Recorded By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vitalsList.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} color="#64748b" />
                      <span>{v.recordedAt}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: v.bpSystolic >= 140 || v.bpDiastolic >= 90 ? '#dc2626' : '#0f172a' }}>
                      {v.bpSystolic}/{v.bpDiastolic} mmHg
                    </span>
                  </td>
                  <td>{v.heartRate} bpm</td>
                  <td>
                    <span style={{ fontWeight: 700, color: v.spo2 < 95 ? '#dc2626' : '#0284c7' }}>
                      {v.spo2}%
                    </span>
                  </td>
                  <td>{v.temperature} °F</td>
                  <td>{v.respiratoryRate} /min</td>
                  <td>{v.bloodSugarFasting ? `${v.bloodSugarFasting} mg/dL` : '—'}</td>
                  <td>
                    <div style={{ fontSize: '0.76rem' }}>
                      <strong>{v.weightKg} kg</strong>
                      <span style={{ color: '#64748b', marginLeft: '4px' }}>({v.bmi} - {v.bmiStatus})</span>
                    </div>
                  </td>
                  <td style={{ color: '#475569' }}>{v.recordedBy}</td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: v.status === 'Critical' ? '#fee2e2' : v.status === 'Warning' ? '#fef3c7' : '#dcfce7',
                        color: v.status === 'Critical' ? '#991b1b' : v.status === 'Warning' ? '#92400e' : '#166534'
                      }}
                    >
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record New Vitals Modal */}
      {isRecordModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HeartPulse size={18} color="#dc2626" />
                <h3>Record Patient Vitals</h3>
              </div>
              <button onClick={() => setIsRecordModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleRecordSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.76rem', color: '#475569' }}>
                  Recording for <strong>{activePatient.name}</strong> • UHID: <strong>{activePatient.uhid}</strong>
                </div>

                {/* 2-Column Inputs Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      Systolic BP (mmHg) *
                    </label>
                    <input
                      type="number"
                      required
                      value={newSys}
                      onChange={(e) => setNewSys(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      Diastolic BP (mmHg) *
                    </label>
                    <input
                      type="number"
                      required
                      value={newDia}
                      onChange={(e) => setNewDia(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      Heart Rate (bpm) *
                    </label>
                    <input
                      type="number"
                      required
                      value={newPulse}
                      onChange={(e) => setNewPulse(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      Oxygen Saturation (SpO2 %) *
                    </label>
                    <input
                      type="number"
                      required
                      value={newSpo2}
                      onChange={(e) => setNewSpo2(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      Body Temperature (°F) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTemp}
                      onChange={(e) => setNewTemp(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      Respiratory Rate (/min)
                    </label>
                    <input
                      type="number"
                      value={newResp}
                      onChange={(e) => setNewResp(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      Height (cm) *
                    </label>
                    <input
                      type="number"
                      required
                      value={newHeight}
                      onChange={(e) => setNewHeight(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      Blood Sugar Fasting (mg/dL)
                    </label>
                    <input
                      type="number"
                      value={newGlucose}
                      onChange={(e) => setNewGlucose(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>

                  {/* Calculated BMI Badge */}
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Calculated Live BMI</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      {calcBmi} kg/m² <span style={{ fontSize: '0.72rem', color: '#ea580c' }}>({getBmiStatus(parseFloat(calcBmi))})</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                    Clinical Observations / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter any context or patient symptoms at the time of recording..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
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
