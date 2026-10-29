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
  | 'beds'
  | 'bed-agent'
  | 'coordinator'
  | 'er-agent'
  | 'lab-agent'
  | 'pharmacy-agent'
  | 'discharge-agent'
  | 'scheduling-agent'
  | 'revenue-agent'
  | 'patient-support-agent';

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
  /** An unknown emergency patient whose details have not been filled in yet (made by the ER). */
  detailsPending?: boolean;
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
  /** A critical value (Lab Agent reports). */
  critical?: boolean;
  /** A text note given with a text result, such as the organism. */
  comment?: string;
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
  /** The report was amended after its first release; `amendedAt` is clinic time, e.g. "26 Sep 2026, 02:30 PM". */
  amended?: boolean;
  amendedAt?: string;
  /** Present only when an interpretation has been recorded for the report. */
  aiSummary?: {
    findings: string[];
    interpretation: string;
    recommendations: string[];
  };
  trend?: {
    parameter: string;
    history: { date: string; value: number; time?: string }[];
  };
}

/** GET /lab-reports/trends/:uhid — one parameter's results over time. */
export interface LabTrend {
  parameter: string;
  unit: string;
  targetRange: string;
  history: { date: string; value: number; time?: string }[];
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
  /** What the alert points at, e.g. 'bed-request:<id>'. */
  link?: string;
  /** Present when the alert is a Coordinator escalation waiting for someone to acknowledge it. */
  /** For a Lab alert: 'lab-line:<lineId>'. An escalated critical takes over that alert, so check the link first. */
  escalation?: { id: string; ladder: string; step: number; titleKey: string; titleLabel: string; holderNames: string[] };
  /** Real-clock ISO time the alert was stored. */
  createdAt?: string;
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
  category: 'Consultation' | 'Lab' | 'Imaging' | 'Prescription' | 'Vitals' | 'Emergency' | 'Admission' | 'Outpatient';
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
    /** The Bed Agent assigns beds to requests on its own. */
    bedAutoAllocate: boolean;
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

/** A settings save: any sections, each with only the keys that change (the API merges them key by key). */
export type SettingsPatch = { [S in keyof SettingsState]?: Partial<SettingsState[S]> };

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
  /** A sample inpatient has no patient record: `id` is ''. */
  patient?: { id: string; name: string; uhid: string; admissionId: string; admittedAt: string; sample: boolean };
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
  /** True when no ward type meets every ticked need (isolation with a ventilator, say). */
  conflict: boolean;
}

export interface AiRefinement {
  status: 'off' | 'ok' | 'timeout' | 'invalid' | 'provider_error';
  sample: boolean;
  top: RankedBedView[];
  extraNeeds: { need: Need; evidence: string }[];
}

