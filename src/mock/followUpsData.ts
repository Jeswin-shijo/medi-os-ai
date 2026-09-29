import { FollowUpItem } from '../types';

export const mockFollowUps: FollowUpItem[] = [
  {
    id: 'fu-1',
    uhid: 'MHK202500321',
    patientName: 'Arun Kumar',
    age: 34,
    gender: 'Male',
    lastVisit: '12 Sep 2026',
    followUpDate: '26 Sep 2026',
    followUpTime: '10:30 AM',
    followUpType: 'Review',
    status: 'Scheduled',
    assignedTo: 'Dr. Shajin',
    reminders: '1 day before (SMS + WhatsApp)'
  },
  {
    id: 'fu-2',
    uhid: 'MHK202500215',
    patientName: 'Mary Jeni',
    age: 28,
    gender: 'Female',
    lastVisit: '10 Sep 2026',
    followUpDate: '24 Sep 2026',
    followUpTime: '10:00 AM',
    followUpType: 'Lab Review',
    status: 'Completed',
    assignedTo: 'Dr. Shajin',
    reminders: 'Automated SMS sent'
  },
  {
    id: 'fu-3',
    uhid: 'MHK202500198',
    patientName: 'Rajesh Kumar',
    age: 56,
    gender: 'Male',
    lastVisit: '05 Sep 2026',
    followUpDate: '22 Sep 2026',
    followUpTime: '11:30 AM',
    followUpType: 'Medication Review',
    status: 'Pending',
    assignedTo: 'Dr. Shajin',
    reminders: 'SMS scheduled'
  },
  {
    id: 'fu-4',
    uhid: 'MHK202500176',
    patientName: 'Selvi P',
    age: 62,
    gender: 'Female',
    lastVisit: '01 Sep 2026',
    followUpDate: '20 Sep 2026',
    followUpTime: '09:00 AM',
    followUpType: 'Chronic Care',
    status: 'Missed',
    assignedTo: 'Dr. Shajin',
    reminders: 'Patient unreachable'
  },
  {
    id: 'fu-5',
    uhid: 'MHK202500143',
    patientName: 'Antony Raj',
    age: 47,
    gender: 'Male',
    lastVisit: '28 Aug 2026',
    followUpDate: '18 Sep 2026',
    followUpTime: '03:30 PM',
    followUpType: 'Post-procedure',
    status: 'Completed',
    assignedTo: 'Dr. Shajin',
    reminders: 'Completed successfully'
  },
  {
    id: 'fu-6',
    uhid: 'MHK202500132',
    patientName: 'Latha S',
    age: 39,
    gender: 'Female',
    lastVisit: '26 Aug 2026',
    followUpDate: '16 Sep 2026',
    followUpTime: '10:00 AM',
    followUpType: 'Follow-up Test',
    status: 'Completed',
    assignedTo: 'Dr. Shajin',
    reminders: 'Lab visit verified'
  },
  {
    id: 'fu-7',
    uhid: 'MHK202500101',
    patientName: 'Daniel',
    age: 71,
    gender: 'Male',
    lastVisit: '12 Aug 2026',
    followUpDate: '15 Sep 2026',
    followUpTime: '11:00 AM',
    followUpType: 'Chronic Care',
    status: 'Pending',
    assignedTo: 'Dr. Shajin',
    reminders: 'Voice call reminder pending'
  },
  {
    id: 'fu-8',
    uhid: 'MHK202500087',
    patientName: 'Jasmine R',
    age: 32,
    gender: 'Female',
    lastVisit: '10 Aug 2026',
    followUpDate: '14 Sep 2026',
    followUpTime: '02:30 PM',
    followUpType: 'Medication Review',
    status: 'Overdue',
    assignedTo: 'Dr. Shajin',
    reminders: 'Overdue alert dispatched'
  }
];

export const mockAIFollowUpRecommendations = [
  'Consider BP and HbA1c review for better control.',
  'Repeat lipid profile after 3 months.',
  'Monitor renal function due to long-term Metformin.',
  'Schedule dietary counseling for weight management.',
  'Suggest eye examination for diabetic retinopathy screening.',
  'Ensure medication adherence and lifestyle modification.'
];
