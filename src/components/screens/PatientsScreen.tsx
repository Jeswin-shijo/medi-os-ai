import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Patient } from '../../types';
import { patientService } from '../../services';
import {
  Search,
  Plus,
  FileDown,
  Sparkles,
  Heart,
  Activity,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  MoreVertical,
  X,
  UserCheck,
  FolderOpen,
  FileSignature
} from 'lucide-react';

export const PatientsScreen: React.FC = () => {
  const { activePatient, setActivePatient, setActiveScreen, showToast } = useApp();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All Patients');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('p-1');
  const [drawerSubtab, setDrawerSubtab] = useState<'Overview' | 'Timeline' | 'Consultations' | 'Lab Reports' | 'Imaging'>('Overview');
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  // New Patient Form State
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState<'Male' | 'Female'>('Male');
  const [newPhone, setNewPhone] = useState('');
  const [newBloodGroup, setNewBloodGroup] = useState('B+');
  const [newDepartment, setNewDepartment] = useState('General Medicine');
  const [newConditions, setNewConditions] = useState('');

  useEffect(() => {
    patientService.getPatients().then((list) => {
      setPatients(list);
      if (list.length > 0 && !activePatient) {
        setActivePatient(list[0]);
        setSelectedPatientId(list[0].id);
      }
    });
  }, []);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatientId(p.id);
    setActivePatient(p);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    const conditionArr = newConditions ? newConditions.split(',').map(c => c.trim()) : ['Hypertension'];
    const added = await patientService.addPatient({
      uhid: `MHK202500${Math.floor(100 + Math.random() * 900)}`,
      name: newName,
      age: parseInt(newAge) || 30,
      gender: newGender,
      phone: newPhone,
      bloodGroup: newBloodGroup,
      visitType: 'OPD',
      status: 'Today',
      department: newDepartment,
      lastVisit: 'Today',
      doctor: 'Dr. Shajin',
      conditions: conditionArr,
      allergies: []
    });

    const refreshed = await patientService.getPatients();
    setPatients(refreshed);
    handleSelectPatient(added);
    setIsAddPatientOpen(false);
    showToast(`Patient ${added.name} successfully registered!`);
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);

    if (activeTab === "Today's Patients") return matchesSearch && p.status === 'Today';
    if (activeTab === 'Inpatients') return matchesSearch && p.visitType === 'IPD';
    if (activeTab === 'Outpatients') return matchesSearch && p.visitType === 'OPD';
    if (activeTab === 'Follow-ups') return matchesSearch && p.status === 'Follow-up';
    return matchesSearch;
  });

  return (
    <div className="page-scroll-body">
      {/* Page Title & Actions */}
      <div className="screen-header-row">
        <div className="screen-title-area">
          <h1>Patients</h1>
          <p>View, search and manage all your patients</p>
        </div>
        <div className="screen-header-actions">
          <button className="btn-primary" onClick={() => setIsAddPatientOpen(true)}>
            <Plus size={16} />
            <span>Add New Patient</span>
          </button>
          <button className="btn-secondary" onClick={() => showToast('Importing records from EMR...')}>
            <FileDown size={16} />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', overflowX: 'auto', maxWidth: '100%' }}>
        {[
          'All Patients',
          "Today's Patients",
          'Inpatients',
          'Outpatients',
          'Follow-ups',
          'Recently Discharged',
          'My Patients'
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 14px',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: activeTab === tab ? '#2563eb' : '#64748b',
              borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
              background: 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filter Controls Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#ffffff',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} className="search-icon-left" />
          <input
            type="text"
            className="global-search-input"
            style={{ width: '100%' }}
            placeholder="Search by name, UHID, phone, or IP number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#f8fafc' }}>
          <option>Department: All</option>
          <option>General Medicine</option>
          <option>Cardiology</option>
          <option>Endocrinology</option>
        </select>

        <select style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#f8fafc' }}>
          <option>Status: All</option>
          <option>Today</option>
          <option>Admitted</option>
          <option>Follow-up</option>
        </select>

        <select style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#f8fafc' }}>
          <option>Date Range: Today</option>
          <option>This Week</option>
          <option>This Month</option>
        </select>

        <button className="btn-secondary" style={{ padding: '8px 12px' }}>
          <SlidersHorizontal size={14} />
          <span>More Filters</span>
        </button>

        <button
          className="btn-secondary"
          style={{ padding: '8px 12px', color: '#64748b' }}
          onClick={() => setSearchQuery('')}
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Content Layout: Patient Table & Selected Detail Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
        {/* Patients Table Card */}
        <div className="medios-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="medios-table">
              <thead>
                <tr>
                  <th style={{ width: '36px' }}>
                    <input type="checkbox" />
                  </th>
                  <th style={{ width: '30px' }}>#</th>
                  <th>Patient</th>
                  <th>Age / Gender</th>
                  <th>UHID / IP No</th>
                  <th>Visit Type</th>
                  <th>Last Visit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((pat, index) => {
                  const isSelected = selectedPatient?.id === pat.id;
                  return (
                    <tr
                      key={pat.id}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => handleSelectPatient(pat)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => handleSelectPatient(pat)} />
                      </td>
                      <td>{index + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>
                            {pat.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' }}>
                              {pat.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {pat.phone}
                            </div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                              {pat.conditions.map((c, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: '0.66rem',
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                    fontWeight: 600
                                  }}
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {pat.age} Yrs
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{pat.gender}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{pat.uhid}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>IP-12{56 + index}</div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: pat.visitType === 'OPD' ? '#ecfdf5' : '#fef2f2',
                            color: pat.visitType === 'OPD' ? '#059669' : '#dc2626'
                          }}
                        >
                          {pat.visitType}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{pat.lastVisit}</div>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            pat.status === 'Today' ? 'today' : pat.status === 'Admitted' ? 'admitted' : 'follow-up'
                          }`}
                        >
                          {pat.status}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="btn-secondary" style={{ padding: '4px 8px' }}>
                          <MoreVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#64748b'
            }}
          >
            <span>Showing 1 to {filteredPatients.length} of {patients.length} patients</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="btn-secondary" style={{ padding: '3px 8px' }}>&lt;</button>
              <button className="btn-primary" style={{ padding: '3px 8px' }}>1</button>
              <button className="btn-secondary" style={{ padding: '3px 8px' }}>2</button>
              <button className="btn-secondary" style={{ padding: '3px 8px' }}>&gt;</button>
            </div>
          </div>
        </div>

        {/* Right Patient Profile & AI Summary Panel */}
        {selectedPatient && (
          <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                  alt={selectedPatient.name}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #3b82f6', objectFit: 'cover' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    {selectedPatient.name} ♂
                  </h3>
                  <p style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    {selectedPatient.age} years • {selectedPatient.gender} • UHID: {selectedPatient.uhid}
                  </p>
                  <p style={{ fontSize: '0.74rem', color: '#64748b' }}>{selectedPatient.phone}</p>
                </div>
              </div>
              <button className="btn-secondary" style={{ padding: '4px 6px' }}>
                <MoreVertical size={16} />
              </button>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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

            {/* Subtabs strip */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              {(['Overview', 'Timeline', 'Consultations', 'Lab Reports', 'Imaging'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDrawerSubtab(t)}
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: drawerSubtab === t ? '#2563eb' : '#64748b',
                    borderBottom: drawerSubtab === t ? '2px solid #2563eb' : '2px solid transparent',
                    paddingBottom: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {drawerSubtab === 'Overview' && (
              <>

            {/* AI Patient Summary Box */}
            <div
              style={{
                backgroundColor: '#faf5ff',
                border: '1px solid #e9d5ff',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7e22ce', fontWeight: 700, fontSize: '0.84rem' }}>
                  <Sparkles size={14} />
                  <span>AI Patient Summary</span>
                </div>
                <button
                  className="btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '0.72rem', color: '#7e22ce', borderColor: '#d8b4fe' }}
                  onClick={() => showToast('AI Clinical insights refreshed for Arun Kumar')}
                >
                  Ask AI
                </button>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#4c1d95', lineHeight: 1.45 }}>
                {selectedPatient.aiSummary?.summary || '34-year-old male with hypertension and type 2 diabetes. Last seen 12 days ago for BP review. Reports mild cough and fever for 3 days.'}
              </p>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b21a8', marginBottom: '4px' }}>
                  Key Points:
                </div>
                <ul style={{ paddingLeft: '16px', fontSize: '0.75rem', color: '#581c87', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <li>Elevated HbA1c (7.8) ↑</li>
                  <li>BP trend slightly higher in last 2 visits</li>
                  <li>Pending renal function test review</li>
                  <li>Assess for respiratory infection</li>
                </ul>
              </div>
            </div>

            {/* Vitals (Last Visit) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>Vitals (Last Visit)</span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>12 Sep 2026</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>BP</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#dc2626' }}>140/90</div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>mmHg</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>HR</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>86</div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>bpm</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Temp</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>98.4</div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>°F</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>SpO₂</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#059669' }}>98</div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>%</div>
                </div>
              </div>
            </div>

            {/* Current Medications */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>Current Medications</span>
                <span
                  style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setActiveScreen('medications')}
                >
                  View All
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                  <span>Tab Amlodipine 5 mg (OD)</span>
                  <span style={{ color: '#64748b', fontFamily: 'monospace' }}>1-0-0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                  <span>Tab Metformin 500 mg (BD)</span>
                  <span style={{ color: '#64748b', fontFamily: 'monospace' }}>1-0-1</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                  <span>Tab Atorvastatin 10 mg (OD)</span>
                  <span style={{ color: '#64748b', fontFamily: 'monospace' }}>0-1-0</span>
                </div>
              </div>
            </div>
            </>
            )}

            {/* TAB CONTENT: Timeline */}
            {drawerSubtab === 'Timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Recent Patient Encounters</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { date: '26 Sep 2026', title: 'Follow-up Consultation', doctor: 'Dr. Shajin', type: 'Consultation' },
                    { date: '26 Sep 2026', title: 'Triage Vitals Check-in', doctor: 'Nurse Anjali', type: 'Vitals' },
                    { date: '12 Sep 2026', title: 'Chest X-Ray (PA View)', doctor: 'Dr. Ravi', type: 'Imaging' },
                    { date: '12 Sep 2026', title: 'HbA1c & Fasting Glucose', doctor: 'Central Lab', type: 'Lab' }
                  ].map((evt, i) => (
                    <div key={i} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.76rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.7rem' }}>
                        <span>{evt.date}</span>
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>{evt.type}</span>
                      </div>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{evt.title}</div>
                      <div style={{ color: '#475569', fontSize: '0.7rem' }}>{evt.doctor}</div>
                    </div>
                  ))}
                </div>
                <button
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.76rem', color: '#2563eb' }}
                  onClick={() => {
                    setActivePatient(selectedPatient);
                    setActiveScreen('timeline');
                  }}
                >
                  Open Full Longitudinal Timeline →
                </button>
              </div>
            )}

            {/* TAB CONTENT: Consultations */}
            {drawerSubtab === 'Consultations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Consultation Records</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '0.76rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#1e40af' }}>
                      <span>26 Sep 2026 • 09:15 AM</span>
                      <span className="status-pill waiting" style={{ fontSize: '0.64rem' }}>In Progress</span>
                    </div>
                    <div style={{ color: '#1e3a8a', marginTop: '3px' }}>Reason: Fever, mild cough for 3 days</div>
                    <div style={{ color: '#3b82f6', fontSize: '0.7rem' }}>Dr. Shajin • General Medicine</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.76rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#334155' }}>
                      <span>12 Sep 2026 • 10:00 AM</span>
                      <span className="status-pill completed" style={{ fontSize: '0.64rem' }}>Completed</span>
                    </div>
                    <div style={{ color: '#0f172a', marginTop: '3px' }}>BP & Diabetes 3-month review</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Dr. Shajin • General Medicine</div>
                  </div>
                </div>
                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.76rem' }}
                  onClick={() => {
                    setActivePatient(selectedPatient);
                    setActiveScreen('consultation');
                  }}
                >
                  Open Consultation Workspace
                </button>
              </div>
            )}

            {/* TAB CONTENT: Lab Reports */}
            {drawerSubtab === 'Lab Reports' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Recent Lab Tests</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.76rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>HbA1c (Glycated Hb)</span>
                      <span style={{ color: '#dc2626', fontWeight: 800 }}>7.8% (High)</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Ref: &lt; 5.7% • 12 Sep 2026</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.76rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>Fasting Blood Glucose</span>
                      <span style={{ color: '#dc2626', fontWeight: 800 }}>134 mg/dL (High)</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Ref: 70–100 mg/dL • 12 Sep 2026</div>
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.76rem', color: '#2563eb' }}
                  onClick={() => {
                    setActivePatient(selectedPatient);
                    setActiveScreen('lab-reports');
                  }}
                >
                  View Full Lab Diagnostic Workspace →
                </button>
              </div>
            )}

            {/* TAB CONTENT: Imaging */}
            {drawerSubtab === 'Imaging' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Imaging & Radiology Studies</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.76rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>Chest X-Ray (PA View)</span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>Clear</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>12 Sep 2026 • Dr. Ravi (Radiology)</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.76rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>USG Whole Abdomen</span>
                      <span style={{ color: '#d97706', fontWeight: 700 }}>Grade 1 Fatty Liver</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>21 Mar 2026 • Dr. Ravi (Radiology)</div>
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.76rem', color: '#2563eb' }}
                  onClick={() => {
                    setActivePatient(selectedPatient);
                    setActiveScreen('imaging');
                  }}
                >
                  Open DICOM Imaging Workspace →
                </button>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setActivePatient(selectedPatient);
                  setActiveScreen('consultation');
                }}
              >
                <UserCheck size={16} />
                <span>Start Consultation</span>
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  className="btn-secondary"
                  style={{ justifyContent: 'center' }}
                  onClick={() => {
                    setActivePatient(selectedPatient);
                    setActiveScreen('emr');
                  }}
                >
                  <FolderOpen size={14} />
                  <span>View Full EMR</span>
                </button>
                <button
                  className="btn-secondary"
                  style={{ justifyContent: 'center' }}
                  onClick={() => {
                    setActivePatient(selectedPatient);
                    setActiveScreen('prescriptions');
                  }}
                >
                  <FileSignature size={14} />
                  <span>Prescribe</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add New Patient Modal */}
      {isAddPatientOpen && (
        <div className="modal-overlay" onClick={() => setIsAddPatientOpen(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Register New Patient</h3>
              <button onClick={() => setIsAddPatientOpen(false)} style={{ color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreatePatient}>
              <div className="modal-body">
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arun Kumar"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Age *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 34"
                      value={newAge}
                      onChange={(e) => setNewAge(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Gender *</label>
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value as any)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', background: '#ffffff' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Blood Group</label>
                    <select
                      value={newBloodGroup}
                      onChange={(e) => setNewBloodGroup(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', background: '#ffffff' }}
                    >
                      <option>A+</option>
                      <option>B+</option>
                      <option>O+</option>
                      <option>AB+</option>
                      <option>O-</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', background: '#ffffff' }}
                  >
                    <option>General Medicine</option>
                    <option>Cardiology</option>
                    <option>Endocrinology</option>
                    <option>Surgery</option>
                    <option>Pediatrics</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Known Conditions (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Hypertension, Type 2 Diabetes"
                    value={newConditions}
                    onChange={(e) => setNewConditions(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddPatientOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