/** GET /beds/:bedId/admission: the admitted patient and what their admission asked for. A transfer starts from it. */
export interface BedAdmission {
  admissionId: string;
  patient: { id: string; name: string; uhid: string; age: number; gender: 'Male' | 'Female' | 'Other' };
  roomClass: RoomClass;
  needs: Need[];
  department: string;
  doctor: string;
  notes: string;
  expectedStayDays: number;
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

// ---- Bed Agent: bed requests and the overview (mirror bed-requests.service.ts and bed-overview.ts) ----

export type BedRequestState = 'searching' | 'assigned' | 'waiting' | 'attention' | 'cancelled';
export type BedRequestPriority = 'critical' | 'high' | 'medium' | 'low';

export interface NeedEvidence {
  need: Need;
  evidence: string;
}

/** A doctor's or admin's answer to a need found in the notes. */
export interface ResolvedNeed extends NeedEvidence {
  confirmed: boolean;
  byName: string;
  /** ISO. */
  at: string;
}

/** Why the agent (or staff) chose a bed. */
export interface BedDecision {
  suggestionId: string;
  by: 'ai' | 'rules' | 'staff';
  bedId: string;
  bedLabel: string;
  wardName: string;
  reason: string;
  appliedRules: string[];
  addedNeeds: NeedEvidence[];
  candidates: { bedId: string; label: string; score: number; reason: string }[];
  resolvedNeeds: ResolvedNeed[];
  /** True when `by` is 'ai' and the answer was canned (sample mode). */
  sample: boolean;
  ruleOverride?: boolean;
}

/** A doctor's request for a bed. Times are ISO. */
export interface BedRequest {
  id: string;
  type: 'admission' | 'transfer';
  stepDown: boolean;
  patientId: string;
  patientName: string;
  patientUhid: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  fromBedId?: string;
  fromBedLabel?: string;
  fromWardType?: WardType;
  admissionId?: string;
  roomClass: RoomClass;
  needs: Need[];
  addedNeeds: NeedEvidence[];
  pendingNeeds: NeedEvidence[];
  dismissedNeeds: Need[];
  resolvedNeeds: ResolvedNeed[];
  /** Only from `get`: lists leave the clinical notes out. */
  notes?: string;
  department: string;
  doctor: string;
  expectedStayDays: number;
  priority: BedRequestPriority;
  state: BedRequestState;
  stateReason: string;
  stateSince: string;
  open: boolean;
  attempts: number;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  assignedBedId?: string;
  assignedBedLabel?: string;
  assignedAt?: string;
  decision?: BedDecision;
  closedByName?: string;
}

/** Body of POST /beds/requests. */
export interface CreateBedRequestBody extends Omit<SuggestBedsRequest, 'currentBedId'> {
  type: 'admission' | 'transfer';
  /** For a transfer: the bed the patient is in now. */
  fromBedId?: string;
  priority: BedRequestPriority;
}

export interface BedRequestQuery {
  state?: BedRequestState;
  type?: 'admission' | 'transfer' | 'step-down';
  limit?: number;
  /** ISO: only requests made before this time. */
  before?: string;
}

/** A live stream message: a request changed state. */
export interface BedRequestEvent {
  id: string;
  state: BedRequestState;
  type: 'admission' | 'transfer';
  patientName: string;
  bedLabel?: string;
  reason: string;
}

export type CardKey =
  | 'total'
  | 'occupied'
  | 'available'
  | 'cleaning'
  | 'blocked'
  | 'cleaningBlocked'
  | 'expectedDischarges'
  | 'expectedAdmissions';

export interface StatCardData {
  value: number;
  /** The bed total, for "x of y"; null for cards that are not a share of the beds. */
  total: number | null;
  /** Change against 24 hours ago, in percent; null without a snapshot from then. */
  trendPct: number | null;
  /** The last 24 hourly points, oldest first; null where there is no snapshot. */
  spark: (number | null)[];
  note: string;
}

export interface TypeRow {
  type: WardType;
  label: string;
  total: number;
  occupied: number;
  free: number;
  cleaning: number;
  blocked: number;
  percentFull: number;
}

export interface DischargeItem {
  admissionId: string;
  patientName: string;
  wardName: string;
  bedLabel: string;
  /** ISO. */
  dueAt: string;
  overdue: boolean;
  sample: boolean;
}

export interface Movement {
  id: string;
  kind: 'admission' | 'transfer' | 'discharge';
  /** ISO. */
  at: string;
  patientName: string;
  from: string;
  to: string;
  sample: boolean;
}

export interface AgentSuggestion {
  id: string;
  tone: 'warn' | 'info' | 'ok';
  title: string;
  detail: string;
  action: { label: string; target: 'requests' | 'discharge' | 'cleaning' | 'utilization' | 'bed-map' };
}

export interface BedOverview {
  /** ISO. */
  at: string;
  totals: BoardTotals;
  cards: Record<CardKey, StatCardData>;
  byType: TypeRow[];
  dischargePlan: DischargeItem[];
  movements: Movement[];
  suggestions: AgentSuggestion[];
  openRequests: number;
  avgAdmissionsPerDay: number;
}

export type SnapshotRange = '24h' | '7d';

/** One hour of bed counts (real clock); null where no snapshot was taken. */
export interface SnapshotPoint {
  /** ISO. */
  hour: string;
  occupied: number | null;
  free: number | null;
  cleaning: number | null;
  blocked: number | null;
}


// ---- Coordinator (mirror the backend views in src/modules/coordinator) ----

export type AgentKey = 'coordinator' | 'er' | 'bed' | 'lab' | 'pharmacy' | 'discharge' | 'scheduling' | 'revenue' | 'patient-support';

export interface AgentInfo {
  key: AgentKey;
  name: string;
  job: string;
  owns: string;
  neverDoes: string;
  /** True only for the agents that exist today. */
  built: boolean;
}

/** The nine agents in the client's order (job, ownership and limits from the agent plan). */
export const AGENT_LIST: AgentInfo[] = [
  {
    key: 'coordinator',
    name: 'Coordinator',
    job: 'Opens and closes the case, routes messages between agents, runs the deadline clocks, escalates when something is stuck',
    owns: 'The case and its timeline',
    neverDoes: 'Make a clinical or money decision',
    built: true
  },
  {
    key: 'er',
    name: 'ER',
    job: 'Emergency registration, triage support, pathway timers (such as "ECG within 10 minutes"), the ER board and task list',
    owns: 'The ER visit',
    neverDoes: 'Read the ECG or diagnose',
    built: true
  },
  { key: 'bed', name: 'Bed', job: 'Assigns beds, handles transfers and cleaning', owns: 'Beds and bed requests', neverDoes: 'Move a patient nobody asked to move', built: true },
  {
    key: 'lab',
    name: 'Lab',
    job: 'Turns test orders into sample tasks, tracks turnaround, delivers results, reports critical values, times repeat tests',
    owns: 'Lab orders and results',
    neverDoes: 'Interpret a result for the doctor',
    built: true
  },
  {
    key: 'pharmacy',
    name: 'Pharmacy',
    job: 'Checks every order (allergy, interactions, dose for weight and kidneys), queues it for the pharmacist, tracks stock, prepares take-home medicines',
    owns: 'Medicine orders and stock',
    neverDoes: 'Change a dose or swap a drug',
    built: false
  },
  {
    key: 'discharge',
    name: 'Discharge',
    job: 'Plans discharge from day one, runs the discharge checklist, drafts the summary for the doctor to sign',
    owns: 'The discharge plan',
    neverDoes: "Discharge anyone without a doctor's order",
    built: false
  },
  {
    key: 'scheduling',
    name: 'Scheduling',
    job: 'Books procedures, consults, tests and follow-ups; manages cath lab and OPD slots and the duty roster; feeds the token queue',
    owns: 'Appointments, slots, roster',
    neverDoes: 'Book over a clinical priority',
    built: false
  },
  {
    key: 'revenue',
    name: 'Revenue',
    job: 'Estimates, insurance pre-authorisation, charge capture, running bill, final bill, payment, claim',
    owns: 'The bill and the claim',
    neverDoes: 'Hold up emergency care for money',
    built: false
  },
  {
    key: 'patient-support',
    name: 'Patient Support',
    job: 'Talks to the patient and family: calls, messages, updates, reminders, check-up calls after going home',
    owns: 'Conversations with patient and family',
    neverDoes: 'Give medical advice outside scripts the doctors approved',
    built: false
  }
];

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface AgentStatus {
  key: AgentKey;
  name: string;
  job: string;
  built: boolean;
  online: boolean;
  open: number;
  capacity: number;
  onTimePct: number | null;
}

export type CoordinatorCardKey = 'activeWorkflows' | 'agentsCoordinated' | 'tasksRouted' | 'escalations';

export interface CoordinatorCardData {
  value: number;
  total: number | null;
  /** Change against 24 hours ago, in percent; null without a snapshot from then. */
  trendPct: number | null;
  /** The last 24 hourly points, oldest first; null where there is no snapshot. */
  spark: (number | null)[];
  note: string;
}

export interface CoordinatorOverview {
  /** ISO, clinic time. */
  at: string;
  cards: Record<CoordinatorCardKey, CoordinatorCardData>;
  agents: AgentStatus[];
  openApprovals: number;
  runningClocks: number;
}

export interface CoordinatorSeriesPoint {
  /** ISO. */
  at: string;
  activeWorkflows: number | null;
  agentsOnline: number | null;
  tasksToday: number | null;
  escalations: number | null;
}

export interface CoordinatorCase {
  id: string;
  number: string;
  patientId: string;
  patientUhid: string;
  patientName: string;
  kind: string;
  priority: Priority;
  state: 'open' | 'closed';
  openedAt?: string;
  closedAt?: string;
  closedReason?: string;
  agents: AgentKey[];
  refs: { bedRequestIds: string[]; admissionId?: string };
  openedBy: string;
}

export interface AgentMessage {
  id: string;
  case: string | null;
  from: AgentKey;
  to: AgentKey[];
  type: string;
  priority: Priority;
  summary: string;
  payload: Record<string, unknown>;
  dueBy: string | null;
  needsPerson: boolean;
  opensWork: boolean;
  resolves: string | null;
  causedBy: string | null;
  hop: number;
  state: 'pending' | 'delivered' | 'failed';
  attempts: number;
  resolvedAt: string | null;
  createdAt: string;
}

export type CoordinatorClockState = 'running' | 'met' | 'expired' | (string & {});

/** A deadline clock on a case (backend ClockView). */
export interface CoordinatorClock {
  id: string;
  def: string;
  case: string | null;
  startedBy: string;
  startedAt: string;
  dueAt: string;
  state: CoordinatorClockState;
  stoppedAt: string | null;
  metMinutes: number | null;
  escalation: string | null;
}

export interface CoordinatorCaseDetail {
  case: CoordinatorCase;
  timeline: AgentMessage[];
  clocks: CoordinatorClock[];
}

export interface Approval {
  id: string;
  case: string | null;
  type: string;
  agent: string;
  summary: string;
  roles: string[];
  primary: { kind: 'approve' | 'open'; label: string };
  source: { kind: string; id: string } | null;
  state: string;
  assignedTo: { kind: 'title' | 'role'; key: string; label: string } | null;
  notes: { byName: string; at: string; text: string }[];
  decidedByName: string | null;
  decidedAt: string | null;
  createdAt: string | null;
}

export interface RuleView {
  key: string;
  agent: AgentKey;
  label: string;
  description: string;
  value: boolean;
  locked: boolean;
  /** Set for rules that arrive with an agent that is not built yet. */
  comingWith?: AgentKey;
}

export interface LadderStep {
  /** A duty title key. */
  title: string;
  waitMinutes: number;
}

export interface Ladder {
  key: string;
  label: string;
  steps: LadderStep[];
}

export interface DutyTitle {
  key: string;
  label: string;
  /** User ids of the people who hold this title. */
  holders: string[];
  /** The active holders' names, in the same order. */
  holderNames?: string[];
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface RequestType {
  key: string;
  label: string;
  agent: AgentKey;
}

export interface ChatAction {
  kind: 'open';
  screen: 'bed-request-form' | 'case' | 'bed-agent-request';
  params: Record<string, string>;
}

export interface ChatAnswer {
  answer: string;
  sample: boolean;
  action?: ChatAction;
}

/** One live event from GET /coordinator/stream. */
export interface CoordinatorEvent {
  kind: 'message' | 'case' | 'clock' | 'escalation' | 'approval' | 'agent' | 'rule';
  id: string;
  caseId?: string;
  from?: AgentKey;
  to?: AgentKey[];
  summary?: string;
}

export interface CoordinatorCaseQuery {
  state?: 'open' | 'closed';
  limit?: number;
  before?: string;
}

export interface CoordinatorMessageQuery {
  case?: string;
  type?: string;
  agent?: AgentKey;
  openWork?: boolean;
  limit?: number;
  before?: string;
  /** 'priority' (the default): emergency first, for the queue. 'recent': newest first, for the log. */
  sort?: 'priority' | 'recent';
}

// ===== ER Agent (mirrors the backend ER views) =====

export type TriageColour = 'red' | 'orange' | 'yellow' | 'green';
export type ErMode = 'walk-in' | 'ambulance' | 'referred';
export type ErStatus = 'waiting-triage' | 'waiting-doctor' | 'in-treatment' | 'waiting-bed' | 'left';
export type ErDispositionKind = 'admit' | 'home' | 'transfer' | 'left-against-advice' | 'died';
export type ErPathwayKey = 'chest-pain' | 'stroke' | 'sepsis';
export type ErBayKind = 'resus' | 'bay' | 'stretcher';

export interface ErVitals {
  spo2?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
}

export interface ErVisit {
  id: string;
  number: string;
  patientId: string;
  patientUhid: string;
  patientName: string;
  patientAge: number | null;
  patientGender: string | null;
  /** True while the patient is a placeholder whose details are not filled in yet. */
  detailsPending: boolean;
  /** The visit's live ER clocks (`er-triage`, `er-doctor`, `er-step-<step>`); empty once the visit has left. */
  clocks: { key: string; label: string; state: 'running' | 'expired'; dueAt: string }[];
  /** Any clock is expired or past due. */
  overdue: boolean;
  mode: ErMode;
  complaint: string;
  complaintText: string;
  arrivedAt: string;
  /** The confirmed triage colour, or null while untriaged. */
  colour: TriageColour | null;
  triage: {
    suggested: string;
    reasons: string[];
    colour: string;
    byName: string;
    at: string;
    changeReason?: string;
    history: { colour: string; byName: string; at: string; reason?: string; kind: 'triage' | 'retriage' }[];
  } | null;
  vitalsId: string | null;
  vitals: ErVitals | null;
  painScore: number | null;
  bayId: string | null;
  bayName: string | null;
  status: ErStatus;
  pathways: { key: ErPathwayKey; startedBy: 'rules' | 'staff'; startedByName?: string; cancelled: { byName: string; reason: string; at: string } | null }[];
  steps: { key: string; doneAt: string | null; byName: string | null }[];
  doctorSeenAt: string | null;
  doctorSeenByName: string | null;
  /** When the bed request of an admit was cancelled and the visit went back to treatment; the doctor decides again. */
  admitCancelledAt: string | null;
  disposition: { kind: ErDispositionKind; byName: string; at: string; notes: string } | null;
  leftAt: string | null;
  leftReason: string | null;
  handoverNote: string | null;
  caseId: string;
  /** Real clock; deadlines are worked out from it. */
  createdAt: string;
}

export interface ErExpected {
  id: string;
  complaint: string;
  ageSex: string;
  mode: ErMode;
  etaMinutes: number;
  expectedAt: string;
  phone: string | null;
  patientId: string | null;
  state: 'waiting' | 'arrived' | 'expired';
}

export interface ErBoard {
  visits: ErVisit[];
  expected: ErExpected[];
}

export type ErCardKey = 'patientsInEr' | 'critical' | 'avgTriageMin' | 'onTimePct';

export interface ErOverview {
  at: string;
  cards: Record<ErCardKey, StatCardData>;
  colours: { colour: TriageColour; count: number; targetMin: number; avgWaitMin: number | null }[];
  performance: { avgTriageMin: number | null; onTimePct: number | null; avgStayMin: number | null; arrivalsByHour: number[] };
}

export interface ErSeriesPoint {
  at: string;
  patientsInEr: number | null;
  critical: number | null;
  avgTriageMin: number | null;
  onTimePct: number | null;
}

export interface ErBay {
  id: string;
  name: string;
  kind: ErBayKind;
  order: number;
  outOfUse: boolean;
  visitId: string | null;
  visitNumber: string | null;
}

export interface ErBayInput {
  id?: string;
  name: string;
  kind: ErBayKind;
  outOfUse: boolean;
}

export interface ErComplaintInfo {
  complaints: { key: string; label: string }[];
  pathways: { key: ErPathwayKey; label: string; steps: { key: string; label: string }[] }[];
}

export interface ErArrivalInput {
  patientId?: string;
  uhid?: string;
  cardId?: string;
  emergency?: { gender: 'Male' | 'Female' | 'Other'; approxAge: number; description: string };
  mode: ErMode;
  complaint: string;
  complaintText?: string;
  expectedId?: string;
}

export interface ErExpectedInput {
  complaint: string;
  ageSex: string;
  mode: ErMode;
  etaMinutes: number;
  phone?: string;
  patientId?: string;
}

export interface ErTriageInput {
  complaint: string;
  vitals?: ErVitals;
  painScore?: number;
  colour: TriageColour;
  reason?: string;
}

export interface ErTriageSuggestion {
  colour: TriageColour;
  reasons: string[];
  pathways: ErPathwayKey[];
  explanation: string;
  sample: boolean;
}

// ----- Lab Agent: mirrors the backend views field by field -----

export type LabPriority = 'stat' | 'urgent' | 'routine';
export type LabArea = 'ER' | 'Ward' | 'OPD';
export type LabLineStatus = 'ordered' | 'collected' | 'received' | 'awaiting-validation' | 'released' | 'cancelled';
export type LabRejectReason = 'haemolysed' | 'clotted' | 'wrong-tube' | 'unlabelled' | 'insufficient' | 'other';
export type LabCardKey = 'ordersToday' | 'samplesCollected' | 'inProcessing' | 'resultsCompleted' | 'criticalResults';

export interface LabResultRow {
  param: string;
  value: string | number;
  unit: string;
  flag: 'normal' | 'low' | 'high' | 'abnormal';
  critical: boolean;
  comment?: string;
}

export interface LabLineView {
  id: string;
  test: string;
  label: string;
  status: LabLineStatus;
  tatDueAt: string;
  results: LabResultRow[];
  version: number;
  enteredAt: string | null;
  enteredBy: { id: string; name: string } | null;
  /** Kept for older readers; same as enteredBy.name. */
  enteredByName: string | null;
  validatedBy: { id: string; name: string } | null;
  releasedAt: string | null;
  /** Real time of the first release. */
  releasedRealAt: string | null;
  /** Real time of the latest release, amendments included. */
  lastReleasedRealAt: string | null;
  cancelled: { by: string; reason: string; at: string } | null;
  critical: { active: boolean; ackBy: string | null; ackAt: string | null; ackNote: string | null } | null;
  amendment?: LabAmendment | null;
}

export interface LabAmendment {
  reason: string;
  previous: { param: string; value: string | number; unit: string; flag: string }[];
}

export interface LabSampleView {
  id: string;
  number: string;
  tube: string;
  tubeLabel: string;
  lines: string[];
  status: string;
  collectBy: string;
  collected: { by: string; at: string } | null;
  received: { by: string; at: string } | null;
  rejected: { by: string; reason: string; note: string; at: string } | null;
}

export interface LabRequestView {
  id: string;
  number: string;
  patientId: string;
  patientUhid: string;
  patientName: string;
  caseId: string;
  orderedBy: { id: string; name: string };
  priority: LabPriority;
  note: string;
  orderedAt: string;
  collectBy: string;
  repeatOf: string | null;
  scheduledFor: string | null;
  location: { area: LabArea; ward?: string };
  lines: LabLineView[];
  samples: LabSampleView[];
  done: boolean;
}

export interface LabRequestQuery {
  status?: 'open' | 'done';
  search?: string;
  area?: LabArea;
}

export interface LabSampleLabel {
  sampleNumber: string;
  tubeLabel: string;
  tests: string[];
  patientUhid: string;
  requestNumber: string;
  priority: LabPriority;
  orderedAt: string;
}

export interface LabCollectionItem {
  sampleId: string;
  sampleNumber: string;
  tube: string;
  tubeLabel: string;
  tests: string[];
  requestId: string;
  requestNumber: string;
  priority: LabPriority;
  patientName: string;
  patientUhid: string;
  location: { area: LabArea; ward?: string };
  collectBy: string;
  overdue: boolean;
  scheduledFor: string | null;
  /** A repeat is not collected before this time (ISO); null for others. */
  notBefore: string | null;
}

export interface LabWorklistSample {
  sampleId: string;
  sampleNumber: string;
  tube: string;
  tubeLabel: string;
  tests: string[];
  requestId: string;
  requestNumber: string;
  priority: LabPriority;
  patientName: string;
  patientUhid: string;
  collectedAt: string | null;
  collectedBy: string | null;
}

export interface LabWorklistLine {
  lineId: string;
  test: string;
  label: string;
  requestId: string;
  requestNumber: string;
  priority: LabPriority;
  patientName: string;
  patientUhid: string;
  tatDueAt: string;
  results: LabResultRow[];
  critical: boolean;
  enteredBy: { id: string; name: string } | null;
  enteredAt: string | null;
  validatedBy: { id: string; name: string } | null;
  releasedRealAt: string | null;
  lastReleasedRealAt: string | null;
  version: number;
  sentBack: { by: string; reason: string; at: string } | null;
  amendment: LabAmendment | null;
}

export interface LabWorklist {
  toReceive: LabWorklistSample[];
  toEnter: LabWorklistLine[];
  toValidate: LabWorklistLine[];
  sentBack: LabWorklistLine[];
}

export interface LabCatalogueTest {
  key: string;
  label: string;
  tube: string;
  tubeLabel: string;
  category: string;
  parameters: { name: string; unit: string; low: number | null; high: number | null; text: boolean; range: string; options?: string[] | null }[];
  targets: { stat: number; routine: number };
}

export interface LabCatalogue {
  tests: LabCatalogueTest[];
  priorities: { key: LabPriority; collectWithinMinutes: number }[];
  tubes: { key: string; label: string }[];
  rejectionReasons: LabRejectReason[];
}

export interface LabOrderInput {
  patientId: string;
  tests: string[];
  priority: LabPriority;
  note?: string;
  repeatAfterHours?: number;
}

export type LabTargets = Record<string, { stat: number; routine: number }>;
export type LabLimit = { low?: number; high?: number; anyAbnormalText?: true };
export interface LabLimits {
  limits: Record<string, LabLimit>;
  history: { by: string; at: string; changes: { key: string; from: unknown; to: unknown }[] }[];
}

export interface LabTatRow {
  test: string;
  label: string;
  count: number;
  avgMin: number | null;
  targetMin: number;
  onTime: boolean | null;
}

export interface LabCriticalRow {
  lineId: string;
  requestNumber: string;
  test: string;
  label: string;
  parameter: string;
  value: string;
  unit: string;
  orderedBy: string;
  releasedAt: string | null;
  ackBy: string | null;
  ackAt: string | null;
  /** From the running critical clock; null once acknowledged. */
  dueAt: string | null;
  /** The line was amended after its first release. */
  amended: boolean;
  /** The amendment waits for validation; the critical stays listed. */
  pendingAmendment: boolean;
  patientName?: string;
  patientUhid?: string;
  location?: { area: LabArea; ward?: string };
  /** Every critical value of the released version. */
  criticals: { param: string; value: number | string; unit: string; flag: string }[];
}

export interface LabOverview {
  at: string;
  cards: Record<LabCardKey, StatCardData>;
  tatByTest: LabTatRow[];
  performance: {
    avgTatMin: number | null;
    onTimePct: number | null;
    collectionOnTimePct: number | null;
    rejectionRate: number | null;
    ordersByHour: number[];
  };
  critical: LabCriticalRow[];
}

export type LabSeriesPoint = { at: string } & Record<LabCardKey, number | null>;
