import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarDays,
  Users,
  FileText,
  FlaskConical,
  ImageIcon,
  Receipt,
  Sparkles,
  Send,
  AlertTriangle,
  Clock,
  UserPlus,
  FileSignature,
  FileCheck,
  FolderOpen,
  CalendarCheck
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { setActiveScreen, showToast } = useApp();
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [alertsFilter, setAlertsFilter] = useState<'all' | 'critical' | 'followups' | 'lab' | 'system'>('all');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const scheduleList = [
    { time: '09:00 AM', name: 'Mary Jeni', reason: 'Follow-up • Hypertension', status: 'Consulting', color: 'blue' },
    { time: '09:30 AM', name: 'Antony Raj', reason: 'New Patient • Diabetes', status: 'Completed', color: 'green' },
    { time: '10:00 AM', name: 'Selvi P', reason: 'Follow-up • Thyroid', status: 'Consulting', color: 'blue' },
    { time: '10:30 AM', name: 'Ramesh Kumar', reason: 'New Patient • Chest Pain', status: 'Waiting', color: 'orange' },
    { time: '11:00 AM', name: 'Latha S', reason: 'Follow-up • Diabetes', status: 'Scheduled', color: 'gray' },
    { time: '11:30 AM', name: 'Daniel', reason: 'New Patient • Fever', status: 'Scheduled', color: 'gray' }
  ];

  const recentPatients = [
    { name: 'Mary Jeni', age: 28, gender: 'Female', reason: 'Hypertension follow-up', time: '10:12 AM' },
    { name: 'Antony Raj', age: 45, gender: 'Male', reason: 'Diabetes management', time: '09:32 AM' },
    { name: 'Selvi P', age: 32, gender: 'Female', reason: 'Thyroid review', time: '09:10 AM' },
    { name: 'Rajesh Kumar', age: 52, gender: 'Male', reason: 'Chest pain evaluation', time: '08:45 AM' },
    { name: 'Latha S', age: 41, gender: 'Female', reason: 'Lab result review', time: '08:20 AM' },
    { name: 'Daniel', age: 36, gender: 'Male', reason: 'Fever and cold', time: '08:05 AM' }
  ];

  const alerts = [
    { id: 'a1', title: 'High WBC count: 14,500', patient: 'Mary Jeni | CBC', time: '09:30 AM', type: 'critical', icon: AlertTriangle, color: '#ef4444' },
    { id: 'a2', title: 'Drug interaction alert', patient: 'Amlodipine + Ibuprofen | Antony Raj', time: '09:15 AM', type: 'critical', icon: AlertTriangle, color: '#f59e0b' },
    { id: 'a3', title: 'Follow-up due', patient: 'Diabetes review | Selvi P', time: 'Today', type: 'followups', icon: Clock, color: '#f59e0b' },
    { id: 'a4', title: 'Lab report pending', patient: 'CBC, LFT | 4 patients', time: 'Today', type: 'lab', icon: FlaskConical, color: '#06b6d4' },
    { id: 'a5', title: 'System auto-backup complete', patient: 'Cloud PACS Storage', time: '04:00 AM', type: 'system', icon: Sparkles, color: '#8b5cf6' }
  ];

  const filteredSchedule = scheduleList.filter(item => {
    if (scheduleFilter === 'all') return true;
    if (scheduleFilter === 'upcoming') return item.status === 'Consulting' || item.status === 'Waiting' || item.status === 'Scheduled';
    if (scheduleFilter === 'completed') return item.status === 'Completed';
    return true;
  });

  const filteredAlerts = alerts.filter(a => {
    if (alertsFilter === 'all') return true;
    return a.type === alertsFilter;
  });

  const handleAskAI = (promptText?: string) => {
    const q = promptText || aiQuestion;
    if (!q) return;
    setAiQuestion(q);
    setAiAnswer(`GPT-6 Astro: Analysis complete for "${q}". Clinical findings cross-referenced with ESC & ADA guidelines. No acute contraindications found.`);
  };

  return (
    <div className="page-scroll-body">
      {/* Header */}
      <div className="screen-header-row">
        <div className="screen-title-area">
          <h1>Dashboard</h1>
          <p>Welcome back, Dr. Shajin 👋 • Here's your hospital overview for today.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Tue, 24 Sep 2026</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>10:24 AM</div>
        </div>
      </div>

      {/* 6 Top Stat Cards */}
      <div className="stat-cards-grid">
        {/* Appointments */}
        <div className="stat-card-item">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <CalendarDays size={22} />
          </div>
          <div className="stat-data-box">
            <span className="stat-label">Today's Appointments</span>
            <span className="stat-number">18</span>
            <span className="stat-sub">12 Completed • 6 Pending</span>
          </div>
        </div>

        {/* Patients */}
        <div className="stat-card-item">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <Users size={22} />
          </div>
          <div className="stat-data-box">
            <span className="stat-label">Total Patients</span>
            <span className="stat-number">124</span>
            <span className="stat-sub" style={{ color: '#059669', fontWeight: 600 }}>+12 new today ↗</span>
          </div>
        </div>

        {/* Consultations */}
        <div className="stat-card-item">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#fff1f2', color: '#e11d48' }}>
            <FileText size={22} />
          </div>
          <div className="stat-data-box">
            <span className="stat-label">Consultations</span>
            <span className="stat-number">16</span>
            <span className="stat-sub">4 AI Notes Generated</span>
          </div>
        </div>

        {/* Lab Reports */}
        <div className="stat-card-item">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#ecfeff', color: '#06b6d4' }}>
            <FlaskConical size={22} />
          </div>
          <div className="stat-data-box">
            <span className="stat-label">Lab Reports</span>
            <span className="stat-number">28</span>
            <span className="stat-sub">5 Pending</span>
          </div>
        </div>

        {/* Imaging Reports */}
        <div className="stat-card-item">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
            <ImageIcon size={22} />
          </div>
          <div className="stat-data-box">
            <span className="stat-label">Imaging Reports</span>
            <span className="stat-number">12</span>
            <span className="stat-sub">3 Pending</span>
          </div>
        </div>

        {/* Billing */}
        <div className="stat-card-item">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
            <Receipt size={22} />
          </div>
          <div className="stat-data-box">
            <span className="stat-label">Billing (Today)</span>
            <span className="stat-number">₹ 24,850</span>
            <span className="stat-sub">21 Invoices</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Schedule, Recent Patients, AI Assistant & Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1fr', gap: '20px' }}>
        {/* Today's Schedule */}
        <div className="medios-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <h3>Today's Schedule</h3>
            </div>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => setActiveScreen('appointments')}
            >
              View All
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            {(['all', 'upcoming', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setScheduleFilter(tab)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  backgroundColor: scheduleFilter === tab ? '#eff6ff' : '#f8fafc',
                  color: scheduleFilter === tab ? '#2563eb' : '#64748b',
                  border: scheduleFilter === tab ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                }}
              >
                {tab === 'all' && 'All (18)'}
                {tab === 'upcoming' && 'Upcoming (6)'}
                {tab === 'completed' && 'Completed (12)'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredSchedule.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #f1f5f9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748b', minWidth: '60px' }}>
                    {item.time}
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem', color: '#334155' }}>
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <h5 style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{item.name}</h5>
                    <p style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.reason}</p>
                  </div>
                </div>

                <span className={`status-pill ${item.color === 'green' ? 'completed' : item.color === 'blue' ? 'consulting' : item.color === 'orange' ? 'waiting' : 'scheduled'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="medios-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <h3>Recent Patients</h3>
            </div>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => setActiveScreen('patients')}
            >
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {recentPatients.map((pat, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #f1f5f9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                    {pat.name.charAt(0)}
                  </div>
                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{pat.name}</h5>
                    <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {pat.age} y • {pat.gender} • {pat.reason}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{pat.time}</span>
                  <button
                    className="btn-outline-blue"
                    style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                    onClick={() => setActiveScreen('consultation')}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Clinical Assistant & Tasks & Alerts Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* AI Clinical Assistant */}
          <div className="ai-assistant-card">
            <div className="ai-header-bar">
              <div className="ai-title-row">
                <Sparkles size={18} />
                <span>AI Clinical Assistant (GPT-6 Astro)</span>
              </div>
            </div>

            <div className="ai-prompt-box">
              <input
                type="text"
                className="ai-prompt-input"
                placeholder="Ask about a patient, guideline, treatment..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
              />
              <button className="ai-send-btn" onClick={() => handleAskAI()}>
                <Send size={14} />
              </button>
            </div>

            {aiAnswer && (
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#faf5ff', border: '1px solid #e9d5ff', fontSize: '0.78rem', color: '#581c87', lineHeight: 1.4 }}>
                {aiAnswer}
              </div>
            )}

            <div>
              <p style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>
                Try these examples:
              </p>
              <div className="quick-prompt-chips-grid">
                <button className="prompt-chip-btn" onClick={() => handleAskAI('Summarize this patient')}>
                  <FileText size={12} />
                  <span>Summarize this patient</span>
                </button>
                <button className="prompt-chip-btn" onClick={() => handleAskAI('Suggest treatment plan')}>
                  <Sparkles size={12} />
                  <span>Suggest treatment</span>
                </button>
                <button className="prompt-chip-btn" onClick={() => handleAskAI('Check drug interaction')}>
                  <FileCheck size={12} />
                  <span>Check drug interaction</span>
                </button>
                <button className="prompt-chip-btn" onClick={() => handleAskAI('Create clinical note')}>
                  <FileSignature size={12} />
                  <span>Create clinical note</span>
                </button>
                <button className="prompt-chip-btn" onClick={() => handleAskAI('Interpret lab report')}>
                  <FlaskConical size={12} />
                  <span>Interpret lab report</span>
                </button>
                <button className="prompt-chip-btn" onClick={() => handleAskAI('Follow-up plan')}>
                  <CalendarCheck size={12} />
                  <span>Follow-up plan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tasks & Alerts Widget */}
          <div className="medios-card" style={{ flex: 1 }}>
            <div className="card-header-row">
              <div className="card-title-group">
                <h3>Tasks & Alerts</h3>
              </div>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                onClick={() => setActiveScreen('tasks-alerts')}
              >
                View All
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {(['all', 'critical', 'followups', 'lab', 'system'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAlertsFilter(tab)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '14px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    backgroundColor: alertsFilter === tab ? '#2563eb' : '#f1f5f9',
                    color: alertsFilter === tab ? '#ffffff' : '#64748b'
                  }}
                >
                  {tab === 'all' && 'All (12)'}
                  {tab === 'critical' && 'Critical (4)'}
                  {tab === 'followups' && 'Follow-ups (5)'}
                  {tab === 'lab' && 'Lab (2)'}
                  {tab === 'system' && 'System (1)'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredAlerts.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.76rem' }}>
                  No alerts for {alertsFilter}
                </div>
              ) : (
                filteredAlerts.map((a) => {
                const Icon = a.icon;
                return (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #f1f5f9'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ color: a.color }}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{a.title}</h5>
                        <p style={{ fontSize: '0.7rem', color: '#64748b' }}>{a.patient}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{a.time}</span>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Patient Flow (Donut), Consultation Types (Bar), Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '20px' }}>
        {/* Patient Flow Donut */}
        <div className="medios-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <h3>Patient Flow</h3>
            </div>
            <select style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem', background: '#f8fafc' }}>
              <option>Today</option>
              <option>This Week</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '10px 0' }}>
            {/* Donut representation */}
            <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="130" height="130" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="14" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="14" strokeDasharray="157 238" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#2563eb" strokeWidth="14" strokeDasharray="31 238" strokeDashoffset="-157" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="14" strokeDasharray="24 238" strokeDashoffset="-188" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#94a3b8" strokeWidth="14" strokeDasharray="26 238" strokeDashoffset="-212" />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>124</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Total Patients</span>
              </div>
            </div>

            {/* Breakdown legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ color: '#475569' }}>Completed</span>
                </div>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>82 (66%)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
                  <span style={{ color: '#475569' }}>In Consultation</span>
                </div>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>16 (13%)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  <span style={{ color: '#475569' }}>Waiting</span>
                </div>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>12 (10%)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
                  <span style={{ color: '#475569' }}>Scheduled</span>
                </div>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>14 (11%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Consultation Types (Bar Chart) */}
        <div className="medios-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <h3>Consultation Types</h3>
            </div>
            <select style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem', background: '#f8fafc' }}>
              <option>Today</option>
              <option>This Week</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '130px', padding: '10px 10px 0 10px', gap: '12px' }}>
            {[
              { label: 'General', count: 8, height: '80%', color: '#2563eb' },
              { label: 'Follow-up', count: 5, height: '55%', color: '#60a5fa' },
              { label: 'Diabetes', count: 4, height: '45%', color: '#10b981' },
              { label: 'Hypertension', count: 3, height: '35%', color: '#f59e0b' },
              { label: 'Others', count: 2, height: '25%', color: '#8b5cf6' }
            ].map((bar, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a' }}>{bar.count}</span>
                <div style={{ width: '100%', height: bar.height, backgroundColor: bar.color, borderRadius: '4px 4px 0 0' }} />
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions (8 Grid) */}
        <div className="medios-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <h3>Quick Actions</h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { label: 'New Consultation', icon: UserPlus, screen: 'consultation' as const, color: '#2563eb' },
              { label: 'Create Prescription', icon: FileSignature, screen: 'prescriptions' as const, color: '#2563eb' },
              { label: 'Order Lab Test', icon: FlaskConical, screen: 'lab-reports' as const, color: '#06b6d4' },
              { label: 'Order Imaging', icon: ImageIcon, screen: 'imaging' as const, color: '#06b6d4' },
              { label: 'Generate Clinical Note', icon: FileCheck, screen: 'voice-to-notes' as const, color: '#2563eb' },
              { label: 'Schedule Follow-up', icon: CalendarDays, screen: 'follow-ups' as const, color: '#2563eb' },
              { label: 'View Patient EMR', icon: FolderOpen, screen: 'emr' as const, color: '#2563eb' },
              { label: 'Create Invoice', icon: Receipt, screen: 'billing' as const, color: '#2563eb' }
            ].map((act, i) => {
              const Icon = act.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setActiveScreen(act.screen);
                    showToast(`Navigated to ${act.label}`);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 6px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    gap: '8px',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                >
                  <div style={{ color: act.color }}>
                    <Icon size={20} />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#334155' }}>
                    {act.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
