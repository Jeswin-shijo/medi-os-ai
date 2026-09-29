import { SoapNote } from '../types';

export const mockSoapNote: SoapNote = {
  id: 'soap-001',
  uhid: 'MHK202500321',
  visitDate: '26 Sep 2026',
  visitTime: '09:15 AM',
  visitType: 'Follow-up',
  doctor: 'Dr. Shajin',
  department: 'General Medicine',
  subjective: 'Patient reports fever for 3 days associated with mild cough and body ache.\nNo breathlessness. Appetite slightly reduced. No chest pain.\nKnown hypertension and type 2 diabetes.',
  objective: 'General condition: Stable\nRS: Bilateral air entry present, no added sounds\nCVS: S1 S2 normal\nAbdomen: Soft, non-tender\nSpO₂: 98%',
  assessment: 'Acute respiratory infection (likely viral).\nKnown HTN and Type 2 DM - fair control.\nNo evidence of lower respiratory tract involvement at present.',
  plan: '• Tab Paracetamol 650 mg – TID for 3 days\n• Adequate fluids and rest\n• Continue current medications\n• Review if symptoms persist or worsen\n• Follow-up after 5 days',
  icd10: [
    { code: 'J06.9', description: 'Acute upper respiratory infection', type: 'Acute' },
    { code: 'I10', description: 'Primary Hypertension', type: 'Chronic' },
    { code: 'E11.9', description: 'Type 2 Diabetes Mellitus', type: 'Chronic' }
  ],
  isFinal: false
};

export const mockVisitsTimeline = [
  { id: 'v1', date: '26 Sep 2026', time: '09:15 AM', type: 'Follow-up', doctor: 'Dr. Shajin', reason: 'Fever, cough', status: 'In Progress', color: 'var(--blue-primary)' },
  { id: 'v2', date: '12 Sep 2026', time: '10:00 AM', type: 'Consultation', doctor: 'Dr. Shajin', reason: 'BP review', status: 'Completed', color: '#1e3a8a' },
  { id: 'v3', date: '05 Aug 2026', time: '11:15 AM', type: 'Follow-up', doctor: 'Dr. Shajin', reason: 'Diabetes review', status: 'Completed', color: 'var(--green-emerald)' },
  { id: 'v4', date: '20 Jun 2026', time: '09:45 AM', type: 'Consultation', doctor: 'Dr. Priya', reason: 'Routine checkup', status: 'Completed', color: '#9aa3b5' },
  { id: 'v5', date: '15 Mar 2026', time: '02:30 PM', type: 'OPD', doctor: 'Dr. Shajin', reason: 'Hypertension', status: 'Completed', color: 'var(--orange-amber)' },
  { id: 'v6', date: '10 Jan 2026', time: '08:15 AM', type: 'Emergency', doctor: 'Dr. Ravi', reason: 'Chest pain', status: 'Completed', color: 'var(--red-rose)' }
];

/** Older encounters revealed by "Load More" on the EMR visits list. */
export const mockOlderVisits = [
  { id: 'v7', date: '18 Nov 2025', time: '10:30 AM', type: 'Consultation', doctor: 'Dr. Shajin', reason: 'Diabetes diagnosis', status: 'Completed', color: '#9aa3b5' },
  { id: 'v8', date: '02 Aug 2025', time: '04:00 PM', type: 'OPD', doctor: 'Dr. Priya', reason: 'Annual health check', status: 'Completed', color: '#9aa3b5' }
];

export const mockAIConsiderations = [
  {
    id: 'c1',
    title: '1. Acute upper respiratory infection',
    bullets: [
      'Fever, cough, body ache for 3 days. Consider viral etiology.',
      'Review for red flags: persistent fever, breathlessness.'
    ],
    applied: false
  },
  {
    id: 'c2',
    title: '2. Evaluate need for further investigation',
    bullets: [
      'If symptoms persist > 5 days, consider CBC, CRP, Chest X-ray.'
    ],
    applied: false
  },
  {
    id: 'c3',
    title: '3. Diabetes and Hypertension',
    bullets: [
      'Continue current medications. Monitor BP and sugar levels.'
    ],
    applied: false
  }
];

