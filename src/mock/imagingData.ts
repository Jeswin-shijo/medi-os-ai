import { ImagingStudy } from '../types';

export const mockImagingStudies: ImagingStudy[] = [
  {
    id: 'img-1',
    uhid: 'MHK202500321',
    title: 'Chest X-Ray',
    date: '12 Sep 2026',
    time: '10:15 AM',
    modality: 'X-Ray',
    bodyPart: 'Chest',
    radiologist: 'Dr. Ravi (Radiologist)',
    status: 'Completed',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=500&auto=format&fit=crop&q=80',
    slices: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80'
    ],
    findings: [
      'Lung fields are clear. No focal consolidation.',
      'Cardiomediastinal silhouette is normal.',
      'No pleural effusion or pneumothorax.',
      'Bony structures appear normal.'
    ],
    impression: 'No acute cardiopulmonary abnormality detected.',
    confidenceScore: 92,
    radiologistReport: {
      findings: 'No abnormality detected in lung fields. Cardiac size normal. No effusion.',
      impression: 'Normal study. No active cardiopulmonary disease.',
      reportedBy: 'Dr. Ravi, MD (Radiology)',
      reportedOn: '12 Sep 2026 10:45 AM',
      status: 'Final Report'
    }
  },
  {
    id: 'img-2',
    uhid: 'MHK202500321',
    title: 'USG Abdomen',
    date: '21 Mar 2026',
    time: '02:30 PM',
    modality: 'Ultrasound',
    bodyPart: 'Abdomen',
    radiologist: 'Dr. Ravi (Radiologist)',
    status: 'Completed',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&auto=format&fit=crop&q=80',
    slices: ['https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80'],
    findings: [
      'Liver size is mildly enlarged with increased parenchymal echogenicity.',
      'Gallbladder is normal without calculi.',
      'Kidneys, spleen, and pancreas appear unremarkable.'
    ],
    impression: 'Mild diffuse hepatic steatosis (Grade 1 Fatty Liver).',
    confidenceScore: 89,
    radiologistReport: {
      findings: 'Grade 1 fatty liver changes noted. No focal lesions.',
      impression: 'Mild fatty liver. Correlate with lipid panel.',
      reportedBy: 'Dr. Ravi, MD (Radiology)',
      reportedOn: '21 Mar 2026 03:15 PM',
      status: 'Final Report'
    }
  },
  {
    id: 'img-3',
    uhid: 'MHK202500321',
    title: 'CT Brain',
    date: '15 Feb 2026',
    time: '11:20 AM',
    modality: 'CT Scan',
    bodyPart: 'Brain',
    radiologist: 'Dr. Ravi (Radiologist)',
    status: 'Completed',
    thumbnailUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500&auto=format&fit=crop&q=80',
    slices: ['https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&auto=format&fit=crop&q=80'],
    findings: [
      'Normal grey-white matter differentiation.',
      'Ventricles and basal cisterns are within normal limits.',
      'No intracranial hemorrhage, mass effect, or midline shift.'
    ],
    impression: 'Unremarkable non-contrast brain CT scan.',
    confidenceScore: 95,
    radiologistReport: {
      findings: 'No intracranial hemorrhage, acute ischemia, or mass lesion.',
      impression: 'Normal Brain CT scan.',
      reportedBy: 'Dr. Ravi, MD (Radiology)',
      reportedOn: '15 Feb 2026 12:00 PM',
      status: 'Final Report'
    }
  },
  {
    id: 'img-4',
    uhid: 'MHK202500321',
    title: 'MRI Knee (Right)',
    date: '10 Jan 2026',
    time: '04:10 PM',
    modality: 'MRI',
    bodyPart: 'Right Knee',
    radiologist: 'Dr. Ravi (Radiologist)',
    status: 'Completed',
    thumbnailUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=500&auto=format&fit=crop&q=80',
    slices: ['https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80'],
    findings: [
      'ACL, PCL, MCL, and LCL intact without tear.',
      'Minimal joint effusion noted in suprapatellar bursa.',
      'Menisci intact without definite tear.'
    ],
    impression: 'Minimal traumatic synovitis / effusion. Ligaments intact.',
    confidenceScore: 91,
    radiologistReport: {
      findings: 'No cruciate or meniscal tear. Mild effusion.',
      impression: 'Mild right knee joint effusion.',
      reportedBy: 'Dr. Ravi, MD (Radiology)',
      reportedOn: '10 Jan 2026 05:00 PM',
      status: 'Final Report'
    }
  },
  {
    id: 'img-5',
    uhid: 'MHK202500321',
    title: 'X-Ray Knee (Right)',
    date: '05 Jan 2026',
    time: '11:00 AM',
    modality: 'X-Ray',
    bodyPart: 'Right Knee',
    radiologist: 'Dr. Ravi (Radiologist)',
    status: 'Completed',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=500&auto=format&fit=crop&q=80',
    slices: ['https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80'],
    findings: ['Normal joint space. No fracture, dislocation, or periosteal reaction.'],
    impression: 'Normal radiograph of right knee.',
    confidenceScore: 94,
    radiologistReport: {
      findings: 'Bony architecture is preserved. No cortical disruption.',
      impression: 'Negative for fracture.',
      reportedBy: 'Dr. Ravi, MD (Radiology)',
      reportedOn: '05 Jan 2026 11:30 AM',
      status: 'Final Report'
    }
  },
  {
    id: 'img-6',
    uhid: 'MHK202500321',
    title: 'USG Thyroid',
    date: '12 Dec 2025',
    time: '09:40 AM',
    modality: 'Ultrasound',
    bodyPart: 'Neck / Thyroid',
    radiologist: 'Dr. Ravi (Radiologist)',
    status: 'Completed',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&auto=format&fit=crop&q=80',
    slices: ['https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80'],
    findings: ['Both lobes of thyroid gland are normal in size and echotexture.'],
    impression: 'Normal thyroid sonography.',
    confidenceScore: 96,
    radiologistReport: {
      findings: 'Homogeneous thyroid parenchyma without focal nodules.',
      impression: 'Normal study.',
      reportedBy: 'Dr. Ravi, MD (Radiology)',
      reportedOn: '12 Dec 2025 10:15 AM',
      status: 'Final Report'
    }
  }
];
