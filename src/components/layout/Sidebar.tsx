import React from 'react';
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
  type LucideIcon
} from 'lucide-react';
import { Capsules } from '../common/icons';
import { DOCTOR_AVATAR, DOCTOR_NAME } from '../../mock/avatars';

interface NavItem {
  id: ScreenId;
  label: string;
  icon: LucideIcon;
  badge?: number;
  dot?: boolean;
}

export const Sidebar: React.FC = () => {
  const { activeScreen, setActiveScreen, unreadMessagesCount, showToast } = useApp();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'patients', label: 'Patients', icon: UsersRound },
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck },
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
  ];

  return (
    <aside className="app-sidebar">
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
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveScreen(item.id)}
            >
              <span className="nav-item-icon">
                <Icon size={22} strokeWidth={1.75} />
                {item.dot && <span className="nav-item-dot" />}
              </span>
              <span>{item.label}</span>
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
          <img src={DOCTOR_AVATAR} alt={DOCTOR_NAME} className="doctor-avatar-circle" />
          <div className="doctor-profile-info">
            <h4>{DOCTOR_NAME}</h4>
            <p>General Physician</p>
          </div>
        </div>

        <button
          className="logout-btn"
          onClick={() => showToast('Session locked. Doctor signed out.', 'info')}
        >
          <LogOut size={20} strokeWidth={1.75} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
