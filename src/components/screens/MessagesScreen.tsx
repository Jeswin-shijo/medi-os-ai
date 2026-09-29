import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/appContextCore';
import { mockMessageTemplates } from '../../mock/messagesData';
import { MessageThread } from '../../types';
import { messageService } from '../../services';
import { ScreenHeader } from '../common/ScreenHeader';
import { Avatar } from '../common/Avatar';
import { DiabetesDots } from '../common/icons';
import {
  createLucideIcon,
  SquarePen,
  Search,
  Filter,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Send,
  Download,
  ClipboardList,
  FileText,
  CalendarDays,
  Bell,
  ChevronRight,
  CheckCheck,
  Microscope,
  HeartPulse,
  Hospital,
  HouseHeart,
  LucideIcon
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Local icons the design uses that Lucide doesn't ship
// ---------------------------------------------------------------------------

/** Nurse with cap — "Nursing Station" thread tile. */
const NurseIcon = createLucideIcon('nurse', [
  ['path', { d: 'M6.5 3.8C8.5 2.4 15.5 2.4 17.5 3.8L17 8H7z', key: 'cap' }],
  ['path', { d: 'M12 4.2v2.4', key: 'c1' }],
  ['path', { d: 'M10.8 5.4h2.4', key: 'c2' }],
  ['circle', { cx: '12', cy: '11.5', r: '3.5', key: 'head' }],
  ['path', { d: 'M4.5 21.5v-1a5 5 0 0 1 5-5h5a5 5 0 0 1 5 5v1z', key: 'body' }],
]);

/** "Rx" prescription glyph — Share Prescription quick action. */
const RxIcon = createLucideIcon('rx', [
  ['path', { d: 'M5 17V3h5.5a4 4 0 0 1 0 8H5', key: 'r' }],
  ['path', { d: 'M9.5 11 19 21', key: 'leg' }],
  ['path', { d: 'M19 13.5 12.5 21', key: 'x' }],
]);

/** Half-filled capsule — Pharmacy thread tile. */
const CapsuleIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <g transform="rotate(-45 12 12)">
      <rect x="2.5" y="7.5" width="19" height="9" rx="4.5" fill="#ffffff" stroke="#ea4b35" strokeWidth="2" />
      <path d="M7 8.5h5v7H7a3.5 3.5 0 0 1 0-7z" fill="#f26b3a" />
    </g>
  </svg>
);

/** Solid red PDF document — Recent Files rows. */
const PdfIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 1.5h8.5L20.5 7.5V21a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 21V3A1.5 1.5 0 0 1 6 1.5z" fill="#dc2626" />
    <path d="M14.5 1.5v6h6" fill="#f87171" />
    <text x="12.5" y="18" textAnchor="middle" fontSize="6.4" fontWeight="700" fill="#ffffff">PDF</text>
  </svg>
);

// ---------------------------------------------------------------------------
// Category styling (thread tiles + type chips)
// ---------------------------------------------------------------------------

type Category = MessageThread['category'];

const CHIP_STYLE: Record<Category, React.CSSProperties> = {
  Patient: { backgroundColor: '#ece4fd', color: 'var(--purple-dark)' },
  Lab: { backgroundColor: '#dae7fd', color: 'var(--blue-text)' },
  Pharmacy: { backgroundColor: 'var(--orange-light)', color: 'var(--orange-dark)' },
  Imaging: { backgroundColor: '#ece4fd', color: 'var(--purple-dark)' },
  Nursing: { backgroundColor: 'var(--green-light)', color: 'var(--green-dark)' },
  Department: { backgroundColor: 'var(--blue-light)', color: 'var(--blue-text)' },
  Admin: { backgroundColor: 'var(--gray-pill-bg)', color: 'var(--gray-pill-text)' },
};

const BLUE_TILE = '#eef2fa';
const RED_TILE = '#fdeef0';

