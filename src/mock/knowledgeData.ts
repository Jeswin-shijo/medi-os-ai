import { KnowledgeArticle } from '../types';

export const mockKnowledgeTopics = [
  { id: 'all', title: 'All Topics', count: 1245 },
  { id: 'guidelines', title: 'Clinical Guidelines', count: 320 },
  { id: 'protocols', title: 'Treatment Protocols', count: 180 },
  { id: 'drugs', title: 'Drug Database', count: 450 },
  { id: 'sops', title: 'SOPs', count: 95 },
  { id: 'policies', title: 'Hospital Policies', count: 75 },
  { id: 'education', title: 'Patient Education', count: 120 }
];

export const mockFeaturedKnowledge: { id: string; title: string; subtitle: string; tag: string; date: string; tone: 'green' | 'orange' | 'blue' }[] = [
  {
    id: 'fk-1',
    title: 'Hypertension Management Guidelines',
    subtitle: 'Latest evidence-based guidelines for diagnosis and treatment',
    tag: 'Guideline',
    date: 'Updated 12 Sep 2026',
    tone: 'green'
  },
  {
    id: 'fk-2',
    title: 'Antibiotic Stewardship Protocol',
    subtitle: 'Rational antibiotic use and duration guidelines',
    tag: 'Protocol',
    date: 'Updated 05 Sep 2026',
    tone: 'orange'
  },
  {
    id: 'fk-3',
    title: 'Sepsis Management',
    subtitle: 'Early recognition and treatment protocol',
    tag: 'Protocol',
    date: 'Updated 01 Sep 2026',
    tone: 'orange'
  },
  {
    id: 'fk-4',
    title: 'Diabetes Management',
    subtitle: 'Inpatient and outpatient management guidelines',
    tag: 'Guideline',
    date: 'Updated 28 Aug 2026',
    tone: 'blue'
  }
];

export const mockRecentArticles: KnowledgeArticle[] = [
  {
    id: 'ka-1',
    title: 'Acute Coronary Syndrome Management',
    category: 'Cardiology',
    type: 'Guideline',
    lastUpdated: '18 Sep 2026',
    summary: 'Clinical pathway for acute ST and non-ST segment elevation myocardial infarction management.'
  },
  {
    id: 'ka-2',
    title: 'Asthma Exacerbation Protocol',
    category: 'Pulmonology',
    type: 'Protocol',
    lastUpdated: '16 Sep 2026',
    summary: 'Emergency stepped assessment, nebulization protocols, and systemic steroid guidelines.'
  },
  {
    id: 'ka-3',
    title: 'Normal Lab Reference Ranges',
    category: 'Laboratory',
    type: 'Reference',
    lastUpdated: '15 Sep 2026',
    summary: 'Comprehensive standardized adult and pediatric reference intervals for St. Mary’s pathology.'
  },
  {
    id: 'ka-4',
    title: 'Pre-operative Assessment',
    category: 'Surgery',
    type: 'SOP',
    lastUpdated: '12 Sep 2026',
    summary: 'Standard operating procedure for pre-anesthetic clearance and surgical risk stratification.'
  },
  {
    id: 'ka-5',
    title: 'Pediatric Fever Management',
    category: 'Pediatrics',
    type: 'Guideline',
    lastUpdated: '10 Sep 2026',
    summary: 'Evaluation and antipyretic dosing guidelines for pediatric outpatient and emergency visits.'
  },
  {
    id: 'ka-6',
    title: 'Drug Interaction Guide',
    category: 'Pharmacology',
    type: 'Reference',
    lastUpdated: '08 Sep 2026',
    summary: 'High-risk drug-drug interaction matrix and contraindication guidelines.'
  }
];

export const mockKnowledgePromptQuestions = [
  'What is the protocol for managing dengue?',
  'Recommended antibiotics for UTI?',
  'Pre-operative checklist for surgery?',
  'Normal vital signs range for adults?',
  'Drug interactions with warfarin?'
];

/** Left "Categories" list on Hospital Knowledge (icons come from specialtyVisuals). */
export const mockKnowledgeCategories: { name: string; count: number; color?: string }[] = [
  { name: 'All Topics', count: 1245 },
  { name: 'Internal Medicine', count: 180 },
  { name: 'Emergency Medicine', count: 120 },
  { name: 'Surgery', count: 95 },
  { name: 'Obstetrics & Gynecology', count: 90 },
  { name: 'Pediatrics', count: 85 },
  { name: 'Cardiology', count: 80 },
  { name: 'Radiology', count: 75 },
  { name: 'Anesthesiology', count: 60 },
  { name: 'Orthopedics', count: 55 },
  { name: 'Infectious Diseases', count: 50 },
  { name: 'Endocrinology', count: 45, color: 'var(--purple-ai)' },
  { name: 'Pulmonology', count: 40 },
  { name: 'Nephrology', count: 40 },
  { name: 'Gastroenterology', count: 40, color: 'var(--blue-primary)' },
  { name: 'Dermatology', count: 35 },
  { name: 'ENT', count: 30 },
  { name: 'Ophthalmology', count: 30 },
  { name: 'Oncology', count: 25 },
  { name: 'Hospital Administration', count: 25 }
];

export const mockRecentlyViewed: { id: string; title: string; time: string; kind: 'guideline' | 'lab' | 'protocol' | 'alert' }[] = [
  { id: 'rv-1', title: 'Hypertension Management Guidelines', time: '10 min ago', kind: 'guideline' },
  { id: 'rv-2', title: 'Normal Lab Reference Ranges', time: '2 hours ago', kind: 'lab' },
  { id: 'rv-3', title: 'Sepsis Management Protocol', time: '5 hours ago', kind: 'protocol' },
  { id: 'rv-4', title: 'Antibiotic Stewardship Protocol', time: '1 day ago', kind: 'alert' }
];
