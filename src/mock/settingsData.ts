export interface SettingsState {
  profile: {
    name: string;
    designation: string;
    credentials: string;
    regNo: string;
    email: string;
    phone: string;
    specialization: string;
    bio: string;
  };
  hospital: {
    name: string;
    address: string;
    phone: string;
    email: string;
    timeZone: string;
    dateFormat: string;
    timeFormat: string;
  };
  ai: {
    model: string;
    useClinicalSuggestions: boolean;
    autoGenerateNotes: boolean;
    voiceToNotes: boolean;
    drugInteractionAlerts: boolean;
    followUpSuggestions: boolean;
    responseTone: string;
    language: string;
  };
  notifications: {
    appointmentReminders: boolean;
    followUpAlerts: boolean;
    labResultAlerts: boolean;
    criticalAlerts: boolean;
    systemNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: string;
    loginAlerts: boolean;
    ipRestrictions: boolean;
    auditLogAccess: boolean;
  };
  preferences: {
    defaultDashboard: string;
    itemsPerPage: number;
    defaultPatientView: string;
    autoSaveInterval: string;
    enableSoundAlerts: boolean;
    showTipsAndGuides: boolean;
    compactMode: boolean;
  };
}

export const initialSettings: SettingsState = {
  profile: {
    name: 'Dr. Shajin',
    designation: 'General Physician',
    credentials: 'MBBS, MD (Internal Medicine)',
    regNo: 'Reg. No: TNMC 12345',
    email: 'dr.shajin@hospital.com',
    phone: '+91 98765 43210',
    specialization: 'General Physician',
    bio: 'Compassionate care with evidence-based medicine.'
  },
  hospital: {
    name: "St. Mary's Multi Speciality Hospital",
    address: '123, Church Road, Nagercoil,\nKanyakumari District, Tamil Nadu - 629001',
    phone: '+91 4652 123456',
    email: 'info@stmaryshospital.com',
    timeZone: '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12 Hour (AM/PM)'
  },
  ai: {
    model: 'GPT-6 Astro (Latest)',
    useClinicalSuggestions: true,
    autoGenerateNotes: true,
    voiceToNotes: true,
    drugInteractionAlerts: true,
    followUpSuggestions: true,
    responseTone: 'Professional & Concise',
    language: 'English (Auto-detect)'
  },
  notifications: {
    appointmentReminders: true,
    followUpAlerts: true,
    labResultAlerts: true,
    criticalAlerts: true,
    systemNotifications: true,
    emailNotifications: false,
    smsNotifications: true,
    pushNotifications: true
  },
  security: {
    twoFactorAuth: true,
    sessionTimeout: '30 minutes',
    loginAlerts: true,
    ipRestrictions: false,
    auditLogAccess: true
  },
  preferences: {
    defaultDashboard: 'Doctor Dashboard',
    itemsPerPage: 20,
    defaultPatientView: 'Summary View',
    autoSaveInterval: '30 seconds',
    enableSoundAlerts: true,
    showTipsAndGuides: true,
    compactMode: false
  }
};
