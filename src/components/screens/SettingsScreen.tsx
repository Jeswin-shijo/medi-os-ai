import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { settingsService } from '../../services';
import { SettingsState, initialSettings } from '../../mock/settingsData';
import {
  User,
  Building2,
  Users,
  Layers,
  Stethoscope,
  Sparkles,
  Share2,
  Bell,
  Shield,
  Database,
  Palette,
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
  Smartphone,
  Mail,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Clock,
  Eye,
  Check
} from 'lucide-react';

type SettingsTab =
  | 'general'
  | 'hospital'
  | 'users'
  | 'departments'
  | 'clinical'
  | 'ai'
  | 'integrations'
  | 'notifications'
  | 'security'
  | 'backup'
  | 'appearance';

export const SettingsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<SettingsState>(initialSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await settingsService.getSettings();
        setSettings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.saveSettings(settings);
      setSavedSuccess(true);
      showToast('Settings saved successfully', 'success');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof SettingsState['profile'], value: string) => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  };

  const updateHospital = (field: keyof SettingsState['hospital'], value: string) => {
    setSettings(prev => ({
      ...prev,
      hospital: { ...prev.hospital, [field]: value }
    }));
  };

  const updateAi = (field: keyof SettingsState['ai'], value: any) => {
    setSettings(prev => ({
      ...prev,
      ai: { ...prev.ai, [field]: value }
    }));
  };

  const updateNotifications = (field: keyof SettingsState['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value }
    }));
  };

  const updateSecurity = (field: keyof SettingsState['security'], value: any) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, [field]: value }
    }));
  };

  const updatePreferences = (field: keyof SettingsState['preferences'], value: any) => {
    setSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value }
    }));
  };

  const tabs: { id: SettingsTab; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'general', label: 'General Profile', icon: User },
    { id: 'hospital', label: 'Hospital Info', icon: Building2 },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'departments', label: 'Departments', icon: Layers },
    { id: 'clinical', label: 'Clinical Settings', icon: Stethoscope },
    { id: 'ai', label: 'AI Assistant (GPT-6)', icon: Sparkles },
    { id: 'integrations', label: 'Integrations', icon: Share2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'backup', label: 'Backup & Data', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <RefreshCw className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>System Settings</h1>
            <span className="badge-pill badge-blue" style={{ fontSize: '11px' }}>
              Hospital v4.2.1 • MediOS AI
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Configure clinical preferences, hospital branding, GPT-6 Astro parameters, security & integrations
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {savedSuccess && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#16a34a', fontWeight: '500' }}>
              <CheckCircle2 size={16} /> Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '13px' }}
          >
            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Main Settings Grid: Sub-navigation sidebar + Settings Content Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Settings Navigation Menu */}
        <div className="card" style={{ padding: '12px' }}>
          <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Configuration Categories
            </span>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: isActive ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: isActive ? '#eff6ff' : 'transparent',
                    color: isActive ? 'var(--blue-primary)' : 'var(--text-secondary)'
                  }}
                >
                  <Icon size={17} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* TAB 1: GENERAL PROFILE */}
          {activeTab === 'general' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Doctor Profile & Credentials</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Manage personal clinical details shown on digital prescriptions, notes, and patient summaries
                </p>
              </div>

              {/* Avatar Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--blue-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700' }}>
                  DS
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{settings.profile.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {settings.profile.designation} • {settings.profile.credentials}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{settings.profile.regNo}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" style={{ padding: '7px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} /> Change Photo
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Full Doctor Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.profile.name}
                    onChange={e => updateProfile('name', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.profile.designation}
                    onChange={e => updateProfile('designation', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Degrees & Credentials
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.profile.credentials}
                    onChange={e => updateProfile('credentials', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Medical Registration Number
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.profile.regNo}
                    onChange={e => updateProfile('regNo', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Official Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    value={settings.profile.email}
                    onChange={e => updateProfile('email', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    value={settings.profile.phone}
                    onChange={e => updateProfile('phone', e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Primary Specialization
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.profile.specialization}
                    onChange={e => updateProfile('specialization', e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Professional Bio & Clinical Philosophy
                  </label>
                  <textarea
                    rows={3}
                    className="input-field"
                    style={{ resize: 'vertical' }}
                    value={settings.profile.bio}
                    onChange={e => updateProfile('bio', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HOSPITAL INFO */}
          {activeTab === 'hospital' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Hospital & Facility Details</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Official hospital identity printed on letterheads, billing receipts, and discharge summaries
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.hospital.name}
                    onChange={e => updateHospital('name', e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Hospital Address
                  </label>
                  <textarea
                    rows={2}
                    className="input-field"
                    value={settings.hospital.address}
                    onChange={e => updateHospital('address', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Hospital Telephone / Helpdesk
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.hospital.phone}
                    onChange={e => updateHospital('phone', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Official Hospital Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    value={settings.hospital.email}
                    onChange={e => updateHospital('email', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    System Time Zone
                  </label>
                  <select
                    className="input-field"
                    value={settings.hospital.timeZone}
                    onChange={e => updateHospital('timeZone', e.target.value)}
                  >
                    <option value="(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi">(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                    <option value="(GMT+00:00) UTC / London">(GMT+00:00) UTC / London</option>
                    <option value="(GMT-05:00) Eastern Time (US & Canada)">(GMT-05:00) Eastern Time (US & Canada)</option>
                    <option value="(GMT+04:00) Dubai, Abu Dhabi">(GMT+04:00) Dubai, Abu Dhabi</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Date Format
                  </label>
                  <select
                    className="input-field"
                    value={settings.hospital.dateFormat}
                    onChange={e => updateHospital('dateFormat', e.target.value)}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 26/09/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/26/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Time Format
                  </label>
                  <select
                    className="input-field"
                    value={settings.hospital.timeFormat}
                    onChange={e => updateHospital('timeFormat', e.target.value)}
                  >
                    <option value="12 Hour (AM/PM)">12 Hour (09:30 AM)</option>
                    <option value="24 Hour (Military)">24 Hour (09:30)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Accreditation Status
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    readOnly
                    value="NABH Accredited • Level 3 Trauma Care"
                    style={{ backgroundColor: '#f8fafc', color: 'var(--text-secondary)' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USERS & ROLES */}
          {activeTab === 'users' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>User Roles & Access Permissions</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Manage hospital clinical staff, role-based access control (RBAC), and security clearances
                  </p>
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}>
                  <Plus size={15} /> Add Staff Member
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Access Level</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Dr. Shajin', email: 'dr.shajin@hospital.com', role: 'Chief Physician', dept: 'General Medicine', access: 'Full Doctor / EMR Admin', status: 'Active' },
                      { name: 'Dr. Ravi Kumar', email: 'dr.ravi@hospital.com', role: 'Radiologist', dept: 'Radiology & Imaging', access: 'Imaging / Diagnostics', status: 'Active' },
                      { name: 'Sister Preethi', email: 'preethi@hospital.com', role: 'Head Nurse', dept: 'OPD Ward', access: 'Vitals & Triage', status: 'Active' },
                      { name: 'Mr. Saravanan', email: 'saravanan@hospital.com', role: 'Pharmacist', dept: 'Central Pharmacy', access: 'Dispense & Inventory', status: 'Active' },
                      { name: 'Mrs. Jayanthi', email: 'jayanthi@hospital.com', role: 'Billing Exec', dept: 'Accounts & Billing', access: 'Invoicing & Claims', status: 'Active' },
                      { name: 'Mr. Vignesh', email: 'vignesh@hospital.com', role: 'Lab Tech', dept: 'Pathology Lab', access: 'LIS Entry & Reports', status: 'Active' }
                    ].map((user, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</div>
                        </td>
                        <td><span className="badge-pill badge-blue">{user.role}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{user.dept}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{user.access}</td>
                        <td><span className="badge-pill badge-green">{user.status}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', marginRight: '6px' }}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DEPARTMENTS */}
          {activeTab === 'departments' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Hospital Clinical Departments</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Active OPD units, IPD wards, doctor rosters, and service specialties
                  </p>
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}>
                  <Plus size={15} /> Add Department
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {[
                  { name: 'General Medicine', head: 'Dr. Shajin', staff: '8 Doctors', activePatients: 42, color: 'blue' },
                  { name: 'Cardiology', head: 'Dr. Venkat Raman', staff: '4 Doctors', activePatients: 28, color: 'red' },
                  { name: 'Radiology & Imaging', head: 'Dr. Ravi Kumar', staff: '3 Specialists', activePatients: 19, color: 'purple' },
                  { name: 'Pathology & Lab', head: 'Dr. Meena Swaminathan', staff: '6 Technicians', activePatients: 64, color: 'emerald' },
                  { name: 'Pediatrics', head: 'Dr. Anita Thomas', staff: '5 Doctors', activePatients: 21, color: 'amber' },
                  { name: 'Orthopedics', head: 'Dr. K. Chandran', staff: '4 Surgeons', activePatients: 15, color: 'indigo' }
                ].map((dept, i) => (
                  <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{dept.name}</span>
                      <span className="badge-pill badge-green" style={{ fontSize: '10px' }}>Active</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Head: <strong>{dept.head}</strong></div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Staff: {dept.staff}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Today's Patients: <strong>{dept.activePatients}</strong></span>
                      <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>Configure</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: CLINICAL SETTINGS */}
          {activeTab === 'clinical' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Clinical Protocols & EMR Rules</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Define default consultation templates, mandatory SOAP fields, and vitals panic thresholds
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Vitals Panic Thresholds
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Systolic Blood Pressure High:</span>
                      <input type="text" className="input-field" style={{ width: '90px' }} defaultValue="> 160 mmHg" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Diastolic Blood Pressure High:</span>
                      <input type="text" className="input-field" style={{ width: '90px' }} defaultValue="> 100 mmHg" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Pulse Rate Tachycardia:</span>
                      <input type="text" className="input-field" style={{ width: '90px' }} defaultValue="> 100 bpm" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>SpO2 Hypoxia Warning:</span>
                      <input type="text" className="input-field" style={{ width: '90px' }} defaultValue="< 94 %" />
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Prescription Defaults
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Default Duration:</span>
                      <select className="input-field" style={{ width: '130px' }} defaultValue="5 days">
                        <option value="3 days">3 Days</option>
                        <option value="5 days">5 Days</option>
                        <option value="7 days">7 Days</option>
                        <option value="30 days">30 Days</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Generic Name Requirement:</span>
                      <span className="badge-pill badge-green">Mandatory</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Max Refill Cycles:</span>
                      <input type="number" className="input-field" style={{ width: '80px' }} defaultValue={3} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Drug Allergy Cross-Check:</span>
                      <span className="badge-pill badge-blue">Strict Real-time</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AI ASSISTANT (GPT-6 ASTRO) */}
          {activeTab === 'ai' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={20} className="text-blue-500" />
                    <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      MediOS AI Intelligence (Powered by GPT-6 Astro)
                    </h2>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Fine-tune AI clinical reasoning, ambient voice-to-notes parsing, and diagnostic assistance
                  </p>
                </div>
                <span className="badge-pill badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                  Model Online • 99.98% Latency 42ms
                </span>
              </div>

              {/* AI Model Selection */}
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>Active Medical LLM Engine</span>
                  <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '600' }}>HIPAA & BAA Verified</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#14532d', marginBottom: '4px' }}>
                      Model Architecture
                    </label>
                    <select
                      className="input-field"
                      style={{ backgroundColor: 'white' }}
                      value={settings.ai.model}
                      onChange={e => updateAi('model', e.target.value)}
                    >
                      <option value="GPT-6 Astro (Latest)">GPT-6 Astro (Clinical Specialization - Recommended)</option>
                      <option value="GPT-5.5 Clinical Pro">GPT-5.5 Clinical Pro (High Speed)</option>
                      <option value="Med-PaLM 2 Clinical">Med-PaLM 2 Clinical Engine</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#14532d', marginBottom: '4px' }}>
                      Clinical Response Tone
                    </label>
                    <select
                      className="input-field"
                      style={{ backgroundColor: 'white' }}
                      value={settings.ai.responseTone}
                      onChange={e => updateAi('responseTone', e.target.value)}
                    >
                      <option value="Professional & Concise">Professional & Concise (Bullet summaries)</option>
                      <option value="Comprehensive Academic">Comprehensive Academic (With ESC/ADA citations)</option>
                      <option value="Patient-Friendly Language">Patient-Friendly Language (For counselling)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* AI Feature Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  {
                    key: 'useClinicalSuggestions',
                    title: 'Real-time Clinical Suggestions & Differential Diagnoses',
                    desc: 'Evaluates patient history, symptoms, and vitals to propose differential diagnoses and recommended lab tests.',
                    checked: settings.ai.useClinicalSuggestions
                  },
                  {
                    key: 'autoGenerateNotes',
                    title: 'Auto-Generate SOAP Clinical Notes',
                    desc: 'Automatically drafts Subjective, Objective, Assessment, and Plan notes upon doctor speech or typing input.',
                    checked: settings.ai.autoGenerateNotes
                  },
                  {
                    key: 'voiceToNotes',
                    title: 'Ambient Doctor-Patient Voice-to-Notes',
                    desc: 'Listens to ambient clinical conversations and separates doctor and patient dialogue into structured EHR entries.',
                    checked: settings.ai.voiceToNotes
                  },
                  {
                    key: 'drugInteractionAlerts',
                    title: 'Drug-Drug & Allergy Contraindication Guardrails',
                    desc: 'Real-time warning popups when a prescribed drug conflicts with existing medications or documented allergies.',
                    checked: settings.ai.drugInteractionAlerts
                  },
                  {
                    key: 'followUpSuggestions',
                    title: 'Smart Follow-up Interval Recommendations',
                    desc: 'Predicts ideal follow-up visit dates based on chronic conditions (e.g. 3-month HbA1c review for Type 2 DM).',
                    checked: settings.ai.followUpSuggestions
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: '24px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.desc}</div>
                    </div>
                    <label className="switch-label">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={e => updateAi(item.key as any, e.target.checked)}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>External Healthcare Integrations</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Connect hospital subsystems, PACS/DICOM radiology servers, LIMS analyzers, and messaging gateways
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {[
                  { title: 'PACS / DICOM Imaging Server', status: 'Connected', sub: 'dcm4chee Server v5.24 • IP: 192.168.1.120', active: true },
                  { title: 'LIMS Lab Analyzer Interface', status: 'Connected', sub: 'Roche Cobas 6000 & Sysmex XN-1000 HL7 Stream', active: true },
                  { title: 'WhatsApp Business API', status: 'Connected', sub: 'Automated prescription & reminder delivery', active: true },
                  { title: 'ABDM / ABHA Digital Mission', status: 'Connected', sub: 'National Health ID & M1/M2/M3 Milestones', active: true },
                  { title: 'SMS Gateway (Twilio / Gupshup)', status: 'Connected', sub: 'High-priority OTP & appointment alerts', active: true },
                  { title: 'Razorpay / Insurance TPA Portal', status: 'Configured', sub: 'Instant OPD payments and cashless TPA sync', active: true }
                ].map((integ, i) => (
                  <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>{integ.title}</span>
                      <span className="badge-pill badge-green" style={{ fontSize: '10px' }}>{integ.status}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{integ.sub}</p>
                    <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: '11px', width: '100%' }}>
                      Manage Connection
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Notification Preferences</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Control when alerts are triggered across doctor workstation, mobile app, and SMS
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  {
                    key: 'appointmentReminders',
                    title: 'Appointment Reminders',
                    desc: 'Notify when patients check in at reception or when consultation slot is near.',
                    checked: settings.notifications.appointmentReminders
                  },
                  {
                    key: 'followUpAlerts',
                    title: 'Follow-Up Due Alerts',
                    desc: 'Alert for patients who missed scheduled review visits or require routine follow-ups.',
                    checked: settings.notifications.followUpAlerts
                  },
                  {
                    key: 'labResultAlerts',
                    title: 'Lab & Diagnostic Result Ready Alerts',
                    desc: 'Immediate prompt when pathology lab or radiology releases new test findings.',
                    checked: settings.notifications.labResultAlerts
                  },
                  {
                    key: 'criticalAlerts',
                    title: 'Critical Panic Value Popups',
                    desc: 'High-priority flashing notification for critical vitals, severe ECG findings, or drug warnings.',
                    checked: settings.notifications.criticalAlerts
                  },
                  {
                    key: 'smsNotifications',
                    title: 'Direct SMS Messages to Doctor',
                    desc: 'Send SMS on emergency duty alerts or critical surgical ward consultations.',
                    checked: settings.notifications.smsNotifications
                  },
                  {
                    key: 'pushNotifications',
                    title: 'Browser & Mobile Push Notifications',
                    desc: 'Push notifications for doctor desktop when app is running in background.',
                    checked: settings.notifications.pushNotifications
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: '24px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.desc}</div>
                    </div>
                    <label className="switch-label">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={e => updateNotifications(item.key as any, e.target.checked)}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: SECURITY & AUTH */}
          {activeTab === 'security' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Security & Authentication</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Protect patient electronic health records (EHR) with 2FA, session timeouts, and audit logging
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Two-Factor Authentication (2FA)</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Enforce Google Authenticator / TOTP verification on doctor login
                    </div>
                  </div>
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      checked={settings.security.twoFactorAuth}
                      onChange={e => updateSecurity('twoFactorAuth', e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Automatic Inactivity Session Timeout
                    </label>
                    <select
                      className="input-field"
                      value={settings.security.sessionTimeout}
                      onChange={e => updateSecurity('sessionTimeout', e.target.value)}
                    >
                      <option value="15 minutes">15 minutes</option>
                      <option value="30 minutes">30 minutes (Standard)</option>
                      <option value="1 hour">1 hour</option>
                      <option value="4 hours">4 hours</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Password Policy
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      readOnly
                      value="Strong (Min 10 chars, symbols & numbers)"
                      style={{ backgroundColor: '#f8fafc', color: 'var(--text-secondary)' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Recent Doctor Login Audit History
                  </h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Device / Browser</th>
                        <th>IP Address</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { time: '26 Sep 2026, 08:30 AM', dev: 'Chrome 128 (macOS Sonoma)', ip: '192.168.1.45 (Hospital LAN)', status: 'Success' },
                        { time: '25 Sep 2026, 08:45 AM', dev: 'Chrome 128 (macOS Sonoma)', ip: '192.168.1.45 (Hospital LAN)', status: 'Success' },
                        { time: '24 Sep 2026, 08:15 AM', dev: 'Safari Mobile (iOS 19)', ip: '117.247.12.8 (Mobile Data)', status: 'Success' }
                      ].map((log, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: '500' }}>{log.time}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{log.dev}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{log.ip}</td>
                          <td><span className="badge-pill badge-green">{log.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: BACKUP & DATA */}
          {activeTab === 'backup' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Data Backup & Cloud Storage</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Automated encrypted backups, historical patient archives, and disaster recovery status
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Cloud Backup Status</span>
                    <span className="badge-pill badge-green">Healthy • Daily Sync</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Last full snapshot: <strong>26 Sep 2026, 03:00 AM</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Next scheduled run: <strong>27 Sep 2026, 03:00 AM</strong>
                  </div>
                  <button className="btn-primary" style={{ fontSize: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={14} /> Trigger Manual Backup Now
                  </button>
                </div>

                <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Hospital Storage Quota</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--blue-primary)' }}>14.2 GB / 50 GB (28%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ width: '28%', height: '100%', backgroundColor: 'var(--blue-primary)', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    High-res DICOM scans: 9.8 GB • Lab reports: 2.1 GB • Clinical notes: 1.4 GB
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 16px' }}>
                  <Download size={14} /> Export Patient Registry (CSV)
                </button>
                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 16px' }}>
                  <Download size={14} /> Export Full Hospital Audit Log
                </button>
              </div>
            </div>
          )}

          {/* TAB 11: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Display & Interface Preferences</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Personalize UI density, default starting views, and accessibility options
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Default Starting Module
                  </label>
                  <select
                    className="input-field"
                    value={settings.preferences.defaultDashboard}
                    onChange={e => updatePreferences('defaultDashboard', e.target.value)}
                  >
                    <option value="Doctor Dashboard">Doctor Dashboard</option>
                    <option value="Appointments">Today's Appointments</option>
                    <option value="Consultation">Active Consultation Room</option>
                    <option value="Patients">Patient Registry</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Default Records Per Page
                  </label>
                  <select
                    className="input-field"
                    value={settings.preferences.itemsPerPage}
                    onChange={e => updatePreferences('itemsPerPage', parseInt(e.target.value))}
                  >
                    <option value={10}>10 items</option>
                    <option value={20}>20 items (Standard)</option>
                    <option value={50}>50 items</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)', gridColumn: 'span 2' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Enable Audio Chimes for Critical Alerts</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Plays an audible alert chime when a panic lab value or stat consult is assigned
                    </div>
                  </div>
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      checked={settings.preferences.enableSoundAlerts}
                      onChange={e => updatePreferences('enableSoundAlerts', e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
