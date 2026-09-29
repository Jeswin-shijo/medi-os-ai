export interface VoiceTranscriptLine {
  id: string;
  time: string;
  speaker: 'Doctor' | 'Patient';
  text: string;
}

export const mockVoiceTranscript: VoiceTranscriptLine[] = [
  { id: 'vt-1', time: '00:00', speaker: 'Doctor', text: 'Good morning Arun, how are you feeling today?' },
  { id: 'vt-2', time: '00:05', speaker: 'Patient', text: 'I am feeling better doctor. After taking the medicines my BP is under control. But I still have occasional headache.' },
  { id: 'vt-3', time: '00:12', speaker: 'Doctor', text: 'OK. Are you taking amlodipine 5 mg regularly?' },
  { id: 'vt-4', time: '00:15', speaker: 'Patient', text: 'Yes doctor, daily in the morning. I am also taking metformin 500 mg twice daily.' },
  { id: 'vt-5', time: '00:22', speaker: 'Doctor', text: 'Any side effects like swelling, cough or giddiness?' },
  { id: 'vt-6', time: '00:26', speaker: 'Patient', text: 'No doctor, only mild headache sometimes.' },
  { id: 'vt-7', time: '00:31', speaker: 'Doctor', text: 'OK. Your last HbA1c was 7.2. We will repeat the blood tests next month. Continue the same medications and maintain diet and exercise.' },
  { id: 'vt-8', time: '00:45', speaker: 'Patient', text: 'Sure doctor.' }
];

export const mockGeneratedSOAP = {
  subjective: 'Patient reports feeling better after taking medications. BP under control. Occasional headache. No giddiness, cough or swelling. Denies chest pain, breathlessness, or other complaints.',
  objective: [
    'BP: 128/82 mmHg (today)',
    'Pulse: 78/min, regular',
    'Weight: 72 kg',
    'General: Alert, oriented, no distress',
    'Systemic Examination: CVS – S1 S2 normal, RS – clear, P/A – soft, non-tender'
  ],
  assessment: [
    'Hypertension – controlled on current medication',
    'Type 2 Diabetes Mellitus – on treatment (last HbA1c 7.2)',
    'Occasional headache – likely tension/related to BP, to monitor'
  ],
  plan: [
    'Continue Amlodipine 5 mg OD',
    'Continue Metformin 500 mg BD',
    'Repeat HbA1c, CBC, RFT, LFT next month',
    'Advice low salt diet, regular exercise',
    'Monitor BP at home',
    'Follow up after 4 weeks or earlier if symptoms persist'
  ]
};

export const mockQuickTemplates = [
  { id: 'qt-1', title: 'SOAP Note', subtitle: 'General consultation' },
  { id: 'qt-2', title: 'Follow-up Note', subtitle: 'Review & monitoring' },
  { id: 'qt-3', title: 'Discharge Summary', subtitle: 'Hospital discharge' },
  { id: 'qt-4', title: 'Procedure Note', subtitle: 'Minor procedures' },
  { id: 'qt-5', title: 'Referral Note', subtitle: 'Specialist referral' },
  { id: 'qt-6', title: 'Phone Consultation', subtitle: 'Telemedicine' }
];
