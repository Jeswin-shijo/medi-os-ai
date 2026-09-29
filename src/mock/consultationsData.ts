import { SoapNote } from '../types';

export const mockSoapNote: SoapNote = {
  id: 'soap-001',
  uhid: 'MHK202500321',
  visitDate: '26 Sep 2026',
  visitTime: '09:15 AM',
  visitType: 'Follow-up',
  doctor: 'Dr. Shajin',
  department: 'General Medicine',
  subjective: 'Patient reports fever for 3 days associated with mild cough and body ache. No breathlessness. Appetite slightly reduced. No chest pain. Known hypertension and type 2 diabetes. No recent travel. No sick contacts.',
  objective: 'General condition: Stable\nGeneral: Alert, oriented\nRS: Bilateral air entry present, no added sounds\nCVS: S1 S2 normal\nAbdomen: Soft, non-tender\nSpO2: 98%\nBP: 140/90 mmHg\nHR: 86 bpm\nTemp: 98.4 °F',
  assessment: 'Acute respiratory infection (likely viral).\nKnown HTN and Type 2 DM – fair control.\nNo evidence of lower respiratory tract involvement at present.',
  plan: '• Tab Paracetamol 650 mg – TID for 3 days\n• Adequate fluids and rest\n• Continue current medications\n• Review if symptoms persist or worsen\n• Follow-up after 5 days',
  icd10: [
    { code: 'J06.9', description: 'Acute upper respiratory infection', type: 'Acute' },
    { code: 'I10', description: 'Primary Hypertension', type: 'Chronic' },
    { code: 'E11.9', description: 'Type 2 Diabetes Mellitus', type: 'Chronic' }
  ],
  isFinal: false
};

export const mockVisitsTimeline = [
  { id: 'v1', date: '26 Sep 2026', time: '09:15 AM', type: 'Follow-up', doctor: 'Dr. Shajin', reason: 'Fever, cough', status: 'In Progress' },
  { id: 'v2', date: '12 Sep 2026', time: '10:00 AM', type: 'Consultation', doctor: 'Dr. Shajin', reason: 'BP review', status: 'Completed' },
  { id: 'v3', date: '05 Aug 2026', time: '11:15 AM', type: 'Follow-up', doctor: 'Dr. Shajin', reason: 'Diabetes review', status: 'Completed' },
  { id: 'v4', date: '20 Jun 2026', time: '09:45 AM', type: 'Consultation', doctor: 'Dr. Priya', reason: 'Routine checkup', status: 'Completed' },
  { id: 'v5', date: '15 Mar 2026', time: '02:30 PM', type: 'OPD', doctor: 'Dr. Shajin', reason: 'Hypertension', status: 'Completed' },
  { id: 'v6', date: '10 Jan 2026', time: '08:15 AM', type: 'Emergency', doctor: 'Dr. Ravi', reason: 'Chest pain', status: 'Completed' }
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
