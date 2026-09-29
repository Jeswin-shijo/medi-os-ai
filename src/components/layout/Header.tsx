import React from 'react';
import { useApp } from '../../context/appContextCore';
import { Search, Bell, CircleHelp, ChevronDown } from 'lucide-react';
import { DOCTOR_AVATAR, DOCTOR_NAME } from '../../mock/avatars';

export const Header: React.FC = () => {
  const { setIsCommandPaletteOpen, setActiveScreen } = useApp();

  return (
    <header className="app-header">
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

      {/* Header Right Actions */}
      <div className="header-right-actions">
        <button
          className="header-icon-btn"
          title="Notifications & Alerts"
          onClick={() => setActiveScreen('tasks-alerts')}
        >
          <Bell size={22} strokeWidth={1.75} />
          <span className="header-bell-badge">3</span>
        </button>

        <span className="header-divider" />

        <button
          className="header-icon-btn"
          title="Hospital Knowledge & Guidelines"
          onClick={() => setActiveScreen('hospital-knowledge')}
        >
          <CircleHelp size={22} strokeWidth={1.75} />
        </button>

        <span className="header-divider" />

        <div
          className="header-doctor-pill"
          onClick={() => setActiveScreen('settings')}
        >
          <img src={DOCTOR_AVATAR} alt={DOCTOR_NAME} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="header-doctor-name">{DOCTOR_NAME}</span>
            <span className="header-doctor-role">General Physician</span>
          </div>
          <ChevronDown size={18} className="header-doctor-chevron" />
        </div>
      </div>
    </header>
  );
};
