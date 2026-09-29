import { ClinicalGuideline } from '../types';

export const mockGuidelinesSpecialties = [
  { name: 'All Specialties', count: 1245 },
  { name: 'Internal Medicine', count: 180 },
  { name: 'Emergency Medicine', count: 120 },
  { name: 'Cardiology', count: 110 },
  { name: 'Endocrinology', count: 85 },
  { name: 'Infectious Diseases', count: 80 },
  { name: 'Pulmonology', count: 75 },
  { name: 'Nephrology', count: 60 },
  { name: 'Gastroenterology', count: 55 },
  { name: 'Neurology', count: 50 },
  { name: 'Pediatrics', count: 95 },
  { name: 'Obstetrics & Gynecology', count: 90 },
  { name: 'Surgery', count: 75 },
  { name: 'Orthopedics', count: 55 },
  { name: 'Anesthesiology', count: 50 },
  { name: 'Radiology', count: 45 },
  { name: 'Oncology', count: 40 },
  { name: 'Dermatology', count: 35 },
  { name: 'ENT', count: 30 },
  { name: 'Ophthalmology', count: 30 },
  { name: 'Psychiatry', count: 25 },
  { name: 'Hospital Administration', count: 25 }
];

export const mockGuidelines: ClinicalGuideline[] = [
  {
    id: 'g-1',
    title: 'Hypertension Management in Adults',
    version: 'v2023.1',
    specialty: 'Internal Medicine',
    source: 'ESC 2023',
    updatedDate: '12 Sep 2023',
    evidenceLevel: 'High (A)',
    recommendationStrength: 'Strong',
    isOfficial: true,
    background: 'These guidelines provide evidence-based recommendations for diagnosis and management of arterial hypertension in adults to reduce cardiovascular morbidity and mortality.',
    keyPoints: [
      'Use standardized BP measurement techniques',
      'Start lifestyle modification for all patients with elevated BP',
      'Initiate pharmacological therapy based on cardiovascular risk',
      'Target BP < 140/90 mmHg (or lower for high-risk patients)',
      'Regular monitoring and treatment adherence',
      'Manage comorbidities (diabetes, CKD, CVD)'
    ],
    applicableTo: [
      'Adults ≥ 18 years',
      'Primary hypertension',
      'Both outpatient and inpatient setting'
    ],
    notApplicableTo: [
      'Pregnancy (see separate guideline)',
      'Acute hypertensive emergencies',
      'Secondary hypertension (specific guidelines)'
    ],
    aiQnA: {
      question: 'What is the first line treatment for hypertension in adults?',
      answer: 'First-line treatment for hypertension in adults includes lifestyle modification for all patients, and pharmacological therapy with one of the following as initial monotherapy:\n• ACE inhibitor (e.g., Ramipril)\n• ARB (e.g., Losartan)\n• Calcium channel blocker (e.g., Amlodipine)\n• Thiazide or thiazide-like diuretic (e.g., Indapamide, Chlorthalidone)',
      sourceCited: 'ESC 2023 Guidelines for the management of arterial hypertension. Section 4.2 – Initial pharmacological treatment, Page 25–27'
    }
  },
  {
    id: 'g-2',
    title: 'Type 2 Diabetes Mellitus Management',
    version: 'v2024.1',
    specialty: 'Endocrinology',
    source: 'ADA 2024',
    updatedDate: '15 Jan 2024',
    evidenceLevel: 'High (A)',
    recommendationStrength: 'Strong',
    isOfficial: true,
    background: 'Standards of Care in Diabetes guidelines covering glycemic targets, pharmacotherapy, cardiovascular risk reduction, and complication screenings.',
    keyPoints: [
      'Target HbA1c < 7.0% for most non-pregnant adults',
      'Metformin remains foundational first-line therapy',
      'Early incorporation of SGLT2i or GLP-1 RA for CKD or ASCVD risk'
    ],
    applicableTo: ['Non-pregnant adults with diagnosed Type 2 Diabetes'],
    notApplicableTo: ['Type 1 Diabetes Mellitus', 'Gestational Diabetes']
  },
  {
    id: 'g-3',
    title: 'Sepsis and Septic Shock Management',
    version: 'v2021.1',
    specialty: 'Emergency Medicine',
    source: 'Surviving Sepsis 2021',
    updatedDate: '03 Mar 2021',
    evidenceLevel: 'High (A)',
    recommendationStrength: 'Strong',
    isOfficial: true,
    background: 'Evidence-based protocol for early recognition, fluid resuscitation, antimicrobial timing, and vasopressor titration in sepsis.',
    keyPoints: [
      'Initiate 1-hour bundle upon recognition',
      'Measure lactate level; remeasure if initial lactate > 2 mmol/L',
      'Administer broad-spectrum antimicrobials within 1 hour'
    ]
  },
  {
    id: 'g-4',
    title: 'Acute Coronary Syndrome (ACS)',
    version: 'v2023.1',
    specialty: 'Cardiology',
    source: 'ESC 2023',
    updatedDate: '20 Aug 2023',
    evidenceLevel: 'High (A)',
    recommendationStrength: 'Strong',
    isOfficial: true,
    background: 'Management of STEMI and NSTEMI, including antiplatelet strategies and invasive revascularization pathways.',
    keyPoints: [
      'Immediate 12-lead ECG within 10 minutes of first medical contact',
      'High-sensitivity troponin serial measurements at 0h and 1h/2h',
      'Dual antiplatelet therapy and immediate anticoagulation'
    ]
  },
  {
    id: 'g-5',
    title: 'Antimicrobial Stewardship Guidelines',
    version: 'v2023.2',
    specialty: 'Infectious Diseases',
    source: 'WHO 2023',
    updatedDate: '10 Jun 2023',
    evidenceLevel: 'Moderate (B)',
    recommendationStrength: 'Recommendation',
    isOfficial: true,
    background: 'Optimizing antibiotic use in inpatient settings to prevent multi-drug resistance and minimize Clostridioides difficile infections.',
    keyPoints: [
      'De-escalate therapy based on microbiology culture results within 48-72h',
      'Restrict carbapenems and colistin to pre-authorized infectious disease approvals'
    ]
  }
];
