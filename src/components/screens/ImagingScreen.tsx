import React, { useId, useRef, useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { PatientBanner, type BannerTab } from '../layout/PatientBanner';
import { ScreenHeader } from '../common/ScreenHeader';
import { AiSparkle } from '../common/icons';
import { mockImagingStudies, IMAGING_IMAGES } from '../../mock/imagingData';
import type { ImagingStudy } from '../../types';
import {
  Plus,
  Search,
  CalendarPlus,
  ChevronDown,
  EllipsisVertical,
  ScanSearch,
  FileText,
  ScanEye,
  SquarePen,
  BadgeCheck,
  Copy,
  MousePointer2,
  ZoomIn,
  ZoomOut,
  Hand,
  RotateCw,
  Sun,
  Ruler,
  Pencil,
  Type,
  Expand,
  SquareDot,
  Bone,
  FileScan,
  Magnet,
  SquareActivity,
  Contrast,
  Smile,
  type LucideIcon
} from 'lucide-react';

/* Modality tabs under the banner — they filter the studies list. */
const MODALITY_TABS: BannerTab[] = [
  { id: 'all', label: 'All Images', icon: SquareDot },
  { id: 'X-Ray', label: 'X-Ray', icon: Bone },
  { id: 'CT Scan', label: 'CT Scan', icon: FileScan },
  { id: 'MRI', label: 'MRI', icon: Magnet },
  { id: 'Ultrasound', label: 'Ultrasound (USG)', icon: SquareActivity },
  { id: 'Mammography', label: 'Mammography', icon: Contrast },
  { id: 'Others', label: 'Others', icon: Smile }
];

/* Short captions for the "Related Images / Previous Studies" strip. */
const SHORT_TITLES: Record<string, string> = {
  'img-1': 'X-Ray Chest',
  'img-2': 'USG Abdomen',
  'img-3': 'CT Brain',
  'img-4': 'MRI Knee',
  'img-5': 'X-Ray Knee',
  'img-6': 'USG Thyroid'
};

/* Some source images carry a scout/localiser panel — crop to the anatomy (image px). */
const CROPS: Record<string, { W: number; H: number; x: number; y: number; w: number; h: number }> = {
  [IMAGING_IMAGES.chestPA]: { W: 960, H: 1098, x: 30, y: 70, w: 900, h: 1000 },
  [IMAGING_IMAGES.chestPAThumb]: { W: 500, H: 572, x: 16, y: 36, w: 468, h: 520 },
  [IMAGING_IMAGES.ctBrain]: { W: 500, H: 362, x: 2, y: 4, w: 278, h: 354 },
  [IMAGING_IMAGES.ctBrainUpper]: { W: 500, H: 362, x: 2, y: 4, w: 278, h: 354 }
};

/** Radiology image with optional anatomy crop; `cover` fills its box, `contain` letterboxes on black. */
const ScanImage: React.FC<{ src: string; alt: string; fit?: 'cover' | 'contain'; style?: React.CSSProperties }> = ({ src, alt, fit = 'cover', style }) => {
  const clipId = useId();
  const crop = CROPS[src];
  if (crop) {
    return (
      <svg
        role="img"
        aria-label={alt}
        viewBox={`${crop.x} ${crop.y} ${crop.w} ${crop.h}`}
        preserveAspectRatio={fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
        style={{ width: '100%', height: '100%', display: 'block', ...style }}
      >
        <clipPath id={clipId}>
          <rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} />
        </clipPath>
        <image href={src} width={crop.W} height={crop.H} clipPath={`url(#${clipId})`} />
      </svg>
    );
  }
  return <img src={src} alt={alt} draggable={false} style={{ width: '100%', height: '100%', objectFit: fit, display: 'block', ...style }} />;
};

const VIEWER_BG = '#060b16';
const PANEL_BG = '#0f1828';

const modalityMatches = (study: ImagingStudy, modality: string) => modality === 'all' || study.modality === modality;

export const ImagingScreen: React.FC = () => {
  const { showToast, activePatient } = useApp();
  const [selectedStudyId, setSelectedStudyId] = useState('img-1');
  const [activeModality, setActiveModality] = useState('all');
  const [dateFilter, setDateFilter] = useState('All Dates');
  const [search, setSearch] = useState('');
  const [activeSliceIndex, setActiveSliceIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(52);
  const [brightness, setBrightness] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<string>('pointer');
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const filteredStudies = mockImagingStudies.filter(study => {
    if (!modalityMatches(study, activeModality)) return false;
    if (dateFilter !== 'All Dates' && !study.date.endsWith(dateFilter)) return false;
    const q = search.trim().toLowerCase();
    return !q || study.title.toLowerCase().includes(q) || study.bodyPart.toLowerCase().includes(q);
  });

  const currentStudy = filteredStudies.find(s => s.id === selectedStudyId) || filteredStudies[0] || mockImagingStudies[0];
  const slices = currentStudy.slices.length ? currentStudy.slices : [currentStudy.thumbnailUrl];
  const sliceIndex = Math.min(activeSliceIndex, slices.length - 1);

  const resetView = () => {
    setActiveSliceIndex(0);
    setZoomLevel(52);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const selectStudy = (id: string) => {
    setSelectedStudyId(id);
    resetView();
  };

  const selectModality = (id: string) => {
    setActiveModality(id);
    const first = mockImagingStudies.find(s => modalityMatches(s, id));
    if (first && !modalityMatches(currentStudy, id)) selectStudy(first.id);
    if (!first) showToast(`No ${MODALITY_TABS.find(t => t.id === id)?.label ?? id} studies on record`, 'info');
  };

  const handleZoom = (delta: number) => setZoomLevel(prev => Math.max(20, Math.min(200, prev + delta)));

  const handleAdjustBrightness = () => {
    const next = brightness === 100 ? 130 : brightness === 130 ? 70 : 100;
    setBrightness(next);
    showToast(`Window level adjusted to ${next}%`);
  };

  const tools: { id: string; icon: LucideIcon; title: string; onClick: () => void }[] = [
    { id: 'pointer', icon: MousePointer2, title: 'Select / Pointer', onClick: () => setActiveTool('pointer') },
    { id: 'zoom-in', icon: ZoomIn, title: 'Zoom In', onClick: () => handleZoom(10) },
    { id: 'zoom-out', icon: ZoomOut, title: 'Zoom Out', onClick: () => handleZoom(-10) },
    { id: 'pan', icon: Hand, title: 'Pan (drag image)', onClick: () => setActiveTool(t => (t === 'pan' ? 'pointer' : 'pan')) },
    { id: 'rotate', icon: RotateCw, title: 'Rotate 90°', onClick: () => { setRotation(r => (r + 90) % 360); showToast('Rotated image 90°'); } },
    { id: 'window', icon: Sun, title: 'Windowing / Brightness', onClick: handleAdjustBrightness },
    { id: 'measure', icon: Ruler, title: 'Measure', onClick: () => { setActiveTool('measure'); showToast('Distance calibration tool ready'); } },
    { id: 'annotate', icon: Pencil, title: 'Annotate', onClick: () => { setActiveTool('annotate'); showToast('Annotation pencil active'); } },
    { id: 'text', icon: Type, title: 'Text', onClick: () => { setActiveTool('text'); showToast('Text label tool active'); } },
    { id: 'fullscreen', icon: Expand, title: 'Reset / Fullscreen', onClick: () => { resetView(); showToast('Fullscreen DICOM mode'); } }
  ];

  const onViewerMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'pan') return;
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    setDragging(true);
  };
  const onViewerMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const [nextDate, ...nextTime] = (activePatient?.nextAppointment ?? '26 Sep 2026 10:30 AM').split(/\s(?=\d{1,2}:\d{2})/);
  const report = currentStudy.radiologistReport;
  const [reportedDate, ...reportedTime] = report.reportedOn.split(/\s(?=\d{1,2}:\d{2})/);

  const metaParts = [currentStudy.date, currentStudy.time, currentStudy.modality, currentStudy.bodyPart, currentStudy.radiologist];

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="Imaging (RIS)"
        subtitle="View, analyse and manage radiology images and reports"
        actions={
          <>
            <button className="btn-outline-blue" onClick={() => showToast('Radiology request form opened')}>
              <CalendarPlus size={17} />
              <span>Request Imaging</span>
            </button>
            <button className="btn-primary" onClick={() => showToast('DICOM file uploader active')}>
              <Plus size={18} />
              <span>Upload Image</span>
            </button>
          </>
        }
      />

      <PatientBanner
        metrics={[
          { label: 'Last Imaging', value: mockImagingStudies[0].date },
          { label: 'Next Appointment', value: nextDate, sub: nextTime.join(' ') || undefined },
          { label: 'Department', value: 'Radiology' }
        ]}
        tabs={MODALITY_TABS}
        activeTab={activeModality.toLowerCase()}
        onTabChange={selectModality}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '352px minmax(0, 1fr) 312px',
          gridTemplateRows: 'auto auto',
          gap: 8
        }}
      >
        {/* Left: studies list */}
        <div className="medios-card" style={{ gridRow: '1 / span 2', padding: '10px 10px 10px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h4 style={{ fontSize: 14.5, fontWeight: 700 }}>Imaging Studies</h4>
            <button className="btn-primary" style={{ height: 33, fontSize: 'var(--fs-sm)', padding: '0 14px' }} onClick={() => showToast('New imaging order created')}>
              <Plus size={16} />
              <span>New Request</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <div style={{ position: 'relative' }}>
              <select
                className="form-select"
                style={{ height: 30, fontSize: 'var(--fs-sm)', appearance: 'none', paddingRight: 28 }}
                value={activeModality}
                onChange={e => selectModality(e.target.value)}
              >
                <option value="all">All Modality</option>
                {MODALITY_TABS.slice(1).map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: 8, pointerEvents: 'none' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <select
                className="form-select"
                style={{ height: 30, fontSize: 'var(--fs-sm)', appearance: 'none', paddingRight: 28 }}
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              >
                <option>All Dates</option>
                <option>2026</option>
                <option>2025</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: 8, pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ position: 'relative', marginTop: 10 }}>
            <Search size={14} color="var(--text-secondary)" style={{ position: 'absolute', left: 11, top: 9 }} />
            <input
              type="text"
              className="input-field"
              style={{ height: 32, paddingLeft: 32, fontSize: 'var(--fs-xs)' }}
              placeholder="Search by study name or body part..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10, flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {filteredStudies.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
                No studies match these filters
              </div>
            ) : (
              filteredStudies.map(study => {
                const isSelected = currentStudy.id === study.id;
                return (
                  <div
                    key={study.id}
                    onClick={() => selectStudy(study.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      height: 86,
                      flexShrink: 0,
                      padding: '0 10px 0 6px',
                      cursor: 'pointer',
                      borderRadius: isSelected ? 6 : 0,
                      background: isSelected ? '#e6effd' : 'transparent',
                      boxShadow: isSelected ? 'inset 2px 0 0 var(--blue-primary)' : 'none',
                      borderBottom: isSelected ? '1px solid transparent' : '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ width: 68, height: 68, borderRadius: 6, overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                      <ScanImage src={study.thumbnailUrl} alt={study.title} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, lineHeight: 1.45 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{study.title}</div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 3, display: 'flex', gap: 10 }}>
                        <span>{study.date}</span>
                        <span>{study.time}</span>
                      </div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 3 }}>{study.modality}</div>
                    </div>
                    <span className="status-pill completed" style={{ alignSelf: 'center', marginTop: 24 }}>{study.status}</span>
                  </div>
                );
              })
            )}
          </div>

          <button
            className="btn-outline-blue"
            style={{ width: '100%', height: 32, marginTop: 6, fontSize: 'var(--fs-sm)', background: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
            onClick={() => showToast('All studies for this patient are loaded', 'info')}
          >
            Load More Studies
          </button>
        </div>

        {/* Center: DICOM viewer */}
        <div className="medios-card" style={{ padding: '10px 8px 8px', display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
          {filteredStudies.length === 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 5,
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255, 255, 255, 0.94)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                textAlign: 'center'
              }}
            >
              <ScanSearch size={34} color="var(--text-muted)" />
              <div style={{ fontSize: 'var(--fs-h4)', fontWeight: 600 }}>No studies to display</div>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>No imaging studies match the selected modality or filters.</div>
              <button
                className="btn-outline-blue btn-sm"
                onClick={() => {
                  setActiveModality('all');
                  setDateFilter('All Dates');
                  setSearch('');
                }}
              >
                Show all studies
              </button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, padding: '0 4px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontSize: 15.5, fontWeight: 700 }}>{currentStudy.title}</h3>
                <span className="status-pill completed" style={{ height: 20 }}>{currentStudy.status}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 5, fontSize: 'var(--fs-2xs)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {metaParts.map((part, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ width: 1, height: 10, background: 'var(--border-strong)', margin: '0 7px' }} />}
                    <span>{part}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button className="btn-outline-blue btn-sm" style={{ fontSize: 'var(--fs-2xs)', fontWeight: 400, gap: 5, padding: '0 9px' }} onClick={() => showToast('Side-by-side temporal comparison mode enabled')}>
                <ScanSearch size={13} />
                <span>Compare</span>
              </button>
              <button className="btn-outline-blue btn-sm" style={{ fontSize: 'var(--fs-2xs)', fontWeight: 400, gap: 5, padding: '0 9px' }} onClick={() => showToast('Radiology report downloaded')}>
                <FileText size={13} />
                <span>Report</span>
              </button>
              <button className="btn-outline-blue btn-sm" style={{ fontSize: 'var(--fs-2xs)', fontWeight: 400, padding: '0 10px' }} onClick={() => showToast('AI Radiology deep scan complete (92% confidence)')}>
                AI Analysis
              </button>
              <button className="icon-btn" style={{ width: 28, height: 28 }} aria-label="More options" onClick={() => showToast('Share, export DICOM or print film', 'info')}>
                <EllipsisVertical size={14} />
              </button>
            </div>
          </div>

          {/* Viewer: toolbar | image | slice strip */}
          <div style={{ display: 'flex', gap: 4, marginTop: 12, height: 478, background: VIEWER_BG, borderRadius: 8, overflow: 'hidden', padding: 4 }}>
            <div
              style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 6, background: '#000', cursor: activeTool === 'pan' ? 'grab' : 'default' }}
              onMouseDown={onViewerMouseDown}
              onMouseMove={onViewerMouseMove}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel / 52}) rotate(${rotation}deg)`,
                  filter: `brightness(${brightness}%)`,
                  transition: dragging ? 'none' : 'transform 0.15s ease'
                }}
              >
                <ScanImage src={slices[sliceIndex]} alt={`${currentStudy.title} image ${sliceIndex + 1}`} fit="contain" />
              </div>

              {/* Vertical tool ribbon */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  width: 34,
                  padding: '6px 0',
                  borderRadius: 6,
                  background: 'rgba(15, 24, 40, 0.92)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  zIndex: 2
                }}
              >
                {tools.map(tool => {
                  const Icon = tool.icon;
                  const active = activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      title={tool.title}
                      aria-label={tool.title}
                      onClick={tool.onClick}
                      style={{
                        width: 28,
                        height: 31,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: active ? '#8fb6ff' : '#e6ebf5',
                        background: active ? 'rgba(80, 130, 255, 0.18)' : 'transparent'
                      }}
                    >
                      <Icon size={17} strokeWidth={1.8} />
                    </button>
                  );
                })}
              </div>

              <span style={{ position: 'absolute', top: 34, left: 76, color: '#ffffff', fontSize: 15, fontWeight: 500, zIndex: 2 }}>R</span>

              <div
                style={{
                  position: 'absolute',
                  left: 2,
                  bottom: 2,
                  display: 'flex',
                  gap: 18,
                  padding: '7px 14px',
                  borderRadius: 6,
                  background: 'rgba(15, 24, 40, 0.92)',
                  color: '#e6ebf5',
                  fontSize: 'var(--fs-sm)',
                  zIndex: 2
                }}
              >
                <span>Zoom: {zoomLevel}%</span>
                <span>W: {Math.round(4096 * (brightness / 100))}</span>
                <span>L: {Math.round(2048 * (brightness / 100))}</span>
              </div>
              <span style={{ position: 'absolute', right: 8, bottom: 6, padding: '3px 8px', borderRadius: 4, background: 'rgba(15, 24, 40, 0.85)', color: '#e6ebf5', fontSize: 'var(--fs-sm)', zIndex: 2 }}>
                {sliceIndex + 1} / {slices.length}
              </span>
            </div>

            {/* Slice strip */}
            <div style={{ width: 122, display: 'flex', flexDirection: 'column', gap: 6, padding: 4, borderRadius: 6, background: PANEL_BG }}>
              {slices.slice(0, 3).map((src, idx) => {
                const active = sliceIndex === idx;
                return (
                  <button
                    key={src}
                    onClick={() => setActiveSliceIndex(idx)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 4, borderRadius: 6, background: active ? 'transparent' : 'rgba(255,255,255,0.03)' }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: 104,
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: '#000',
                        boxShadow: active ? '0 0 0 2px #ffffff, 0 0 0 4px var(--blue-primary)' : 'none'
                      }}
                    >
                      <ScanImage src={src} alt={`Image ${idx + 1}`} />
                    </div>
                    <span style={{ color: '#e6ebf5', fontSize: 'var(--fs-xs)' }}>Image {idx + 1}</span>
                  </button>
                );
              })}
              <div
                style={{
                  marginTop: 'auto',
                  height: 38,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#e6ebf5',
                  fontSize: 'var(--fs-sm)'
                }}
              >
                {sliceIndex + 1} / {slices.length}
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI analysis + radiologist report */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div className="ai-assistant-card" style={{ padding: '12px 10px 10px', gap: 10 }}>
            <div className="ai-header-bar" style={{ justifyContent: 'flex-start' }}>
              <div className="ai-title-row" style={{ fontSize: 13.5, gap: 8, whiteSpace: 'nowrap' }}>
                <AiSparkle size={18} />
                <span>AI Imaging Analysis (GPT-6 Astro)</span>
              </div>
              <span className="status-pill purple" style={{ height: 18, padding: '0 6px', fontSize: 9.5, fontWeight: 600, marginLeft: 'auto' }}>BETA</span>
            </div>

            <div>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--purple-dark)', marginBottom: 4 }}>Findings</div>
              <ul style={{ paddingLeft: 26, display: 'flex', flexDirection: 'column', gap: 2, fontSize: 'var(--fs-sm)' }}>
                {currentStudy.findings.map(f => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'var(--green-light)', border: '1px solid var(--green-border)', borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--green-dark)', fontWeight: 600, fontSize: 'var(--fs-xs)' }}>
                <BadgeCheck size={15} fill="var(--green-emerald)" color="#ffffff" strokeWidth={2.2} />
                <span>Impression (AI)</span>
              </div>
              <p style={{ fontSize: 'var(--fs-xs)', marginTop: 5 }}>{currentStudy.impression}</p>
            </div>

            <div>
              <div style={{ fontSize: 'var(--fs-xs)' }}>Confidence Score</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 7 }}>
                <div style={{ flex: 1, height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${currentStudy.confidenceScore}%`, height: '100%', background: 'var(--green-emerald)', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{currentStudy.confidenceScore}%</span>
              </div>
            </div>

            <button className="btn-outline-blue" style={{ width: '100%', height: 34, fontSize: 'var(--fs-sm)' }} onClick={() => showToast('Detailed structured AI imaging report generated')}>
              <ScanEye size={15} />
              <span>Generate Detailed Report</span>
            </button>
          </div>

          <div className="medios-card" style={{ padding: '12px 10px 8px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>Radiologist Report</span>
              <button className="text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 'var(--fs-xs)', fontWeight: 400 }} onClick={() => showToast(`Opening full report — ${currentStudy.title}`, 'info')}>
                <SquarePen size={13} />
                View Full Report
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 'var(--fs-2xs)' }}>
              <tbody>
                {[
                  { label: 'Findings', value: report.findings },
                  { label: 'Impression', value: report.impression },
                  { label: 'Reported By', value: report.reportedBy },
                  { label: 'Reported On', value: <span style={{ display: 'inline-flex', gap: 10 }}><span>{reportedDate}</span><span>{reportedTime.join(' ')}</span></span> },
                  { label: 'Status', value: <span className="status-pill completed" style={{ height: 19, fontSize: 'var(--fs-2xs)' }}>{report.status}</span> }
                ].map((row, i, arr) => (
                  <tr key={row.label} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td style={{ width: 78, padding: '5px 0 5px 8px', verticalAlign: 'top', color: 'var(--text-secondary)' }}>{row.label}</td>
                    <td style={{ padding: '5px 0', lineHeight: 1.5 }}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom strip: related images + compare */}
        <div className="medios-card" style={{ gridColumn: '2 / span 2', padding: '10px 12px 10px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>Related Images / Previous Studies</span>
          <div style={{ display: 'flex', gap: 14, marginTop: 8, alignItems: 'stretch' }}>
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', minWidth: 0 }}>
              {mockImagingStudies.map(s => {
                const active = currentStudy.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (!modalityMatches(s, activeModality)) setActiveModality('all');
                      selectStudy(s.id);
                    }}
                    style={{
                      width: 96,
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      borderRadius: 6,
                      border: `1px solid ${active ? 'var(--blue-border)' : 'var(--border-subtle)'}`,
                      background: active ? 'var(--blue-light)' : 'var(--bg-subtle)',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ width: '100%', height: 68, background: '#000' }}>
                      <ScanImage src={s.thumbnailUrl} alt={s.title} />
                    </div>
                    <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, marginTop: 5, whiteSpace: 'nowrap' }}>{SHORT_TITLES[s.id] ?? s.title}</span>
                    <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-secondary)', marginBottom: 5 }}>{s.date}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => showToast('Side-by-side temporal comparison mode enabled')}
              style={{
                marginLeft: 'auto',
                flex: '0 0 236px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '0 18px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: '#ffffff',
                textAlign: 'left'
              }}
            >
              <span style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Copy size={28} color="var(--blue-primary)" strokeWidth={1.8} />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>Compare Studies</span>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>View and compare temporal changes</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