/** Icon tile shown instead of a photo for department / staff threads. */
const THREAD_TILES: Record<string, { bg: string; render: (size: number) => React.ReactNode }> = {
  'Lab Department': { bg: BLUE_TILE, render: s => <Microscope size={s} color="var(--blue-text)" strokeWidth={2.2} /> },
  Pharmacy: { bg: RED_TILE, render: s => <CapsuleIcon size={s + 4} /> },
  Radiology: { bg: BLUE_TILE, render: s => <ImageIcon size={s} color="var(--blue-text)" strokeWidth={2.2} /> },
  'Nursing Station': { bg: BLUE_TILE, render: s => <NurseIcon size={s} color="var(--blue-text)" strokeWidth={2.2} /> },
  'Cardiology Dept.': { bg: RED_TILE, render: s => <HeartPulse size={s} color="#e0213a" strokeWidth={2.4} /> },
  'Hospital Admin': { bg: BLUE_TILE, render: s => <Hospital size={s} color="var(--blue-text)" strokeWidth={2.2} /> },
};

const ThreadAvatar: React.FC<{ name: string; size: number }> = ({ name, size }) => {
  const tile = THREAD_TILES[name];
  if (tile) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: tile.bg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {tile.render(Math.round(size * 0.58))}
      </span>
    );
  }
  return <Avatar name={name} size={size} />;
};

const CategoryChip: React.FC<{ category: Category; withIcon?: boolean }> = ({ category, withIcon }) => (
  <span className="status-pill" style={{ ...CHIP_STYLE[category], height: 20, padding: '0 7px', gap: 4 }}>
    {withIcon && category === 'Patient' && <HouseHeart size={12} strokeWidth={2.6} />}
    {category}
  </span>
);

// ---------------------------------------------------------------------------
// Static side-panel content
// ---------------------------------------------------------------------------

const RECENT_FILES = [
  { name: 'BP Reading - 24 Sep 2026', meta: 'Image • 248 KB', date: '24 Sep', kind: 'image' as const },
  { name: 'Lab Report - CBC', meta: 'PDF • 1.2 MB', date: '18 Sep', kind: 'pdf' as const },
  { name: 'Prescription', meta: 'PDF • 320 KB', date: '12 Sep', kind: 'pdf' as const },
];

const QUICK_ACTIONS: { label: string; icon: LucideIcon; toast: string }[] = [
  { label: 'Start Video Call', icon: Video, toast: 'Video call ringing...' },
  { label: 'Share Lab Report', icon: FileText, toast: 'Lab report shared' },
  { label: 'Share Prescription', icon: RxIcon, toast: 'Prescription shared' },
  { label: 'Schedule Follow-up', icon: CalendarDays, toast: 'Follow-up scheduled' },
  { label: 'Send Reminder', icon: Bell, toast: 'Reminder sent to patient' },
  { label: 'Send Appointment', icon: Send, toast: 'Appointment details sent' },
];

const PAGE_TABS: { label: string; badge?: number }[] = [
  { label: 'All Messages', badge: 3 },
  { label: 'Patient Messages' },
  { label: 'Staff Messages' },
  { label: 'Department Chats' },
  { label: 'Broadcasts' },
  { label: 'Archived' },
];

const FILTERS = ['All', 'Unread (3)', 'Important', 'Starred'];

// ---------------------------------------------------------------------------
// Shared inline styles
// ---------------------------------------------------------------------------

