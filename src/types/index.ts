export type ScreenId =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'consultation'
  | 'emr'
  | 'timeline'
  | 'lab-reports'
  | 'imaging'
  | 'prescriptions'
  | 'medications'
  | 'documents'
  | 'vitals'
  | 'billing'
  | 'follow-ups'
  | 'hospital-knowledge'
  | 'clinical-guidelines'
  | 'voice-to-notes'
  | 'tasks-alerts'
  | 'messages'
  | 'settings';

export interface Patient {
  id: string;
  uhid: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  avatar?: string;
  bloodGroup: string;
  visitType: 'OPD' | 'IPD';
  status: 'Today' | 'Admitted' | 'Follow-up' | 'Discharged';
  department: string;
  lastVisit: string;
  nextAppointment?: string;
  doctor: string;
  conditions: string[];
  allergies: string[];
  insurance?: {
    provider: string;
    policyNumber: string;
    validity: string;
    coverageType: string;
    claimStatus: 'Not Claimed' | 'In Progress' | 'Approved' | 'Settled';
  };
  vitals?: Vitals;
  aiSummary?: {
    summary: string;
    keyPoints: string[];
  };
}

export interface Vitals {
  recordedAt: string;
  bpSystolic: number;
  bpDiastolic: number;
  heartRate: number;
  temperature: number;
  spo2: number;
  weightKg: number;
  heightCm: number;
  bmi: number;
  bmiStatus: 'Normal' | 'Overweight' | 'Underweight' | 'Obese';
}

export interface Appointment {
  id: string;
  uhid: string;
  patientName: string;
  age: number;
  gender: 'Male' | 'Female';
  avatar?: string;
  phone: string;
  time: string;
  date: string;
  type: string;
  condition: string;
  status: 'Checked In' | 'Waiting' | 'In Consultation' | 'Scheduled' | 'Completed' | 'Canceled';
  consultationDuration?: string;
  checkedInTime?: string;
  notes?: string;
  tags?: string[];
}

/** A consultation. `id` is absent on the blank draft the API returns for a patient with no notes yet. */
export interface SoapNote {
  id?: string;
  uhid: string;
  visitDate: string;
  visitTime: string;
  visitType: string;
  doctor: string;
  department: string;
  /** Chief complaint, shown in visit lists. */
  reason?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  /** Unstructured note from the EMR's Free Text mode. */
  freeText?: string;
  icd10: {
    code: string;
    description: string;
    type: 'Chronic' | 'Acute';
  }[];
  isFinal: boolean;
}

export interface PrescriptionItem {
  id: string;
  medicine: string;
  brand?: string;
  dose: string;
  frequency: 'OD' | 'BD' | 'TDS' | 'QID' | 'HS' | 'SOS';
  duration: string;
  route: string;
  instructions?: 'After food' | 'Before food' | 'At night' | 'SOS (Fever)' | 'With warm water';
  indication?: string;
  status: 'Active' | 'Paused' | 'Stopped' | 'Completed';
  startDate?: string;
}

export interface PrescriptionRecord {
  id: string;
  uhid: string;
  date: string;
  doctor: string;
  type: string;
  items: PrescriptionItem[];
  additionalInstructions: string;
  options: {
    printAdvice: boolean;
    includeDiagnosis: boolean;
    includeVitals: boolean;
    includeNextVisit: boolean;
    includeLabSummary: boolean;
  };
}

export interface LabParameter {
  id: string;
  name: string;
  result: number | string;
  referenceRange: string;
  unit: string;
  status: 'Normal' | 'Low' | 'High' | 'Abnormal';
  relativePosition?: number; // 0 to 100 for gauge position
}

export interface LabReportGroup {
  category: string;
  parameters: LabParameter[];
}

export interface LabTestReport {
  id: string;
  uhid: string;
  testName: string;
  category: 'Blood' | 'Urine' | 'Biochemistry' | 'Hematology' | 'Others';
  date: string;
  time: string;
  status: 'Completed' | 'Pending' | 'Abnormal';
  groups: LabReportGroup[];
  /** Present only when an interpretation has been recorded for the report. */
  aiSummary?: {
    findings: string[];
    interpretation: string;
    recommendations: string[];
  };
  trend?: {
    parameter: string;
    history: { date: string; value: number }[];
  };
}

/** GET /lab-reports/trends/:uhid — one parameter's results over time. */
export interface LabTrend {
  parameter: string;
  unit: string;
  targetRange: string;
  history: { date: string; value: number }[];
}

export interface ImagingStudy {
  id: string;
  uhid: string;
  title: string;
  date: string;
  time: string;
  modality: 'X-Ray' | 'CT Scan' | 'MRI' | 'Ultrasound' | 'Mammography' | 'Others';
  bodyPart: string;
  radiologist: string;
  status: 'Completed' | 'Pending' | 'Reported';
  thumbnailUrl: string;
  slices: string[];
  findings: string[];
  impression: string;
  confidenceScore: number;
  radiologistReport: {
    findings: string;
    impression: string;
    reportedBy: string;
    reportedOn: string;
    status: 'Final Report' | 'Preliminary';
  };
}

export interface BillItem {
  id: string;
  service: string;
  subCategory?: string;
  category: 'Consultation' | 'Lab' | 'Radiology' | 'Others' | 'Administrative';
  qty: number;
  unitPrice: number;
  discount: number;
  amount: number;
}

export interface BillInvoice {
  id: string;
  billNumber: string;
  uhid: string;
  patientName: string;
  billDate: string;
  visitType: string;
  consultationId: string;
  createdBy: string;
  paymentMode: string;
  status: 'Paid' | 'Unpaid' | 'Partially Paid';
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  notes: string;
}

