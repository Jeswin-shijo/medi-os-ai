import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScreenId } from '../../types';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  UserCheck,
  FileText,
  FlaskConical,
  ImageIcon,
  FileSignature,
  Pill,
  Receipt,
  Repeat,
  BookOpen,
  FileCheck2,
  Mic,
  BellRing,
  MessageSquare,
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';

interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const { activeScreen, setActiveScreen, unreadMessagesCount, showToast } = useApp();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: CalendarDays },
    { id: 'consultation', label: 'Consultation', icon: UserCheck },
    { id: 'emr', label: 'EMR / Clinical Notes', icon: FileText },
    { id: 'lab-reports', label: 'Lab Reports', icon: FlaskConical },
    { id: 'imaging', label: 'Imaging (RIS)', icon: ImageIcon },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileSignature },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'follow-ups', label: 'Follow-ups', icon: Repeat },
    { id: 'hospital-knowledge', label: 'Hospital Knowledge', icon: BookOpen },
    { id: 'clinical-guidelines', label: 'Clinical Guidelines', icon: FileCheck2 },
    { id: 'voice-to-notes', label: 'Voice to Notes', icon: Mic },
    { id: 'tasks-alerts', label: 'Tasks & Alerts', icon: BellRing },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-icon-box">
          <Sparkles size={22} />
        </div>
        <div className="brand-text-box">
          <h2>MediOS AI</h2>
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
              <Icon size={18} className="nav-item-icon" />
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
          <img
            src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
            alt="Dr. Shajin"
            className="doctor-avatar-circle"
          />
          <div className="doctor-profile-info">
            <h4>Dr. Shajin</h4>
            <p>General Physician</p>
          </div>
        </div>

        <button
          className="logout-btn"
          onClick={() => showToast('Session locked. Doctor signed out.', 'info')}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
