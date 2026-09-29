import { MessageThread } from '../types';

export const mockMessageThreads: MessageThread[] = [
  {
    id: 'th-1',
    contactName: 'Mary Jeni',
    uhid: 'MHK202500215',
    age: 28,
    gender: 'Female',
    category: 'Patient',
    preview: 'Thank you doctor. I will follow the same.',
    time: '10:32 AM',
    unreadCount: 2,
    online: true,
    condition: 'Type 2 Diabetes Mellitus',
    messages: [
      { id: 'm1', sender: 'patient', text: 'Good morning doctor. I have taken the medicines as you advised. My BP is better now.', time: '10:12 AM' },
      { id: 'm2', sender: 'doctor', text: "Good morning Mary. That's good to hear. How are you feeling now? Any headache or giddiness?", time: '10:14 AM', status: 'read' },
      { id: 'm3', sender: 'patient', text: 'I am feeling much better. No headache now.', time: '10:18 AM' },
      { id: 'm4', sender: 'doctor', text: 'Continue the same medications. Please monitor your BP daily and share the readings here.', time: '10:20 AM', status: 'read' },
      { id: 'm5', sender: 'patient', text: 'Sure doctor. I will share the readings.', time: '10:22 AM' },
      { id: 'm6', sender: 'patient', text: '', time: '10:25 AM', attachment: { type: 'image', name: 'BP Reading - 24 Sep 2026', size: 'Image • 248 KB' } },
      { id: 'm7', sender: 'doctor', text: 'Great. Your BP looks good. Continue the same dose. Next follow-up on 26 Sep as scheduled.', time: '10:28 AM', status: 'read' },
      { id: 'm8', sender: 'patient', text: 'Thank you doctor. I will follow the same.', time: '10:32 AM' }
    ]
  },
  {
    id: 'th-2',
    contactName: 'Lab Department',
    category: 'Lab',
    preview: 'CBC report for Antony Raj is ready.',
    time: '10:15 AM',
    unreadCount: 1,
    online: true,
    messages: [
      { id: 'm21', sender: 'staff', text: 'CBC report for Antony Raj is ready and uploaded to EMR.', time: '10:15 AM' }
    ]
  },
  {
    id: 'th-3',
    contactName: 'Pharmacy',
    category: 'Pharmacy',
    preview: 'Metformin 500mg stock low.',
    time: '09:48 AM',
    unreadCount: 0,
    online: true,
    messages: [
      { id: 'm31', sender: 'staff', text: 'Metformin 500mg stock low in OPD dispensary. Restock scheduled today.', time: '09:48 AM' }
    ]
  },
  {
    id: 'th-4',
    contactName: 'Radiology',
    category: 'Imaging',
    preview: 'X-ray report uploaded for Rajesh.',
    time: 'Yesterday',
    unreadCount: 0,
    messages: [
      { id: 'm41', sender: 'staff', text: 'Chest X-Ray PA view report uploaded for Rajesh Kumar.', time: 'Yesterday' }
    ]
  },
  {
    id: 'th-5',
    contactName: 'Nursing Station',
    category: 'Nursing',
    preview: 'Bed 12 patient vitals updated.',
    time: 'Yesterday',
    unreadCount: 0,
    messages: [
      { id: 'm51', sender: 'staff', text: 'Bed 12 (David Raj) morning vitals recorded. BP 130/80, SpO2 99%.', time: 'Yesterday' }
    ]
  },
  {
    id: 'th-6',
    contactName: 'Antony Raj',
    uhid: 'MHK202500143',
    age: 47,
    gender: 'Male',
    category: 'Patient',
    preview: 'When can I come for follow-up?',
    time: '22 Sep',
    unreadCount: 0,
    messages: [
      { id: 'm61', sender: 'patient', text: 'When can I come for follow-up?', time: '22 Sep' }
    ]
  },
  {
    id: 'th-7',
    contactName: 'Selvi P',
    uhid: 'MHK202500176',
    age: 62,
    gender: 'Female',
    category: 'Patient',
    preview: 'I have completed the medicines.',
    time: '22 Sep',
    unreadCount: 0,
    messages: [
      { id: 'm71', sender: 'patient', text: 'I have completed the medicines given last time.', time: '22 Sep' }
    ]
  },
  {
    id: 'th-8',
    contactName: 'Cardiology Dept.',
    category: 'Department',
    preview: 'Re: referral for ECG review',
    time: '21 Sep',
    unreadCount: 0,
    messages: [
      { id: 'm81', sender: 'staff', text: 'Re: referral for ECG review for James Wilson.', time: '21 Sep' }
    ]
  },
  {
    id: 'th-9',
    contactName: 'Hospital Admin',
    category: 'Admin',
    preview: 'Circular: Holiday on Oct 2nd',
    time: '21 Sep',
    unreadCount: 0,
    messages: [
      { id: 'm91', sender: 'staff', text: 'Circular: Outpatient clinics will be closed on Gandhi Jayanti (Oct 2nd). Emergency services 24/7.', time: '21 Sep' }
    ]
  },
  {
    id: 'th-10',
    contactName: 'Latha S',
    uhid: 'MHK202500132',
    age: 39,
    gender: 'Female',
    category: 'Patient',
    preview: 'Lab reports attached.',
    time: '20 Sep',
    unreadCount: 0,
    messages: [
      { id: 'm101', sender: 'patient', text: 'Lab reports attached for doctor review.', time: '20 Sep' }
    ]
  }
];

export const mockMessageTemplates = [
  'Follow-up Reminder',
  'Medication Adherence',
  'Lab Report Ready',
  'Appointment Confirmation',
  'General Instructions'
];
