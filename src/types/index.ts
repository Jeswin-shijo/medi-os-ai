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

export interface SoapNote {
  id: string;
  uhid: string;
  visitDate: string;
  visitTime: string;
  visitType: string;
  doctor: string;
  department: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
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
  instructions: 'After food' | 'Before food' | 'At night' | 'SOS (Fever)' | 'With warm water';
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
  aiSummary: {
    findings: string[];
    interpretation: string;
    recommendations: string[];
  };
  trend?: {
    parameter: string;
    history: { date: string; value: number }[];
  };
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
  description?: string;
}

export interface VitalsRecord {
  id: string;
  uhid: string;
  recordedAt: string;
  recordedBy: string;
  bpSystolic: number;
  bpDiastolic: number;
  heartRate: number;
  temperature: number;
  spo2: number;
  respiratoryRate: number;
  bloodSugarFasting?: number;
  bloodSugarPostPrandial?: number;
  weightKg: number;
  heightCm: number;
  bmi: number;
  bmiStatus: 'Normal' | 'Overweight' | 'Underweight' | 'Obese';
  status: 'Normal' | 'Warning' | 'Critical';
  notes?: string;
}