export interface FollowUpItem {
  id: string;
  uhid: string;
  patientName: string;
  age: number;
  gender: 'Male' | 'Female';
  avatar?: string;
  lastVisit: string;
  followUpDate: string;
  followUpTime: string;
  followUpType: string;
  status: 'Scheduled' | 'Completed' | 'Pending' | 'Missed' | 'Overdue';
  assignedTo: string;
  reminders: string;
}

export interface ClinicalGuideline {
  id: string;
  title: string;
  version: string;
  specialty: string;
  source: string;
  updatedDate: string;
  evidenceLevel: 'High (A)' | 'Moderate (B)' | 'Low (C)';
  recommendationStrength: 'Strong' | 'Recommendation' | 'Conditional';
  isOfficial?: boolean;
  background?: string;
  keyPoints?: string[];
  applicableTo?: string[];
  notApplicableTo?: string[];
  aiQnA?: {
    question: string;
    answer: string;
    sourceCited: string;
  };
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  type: 'Guideline' | 'Protocol' | 'Reference' | 'SOP';
  lastUpdated: string;
  summary: string;
  isBookmarked?: boolean;
}

export interface TaskAlertItem {
  id: string;
  title: string;
  subtitle: string;
  patientName: string;
  uhid: string;
  type: 'Lab Alert' | 'Follow-up' | 'Medication' | 'Imaging Alert' | 'Documentation' | 'Preventive Care' | 'Patient Communication' | 'Medication Alert' | 'System';
  priority: 'High' | 'Medium' | 'Low';
  dueDateTime: string;
  status: 'Pending' | 'Scheduled' | 'In Progress' | 'Completed';
  category: 'Critical' | 'Follow-up' | 'Lab' | 'Imaging' | 'Medication' | 'System';
}

export interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient' | 'system' | 'staff';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  attachment?: {
    type: 'image' | 'pdf';
    name: string;
    size: string;
  };
}

export interface MessageThread {
  id: string;
  contactName: string;
  uhid?: string;
  age?: number;
  gender?: string;
  category: 'Patient' | 'Lab' | 'Pharmacy' | 'Imaging' | 'Nursing' | 'Department' | 'Admin';
  preview: string;
  time: string;
  unreadCount: number;
  online?: boolean;
  messages: ChatMessage[];
  condition?: string;
}

export interface TimelineEvent {
  id: string;
  uhid: string;
  date: string;
  time: string;
  category: 'Consultation' | 'Lab' | 'Imaging' | 'Prescription' | 'Vitals' | 'Emergency' | 'Admission';
  title: string;
  subtitle: string;
  doctor: string;
  department: string;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Reviewed';
  badgeColor?: string;
  details?: {
    diagnosis?: string;
    icd10?: string;
    vitalsSummary?: string;
    notes?: string;
    medicationsCount?: number;
    testsConducted?: string[];
  };
}

export interface ClinicalDocument {
  id: string;
  uhid: string;
  title: string;
  category: 'Discharge Summary' | 'Consent Form' | 'Referral Letter' | 'Insurance & Claims' | 'Lab / Diagnostic' | 'Medical Certificate' | 'Prescription / Bill';
  date: string;
  author: string;
  department: string;
  fileType: 'pdf' | 'doc' | 'image' | 'dicom';
  fileSize: string;
  status: 'Signed' | 'Pending Signature' | 'Draft' | 'Archived';
  /** Set by PATCH /documents/:id/sign. */
  signedBy?: string;
  signedOn?: string;
  description?: string;
}

/** One vitals reading. Only BP and heart rate are always present; other values only when measured. */
export interface VitalsRecord {
  id: string;
  uhid: string;
  recordedAt: string;
  recordedBy: string;
  bpSystolic: number;
  bpDiastolic: number;
  heartRate: number;
  temperature?: number;
  spo2?: number;
  respiratoryRate?: number;
  bloodSugarFasting?: number;
  bloodSugarPostPrandial?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  bmiStatus?: 'Normal' | 'Overweight' | 'Underweight' | 'Obese';
  status: 'Normal' | 'Warning' | 'Critical';
  notes?: string;
}


/** The signed-in doctor or staff member (GET /auth/me). */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  specialty: string;
  department: string;
  doctorId: string;
  avatar: string;
  phone: string;
  role: string;
}

/** Workstation settings (GET/PUT /settings). */
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

/** GET /dashboard/stats — one day's numbers; the dashboard formats them. */
export interface DashboardStats {
  date: string;
  appointments: { total: number; completed: number; pending: number };
  patients: { total: number; newToday: number };
  consultations: { total: number; finalised: number };
  labReports: { total: number; pending: number };
  imaging: { total: number; pending: number };
  billing: { revenue: number; invoices: number };
  schedule: { id: string; uhid: string; time: string; patientName: string; type: string; condition: string; status: Appointment['status'] }[];
  patientFlow: { label: string; count: number }[];
  consultationTypes: { label: string; count: number }[];
  criticalAlerts: { id: string; title: string; subtitle: string; patientName: string; uhid: string; type: TaskAlertItem['type']; category: TaskAlertItem['category']; dueDateTime: string }[];
  recentPatients: { id: string; uhid: string; name: string; age: number; gender: string; avatar?: string; reason: string; lastVisit: string }[];
}

/** A medication on the patient's list (GET /medications). */
export interface Medication extends Omit<PrescriptionItem, 'instructions'> {
  uhid: string;
  instructions?: string;
  /** Percentage of doses taken, once measured. */
  adherenceScore?: number;
}