export const mockSuggestedInvestigations = [
  'CBC',
  'CRP (if indicated)',
  'Chest X-Ray (if symptoms persist)'
];

export const mockSuggestedTreatmentPlan = [
  'Symptomatic treatment',
  'Review after 5 days'
];

export const mockPatientEducation = [
  'Adequate fluids and rest',
  'Mask if in public places',
  'Seek medical attention if fever persists, breathlessness or chest pain'
];

/** Medicines prescribed in today's consultation (Consultation screen prescription table). */
export interface ConsultationRxRow {
  id: string;
  medicine: string;
  dose: string;
  frequency: string;
  duration: string;
  instruction: string;
}

export const mockConsultationRx: ConsultationRxRow[] = [
  { id: 'crx-1', medicine: 'Paracetamol', dose: '650 mg', frequency: 'TID', duration: '3 Days', instruction: 'After food' },
  { id: 'crx-2', medicine: 'Amlodipine', dose: '5 mg', frequency: 'OD', duration: 'Continue', instruction: 'Morning' },
  { id: 'crx-3', medicine: 'Metformin', dose: '500 mg', frequency: 'BD', duration: 'Continue', instruction: 'After food' }
];

/** Quick prescription sets for the "Add from Template" picker. */
export const mockRxTemplates: Record<string, Omit<ConsultationRxRow, 'id'>[]> = {
  Common: [
    { medicine: 'Paracetamol', dose: '650 mg', frequency: 'TID', duration: '3 Days', instruction: 'After food' },
    { medicine: 'Cetirizine', dose: '10 mg', frequency: 'HS', duration: '5 Days', instruction: 'At night' }
  ],
  Hypertension: [
    { medicine: 'Amlodipine', dose: '5 mg', frequency: 'OD', duration: 'Continue', instruction: 'Morning' },
    { medicine: 'Telmisartan', dose: '40 mg', frequency: 'OD', duration: 'Continue', instruction: 'Morning' }
  ],
  Diabetes: [
    { medicine: 'Metformin', dose: '500 mg', frequency: 'BD', duration: 'Continue', instruction: 'After food' },
    { medicine: 'Glimepiride', dose: '1 mg', frequency: 'OD', duration: 'Continue', instruction: 'Before food' }
  ]
};

/** SOAP note starting points for the Consultation Workspace "Templates" tab. */
export const mockSoapTemplates = [
  {
    id: 'st-1',
    title: 'Fever / URTI',
    subtitle: 'Acute febrile illness',
    subjective: 'Fever for __ days with cough / cold / body ache.\nNo breathlessness. No chest pain.',
    objective: 'General condition: Stable\nRS: Bilateral air entry present, no added sounds\nCVS: S1 S2 normal',
    assessment: 'Acute upper respiratory infection (likely viral).',
    plan: '• Tab Paracetamol 650 mg – TID for 3 days\n• Adequate fluids and rest\n• Review if symptoms persist'
  },
  {
    id: 'st-2',
    title: 'Hypertension Review',
    subtitle: 'Chronic disease follow-up',
    subjective: 'Here for BP review. Compliant with medication.\nNo headache, giddiness or chest pain.',
    objective: 'BP: ___ mmHg  HR: ___ bpm\nCVS: S1 S2 normal',
    assessment: 'Essential hypertension – control: ___',
    plan: '• Continue Amlodipine 5 mg OD\n• Low salt diet, regular exercise\n• Home BP monitoring\n• Review after 4 weeks'
  },
  {
    id: 'st-3',
    title: 'Diabetes Review',
    subtitle: 'Glycaemic control check',
    subjective: 'Here for diabetes review. No hypoglycaemic episodes.\nNo polyuria / polydipsia.',
    objective: 'FBS: ___ mg/dL  PPBS: ___ mg/dL\nFeet: No ulcers, sensation intact',
    assessment: 'Type 2 diabetes mellitus – control: ___',
    plan: '• Continue Metformin 500 mg BD\n• Repeat HbA1c after 3 months\n• Diet and exercise counselling'
  }
];
