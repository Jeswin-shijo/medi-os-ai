import { TimelineEvent } from '../types';

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'tl-1',
    uhid: 'MHK202500321',
    date: '26 Sep 2026',
    time: '09:15 AM',
    category: 'Consultation',
    title: 'Follow-up Consultation',
    subtitle: 'Acute Upper Respiratory Infection & Review',
    doctor: 'Dr. Shajin',
    department: 'General Medicine',
    status: 'In Progress',
    badgeColor: '#2563eb',
    details: {
      diagnosis: 'Acute Upper Respiratory Tract Infection (J06.9)',
      notes: 'Patient reports fever for 3 days with mild cough and body ache. Bilateral air entry clear. Throat congested. Paracetamol 650mg prescribed.',
      medicationsCount: 3,
      vitalsSummary: 'BP: 140/90 mmHg • HR: 86 bpm • SpO2: 98% • Temp: 98.4 °F'
    }
  },
  {
    id: 'tl-2',
    uhid: 'MHK202500321',
    date: '26 Sep 2026',
    time: '09:05 AM',
    category: 'Vitals',
    title: 'Vitals & Triage Assessment',
    subtitle: 'Pre-consultation check-in by Nursing Staff',
    doctor: 'Nurse Anjali, RN',
    department: 'OPD Triage Station 2',
    status: 'Completed',
    badgeColor: '#10b981',
    details: {
      vitalsSummary: 'BP: 140/90 mmHg (Stage 1 HTN) • Pulse: 86 bpm • SpO2: 98% Room Air • Temp: 98.4 °F • BMI: 26.4 kg/m² (Overweight)',
      notes: 'Alert, oriented, ambulant. No acute respiratory distress.'
    }
  },
  {
    id: 'tl-3',
    uhid: 'MHK202500321',
    date: '12 Sep 2026',
    time: '10:15 AM',
    category: 'Imaging',
    title: 'Chest X-Ray (PA View)',
    subtitle: 'Routine Cardiopulmonary Clearance',
    doctor: 'Dr. Ravi (Radiology)',
    department: 'Radiology & Imaging',
    status: 'Completed',
    badgeColor: '#8b5cf6',
    details: {
      diagnosis: 'No active cardiopulmonary disease detected',
      notes: 'Lung fields clear. Normal cardiomediastinal silhouette. Costophrenic angles sharp.',
      testsConducted: ['Chest X-Ray PA View (DICOM Verified)']
    }
  },
  {
    id: 'tl-4',
    uhid: 'MHK202500321',
    date: '12 Sep 2026',
    time: '09:30 AM',
    category: 'Lab',
    title: 'Comprehensive Metabolic & Diabetes Panel',
    subtitle: 'HbA1c, Fasting Blood Sugar & Lipid Profile',
    doctor: 'Dr. Meera (Pathology)',
    department: 'Central Clinical Laboratory',
    status: 'Completed',
    badgeColor: '#f59e0b',
    details: {
      diagnosis: 'HbA1c 7.8% (Elevated) • Fasting Glucose 134 mg/dL',
      notes: 'HbA1c indicates sub-optimal glycemic control. Serum Creatinine 1.05 mg/dL (Normal). eGFR 88 mL/min.',
      testsConducted: ['HbA1c Glycated Hemoglobin', 'Fasting Blood Sugar', 'Serum Creatinine', 'Lipid Profile']
    }
  },
  {
    id: 'tl-5',
    uhid: 'MHK202500321',
    date: '12 Sep 2026',
    time: '09:00 AM',
    category: 'Prescription',
    title: 'Prescription Dispensed (4 Medications)',
    subtitle: 'Refill for Hypertension & Type 2 Diabetes',
    doctor: 'Dr. Shajin',
    department: 'Hospital Pharmacy Counter A',
    status: 'Completed',
    badgeColor: '#06b6d4',
    details: {
      notes: 'Tab Amlodipine 5mg OD (30 days), Tab Metformin 500mg BD (30 days), Tab Atorvastatin 10mg HS (30 days), Tab Pantoprazole 40mg OD (15 days).',
      medicationsCount: 4
    }
  },
  {
    id: 'tl-6',
    uhid: 'MHK202500321',
    date: '05 Aug 2026',
    time: '11:15 AM',
    category: 'Consultation',
    title: 'Routine Chronic Care Consultation',
    subtitle: 'Quarterly Diabetes & BP Review',
    doctor: 'Dr. Shajin',
    department: 'General Medicine',
    status: 'Completed',
    badgeColor: '#2563eb',
    details: {
      diagnosis: 'Essential Hypertension (I10) & Type 2 Diabetes Mellitus (E11.9)',
      notes: 'Compliance verified. Advised 30 minutes daily aerobic exercise and sodium restriction. HbA1c scheduled for September.',
      vitalsSummary: 'BP: 138/88 mmHg • HR: 82 bpm • Weight: 78.5 kg'
    }
  },
  {
    id: 'tl-7',
    uhid: 'MHK202500321',
    date: '21 Mar 2026',
    time: '02:30 PM',
    category: 'Imaging',
    title: 'Ultrasound Whole Abdomen',
    subtitle: 'Screening for Hepatic Steatosis',
    doctor: 'Dr. Ravi (Radiology)',
    department: 'Radiology & Imaging',
    status: 'Completed',
    badgeColor: '#8b5cf6',
    details: {
      diagnosis: 'Mild Diffuse Hepatic Steatosis (Grade 1 Fatty Liver)',
      notes: 'Liver mildly enlarged with increased parenchymal echogenicity. Gallbladder, kidneys, and spleen unremarkable.',
      testsConducted: ['USG Whole Abdomen']
    }
  },
  {
    id: 'tl-8',
    uhid: 'MHK202500321',
    date: '10 Jan 2026',
    time: '08:15 AM',
    category: 'Emergency',
    title: 'Emergency Department Visit',
    subtitle: 'Evaluation of Atypical Chest Discomfort',
    doctor: 'Dr. Ravi / ER Team',
    department: 'Emergency & Trauma Care',
    status: 'Completed',
    badgeColor: '#ef4444',
    details: {
      diagnosis: 'Atypical Chest Pain - Musculoskeletal / Non-cardiac',
      notes: '12-lead ECG normal sinus rhythm, no ST-T changes. High-sensitivity Troponin-I negative (< 0.01 ng/mL). Discharged after 4 hours observation.',
      testsConducted: ['12-Lead ECG', 'Cardiac Biomarkers (Hs-Troponin)', 'Chest X-Ray Portable']
    }
  }
];
