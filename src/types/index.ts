export type ScreenId =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'queue'
  | 'call-agent'
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
  | 'settings'
  | 'beds';

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
  /** The AI call agent never calls a patient with this flag (wrong number, or asked not to be called). */
  doNotCall?: boolean;
  doNotCallReason?: string;
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
  status: 'Checked In' | 'Waiting' | 'In Consultation' | 'Scheduled' | 'Completed' | 'Canceled' | 'No Show';
  consultationDuration?: string;
  checkedInTime?: string;
  notes?: string;
  tags?: string[];
  /** Whether the patient has said they will come (AI call agent or front desk). */
  confirmation?: AppointmentConfirmation;
  confirmedAt?: string;
  /** '' (front desk) or 'AI call'. */
  bookedVia?: string;
}

export type AppointmentConfirmation = 'Unconfirmed' | 'Confirmed' | 'Reschedule Requested' | 'Cancelled by Patient' | 'Unreachable';

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
  category:
    | 'Discharge Summary'
    | 'Consent Form'
    | 'Referral Letter'
    | 'Insurance & Claims'
    | 'Lab / Diagnostic'
    | 'Imaging Report'
    | 'Medical Certificate'
    | 'Prescription / Bill'
    | 'ID Proof';
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
  lastLoginAt?: string | null;
  passwordChangedAt?: string | null;
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
    bedSuggestions: boolean;
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
  callAgent: CallAgentSettings;
  queue: QueueSettings;
}

// ---------------------------------------------------------------- token queue

export interface QueueSettings {
  /** Rooms or counters tokens are called to. */
  counters: string[];
  tokenPrefix: string;
  showNamesOnDisplay: boolean;
  announce: boolean;
  upcomingOnDisplay: number;
}

/** waiting → called → completed; a called patient who does not come is skipped. */
export type TokenStatus = 'waiting' | 'called' | 'skipped' | 'completed' | 'cancelled';

export interface QueueToken {
  id: string;
  date: string;
  number: number;
  label: string;
  status: TokenStatus;
  uhid: string;
  patientName: string;
  appointmentId?: string;
  appointmentTime: string;
  priority: boolean;
  note: string;
  source: 'front-desk' | 'kiosk';
  issuedBy: string;
  counter?: string;
  calledAt?: string;
  firstCalledAt?: string;
  calledBy: string;
  recalls: number;
  completedAt?: string;
  createdAt: string;
  /** Place in line while waiting, else null. */
  position: number | null;
}

export interface QueueBoard {
  date: string;
  settings: QueueSettings;
  tokens: QueueToken[];
  stats: { issued: number; waiting: number; called: number; skipped: number; completed: number; cancelled: number; averageWaitMinutes: number | null };
}

/** A display shows the queue; a kiosk lets patients tap a card to take a token. */
export type QueueDeviceKind = 'display' | 'kiosk';

/** A device allowed to use the queue without a sign-in (its key is shown once, when added). */
export interface QueueDisplayDevice {
  id: string;
  name: string;
  /** Missing on displays added before kiosks existed. */
  kind?: QueueDeviceKind;
  /** Kiosks: print a token slip after each tap. */
  printSlips?: boolean;
  keyHint: string;
  createdBy: string;
  lastSeenAt?: string;
  createdAt: string;
}

/** A hospital card linked to a patient: its serial number as the USB reader types it. */
export interface PatientCard {
  id: string;
  cardId: string;
  uhid: string;
  linkedBy: string;
  lastUsedAt?: string;
  createdAt: string;
}

/** What a check-in kiosk shows after a tap: no UHID or full name. */
export interface KioskTapResult {
  label: string;
  /** "Priya S." */
  name: string;
  status: TokenStatus;
  existing: boolean;
  /** People ahead in line (0 when already called). */
  ahead: number;
  /** Set when the patient has already been called. */
  counter?: string;
  appointmentTime: string;
  issuedAt: string;
  /** Whether this kiosk prints slips now (an administrator can switch it at any time). */
  printSlips: boolean;
}

/** What the waiting-room display receives: token numbers, rooms and (if allowed) short names. */
export interface QueueDisplaySnapshot {
  hospitalName: string;
  date: string;
  announce: boolean;
  nowServing: { label: string; counter: string; calledAt: string; recalls: number; name?: string }[];
  upcoming: { label: string; priority: boolean; name?: string }[];
  waitingCount: number;
  serverTime: string;
}

// ---------------------------------------------------------------- AI call agent

/** How the simulated provider's "patient" answers (development only). */
export type SimulatedResponse = 'random' | 'positive' | 'reschedule' | 'callback' | 'cancel' | 'no_answer' | 'escalate' | 'do_not_call';

export interface CallAgentSettings {
  autoConfirm: boolean;
  confirmHoursBefore: number;
  callingHoursStart: string;
  callingHoursEnd: string;
  maxAttempts: number;
  retryMinutes: number;
  agentName: string;
  language: string;
  clinicSessions: string;
  slotMinutes: number;
  closedDays: string[];
  simulatedResponse: SimulatedResponse;
}

