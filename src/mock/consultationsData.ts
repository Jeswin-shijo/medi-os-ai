export const mockAIConsiderations = [
  {
    id: 'c1',
    title: '1. Acute upper respiratory infection',
    bullets: [
      'Fever, cough, body ache for 3 days. Consider viral etiology.',
      'Review for red flags: persistent fever, breathlessness.'
    ],
    applied: false
  },
  {
    id: 'c2',
    title: '2. Evaluate need for further investigation',
    bullets: [
      'If symptoms persist > 5 days, consider CBC, CRP, Chest X-ray.'
    ],
    applied: false
  },
  {
    id: 'c3',
    title: '3. Diabetes and Hypertension',
    bullets: [
      'Continue current medications. Monitor BP and sugar levels.'
    ],
    applied: false
  }
];

export const mockSuggestedInvestigations = [
  'CBC',
  'CRP (if indicated)',
  'Chest X-Ray (if symptoms persist)'
];

export const mockSuggestedTreatmentPlan = [
  'Symptomatic treatment',
  'Review after 5 days'
];

export const mockPatientEducation = [
  'Adequate fluids and rest',
  'Mask if in public places',
  'Seek medical attention if fever persists, breathlessness or chest pain'
];

/** Medicines prescribed in today's consultation (Consultation screen prescription table). */
export interface ConsultationRxRow {
  id: string;
  medicine: string;
  dose: string;
  frequency: string;
  duration: string;
  instruction: string;
}

/** Quick prescription sets for the "Add from Template" picker. */
export const mockRxTemplates: Record<string, Omit<ConsultationRxRow, 'id'>[]> = {
  Common: [
    { medicine: 'Paracetamol', dose: '650 mg', frequency: 'TID', duration: '3 Days', instruction: 'After food' },
    { medicine: 'Cetirizine', dose: '10 mg', frequency: 'HS', duration: '5 Days', instruction: 'At night' }
  ],
  Hypertension: [
    { medicine: 'Amlodipine', dose: '5 mg', frequency: 'OD', duration: 'Continue', instruction: 'Morning' },
    { medicine: 'Telmisartan', dose: '40 mg', frequency: 'OD', duration: 'Continue', instruction: 'Morning' }
  ],
  Diabetes: [
    { medicine: 'Metformin', dose: '500 mg', frequency: 'BD', duration: 'Continue', instruction: 'After food' },
    { medicine: 'Glimepiride', dose: '1 mg', frequency: 'OD', duration: 'Continue', instruction: 'Before food' }
  ]
};

/** SOAP note starting points for the Consultation Workspace "Templates" tab. */
export const mockSoapTemplates = [
  {
    id: 'st-1',
    title: 'Fever / URTI',
    subtitle: 'Acute febrile illness',
    subjective: 'Fever for __ days with cough / cold / body ache.\nNo breathlessness. No chest pain.',
    objective: 'General condition: Stable\nRS: Bilateral air entry present, no added sounds\nCVS: S1 S2 normal',
    assessment: 'Acute upper respiratory infection (likely viral).',
    plan: '• Tab Paracetamol 650 mg – TID for 3 days\n• Adequate fluids and rest\n• Review if symptoms persist'
  },
  {
    id: 'st-2',
    title: 'Hypertension Review',
    subtitle: 'Chronic disease follow-up',
    subjective: 'Here for BP review. Compliant with medication.\nNo headache, giddiness or chest pain.',
    objective: 'BP: ___ mmHg  HR: ___ bpm\nCVS: S1 S2 normal',
    assessment: 'Essential hypertension – control: ___',
    plan: '• Continue Amlodipine 5 mg OD\n• Low salt diet, regular exercise\n• Home BP monitoring\n• Review after 4 weeks'
  },
  {
    id: 'st-3',
    title: 'Diabetes Review',
    subtitle: 'Glycaemic control check',
    subjective: 'Here for diabetes review. No hypoglycaemic episodes.\nNo polyuria / polydipsia.',
    objective: 'FBS: ___ mg/dL  PPBS: ___ mg/dL\nFeet: No ulcers, sensation intact',
    assessment: 'Type 2 diabetes mellitus – control: ___',
    plan: '• Continue Metformin 500 mg BD\n• Repeat HbA1c after 3 months\n• Diet and exercise counselling'
  }
];
