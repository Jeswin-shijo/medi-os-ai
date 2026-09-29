import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { mockMessageThreads, mockMessageTemplates } from '../../mock/messagesData';
import { MessageThread, ChatMessage } from '../../types';
import { messageService } from '../../services';
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  ImageIcon,
  Smile,
  Send,
  Download,
  FolderOpen,
  Share2,
  Calendar,
  Clock,
  CheckCheck
} from 'lucide-react';

export const MessagesScreen: React.FC = () => {
  const { setActiveScreen, showToast } = useApp();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState('th-1');
  const [activeTab, setActiveTab] = useState('All Messages');
  const [filterPill, setFilterPill] = useState('All');
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    messageService.getThreads().then(setThreads);
  }, []);

  const filteredThreads = threads.filter(th => {
    const matchesSearch = th.contactName.toLowerCase().includes(search.toLowerCase()) ||
      th.preview.toLowerCase().includes(search.toLowerCase()) ||
      th.category.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // Filter by Top Tab
    if (activeTab === 'Patient Messages' && th.category !== 'Patient') return false;
    if (activeTab === 'Staff Messages' && (th.category !== 'Nursing' && th.category !== 'Pharmacy' && th.category !== 'Lab' && th.category !== 'Imaging')) return false;
    if (activeTab === 'Department Chats' && th.category !== 'Department') return false;
    if (activeTab === 'Broadcasts' && th.category !== 'Admin') return false;

    // Filter by Secondary Pill
    if (filterPill.startsWith('Unread') && th.unreadCount === 0) return false;
    if (filterPill === 'Important' && !th.condition) return false;
    if (filterPill === 'Starred' && !th.online) return false;

    return true;
  });

  const activeThread = filteredThreads.find(t => t.id === selectedThreadId) || filteredThreads[0] || threads.find(t => t.id === selectedThreadId) || threads[0];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread) return;

    const updated = await messageService.sendMessage(activeThread.id, inputText.trim());
    setThreads(updated);
    setInputText('');
    showToast('Message sent');
  };

  const handleApplyTemplate = (tpl: string) => {
    setInputText(`Hello, this is Dr. Shajin from St. Mary's Hospital. Regarding your ${tpl.toLowerCase()}, please review and follow up.`);
  };

  if (!activeThread) return <div className="page-scroll-body">Loading messages...</div>;

  return (
    <div className="page-scroll-body">
      {/* Screen Header */}
      <div className="screen-header-row">
        <div className="screen-title-area">
          <h1>Messages</h1>
          <p>Secure communication with patients, staff and departments</p>
        </div>
        <div className="screen-header-actions">
          <button className="btn-primary" onClick={() => showToast('New secure conversation dialog opened')}>
            <Plus size={16} />
            <span>New Message</span>
          </button>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
        {[
          { label: 'All Messages', badge: 3 },
          { label: 'Patient Messages' },
          { label: 'Staff Messages' },
          { label: 'Department Chats' },
          { label: 'Broadcasts' },
          { label: 'Archived' }
        ].map(t => (
          <button
            key={t.label}
            onClick={() => setActiveTab(t.label)}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: activeTab === t.label ? '#2563eb' : 'transparent',
              color: activeTab === t.label ? '#ffffff' : '#64748b',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{t.label}</span>
            {t.badge && (
              <span style={{ fontSize: '0.68rem', background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '10px' }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 3-Column Chat Layout: Threads List | Active Conversation | Contact Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '290px 1.5fr 300px', gap: '20px', height: 'calc(100vh - 200px)' }}>
        {/* Left Column: Threads List */}
        <div className="medios-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} className="search-icon-left" />
            <input
              type="text"
              className="global-search-input"
              style={{ width: '100%', height: '34px', fontSize: '0.78rem' }}
              placeholder="Search messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {['All', 'Unread (3)', 'Important', 'Starred'].map((filter) => {
              const isSelected = filterPill === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setFilterPill(filter)}
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: isSelected ? '#eff6ff' : '#f1f5f9',
                    color: isSelected ? '#2563eb' : '#64748b',
                    border: isSelected ? '1px solid #bfdbfe' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1 }}>
            {filteredThreads.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.74rem' }}>
                No messages found
              </div>
            ) : (
              filteredThreads.map(th => {
              const isSelected = selectedThreadId === th.id;
              return (
                <div
                  key={th.id}
                  onClick={() => setSelectedThreadId(th.id)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>
                      {th.contactName.charAt(0)}
                    </div>
                    {th.online && (
                      <span style={{ position: 'absolute', bottom: '0', right: '0', width: '9px', height: '9px', borderRadius: '50%', background: '#10b981', border: '1.5px solid #fff' }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{th.contactName}</span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{th.time}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                      {th.preview}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                      <span style={{ fontSize: '0.64rem', padding: '1px 5px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                        {th.category}
                      </span>
                      {th.unreadCount > 0 && (
                        <span style={{ fontSize: '0.65rem', background: '#ef4444', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {th.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Center Column: Active Chat Window */}
        <div className="medios-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80"
                alt={activeThread.contactName}
                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>{activeThread.contactName}</h4>
                  {activeThread.online && (
                    <span style={{ fontSize: '0.68rem', color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
                      ● Online
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  28 years | Female | UHID: {activeThread.uhid || 'MHK202500215'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => showToast('Starting voice consultation call')}><Phone size={15} /></button>
              <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => showToast('Opening video telemedicine conference')}><Video size={15} /></button>
              <button className="btn-secondary" style={{ padding: '6px' }}><MoreVertical size={15} /></button>
            </div>
          </div>

          {/* Messages Body */}
          <div style={{ flex: 1, padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc' }}>
            {activeThread.messages.map((msg) => {
              const isDoctor = msg.sender === 'doctor';
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isDoctor ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isDoctor ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      background: isDoctor ? '#dbeafe' : '#ffffff',
                      color: isDoctor ? '#1e3a8a' : '#0f172a',
                      padding: '10px 14px',
                      borderRadius: isDoctor ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      boxShadow: 'var(--shadow-sm)',
                      fontSize: '0.82rem',
                      lineHeight: 1.45,
                      border: isDoctor ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                    }}
                  >
                    {msg.text}

                    {msg.attachment && (
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginTop: '4px'
                        }}
                      >
                        <ImageIcon size={24} color="#2563eb" />
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{msg.attachment.name}</div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{msg.attachment.size}</div>
                        </div>
                        <button style={{ marginLeft: 'auto', color: '#2563eb' }} onClick={() => showToast('Downloaded blood pressure chart image')}>
                          <Download size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', fontSize: '0.66rem', color: '#94a3b8' }}>
                    <span>{msg.time}</span>
                    {isDoctor && <CheckCheck size={12} color="#2563eb" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Composer */}
          <form onSubmit={handleSendMessage} style={{ padding: '12px 16px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button type="button" style={{ color: '#64748b' }} onClick={() => showToast('Attach file / document')}><Paperclip size={18} /></button>
            <button type="button" style={{ color: '#64748b' }} onClick={() => showToast('Attach image')}><ImageIcon size={18} /></button>
            <input
              type="text"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.84rem' }}
            />
            <button type="button" style={{ color: '#64748b' }}><Smile size={18} /></button>
            <button type="submit" className="btn-primary" style={{ padding: '8px 12px' }}>
              <Send size={15} />
            </button>
          </form>
        </div>

        {/* Right Column: Patient Information & Templates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', overflowY: 'auto' }}>
          {/* Patient Info Card */}
          <div className="medios-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>Patient Information</span>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                onClick={() => setActiveScreen('emr')}
              >
                <FolderOpen size={12} />
                <span>Open EMR</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80"
                alt={activeThread.contactName}
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>{activeThread.contactName}</h4>
                <p style={{ fontSize: '0.72rem', color: '#64748b' }}>UHID: {activeThread.uhid || 'MHK202500215'}</p>
                <p style={{ fontSize: '0.7rem', color: '#64748b' }}>28 years • Female</p>
                <p style={{ fontSize: '0.7rem', color: '#64748b' }}>+91 98765 43210</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <span className="badge-tag diabetes" style={{ fontSize: '0.68rem' }}>Type 2 Diabetes</span>
              <span className="badge-tag hypertension" style={{ fontSize: '0.68rem' }}>Hypertension</span>
              <span className="badge-tag" style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.68rem' }}>Follow-up</span>
            </div>
          </div>

          {/* Recent Files */}
          <div className="medios-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Recent Files</span>
              <span style={{ fontSize: '0.7rem', color: '#2563eb', cursor: 'pointer' }}>View All</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.72rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🖼️ BP Reading - 24 Sep</span>
                <span style={{ color: '#94a3b8' }}>24 Sep</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📄 Lab Report - CBC</span>
                <span style={{ color: '#94a3b8' }}>18 Sep</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📄 Prescription</span>
                <span style={{ color: '#94a3b8' }}>12 Sep</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="medios-card" style={{ padding: '14px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: '8px' }}>Quick Actions</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button className="btn-secondary" style={{ fontSize: '0.68rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('Video call ringing...')}>
                Start Video Call
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.68rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('Lab report shared')}>
                Share Lab Report
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.68rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('Prescription shared')}>
                Share Prescription
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.68rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('Follow-up scheduled')}>
                Schedule Follow-up
              </button>
            </div>
          </div>

          {/* Message Templates */}
          <div className="medios-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Message Templates</span>
              <span style={{ fontSize: '0.7rem', color: '#2563eb', cursor: 'pointer' }}>View All</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {mockMessageTemplates.map(tpl => (
                <div
                  key={tpl}
                  onClick={() => handleApplyTemplate(tpl)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    color: '#334155'
                  }}
                >
                  {tpl} →
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
