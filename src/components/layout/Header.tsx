import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Bell, HelpCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const { setIsCommandPaletteOpen, setActiveScreen } = useApp();

  return (
    <header className="app-header">
      {/* Global Search Bar */}
      <div
        className="global-search-container"
        onClick={() => setIsCommandPaletteOpen(true)}
      >
        <Search size={16} className="search-icon-left" />
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
        {/* Notification Bell */}
        <button
          className="header-icon-btn"
          title="Notifications & Alerts"
          onClick={() => setActiveScreen('tasks-alerts')}
        >
          <Bell size={18} />
          <span className="header-bell-badge">3</span>
        </button>

        {/* Help & Documentation */}
        <button
          className="header-icon-btn"
          title="Hospital Knowledge & Guidelines"
          onClick={() => setActiveScreen('hospital-knowledge')}
        >
          <HelpCircle size={18} />
        </button>

        {/* Doctor Identity Pill */}
        <div
          className="header-doctor-pill"
          onClick={() => setActiveScreen('settings')}
          style={{ cursor: 'pointer' }}
        >
          <img
            src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
            alt="Dr. Shajin"
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              Dr. Shajin
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              General Physician
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
