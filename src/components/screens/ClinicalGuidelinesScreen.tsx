import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { ScreenHeader } from '../common/ScreenHeader';
import { AiSparkle } from '../common/icons';
import {
  mockGuidelinesSpecialties,
  mockGuidelines,
  mockGuidelineRelatedQuestions,
  specialtyVisuals,
  type GuidelineEntry
} from '../../mock/guidelinesData';
import {
  Search,
  Send,
  Bookmark,
  CircleCheck,
  ChevronDown,
  ChevronRight,
  ChevronsRight,
  TriangleAlert,
  Info,
  X,
  MessageSquareText,
  BadgePlus,
  ShieldPlus,
  HeartPulse,
  Hospital,
  Star,
  Calendar,
  RefreshCw,
  Sparkle,
  ClipboardCheck,
  Map as MapIcon,
  Landmark,
  LayoutList,
  Columns2,
  GitCompareArrows,
  EllipsisVertical,
  FileText,
  ClipboardPlus,
  Pill,
  OctagonX,
  FileCheck2,
  type LucideIcon
} from 'lucide-react';

const CATEGORY_TABS: { id: string; label: string; icon?: LucideIcon }[] = [
  { id: 'all', label: 'All Guidelines (1,245)' },
  { id: 'favorites', label: 'Favorites (24)', icon: Star },
  { id: 'recent', label: 'Recently Used (18)', icon: Sparkle },
  { id: 'hospital', label: 'Hospital Protocols (120)', icon: ClipboardCheck },
  { id: 'national', label: 'National Guidelines (650)', icon: MapIcon },
  { id: 'international', label: 'International Guidelines (475)', icon: Landmark }
];

const DETAIL_TABS = ['Overview', 'Recommendations', 'Assessment', 'Treatment', 'Monitoring', 'Follow-up', 'Contraindications', 'Evidence & References'];
const AI_TABS = ['Ask Question', 'Compare', 'Key Points', 'Related'];

const CONDITIONS: Record<string, string[]> = {
  'All Conditions': [],
  Hypertension: ['hypertension'],
  Diabetes: ['diabetes', 'glycemic'],
  Sepsis: ['sepsis'],
  'Coronary Syndrome': ['coronary', 'stemi'],
  Infections: ['antimicrobial', 'antibiotic']
};
const DEPARTMENTS: Record<string, string[]> = {
  'All Departments': [],
  'General Medicine': ['Internal Medicine', 'Endocrinology'],
  Cardiology: ['Cardiology'],
  Emergency: ['Emergency Medicine'],
  'Infection Control': ['Infectious Diseases']
};
const EVIDENCE: Record<string, string | null> = { 'All Levels': null, 'High (A)': 'High (A)', 'Moderate (B)': 'Moderate (B)', 'Low (C)': 'Low (C)' };
const LAST_UPDATED: Record<string, number | null> = { 'Any Time': null, 'Since 2024': 2024, 'Since 2023': 2023, 'Since 2021': 2021 };
const SORTS = ['Most Relevant', 'Recently Updated', 'Title (A–Z)'];

const DEFAULT_FILTERS = {
  specialty: 'All Specialties',
  condition: 'All Conditions',
  department: 'All Departments',
  evidence: 'All Levels',
  source: 'All Sources',
  updated: 'Any Time'
};

const yearOf = (date: string) => Number(date.slice(-4));
const recommendationLabel = (g: GuidelineEntry) =>
  g.recommendationStrength === 'Strong' ? 'Strong Recommendation' : g.recommendationStrength;

/** Labelled dropdown box (icon + small label + value) with a native select overlay. */
const FilterBox: React.FC<{
  icon: LucideIcon;
  label: string;
  value: string;
  options: string[];
  grow: number;
  onChange: (value: string) => void;
}> = ({ icon: Icon, label, value, options, grow, onChange }) => (
  <label
    style={{
      position: 'relative',
      flex: `${grow} 1 0`,
      minWidth: 0,
      height: 43,
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      padding: '0 10px 0 12px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer'
    }}
  >
    <Icon size={17} strokeWidth={1.9} color="var(--text-primary)" style={{ flexShrink: 0 }} />
    <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
    </span>
    <ChevronDown size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </label>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{title}</div>
    {children}
  </div>
);

