import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PatientBanner } from '../layout/PatientBanner';
import { mockImagingStudies } from '../../mock/imagingData';
import { ImagingStudy } from '../../types';
import {
  Upload,
  Plus,
  Search,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCw,
  Sun,
  Ruler,
  Edit3,
  Type,
  Maximize2,
  MousePointer,
  CheckCircle2,
  ExternalLink,
  Layers
} from 'lucide-react';

export const ImagingScreen: React.FC = () => {
  const { showToast } = useApp();
  const [selectedStudyId, setSelectedStudyId] = useState('img-1');
  const [activeModality, setActiveModality] = useState('All Images');
  const [activeSliceIndex, setActiveSliceIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(52);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [activeTool, setActiveTool] = useState<string>('pointer');

  const filteredStudies = mockImagingStudies.filter(study => {
    if (activeModality === 'All Images') return true;
    const cleanMod = activeModality.toLowerCase().replace('scan', '').replace('(usg)', '').replace('others', '').trim();
    return study.modality.toLowerCase().includes(cleanMod);
  });

  const currentStudy = filteredStudies.find(s => s.id === selectedStudyId) || filteredStudies[0] || mockImagingStudies[0];

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.max(20, Math.min(200, prev + delta)));
  };

  const handleAdjustBrightness = () => {
    setBrightness(prev => (prev === 100 ? 130 : prev === 130 ? 70 : 100));
    showToast(`Windowing brightness adjusted to ${brightness}%`);
  };

  return (
    <div className="page-scroll-body">
      <PatientBanner currentSubtab="imaging" />

      {/* Screen Header */}
      <div className="screen-header-row" style={{ marginTop: '4px' }}>
        <div className="screen-title-area">
          <h1 style={{ fontSize: '1.4rem' }}>Imaging (RIS)</h1>
          <p>View, analyse and manage radiology images and reports</p>
        </div>
        <div className="screen-header-actions">
          <button className="btn-secondary" onClick={() => showToast('Radiology request form opened')}>
            Request Imaging
          </button>
          <button className="btn-primary" onClick={() => showToast('DICOM file uploader active')}>
            <Plus size={16} />
            <span>Upload Image</span>
          </button>
        </div>
      </div>

      {/* Modality Subtabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
        {['All Images', 'X-Ray', 'CT Scan', 'MRI', 'Ultrasound (USG)', 'Mammography', 'Others'].map(mod => (
          <button
            key={mod}
            onClick={() => setActiveModality(mod)}
            style={{
              padding: '5px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '6px',
              background: activeModality === mod ? '#2563eb' : 'transparent',
              color: activeModality === mod ? '#ffffff' : '#64748b'
            }}
          >
            {mod}
          </button>
        ))}
      </div>

      {/* 3-Column Imaging Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1.5fr 1fr', gap: '20px' }}>
        {/* Left Column: Studies List */}
        <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800 }}>Imaging Studies</h4>
            <button className="btn-primary" style={{ fontSize: '0.72rem', padding: '4px 8px' }} onClick={() => showToast('New imaging order created')}>
              <Plus size={12} />
              <span>New Request</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <select style={{ fontSize: '0.74rem', padding: '4px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
              <option>All Modality</option>
              <option>X-Ray</option>
              <option>CT Scan</option>
              <option>MRI</option>
            </select>
            <select style={{ fontSize: '0.74rem', padding: '4px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
              <option>All Dates</option>
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={14} className="search-icon-left" />
            <input
              type="text"
              className="global-search-input"
              style={{ width: '100%', height: '32px', fontSize: '0.76rem' }}
              placeholder="Search by study name or body part..."
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '560px' }}>
            {filteredStudies.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                No studies for "{activeModality}"
              </div>
            ) : (
              filteredStudies.map(study => {
              const isSelected = selectedStudyId === study.id;
              return (
                <div
                  key={study.id}
                  onClick={() => {
                    setSelectedStudyId(study.id);
                    setActiveSliceIndex(0);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <img
                    src={study.thumbnailUrl}
                    alt={study.title}
                    style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', background: '#000' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{study.title}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{study.date} • {study.time}</div>
                    <div style={{ fontSize: '0.68rem', color: '#334155' }}>{study.modality}</div>
                  </div>
                  <span className="status-pill completed" style={{ fontSize: '0.65rem' }}>{study.status}</span>
                </div>
              );
            }))}
          </div>

          <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', marginTop: 'auto' }}>
            Load More Studies
          </button>
        </div>

        {/* Center Column: Interactive DICOM Viewer */}
        <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
          {/* Study Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{currentStudy.title}</h3>
                <span className="status-pill completed">{currentStudy.status}</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {currentStudy.date} {currentStudy.time} | {currentStudy.modality} | {currentStudy.bodyPart} | {currentStudy.radiologist}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '4px 8px' }} onClick={() => showToast('Side-by-side temporal comparison mode enabled')}>
                <Layers size={12} />
                <span>Compare</span>
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '4px 8px' }} onClick={() => showToast('Radiology report downloaded')}>
                Report
              </button>
              <button className="btn-primary" style={{ fontSize: '0.72rem', padding: '4px 8px' }} onClick={() => showToast('AI Radiology deep scan complete (92% confidence)')}>
                <Sparkles size={12} />
                <span>AI Analysis</span>
              </button>
            </div>
          </div>

          {/* DICOM Viewer Canvas with Left Toolbar and Right Thumbnails */}
          <div style={{ display: 'flex', height: '390px', background: '#000000', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            {/* Left Tool Ribbon */}
            <div style={{ width: '42px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: '10px', zIndex: 10 }}>
              <button style={{ color: activeTool === 'pointer' ? '#38bdf8' : '#94a3b8' }} onClick={() => setActiveTool('pointer')} title="Select / Pointer"><MousePointer size={16} /></button>
              <button style={{ color: '#94a3b8' }} onClick={() => handleZoom(10)} title="Zoom In"><ZoomIn size={16} /></button>
              <button style={{ color: '#94a3b8' }} onClick={() => handleZoom(-10)} title="Zoom Out"><ZoomOut size={16} /></button>
              <button style={{ color: activeTool === 'pan' ? '#38bdf8' : '#94a3b8' }} onClick={() => setActiveTool('pan')} title="Pan / Move"><Move size={16} /></button>
              <button style={{ color: '#94a3b8' }} onClick={() => showToast('Rotated image 90°')} title="Rotate"><RotateCw size={16} /></button>
              <button style={{ color: '#94a3b8' }} onClick={handleAdjustBrightness} title="Windowing / Brightness"><Sun size={16} /></button>
              <button style={{ color: '#94a3b8' }} onClick={() => showToast('Distance calibration tool ready')} title="Measure"><Ruler size={16} /></button>
              <button style={{ color: '#94a3b8' }} onClick={() => showToast('Annotation pencil active')} title="Annotate"><Edit3 size={16} /></button>
              <button style={{ color: '#94a3b8' }} onClick={() => showToast('Text label tool active')} title="Text"><Type size={16} /></button>
              <button style={{ color: '#94a3b8', marginTop: 'auto' }} onClick={() => showToast('Fullscreen DICOM mode')} title="Fullscreen"><Maximize2 size={16} /></button>
            </div>

            {/* Central Viewport Image */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <span style={{ position: 'absolute', top: '12px', left: '16px', color: '#ffffff', fontWeight: 800, fontSize: '1.2rem', fontFamily: 'monospace' }}>
                R
              </span>

              <img
                src={currentStudy.slices[activeSliceIndex] || currentStudy.thumbnailUrl}
                alt="DICOM Slice"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `scale(${zoomLevel / 52})`,
                  filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                  transition: 'transform 0.15s ease'
                }}
              />

              {/* HUD Overlay Stats */}
              <div style={{ position: 'absolute', bottom: '8px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '0.72rem', fontFamily: 'monospace' }}>
                <div>Zoom: {zoomLevel}% • W: 4096 • L: 2048</div>
                <div>{activeSliceIndex + 1} / {currentStudy.slices.length || 3}</div>
              </div>
            </div>

            {/* Right Slices Strip */}
            <div style={{ width: '68px', background: '#0a0f1d', display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 6px', overflowY: 'auto', borderLeft: '1px solid #1e293b' }}>
              {[0, 1, 2].map((sliceIdx) => (
                <div
                  key={sliceIdx}
                  onClick={() => setActiveSliceIndex(sliceIdx % (currentStudy.slices.length || 1))}
                  style={{
                    borderRadius: '4px',
                    border: activeSliceIndex === sliceIdx ? '2px solid #38bdf8' : '1px solid #334155',
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={currentStudy.slices[sliceIdx % currentStudy.slices.length] || currentStudy.thumbnailUrl}
                    alt={`Slice ${sliceIdx + 1}`}
                    style={{ width: '100%', height: '52px', objectFit: 'cover' }}
                  />
                  <div style={{ color: '#94a3b8', fontSize: '0.62rem', textAlign: 'center', background: '#000', padding: '2px 0' }}>
                    Image {sliceIdx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Related Images / Previous Studies Carousel Strip */}
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
              Related Images / Previous Studies
            </span>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {mockImagingStudies.map(s => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudyId(s.id)}
                  style={{
                    minWidth: '95px',
                    background: '#f8fafc',
                    border: selectedStudyId === s.id ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <img src={s.thumbnailUrl} alt={s.title} style={{ width: '100%', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0f172a', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '0.64rem', color: '#64748b' }}>{s.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Radiologist Report */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* AI Imaging Analysis Card */}
          <div className="ai-assistant-card">
            <div className="ai-header-bar">
              <div className="ai-title-row">
                <Sparkles size={16} />
                <span>AI Imaging Analysis (GPT-6 Astro)</span>
              </div>
              <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#f3e8ff', color: '#7e22ce' }}>
                BETA
              </span>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7e22ce', marginBottom: '4px' }}>
                ✦ Findings
              </div>
              <ul style={{ fontSize: '0.74rem', color: '#475569', paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {currentStudy.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            {/* Green Impression Alert Box */}
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 700, fontSize: '0.78rem' }}>
                <CheckCircle2 size={14} />
                <span>Impression (AI)</span>
              </div>
              <p style={{ fontSize: '0.76rem', color: '#065f46', marginTop: '3px', lineHeight: 1.4 }}>
                {currentStudy.impression}
              </p>
            </div>

            {/* Confidence Score Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Confidence Score</span>
                <span style={{ fontWeight: 800, color: '#059669' }}>{currentStudy.confidenceScore}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${currentStudy.confidenceScore}%`, height: '100%', background: '#10b981', borderRadius: '4px' }} />
              </div>
            </div>

            <button
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', marginTop: '4px' }}
              onClick={() => showToast('Detailed structured AI imaging report generated')}
            >
              Generate Detailed Report
            </button>
          </div>

          {/* Radiologist Report Card */}
          <div className="medios-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Radiologist Report</span>
              <span style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>
                View Full Report
              </span>
            </div>

            <div style={{ fontSize: '0.76rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Findings:</strong> {currentStudy.radiologistReport.findings}</div>
              <div><strong>Impression:</strong> {currentStudy.radiologistReport.impression}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: '#64748b', fontSize: '0.7rem' }}>
                <span>Reported By: {currentStudy.radiologistReport.reportedBy}</span>
                <span>{currentStudy.radiologistReport.reportedOn}</span>
              </div>
              <div style={{ marginTop: '2px' }}>
                <span className="status-pill completed" style={{ fontSize: '0.68rem' }}>
                  {currentStudy.radiologistReport.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
