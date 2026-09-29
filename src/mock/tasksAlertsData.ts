import { TaskAlertItem } from '../types';

export const mockTasksAlerts: TaskAlertItem[] = [
  {
    id: 'ta-1',
    title: 'Review critical lab result',
    subtitle: 'High WBC count (14,500)',
    patientName: 'Mary Jeni',
    uhid: 'MHK202500215',
    type: 'Lab Alert',
    priority: 'High',
    dueDateTime: 'Today 09:30 AM',
    status: 'Pending',
    category: 'Critical'
  },
  {
    id: 'ta-2',
    title: 'Follow-up consultation',
    subtitle: 'Post-discharge review',
    patientName: 'Antony Raj',
    uhid: 'MHK202500143',
    type: 'Follow-up',
    priority: 'Medium',
    dueDateTime: 'Today 10:00 AM',
    status: 'Scheduled',
    category: 'Follow-up'
  },
  {
    id: 'ta-3',
    title: 'Prescription review',
    subtitle: 'Medication adherence',
    patientName: 'Selvi P',
    uhid: 'MHK202500176',
    type: 'Medication',
    priority: 'Medium',
    dueDateTime: 'Today 11:30 AM',
    status: 'Pending',
    category: 'Medication'
  },
  {
    id: 'ta-4',
    title: 'Review X-Ray report',
    subtitle: 'Chest X-Ray',
    patientName: 'Rajesh Kumar',
    uhid: 'MHK202500198',
    type: 'Imaging Alert',
    priority: 'High',
    dueDateTime: 'Today 12:15 PM',
    status: 'Pending',
    category: 'Critical'
  },
  {
    id: 'ta-5',
    title: 'Diabetes follow-up',
    subtitle: 'HbA1c review',
    patientName: 'Latha S',
    uhid: 'MHK202500132',
    type: 'Follow-up',
    priority: 'Medium',
    dueDateTime: 'Today 02:00 PM',
    status: 'Scheduled',
    category: 'Follow-up'
  },
  {
    id: 'ta-6',
    title: 'Review lab reports',
    subtitle: 'CBC, LFT',
    patientName: 'Jasmine R',
    uhid: 'MHK202500087',
    type: 'Lab Alert',
    priority: 'High',
    dueDateTime: 'Today 03:30 PM',
    status: 'Pending',
    category: 'Lab'
  },
  {
    id: 'ta-7',
    title: 'Call patient',
    subtitle: 'Share test results',
    patientName: 'Daniel',
    uhid: 'MHK202500101',
    type: 'Patient Communication',
    priority: 'Low',
    dueDateTime: 'Today 04:00 PM',
    status: 'Pending',
    category: 'System'
  },
  {
    id: 'ta-8',
    title: 'Complete discharge summary',
    subtitle: '',
    patientName: 'Selvi P',
    uhid: 'MHK202500176',
    type: 'Documentation',
    priority: 'Medium',
    dueDateTime: 'Today 05:00 PM',
    status: 'In Progress',
    category: 'System'
  },
  {
    id: 'ta-9',
    title: 'Vaccination reminder',
    subtitle: 'Influenza vaccine due',
    patientName: 'Arun Kumar',
    uhid: 'MHK202500321',
    type: 'Preventive Care',
    priority: 'Low',
    dueDateTime: '24 Sep 2026',
    status: 'Pending',
    category: 'Follow-up'
  },
  {
    id: 'ta-10',
    title: 'Drug interaction alert',
    subtitle: 'Amlodipine + Ibuprofen',
    patientName: 'Mary Jeni',
    uhid: 'MHK202500215',
    type: 'Medication Alert',
    priority: 'High',
    dueDateTime: 'Today 09:15 AM',
    status: 'Pending',
    category: 'Critical'
  },
  {
    id: 'ta-11',
    title: 'Review thyroid panel',
    subtitle: 'TSH, Free T4',
    patientName: 'Selvi P',
    uhid: 'MHK202500176',
    type: 'Lab Alert',
    priority: 'Medium',
    dueDateTime: 'Today 05:30 PM',
    status: 'Pending',
    category: 'Lab'
  },
  {
    id: 'ta-12',
    title: 'Insulin dose adjustment',
    subtitle: 'Fasting sugar 186 mg/dL',
    patientName: 'Latha S',
    uhid: 'MHK202500132',
    type: 'Medication',
    priority: 'High',
    dueDateTime: 'Today 06:00 PM',
    status: 'Pending',
    category: 'Medication'
  },
  {
    id: 'ta-13',
    title: 'Review MRI brain report',
    subtitle: 'Chronic headache work-up',
    patientName: 'Kumaravel',
    uhid: 'MHK202500244',
    type: 'Imaging Alert',
    priority: 'Medium',
    dueDateTime: '25 Sep 2026',
    status: 'Pending',
    category: 'Imaging'
  },
  {
    id: 'ta-14',
    title: 'Post-op wound review',
    subtitle: 'Day 7 dressing check',
    patientName: 'David Raj',
    uhid: 'MHK202500118',
    type: 'Follow-up',
    priority: 'Medium',
    dueDateTime: '25 Sep 2026',
    status: 'Scheduled',
    category: 'Follow-up'
  },
  {
    id: 'ta-15',
    title: 'Sign consultation notes',
    subtitle: '3 AI-drafted notes',
    patientName: 'Arun Kumar',
    uhid: 'MHK202500321',
    type: 'Documentation',
    priority: 'Low',
    dueDateTime: 'Today 06:30 PM',
    status: 'In Progress',
    category: 'System'
  },
  {
    id: 'ta-16',
    title: 'Potassium level critical',
    subtitle: 'K+ 6.1 mmol/L',
    patientName: 'Anbu Raj',
    uhid: 'MHK202500067',
    type: 'Lab Alert',
    priority: 'High',
    dueDateTime: 'Today 01:00 PM',
    status: 'Pending',
    category: 'Critical'
  },
  {
    id: 'ta-17',
    title: 'Call patient',
    subtitle: 'Explain MRI findings',
    patientName: 'Kumaravel',
    uhid: 'MHK202500244',
    type: 'Patient Communication',
    priority: 'Low',
    dueDateTime: '25 Sep 2026',
    status: 'Pending',
    category: 'System'
  },
  {
    id: 'ta-18',
    title: 'Warfarin INR review',
    subtitle: 'INR 3.8 (target 2–3)',
    patientName: 'Suresh P',
    uhid: 'MHK202500154',
    type: 'Medication Alert',
    priority: 'High',
    dueDateTime: 'Today 02:30 PM',
    status: 'Pending',
    category: 'Critical'
  },
  {
    id: 'ta-19',
    title: 'Hypertension follow-up',
    subtitle: 'BP log review',
    patientName: 'Mary Jeni',
    uhid: 'MHK202500215',
    type: 'Follow-up',
    priority: 'Medium',
    dueDateTime: '26 Sep 2026',
    status: 'Scheduled',
    category: 'Follow-up'
  },
  {
    id: 'ta-20',
    title: 'Review echo report',
    subtitle: 'LVEF 45%',
    patientName: 'Antony Raj',
    uhid: 'MHK202500143',
    type: 'Imaging Alert',
    priority: 'Medium',
    dueDateTime: '26 Sep 2026',
    status: 'Pending',
    category: 'Imaging'
  },
  {
    id: 'ta-21',
    title: 'Update allergy record',
    subtitle: 'Penicillin reaction',
    patientName: 'Rekha S',
    uhid: 'MHK202500189',
    type: 'Documentation',
    priority: 'Low',
    dueDateTime: '26 Sep 2026',
    status: 'Pending',
    category: 'System'
  },
  {
    id: 'ta-22',
    title: 'Hepatitis B booster',
    subtitle: 'Dose 3 due',
    patientName: 'Jasmine R',
    uhid: 'MHK202500087',
    type: 'Preventive Care',
    priority: 'Low',
    dueDateTime: '27 Sep 2026',
    status: 'Scheduled',
    category: 'Follow-up'
  },
  {
    id: 'ta-23',
    title: 'Lipid profile review',
    subtitle: 'LDL 168 mg/dL',
    patientName: 'Rajesh Kumar',
    uhid: 'MHK202500198',
    type: 'Lab Alert',
    priority: 'Medium',
    dueDateTime: '27 Sep 2026',
    status: 'Pending',
    category: 'Lab'
  },
  {
    id: 'ta-24',
    title: 'Refill request',
    subtitle: 'Metformin 500 mg',
    patientName: 'Latha S',
    uhid: 'MHK202500132',
    type: 'Medication',
    priority: 'Low',
    dueDateTime: '27 Sep 2026',
    status: 'Completed',
    category: 'Medication'
  },
  {
    id: 'ta-25',
    title: 'Referral letter',
    subtitle: 'Cardiology opinion',
    patientName: 'Antony Raj',
    uhid: 'MHK202500143',
    type: 'Documentation',
    priority: 'Medium',
    dueDateTime: '28 Sep 2026',
    status: 'In Progress',
    category: 'System'
  },
  {
    id: 'ta-26',
    title: 'Review CT chest',
    subtitle: 'Follow-up nodule',
    patientName: 'Rajesh Kumar',
    uhid: 'MHK202500198',
    type: 'Imaging Alert',
    priority: 'High',
    dueDateTime: '28 Sep 2026',
    status: 'Pending',
    category: 'Critical'
  },
  {
    id: 'ta-27',
    title: 'Diet counselling call',
    subtitle: 'Diabetes education',
    patientName: 'Selvi A',
    uhid: 'MHK202500265',
    type: 'Patient Communication',
    priority: 'Low',
    dueDateTime: '29 Sep 2026',
    status: 'Scheduled',
    category: 'Follow-up'
  },
  {
    id: 'ta-28',
    title: 'Annual health check',
    subtitle: 'Due for renewal',
    patientName: 'Maria Joseph',
    uhid: 'MHK202500302',
    type: 'Preventive Care',
    priority: 'Low',
    dueDateTime: '30 Sep 2026',
    status: 'Pending',
    category: 'Follow-up'
  }
];