export type CallPurpose = 'confirmation' | 'booking';
export type CallStatus = 'scheduled' | 'calling' | 'completed' | 'failed' | 'canceled';
export type CallOutcome =
  | 'confirmed'
  | 'rescheduled'
  | 'reschedule_requested'
  | 'cancelled'
  | 'booked'
  | 'slot_taken'
  | 'callback'
  | 'declined'
  | 'no_answer'
  | 'busy'
  | 'wrong_number'
  | 'do_not_call'
  | 'escalated'
  | 'failed';

export interface OfferedSlot {
  date: string;
  time: string;
  label: string;
}

/** One phone call placed by the AI agent (GET /calls). The list omits transcript and variables. */
export interface AgentCall {
  id: string;
  purpose: CallPurpose;
  status: CallStatus;
  outcome?: CallOutcome;
  uhid: string;
  patientName: string;
  phone: string;
  appointmentId?: string;
  followUpId?: string;
  visitReason: string;
  appointmentType: string;
  scheduledFor: string;
  attempt: number;
  trigger: 'manual' | 'scheduler' | 'retry' | 'callback';
  requestedBy: string;
  provider: string;
  offeredSlots: OfferedSlot[];
  result: { chosenSlot?: number; callbackAt?: string; notes?: string };
  summary: string;
  transcript?: { speaker: 'agent' | 'patient'; text: string }[];
  variables?: Record<string, string>;
  actionTaken: string;
  startedAt?: string;
  endedAt?: string;
  durationSec?: number;
  error: string;
  createdAt: string;
}

export interface CallStats {
  callsToday: number;
  answeredToday: number;
  contactRate: number | null;
  confirmedToday: number;
  bookedToday: number;
  cancelledToday: number;
  escalatedToday: number;
  unansweredToday: number;
  active: number;
  upcomingUnconfirmed: number;
  needsAttention: number;
}

export interface CallAgentConfig {
  provider: 'none' | 'simulated' | 'snapserve';
  live: boolean;
  settings: CallAgentSettings;
}

export interface AgentScript {
  purpose: CallPurpose;
  title: string;
  goal: string;
  variables: string[];
  welcome: string;
  instructions: string;
  outcomes: { label: string; outcome: string }[];
  dataFields: { name: string; description: string }[];
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

// ---- Beds and AI bed suggestions (mirror the backend views in src/modules/beds) ----

export type BedState = 'free' | 'held' | 'occupied' | 'cleaning' | 'blocked';
export type WardType = 'emergency' | 'icu' | 'hdu' | 'isolation' | 'general' | 'paediatric' | 'maternity' | 'twin' | 'private' | 'deluxe';
/** A class staff can admit to (isolation is a need, not a class). */
export type RoomClass = Exclude<WardType, 'isolation'>;
export type Need = 'oxygen' | 'highFallRisk' | 'isolation' | 'ventilator' | 'monitor' | 'pregnant';
export type Feature = 'oxygen' | 'monitor' | 'ventilator' | 'nearNurses' | 'singleRoom' | 'attendantBed';

export interface BoardWard {
  id: string;
  code: string;
  name: string;
  shortName: string;
  floor: number;
  type: WardType;
  gender: 'male' | 'female' | 'any';
  ratePerDay: number;
}

export interface BoardBed {
  id: string;
  wardId: string;
  label: string;
  number: number;
  room?: string;
  features: Feature[];
  state: BedState;
  /** When the bed entered its state (clinic clock), ISO. */
  since: string;
  sample: boolean;
  blockedReason?: string;
  /** Set on held beds: whether the viewer holds it. */
  heldByMe?: boolean;
  patient?: { id: string; name: string; uhid: string; admissionId: string; admittedAt: string };
}

export interface BoardTotals {
  total: number;
  occupied: number;
  free: number;
  cleaning: number;
  held: number;
  blocked: number;
  percentFull: number;
}

export interface BedBoard {
  wards: BoardWard[];
  beds: BoardBed[];
  totals: BoardTotals;
  updatedAt: string;
}

export interface RankedBedView {
  bedId: string;
  label: string;
  wardName: string;
  floor: number;
  ratePerDay: number;
  features: Feature[];
  reason: string;
  aiReason?: string;
  stepUp: boolean;
}

export interface SuggestionResult {
  suggestionId: string;
  appliedRules: string[];
  blockedBy: string[];
  classNote?: string;
  top: RankedBedView[];
  eligible: RankedBedView[];
  ai: 'pending' | 'off';
}

export interface AiRefinement {
  status: 'off' | 'ok' | 'timeout' | 'invalid' | 'provider_error';
  sample: boolean;
  top: RankedBedView[];
  extraNeeds: { need: Need; evidence: string }[];
}

/** Body of POST /beds/suggestions. */
export interface SuggestBedsRequest {
  /** The patient id or UHID. */
  patientId: string;
  roomClass: RoomClass;
  needs: Need[];
  department: string;
  doctor: string;
  expectedStayDays: number;
  notes: string;
  /** For a transfer: the bed the patient is in now. */
  currentBedId?: string;
}

export interface AiStatus {
  provider: 'none' | 'sample' | 'claude';
  model: string;
  features: { bedSuggestions: boolean };
}