const Chip: React.FC<{ tone: string; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`status-pill ${tone}`} style={{ height: 18, padding: '0 6px', fontSize: 9.5 }}>{children}</span>
);

export const ClinicalGuidelinesScreen: React.FC = () => {
  const { showToast } = useApp();
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [selectedGuidelineId, setSelectedGuidelineId] = useState('g-1');
  const [showDetail, setShowDetail] = useState(true);
  const [categoryTab, setCategoryTab] = useState('all');
  const [activeGuidelineTab, setActiveGuidelineTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState(SORTS[0]);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [aiQuestion, setAiQuestion] = useState('What is the first line treatment for hypertension in adults?');
  const [aiTab, setAiTab] = useState('Ask Question');

  const sourceOptions = useMemo(() => ['All Sources', ...Array.from(new Set(mockGuidelines.map(g => g.source)))], []);

  const setFilter = (key: keyof typeof DEFAULT_FILTERS, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'specialty') setSelectedSpecialty(value);
  };

  const selectSpecialty = (name: string) => {
    setSelectedSpecialty(name);
    setFilters(prev => ({ ...prev, specialty: mockGuidelinesSpecialties.some(s => s.name === name) ? name : prev.specialty }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSelectedSpecialty('All Specialties');
    setSearchQuery('');
    setCategoryTab('all');
    showToast('Filters reset', 'info');
  };

  const toggleFavorite = (g: GuidelineEntry) => {
    const wasFavorite = favorites.has(g.id);
    setFavorites(prev => {
      const next = new Set(prev);
      if (wasFavorite) next.delete(g.id);
      else next.add(g.id);
      return next;
    });
    if (wasFavorite) showToast(`Removed "${g.title}" from favorites`, 'info');
    else showToast(`Added "${g.title}" to favorites`);
  };

  const openGuideline = (g: GuidelineEntry) => {
    setSelectedGuidelineId(g.id);
    setShowDetail(true);
    setActiveGuidelineTab('Overview');
  };

  const filteredGuidelines = mockGuidelines.filter(g => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = g.title.toLowerCase().includes(q) ||
      g.specialty.toLowerCase().includes(q) ||
      g.source.toLowerCase().includes(q);
    const matchesSpecialty = selectedSpecialty === 'All Specialties' || g.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
    if (!matchesSearch || !matchesSpecialty) return false;

    const text = `${g.title} ${g.summary}`.toLowerCase();
    const conditionWords = CONDITIONS[filters.condition] ?? [];
    if (conditionWords.length && !conditionWords.some(w => text.includes(w))) return false;
    const departmentSpecialties = DEPARTMENTS[filters.department] ?? [];
    if (departmentSpecialties.length && !departmentSpecialties.includes(g.specialty)) return false;
    const evidence = EVIDENCE[filters.evidence];
    if (evidence && g.evidenceLevel !== evidence) return false;
    if (filters.source !== 'All Sources' && g.source !== filters.source) return false;
    const sinceYear = LAST_UPDATED[filters.updated];
    if (sinceYear && yearOf(g.updatedDate) < sinceYear) return false;

    if (categoryTab === 'favorites') return favorites.has(g.id);
    if (categoryTab === 'hospital') return g.source.toLowerCase().includes('hospital') || !!g.isOfficial;
    if (categoryTab === 'national') return g.source.toLowerCase().includes('acc') || g.source.toLowerCase().includes('ada') || g.source.toLowerCase().includes('national');
    if (categoryTab === 'international') return g.source.toLowerCase().includes('esc') || g.source.toLowerCase().includes('who') || g.source.toLowerCase().includes('sepsis');
    return true;
  });

  const sortedGuidelines = [...filteredGuidelines].sort((a, b) => {
    if (sortBy === 'Recently Updated') return Date.parse(b.updatedDate) - Date.parse(a.updatedDate);
    if (sortBy === 'Title (A–Z)') return a.title.localeCompare(b.title);
    return 0;
  });

  const selectedGuideline = mockGuidelines.find(g => g.id === selectedGuidelineId) || mockGuidelines[0];
  const answerGuideline = mockGuidelines.find(g => g.aiQnA) || mockGuidelines[0];
  const answerLines = (answerGuideline.aiQnA?.answer ?? '').split('\n');
  const answerIntro = answerLines[0];
  const answerBullets = answerLines.slice(1).map(l => l.replace(/^•\s*/, ''));

  const visibleSpecialties = mockGuidelinesSpecialties.filter(s => s.name.toLowerCase().includes(specialtySearch.toLowerCase()));

  const renderChips = (g: GuidelineEntry) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 4 }}>
      <Chip tone={g.specialtyTone}>{g.specialty}</Chip>
      <Chip tone={g.sourceTone}>{g.source}</Chip>
      <Chip tone={g.evidenceLevel === 'High (A)' ? 'green' : 'gray'}>Evidence: {g.evidenceLevel}</Chip>
      <Chip tone="orange">{recommendationLabel(g)}</Chip>
    </div>
  );

  const bookmarkButton = (g: GuidelineEntry, size = 17) => (
    <button
      aria-label={favorites.has(g.id) ? 'Remove from favorites' : 'Add to favorites'}
      onClick={(e) => { e.stopPropagation(); toggleFavorite(g); }}
      style={{ display: 'flex', color: 'var(--blue-text)', padding: 2 }}
    >
      <Bookmark size={size} strokeWidth={2} fill={favorites.has(g.id) ? 'currentColor' : 'none'} />
    </button>
  );

  const openButton = (g: GuidelineEntry) => (
    <button
      className="btn-primary"
      style={{ height: 30, width: 55, padding: 0, fontSize: 11.5 }}
      onClick={(e) => { e.stopPropagation(); openGuideline(g); showToast(`Opened ${g.title}`); }}
    >
      Open
    </button>
  );

  return (
    <div className="page-scroll-body" style={{ gap: 6 }}>
      <ScreenHeader
        title="Clinical Guidelines"
        subtitle="Evidence-based guidance and clinical decision support"
        actions={
          <>
            <button className="btn-secondary" style={{ height: 30, padding: '0 14px', fontSize: 11, gap: 10 }} onClick={() => showToast('Guidelines feedback modal opened')}>
              <MessageSquareText size={15} color="var(--blue-text)" />
              <span>Feedback</span>
            </button>
            <button className="btn-secondary" style={{ height: 30, padding: '0 14px', fontSize: 11, gap: 10 }} onClick={() => showToast('3 guideline updates available for review')}>
              <CircleCheck size={14} color="#ffffff" fill="var(--green-emerald)" strokeWidth={2.4} />
              <span>Guideline Updates</span>
            </button>
            <button className="btn-primary" style={{ height: 30, padding: '0 22px', fontSize: 11, gap: 10 }} onClick={() => showToast('New guideline proposal drafted')}>
              <BadgePlus size={15} />
              <span>Request New Guideline</span>
            </button>
          </>
        }
      />

      {/* Search + labelled filters */}
      <div className="medios-card" style={{ padding: '8px 8px 7px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 9 }}>
          <div style={{ position: 'relative', flex: '0 1 684px', minWidth: 0 }}>
            <Search size={17} className="search-icon-left" />
            <input
              type="text"
              className="global-search-input"
              style={{ height: 36, fontSize: 13, paddingRight: 14 }}
              placeholder="Search clinical guidelines (e.g., hypertension, diabetes, sepsis...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && showToast(`${filteredGuidelines.length} guidelines found`)}
            />
          </div>
          <button className="btn-primary" style={{ height: 36, width: 123 }} onClick={() => showToast(`${filteredGuidelines.length} guidelines found`)}>
            <Search size={16} />
            <span>Search</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <FilterBox icon={ShieldPlus} label="Specialty" value={filters.specialty} grow={167} options={mockGuidelinesSpecialties.map(s => s.name)} onChange={(v) => setFilter('specialty', v)} />
          <FilterBox icon={HeartPulse} label="Condition" value={filters.condition} grow={167} options={Object.keys(CONDITIONS)} onChange={(v) => setFilter('condition', v)} />
          <FilterBox icon={Hospital} label="Department" value={filters.department} grow={171} options={Object.keys(DEPARTMENTS)} onChange={(v) => setFilter('department', v)} />
          <FilterBox icon={Star} label="Evidence Level" value={filters.evidence} grow={184} options={Object.keys(EVIDENCE)} onChange={(v) => setFilter('evidence', v)} />
          <FilterBox icon={MessageSquareText} label="Source" value={filters.source} grow={185} options={sourceOptions} onChange={(v) => setFilter('source', v)} />
          <FilterBox icon={Calendar} label="Last Updated" value={filters.updated} grow={188} options={Object.keys(LAST_UPDATED)} onChange={(v) => setFilter('updated', v)} />
          <button className="btn-outline-blue" style={{ flex: '143 1 0', minWidth: 0, height: 39, marginTop: 2, fontSize: 12.5, borderColor: 'var(--border-color)' }} onClick={resetFilters}>
            <RefreshCw size={14} strokeWidth={2.4} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Source tabs */}
      <div className="page-tabs" style={{ gap: 11 }}>
        {CATEGORY_TABS.map(tab => {
          const isActive = categoryTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`page-tab-btn${isActive ? ' active' : ''}`}
              style={{ height: 30, padding: '0 12px', fontSize: 12, gap: 7, fontWeight: isActive ? 600 : 400 }}
              onClick={() => setCategoryTab(tab.id)}
            >
              {tab.icon && <tab.icon size={14} strokeWidth={1.9} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3 columns: Specialties | Guidelines + detail | AI assistant */}
      <div style={{ display: 'grid', gridTemplateColumns: '246px minmax(0, 1fr) 362px', gap: 11, alignItems: 'stretch' }}>
        {/* Specialties */}
        <div className="medios-card" style={{ padding: '12px 8px 8px 8px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, padding: '0 4px' }}>Specialties</h3>
          <div style={{ position: 'relative', margin: '9px 3px 8px' }}>
            <Search size={14} className="search-icon-left" style={{ left: 11 }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search specialties..."
              value={specialtySearch}
              onChange={(e) => setSpecialtySearch(e.target.value)}
              style={{ height: 28, fontSize: 11, paddingLeft: 34 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {visibleSpecialties.map(spec => {
              const isSelected = selectedSpecialty === spec.name;
              const visual = specialtyVisuals[spec.name];
              const Icon = visual?.icon ?? FileText;
              return (
                <button
                  key={spec.name}
                  onClick={() => selectSpecialty(spec.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    height: 28,
                    padding: '0 8px 0 12px',
                    borderRadius: isSelected ? 'var(--radius-sm)' : 0,
                    background: isSelected ? 'var(--blue-light)' : 'transparent',
                    boxShadow: isSelected ? 'inset 2px 0 0 #7fa2e8' : 'none',
                    borderBottom: isSelected ? 'none' : '1px solid var(--border-subtle)',
                    fontSize: 11.5,
                    fontWeight: isSelected ? 500 : 400,
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    flexShrink: 0
                  }}
                >
                  <Icon size={16} color={visual?.color} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spec.name}</span>
                  <span style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isSelected ? 600 : 400 }}>
                    {spec.count.toLocaleString('en-US')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
          {/* Guidelines list */}
          <div className="medios-card" style={{ padding: '9px 7px 6px 7px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 3px 0 4px', marginBottom: 7 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>Guidelines (1,245)</h3>
              <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>Sort by:</span>
              <label style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 20, height: 28, padding: '0 10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 500, cursor: 'pointer', marginRight: 10 }}>
                <span style={{ minWidth: 74 }}>{sortBy}</span>
                <ChevronDown size={14} />
                <select aria-label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}>
                  {SORTS.map(o => <option key={o}>{o}</option>)}
                </select>
              </label>
              <button
                className={viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}
                style={{ height: 30, width: 64, padding: 0, fontSize: 11, gap: 6, borderColor: viewMode === 'list' ? undefined : 'var(--border-color)' }}
                onClick={() => setViewMode('list')}
              >
                <LayoutList size={14} />
                <span>List</span>
              </button>
              <button
                className={viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}
                style={{ height: 30, width: 66, padding: 0, fontSize: 11, gap: 6, borderColor: viewMode === 'cards' ? undefined : 'var(--border-color)' }}
                onClick={() => setViewMode('cards')}
              >
                <Columns2 size={14} />
                <span>Cards</span>
              </button>
            </div>

            {sortedGuidelines.length === 0 ? (
              <div style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
                {categoryTab === 'favorites' ? 'No favorites yet — bookmark a guideline to add it here.' : 'No guidelines match the current filters.'}
              </div>
            ) : viewMode === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {sortedGuidelines.map((g, i) => {
                  const isSelected = showDetail && selectedGuidelineId === g.id;
                  const nextSelected = showDetail && sortedGuidelines[i + 1]?.id === selectedGuidelineId;
                  return (
                    <div
                      key={g.id}
                      onClick={() => openGuideline(g)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '21px minmax(0, 1fr) 80px auto',
                        columnGap: 12,
                        alignItems: 'start',
                        padding: '5px 9px 5px 11px',
                        border: `1px solid ${isSelected ? 'var(--blue-border)' : 'transparent'}`,
                        borderBottomColor: isSelected ? 'var(--blue-border)' : i === sortedGuidelines.length - 1 || nextSelected ? 'transparent' : 'var(--border-subtle)',
                        borderRadius: isSelected ? 'var(--radius-sm)' : 0,
                        background: isSelected ? 'var(--bg-tab)' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <g.icon size={21} color={g.iconColor} strokeWidth={2} style={{ gridRow: '1 / 3', marginTop: 2 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35 }}>{g.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.summary}</div>
                      </div>
                      <div style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--text-primary)', paddingTop: 1 }}>
                        <div>{g.version}</div>
                        <div style={{ fontSize: 10.5 }}>{g.updatedDate}</div>
                      </div>
                      <div style={{ gridRow: '1 / 3', gridColumn: 4, alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 14 }}>
                        {bookmarkButton(g)}
                        {openButton(g)}
                      </div>
                      <div style={{ gridColumn: '2 / 4' }}>{renderChips(g)}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 3px 4px' }}>
                {sortedGuidelines.map(g => {
                  const isSelected = showDetail && selectedGuidelineId === g.id;
                  return (
                    <div
                      key={g.id}
                      onClick={() => openGuideline(g)}
                      style={{
                        border: `1px solid ${isSelected ? 'var(--blue-border)' : 'var(--border-color)'}`,
                        background: isSelected ? 'var(--bg-tab)' : 'var(--bg-card)',
                        borderRadius: 'var(--radius-md)',
                        padding: '9px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <g.icon size={18} color={g.iconColor} strokeWidth={2} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{g.title}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{g.summary}</div>
                      {renderChips(g)}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                        <span style={{ flex: 1, fontSize: 10.5, color: 'var(--text-secondary)' }}>{g.version} · {g.updatedDate}</span>
                        {bookmarkButton(g, 16)}
                        {openButton(g)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Expanded guideline */}
          {showDetail && selectedGuideline && (
            <div className="medios-card" style={{ padding: '9px 9px 10px 10px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <selectedGuideline.icon size={29} color={selectedGuideline.iconColor} strokeWidth={2.1} style={{ flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 14.6, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{selectedGuideline.title}</h3>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: 1.45, whiteSpace: 'nowrap' }}>{selectedGuideline.sourceFull}</div>
                  {selectedGuideline.isOfficial && (
                    <span className="status-pill green" style={{ height: 17, padding: '0 7px', fontSize: 10, gap: 4, marginTop: 2 }}>
                      <FileCheck2 size={10} strokeWidth={2.4} />
                      Official Guideline
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                  <button className="btn-outline-blue" style={{ height: 24, padding: '0 6px', fontSize: 9.3, borderColor: 'var(--border-color)' }} onClick={() => showToast(`Downloaded official ${selectedGuideline.source} guideline PDF`)}>
                    View PDF
                  </button>
                  <button className="btn-outline-blue" style={{ height: 24, padding: '0 6px', fontSize: 9.3, borderColor: 'var(--border-color)' }} onClick={() => showToast('Protocol linked to patient care plan')}>
                    Add to Care Plan
                  </button>
                  <button className="btn-outline-blue" style={{ height: 24, padding: '0 6px', fontSize: 9.3, gap: 4, borderColor: 'var(--border-color)' }} onClick={() => toggleFavorite(selectedGuideline)}>
                    <Bookmark size={11} strokeWidth={2.2} fill={favorites.has(selectedGuideline.id) ? 'currentColor' : 'none'} />
                    Bookmark
                  </button>
                  <button className="btn-outline-blue" style={{ height: 24, padding: '0 6px', fontSize: 9.3, gap: 4, borderColor: 'var(--border-color)' }} onClick={() => showToast(`Comparing ${selectedGuideline.source} with other guidelines`)}>
                    <GitCompareArrows size={11} strokeWidth={2.2} />
                    Compare
                  </button>
                  <button className="icon-btn" aria-label="Close guideline" style={{ width: 26, height: 24 }} onClick={() => setShowDetail(false)}>
                    <X size={13} strokeWidth={2.4} />
                  </button>
                </div>
              </div>

              {/* Meta line */}
              <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 18, rowGap: 2, fontSize: 10.5, fontWeight: 500, marginTop: 5 }}>
                <span>Version: <b style={{ fontWeight: 500 }}>{selectedGuideline.version.replace(/^v/, '')}</b></span>
                <span>Last Updated: <b style={{ fontWeight: 500 }}>{selectedGuideline.updatedDate}</b></span>
                <span>Evidence Level: <b style={{ fontWeight: 600, color: 'var(--green-dark)' }}>{selectedGuideline.evidenceLevel}</b></span>
                <span>Recommendation: <b style={{ fontWeight: 600, color: 'var(--green-dark)' }}>{selectedGuideline.recommendationStrength}</b></span>
                <span>Source: <b style={{ fontWeight: 700 }}>{selectedGuideline.source}</b></span>
              </div>

              {/* Detail tabs */}
              <div className="page-tabs" style={{ gap: 5, marginTop: 8 }}>
                {DETAIL_TABS.map(t => {
                  const isActive = activeGuidelineTab === t;
                  return (
                    <button
                      key={t}
                      className={`page-tab-btn${isActive ? ' active' : ''}`}
                      style={{ flex: '1 1 auto', justifyContent: 'center', height: 22, padding: '0 5px', fontSize: 9.6, background: isActive ? undefined : 'var(--bg-subtle)' }}
                      onClick={() => setActiveGuidelineTab(t)}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>

              {/* Body: text + applicability */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 248px', gap: 22, marginTop: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Section title="Background">
                    <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{selectedGuideline.background}</p>
                  </Section>
                  <Section title="Key Points">
                    <ul style={{ fontSize: 10.5, color: 'var(--text-primary)', paddingLeft: 20, lineHeight: 1.45 }}>
                      {selectedGuideline.keyPoints?.map((kp, i) => <li key={i}>{kp}</li>)}
                    </ul>
                  </Section>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ background: '#eaf4fb', border: '1px solid #dcebf6', borderRadius: 'var(--radius-sm)', padding: '7px 10px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 600 }}>
                      <Pill size={14} color="var(--green-emerald)" strokeWidth={2.2} />
                      Applicable To
                    </div>
                    <ul style={{ fontSize: 10.2, color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 1.45, marginTop: 1 }}>
                      {(selectedGuideline.applicableTo ?? ['Refer to full guideline text']).map((ap, i) => (
                        <li key={i} style={{ listStyle: 'none', position: 'relative' }}>
                          <span style={{ position: 'absolute', left: -11, top: 6, width: 4, height: 4, borderRadius: '50%', background: 'var(--green-dark)' }} />
                          {ap}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ background: '#fdeef0', border: '1px solid #f9dde1', borderRadius: 'var(--radius-sm)', padding: '7px 10px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 600 }}>
                      <OctagonX size={14} color="var(--red-rose)" strokeWidth={2.2} />
                      Not Applicable To
                    </div>
                    <ul style={{ fontSize: 10.2, color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 1.45, marginTop: 1 }}>
                      {(selectedGuideline.notApplicableTo ?? ['Refer to full guideline text']).map((nap, i) => (
                        <li key={i} style={{ listStyle: 'none', position: 'relative' }}>
                          <span style={{ position: 'absolute', left: -11, top: 6, width: 4, height: 4, borderRadius: '50%', background: 'var(--red-rose)' }} />
                          {nap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Clinical Guidelines Assistant */}
        <div className="ai-assistant-card" style={{ gap: 0, padding: '8px 10px 10px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '0 0 0 4px' }}>
            <AiSparkle size={27} style={{ flexShrink: 0, marginTop: 3 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--fs-h4)', fontWeight: 700, lineHeight: 1.28 }}>
                AI Clinical Guidelines Assistant<br />(GPT-6 Astro)
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.36, marginTop: 3 }}>
                Get answers from approved clinical guidelines only.<br />Evidence-based. Up-to-date. Cited sources included.
              </p>
            </div>
            <button aria-label="Assistant options" style={{ display: 'flex', color: 'var(--blue-text)', padding: 2 }} onClick={() => showToast('Assistant settings', 'info')}>
              <EllipsisVertical size={17} strokeWidth={2.2} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 4, marginTop: 9 }}>
            {AI_TABS.map(tab => (
              <button
                key={tab}
                className={`page-tab-btn${aiTab === tab ? ' active' : ''}`}
                style={{ height: 31, padding: 0, justifyContent: 'center', fontSize: 11 }}
                onClick={() => setAiTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <textarea
              className="input-field"
              rows={2}
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              style={{ flex: 1, height: 41, minHeight: 41, resize: 'none', padding: '3px 10px', fontSize: 12, lineHeight: 1.35 }}
            />
            <button className="btn-primary" aria-label="Ask" style={{ width: 38, height: 41, padding: 0, flexShrink: 0 }} onClick={() => showToast('Guidelines search evaluated')}>
              <Send size={17} />
            </button>
          </div>

          {aiTab === 'Ask Question' && (
            <div style={{ marginTop: 10, background: '#eff9f3', border: '1px solid var(--green-border)', borderRadius: 'var(--radius-md)', padding: '8px 5px 7px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--green-dark)', fontWeight: 600, fontSize: 11.5 }}>
                <CircleCheck size={14} color="#ffffff" fill="var(--green-emerald)" strokeWidth={2.4} />
                <span>Answer (from {answerGuideline.source} Guideline)</span>
              </div>
              <p style={{ fontSize: 12.2, lineHeight: 1.4, marginTop: 5 }}>{answerIntro}</p>
              <ul style={{ fontSize: 12, lineHeight: 1.42, paddingLeft: 26, marginTop: 5 }}>
                {answerBullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9, fontSize: 12, fontWeight: 600, color: 'var(--blue-text)' }}
                onClick={() => showToast('Applies to adults ≥ 18 years with primary hypertension (ESC 2023, Section 4.2)', 'info')}
              >
                Why this applies? <ChevronRight size={14} strokeWidth={2.4} />
              </button>
              <div style={{ display: 'flex', gap: 8, marginTop: 9, background: 'var(--blue-light)', borderRadius: 'var(--radius-sm)', padding: '8px 7px 8px 9px' }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--blue-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <RefreshCw size={9} strokeWidth={3} />
                </span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 11, lineHeight: 1.4 }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>Source</div>
                  <div>ESC 2023 Guidelines for the management of arterial hypertension</div>
                  <div style={{ fontSize: 10.2, color: 'var(--text-secondary)', marginTop: 2 }}>Section 4.2 – Initial pharmacological treatment<br />Page 25–27</div>
                </div>
                <button
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, height: 36, padding: '0 8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--blue-text)', fontSize: 10, lineHeight: 1.2, textAlign: 'center' }}
                  onClick={() => showToast('Downloaded official ESC guideline PDF')}
                >
                  <FileText size={13} />
                  <span>View<br />PDF</span>
                </button>
              </div>
            </div>
          )}

          {aiTab === 'Compare' && (
            <div className="ai-section" style={{ marginTop: 11, fontSize: 11.5, lineHeight: 1.5 }}>
              <div className="ai-section-title">ESC 2023 vs ACC/AHA 2017</div>
              <div>Office BP target: <b>&lt;140/90</b> (ESC) vs <b>&lt;130/80</b> (ACC/AHA)</div>
              <div>Initial therapy: two-drug single-pill combination preferred in ESC 2023.</div>
              <div>Both recommend lifestyle modification for every patient.</div>
            </div>
          )}

          {aiTab === 'Key Points' && (
            <div className="ai-section" style={{ marginTop: 11 }}>
              <div className="ai-section-title">{selectedGuideline.title}</div>
              <ul style={{ fontSize: 11.5, lineHeight: 1.5, paddingLeft: 18 }}>
                {selectedGuideline.keyPoints?.map((kp, i) => <li key={i}>{kp}</li>)}
              </ul>
            </div>
          )}

          {aiTab === 'Related' && (
            <div className="ai-section" style={{ marginTop: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="ai-section-title">Related guidelines</div>
              {mockGuidelines.filter(g => g.id !== selectedGuideline.id).slice(0, 4).map(g => (
                <button key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, textAlign: 'left' }} onClick={() => openGuideline(g)}>
                  <g.icon size={13} color={g.iconColor} />
                  <span style={{ flex: 1 }}>{g.title}</span>
                  <ChevronRight size={13} color="var(--blue-text)" />
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 8, margin: '9px 8px 0 16px' }}>
            <button className="btn-outline-blue" style={{ height: 28, fontSize: 10.5, borderColor: 'var(--border-color)' }} onClick={() => showToast('Protocol appended to treatment plan')}>
              <ClipboardPlus size={13} />
              <span>Add to Care Plan</span>
            </button>
            <button className="btn-outline-blue" style={{ height: 28, fontSize: 10.5, borderColor: 'var(--border-color)' }} onClick={() => showToast('Comparing ESC 2023 vs ACC/AHA 2017')}>
              <RefreshCw size={12} strokeWidth={2.4} />
              <span>Compare Guidelines</span>
            </button>
          </div>

          {/* Related Questions */}
          <div style={{ marginTop: 12, padding: '0 4px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 1 }}>Related Questions</div>
            {mockGuidelineRelatedQuestions.map((question, i) => (
              <button
                key={question}
                onClick={() => { setAiQuestion(question); setAiTab('Ask Question'); showToast(`Asking: ${question}`, 'info'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  width: '100%',
                  height: 19.5,
                  fontSize: 10.5,
                  textAlign: 'left',
                  borderBottom: i === mockGuidelineRelatedQuestions.length - 1 ? 'none' : '1px solid var(--border-subtle)'
                }}
              >
                <ChevronsRight size={11} strokeWidth={2.6} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{question}</span>
                <ChevronRight size={12} color="var(--blue-text)" strokeWidth={2.4} />
              </button>
            ))}
          </div>

          {/* Disclaimer */}
          <div style={{ marginTop: 'auto', paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--orange-light)', border: '1px solid var(--orange-border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px 8px 7px' }}>
              <TriangleAlert size={24} color="#ffffff" fill="#ea7317" strokeWidth={2} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11.7, color: 'var(--orange-dark)', lineHeight: 1.4 }}>
                Clinical decision support — final decision remains with treating clinician.
              </span>
              <button aria-label="About clinical decision support" style={{ display: 'flex', color: 'var(--blue-text)' }} onClick={() => showToast('AI answers are drawn only from approved guidelines; verify before acting.', 'info')}>
                <Info size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