export const mockCriticalAlerts = [
  { id: 'ca-1', title: 'High WBC count: 14,500', patient: 'Mary Jeni | CBC', time: '09:30 AM', badge: 'Lab', type: 'error' },
  { id: 'ca-2', title: 'Chest X-Ray abnormal', patient: 'Rajesh Kumar', time: '12:15 PM', badge: 'Imaging', type: 'error' },
  { id: 'ca-3', title: 'Drug interaction: Amlodipine + Ibuprofen', patient: 'Mary Jeni', time: '09:15 AM', badge: 'Medication', type: 'warning' },
  { id: 'ca-4', title: 'Critical BP: 180/110 mmHg', patient: 'Antony Raj', time: '10:45 AM', badge: 'Vitals', type: 'error' }
];

export const mockAITaskSuggestions = [
  { id: 'ts-1', text: 'Order follow-up HbA1c for Latha S (diabetes)', checked: false },
  { id: 'ts-2', text: 'Review pending imaging reports (2 patients)', checked: true },
  { id: 'ts-3', text: 'Schedule BP review for high-risk patients', checked: false },
  { id: 'ts-4', text: 'Check medication adherence for Selvi P', checked: false },
  { id: 'ts-5', text: 'Follow up on abnormal lab results (4 patients)', checked: false }
];

export const mockTodayReminders = [
  { id: 'rm-1', time: '09:00 AM', task: 'Review lab results (CBC)', patient: 'Mary Jeni', kind: 'lab' },
  { id: 'rm-2', time: '10:00 AM', task: 'Follow-up consultation', patient: 'Antony Raj', kind: 'follow-up' },
  { id: 'rm-3', time: '12:15 PM', task: 'Review imaging report', patient: 'Rajesh Kumar', kind: 'imaging' },
  { id: 'rm-4', time: '02:00 PM', task: 'Diabetes follow-up', patient: 'Latha S', kind: 'diabetes' },
  { id: 'rm-5', time: '04:00 PM', task: 'Call patient', patient: 'Daniel', kind: 'call' }
] as const;
