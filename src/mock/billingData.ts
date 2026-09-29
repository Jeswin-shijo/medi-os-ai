import { BillInvoice } from '../types';

export const mockBillInvoices: BillInvoice[] = [
  {
    id: 'b-1',
    billNumber: 'BILL-2026-0923-001',
    uhid: 'MHK202500321',
    patientName: 'Arun Kumar',
    billDate: '23 Sep 2026, 09:15 AM',
    visitType: 'OPD',
    consultationId: 'CONS-2026-0923-001',
    createdBy: 'Dr. Shajin',
    paymentMode: 'Card (Online)',
    status: 'Paid',
    items: [
      { id: 'bi-1', service: 'Consultation Fee', subCategory: 'Dr. Shajin (General Medicine)', category: 'Consultation', qty: 1, unitPrice: 500, discount: 0, amount: 500 },
      { id: 'bi-2', service: 'CBC (Complete Blood Count)', category: 'Lab', qty: 1, unitPrice: 350, discount: 0, amount: 350 },
      { id: 'bi-3', service: 'CRP (C-Reactive Protein)', category: 'Lab', qty: 1, unitPrice: 450, discount: 0, amount: 450 },
      { id: 'bi-4', service: 'Chest X-Ray', category: 'Radiology', qty: 1, unitPrice: 450, discount: 50, amount: 400 },
      { id: 'bi-5', service: 'Disposable Materials', category: 'Others', qty: 1, unitPrice: 100, discount: 0, amount: 100 },
      { id: 'bi-6', service: 'Registration Fee', category: 'Administrative', qty: 1, unitPrice: 50, discount: 0, amount: 50 }
    ],
    subtotal: 1850,
    discount: 50,
    tax: 0,
    totalAmount: 1850,
    paidAmount: 1850,
    balanceDue: 0,
    notes: 'OPD consultation with routine blood tests and X-Ray. Discount applied on radiology.'
  },
  {
    id: 'b-2',
    billNumber: 'BILL-2026-0912-004',
    uhid: 'MHK202500321',
    patientName: 'Arun Kumar',
    billDate: '12 Sep 2026',
    visitType: 'OPD',
    consultationId: 'CONS-2026-0912-004',
    createdBy: 'Dr. Shajin',
    paymentMode: 'UPI',
    status: 'Paid',
    items: [
      { id: 'bi-21', service: 'Comprehensive Metabolic Panel', category: 'Lab', qty: 1, unitPrice: 1800, discount: 0, amount: 1800 },
      { id: 'bi-22', service: 'Lipid Profile', category: 'Lab', qty: 1, unitPrice: 850, discount: 0, amount: 850 },
      { id: 'bi-23', service: 'HbA1c Glycated Hemoglobin', category: 'Lab', qty: 1, unitPrice: 770, discount: 0, amount: 770 }
    ],
    subtotal: 3420,
    discount: 0,
    tax: 0,
    totalAmount: 3420,
    paidAmount: 3420,
    balanceDue: 0,
    notes: 'Comprehensive annual monitoring lab battery.'
  },
  {
    id: 'b-3',
    billNumber: 'BILL-2026-0912-003',
    uhid: 'MHK202500321',
    patientName: 'Arun Kumar',
    billDate: '12 Sep 2026',
    visitType: 'OPD',
    consultationId: 'CONS-2026-0912-003',
    createdBy: 'Dr. Ravi',
    paymentMode: 'Net Banking',
    status: 'Paid',
    items: [
      { id: 'bi-31', service: 'Digital X-Ray PA View', category: 'Radiology', qty: 1, unitPrice: 1200, discount: 0, amount: 1200 }
    ],
    subtotal: 1200,
    discount: 0,
    tax: 0,
    totalAmount: 1200,
    paidAmount: 1200,
    balanceDue: 0,
    notes: 'Radiology outpatient procedure.'
  },
  {
    id: 'b-4',
    billNumber: 'BILL-2026-0805-002',
    uhid: 'MHK202500321',
    patientName: 'Arun Kumar',
    billDate: '05 Aug 2026',
    visitType: 'OPD',
    consultationId: 'CONS-2026-0805-002',
    createdBy: 'Dr. Shajin',
    paymentMode: 'Cash',
    status: 'Partially Paid',
    items: [
      { id: 'bi-41', service: 'Follow-up Consultation', category: 'Consultation', qty: 1, unitPrice: 400, discount: 0, amount: 400 },
      { id: 'bi-42', service: 'Blood Glucose Random', category: 'Lab', qty: 1, unitPrice: 150, discount: 0, amount: 150 },
      { id: 'bi-43', service: 'ECG 12 Lead', category: 'Radiology', qty: 1, unitPrice: 400, discount: 0, amount: 400 }
    ],
    subtotal: 950,
    discount: 0,
    tax: 0,
    totalAmount: 950,
    paidAmount: 500,
    balanceDue: 450,
    notes: 'Balance due of ₹450 pending payment on next visit.'
  },
  {
    id: 'b-5',
    billNumber: 'BILL-2026-0620-001',
    uhid: 'MHK202500321',
    patientName: 'Arun Kumar',
    billDate: '20 Jun 2026',
    visitType: 'OPD',
    consultationId: 'CONS-2026-0620-001',
    createdBy: 'Dr. Shajin',
    paymentMode: 'UPI',
    status: 'Paid',
    items: [
      { id: 'bi-51', service: 'Consultation Fee', subCategory: 'Dr. Shajin (General Medicine)', category: 'Consultation', qty: 1, unitPrice: 500, discount: 0, amount: 500 },
      { id: 'bi-52', service: 'Fasting Blood Sugar', category: 'Lab', qty: 1, unitPrice: 250, discount: 0, amount: 250 },
      { id: 'bi-53', service: 'Registration Fee', category: 'Administrative', qty: 1, unitPrice: 50, discount: 0, amount: 50 }
    ],
    subtotal: 800,
    discount: 0,
    tax: 0,
    totalAmount: 800,
    paidAmount: 800,
    balanceDue: 0,
    notes: 'Routine OPD review for blood pressure and sugar control.'
  },
  {
    id: 'b-6',
    billNumber: 'BILL-2026-0315-001',
    uhid: 'MHK202500321',
    patientName: 'Arun Kumar',
    billDate: '15 Mar 2026',
    visitType: 'Emergency',
    consultationId: 'CONS-2026-0315-001',
    createdBy: 'Dr. Priya',
    paymentMode: 'Card (Online)',
    status: 'Paid',
    items: [
      { id: 'bi-61', service: 'Emergency Consultation', subCategory: 'Dr. Priya (Emergency Medicine)', category: 'Consultation', qty: 1, unitPrice: 1000, discount: 0, amount: 1000 },
      { id: 'bi-62', service: 'ECG 12 Lead', category: 'Radiology', qty: 1, unitPrice: 400, discount: 0, amount: 400 },
      { id: 'bi-63', service: 'Troponin I', category: 'Lab', qty: 1, unitPrice: 900, discount: 0, amount: 900 },
      { id: 'bi-64', service: 'Disposable Materials', category: 'Others', qty: 1, unitPrice: 150, discount: 0, amount: 150 }
    ],
    subtotal: 2450,
    discount: 0,
    tax: 0,
    totalAmount: 2450,
    paidAmount: 2450,
    balanceDue: 0,
    notes: 'Emergency visit for chest discomfort. Cardiac markers normal.'
  },
  {
    id: 'b-7',
    billNumber: 'BILL-2026-0105-001',
    uhid: 'MHK202500321',
    patientName: 'Arun Kumar',
    billDate: '10 Jan 2026',
    visitType: 'OPD',
    consultationId: 'CONS-2026-0105-001',
    createdBy: 'Dr. Shajin',
    paymentMode: 'Cash',
    status: 'Paid',
    items: [
      { id: 'bi-71', service: 'Consultation Fee', subCategory: 'Dr. Shajin (General Medicine)', category: 'Consultation', qty: 1, unitPrice: 500, discount: 0, amount: 500 },
      { id: 'bi-72', service: 'Lipid Profile', category: 'Lab', qty: 1, unitPrice: 850, discount: 0, amount: 850 },
      { id: 'bi-73', service: 'HbA1c Glycated Hemoglobin', category: 'Lab', qty: 1, unitPrice: 770, discount: 0, amount: 770 },
      { id: 'bi-74', service: 'Kidney Function Test', category: 'Lab', qty: 1, unitPrice: 860, discount: 0, amount: 860 }
    ],
    subtotal: 2980,
    discount: 0,
    tax: 0,
    totalAmount: 2980,
    paidAmount: 2980,
    balanceDue: 0,
    notes: 'Initial consultation with baseline metabolic panel.'
  }
];

export const mockAIBillingSuggestions = [
  'This is a standard OPD billing. No major issues found.',
  'Consider package billing for routine follow-up tests.',
  'Patient eligible for insurance claim for lab and radiology.',
  'Add diagnosis codes (ICD-10) for accurate insurance claim.',
  'Suggest patient to save digital receipt for future reference.'
];
