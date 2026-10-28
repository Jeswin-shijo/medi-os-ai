import React, { useEffect, useRef } from 'react';
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
  type LucideIcon
} from 'lucide-react';
import { Capsules } from '../common/icons';
import { Avatar } from '../common/Avatar';

/** The bed pages, and the roles that cannot open them (as the API). */
const BED_SCREENS: ScreenId[] = ['beds', 'bed-agent'];
const NO_BED_ACCESS = ['pharmacist', 'lab'];

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
    { id: 'bed-agent', label: 'Bed Agent', icon: Bot },
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
  ] as NavItem[]).filter((item) => !BED_SCREENS.includes(item.id) || !NO_BED_ACCESS.includes(user?.role ?? ''));

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
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item-btn ${isActive ? 'active' : ''}`}
              aria-label={item.badge ? `${item.label}, ${item.badge} unread` : item.label}
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
              {item.badge && item.badge > 0 ? (
                <span className="nav-badge-pill">{item.badge}</span>
              ) : null}
            </button>
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
