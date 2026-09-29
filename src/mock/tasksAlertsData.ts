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
    subtitle: 'Surgical ward discharge',
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
