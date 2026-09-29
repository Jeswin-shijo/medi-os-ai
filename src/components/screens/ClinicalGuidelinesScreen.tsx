import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { mockGuidelinesSpecialties, mockGuidelines } from '../../mock/guidelinesData';
import { ClinicalGuideline } from '../../types';
import {
  Search,
  Plus,
  Sparkles,
  BookOpen,
  Send,
  Bookmark,
  CheckCircle2,
  FileCheck2,
  FileDown,
  RotateCcw,
  ChevronRight,
  AlertTriangle,
  Layers,
  X
} from 'lucide-react';

export const ClinicalGuidelinesScreen: React.FC = () => {
  const { showToast } = useApp();
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [selectedGuidelineId, setSelectedGuidelineId] = useState('g-1');
  const [categoryTab, setCategoryTab] = useState('All Guidelines (1,245)');
  const [activeGuidelineTab, setActiveGuidelineTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiQuestion, setAiQuestion] = useState('What is the first line treatment for hypertension in adults?');
  const [aiTab, setAiTab] = useState('Ask Question');

  const filteredGuidelines = mockGuidelines.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All Specialties' || g.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
    if (!matchesSearch || !matchesSpecialty) return false;

    if (categoryTab.includes('Hospital Protocols')) return g.source.toLowerCase().includes('hospital') || g.isOfficial;
    if (categoryTab.includes('National')) return g.source.toLowerCase().includes('acc') || g.source.toLowerCase().includes('national');
    if (categoryTab.includes('International')) return g.source.toLowerCase().includes('esc') || g.source.toLowerCase().includes('who') || g.source.toLowerCase().includes('international');
    return true;
  });

  const selectedGuideline = filteredGuidelines.find(g => g.id === selectedGuidelineId) || filteredGuidelines[0] || mockGuidelines[0];

  return (
    <div className="page-scroll-body">
      {/* Screen Header */}
      <div className="screen-header-row">
        <div className="screen-title-area">
          <h1>Clinical Guidelines</h1>
          <p>Evidence-based guidance and clinical decision support</p>
        </div>
        <div className="screen-header-actions">
          <button className="btn-secondary" onClick={() => showToast('Guidelines feedback modal opened')}>
            Feedback
          </button>
          <button className="btn-secondary" onClick={() => showToast('3 guideline updates available for review')}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>Guideline Updates</span>
          </button>
          <button className="btn-primary" onClick={() => showToast('New guideline proposal drafted')}>
            <Plus size={16} />
            <span>Request New Guideline</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} className="search-icon-left" />
          <input
            type="text"
            className="global-search-input"
            style={{ width: '100%', height: '42px', fontSize: '0.86rem' }}
            placeholder="Search clinical guidelines (e.g., hypertension, diabetes, sepsis...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-primary" style={{ padding: '0 24px' }}>
          Search
        </button>
      </div>

      {/* Filter Dropdowns Bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <select style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#f8fafc' }}>
          <option>All Specialties</option>
          <option>Internal Medicine</option>
          <option>Cardiology</option>
          <option>Endocrinology</option>
        </select>
        <select style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#f8fafc' }}>
          <option>All Conditions</option>
          <option>Hypertension</option>
          <option>Diabetes</option>
        </select>
        <select style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#f8fafc' }}>
          <option>All Departments</option>
          <option>General Medicine</option>
        </select>
        <select style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#f8fafc' }}>
          <option>All Levels</option>
          <option>High (A)</option>
        </select>
        <select style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#f8fafc' }}>
          <option>All Sources</option>
          <option>ESC 2023</option>
          <option>ADA 2024</option>
        </select>
        <button className="btn-secondary" style={{ marginLeft: 'auto', fontSize: '0.76rem', padding: '6px 10px' }} onClick={() => setSearchQuery('')}>
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* Guidelines Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', overflowX: 'auto' }}>
        {[
          'All Guidelines (1,245)',
          'Favorites (24)',
          'Recently Used (18)',
          'Hospital Protocols (120)',
          'National Guidelines (650)',
          'International Guidelines (475)'
        ].map((tab) => {
          const isSelected = categoryTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setCategoryTab(tab)}
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                color: isSelected ? '#2563eb' : '#64748b',
                background: isSelected ? '#eff6ff' : 'transparent',
                border: isSelected ? '1px solid #bfdbfe' : 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* 3-Column Layout: Specialties | Guidelines Catalog & Detail | AI Assistant */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1.5fr 1fr', gap: '20px' }}>
        {/* Left Column: Specialties */}
        <div className="medios-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>Specialties</span>
          <div style={{ position: 'relative' }}>
            <Search size={12} className="search-icon-left" />
            <input
              type="text"
              placeholder="Search specialties..."
              style={{ width: '100%', height: '28px', fontSize: '0.72rem', paddingLeft: '26px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '640px', overflowY: 'auto' }}>
            {mockGuidelinesSpecialties.map(spec => {
              const isSelected = selectedSpecialty === spec.name;
              return (
                <div
                  key={spec.name}
                  onClick={() => setSelectedSpecialty(spec.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: isSelected ? '#eff6ff' : 'transparent',
                    color: isSelected ? '#2563eb' : '#334155',
                    cursor: 'pointer',
                    fontSize: '0.74rem',
                    fontWeight: isSelected ? 700 : 500
                  }}
                >
                  <span>{spec.name}</span>
                  <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>{spec.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Guidelines Catalog & Expanded Guideline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* List of Guidelines */}
          <div className="medios-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800 }}>Guidelines (1,245)</span>
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.74rem', color: '#64748b' }}>
                <span>Sort by: <strong>Most Relevant</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredGuidelines.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                  No guidelines found matching "{categoryTab}"
                </div>
              ) : (
                filteredGuidelines.map(g => {
                const isSelected = selectedGuidelineId === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGuidelineId(g.id)}
                    style={{
                      border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#ef4444' }}>♥</span>
                        <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>{g.title}</h4>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '0.7rem' }}>
                        <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>{g.specialty}</span>
                        <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>{g.source}</span>
                        <span style={{ background: '#ecfdf5', color: '#047857', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>Evidence: {g.evidenceLevel}</span>
                        <span style={{ background: '#fffbeb', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>{g.recommendationStrength}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{g.version}</span>
                      <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.74rem' }}>
                        Open
                      </button>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* Expanded Guideline Detail Card */}
          {selectedGuideline && (
            <div className="medios-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{selectedGuideline.title}</h3>
                    <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#ecfdf5', color: '#047857', fontWeight: 700 }}>
                      ✓ Official Guideline
                    </span>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                    European Society of Cardiology (ESC) Guidelines 2023
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '4px 8px' }} onClick={() => showToast('Downloaded official ESC guideline PDF')}>
                    <FileDown size={12} />
                    <span>View PDF</span>
                  </button>
                  <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '4px 8px' }} onClick={() => showToast('Protocol linked to patient care plan')}>
                    + Add to Care Plan
                  </button>
                  <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '4px 8px' }}>
                    <Bookmark size={12} />
                  </button>
                </div>
              </div>

              {/* Subtabs: Overview, Recommendations, Assessment, Treatment, Monitoring, Follow-up, Contraindications */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', overflowX: 'auto' }}>
                {['Overview', 'Recommendations', 'Assessment', 'Treatment', 'Monitoring', 'Follow-up', 'Contraindications'].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveGuidelineTab(t)}
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: activeGuidelineTab === t ? '#eff6ff' : 'transparent',
                      color: activeGuidelineTab === t ? '#2563eb' : '#64748b'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Background */}
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Background</span>
                <p style={{ fontSize: '0.76rem', color: '#475569', lineHeight: 1.45 }}>
                  {selectedGuideline.background}
                </p>
              </div>

              {/* Key Points */}
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Key Points</span>
                <ul style={{ fontSize: '0.76rem', color: '#475569', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {selectedGuideline.keyPoints?.map((kp, i) => (
                    <li key={i}>{kp}</li>
                  ))}
                </ul>
              </div>

              {/* Applicable / Not Applicable Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Applicable To
                  </span>
                  <ul style={{ fontSize: '0.72rem', color: '#065f46', paddingLeft: '14px', marginTop: '4px' }}>
                    {selectedGuideline.applicableTo?.map((ap, i) => (
                      <li key={i}>{ap}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <X size={12} /> Not Applicable To
                  </span>
                  <ul style={{ fontSize: '0.72rem', color: '#991b1b', paddingLeft: '14px', marginTop: '4px' }}>
                    {selectedGuideline.notApplicableTo?.map((nap, i) => (
                      <li key={i}>{nap}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Clinical Guidelines Assistant */}
        <div className="ai-assistant-card">
          <div className="ai-header-bar">
            <div className="ai-title-row">
              <Sparkles size={16} />
              <span>AI Clinical Guidelines Assistant</span>
            </div>
          </div>

          <p style={{ fontSize: '0.72rem', color: '#6b21a8' }}>
            Get answers from approved clinical guidelines only. Evidence-based. Cited sources included.
          </p>

          <div style={{ display: 'flex', gap: '4px' }}>
            {['Ask Question', 'Compare', 'Key Points', 'Related'].map(tab => (
              <button
                key={tab}
                onClick={() => setAiTab(tab)}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: aiTab === tab ? '#7e22ce' : '#f3e8ff',
                  color: aiTab === tab ? '#ffffff' : '#7e22ce'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="ai-prompt-box">
            <input
              type="text"
              className="ai-prompt-input"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
            />
            <button className="ai-send-btn" onClick={() => showToast('Guidelines search evaluated')}>
              <Send size={14} />
            </button>
          </div>

          {/* Answer Box */}
          <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e9d5ff', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 700, fontSize: '0.76rem' }}>
              <CheckCircle2 size={14} />
              <span>Answer (from ESC 2023 Guideline)</span>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#334155', lineHeight: 1.45 }}>
              First-line treatment for hypertension in adults includes lifestyle modification for all patients, and pharmacological therapy with one of the following as initial monotherapy:
            </p>
            <ul style={{ fontSize: '0.72rem', color: '#475569', paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li>ACE inhibitor (e.g., Ramipril)</li>
              <li>ARB (e.g., Losartan)</li>
              <li>Calcium channel blocker (e.g., Amlodipine)</li>
              <li>Thiazide or thiazide-like diuretic (e.g., Indapamide)</li>
            </ul>

            <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.7rem', color: '#64748b' }}>
              <strong>Source:</strong> ESC 2023 Guidelines for arterial hypertension, Section 4.2 – Initial pharmacological treatment (Page 25–27)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" style={{ flex: 1, fontSize: '0.72rem', justifyContent: 'center' }} onClick={() => showToast('Protocol appended to treatment plan')}>
              Add to Care Plan
            </button>
            <button className="btn-secondary" style={{ flex: 1, fontSize: '0.72rem', justifyContent: 'center' }} onClick={() => showToast('Comparing ESC 2023 vs ACC/AHA 2017')}>
              Compare Guidelines
            </button>
          </div>

          {/* Disclaimer alert */}
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px', fontSize: '0.68rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} />
            <span>Clinical decision support — final decision remains with treating clinician.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
