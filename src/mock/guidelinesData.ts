import {
  createLucideIcon,
  Baby,
  Bone,
  BookOpenText,
  Brain,
  BrainCog,
  ClipboardList,
  Droplet,
  Ear,
  Eye,
  FileText,
  Flower,
  Hand,
  Heart,
  LayoutGrid,
  Pill,
  Ribbon,
  ScanLine,
  Siren,
  Slice,
  Syringe,
  Virus,
  type LucideIcon,
} from 'lucide-react';
import { ClinicalGuideline } from '../types';

// Organ icons Lucide doesn't ship (same 24px grid / stroke conventions).
const Lungs = createLucideIcon('lungs', [
  ['path', { d: 'M12 3v7', key: 'trachea' }],
  ['path', { d: 'M12 10a2 2 0 0 1-2 2', key: 'bl' }],
  ['path', { d: 'M12 10a2 2 0 0 0 2 2', key: 'br' }],
  ['path', { d: 'M6.1 9.5A3.9 3.9 0 0 1 8.8 8c.8 0 1.2.6 1.2 1.5V17a3 3 0 0 1-3 3H5.5A2.5 2.5 0 0 1 3 17.5c0-3.4 1.2-6.2 3.1-8z', key: 'l' }],
  ['path', { d: 'M17.9 9.5A3.9 3.9 0 0 0 15.2 8c-.8 0-1.2.6-1.2 1.5V17a3 3 0 0 0 3 3h1.5a2.5 2.5 0 0 0 2.5-2.5c0-3.4-1.2-6.2-3.1-8z', key: 'r' }],
]);

const Kidneys = createLucideIcon('kidneys', [
  ['path', { d: 'M7.5 3C4.9 3 3 6.6 3 11.5S4.9 21 7.5 21c1.7 0 2.7-1.2 2.7-2.8 0-1.6-1.4-2.6-1.4-6.2s1.4-4.6 1.4-6.2C10.2 4.2 9.2 3 7.5 3z', key: 'l' }],
  ['path', { d: 'M16.5 3c2.6 0 4.5 3.6 4.5 8.5S19.1 21 16.5 21c-1.7 0-2.7-1.2-2.7-2.8 0-1.6 1.4-2.6 1.4-6.2s-1.4-4.6-1.4-6.2c0-1.6 1-2.8 2.7-2.8z', key: 'r' }],
]);

const Stomach = createLucideIcon('stomach', [
  ['path', { d: 'M11 2v4a2 2 0 0 0 2 2h1.5A5.5 5.5 0 0 1 20 13.5 7.5 7.5 0 0 1 12.5 21H10a5 5 0 0 1-5-5v-.5A2.5 2.5 0 0 1 7.5 13 2.5 2.5 0 0 1 10 15.5a1.5 1.5 0 0 0 1.5 1.5h1a3.5 3.5 0 0 0 3.5-3.5A1.5 1.5 0 0 0 14.5 12H13a4 4 0 0 1-4-4V2', key: 's' }],
]);

const ORANGE = '#e8710a';
const BROWN = '#b0643a';

/** Icon + colour for every specialty / knowledge category row (Hospital Knowledge + Clinical Guidelines). */
export const specialtyVisuals: Record<string, { icon: LucideIcon; color: string }> = {
  'All Topics': { icon: LayoutGrid, color: 'var(--blue-primary)' },
  'All Specialties': { icon: BookOpenText, color: 'var(--blue-primary)' },
  'Internal Medicine': { icon: FileText, color: 'var(--blue-primary)' },
  'Emergency Medicine': { icon: Siren, color: 'var(--red-rose)' },
  Cardiology: { icon: Heart, color: 'var(--red-rose)' },
  Endocrinology: { icon: Flower, color: 'var(--red-rose)' },
  'Infectious Diseases': { icon: Virus, color: 'var(--red-rose)' },
  Pulmonology: { icon: Lungs, color: 'var(--blue-primary)' },
  Nephrology: { icon: Kidneys, color: 'var(--blue-primary)' },
  Gastroenterology: { icon: Stomach, color: 'var(--purple-ai)' },
  Neurology: { icon: Brain, color: ORANGE },
  Pediatrics: { icon: Baby, color: ORANGE },
  'Obstetrics & Gynecology': { icon: Droplet, color: 'var(--purple-ai)' },
  Surgery: { icon: Slice, color: 'var(--blue-primary)' },
  Orthopedics: { icon: Bone, color: 'var(--green-emerald)' },
  Anesthesiology: { icon: Syringe, color: 'var(--green-emerald)' },
  Radiology: { icon: ScanLine, color: 'var(--blue-primary)' },
  Oncology: { icon: Ribbon, color: 'var(--red-rose)' },
  Dermatology: { icon: Hand, color: BROWN },
  ENT: { icon: Ear, color: 'var(--purple-ai)' },
  Ophthalmology: { icon: Eye, color: 'var(--purple-ai)' },
  Psychiatry: { icon: BrainCog, color: ORANGE },
  'Hospital Administration': { icon: ClipboardList, color: 'var(--red-rose)' },
};

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

/** Presentation extras for the guideline list rows (kept out of the shared ClinicalGuideline type). */
export type PillTone = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
export type GuidelineEntry = ClinicalGuideline & {
  summary: string;
  sourceFull: string;
  icon: LucideIcon;
  iconColor: string;
  specialtyTone: PillTone;
  sourceTone: PillTone;
};

export const mockGuidelines: GuidelineEntry[] = [
  {
    id: 'g-1',
    title: 'Hypertension Management in Adults',
    summary: 'Diagnosis and treatment of primary hypertension in adults',
    sourceFull: 'European Society of Cardiology (ESC) Guidelines 2023',
    icon: Heart,
    iconColor: 'var(--red-rose)',
    specialtyTone: 'blue',
    sourceTone: 'gray',
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
    summary: 'Glycemic control and cardiovascular risk reduction',
    sourceFull: 'American Diabetes Association (ADA) Standards of Care 2024',
    icon: Flower,
    iconColor: ORANGE,
    specialtyTone: 'purple',
    sourceTone: 'gray',
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
    summary: 'Early recognition and treatment of sepsis',
    sourceFull: 'Surviving Sepsis Campaign International Guidelines 2021',
    icon: Virus,
    iconColor: 'var(--purple-ai)',
    specialtyTone: 'red',
    sourceTone: 'blue',
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
    summary: 'Management of STEMI and NSTEMI',
    sourceFull: 'European Society of Cardiology (ESC) Guidelines 2023',
    icon: Heart,
    iconColor: 'var(--red-rose)',
    specialtyTone: 'purple',
    sourceTone: 'blue',
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
    summary: 'Appropriate use of antibiotics in hospital setting',
    sourceFull: 'World Health Organization (WHO) AWaRe Guidance 2023',
    icon: Pill,
    iconColor: ORANGE,
    specialtyTone: 'red',
    sourceTone: 'blue',
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

export const mockGuidelineRelatedQuestions = [
  'What is the target blood pressure in high risk patients?',
  'When to use combination therapy?',
  'Management in elderly (>65 years)?',
  'How to monitor treatment response?',
  'Lifestyle modification recommendations?'
];
