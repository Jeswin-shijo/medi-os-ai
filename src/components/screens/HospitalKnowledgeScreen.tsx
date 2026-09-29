import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  mockKnowledgeTopics,
  mockFeaturedKnowledge,
  mockRecentArticles,
  mockKnowledgePromptQuestions
} from '../../mock/knowledgeData';
import { mockGuidelinesSpecialties } from '../../mock/guidelinesData';
import {
  Search,
  Sparkles,
  Bookmark,
  BookOpen,
  Send,
  ExternalLink,
  ChevronRight,
  FileText,
  AlertCircle,
  FileCheck2,
  Clock
} from 'lucide-react';

export const HospitalKnowledgeScreen: React.FC = () => {
  const { showToast } = useApp();
  const [activeTopic, setActiveTopic] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Topics');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleAskKnowledge = (qText?: string) => {
    const q = qText || aiQuestion;
    if (!q) return;
    setAiQuestion(q);
    setAiResponse(`GPT-6 Astro Knowledge: Based on St. Mary's Hospital Clinical SOP (Rev 2026.2), the first-line empirical protocol for ${q} involves step-wise evaluation and standardized antimicrobial dosage.`);
  };

  return (
    <div className="page-scroll-body">
      {/* Screen Header */}
      <div className="screen-header-row">
        <div className="screen-title-area">
          <h1>Hospital Knowledge</h1>
          <p>Access clinical guidelines, protocols, drug information, SOPs and hospital policies with AI assistance</p>
        </div>
        <div className="screen-header-actions">
          <button className="btn-primary" style={{ background: '#7e22ce' }} onClick={() => handleAskKnowledge('Show critical emergency resuscitation algorithms')}>
            <Sparkles size={16} />
            <span>Ask AI (GPT-6 Astro)</span>
          </button>
          <button className="btn-secondary" onClick={() => showToast('Bookmarks folder (14 saved articles)')}>
            <Bookmark size={16} />
            <span>Bookmarks</span>
          </button>
        </div>
      </div>

      {/* Global Knowledge Search Bar */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} className="search-icon-left" />
          <input
            type="text"
            className="global-search-input"
            style={{ width: '100%', height: '42px', fontSize: '0.86rem' }}
            placeholder="Search guidelines, protocols, drugs, diseases, procedures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-primary" style={{ padding: '0 24px' }} onClick={() => showToast(`Searching knowledge base for "${searchQuery}"`)}>
          Search
        </button>
      </div>

      {/* Topic Pill Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
        {mockKnowledgeTopics.map(topic => {
          const isSelected = activeTopic === topic.id;
          return (
            <div
              key={topic.id}
              onClick={() => setActiveTopic(topic.id)}
              style={{
                background: isSelected ? '#eff6ff' : '#ffffff',
                border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: 'var(--shadow-card)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: isSelected ? '#1e3a8a' : '#0f172a' }}>
                {topic.title}
              </div>
              <div style={{ fontSize: '0.72rem', color: isSelected ? '#2563eb' : '#64748b', marginTop: '2px' }}>
                {topic.count} articles
              </div>
            </div>
          );
        })}
      </div>

      {/* 3-Column Layout: Categories list | Featured & Recent Articles | AI Knowledge Assistant & Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1.5fr 1fr', gap: '20px' }}>
        {/* Left Column: Categories List */}
        <div className="medios-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: '4px' }}>Categories</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '620px', overflowY: 'auto' }}>
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
                    fontSize: '0.76rem',
                    fontWeight: isSelected ? 700 : 500
                  }}
                >
                  <span>{spec.name}</span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{spec.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Featured Knowledge & Recent Articles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Featured Knowledge Cards (2x2 Grid) */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Featured Knowledge</span>
              <span style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>View All</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {mockFeaturedKnowledge.map(item => (
                <div
                  key={item.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => showToast(`Opened: ${item.title}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: `${item.iconColor}15`, color: item.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={16} />
                    </div>
                    <Bookmark size={14} color="#94a3b8" />
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <h4 style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>{item.subtitle}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <span style={{ fontSize: '0.66rem', padding: '1px 6px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb', fontWeight: 600 }}>
                      {item.tag}
                    </span>
                    <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Articles Table */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Recent Articles</span>
              <span style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>View All</span>
            </div>

            <table className="medios-table" style={{ fontSize: '0.78rem' }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Last Updated</th>
                  <th style={{ width: '40px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockRecentArticles.map(art => (
                  <tr key={art.id} onClick={() => showToast(`Opened article: ${art.title}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 700 }}>{art.title}</td>
                    <td style={{ color: '#64748b' }}>{art.category}</td>
                    <td>
                      <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', fontWeight: 600 }}>
                        {art.type}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{art.lastUpdated}</td>
                    <td>
                      <Bookmark size={14} color="#94a3b8" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: AI Knowledge Assistant & Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* AI Knowledge Assistant Card */}
          <div className="ai-assistant-card">
            <div className="ai-header-bar">
              <div className="ai-title-row">
                <Sparkles size={16} />
                <span>AI Hospital Knowledge Assistant</span>
              </div>
            </div>

            <p style={{ fontSize: '0.74rem', color: '#6b21a8', lineHeight: 1.4 }}>
              Ask any clinical question, get evidence-based answers from hospital guidelines, protocols and latest medical knowledge.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {mockKnowledgePromptQuestions.map((q, i) => (
                <div
                  key={i}
                  onClick={() => handleAskKnowledge(q)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: '1px solid #e9d5ff',
                    cursor: 'pointer',
                    fontSize: '0.74rem',
                    color: '#4c1d95',
                    fontWeight: 500
                  }}
                >
                  <span>{q}</span>
                  <ChevronRight size={13} color="#7e22ce" />
                </div>
              ))}
            </div>

            {aiResponse && (
              <div style={{ padding: '10px', borderRadius: '8px', background: '#faf5ff', border: '1px solid #d8b4fe', fontSize: '0.74rem', color: '#581c87', lineHeight: 1.4 }}>
                {aiResponse}
              </div>
            )}

            <div className="ai-prompt-box" style={{ marginTop: '4px' }}>
              <input
                type="text"
                className="ai-prompt-input"
                placeholder="Ask a question about guidelines, protocols..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskKnowledge()}
              />
              <button className="ai-send-btn" onClick={() => handleAskKnowledge()}>
                <Send size={14} />
              </button>
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
              Quick Links
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '8px', justifyContent: 'center' }} onClick={() => showToast('Opened Pathology Reference Ranges')}>
                Lab Reference Ranges
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '8px', justifyContent: 'center' }} onClick={() => showToast('Opened Hospital Drug Formulary')}>
                Drug Formulary
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '8px', justifyContent: 'center' }} onClick={() => showToast('Emergency Resuscitation SOPs active')}>
                Emergency Protocols
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '8px', justifyContent: 'center' }} onClick={() => showToast('Hospital standard operating procedures')}>
                Hospital SOPs
              </button>
            </div>
          </div>

          {/* Recently Viewed */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Recently Viewed</span>
              <span style={{ fontSize: '0.7rem', color: '#2563eb', cursor: 'pointer' }}>Clear</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.74rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Hypertension Management Guidelines</span>
                <span style={{ color: '#94a3b8' }}>10 min ago</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Normal Lab Reference Ranges</span>
                <span style={{ color: '#94a3b8' }}>2 hours ago</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sepsis Management Protocol</span>
                <span style={{ color: '#94a3b8' }}>5 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
