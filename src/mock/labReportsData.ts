import { LabTestReport } from '../types';

export const mockLabReports: LabTestReport[] = [
  {
    id: 'lab-1',
    uhid: 'MHK202500321',
    testName: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    date: '12 Sep 2026',
    time: '09:30 AM',
    status: 'Completed',
    groups: [
      {
        category: 'Red Blood Cells (RBC)',
        parameters: [
          { id: 'p1', name: 'Hemoglobin (Hb)', result: 10.4, referenceRange: '13.0 – 17.0', unit: 'g/dL', status: 'Low', relativePosition: 22 },
          { id: 'p2', name: 'RBC Count', result: 4.1, referenceRange: '4.5 – 5.9', unit: 'mill/µL', status: 'Low', relativePosition: 26 },
          { id: 'p3', name: 'Hematocrit (HCT)', result: 32.8, referenceRange: '40 – 50', unit: '%', status: 'Low', relativePosition: 20 },
          { id: 'p4', name: 'MCV', result: 80, referenceRange: '83 – 101', unit: 'fL', status: 'Low', relativePosition: 28 },
          { id: 'p5', name: 'MCH', result: 26, referenceRange: '27 – 32', unit: 'pg', status: 'Low', relativePosition: 25 },
          { id: 'p6', name: 'MCHC', result: '32.0', referenceRange: '31 – 36', unit: 'g/dL', status: 'Normal', relativePosition: 50 },
          { id: 'p7', name: 'RDW', result: 14.6, referenceRange: '11.5 – 14.5', unit: '%', status: 'High', relativePosition: 88 }
        ]
      },
      {
        category: 'White Blood Cells (WBC)',
        parameters: [
          { id: 'p8', name: 'Total WBC Count', result: '10,900', referenceRange: '4,000 – 11,000', unit: '/µL', status: 'Normal', relativePosition: 82 },
          { id: 'p9', name: 'Neutrophils', result: 68, referenceRange: '40 – 75', unit: '%', status: 'Normal', relativePosition: 65 },
          { id: 'p10', name: 'Lymphocytes', result: 22, referenceRange: '20 – 40', unit: '%', status: 'Normal', relativePosition: 40 },
          { id: 'p11', name: 'Monocytes', result: 6, referenceRange: '2 – 10', unit: '%', status: 'Normal', relativePosition: 50 },
          { id: 'p12', name: 'Eosinophils', result: 3, referenceRange: '1 – 6', unit: '%', status: 'Normal', relativePosition: 45 },
          { id: 'p13', name: 'Basophils', result: 1, referenceRange: '0 – 2', unit: '%', status: 'Normal', relativePosition: 50 }
        ]
      },
      {
        category: 'Platelets',
        parameters: [
          { id: 'p14', name: 'Platelet Count', result: 2.1, referenceRange: '1.5 – 4.0', unit: 'lakhs/µL', status: 'Normal', relativePosition: 55 },
          { id: 'p15', name: 'MPV', result: 10.2, referenceRange: '7.4 – 10.4', unit: 'fL', status: 'Normal', relativePosition: 75 }
        ]
      }
    ],
    aiSummary: {
      findings: [
        'Mild anemia – Hb 10.4 g/dL (low)',
        'RBC indices suggest possible iron deficiency (MCV low, RDW high)',
        'WBC count within normal range',
        'Platelets normal'
      ],
      interpretation: 'Findings are suggestive of mild microcytic anemia, likely due to iron deficiency. Correlate with clinical history, dietary intake, and consider serum ferritin, iron studies if clinically indicated.',
      recommendations: [
        'Consider Iron profile (Serum Ferritin, TIBC, Serum Iron)',
        'Evaluate for possible nutritional deficiency or chronic blood loss',
        'Repeat CBC after 4–6 weeks of treatment',
        'Correlate with clinical symptoms (fatigue, pallor, etc.)'
      ]
    },
    trend: {
      parameter: 'Hemoglobin (Hb)',
      history: [
        { date: 'Jan 2026', value: 12.8 },
        { date: 'Mar 2026', value: 12.1 },
        { date: 'Jun 2026', value: 11.6 },
        { date: 'Sep 2026', value: 10.4 }
      ]
    }
  },
  {
    id: 'lab-2',
    uhid: 'MHK202500321',
    testName: 'Liver Function Test (LFT)',
    category: 'Biochemistry',
    date: '12 Sep 2026',
    time: '09:30 AM',
    status: 'Completed',
    groups: [
      {
        category: 'Enzymes & Bilirubin',
        parameters: [
          { id: 'l1', name: 'SGOT (AST)', result: 28, referenceRange: '10 – 40', unit: 'U/L', status: 'Normal', relativePosition: 50 },
          { id: 'l2', name: 'SGPT (ALT)', result: 34, referenceRange: '7 – 56', unit: 'U/L', status: 'Normal', relativePosition: 52 },
          { id: 'l3', name: 'Total Bilirubin', result: 0.8, referenceRange: '0.2 – 1.2', unit: 'mg/dL', status: 'Normal', relativePosition: 48 },
          { id: 'l4', name: 'Alkaline Phosphatase', result: 75, referenceRange: '44 – 147', unit: 'U/L', status: 'Normal', relativePosition: 45 }
        ]
      }
    ],
    aiSummary: {
      findings: ['All liver enzymes and bilirubin are strictly within normal reference limits.'],
      interpretation: 'Normal liver functional parameters without evidence of hepatocellular damage or cholestasis.',
      recommendations: ['Routine follow-up in 6 months during annual health check.']
    }
  },
  {
    id: 'lab-3',
    uhid: 'MHK202500321',
    testName: 'Renal Function Test (RFT)',
    category: 'Biochemistry',
    date: '12 Sep 2026',
    time: '09:30 AM',
    status: 'Completed',
    groups: [
      {
        category: 'Renal Markers',
        parameters: [
          { id: 'r1', name: 'Serum Creatinine', result: 1.0, referenceRange: '0.7 – 1.3', unit: 'mg/dL', status: 'Normal', relativePosition: 50 },
          { id: 'r2', name: 'Blood Urea', result: 24, referenceRange: '15 – 45', unit: 'mg/dL', status: 'Normal', relativePosition: 40 },
          { id: 'r3', name: 'eGFR', result: 92, referenceRange: '> 90', unit: 'mL/min/1.73m²', status: 'Normal', relativePosition: 85 }
        ]
      }
    ],
    aiSummary: {
      findings: ['Serum creatinine is 1.0 mg/dL with healthy estimated GFR of 92.'],
      interpretation: 'Preserved renal filtration function.',
      recommendations: ['Monitor annually or as indicated given background hypertension.']
    }
  },
  {
    id: 'lab-4',
    uhid: 'MHK202500321',
    testName: 'HbA1c',
    category: 'Blood',
    date: '12 Sep 2026',
    time: '09:30 AM',
    status: 'Abnormal',
    groups: [
      {
        category: 'Glycemic Control',
        parameters: [
          { id: 'h1', name: 'Glycated Hemoglobin (HbA1c)', result: 7.8, referenceRange: '< 5.7 (Normal), < 7.0 (Target)', unit: '%', status: 'High', relativePosition: 85 },
          { id: 'h2', name: 'Estimated Average Glucose', result: 177, referenceRange: '< 154', unit: 'mg/dL', status: 'High', relativePosition: 82 }
        ]
      }
    ],
    aiSummary: {
      findings: ['HbA1c of 7.8% indicates sub-optimal glycemic control above target threshold of 7.0%.'],
      interpretation: 'Chronic hyperglycemia over past 3 months requiring dietary reinforcement and possible dose titration.',
      recommendations: ['Reinforce low glycemic index diet and exercise', 'Review Metformin dosage', 'Repeat HbA1c in 3 months']
    }
  },
  {
    id: 'lab-5',
    uhid: 'MHK202500321',
    testName: 'Lipid Profile',
    category: 'Biochemistry',
    date: '12 Sep 2026',
    time: '09:30 AM',
    status: 'Completed',
    groups: [
      {
        category: 'Lipid Panel',
        parameters: [
          { id: 'lp1', name: 'Total Cholesterol', result: 198, referenceRange: '< 200', unit: 'mg/dL', status: 'Normal', relativePosition: 68 },
          { id: 'lp2', name: 'LDL Cholesterol', result: 118, referenceRange: '< 100', unit: 'mg/dL', status: 'High', relativePosition: 76 },
          { id: 'lp3', name: 'HDL Cholesterol', result: 42, referenceRange: '> 40', unit: 'mg/dL', status: 'Normal', relativePosition: 45 },
          { id: 'lp4', name: 'Triglycerides', result: 165, referenceRange: '< 150', unit: 'mg/dL', status: 'High', relativePosition: 72 }
        ]
      }
    ],
    aiSummary: {
      findings: ['Borderline high LDL (118 mg/dL) and triglycerides (165 mg/dL).'],
      interpretation: 'Mild dyslipidemia. Statin therapy is appropriate.',
      recommendations: ['Continue Atorvastatin 10 mg', 'Adopt low-fat Mediterranean diet']
    }
  },
  {
    id: 'lab-6',
    uhid: 'MHK202500321',
    testName: 'Thyroid Profile (TFT)',
    category: 'Biochemistry',
    date: '21 Mar 2026',
    time: '10:00 AM',
    status: 'Completed',
    groups: [
      {
        category: 'Thyroid Hormones',
        parameters: [
          { id: 't1', name: 'TSH', result: 2.45, referenceRange: '0.4 – 4.5', unit: 'µIU/mL', status: 'Normal', relativePosition: 50 },
          { id: 't2', name: 'Free T3', result: 3.1, referenceRange: '2.0 – 4.4', unit: 'pg/mL', status: 'Normal', relativePosition: 48 },
          { id: 't3', name: 'Free T4', result: 1.2, referenceRange: '0.8 – 1.8', unit: 'ng/dL', status: 'Normal', relativePosition: 52 }
        ]
      }
    ],
    aiSummary: {
      findings: ['Euthyroid state with normal TSH.'],
      interpretation: 'Thyroid axis functioning normally.',
      recommendations: ['No active intervention required.']
    }
  },
  {
    id: 'lab-7',
    uhid: 'MHK202500321',
    testName: 'Urine Routine & Microscopy',
    category: 'Urine',
    date: '15 Feb 2026',
    time: '08:45 AM',
    status: 'Completed',
    groups: [
      {
        category: 'Microscopy',
        parameters: [
          { id: 'u1', name: 'Urine Protein / Albumin', result: 'Nil', referenceRange: 'Nil', unit: '', status: 'Normal', relativePosition: 50 },
          { id: 'u2', name: 'Urine Glucose', result: 'Nil', referenceRange: 'Nil', unit: '', status: 'Normal', relativePosition: 50 },
          { id: 'u3', name: 'Pus Cells', result: '1-2', referenceRange: '0-5', unit: '/hpf', status: 'Normal', relativePosition: 30 }
        ]
      }
    ],
    aiSummary: {
      findings: ['Negative for proteinuria and glycosuria.'],
      interpretation: 'No signs of urinary tract infection or microalbuminuria.',
      recommendations: ['Routine annual monitoring.']
    }
  },
  {
    id: 'lab-8',
    uhid: 'MHK202500321',
    testName: 'CRP',
    category: 'Biochemistry',
    date: '10 Jan 2026',
    time: '08:15 AM',
    status: 'Completed',
    groups: [
      {
        category: 'Inflammatory Markers',
        parameters: [
          { id: 'cr1', name: 'C-Reactive Protein (Quantitative)', result: 4.2, referenceRange: '< 5.0', unit: 'mg/L', status: 'Normal', relativePosition: 60 }
        ]
      }
    ],
    aiSummary: {
      findings: ['CRP within normal limits at 4.2 mg/L.'],
      interpretation: 'No active systemic high-grade inflammation.',
      recommendations: ['None.']
    }
  }
];
