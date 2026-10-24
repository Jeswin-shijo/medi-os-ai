import React from 'react';
import { useApp } from '../../context/appContextCore';
import { Search, Bell, CircleHelp, ChevronDown, Menu } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { RollingText } from '../common/RollingText';

interface HeaderProps {
  /** Opens the sidebar drawer; the button only shows on phones. */
  onOpenNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNav }) => {
  const { setIsCommandPaletteOpen, setActiveScreen, user, openAlertCount } = useApp();
  const name = user?.name ?? '';
  const role = user?.specialty || user?.role || '';

  return (
    <header className="app-header">
      <button className="header-icon-btn header-menu-btn" aria-label="Open menu" onClick={onOpenNav}>
        <Menu size={22} strokeWidth={1.75} />
      </button>

      {/* Global Search Bar */}
      <div
        className="global-search-container"
        onClick={() => setIsCommandPaletteOpen(true)}
      >
        <Search size={18} strokeWidth={2} className="search-icon-left" />
        <input
          type="text"
          readOnly
          className="global-search-input"
          placeholder="Search patients by name, UHID, phone..."
          onClick={() => setIsCommandPaletteOpen(true)}
        />
        <span className="search-shortcut-badge">⌘ K</span>
      </div>
      <button className="header-icon-btn header-search-btn" aria-label="Search patients" onClick={() => setIsCommandPaletteOpen(true)}>
        <Search size={21} strokeWidth={1.9} />
      </button>

      {/* Header Right Actions */}
      <div className="header-right-actions">
        <button
          className="header-icon-btn"
          aria-label={openAlertCount > 0 ? `Notifications & alerts, ${openAlertCount} open` : 'Notifications & alerts'}
          onClick={() => setActiveScreen('tasks-alerts')}
        >
          <Bell size={22} strokeWidth={1.75} />
          {openAlertCount > 0 && <RollingText className="header-bell-badge" value={openAlertCount} />}
        </button>

        <span className="header-divider" />

        <button
          className="header-icon-btn"
          aria-label="Hospital knowledge & guidelines"
          onClick={() => setActiveScreen('hospital-knowledge')}
        >
          <CircleHelp size={22} strokeWidth={1.75} />
        </button>

        <span className="header-divider" />

        <button
          className="header-doctor-pill"
          aria-label={`${name}, profile & settings`}
          data-tip="Profile & settings"
          onClick={() => setActiveScreen('settings')}
        >
          <Avatar name={name} src={user?.avatar || undefined} size={38} />
          <span className="header-doctor-text">
            <span className="header-doctor-name">{name}</span>
            <span className="header-doctor-role">{role}</span>
          </span>
          <ChevronDown size={18} className="header-doctor-chevron" />
        </button>
      </div>
    </header>
  );
};
