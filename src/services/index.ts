import {
  Patient,
  Appointment,
  SoapNote,
  PrescriptionRecord,
  LabTestReport,
  ImagingStudy,
  BillInvoice,
  FollowUpItem,
  TaskAlertItem,
  MessageThread,
  TimelineEvent,
  ClinicalDocument,
  VitalsRecord,
  AuthUser,
  SettingsState,
  DashboardStats,
  Medication,
  LabTrend
} from '../types';
import { api, refreshSession, session, SessionPayload } from './api';
import { displayDate, displayTime } from '../utils/clinicDate';

// One service per backend module. Patient-scoped records are always fetched by
// UHID, so a patient with no records gets an empty list, never someone else's.

const enc = encodeURIComponent;

/** A signed-in device, from GET /auth/sessions. */
export interface UserSession {
  id: string;
  lastActiveAt: string;
  expiresAt: string;
  userAgent: string;
  ip: string;
  current: boolean;
}

// Auth Service
export const authService = {
  /** The API also sets the httpOnly refresh cookie. */
  async login(email: string, password: string): Promise<AuthUser> {
    const { accessToken, user } = await api<SessionPayload<AuthUser>>('/auth/login', { method: 'POST', body: { email, password } });
    session.setAccessToken(accessToken);
    return user;
  },
  /** Resumes a session from the refresh cookie (page load); null when signed out. */
  async restore(): Promise<AuthUser | null> {
    const restored = await refreshSession<AuthUser>();
    return restored?.user ?? null;
  },
  me: () => api<AuthUser>('/auth/me'),
  /** Ends this device's session; local state is cleared even if the API is unreachable. */
  async logout(): Promise<void> {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    session.clear();
  },
  /** Ends every session, on all devices. */
  async logoutAll(): Promise<void> {
    await api('/auth/logout-all', { method: 'POST' });
    session.clear();
  },
  /** Other devices are signed out; this one continues with a new session. */
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthUser> {
    const { accessToken, user } = await api<SessionPayload<AuthUser>>('/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword }
    });
    session.setAccessToken(accessToken);
    return user;
  },
  getSessions: () => api<UserSession[]>('/auth/sessions'),
  revokeSession: (id: string) => api<void>(`/auth/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' })
};

// Patient Service
export const patientService = {
  async getPatients(): Promise<Patient[]> {
    const { patients } = await api<{ patients: Patient[]; total: number }>('/patients', { query: { limit: 500 } });
    return patients;
  },
  getPatientById: (idOrUhid: string) => api<Patient>(`/patients/${enc(idOrUhid)}`),
  /** The server assigns the UHID when it is omitted. */
  addPatient: (patient: Omit<Patient, 'id' | 'uhid'> & { uhid?: string }) =>
    api<Patient>('/patients', { method: 'POST', body: patient }),
  updatePatient: (idOrUhid: string, updates: Partial<Patient>) =>
    api<Patient>(`/patients/${enc(idOrUhid)}`, { method: 'PUT', body: updates })
};

// Appointment Service
export const appointmentService = {
  async getAppointments(query: { date?: string; uhid?: string } = {}): Promise<Appointment[]> {
    const { appointments } = await api<{ appointments: Appointment[]; total: number }>('/appointments', {
      query: { ...query, limit: 500 }
    });
    return appointments;
  },
  addAppointment: (apt: Omit<Appointment, 'id'>) => api<Appointment>('/appointments', { method: 'POST', body: apt }),
  updateStatus: (id: string, status: Appointment['status']) =>
    api<Appointment>(`/appointments/${id}/status`, { method: 'PATCH', body: { status } }),
  update: (id: string, updates: Partial<Appointment>) =>
    api<Appointment>(`/appointments/${id}`, { method: 'PUT', body: updates })
};

// Consultation / EMR Service
export const consultationService = {
  /** Latest note, or an unsaved blank draft (no `id`) when the patient has none. */
  async getSoapNote(uhid: string): Promise<SoapNote> {
    const note = await api<SoapNote>(`/consultations/soap/${enc(uhid)}`);
    // A draft is dated by the server's clock; use the clinic's today (see utils/clinicDate).
    return note.id ? note : { ...note, visitDate: displayDate(), visitTime: displayTime() };
  },
  /** Creates the note when it has no `id`, otherwise updates it. Returns the stored note. */
  saveSoapNote: (note: SoapNote) => api<SoapNote>('/consultations/soap', { method: 'POST', body: note }),
  /** Every consultation for the patient, newest first. */
  getVisits: (uhid: string) => api<SoapNote[]>('/consultations', { query: { uhid } })
};

// Prescription Service
export const prescriptionService = {
  /** All of the patient's prescriptions, newest first. */
  getPrescriptions: (uhid: string) => api<PrescriptionRecord[]>('/prescriptions', { query: { uhid } }),
  /** The patient's latest prescription, or null when none has been written. */
  async getPrescription(uhid: string): Promise<PrescriptionRecord | null> {
    const list = await prescriptionService.getPrescriptions(uhid);
    return list[0] ?? null;
  },
  /** Rule-based check against the backend's (small) built-in interaction table. */
  checkInteractions: (medicines: string[]) =>
    api<{ hasInteractions: boolean; warnings: string[]; checkedMedicinesCount: number }>('/prescriptions/check-interactions', {
      method: 'POST',
      body: { medicines }
    }),
  savePrescription: (rx: Omit<PrescriptionRecord, 'id'> & { id?: string }) =>
    rx.id
      ? api<PrescriptionRecord>(`/prescriptions/${rx.id}`, { method: 'PUT', body: rx })
      : api<PrescriptionRecord>('/prescriptions', { method: 'POST', body: rx })
};

// Medication Service
export const medicationService = {
  getMedications: (uhid: string) => api<Medication[]>('/medications', { query: { uhid } }),
  updateStatus: (id: string, status: Medication['status']) =>
    api<Medication>(`/medications/${id}/status`, { method: 'PATCH', body: { status } })
};

// Lab Service
export const labService = {
  getReports: (uhid: string) => api<LabTestReport[]>('/lab-reports', { query: { uhid } }),
  /** Per-parameter series computed by the backend from this patient's reports. */
  async getTrends(uhid: string): Promise<LabTrend[]> {
    const { trends } = await api<{ trends: LabTrend[] }>(`/lab-reports/trends/${enc(uhid)}`);
    return trends;
  }
};

// Imaging Service
export const imagingService = {
  getStudies: (uhid: string) => api<ImagingStudy[]>('/imaging', { query: { uhid } })
};

// Billing Service
export const billingService = {
  getInvoices: (uhid?: string) => api<BillInvoice[]>('/billing/invoices', { query: { uhid } }),
  createInvoice: (invoice: Omit<BillInvoice, 'id'>) =>
    api<BillInvoice>('/billing/invoices', { method: 'POST', body: invoice }),
  recordPayment: (id: string, amount: number, paymentMode?: string) =>
    api<BillInvoice>(`/billing/invoices/${id}/pay`, { method: 'PATCH', body: { amount, paymentMode } }),
  updateNotes: (id: string, notes: string) => api<BillInvoice>(`/billing/invoices/${id}/notes`, { method: 'PATCH', body: { notes } })
};

// Follow-up Service
export const followUpService = {
  getFollowUps: () => api<FollowUpItem[]>('/follow-ups'),
  updateStatus: (id: string, status: FollowUpItem['status']) =>
    api<FollowUpItem>(`/follow-ups/${id}/status`, { method: 'PATCH', body: { status } }),
  addFollowUp: (item: Omit<FollowUpItem, 'id'>) => api<FollowUpItem>('/follow-ups', { method: 'POST', body: item }),
  /** The backend reports `sent: false` until an SMS/WhatsApp provider is configured. */
  sendReminder: (id: string) =>
    api<{ sent: boolean; message: string }>(`/follow-ups/${id}/send-reminder`, { method: 'POST' })
};

// Tasks & Alerts Service
export const taskService = {
  getTasks: () => api<TaskAlertItem[]>('/tasks-alerts'),
  /** Flips Pending <-> Completed and returns the updated task. */
  toggleTaskStatus: (id: string) => api<TaskAlertItem>(`/tasks-alerts/${id}/toggle`, { method: 'PATCH' }),
  updateStatus: (id: string, status: TaskAlertItem['status']) =>
    api<TaskAlertItem>(`/tasks-alerts/${id}/status`, { method: 'PATCH', body: { status } }),
  addTask: (task: Omit<TaskAlertItem, 'id'>) => api<TaskAlertItem>('/tasks-alerts', { method: 'POST', body: task })
};

// Messages Service
export const messageService = {
  getThreads: () => api<MessageThread[]>('/messages/threads'),
  /** Appends a doctor message and returns the updated thread. */
  sendMessage: (threadId: string, text: string) =>
    api<MessageThread>(`/messages/threads/${threadId}/send`, { method: 'POST', body: { text } }),
  markAsRead: (threadId: string) => api<MessageThread>(`/messages/threads/${threadId}/read`, { method: 'PATCH' }),
  async getUnreadCount(): Promise<number> {
    const { unreadCount } = await api<{ unreadCount: number }>('/messages/unread-count');
    return unreadCount;
  }
};

// Timeline Service
export const timelineService = {
  getEvents: (uhid: string) => api<TimelineEvent[]>(`/timeline/${enc(uhid)}`),
  addEvent: (event: Omit<TimelineEvent, 'id'>) => api<TimelineEvent>('/timeline', { method: 'POST', body: event })
};

// Clinical Documents Service
export const documentService = {
  getDocuments: (uhid: string) => api<ClinicalDocument[]>('/documents', { query: { uhid } }),
  addDocument: (doc: Omit<ClinicalDocument, 'id'>) => api<ClinicalDocument>('/documents', { method: 'POST', body: doc }),
  /** Signs as the signed-in user. */
  sign: (id: string) => api<ClinicalDocument>(`/documents/${id}/sign`, { method: 'PATCH' })
};

// Vitals Service
export const vitalsService = {
  /** Newest first. */
  getVitals: (uhid: string) => api<VitalsRecord[]>(`/vitals/${enc(uhid)}`),
  /** BMI, BMI status and the overall status are computed by the backend. */
  addVitals: (record: Omit<VitalsRecord, 'id' | 'bmi' | 'bmiStatus' | 'status'>) =>
    api<VitalsRecord>('/vitals', { method: 'POST', body: record })
};

// Dashboard Service
export const dashboardService = {
  getStats: (date: string) => api<DashboardStats>('/dashboard/stats', { query: { date } })
};

// Settings Service
export const settingsService = {
  getSettings: () => api<SettingsState>('/settings'),
  saveSettings: (settings: SettingsState) => api<SettingsState>('/settings', { method: 'PUT', body: settings })
};
