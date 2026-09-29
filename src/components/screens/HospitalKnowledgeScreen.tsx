import React, { useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { ScreenHeader } from '../common/ScreenHeader';
import { AiSparkle } from '../common/icons';
import {
  mockKnowledgeTopics,
  mockKnowledgeCategories,
  mockFeaturedKnowledge,
  mockRecentArticles,
  mockKnowledgePromptQuestions,
  mockRecentlyViewed
} from '../../mock/knowledgeData';
import { specialtyVisuals } from '../../mock/guidelinesData';
import {
  Search,
  Sparkle,
  Bookmark,
  BookMarked,
  Send,
  ChevronRight,
  LayoutGrid,
  FileText,
  Stethoscope,
  Pill,
  Tablets,
  ShieldPlus,
  Users,
  TriangleAlert,
  Syringe,
  EllipsisVertical,
  FlaskConical,
  Siren,
  ClipboardList,
  type LucideIcon
} from 'lucide-react';

const TOPIC_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  all: { icon: LayoutGrid, color: 'var(--blue-primary)' },
  guidelines: { icon: FileText, color: 'var(--green-emerald)' },
  protocols: { icon: Stethoscope, color: 'var(--green-dark)' },
  drugs: { icon: Pill, color: 'var(--red-rose)' },
  sops: { icon: FileText, color: 'var(--purple-ai)' },
  policies: { icon: ShieldPlus, color: 'var(--green-dark)' },
  education: { icon: Users, color: 'var(--blue-text)' }
};

/** Which Recent Articles type each topic tile narrows the table to. */
const TOPIC_TYPE: Record<string, string> = {
  guidelines: 'Guideline',
  protocols: 'Protocol',
  drugs: 'Reference',
  sops: 'SOP'
};

const FEATURED_ICONS: { icon: LucideIcon; color: string; bg: string }[] = [
  { icon: Stethoscope, color: 'var(--blue-primary)', bg: 'var(--blue-light)' },
  { icon: Tablets, color: '#d9366f', bg: '#fdecf3' },
  { icon: TriangleAlert, color: '#e8710a', bg: '#fef1e4' },
  { icon: Syringe, color: 'var(--purple-ai)', bg: '#eee8fd' }
];

const TYPE_PILL: Record<string, string> = { Guideline: 'blue', Protocol: 'green', Reference: 'purple', SOP: 'orange' };

const RECENT_ICONS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  guideline: { icon: Stethoscope, color: 'var(--blue-primary)', bg: 'var(--blue-light)' },
  lab: { icon: FlaskConical, color: '#b0643a', bg: '#fff1e8' },
  protocol: { icon: Siren, color: '#e8710a', bg: 'var(--orange-light)' },
  alert: { icon: Siren, color: 'var(--red-rose)', bg: 'var(--red-light)' }
};

const QUICK_LINKS: { label: string; icon: LucideIcon; color: string; toast: string }[] = [
  { label: 'Lab Reference Ranges', icon: FlaskConical, color: 'var(--green-emerald)', toast: 'Opened Pathology Reference Ranges' },
  { label: 'Drug Formulary', icon: Pill, color: 'var(--red-rose)', toast: 'Opened Hospital Drug Formulary' },
  { label: 'Emergency Protocols', icon: Siren, color: 'var(--red-rose)', toast: 'Emergency Resuscitation SOPs active' },
  { label: 'Hospital SOPs', icon: ClipboardList, color: 'var(--blue-primary)', toast: 'Hospital standard operating procedures' }
];

