import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { ScreenId } from '../../types';
import {
  LayoutGrid,
  UsersRound,
  CalendarCheck,
  UserRoundSearch,
  FileAxis3d,
  FlaskConical,
  ImagePlay,
  FileSignature,
  CircleX,
  CalendarFold,
  BookOpenText,
  Mic,
  Bell,
  MessageSquareMore,
  Settings,
  LogOut,
  PhoneCall,
  BedDouble,
  Bot,
  Ticket,
  Network,
  Siren,
  FlaskRound,
  Pill,
  CalendarCheck2,
  CalendarClock,
  CircleDollarSign,
  HeartHandshake,
  ChevronDown,
  type LucideIcon
} from 'lucide-react';
import { Capsules } from '../common/icons';
import { Avatar } from '../common/Avatar';
import { canUseCallAgent } from '../../utils/callAgent';

/** The bed pages, and the roles that cannot open them (as the API). */
const BED_SCREENS: ScreenId[] = ['beds'];
const NO_BED_ACCESS = ['pharmacist', 'lab'];

/** The AI Agents group, in the client's order. Pharmacists and lab staff have no access to it (as the API). */
const AGENT_NAV: { id: ScreenId; label: string; icon: LucideIcon; built: boolean }[] = [
  { id: 'coordinator', label: 'Coordinator Agent', icon: Network, built: true },
  { id: 'er-agent', label: 'ER Agent', icon: Siren, built: true },
  { id: 'bed-agent', label: 'Bed Agent', icon: Bot, built: true },
  { id: 'lab-agent', label: 'Lab Agent', icon: FlaskRound, built: false },
  { id: 'pharmacy-agent', label: 'Pharmacy Agent', icon: Pill, built: false },
  { id: 'discharge-agent', label: 'Discharge Agent', icon: CalendarCheck2, built: false },
  { id: 'scheduling-agent', label: 'Scheduling Agent', icon: CalendarClock, built: false },
  { id: 'revenue-agent', label: 'Revenue Agent', icon: CircleDollarSign, built: false },
  { id: 'patient-support-agent', label: 'Patient Support Agent', icon: HeartHandshake, built: false }
];

const GROUP_KEY = 'mediosAgentsGroupCollapsed';
const readCollapsed = () => {
  try {
    return localStorage.getItem(GROUP_KEY) === '1';
  } catch {
    return false;
  }
};

interface NavItem {
  id: ScreenId;
  label: string;
  icon: LucideIcon;
  badge?: number;
  dot?: boolean;
}

interface SidebarProps {
  /** Phones only: the sidebar is a drawer, open while this is true. */
  open: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { activeScreen, setActiveScreen, unreadMessagesCount, user, signOut } = useApp();
  const name = user?.name ?? '';
  const navRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggleGroup = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(GROUP_KEY, c ? '0' : '1');
      } catch {
        // Not remembered; the group still works.
      }
      return !c;
    });
  };
  const showAgents = !NO_BED_ACCESS.includes(user?.role ?? '');

  useEffect(() => {
    if (!open) return;
    navRef.current?.querySelector<HTMLButtonElement>('.nav-item-btn.active, .nav-item-btn')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const navItems: NavItem[] = ([
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'patients', label: 'Patients', icon: UsersRound },
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck },
    { id: 'queue', label: 'Token Queue', icon: Ticket },
    { id: 'beds', label: 'Beds & Rooms', icon: BedDouble },
    { id: 'call-agent', label: 'AI Call Agent', icon: PhoneCall },
    { id: 'consultation', label: 'Consultation', icon: UserRoundSearch },
    { id: 'emr', label: 'EMR / Clinical Notes', icon: FileAxis3d },
    { id: 'lab-reports', label: 'Lab Reports', icon: FlaskConical },
    { id: 'imaging', label: 'Imaging (RIS)', icon: ImagePlay },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileSignature },
    { id: 'medications', label: 'Medications', icon: CircleX },
    { id: 'billing', label: 'Billing', icon: CalendarFold },
    { id: 'follow-ups', label: 'Follow-ups', icon: Capsules },
    { id: 'hospital-knowledge', label: 'Hospital Knowledge', icon: BookOpenText },
    { id: 'clinical-guidelines', label: 'Clinical Guidelines', icon: BookOpenText },
    { id: 'voice-to-notes', label: 'Voice to Notes', icon: Mic },
    { id: 'tasks-alerts', label: 'Tasks & Alerts', icon: Bell },
    { id: 'messages', label: 'Messages', icon: MessageSquareMore, badge: unreadMessagesCount, dot: unreadMessagesCount > 0 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ] as NavItem[]).filter(
    (item) =>
      (!BED_SCREENS.includes(item.id) || !NO_BED_ACCESS.includes(user?.role ?? '')) &&
      (item.id !== 'call-agent' || canUseCallAgent(user?.role)),
  );

  const renderItem = (item: NavItem & { soon?: boolean }, isActive: boolean) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        className={`nav-item-btn ${isActive ? 'active' : ''}`}
        aria-label={item.soon ? `${item.label}, coming soon` : item.badge ? `${item.label}, ${item.badge} unread` : item.label}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => {
          setActiveScreen(item.id);
          onClose();
        }}
      >
        {isActive && <span className="nav-active-bg" aria-hidden="true" />}
        <span className="nav-item-icon">
          <Icon size={22} strokeWidth={1.75} />
          {item.dot && <span className="nav-item-dot" />}
        </span>
        <span className="nav-item-label">{item.label}</span>
        {item.badge && item.badge > 0 ? <span className="nav-badge-pill">{item.badge}</span> : null}
        {item.soon ? <span className="nav-soon-tag">Soon</span> : null}
      </button>
    );
  };

  const renderGroup = () =>
    !showAgents ? null : (
      <div className="nav-group" role="group" aria-label="AI Agents">
        <button className="nav-group-btn" aria-expanded={!collapsed} aria-controls="nav-agents-list" onClick={toggleGroup}>
          <span>AI Agents</span>
          <ChevronDown className="nav-group-chevron" size={16} strokeWidth={2} aria-hidden="true" />
        </button>
        <div id="nav-agents-list" className={`nav-group-items${collapsed ? ' is-collapsed' : ''}`}>
          {AGENT_NAV.map((a) => renderItem({ id: a.id, label: a.label, icon: a.icon, soon: !a.built }, activeScreen === a.id))}
        </div>
      </div>
    );

  return (
    <aside className={`app-sidebar${open ? ' is-open' : ''}`} aria-label="Main navigation">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-icon-box">
          <img src="/logo.svg" alt="" width={42} height={42} />
        </div>
        <div className="brand-text-box">
          <h2>MediOS <span className="brand-ai">AI</span></h2>
          <p>Powered by GPT-6 Astro</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav" ref={navRef}>
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          const group = item.id === 'beds' ? renderGroup() : null;
          return (
            <React.Fragment key={item.id}>
              {renderItem(item, isActive)}
              {group}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Bottom Profile Footer */}
      <div className="sidebar-footer">
        <div className="doctor-profile-card">
          <Avatar name={name} src={user?.avatar || undefined} size={42} style={{ border: '2px solid rgba(255, 255, 255, 0.85)' }} />
          <div className="doctor-profile-info">
            <h4>{name}</h4>
            <p>{user?.specialty || user?.role}</p>
          </div>
        </div>

        <button
          className="logout-btn"
          aria-label="Logout"
          onClick={signOut}
        >
          <LogOut size={20} strokeWidth={1.75} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
