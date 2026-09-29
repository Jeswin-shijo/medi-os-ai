import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PatientBanner } from '../layout/PatientBanner';
import { mockLabReports } from '../../mock/labReportsData';
import { LabTestReport } from '../../types';
import {
  Download,
  Plus,
  Search,
  Sparkles,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  TrendingDown,
  FileSignature
} from 'lucide-react';

export const LabReportsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [selectedReportId, setSelectedReportId] = useState('lab-1');
  const [activeCategory, setActiveCategory] = useState('All');
  const [subTab, setSubTab] = useState('Results');
  const [searchTest, setSearchTest] = useState('');

  const currentReport = mockLabReports.find(r => r.id === selectedReportId) || mockLabReports[0];

  const filteredReports = mockLabReports.filter(r => {
    const matchesSearch = r.testName.toLowerCase().includes(searchTest.toLowerCase());
    if (activeCategory === 'All') return matchesSearch;
    return matchesSearch && r.category === activeCategory;
  });

  return (
    <div className="page-scroll-body">
      <PatientBanner currentSubtab="lab-reports" />

      {/* 3-Column Lab Reports Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1.4fr 1fr', gap: '20px' }}>
        {/* Left Column: Reports & Investigations Directory */}
        <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Reports & Investigations</h4>
            <button
              className="btn-primary"
              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
              onClick={() => showToast('New investigation order form opened')}
            >
              <Plus size={12} />
              <span>New Request</span>
            </button>
          </div>

          {/* Categories Bar */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['All', 'Blood', 'Urine', 'Biochemistry', 'Hematology', 'Others'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: activeCategory === cat ? '#2563eb' : '#f1f5f9',
                  color: activeCategory === cat ? '#ffffff' : '#64748b',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={14} className="search-icon-left" />
            <input
              type="text"
              className="global-search-input"
              style={{ width: '100%', height: '32px', fontSize: '0.76rem' }}
              placeholder="Search test name..."
              value={searchTest}
              onChange={(e) => setSearchTest(e.target.value)}
            />
          </div>

          {/* Reports List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '550px' }}>
            {filteredReports.map(rep => {
              const isSelected = selectedReportId === rep.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{rep.date}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginTop: '1px' }}>
                      {rep.testName}
                    </div>
                  </div>
                  <span
                    className={`status-pill ${
                      rep.status === 'Completed' ? 'completed' : rep.status === 'Abnormal' ? 'abnormal' : 'pending'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>
              );
            })}
          </div>

          <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', marginTop: 'auto' }}>
            Load More Reports
          </button>
        </div>

        {/* Center Column: Detailed Lab Report Parameters & Gauges */}
        <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{currentReport.testName}</h3>
                <span className={`status-pill ${currentReport.status === 'Completed' ? 'completed' : 'abnormal'}`}>
                  {currentReport.status}
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                {currentReport.date} | {currentReport.time}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                onClick={() => showToast(`Downloaded ${currentReport.testName} PDF`)}
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Subtabs: Results, Trends, Report Details, Previous Reports */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
            {['Results', 'Trends', 'Report Details', 'Previous Reports'].map(tab => (
              <button
                key={tab}
                onClick={() => setSubTab(tab)}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: subTab === tab ? '#eff6ff' : 'transparent',
                  color: subTab === tab ? '#2563eb' : '#64748b',
                  border: subTab === tab ? '1px solid #bfdbfe' : 'none'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Parameters Table with Visual Gauges */}
          {subTab === 'Results' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="medios-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Result</th>
                    <th>Reference Range</th>
                    <th>Unit</th>
                    <th>Status</th>
                    <th style={{ width: '130px' }}>Range Gauge</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReport.groups.map(group => (
                    <React.Fragment key={group.category}>
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan={6} style={{ fontWeight: 800, color: '#334155', fontSize: '0.78rem', padding: '6px 14px' }}>
                          ▼ {group.category}
                        </td>
                      </tr>
                      {group.parameters.map(param => (
                        <tr key={param.id}>
                          <td style={{ fontWeight: 600 }}>{param.name}</td>
                          <td style={{ fontWeight: 700, color: param.status === 'Low' || param.status === 'High' ? '#dc2626' : '#0f172a' }}>
                            {param.result}
                          </td>
                          <td style={{ color: '#64748b' }}>{param.referenceRange}</td>
                          <td style={{ color: '#64748b' }}>{param.unit}</td>
                          <td>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: param.status === 'Normal' ? '#d1fae5' : '#fee2e2',
                                color: param.status === 'Normal' ? '#065f46' : '#991b1b'
                              }}
                            >
                              {param.status}
                            </span>
                          </td>
                          <td>
                            {/* Visual Range Slider Indicator */}
                            <div style={{ position: 'relative', width: '100px', height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
                              {/* Normal safe zone marker */}
                              <div style={{ position: 'absolute', left: '25%', width: '50%', height: '100%', background: '#bbf7d0', borderRadius: '2px' }} />
                              {/* Position pin */}
                              <div
                                style={{
                                  position: 'absolute',
                                  left: `${param.relativePosition || 50}%`,
                                  top: '-3px',
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  background: param.status === 'Normal' ? '#10b981' : '#ef4444',
                                  border: '2px solid #ffffff',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                  transform: 'translateX(-50%)'
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Subtab: Trends */}
          {subTab === 'Trends' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                Longitudinal Biomarker Trends
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.76rem' }}>
                  <span style={{ fontWeight: 700, color: '#dc2626' }}>HbA1c Trend (Target &lt; 7.0%)</span>
                  <span style={{ color: '#64748b' }}>Past 3 Tests</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '80px', padding: '10px 0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ height: '50px', width: '32px', background: '#93c5fd', borderRadius: '4px', margin: '0 auto' }} />
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: '4px' }}>7.1%</div>
                    <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Mar 2026</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ height: '56px', width: '32px', background: '#60a5fa', borderRadius: '4px', margin: '0 auto' }} />
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: '4px' }}>7.4%</div>
                    <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Jun 2026</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ height: '70px', width: '32px', background: '#ef4444', borderRadius: '4px', margin: '0 auto' }} />
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>7.8%</div>
                    <div style={{ fontSize: '0.64rem', color: '#64748b' }}>12 Sep 2026</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subtab: Report Details */}
          {subTab === 'Report Details' && (
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>Specimen & Laboratory Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Specimen Type</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Whole Blood (EDTA Tube)</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Collection Time</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>12 Sep 2026, 09:30 AM</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Certifying Pathologist</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Dr. Meera, MD (Pathology)</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>NABL Accreditation</div>
                  <div style={{ fontWeight: 700, color: '#059669' }}>Verified • MC-2849</div>
                </div>
              </div>
            </div>
          )}

          {/* Subtab: Previous Reports */}
          {subTab === 'Previous Reports' && (
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>Historical Lab Enounters</div>
              {[
                { date: '12 Sep 2026', test: 'Comprehensive Metabolic Panel', status: 'Completed', doctor: 'Dr. Meera' },
                { date: '05 Aug 2026', test: 'Lipid Profile & Glucose Fasting', status: 'Completed', doctor: 'Dr. Meera' },
                { date: '21 Mar 2026', test: 'Liver Function Test (LFT)', status: 'Completed', doctor: 'Dr. Meera' },
                { date: '10 Jan 2026', test: 'Cardiac Biomarkers (Hs-Troponin)', status: 'Completed', doctor: 'Central Lab' }
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.76rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.test}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{r.date} • {r.doctor}</div>
                  </div>
                  <span className="status-pill completed" style={{ fontSize: '0.64rem' }}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Lab Summary & Trends Graph */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* AI Lab Summary Card */}
          <div className="ai-assistant-card">
            <div className="ai-header-bar">
              <div className="ai-title-row">
                <Sparkles size={16} />
                <span>AI Lab Summary (GPT-6 Astro)</span>
              </div>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                onClick={() => showToast('AI Lab interpretation refreshed')}
              >
                <RotateCcw size={12} />
                <span>Regenerate</span>
              </button>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7e22ce', marginBottom: '6px' }}>
                ✦ Key Findings
              </div>
              <ul style={{ fontSize: '0.74rem', color: '#475569', paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {currentReport.aiSummary.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7e22ce', marginBottom: '4px' }}>
                ✦ Clinical Interpretation
              </div>
              <p style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.45 }}>
                {currentReport.aiSummary.interpretation}
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7e22ce' }}>
                  ✦ Recommendations
                </div>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.68rem', padding: '2px 6px', color: '#2563eb' }}
                  onClick={() => showToast('Recommendations added to Consultation Plan')}
                >
                  + Add to Plan
                </button>
              </div>
              <ul style={{ fontSize: '0.74rem', color: '#475569', paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {currentReport.aiSummary.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Trends Graph Widget */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Trends</span>
              <span style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>View All Trends</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <select style={{ fontSize: '0.74rem', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                <option>Hemoglobin (Hb)</option>
                <option>RBC Count</option>
                <option>Platelets</option>
              </select>

              <div style={{ display: 'flex', gap: '4px' }}>
                {['3M', '6M', '1Y', 'All'].map(range => (
                  <button
                    key={range}
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: range === '1Y' ? '#2563eb' : '#f1f5f9',
                      color: range === '1Y' ? '#ffffff' : '#64748b'
                    }}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Downward Trend Chart Visual */}
            <div style={{ height: '90px', width: '100%', position: 'relative', marginTop: '6px' }}>
              <svg width="100%" height="90" viewBox="0 0 280 90">
                <line x1="20" y1="20" x2="260" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="20" y1="50" x2="260" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="20" y1="80" x2="260" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />

                {/* Downward line: 12.8 -> 12.1 -> 11.6 -> 10.4 */}
                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  points="30,22 100,34 180,44 250,68"
                />

                <circle cx="30" cy="22" r="4" fill="#ef4444" />
                <text x="24" y="14" fontSize="10" fontWeight="700" fill="#ef4444">12.8</text>

                <circle cx="100" cy="34" r="4" fill="#ef4444" />
                <text x="94" y="26" fontSize="10" fontWeight="700" fill="#ef4444">12.1</text>

                <circle cx="180" cy="44" r="4" fill="#ef4444" />
                <text x="174" y="36" fontSize="10" fontWeight="700" fill="#ef4444">11.6</text>

                <circle cx="250" cy="68" r="4" fill="#ef4444" />
                <text x="242" y="60" fontSize="10" fontWeight="700" fill="#ef4444">10.4</text>
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', padding: '0 8px' }}>
                <span>Jan 2026</span>
                <span>Mar 2026</span>
                <span>Jun 2026</span>
                <span>Sep 2026</span>
              </div>
            </div>
          </div>

          {/* Related Actions */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Related Actions</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '10px' }}>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('Follow-up test scheduled in 4 weeks')}>
                Order Follow-up Test
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('Comparing CBC 12 Sep with CBC 15 Jun')}>
                Compare with Previous
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('GPT-6 Astro: Microcytic anemia confirmed by MCV 80')}>
                Explain this Result
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('Lab findings appended to Clinical EMR')}>
                Add to Clinical Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
