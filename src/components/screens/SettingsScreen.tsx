import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/appContextCore';
import { settingsService } from '../../services';
import { SettingsState, initialSettings } from '../../mock/settingsData';
import { DOCTOR_AVATAR } from '../../mock/avatars';
import { ScreenHeader } from '../common/ScreenHeader';
import { Avatar } from '../common/Avatar';
import {
  Settings as SettingsIcon,
  Building2,
  Users,
  ClipboardPlus,
  ClipboardMinus,
  Diamond,
  BrainCircuit,
  Share2,
  Bell,
  BellRing,
  BellDot,
  ShieldCheck,
  Send,
  Save,
  CheckCircle2,
  RefreshCw,
  Plus,
  Download,
  Camera,
  Trash2,
  Hospital,
  ImageOff,
  UserRound,
  Bot,
  Sparkles,
  ChevronDown,
  MessageSquareDashed,
  RefreshCcw,
  Clock3,
  CircleGauge,
  Recycle,
  Mail,
  MessageSquareText,
  LockKeyhole,
  Timer,
  Globe,
  UserRoundSearch,
  Volume2,
  Lightbulb,
  Shrink,
  SlidersHorizontal,
  LucideIcon
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

type BoolKeys<T> = { [K in keyof T]: T[K] extends boolean ? K : never }[keyof T];

const TABS: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'hospital', label: 'Hospital', icon: Building2 },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'departments', label: 'Departments', icon: ClipboardPlus },
  { id: 'clinical', label: 'Clinical Settings', icon: Diamond },
  { id: 'ai', label: 'AI Assistant', icon: BrainCircuit },
  { id: 'integrations', label: 'Integrations', icon: Share2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'backup', label: 'Backup & Data', icon: ClipboardMinus },
  { id: 'appearance', label: 'Appearance', icon: Send }
];

// ---------------------------------------------------------------------------
// Small building blocks (compact form controls as in the design)
// ---------------------------------------------------------------------------

const INPUT: React.CSSProperties = { height: 32, fontSize: 12.5, padding: '0 11px' };
const SELECT_BASE: React.CSSProperties = { ...INPUT, appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer' };

const SectionTitle: React.FC<{ icon: LucideIcon; color: string; title: string; fill?: boolean; subtitle?: string; right?: React.ReactNode }> = ({ icon: Icon, color, title, fill, subtitle, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 28 }}>
    <Icon size={24} color={color} strokeWidth={2.1} fill={fill ? color : 'none'} style={{ flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '22px' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 1 }}>{subtitle}</p>}
    </div>
    {right}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ label, children, style }) => (
  <div style={style}>
    <label className="form-label" style={{ fontSize: 12.5, marginBottom: 4, lineHeight: '15px' }}>{label}</label>
    {children}
  </div>
);

interface SelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: (string | { value: string | number; label: string })[];
  leading?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Native select with the design's chevron (and an optional leading icon). */
const Select: React.FC<SelectProps> = ({ value, onChange, options, leading, style }) => (
  <div style={{ position: 'relative' }}>
    {leading && (
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>{leading}</span>
    )}
    <select
      className="form-select"
      style={{ ...SELECT_BASE, paddingLeft: leading ? 38 : 11, ...style }}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(o => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        return <option key={opt.value} value={opt.value}>{opt.label}</option>;
      })}
    </select>
    <ChevronDown size={15} color="var(--text-primary)" strokeWidth={2.2} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <label className="switch-label" aria-label={label}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    <span className="switch-slider"></span>
  </label>
);

const ToggleRow: React.FC<{ icon: LucideIcon; label: string; checked: boolean; onChange: (checked: boolean) => void; height?: number; gap?: number }> = ({ icon: Icon, label, checked, onChange, height = 28, gap = 12 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap, height }}>
    <Icon size={16} color="var(--text-primary)" strokeWidth={1.9} style={{ flexShrink: 0 }} />
    <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-primary)' }}>{label}</span>
    <Toggle checked={checked} onChange={onChange} label={label} />
  </div>
);

/** Bordered row used by the detailed (non-General) tabs. */
const DetailToggle: React.FC<{ title: string; desc: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ title, desc, checked, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: '12px 16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>{desc}</div>
    </div>
    <Toggle checked={checked} onChange={onChange} label={title} />
  </div>
);

const BOX: React.CSSProperties = { padding: 16, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)' };
const BOX_TITLE: React.CSSProperties = { fontSize: 'var(--fs-h4)', fontWeight: 700, color: 'var(--text-primary)' };

