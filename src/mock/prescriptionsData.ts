import { PrescriptionItem, PrescriptionRecord } from '../types';

export const mockPrescriptionItems: PrescriptionItem[] = [
  {
    id: 'rx-1',
    medicine: 'Tab Amlodipine 5 mg',
    brand: 'Amlodipine',
    dose: '5 mg',
    frequency: 'OD',
    duration: '30 days',
    route: 'Oral',
    instructions: 'After food',
    indication: 'Hypertension',
    status: 'Active',
    startDate: '12 Sep 2026'
  },
  {
    id: 'rx-2',
    medicine: 'Tab Metformin 500 mg',
    brand: 'Metformin',
    dose: '500 mg',
    frequency: 'BD',
    duration: '30 days',
    route: 'Oral',
    instructions: 'After food',
    indication: 'Type 2 Diabetes',
    status: 'Active',
    startDate: '12 Sep 2026'
  },
  {
    id: 'rx-3',
    medicine: 'Tab Atorvastatin 10 mg',
    brand: 'Atorvastatin',
    dose: '10 mg',
    frequency: 'OD',
    duration: '30 days',
    route: 'Oral',
    instructions: 'After food',
    indication: 'Hyperlipidemia',
    status: 'Active',
    startDate: '12 Sep 2026'
  },
  {
    id: 'rx-4',
    medicine: 'Tab Pantoprazole 40 mg',
    brand: 'Pantoprazole',
    dose: '40 mg',
    frequency: 'OD',
    duration: '14 days',
    route: 'Oral',
    instructions: 'Before food',
    indication: 'Gastric Protection',
    status: 'Active',
    startDate: '12 Sep 2026'
  },
  {
    id: 'rx-5',
    medicine: 'Syp Levocetirizine',
    brand: 'Levocetirizine 5 mg',
    dose: '5 ml',
    frequency: 'HS',
    duration: '5 days',
    route: 'Oral',
    instructions: 'At night',
    indication: 'Allergic Rhinitis',
    status: 'Paused',
    startDate: '12 Sep 2026'
  },
  {
    id: 'rx-6',
    medicine: 'Tab Paracetamol 650 mg',
    brand: 'Paracetamol',
    dose: '650 mg',
    frequency: 'TDS',
    duration: '5 days',
    route: 'Oral',
    instructions: 'SOS (Fever)',
    indication: 'Fever / Pain',
    status: 'Active',
    startDate: '12 Sep 2026'
  }
];

export const mockPrescriptionRecord: PrescriptionRecord = {
  id: 'rx-rec-001',
  uhid: 'MHK202500321',
  date: '26 Sep 2026',
  doctor: 'Dr. Shajin',
  type: 'Follow-up',
  items: mockPrescriptionItems,
  additionalInstructions: '• Take medicines as advised.\n• Maintain low salt diet.\n• Monitor blood pressure and blood sugar regularly.\n• Follow up after 2 weeks or earlier if symptoms persist.',
  options: {
    printAdvice: true,
    includeDiagnosis: true,
    includeVitals: true,
    includeNextVisit: true,
    includeLabSummary: false
  }
};

export const mockMedicationTemplates = [
  { id: 't1', title: 'Hypertension Follow-up', medCount: 2 },
  { id: 't2', title: 'Diabetes Follow-up', medCount: 3 },
  { id: 't3', title: 'URI / Common Cold', medCount: 4 },
  { id: 't4', title: 'GERD', medCount: 2 },
  { id: 't5', title: 'UTI', medCount: 3 },
  { id: 't6', title: 'Post-operative Care', medCount: 4 }
];

export const mockDrugAlternatives = [
  { original: 'Amlodipine 5 mg', brand: 'Amloip / Amlong' },
  { original: 'Metformin 500 mg', brand: 'Glycomet / Metformine' },
  { original: 'Atorvastatin 10 mg', brand: 'Atorlip / Atorva' },
  { original: 'Pantoprazole 40 mg', brand: 'Pan / Pantodac' },
  { original: 'Levocetirizine 5 mg', brand: 'L-Cet / Levocet' }
];

export const mockAdherenceData = [
  { name: 'Amlodipine', rate: 92, color: '#10b981' },
  { name: 'Metformin', rate: 88, color: '#10b981' },
  { name: 'Atorvastatin', rate: 85, color: '#06b6d4' },
  { name: 'Pantoprazole', rate: 70, color: '#ef4444' }
];