const S = {
  cardTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' } as React.CSSProperties,
  sep: { width: 1, height: 12, backgroundColor: 'var(--border-strong)', display: 'inline-block' } as React.CSSProperties,
  bubbleText: { fontSize: 14, lineHeight: '20px', color: 'var(--text-primary)', whiteSpace: 'pre-line' } as React.CSSProperties,
  bubbleTime: { fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' } as React.CSSProperties,
};

/** Short, single-line messages show their time inline (as in the design). */
const isInline = (text: string) => !text.includes('\n') && text.length <= 44;

export const MessagesScreen: React.FC = () => {
  const { setActiveScreen, showToast } = useApp();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState('th-1');
  const [activeTab, setActiveTab] = useState('All Messages');
  const [filterPill, setFilterPill] = useState('All');
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const chatBodyRef = useRef<HTMLDivElement>(null);

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
  const messageCount = activeThread?.messages.length ?? 0;

  // Keep the newest message in view (initial load, thread switch, after sending).
  useEffect(() => {
    const el = chatBodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeThread?.id, messageCount]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread) return;

    const updated = await messageService.sendMessage(activeThread.id, inputText.trim());
    setThreads([...updated]);
    setInputText('');
    showToast('Message sent');
  };

  const handleApplyTemplate = (tpl: string) => {
    setInputText(`Hello, this is Dr. Shajin from St. Mary's Hospital. Regarding your ${tpl.toLowerCase()}, please review and follow up.`);
  };

  if (!activeThread) return <div className="page-scroll-body">Loading messages...</div>;

  const isPatient = activeThread.category === 'Patient';
  const uhid = activeThread.uhid || 'MHK202500215';

  return (
    <div className="page-scroll-body" style={{ height: '100%' }}>
      <ScreenHeader
        title="Messages"
        subtitle="Secure communication with patients, staff and departments"
        actions={
          <button className="btn-primary" style={{ padding: '0 26px 0 24px', gap: 10 }} onClick={() => showToast('New secure conversation dialog opened')}>
            <SquarePen size={18} />
            <span>New Message</span>
          </button>
        }
      />

      {/* Page tabs */}
      <div className="page-tabs" style={{ gap: 4, marginTop: -6 }}>
        {PAGE_TABS.map(t => {
          const active = activeTab === t.label;
          return (
            <button
              key={t.label}
              className={`page-tab-btn${active ? ' active' : ''}`}
              style={{ height: 42, padding: '0 18px', gap: 8, backgroundColor: active ? undefined : 'transparent' }}
              onClick={() => setActiveTab(t.label)}
            >
              <span>{t.label}</span>
              {t.badge && (
                <span style={{ minWidth: 18, height: 18, borderRadius: 9, backgroundColor: 'var(--red-rose)', color: '#fff', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3-column layout: thread list | conversation | contact info */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(290px, 371fr) minmax(0, 543fr) minmax(280px, 347fr)',
          gap: 14,
          flex: 1,
          minHeight: 600,
          marginTop: -9,
          marginBottom: 14,
        }}
      >
        {/* ===== Left: thread list ===== */}
        <div className="medios-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 8, padding: '15px 6px 0 2px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={17} className="search-icon-left" style={{ left: 13 }} />
              <input
                type="text"
                className="global-search-input"
                style={{ height: 38, paddingLeft: 40, paddingRight: 12, fontSize: 12.5 }}
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="icon-btn" style={{ width: 38, height: 38, color: 'var(--blue-text)' }} onClick={() => showToast('Message filters opened')} aria-label="Filter messages">
              <Filter size={17} />
            </button>
          </div>

          <div className="card-tabs" style={{ borderBottom: 'none', justifyContent: 'space-between', padding: '0 14px 0 0', marginTop: 7 }}>
            {FILTERS.map(filter => (
              <button
                key={filter}
                className={`card-tab-btn${filterPill === filter ? ' active' : ''}`}
                style={{ height: 38, padding: '0 20px', minWidth: 0, flexShrink: 1, color: filterPill === filter ? undefined : 'var(--text-primary)' }}
                onClick={() => setFilterPill(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', marginTop: 6 }}>
            {filteredThreads.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
                No messages found
              </div>
            ) : (
              filteredThreads.map((th, idx) => {
                const isSelected = activeThread.id === th.id;
                const unread = th.unreadCount > 0;
                const nextSelected = filteredThreads[idx + 1]?.id === activeThread.id;
                return (
                  <div
                    key={th.id}
                    onClick={() => setSelectedThreadId(th.id)}
                    style={{
                      height: 71,
                      padding: '0 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--blue-light)' : undefined,
                      boxShadow: isSelected ? 'inset 2px 0 0 var(--blue-primary), inset -2px 0 0 var(--blue-primary)' : undefined,
                      position: 'relative',
                    }}
                  >
                    <ThreadAvatar name={th.contactName} size={44} />
                    <div style={{ flex: 1, minWidth: 0, marginLeft: 4 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: '20px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {th.contactName}
                      </div>
                      <div style={{ fontSize: 13.3, color: 'var(--text-secondary)', lineHeight: '20px', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {th.preview}
                      </div>
                      {unread && (
                        <div style={{ marginTop: 1 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, lineHeight: '16px', padding: '0 4px', borderRadius: 4, ...CHIP_STYLE[th.category] }}>
                            {th.category === 'Patient' && <HouseHeart size={12} strokeWidth={2.6} />}
                            {th.category}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, alignSelf: 'flex-start', paddingTop: unread ? 7 : 13, flexShrink: 0 }}>
                      <span style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: '18px' }}>{th.time}</span>
                      {unread ? (
                        <span style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: 'var(--red-rose)', color: '#fff', fontSize: 11.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {th.unreadCount}
                        </span>
                      ) : (
                        <CategoryChip category={th.category} />
                      )}
                    </div>
                    {!isSelected && !nextSelected && idx < filteredThreads.length - 1 && (
                      <span style={{ position: 'absolute', left: 14, right: 14, bottom: 0, height: 1, backgroundColor: 'var(--border-subtle)' }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ===== Center: conversation ===== */}
        <div className="medios-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {/* Conversation header */}
          <div style={{ padding: '14px 10px 13px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <ThreadAvatar name={activeThread.contactName} size={54} />
            <div style={{ flex: 1, minWidth: 0, paddingTop: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: '22px' }}>{activeThread.contactName}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 7, lineHeight: '20px', whiteSpace: 'nowrap' }}>
                {isPatient ? (
                  <>
                    <span>{activeThread.age ?? 28} years</span>
                    <span style={S.sep} />
                    <span>{activeThread.gender ?? 'Female'}</span>
                    <span style={S.sep} />
                    <span>UHID: {uhid}</span>
                  </>
                ) : (
                  <>
                    <span>{activeThread.category === 'Department' || activeThread.category === 'Admin' ? 'Department' : 'Staff'} channel</span>
                    <span style={S.sep} />
                    <span>St. Mary&apos;s Hospital</span>
                  </>
                )}
              </div>
              {activeThread.condition && (
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, lineHeight: '20px' }}>
                  <Phone size={13} color="var(--blue-text)" strokeWidth={2.4} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeThread.condition}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 3, paddingTop: 4, flexShrink: 0 }}>
              {activeThread.online && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 23, padding: '0 9px', borderRadius: 4, backgroundColor: 'var(--green-light)', color: 'var(--green-dark)', fontSize: 12, marginRight: 6, alignSelf: 'flex-start', marginTop: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--green-emerald)' }} />
                  Online
                </span>
              )}
              <button style={{ width: 30, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-text)' }} onClick={() => showToast('Starting voice consultation call')} aria-label="Voice call">
                <Phone size={19} strokeWidth={2.2} />
              </button>
              <button style={{ width: 34, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-text)' }} onClick={() => showToast('Opening video telemedicine conference')} aria-label="Video call">
                <Video size={21} strokeWidth={2.2} />
              </button>
              <button className="icon-btn" style={{ width: 34, height: 36, marginLeft: 2, color: 'var(--blue-text)' }} onClick={() => showToast('Conversation options')} aria-label="More options">
                <MoreVertical size={17} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={chatBodyRef} style={{ flex: 1, padding: '14px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {activeThread.messages.map((msg) => {
              const isDoctor = msg.sender === 'doctor';
              const read = msg.status === 'read';

              if (msg.attachment) {
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isDoctor ? 'flex-end' : 'flex-start',
                      width: 334,
                      maxWidth: '80%',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      backgroundColor: '#ffffff',
                      padding: '12px 14px 8px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ width: 34, height: 34, borderRadius: 6, backgroundColor: '#dce8fd', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {msg.attachment.type === 'pdf' ? <PdfIcon size={20} /> : <ImageIcon size={20} color="var(--blue-text)" strokeWidth={2.2} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: '20px' }}>{msg.attachment.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: '18px' }}>{msg.attachment.size}</div>
                      </div>
                      <button className="icon-btn" style={{ color: 'var(--blue-text)', alignSelf: 'flex-start' }} onClick={() => showToast('Downloaded blood pressure chart image')} aria-label="Download attachment">
                        <Download size={16} strokeWidth={2.4} />
                      </button>
                    </div>
                    <div style={{ ...S.bubbleTime, textAlign: 'right', marginTop: 2 }}>{msg.time}</div>
                  </div>
                );
              }

              const inline = isInline(msg.text);
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isDoctor ? 'flex-end' : 'flex-start',
                    maxWidth: isDoctor ? 'min(418px, 84%)' : 'min(440px, 86%)',
                    minWidth: inline || !isDoctor ? undefined : 'min(385px, 84%)',
                    backgroundColor: isDoctor ? '#dcecfd' : '#f2f5fa',
                    borderRadius: 8,
                    padding: inline ? '9px 14px' : isDoctor ? '9px 14px 7px 14px' : '9px 17px 7px 14px',
                    display: inline ? 'flex' : 'block',
                    alignItems: 'baseline',
                    gap: 18,
                  }}
                >
                  <div style={{ ...S.bubbleText, paddingRight: isDoctor && !inline ? 26 : 0 }}>{msg.text}</div>
                  <div
                    style={{
                      ...S.bubbleTime,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isDoctor && !inline ? 'flex-end' : 'flex-start',
                      gap: 6,
                      marginTop: inline ? 0 : 2,
                    }}
                  >
                    <span>{msg.time}</span>
                    {isDoctor && <CheckCheck size={14} color={read ? 'var(--blue-text)' : 'var(--text-muted)'} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Composer */}
          <form onSubmit={handleSendMessage} style={{ padding: '12px 20px 14px 14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ height: 44, display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 6, padding: '0 6px', flexShrink: 0 }}>
              <button type="button" style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-text)' }} onClick={() => showToast('Attach file / document')} aria-label="Attach file">
                <Paperclip size={18} />
              </button>
              <button type="button" style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-text)' }} onClick={() => showToast('Attach image')} aria-label="Attach image">
                <ImageIcon size={18} />
              </button>
            </div>
            <div style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 6, padding: '0 8px 0 12px', minWidth: 0 }}>
              <input
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--text-primary)' }}
              />
              <button type="button" style={{ width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-text)' }} onClick={() => setInputText(t => `${t}🙂`)} aria-label="Insert emoji">
                <Smile size={20} />
              </button>
            </div>
            <button type="submit" className="btn-primary" style={{ width: 44, height: 44, padding: 0, flexShrink: 0 }} aria-label="Send message">
              <Send size={18} />
            </button>
          </form>
        </div>

        {/* ===== Right: contact info, files, actions, templates ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflowY: 'auto' }}>
          {/* Patient Information */}
          <div className="medios-card" style={{ padding: '12px 12px 14px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={S.cardTitle}>{isPatient ? 'Patient Information' : 'Contact Information'}</span>
              <button className="btn-outline-blue btn-sm" style={{ fontSize: 11.5, height: 28, padding: '0 9px', gap: 6 }} onClick={() => setActiveScreen('emr')}>
                <ClipboardList size={14} />
                <span>Open EMR</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginTop: 2 }}>
              <ThreadAvatar name={activeThread.contactName} size={72} />
              <div style={{ paddingTop: 2, paddingLeft: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: '20px' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: '22px', marginBottom: 1 }}>{activeThread.contactName}</div>
                {isPatient ? (
                  <>
                    <div>UHID: {uhid}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span>{activeThread.age ?? 28} years</span>
                      <span style={S.sep} />
                      <span>{activeThread.gender ?? 'Female'}</span>
                    </div>
                  </>
                ) : (
                  <div>{activeThread.category} • Internal</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={13} color="var(--blue-text)" fill="var(--blue-text)" />
                  <span>{isPatient ? '+91 98765 43210' : 'Ext. 2104'}</span>
                </div>
              </div>
            </div>

            {activeThread.condition && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <span className="badge-tag diabetes" style={{ fontSize: 11.5, gap: 5, padding: '0 8px' }}><DiabetesDots size={11} />Type 2 Diabetes</span>
                <span className="badge-tag hypertension" style={{ fontSize: 11.5, padding: '0 9px' }}>Hypertension</span>
                <span className="badge-tag" style={{ fontSize: 11.5, padding: '0 9px', backgroundColor: 'var(--green-light)', color: 'var(--green-dark)' }}>Follow-up</span>
              </div>
            )}
          </div>

          {/* Recent Files */}
          <div className="medios-card" style={{ padding: '10px 14px 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={S.cardTitle}>Recent Files</span>
              <button className="text-link" style={{ fontSize: 12.5, fontWeight: 400 }} onClick={() => showToast('Opening all shared files')}>View All</button>
            </div>
            {RECENT_FILES.map((f, i) => (
              <div
                key={f.name}
                onClick={() => showToast(`Opening ${f.name}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0', cursor: 'pointer', borderTop: i ? '1px solid var(--border-subtle)' : undefined }}
              >
                <span style={{ width: 34, height: 34, borderRadius: 6, backgroundColor: f.kind === 'pdf' ? RED_TILE : '#dce8fd', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {f.kind === 'pdf' ? <PdfIcon size={20} /> : <ImageIcon size={20} color="var(--blue-text)" strokeWidth={2.2} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: '19px' }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: '17px' }}>{f.meta}</div>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'flex-start', paddingTop: 2 }}>{f.date}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="medios-card" style={{ padding: '12px 12px 12px 14px' }}>
            <div style={{ ...S.cardTitle, marginBottom: 10 }}>Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '8px 10px' }}>
              {QUICK_ACTIONS.map(({ label, icon: Icon, toast }) => (
                <button
                  key={label}
                  className="btn-outline-blue"
                  style={{ height: 38, justifyContent: 'flex-start', padding: '0 4px 0 13px', gap: 9, fontSize: 12, fontWeight: 400, borderColor: 'var(--border-strong)', minWidth: 0 }}
                  onClick={() => showToast(toast)}
                >
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Templates */}
          <div className="medios-card" style={{ padding: '12px 14px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={S.cardTitle}>Message Templates</span>
              <button className="text-link" style={{ fontSize: 12.5, fontWeight: 400 }} onClick={() => showToast('Opening template library')}>View All</button>
            </div>
            {mockMessageTemplates.map((tpl, i) => (
              <div
                key={tpl}
                onClick={() => handleApplyTemplate(tpl)}
                style={{ height: 32, display: 'flex', alignItems: 'center', gap: 14, padding: '0 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', borderTop: i ? '1px solid var(--border-subtle)' : undefined }}
              >
                <FileText size={16} color="var(--blue-text)" />
                <span style={{ flex: 1 }}>{tpl}</span>
                <ChevronRight size={16} color="var(--blue-text)" strokeWidth={2.4} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
