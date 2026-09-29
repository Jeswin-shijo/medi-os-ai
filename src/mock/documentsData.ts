import { ClinicalDocument } from '../types';

export const mockClinicalDocuments: ClinicalDocument[] = [
  {
    id: 'doc-1',
    uhid: 'MHK202500321',
    title: 'Emergency Observation & Discharge Summary',
    category: 'Discharge Summary',
    date: '10 Jan 2026',
    author: 'Dr. Ravi, MD (Emergency Medicine)',
    department: 'Emergency & Critical Care',
    fileType: 'pdf',
    fileSize: '1.4 MB',
    status: 'Signed',
    description: 'Complete discharge summary for 4-hour observation of acute chest pain. Non-cardiac etiology confirmed with normal ECG and cardiac markers.'
  },
  {
    id: 'doc-2',
    uhid: 'MHK202500321',
    title: 'Star Health Cashless TPA Pre-Authorization Form',
    category: 'Insurance & Claims',
    date: '10 Jan 2026',
    author: 'Hospital TPA Desk (Kavitha S)',
    department: 'Insurance & Billing Desk',
    fileType: 'pdf',
    fileSize: '2.8 MB',
    status: 'Signed',
    description: 'Pre-auth initial cashless approval sanction letter from Star Health Insurance. Policy: SH123456.'
  },
  {
    id: 'doc-3',
    uhid: 'MHK202500321',
    title: 'Informed General Consent for OPD & Diagnostic Procedures',
    category: 'Consent Form',
    date: '15 Mar 2026',
    author: 'Admissions Office',
    department: 'Patient Care Services',
    fileType: 'pdf',
    fileSize: '420 KB',
    status: 'Signed',
    description: 'Digitally signed informed consent for OPD diagnostic assessments and therapeutic procedures.'
  },
  {
    id: 'doc-4',
    uhid: 'MHK202500321',
    title: 'Referral Letter to Preventive Cardiology',
    category: 'Referral Letter',
    date: '12 Sep 2026',
    author: 'Dr. Shajin',
    department: 'General Medicine',
    fileType: 'pdf',
    fileSize: '360 KB',
    status: 'Signed',
    description: 'Clinical referral note recommending cardiovascular risk stratification and treadmill stress test (TMT).'
  },
  {
    id: 'doc-5',
    uhid: 'MHK202500321',
    title: 'Medical Fitness & Travel Certificate',
    category: 'Medical Certificate',
    date: '20 Jun 2026',
    author: 'Dr. Priya, MD',
    department: 'Occupational Health',
    fileType: 'pdf',
    fileSize: '512 KB',
    status: 'Signed',
    description: 'Certified fit for domestic and air travel with medication protocol for hypertension and diabetes.'
  },
  {
    id: 'doc-6',
    uhid: 'MHK202500321',
    title: 'Comprehensive Lab Diagnostic Cumulative Report (Sept 2026)',
    category: 'Lab / Diagnostic',
    date: '12 Sep 2026',
    author: 'Dr. Meera (Biochemistry)',
    department: 'Central Clinical Laboratory',
    fileType: 'pdf',
    fileSize: '1.8 MB',
    status: 'Signed',
    description: 'Consolidated report including Complete Blood Count, Glycated HbA1c, Renal Profile, and Lipid Panel.'
  },
  {
    id: 'doc-7',
    uhid: 'MHK202500321',
    title: 'External Echo Doppler Report (Patient Uploaded Scans)',
    category: 'Lab / Diagnostic',
    date: '02 Feb 2026',
    author: 'Scanned Records Desk',
    department: 'Medical Records Dept (MRD)',
    fileType: 'pdf',
    fileSize: '3.4 MB',
    status: 'Signed',
    description: 'Transthoracic 2D Echocardiogram from external medical institute. Normal LV systolic function (LVEF 62%).'
  },
  {
    id: 'doc-8',
    uhid: 'MHK202500321',
    title: 'Official Digitally Signed Prescription (26 Sep 2026)',
    category: 'Prescription / Bill',
    date: '26 Sep 2026',
    author: 'Dr. Shajin',
    department: 'General Medicine',
    fileType: 'pdf',
    fileSize: '290 KB',
    status: 'Pending Signature',
    description: 'Active digital prescription generated during today\'s follow-up encounter.'
  }
];