export const SettingsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<SettingsState>(initialSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [photoUrl, setPhotoUrl] = useState<string>(DOCTOR_AVATAR);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [rxDuration, setRxDuration] = useState('5 days');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
    setSettings(prev => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
  };

  const updateHospital = (field: keyof SettingsState['hospital'], value: string) => {
    setSettings(prev => ({ ...prev, hospital: { ...prev.hospital, [field]: value } }));
  };

  const updateAi = <F extends keyof SettingsState['ai']>(field: F, value: SettingsState['ai'][F]) => {
    setSettings(prev => ({ ...prev, ai: { ...prev.ai, [field]: value } }));
  };

  const updateNotifications = (field: keyof SettingsState['notifications'], value: boolean) => {
    setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [field]: value } }));
  };

  const updateSecurity = <F extends keyof SettingsState['security']>(field: F, value: SettingsState['security'][F]) => {
    setSettings(prev => ({ ...prev, security: { ...prev.security, [field]: value } }));
  };

  const updatePreferences = <F extends keyof SettingsState['preferences']>(field: F, value: SettingsState['preferences'][F]) => {
    setSettings(prev => ({ ...prev, preferences: { ...prev.preferences, [field]: value } }));
  };

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>, apply: (url: string) => void, message: string) => {
    const file = e.target.files?.[0];
    if (file) {
      apply(URL.createObjectURL(file));
      showToast(message, 'success');
    }
    e.target.value = '';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <RefreshCw className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const saveButton = (
    <button onClick={handleSave} disabled={saving} className="btn-primary">
      {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
      <span>Save Changes</span>
    </button>
  );

  const savedBadge = savedSuccess && (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--green-dark)', fontWeight: 500 }}>
      <CheckCircle2 size={16} /> Saved!
    </span>
  );

  // ---- General tab row definitions ----
  const aiToggles: { key: BoolKeys<SettingsState['ai']>; label: string; icon: LucideIcon }[] = [
    { key: 'useClinicalSuggestions', label: 'Use AI for Clinical Suggestions', icon: MessageSquareDashed },
    { key: 'autoGenerateNotes', label: 'Auto-generate Clinical Notes', icon: RefreshCcw },
    { key: 'voiceToNotes', label: 'Voice to Notes (Auto Transcription)', icon: Clock3 },
    { key: 'drugInteractionAlerts', label: 'AI Drug Interaction Alerts', icon: CircleGauge },
    { key: 'followUpSuggestions', label: 'AI Follow-up Suggestions', icon: Recycle }
  ];

  const notificationToggles: { key: keyof SettingsState['notifications']; label: string; icon: LucideIcon }[] = [
    { key: 'appointmentReminders', label: 'Appointment Reminders', icon: BellRing },
    { key: 'followUpAlerts', label: 'Follow-up Alerts', icon: RefreshCcw },
    { key: 'labResultAlerts', label: 'Lab Result Alerts', icon: Bell },
    { key: 'criticalAlerts', label: 'Critical Alerts (High Priority)', icon: BellDot },
    { key: 'systemNotifications', label: 'System Notifications', icon: Clock3 },
    { key: 'emailNotifications', label: 'Email Notifications', icon: Mail },
    { key: 'smsNotifications', label: 'SMS Notifications', icon: MessageSquareText },
    { key: 'pushNotifications', label: 'Push Notifications (Browser)', icon: CircleGauge }
  ];

  const securityToggles: { key: BoolKeys<SettingsState['security']>; label: string; icon: LucideIcon }[] = [
    { key: 'loginAlerts', label: 'Login Alerts (New Device)', icon: BellRing },
    { key: 'ipRestrictions', label: 'IP Restrictions', icon: Globe },
    { key: 'auditLogAccess', label: 'Audit Log Access', icon: UserRoundSearch }
  ];

  const preferenceToggles: { key: BoolKeys<SettingsState['preferences']>; label: string; icon: LucideIcon }[] = [
    { key: 'enableSoundAlerts', label: 'Enable Sound Alerts', icon: Volume2 },
    { key: 'showTipsAndGuides', label: 'Show Tips & Guides', icon: Lightbulb },
    { key: 'compactMode', label: 'Compact Mode', icon: Shrink }
  ];

  const logoSrc = logoRemoved ? null : logoUrl;

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="Settings"
        subtitle="Manage your account, hospital settings, AI preferences and system configurations"
        actions={activeTab === 'general' ? (savedBadge || undefined) : <>{savedBadge}{saveButton}</>}
      />

      {/* Settings tabs */}
      <div className="medios-card" style={{ padding: 0, overflow: 'hidden', marginTop: -3 }}>
        <div className="page-tabs" style={{ gap: 2 }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 56,
                  padding: '0 13px',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  fontSize: 11.5,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--blue-text)' : 'var(--text-primary)',
                  backgroundColor: isActive ? 'var(--bg-tab)' : 'transparent',
                  boxShadow: isActive ? 'inset 0 -3px 0 var(--blue-text)' : undefined
                }}
              >
                <Icon size={17} strokeWidth={1.9} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================== GENERAL (overview, as in the design) ===================== */}
      {activeTab === 'general' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 428fr) minmax(0, 441fr) minmax(0, 389fr)', gap: 14, marginTop: 2 }}>
            {/* Profile Settings */}
            <div className="medios-card" style={{ padding: '10px 16px 14px' }}>
              <SectionTitle icon={UserRound} color="var(--blue-text)" fill title="Profile Settings" />

              <div style={{ display: 'flex', gap: 4, marginTop: 17, marginBottom: 11 }}>
                <Avatar name="Dr. Shajin" src={photoUrl} size={88} />
                <div style={{ flex: 1, minWidth: 0, paddingTop: 1, marginLeft: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <div style={{ fontSize: 19.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: '26px' }}>{settings.profile.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: '18px', marginTop: 1 }}>{settings.profile.designation}</div>
                  <div style={{ fontSize: 12.2, color: 'var(--text-secondary)', lineHeight: '18px' }}>{settings.profile.credentials}</div>
                  <div style={{ fontSize: 12.2, color: 'var(--text-secondary)', lineHeight: '18px' }}>{settings.profile.regNo}</div>
                </div>
                <button
                  className="btn-outline-blue"
                  style={{ height: 30, padding: '0 11px', fontSize: 11.5, fontWeight: 400, gap: 8, alignSelf: 'flex-start', marginTop: 2 }}
                  onClick={() => photoInputRef.current?.click()}
                >
                  <Camera size={14} />
                  Change Photo
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={e => pickImage(e, setPhotoUrl, 'Profile photo updated')} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <Field label="Full Name">
                  <input type="text" className="input-field" style={INPUT} value={settings.profile.name} onChange={e => updateProfile('name', e.target.value)} />
                </Field>
                <Field label="Email">
                  <input type="email" className="input-field" style={INPUT} value={settings.profile.email} onChange={e => updateProfile('email', e.target.value)} />
                </Field>
                <Field label="Phone Number">
                  <input type="tel" className="input-field" style={INPUT} value={settings.profile.phone} onChange={e => updateProfile('phone', e.target.value)} />
                </Field>
                <Field label="Specialization">
                  <Select
                    value={settings.profile.specialization}
                    onChange={v => updateProfile('specialization', v)}
                    options={['General Physician', 'Internal Medicine', 'Cardiology', 'Diabetology', 'Pediatrics']}
                  />
                </Field>
                <Field label="About / Bio">
                  <div style={{ position: 'relative' }}>
                    <textarea
                      className="input-field"
                      style={{ display: 'block', height: 70, minHeight: 70, fontSize: 12.5, padding: '8px 11px', resize: 'none' }}
                      value={settings.profile.bio}
                      onChange={e => updateProfile('bio', e.target.value)}
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary"
                      style={{ position: 'absolute', right: 0, bottom: 0, width: 156, fontSize: 13.5, fontWeight: 400 }}
                    >
                      {saving && <RefreshCw className="animate-spin" size={14} />}
                      Save Changes
                    </button>
                  </div>
                </Field>
              </div>
            </div>

            {/* Hospital Settings */}
            <div className="medios-card" style={{ padding: '10px 16px 14px' }}>
              <SectionTitle icon={Hospital} color="var(--blue-text)" title="Hospital Settings" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 13 }}>
                <Field label="Hospital Name">
                  <input type="text" className="input-field" style={INPUT} value={settings.hospital.name} onChange={e => updateHospital('name', e.target.value)} />
                </Field>
                <Field label="Hospital Address">
                  <textarea
                    className="input-field"
                    style={{ display: 'block', height: 62, minHeight: 62, fontSize: 12.5, padding: '8px 11px', lineHeight: '17px' }}
                    value={settings.hospital.address}
                    onChange={e => updateHospital('address', e.target.value)}
                  />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Phone">
                    <input type="text" className="input-field" style={INPUT} value={settings.hospital.phone} onChange={e => updateHospital('phone', e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <input type="email" className="input-field" style={INPUT} value={settings.hospital.email} onChange={e => updateHospital('email', e.target.value)} />
                  </Field>
                </div>
                <Field label="Hospital Logo">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 108, height: 77, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', backgroundColor: 'var(--bg-card)' }}>
                      {logoRemoved ? (
                        <ImageOff size={26} color="var(--text-muted)" />
                      ) : logoSrc ? (
                        <img src={logoSrc} alt="Hospital logo" style={{ maxWidth: '84%', maxHeight: '84%', objectFit: 'contain' }} />
                      ) : (
                        <Hospital size={42} color="var(--blue-text)" strokeWidth={1.8} />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        <button
                          className="btn-outline-blue"
                          style={{ height: 30, padding: '0 11px', fontSize: 11.5, fontWeight: 400, gap: 8, backgroundColor: 'var(--blue-light)' }}
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Camera size={14} />
                          Change Logo
                        </button>
                        <button
                          className="btn-danger-soft"
                          style={{ height: 30, padding: '0 14px', fontSize: 11.5, fontWeight: 400, gap: 8, backgroundColor: 'var(--bg-card)', opacity: logoRemoved ? 0.5 : 1 }}
                          disabled={logoRemoved}
                          onClick={() => { setLogoRemoved(true); showToast('Hospital logo removed'); }}
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 7 }}>Recommended size: 512 × 512 px (PNG, JPG)</div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        hidden
                        onChange={e => pickImage(e, url => { setLogoUrl(url); setLogoRemoved(false); }, 'Hospital logo updated')}
                      />
                    </div>
                  </div>
                </Field>
                <Field label="Time Zone" style={{ marginTop: 5 }}>
                  <Select
                    value={settings.hospital.timeZone}
                    onChange={v => updateHospital('timeZone', v)}
                    options={['(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi', '(GMT+00:00) UTC / London', '(GMT-05:00) Eastern Time (US & Canada)', '(GMT+04:00) Dubai, Abu Dhabi']}
                  />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
                  <Field label="Date Format">
                    <Select value={settings.hospital.dateFormat} onChange={v => updateHospital('dateFormat', v)} options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']} />
                  </Field>
                  <Field label="Time Format">
                    <Select value={settings.hospital.timeFormat} onChange={v => updateHospital('timeFormat', v)} options={['12 Hour (AM/PM)', '24 Hour (Military)']} />
                  </Field>
                </div>
              </div>
            </div>

            {/* AI Assistant Settings */}
            <div className="medios-card" style={{ padding: '10px 16px 14px' }}>
              <SectionTitle icon={Bot} color="var(--purple-ai)" title="AI Assistant Settings" />
              <Field label="AI Model" style={{ marginTop: 13 }}>
                <Select
                  value={settings.ai.model}
                  onChange={v => updateAi('model', v)}
                  leading={<Sparkles size={16} color="var(--purple-ai)" fill="var(--purple-ai)" strokeWidth={1.5} />}
                  options={['GPT-6 Astro (Latest)', 'GPT-5.5 Clinical Pro', 'Med-PaLM 2 Clinical']}
                />
              </Field>
              <div style={{ marginTop: 7, paddingLeft: 3 }}>
                {aiToggles.map(t => (
                  <ToggleRow key={t.key} icon={t.icon} label={t.label} height={39.5} gap={14} checked={settings.ai[t.key]} onChange={v => updateAi(t.key, v)} />
                ))}
              </div>
              <Field label="Response Tone" style={{ marginTop: 20 }}>
                <Select
                  value={settings.ai.responseTone}
                  onChange={v => updateAi('responseTone', v)}
                  options={['Professional & Concise', 'Comprehensive Academic', 'Patient-Friendly Language']}
                />
              </Field>
              <Field label="Language" style={{ marginTop: 17 }}>
                <Select
                  value={settings.ai.language}
                  onChange={v => updateAi('language', v)}
                  options={['English (Auto-detect)', 'English (UK)', 'Tamil', 'Hindi', 'Malayalam']}
                />
              </Field>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 428fr) minmax(0, 414fr) minmax(0, 415fr)', gap: 14, marginTop: 2 }}>
            {/* Notification Settings */}
            <div className="medios-card" style={{ padding: '10px 16px 6px 18px' }}>
              <SectionTitle icon={Bell} color="var(--purple-ai)" title="Notification Settings" />
              <div style={{ marginTop: 2 }}>
                {notificationToggles.map(t => (
                  <ToggleRow key={t.key} icon={t.icon} label={t.label} gap={14} checked={settings.notifications[t.key]} onChange={v => updateNotifications(t.key, v)} />
                ))}
              </div>
            </div>

            {/* Security Settings */}
            <div className="medios-card" style={{ padding: '10px 16px 6px 16px' }}>
              <SectionTitle icon={ShieldCheck} color="var(--green-emerald)" title="Security Settings" />
              <div style={{ marginTop: 2 }}>
                <ToggleRow icon={ShieldCheck} label="Two-Factor Authentication (2FA)" gap={20} checked={settings.security.twoFactorAuth} onChange={v => updateSecurity('twoFactorAuth', v)} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, height: 34 }}>
                  <LockKeyhole size={16} color="var(--text-primary)" strokeWidth={1.9} />
                  <span style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>Password</span>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 1, marginBottom: 6 }}>
                  <input type="password" className="input-field" style={{ ...INPUT, flex: 1, letterSpacing: 2 }} value="MediOS@2026" readOnly aria-label="Current password" />
                  <button
                    className="btn-outline-blue"
                    style={{ height: 32, padding: '0 14px', fontSize: 13, fontWeight: 400, backgroundColor: 'var(--blue-light)' }}
                    onClick={() => showToast('Password change dialog opened')}
                  >
                    Change
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, height: 33 }}>
                  <Timer size={16} color="var(--text-primary)" strokeWidth={1.9} />
                  <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-primary)' }}>Session Timeout</span>
                  <select
                    aria-label="Session timeout"
                    value={settings.security.sessionTimeout}
                    onChange={e => updateSecurity('sessionTimeout', e.target.value)}
                    style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', background: 'transparent', fontSize: 11.5, color: 'var(--text-secondary)', textAlign: 'right', cursor: 'pointer', paddingRight: 12, outline: 'none' }}
                  >
                    {['15 minutes', '30 minutes', '1 hour', '4 hours'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                {securityToggles.map(t => (
                  <ToggleRow key={t.key} icon={t.icon} label={t.label} gap={20} height={29.5} checked={settings.security[t.key]} onChange={v => updateSecurity(t.key, v)} />
                ))}
              </div>
            </div>

            {/* System Preferences */}
            <div className="medios-card" style={{ padding: '10px 16px 6px 16px' }}>
              <SectionTitle icon={SlidersHorizontal} color="var(--text-primary)" title="System Preferences" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 20, rowGap: 13, marginTop: 7 }}>
                <Field label="Default Dashboard">
                  <Select value={settings.preferences.defaultDashboard} onChange={v => updatePreferences('defaultDashboard', v)} options={['Doctor Dashboard', 'Appointments', 'Consultation', 'Patients']} />
                </Field>
                <Field label="Items per page">
                  <Select value={settings.preferences.itemsPerPage} onChange={v => updatePreferences('itemsPerPage', parseInt(v, 10))} options={[{ value: 10, label: '10' }, { value: 20, label: '20' }, { value: 50, label: '50' }]} />
                </Field>
                <Field label="Default Patient View">
                  <Select value={settings.preferences.defaultPatientView} onChange={v => updatePreferences('defaultPatientView', v)} options={['Summary View', 'Timeline View', 'Detailed View']} />
                </Field>
                <Field label="Auto Save Interval">
                  <Select value={settings.preferences.autoSaveInterval} onChange={v => updatePreferences('autoSaveInterval', v)} options={['15 seconds', '30 seconds', '1 minute', '5 minutes']} />
                </Field>
              </div>
              <div style={{ marginTop: 11 }}>
                {preferenceToggles.map(t => (
                  <ToggleRow key={t.key} icon={t.icon} label={t.label} gap={18} height={28.5} checked={settings.preferences[t.key]} onChange={v => updatePreferences(t.key, v)} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===================== HOSPITAL ===================== */}
      {activeTab === 'hospital' && (
        <div className="medios-card" style={{ padding: '14px 18px 18px' }}>
          <SectionTitle icon={Hospital} color="var(--blue-text)" title="Hospital & Facility Details" subtitle="Official hospital identity printed on letterheads, billing receipts, and discharge summaries" />
          <div className="divider" style={{ margin: '14px 0 16px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Hospital Name" style={{ gridColumn: 'span 2' }}>
              <input type="text" className="input-field" value={settings.hospital.name} onChange={e => updateHospital('name', e.target.value)} />
            </Field>
            <Field label="Hospital Address" style={{ gridColumn: 'span 2' }}>
              <textarea rows={2} className="input-field" value={settings.hospital.address} onChange={e => updateHospital('address', e.target.value)} />
            </Field>
            <Field label="Hospital Telephone / Helpdesk">
              <input type="text" className="input-field" value={settings.hospital.phone} onChange={e => updateHospital('phone', e.target.value)} />
            </Field>
            <Field label="Official Hospital Email">
              <input type="email" className="input-field" value={settings.hospital.email} onChange={e => updateHospital('email', e.target.value)} />
            </Field>
            <Field label="System Time Zone">
              <Select
                style={{ height: 36, fontSize: 13 }}
                value={settings.hospital.timeZone}
                onChange={v => updateHospital('timeZone', v)}
                options={['(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi', '(GMT+00:00) UTC / London', '(GMT-05:00) Eastern Time (US & Canada)', '(GMT+04:00) Dubai, Abu Dhabi']}
              />
            </Field>
            <Field label="Date Format">
              <Select
                style={{ height: 36, fontSize: 13 }}
                value={settings.hospital.dateFormat}
                onChange={v => updateHospital('dateFormat', v)}
                options={[{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 26/09/2026)' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 09/26/2026)' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }]}
              />
            </Field>
            <Field label="Time Format">
              <Select
                style={{ height: 36, fontSize: 13 }}
                value={settings.hospital.timeFormat}
                onChange={v => updateHospital('timeFormat', v)}
                options={[{ value: '12 Hour (AM/PM)', label: '12 Hour (09:30 AM)' }, { value: '24 Hour (Military)', label: '24 Hour (09:30)' }]}
              />
            </Field>
            <Field label="Accreditation Status">
              <input type="text" className="input-field" readOnly value="NABH Accredited • Level 3 Trauma Care" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }} />
            </Field>
          </div>
        </div>
      )}

      {/* ===================== USERS & ROLES ===================== */}
      {activeTab === 'users' && (
        <div className="medios-card" style={{ padding: '14px 18px 18px' }}>
          <SectionTitle
            icon={Users}
            color="var(--blue-text)"
            title="User Roles & Access Permissions"
            subtitle="Manage hospital clinical staff, role-based access control (RBAC), and security clearances"
            right={<button className="btn-primary" onClick={() => showToast('Add staff member form opened')}><Plus size={15} /> Add Staff Member</button>}
          />
          <div className="divider" style={{ margin: '14px 0 6px' }} />
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
                ].map(user => (
                  <tr key={user.email}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={user.name.replace(/^(Mr|Mrs|Sister)\.?\s+/, '')} size={30} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge-pill badge-blue">{user.role}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{user.dept}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>{user.access}</td>
                    <td><span className="badge-pill badge-green">{user.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-secondary btn-sm" onClick={() => showToast(`Editing ${user.name}`)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== DEPARTMENTS ===================== */}
      {activeTab === 'departments' && (
        <div className="medios-card" style={{ padding: '14px 18px 18px' }}>
          <SectionTitle
            icon={ClipboardPlus}
            color="var(--blue-text)"
            title="Hospital Clinical Departments"
            subtitle="Active OPD units, IPD wards, doctor rosters, and service specialties"
            right={<button className="btn-primary" onClick={() => showToast('Add department form opened')}><Plus size={15} /> Add Department</button>}
          />
          <div className="divider" style={{ margin: '14px 0 16px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {[
              { name: 'General Medicine', head: 'Dr. Shajin', staff: '8 Doctors', activePatients: 42 },
              { name: 'Cardiology', head: 'Dr. Venkat Raman', staff: '4 Doctors', activePatients: 28 },
              { name: 'Radiology & Imaging', head: 'Dr. Ravi Kumar', staff: '3 Specialists', activePatients: 19 },
              { name: 'Pathology & Lab', head: 'Dr. Meena Swaminathan', staff: '6 Technicians', activePatients: 64 },
              { name: 'Pediatrics', head: 'Dr. Anita Thomas', staff: '5 Doctors', activePatients: 21 },
              { name: 'Orthopedics', head: 'Dr. K. Chandran', staff: '4 Surgeons', activePatients: 15 }
            ].map(dept => (
              <div key={dept.name} style={BOX}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--fs-h4)', color: 'var(--text-primary)' }}>{dept.name}</span>
                  <span className="badge-pill badge-green">Active</span>
                </div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>Head: <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dept.head}</strong></div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginBottom: 12 }}>Staff: {dept.staff}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-subtle)', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Today's Patients: <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dept.activePatients}</strong></span>
                  <button className="btn-secondary btn-sm" onClick={() => showToast(`Configuring ${dept.name}`)}>Configure</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== CLINICAL SETTINGS ===================== */}
      {activeTab === 'clinical' && (
        <div className="medios-card" style={{ padding: '14px 18px 18px' }}>
          <SectionTitle icon={Diamond} color="var(--blue-text)" title="Clinical Protocols & EMR Rules" subtitle="Define default consultation templates, mandatory SOAP fields, and vitals panic thresholds" />
          <div className="divider" style={{ margin: '14px 0 16px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={BOX}>
              <h3 style={{ ...BOX_TITLE, marginBottom: 12 }}>Vitals Panic Thresholds</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 'var(--fs-body)' }}>
                {[
                  ['Systolic Blood Pressure High:', '> 160 mmHg'],
                  ['Diastolic Blood Pressure High:', '> 100 mmHg'],
                  ['Pulse Rate Tachycardia:', '> 100 bpm'],
                  ['SpO2 Hypoxia Warning:', '< 94 %']
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{label}</span>
                    <input type="text" className="input-field" style={{ ...INPUT, width: 110 }} defaultValue={val} />
                  </div>
                ))}
              </div>
            </div>

            <div style={BOX}>
              <h3 style={{ ...BOX_TITLE, marginBottom: 12 }}>Prescription Defaults</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 'var(--fs-body)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Default Duration:</span>
                  <div style={{ width: 130 }}>
                    <Select
                      value={rxDuration}
                      onChange={setRxDuration}
                      options={[{ value: '3 days', label: '3 Days' }, { value: '5 days', label: '5 Days' }, { value: '7 days', label: '7 Days' }, { value: '30 days', label: '30 Days' }]}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 }}>
                  <span>Generic Name Requirement:</span>
                  <span className="badge-pill badge-green">Mandatory</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Max Refill Cycles:</span>
                  <input type="number" className="input-field" style={{ ...INPUT, width: 80 }} defaultValue={3} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 }}>
                  <span>Drug Allergy Cross-Check:</span>
                  <span className="badge-pill badge-blue">Strict Real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== AI ASSISTANT ===================== */}
      {activeTab === 'ai' && (
        <div className="medios-card" style={{ padding: '14px 18px 18px' }}>
          <SectionTitle
            icon={Bot}
            color="var(--purple-ai)"
            title="MediOS AI Intelligence (Powered by GPT-6 Astro)"
            subtitle="Fine-tune AI clinical reasoning, ambient voice-to-notes parsing, and diagnostic assistance"
            right={
              <span className="badge-pill badge-green">
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--green-emerald)' }}></span>
                Model Online • 99.98% Latency 42ms
              </span>
            }
          />
          <div className="divider" style={{ margin: '14px 0 16px' }} />

          <div style={{ backgroundColor: 'var(--green-light)', border: '1px solid var(--green-border)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-dark)' }}>Active Medical LLM Engine</span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--green-dark)', fontWeight: 600 }}>HIPAA & BAA Verified</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Model Architecture">
                <Select
                  style={{ height: 36, fontSize: 13 }}
                  value={settings.ai.model}
                  onChange={v => updateAi('model', v)}
                  leading={<Sparkles size={16} color="var(--purple-ai)" fill="var(--purple-ai)" strokeWidth={1.5} />}
                  options={[{ value: 'GPT-6 Astro (Latest)', label: 'GPT-6 Astro (Clinical Specialization - Recommended)' }, { value: 'GPT-5.5 Clinical Pro', label: 'GPT-5.5 Clinical Pro (High Speed)' }, { value: 'Med-PaLM 2 Clinical', label: 'Med-PaLM 2 Clinical Engine' }]}
                />
              </Field>
              <Field label="Clinical Response Tone">
                <Select
                  style={{ height: 36, fontSize: 13 }}
                  value={settings.ai.responseTone}
                  onChange={v => updateAi('responseTone', v)}
                  options={[{ value: 'Professional & Concise', label: 'Professional & Concise (Bullet summaries)' }, { value: 'Comprehensive Academic', label: 'Comprehensive Academic (With ESC/ADA citations)' }, { value: 'Patient-Friendly Language', label: 'Patient-Friendly Language (For counselling)' }]}
                />
              </Field>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {([
              { key: 'useClinicalSuggestions', title: 'Real-time Clinical Suggestions & Differential Diagnoses', desc: 'Evaluates patient history, symptoms, and vitals to propose differential diagnoses and recommended lab tests.' },
              { key: 'autoGenerateNotes', title: 'Auto-Generate SOAP Clinical Notes', desc: 'Automatically drafts Subjective, Objective, Assessment, and Plan notes upon doctor speech or typing input.' },
              { key: 'voiceToNotes', title: 'Ambient Doctor-Patient Voice-to-Notes', desc: 'Listens to ambient clinical conversations and separates doctor and patient dialogue into structured EHR entries.' },
              { key: 'drugInteractionAlerts', title: 'Drug-Drug & Allergy Contraindication Guardrails', desc: 'Real-time warning popups when a prescribed drug conflicts with existing medications or documented allergies.' },
              { key: 'followUpSuggestions', title: 'Smart Follow-up Interval Recommendations', desc: 'Predicts ideal follow-up visit dates based on chronic conditions (e.g. 3-month HbA1c review for Type 2 DM).' }
            ] as { key: BoolKeys<SettingsState['ai']>; title: string; desc: string }[]).map(item => (
              <DetailToggle key={item.key} title={item.title} desc={item.desc} checked={settings.ai[item.key]} onChange={v => updateAi(item.key, v)} />
            ))}
          </div>
        </div>
      )}

      {/* ===================== INTEGRATIONS ===================== */}
      {activeTab === 'integrations' && (
        <div className="medios-card" style={{ padding: '14px 18px 18px' }}>
          <SectionTitle icon={Share2} color="var(--blue-text)" title="External Healthcare Integrations" subtitle="Connect hospital subsystems, PACS/DICOM radiology servers, LIMS analyzers, and messaging gateways" />
          <div className="divider" style={{ margin: '14px 0 16px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {[
              { title: 'PACS / DICOM Imaging Server', status: 'Connected', sub: 'dcm4chee Server v5.24 • IP: 192.168.1.120' },
              { title: 'LIMS Lab Analyzer Interface', status: 'Connected', sub: 'Roche Cobas 6000 & Sysmex XN-1000 HL7 Stream' },
              { title: 'WhatsApp Business API', status: 'Connected', sub: 'Automated prescription & reminder delivery' },
              { title: 'ABDM / ABHA Digital Mission', status: 'Connected', sub: 'National Health ID & M1/M2/M3 Milestones' },
              { title: 'SMS Gateway (Twilio / Gupshup)', status: 'Connected', sub: 'High-priority OTP & appointment alerts' },
              { title: 'Razorpay / Insurance TPA Portal', status: 'Configured', sub: 'Instant OPD payments and cashless TPA sync' }
            ].map(integ => (
              <div key={integ.title} style={BOX}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{integ.title}</span>
                  <span className="badge-pill badge-green">{integ.status}</span>
                </div>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 12 }}>{integ.sub}</p>
                <button className="btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => showToast(`Managing ${integ.title}`)}>
                  Manage Connection
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== NOTIFICATIONS ===================== */}
      {activeTab === 'notifications' && (
        <div className="medios-card" style={{ padding: '14px 18px 18px' }}>
          <SectionTitle icon={Bell} color="var(--purple-ai)" title="Notification Preferences" subtitle="Control when alerts are triggered across doctor workstation, mobile app, and SMS" />
          <div className="divider" style={{ margin: '14px 0 16px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {([
              { key: 'appointmentReminders', title: 'Appointment Reminders', desc: 'Notify when patients check in at reception or when consultation slot is near.' },
              { key: 'followUpAlerts', title: 'Follow-Up Due Alerts', desc: 'Alert for patients who missed scheduled review visits or require routine follow-ups.' },
              { key: 'labResultAlerts', title: 'Lab & Diagnostic Result Ready Alerts', desc: 'Immediate prompt when pathology lab or radiology releases new test findings.' },
              { key: 'criticalAlerts', title: 'Critical Panic Value Popups', desc: 'High-priority flashing notification for critical vitals, severe ECG findings, or drug warnings.' },
              { key: 'systemNotifications', title: 'System Notifications', desc: 'Maintenance windows, software updates and hospital-wide circulars.' },
              { key: 'emailNotifications', title: 'Email Notifications', desc: 'Daily digest of appointments, pending reports and follow-ups to your inbox.' },
              { key: 'smsNotifications', title: 'Direct SMS Messages to Doctor', desc: 'Send SMS on emergency duty alerts or critical surgical ward consultations.' },
              { key: 'pushNotifications', title: 'Browser & Mobile Push Notifications', desc: 'Push notifications for doctor desktop when app is running in background.' }
            ] as { key: keyof SettingsState['notifications']; title: string; desc: string }[]).map(item => (
              <DetailToggle key={item.key} title={item.title} desc={item.desc} checked={settings.notifications[item.key]} onChange={v => updateNotifications(item.key, v)} />
            ))}
          </div>
        </div>
      )}

      {/* ===================== SECURITY ===================== */}
      {activeTab === 'security' && (
        <div className="medios-card" style={{ padding: '14px 18px 18px' }}>
          <SectionTitle icon={ShieldCheck} color="var(--green-emerald)" title="Security & Authentication" subtitle="Protect patient electronic health records (EHR) with 2FA, session timeouts, and audit logging" />
          <div className="divider" style={{ margin: '14px 0 16px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DetailToggle
              title="Two-Factor Authentication (2FA)"
              desc="Enforce Google Authenticator / TOTP verification on doctor login"
              checked={settings.security.twoFactorAuth}
              onChange={v => updateSecurity('twoFactorAuth', v)}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Automatic Inactivity Session Timeout">
                <Select
                  style={{ height: 36, fontSize: 13 }}
                  value={settings.security.sessionTimeout}
                  onChange={v => updateSecurity('sessionTimeout', v)}
                  options={[{ value: '15 minutes', label: '15 minutes' }, { value: '30 minutes', label: '30 minutes (Standard)' }, { value: '1 hour', label: '1 hour' }, { value: '4 hours', label: '4 hours' }]}
                />
              </Field>
              <Field label="Password Policy">
                <input type="text" className="input-field" readOnly value="Strong (Min 10 chars, symbols & numbers)" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }} />
              </Field>
            </div>

            <div style={{ marginTop: 4 }}>
              <h3 style={{ ...BOX_TITLE, marginBottom: 6 }}>Recent Doctor Login Audit History</h3>
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
                  ].map(log => (
                    <tr key={log.time}>
                      <td style={{ fontWeight: 500 }}>{log.time}</td>
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

      {/* ===================== BACKUP & DATA ===================== */}
      {activeTab === 'backup' && (
        <div className="medios-card" style={{ padding: '14px 18px 18px' }}>
          <SectionTitle icon={ClipboardMinus} color="var(--blue-text)" title="Data Backup & Cloud Storage" subtitle="Automated encrypted backups, historical patient archives, and disaster recovery status" />
          <div className="divider" style={{ margin: '14px 0 16px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
            <div style={BOX}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Cloud Backup Status</span>
                <span className="badge-pill badge-green">Healthy • Daily Sync</span>
              </div>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 8 }}>
                Last full snapshot: <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>26 Sep 2026, 03:00 AM</strong>
              </div>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Next scheduled run: <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>27 Sep 2026, 03:00 AM</strong>
              </div>
              <button className="btn-primary" onClick={() => showToast('Manual backup started', 'success')}>
                <RefreshCw size={14} /> Trigger Manual Backup Now
              </button>
            </div>

            <div style={BOX}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Hospital Storage Quota</span>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--blue-text)' }}>14.2 GB / 50 GB (28%)</span>
              </div>
              <div style={{ width: '100%', height: 8, backgroundColor: 'var(--gray-pill-bg)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ width: '28%', height: '100%', backgroundColor: 'var(--blue-primary)', borderRadius: 4 }}></div>
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                High-res DICOM scans: 9.8 GB • Lab reports: 2.1 GB • Clinical notes: 1.4 GB
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary" onClick={() => showToast('Exporting patient registry (CSV)')}>
              <Download size={14} /> Export Patient Registry (CSV)
            </button>
            <button className="btn-secondary" onClick={() => showToast('Exporting full hospital audit log')}>
              <Download size={14} /> Export Full Hospital Audit Log
            </button>
          </div>
        </div>
      )}

      {/* ===================== APPEARANCE ===================== */}
      {activeTab === 'appearance' && (
        <div className="medios-card" style={{ padding: '14px 18px 18px' }}>
          <SectionTitle icon={Send} color="var(--blue-text)" title="Display & Interface Preferences" subtitle="Personalize UI density, default starting views, and accessibility options" />
          <div className="divider" style={{ margin: '14px 0 16px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Default Starting Module">
              <Select
                style={{ height: 36, fontSize: 13 }}
                value={settings.preferences.defaultDashboard}
                onChange={v => updatePreferences('defaultDashboard', v)}
                options={[{ value: 'Doctor Dashboard', label: 'Doctor Dashboard' }, { value: 'Appointments', label: "Today's Appointments" }, { value: 'Consultation', label: 'Active Consultation Room' }, { value: 'Patients', label: 'Patient Registry' }]}
              />
            </Field>
            <Field label="Default Records Per Page">
              <Select
                style={{ height: 36, fontSize: 13 }}
                value={settings.preferences.itemsPerPage}
                onChange={v => updatePreferences('itemsPerPage', parseInt(v, 10))}
                options={[{ value: 10, label: '10 items' }, { value: 20, label: '20 items (Standard)' }, { value: 50, label: '50 items' }]}
              />
            </Field>
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <DetailToggle
                title="Enable Audio Chimes for Critical Alerts"
                desc="Plays an audible alert chime when a panic lab value or stat consult is assigned"
                checked={settings.preferences.enableSoundAlerts}
                onChange={v => updatePreferences('enableSoundAlerts', v)}
              />
              <DetailToggle
                title="Compact Mode"
                desc="Reduce spacing in tables and lists to fit more records on screen"
                checked={settings.preferences.compactMode}
                onChange={v => updatePreferences('compactMode', v)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