export const HospitalKnowledgeScreen: React.FC = () => {
  const { showToast } = useApp();
  const [activeTopic, setActiveTopic] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(() => new Set(['fk-1', 'fk-2', 'fk-4']));
  const [recentlyViewed, setRecentlyViewed] = useState(mockRecentlyViewed);

  const handleAskKnowledge = (qText?: string) => {
    const q = qText || aiQuestion;
    if (!q) return;
    setAiQuestion(q);
    setAiResponse(`GPT-6 Astro Knowledge: Based on St. Mary's Hospital Clinical SOP (Rev 2026.2), the first-line empirical protocol for ${q} involves step-wise evaluation and standardized antimicrobial dosage.`);
  };

  const runSearch = () => {
    setAppliedQuery(searchQuery.trim());
    showToast(`Searching knowledge base for "${searchQuery}"`);
  };

  const toggleBookmark = (id: string, title: string) => {
    const wasSaved = bookmarked.has(id);
    setBookmarked(prev => {
      const next = new Set(prev);
      if (wasSaved) next.delete(id);
      else next.add(id);
      return next;
    });
    if (wasSaved) showToast(`Removed "${title}" from bookmarks`, 'info');
    else showToast(`Bookmarked "${title}"`);
  };

  const q = appliedQuery.toLowerCase();
  const recentArticles = mockRecentArticles.filter(art => {
    const topicType = TOPIC_TYPE[activeTopic];
    if (topicType && art.type !== topicType) return false;
    if (q && !art.title.toLowerCase().includes(q) && !art.category.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="Hospital Knowledge"
        subtitle="Access clinical guidelines, protocols, drug information, SOPs and hospital policies with AI assistance"
      />

      {/* Search + AI / Bookmarks row */}
      <div className="medios-card" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative', flex: '0 1 646px', minWidth: 0 }}>
          <Search size={17} className="search-icon-left" />
          <input
            type="text"
            className="global-search-input"
            style={{ height: 36, fontSize: 12.5, paddingRight: 14 }}
            placeholder="Search guidelines, protocols, drugs, diseases, procedures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          />
        </div>
        <button className="btn-primary" style={{ height: 36, width: 101 }} onClick={runSearch}>
          <Search size={16} />
          <span>Search</span>
        </button>
        <div style={{ flex: 1 }} />
        <button
          className="btn-ai"
          style={{ height: 36, width: 211, background: 'var(--purple-ai)', borderColor: 'var(--purple-ai)' }}
          onClick={() => handleAskKnowledge('Show critical emergency resuscitation algorithms')}
        >
          <Sparkle size={15} />
          <span>Ask AI (GPT-6 Astro)</span>
        </button>
        <div style={{ width: 1, height: 36, background: 'var(--border-subtle)', margin: '0 8px' }} />
        <button
          className="btn-outline-blue"
          style={{ height: 36, width: 126 }}
          onClick={() => showToast(`Bookmarks folder (${bookmarked.size + 11} saved articles)`)}
        >
          <BookMarked size={16} />
          <span>Bookmarks</span>
        </button>
      </div>

      {/* Topic tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr)) minmax(0, 1.42fr)', gap: 16 }}>
        {mockKnowledgeTopics.map(topic => {
          const isSelected = activeTopic === topic.id;
          const { icon: Icon, color } = TOPIC_ICONS[topic.id];
          return (
            <button
              key={topic.id}
              onClick={() => setActiveTopic(topic.id)}
              style={{
                height: 98,
                background: isSelected ? 'var(--blue-light)' : 'var(--bg-card)',
                border: `1px solid ${isSelected ? '#9dbdfb' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 0
              }}
            >
              <Icon size={26} color={color} strokeWidth={2.1} />
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)', marginTop: 9, lineHeight: 1.4 }}>
                {topic.title}
              </span>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {topic.count.toLocaleString('en-US')} articles
              </span>
            </button>
          );
        })}
      </div>

      {/* 3 columns: Categories | Featured + Recent | AI assistant + Quick Links + Recently Viewed */}
      <div style={{ display: 'grid', gridTemplateColumns: '261px minmax(0, 1fr) 346px', gap: 14, alignItems: 'start' }}>
        {/* Categories */}
        <div className="medios-card" style={{ padding: '14px 6px 12px 10px' }}>
          <h3 className="card-title" style={{ padding: '0 0 8px 4px' }}>Categories</h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {mockKnowledgeCategories.map(cat => {
              const isSelected = selectedCategory === cat.name;
              const visual = specialtyVisuals[cat.name];
              const Icon = visual?.icon ?? FileText;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    height: 30,
                    padding: '0 6px 0 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? '#e4ecfb' : 'transparent',
                    boxShadow: isSelected ? 'inset 2px 0 0 #7fa2e8' : 'none',
                    fontSize: 12.5,
                    color: 'var(--text-primary)',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={16} color={cat.color ?? visual?.color} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</span>
                  <span style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isSelected ? 500 : 400 }}>
                    {cat.count.toLocaleString('en-US')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          {/* Featured Knowledge */}
          <div className="medios-card" style={{ padding: '14px 14px 12px' }}>
            <div className="card-header-row" style={{ marginBottom: 10 }}>
              <h3 className="card-title">Featured Knowledge</h3>
              <button className="text-link" style={{ fontSize: 13 }} onClick={() => showToast('Showing all featured knowledge')}>View All</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
              {mockFeaturedKnowledge.map((item, idx) => {
                const { icon: Icon, color, bg } = FEATURED_ICONS[idx % FEATURED_ICONS.length];
                const isSaved = bookmarked.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => showToast(`Opened: ${item.title}`)}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '13px 12px 12px 11px',
                      display: 'flex',
                      gap: 21,
                      cursor: 'pointer',
                      background: 'var(--bg-card)'
                    }}
                  >
                    <div style={{ width: 54, height: 54, borderRadius: 'var(--radius-md)', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={27} strokeWidth={1.9} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <h4 style={{ flex: 1, fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, maxWidth: 160 }}>{item.title}</h4>
                        <button
                          aria-label={isSaved ? 'Remove bookmark' : 'Bookmark'}
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id, item.title); }}
                          style={{ color: isSaved ? 'var(--blue-text)' : '#aab3cf', display: 'flex', padding: 1 }}
                        >
                          <Bookmark size={16} strokeWidth={1.9} />
                        </button>
                      </div>
                      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.42, marginTop: 3, maxWidth: 184 }}>{item.subtitle}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 'auto', paddingTop: 11 }}>
                        <span className={`status-pill ${item.tone}`} style={{ height: 21, padding: '0 9px' }}>{item.tag}</span>
                        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{item.date}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Articles */}
          <div className="medios-card" style={{ padding: '14px 14px 10px' }}>
            <div className="card-header-row" style={{ marginBottom: 8 }}>
              <h3 className="card-title">Recent Articles</h3>
              <button className="text-link" style={{ fontSize: 13 }} onClick={() => showToast('Showing all recent articles')}>View All</button>
            </div>

            <table className="medios-table" style={{ fontSize: 'var(--fs-sm)', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '34%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '20%' }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  {['Title', 'Category', 'Type', 'Last Updated', 'Actions'].map((h, i, arr) => (
                    <th
                      key={h}
                      style={{
                        background: 'var(--bg-subtle)',
                        fontSize: 'var(--fs-sm)',
                        padding: '6px 8px',
                        borderBottom: 'none',
                        borderRadius: i === 0 ? '6px 0 0 6px' : i === arr.length - 1 ? '0 6px 6px 0' : undefined
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentArticles.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '18px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No articles match the current filter
                    </td>
                  </tr>
                ) : recentArticles.map((art, i) => (
                  <tr key={art.id} onClick={() => showToast(`Opened article: ${art.title}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ padding: '4px 8px', height: 40, lineHeight: 1.4, borderBottom: i === recentArticles.length - 1 ? 'none' : undefined }}>{art.title}</td>
                    <td style={{ padding: '4px 8px', color: 'var(--text-secondary)', borderBottom: i === recentArticles.length - 1 ? 'none' : undefined }}>{art.category}</td>
                    <td style={{ padding: '4px 8px', borderBottom: i === recentArticles.length - 1 ? 'none' : undefined }}>
                      <span className={`status-pill ${TYPE_PILL[art.type]}`} style={{ height: 21 }}>{art.type}</span>
                    </td>
                    <td style={{ padding: '4px 8px', borderBottom: i === recentArticles.length - 1 ? 'none' : undefined }}>{art.lastUpdated}</td>
                    <td style={{ padding: '4px 8px', borderBottom: i === recentArticles.length - 1 ? 'none' : undefined }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 30, paddingLeft: 8, color: 'var(--blue-text)' }}>
                        <button
                          aria-label="Bookmark article"
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(art.id, art.title); }}
                          style={{ display: 'flex', color: 'inherit' }}
                        >
                          <Bookmark size={18} strokeWidth={2.2} fill={bookmarked.has(art.id) ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          aria-label="More actions"
                          onClick={(e) => { e.stopPropagation(); showToast(`Options for "${art.title}"`, 'info'); }}
                          style={{ display: 'flex', color: 'inherit' }}
                        >
                          <EllipsisVertical size={17} strokeWidth={2.2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          {/* AI Hospital Knowledge Assistant */}
          <div className="ai-assistant-card" style={{ gap: 0, padding: '16px 12px 12px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingLeft: 6 }}>
              <AiSparkle size={24} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 'var(--fs-h4)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                AI Hospital Knowledge Assistant<br />(GPT-6 Astro)
              </span>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45, margin: '6px 0 9px' }}>
              Ask any clinical question, get evidence-based answers from hospital guidelines, protocols and latest medical knowledge.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {mockKnowledgePromptQuestions.map((question, i) => (
                <button
                  key={i}
                  onClick={() => handleAskKnowledge(question)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 26,
                    padding: '0 10px 0 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 11.5,
                    color: 'var(--text-primary)',
                    textAlign: 'left'
                  }}
                >
                  <span>{question}</span>
                  <ChevronRight size={14} color="var(--blue-text)" strokeWidth={2.2} />
                </button>
              ))}
            </div>

            {aiResponse && (
              <div className="ai-section" style={{ marginTop: 8, fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {aiResponse}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <input
                type="text"
                className="input-field"
                style={{ height: 34, fontSize: 11.5, padding: '0 10px', borderColor: 'var(--blue-border)' }}
                placeholder="Ask a question about guidelines, protocols..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskKnowledge()}
              />
              <button className="btn-primary" aria-label="Ask" style={{ width: 34, height: 34, padding: 0, flexShrink: 0 }} onClick={() => handleAskKnowledge()}>
                <Send size={15} />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="medios-card" style={{ padding: '9px 12px 10px' }}>
            <h4 style={{ fontSize: 'var(--fs-h4)', fontWeight: 700, marginBottom: 7 }}>Quick Links</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
              {QUICK_LINKS.map(link => (
                <button
                  key={link.label}
                  className="btn-secondary"
                  style={{ height: 42, justifyContent: 'flex-start', gap: 12, padding: '0 12px', fontSize: 11.5, fontWeight: 400, borderColor: 'var(--border-color)' }}
                  onClick={() => showToast(link.toast)}
                >
                  <link.icon size={19} color={link.color} strokeWidth={1.9} />
                  <span>{link.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recently Viewed */}
          <div className="medios-card" style={{ padding: '12px 12px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>Recently Viewed</span>
              <button
                className="text-link"
                style={{ fontSize: 12.5 }}
                onClick={() => { setRecentlyViewed([]); showToast('Recently viewed history cleared', 'info'); }}
              >
                Clear
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentlyViewed.length === 0 ? (
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', padding: '8px 0' }}>No recently viewed articles</span>
              ) : recentlyViewed.map(item => {
                const { icon: Icon, color, bg } = RECENT_ICONS[item.kind];
                return (
                  <button
                    key={item.id}
                    onClick={() => showToast(`Opened: ${item.title}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 16, height: 30, textAlign: 'left' }}
                  >
                    <span style={{ width: 24, height: 24, borderRadius: 'var(--radius-xs)', background: bg, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} strokeWidth={2} />
                    </span>
                    <span style={{ flex: 1, fontSize: 11.5, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item.time}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
