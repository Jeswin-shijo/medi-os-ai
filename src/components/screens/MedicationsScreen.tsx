import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PatientBanner } from '../layout/PatientBanner';
import { mockPrescriptionItems, mockAdherenceData } from '../../mock/prescriptionsData';
import { PrescriptionItem } from '../../types';
import {
  Plus,
  Search,
  Sparkles,
  Printer,
  FileDown,
  Edit2,
  MoreVertical,
  CheckCircle2,
  Clock,
  RotateCcw
} from 'lucide-react';

export const MedicationsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [meds, setMeds] = useState<PrescriptionItem[]>(mockPrescriptionItems);
  const [medTab, setMedTab] = useState<'Active' | 'Paused' | 'Stopped' | 'Completed'>('Active');
  const [searchMed, setSearchMed] = useState('');

  const filteredMeds = meds.filter(m => {
    const matchesSearch = m.medicine.toLowerCase().includes(searchMed.toLowerCase());
    if (medTab === 'Active') return matchesSearch && m.status === 'Active';
    if (medTab === 'Paused') return matchesSearch && m.status === 'Paused';
    if (medTab === 'Stopped') return matchesSearch && m.status === 'Stopped';
    if (medTab === 'Completed') return matchesSearch && m.status === 'Completed';
    return matchesSearch;
  });

  return (
    <div className="page-scroll-body">
      <PatientBanner currentSubtab="medications" />

      {/* Screen Header */}
      <div className="screen-header-row" style={{ marginTop: '4px' }}>
        <div className="screen-title-area">
          <h1 style={{ fontSize: '1.4rem' }}>Medications</h1>
          <p>View, manage and monitor patient medications</p>
        </div>
        <div className="screen-header-actions">
          <button className="btn-secondary" onClick={() => showToast('Medication reconciliation report matched')}>
            Medication Reconciliation
          </button>
          <button className="btn-primary" onClick={() => showToast('Add medication drawer opened')}>
            <Plus size={16} />
            <span>Add Medication</span>
          </button>
        </div>
      </div>

      {/* 3-Column Medications Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1.5fr 1fr', gap: '20px' }}>
        {/* Left Column: Summary, Indications & Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Medication Summary Cards */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
              Medication Summary
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>6</div>
                <div style={{ fontSize: '0.72rem', color: '#047857' }}>Active Medications</div>
              </div>
              <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706' }}>1</div>
                <div style={{ fontSize: '0.72rem', color: '#b45309' }}>Paused</div>
              </div>
              <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>0</div>
                <div style={{ fontSize: '0.72rem', color: '#b91c1c' }}>Stopped</div>
              </div>
              <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb' }}>0</div>
                <div style={{ fontSize: '0.72rem', color: '#1d4ed8' }}>Completed</div>
              </div>
            </div>
          </div>

          {/* Indications Counts */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
              Indications
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.76rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                <span>Hypertension</span>
                <strong style={{ color: '#0f172a' }}>2</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                <span>Type 2 Diabetes</span>
                <strong style={{ color: '#0f172a' }}>2</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                <span>Hyperlipidemia</span>
                <strong style={{ color: '#0f172a' }}>1</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                <span>Gastric Protection</span>
                <strong style={{ color: '#0f172a' }}>1</strong>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="medios-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Filters</span>
              <span style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer' }} onClick={() => setSearchMed('')}>Reset</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} className="search-icon-left" />
              <input
                type="text"
                className="global-search-input"
                style={{ width: '100%', height: '32px', fontSize: '0.76rem' }}
                placeholder="Search medication..."
                value={searchMed}
                onChange={(e) => setSearchMed(e.target.value)}
              />
            </div>
            <select style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#f8fafc' }}>
              <option>All Status</option>
              <option>Active</option>
              <option>Paused</option>
            </select>
            <select style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#f8fafc' }}>
              <option>All Indications</option>
              <option>Hypertension</option>
              <option>Diabetes</option>
            </select>
          </div>
        </div>

        {/* Center Column: Current Medications & Adherence Meters */}
        <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Current Medications</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '4px 10px' }} onClick={() => showToast('Medication list printed')}>
                <Printer size={12} />
                <span>Print Medication List</span>
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '4px 10px' }} onClick={() => showToast('Medications exported')}>
                <FileDown size={12} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Subtabs: Active, Paused, Stopped, Completed */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['Active', 'Paused', 'Stopped', 'Completed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setMedTab(tab)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: medTab === tab ? '#2563eb' : '#f1f5f9',
                  color: medTab === tab ? '#ffffff' : '#64748b'
                }}
              >
                {tab} ({tab === 'Active' ? '6' : tab === 'Paused' ? '1' : '0'})
              </button>
            ))}
          </div>

          {/* Medications Table */}
          <table className="medios-table" style={{ fontSize: '0.78rem' }}>
            <thead>
              <tr>
                <th style={{ width: '20px' }}>#</th>
                <th>Medicine / Brand</th>
                <th>Dose</th>
                <th>Frequency</th>
                <th>Route</th>
                <th>Indication</th>
                <th>Start Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeds.map((m, idx) => (
                <tr key={m.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.medicine}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{m.brand}</div>
                  </td>
                  <td>{m.dose}</td>
                  <td><span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{m.frequency}</span></td>
                  <td>{m.route}</td>
                  <td>{m.indication}</td>
                  <td>{m.startDate || '12 Sep 2026'}</td>
                  <td>
                    <span className={`status-pill ${m.status === 'Active' ? 'active' : 'waiting'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button style={{ color: '#2563eb' }} onClick={() => showToast(`Edit ${m.medicine}`)}><Edit2 size={13} /></button>
                      <button style={{ color: '#64748b' }}><MoreVertical size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Row: Adherence Circles & Recent Changes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginTop: '10px' }}>
            {/* Adherence Circles */}
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Medication Adherence</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Last 30 Days ▼</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                {mockAdherenceData.map((adh, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        border: `3.5px solid ${adh.color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: '#0f172a'
                      }}
                    >
                      {adh.rate}%
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#475569' }}>{adh.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Changes */}
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Recent Changes</span>
                <span style={{ fontSize: '0.7rem', color: '#2563eb', cursor: 'pointer' }}>View All</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.72rem' }}>
                <div>
                  <span style={{ color: '#d97706', fontWeight: 700 }}>● 12 Sep 2026</span> Levocetirizine 5mg (Paused)
                </div>
                <div>
                  <span style={{ color: '#059669', fontWeight: 700 }}>● 12 Sep 2026</span> Amlodipine 5mg (Started)
                </div>
                <div>
                  <span style={{ color: '#059669', fontWeight: 700 }}>● 12 Sep 2026</span> Metformin 500mg (Started)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Medication Assistant (GPT-6 Astro) */}
        <div className="ai-assistant-card">
          <div className="ai-header-bar">
            <div className="ai-title-row">
              <Sparkles size={16} />
              <span>AI Medication Assistant (GPT-6 Astro)</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7e22ce', marginBottom: '6px' }}>
              ✦ AI Suggestions for this Patient
            </div>
            <ol style={{ fontSize: '0.74rem', color: '#475569', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Continue Amlodipine 5 mg for BP control.</li>
              <li>Metformin dose is appropriate based on HbA1c.</li>
              <li>Consider adding ACE inhibitor if albuminuria present.</li>
              <li>Monitor LFT for Atorvastatin.</li>
              <li>Add PPI only if gastric symptoms persist.</li>
            </ol>
            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: '8px', fontSize: '0.74rem', justifyContent: 'center' }}
              onClick={() => showToast('AI recommendations saved')}
            >
              Apply Suggestions
            </button>
          </div>

          {/* Drug interaction check */}
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 700, fontSize: '0.75rem' }}>
              <CheckCircle2 size={14} />
              <span>No major drug interactions found.</span>
            </div>
            <button className="btn-secondary" style={{ fontSize: '0.68rem', padding: '2px 6px' }} onClick={() => showToast('Full interaction database rechecked: Clear')}>
              Recheck
            </button>
          </div>

          {/* Monitoring & Follow-up */}
          <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e9d5ff', padding: '12px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7e22ce', marginBottom: '6px' }}>
              ✦ Monitoring & Follow-up
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.74rem', color: '#334155' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" defaultChecked />
                <span>Monitor BP weekly</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" defaultChecked />
                <span>Check HbA1c after 3 months</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" defaultChecked />
                <span>LFT after 6 months (Atorvastatin)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" defaultChecked />
                <span>Review need for PPI after 4 weeks</span>
              </label>
            </div>
            <button
              className="btn-secondary"
              style={{ width: '100%', marginTop: '8px', fontSize: '0.72rem', justifyContent: 'center' }}
              onClick={() => showToast('Items scheduled in Follow-ups calendar')}
            >
              Add to Follow-up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
