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
  SettingsPatch,
  DashboardStats,
  Medication,
  LabTrend,
  AgentCall,
  CallAgentSettings,
  CallStats,
  CallAgentConfig,
  AgentScript,
  OfferedSlot,
  CallPurpose,
  CallStatus,
  CallOutcome,
  QueueBoard,
  QueueToken,
  QueueSettings,
  QueueDisplayDevice,
  QueueDeviceKind,
  PatientCard,
  BedBoard,
  BedAdmission,
  SuggestBedsRequest,
  BedRequest,
  BedRequestQuery,
  CreateBedRequestBody,
  BedOverview,
  SnapshotRange,
  SnapshotPoint,
  Need,
  SuggestionResult,
  AiRefinement,
  AiStatus,
  AgentStatus,
  Approval,
  ChatAnswer,
  CoordinatorCase,
  CoordinatorCaseDetail,
  CoordinatorCaseQuery,
  CoordinatorMessageQuery,
  CoordinatorOverview,
  ErBoard,
  LabCatalogue,
  LabCollectionItem,
  LabCriticalRow,
  LabLimits,
  LabOrderInput,
  LabOverview,
  LabRequestQuery,
  LabRequestView,
  LabSampleLabel,
  LabSeriesPoint,
  LabTargets,
  LabWorklist,
  LabArea,
  LabRejectReason,
  ErOverview,
  ErSeriesPoint,
  ErBay,
  ErBayInput,
  ErComplaintInfo,
  ErArrivalInput,
  ErExpectedInput,
  ErTriageInput,
  ErTriageSuggestion,
  ErVisit,
  ErExpected,
  ErVitals,
  TriageColour,
  ErPathwayKey,
  ErDispositionKind,
  CoordinatorSeriesPoint,
  AgentMessage,
  DutyTitle,
  Ladder,
  RequestType,
  RuleView,
  StaffUser
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
  getTasks: (query: { category?: TaskAlertItem['category']; status?: TaskAlertItem['status'] } = {}) => api<TaskAlertItem[]>('/tasks-alerts', { query }),
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
  /** The API merges each section sent over the stored one, key by key, so a section may carry only the keys that change. */
  saveSettings: (settings: SettingsPatch) => api<SettingsState>('/settings', { method: 'PUT', body: settings }),
  saveCallAgent: (callAgent: Partial<CallAgentSettings>) => api<SettingsState>('/settings', { method: 'PUT', body: { callAgent } }),
  saveQueue: (queue: Partial<QueueSettings>) => api<SettingsState>('/settings', { method: 'PUT', body: { queue } })
};

// AI Call Agent: the backend places calls through a voice provider and applies each
// outcome (confirm, move, cancel, book) itself; the web app starts calls and reads results.
export interface BookingCallRequest {
  uhid: string;
  visitReason?: string;
  appointmentType?: string;
  fromDate?: string;
  followUpId?: string;
}

export const callAgentService = {
  getCalls: (query: { purpose?: CallPurpose; status?: CallStatus; outcome?: CallOutcome; uhid?: string; appointmentId?: string; limit?: number } = {}) =>
    api<AgentCall[]>('/calls', { query }),
  getCall: (id: string) => api<AgentCall>(`/calls/${enc(id)}`),
  getStats: () => api<CallStats>('/calls/stats'),
  getConfig: () => api<CallAgentConfig>('/calls/config'),
  getScripts: () => api<AgentScript[]>('/calls/scripts'),
  getFreeSlots: (from?: string) => api<OfferedSlot[]>('/calls/slots', { query: { from } }),
  confirmAppointment: (appointmentId: string) => api<AgentCall>('/calls/confirmation', { method: 'POST', body: { appointmentId } }),
  bookAppointment: (request: BookingCallRequest) => api<AgentCall>('/calls/booking', { method: 'POST', body: request }),
  cancelCall: (id: string) => api<AgentCall>(`/calls/${enc(id)}/cancel`, { method: 'POST' }),
  runDue: () => api<{ expired: number; queued: number; placed: number; withinCallingHours: boolean }>('/calls/run-due', { method: 'POST' }),
  allowCalls: (uhid: string) => api<{ uhid: string; doNotCall: boolean }>(`/calls/do-not-call/${enc(uhid)}`, { method: 'DELETE' })
};

// Token queue: the front desk issues tokens, rooms call them, and display screens
// show them. The backend keeps one live token per patient per day.
export interface IssueTokenRequest {
  uhid?: string;
  appointmentId?: string;
  priority?: boolean;
  note?: string;
}

/** What a call changed: the room's previous token (completed) and the one now called. */
export interface QueueCallResult {
  called: QueueToken | null;
  completed: QueueToken | null;
}

export const queueService = {
  getBoard: (date?: string) => api<QueueBoard>('/queue', { query: { date } }),
  /** `existing` when the patient already held today's token (it is returned, not duplicated). */
  issue: (request: IssueTokenRequest) => api<{ token: QueueToken; existing: boolean }>('/queue/tokens', { method: 'POST', body: request }),
  /** `finish` is the room's current token; required while it has one. */
  callNext: (counter: string, finish?: string) => api<QueueCallResult>('/queue/next', { method: 'POST', body: { counter, finish } }),
  callToken: (id: string, counter: string, finish?: string) =>
    api<QueueCallResult>(`/queue/tokens/${enc(id)}/call`, { method: 'POST', body: { counter, finish } }),
  recall: (id: string) => api<QueueToken>(`/queue/tokens/${enc(id)}/recall`, { method: 'POST' }),
  skip: (id: string) => api<QueueToken>(`/queue/tokens/${enc(id)}/skip`, { method: 'POST' }),
  requeue: (id: string) => api<QueueToken>(`/queue/tokens/${enc(id)}/requeue`, { method: 'POST' }),
  complete: (id: string) => api<QueueToken>(`/queue/tokens/${enc(id)}/complete`, { method: 'POST' }),
  cancel: (id: string) => api<QueueToken>(`/queue/tokens/${enc(id)}/cancel`, { method: 'POST' }),
  getDisplays: () => api<QueueDisplayDevice[]>('/queue/displays'),
  /** The key comes back only here. */
  addDisplay: (name: string, kind: QueueDeviceKind = 'display', printSlips = false) =>
    api<{ display: QueueDisplayDevice; key: string }>('/queue/displays', { method: 'POST', body: { name, kind, printSlips } }),
  updateDisplay: (id: string, changes: { name?: string; printSlips?: boolean }) =>
    api<QueueDisplayDevice>(`/queue/displays/${enc(id)}`, { method: 'PATCH', body: changes }),
  removeDisplay: (id: string) => api<{ id: string; removed: boolean }>(`/queue/displays/${enc(id)}`, { method: 'DELETE' }),

  // Patient cards: a card's serial number, as the USB reader types it, linked to a patient.
  getCards: (uhid: string) => api<PatientCard[]>('/queue/cards', { query: { uhid } }),
  /** `reassign` moves a card that is linked to someone else (the API refuses with 409 otherwise). */
  linkCard: (cardId: string, uhid: string, reassign = false) => api<PatientCard>('/queue/cards', { method: 'POST', body: { cardId, uhid, reassign } }),
  unlinkCard: (id: string) => api<{ id: string; removed: boolean }>(`/queue/cards/${enc(id)}`, { method: 'DELETE' }),
  /** A card tapped on the front-desk reader: the patient's token for today. 404 for an unknown card. */
  tapCard: (cardId: string) => api<{ token: QueueToken; existing: boolean; cardId: string }>('/queue/cards/tap', { method: 'POST', body: { cardId } })
};

const POST = { method: 'POST' } as const;

// Beds: the board, AI-assisted suggestions, and the bed lifecycle.
export const bedService = {
  board: () => api<BedBoard>('/beds/board'),
  overview: () => api<BedOverview>('/beds/overview'),
  /** Hourly counts, oldest first. */
  snapshots: (range: SnapshotRange) => api<{ range: SnapshotRange; points: SnapshotPoint[] }>(`/beds/snapshots?range=${range}`),
  /** The admitted patient in a bed and their admission's needs; 404 for a bed with no admitted patient. */
  admission: (bedId: string) => api<BedAdmission>(`/beds/${enc(bedId)}/admission`),
  suggest: (req: SuggestBedsRequest) => api<SuggestionResult>('/beds/suggestions', { method: 'POST', body: req }),
  refine: (id: string) => api<AiRefinement>(`/beds/suggestions/${enc(id)}/refine`, POST),
  hold: (bedId: string, suggestionId: string) => api<{ bedId: string; holdExpiresAt: string }>(`/beds/${enc(bedId)}/hold`, { method: 'POST', body: { suggestionId } }),
  release: (bedId: string) => api<{ released: boolean }>(`/beds/${enc(bedId)}/hold`, { method: 'DELETE' }),
  admit: (bedId: string, body: { suggestionId: string; reason?: string; ruleOverride?: boolean; requestId?: string }) =>
    api<unknown>(`/beds/${enc(bedId)}/admit`, { method: 'POST', body }),
  transfer: (bedId: string, body: { toBedId: string; suggestionId: string; reason?: string; ruleOverride?: boolean; requestId?: string }) =>
    api<unknown>(`/beds/${enc(bedId)}/transfer`, { method: 'POST', body }),
  /** `admissionId`: the admission the panel showed (null for a sample occupant); the API refuses with 409 if the bed changed. */
  discharge: (bedId: string, admissionId: string | null) =>
    api<{ ok: boolean }>(`/beds/${enc(bedId)}/discharge`, { method: 'POST', body: { admissionId } }),
  clean: (bedId: string) => api<{ ok: boolean }>(`/beds/${enc(bedId)}/clean`, POST),
  block: (bedId: string, reason: string) => api<{ ok: boolean }>(`/beds/${enc(bedId)}/block`, { method: 'POST', body: { reason } }),
  unblock: (bedId: string) => api<{ ok: boolean }>(`/beds/${enc(bedId)}/unblock`, POST)
};

export const aiService = {
  status: () => api<AiStatus>('/ai/status'),
  /** Admin only: tests the connection to the AI provider. */
  check: () => api<{ provider: AiStatus['provider']; ok: boolean; detail: string }>('/ai/check', POST)
};

// Bed requests: what doctors ask for and the Bed Agent works through.
export const bedRequestService = {
  create: (body: CreateBedRequestBody) => api<BedRequest>('/beds/requests', { method: 'POST', body }),
  list: (q: BedRequestQuery = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(q)) if (value !== undefined) params.set(key, String(value));
    const qs = params.toString();
    return api<BedRequest[]>(`/beds/requests${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => api<BedRequest>(`/beds/requests/${enc(id)}`),
  cancel: (id: string) => api<BedRequest>(`/beds/requests/${enc(id)}/cancel`, POST),
  /** `confirm` true adds a need found in the notes; false dismisses it. */
  notesNeed: (id: string, need: Need, confirm: boolean) =>
    api<BedRequest>(`/beds/requests/${enc(id)}/notes-need`, { method: 'POST', body: { need, confirm } })
};

// The Coordinator: cases, agent messages, approvals, rules and escalations.
export const coordinatorService = {
  overview: () => api<CoordinatorOverview>('/coordinator/overview'),
  /** Hourly counts, oldest first. */
  snapshots: (range: SnapshotRange) => api<{ range: SnapshotRange; points: CoordinatorSeriesPoint[] }>(`/coordinator/snapshots?range=${range}`),
  cases: (q: CoordinatorCaseQuery = {}) => api<CoordinatorCase[]>('/coordinator/cases', { query: { ...q } }),
  case: (id: string) => api<CoordinatorCaseDetail>(`/coordinator/cases/${enc(id)}`),
  messages: (q: CoordinatorMessageQuery = {}) => api<AgentMessage[]>('/coordinator/messages', { query: { ...q, openWork: q.openWork === undefined ? undefined : String(q.openWork) } }),
  agents: () => api<AgentStatus[]>('/coordinator/agents'),
  approvals: (state?: string) => api<Approval[]>('/coordinator/approvals', { query: { state } }),
  act: (id: string, decision: 'approved' | 'rejected') => api<Approval>(`/coordinator/approvals/${enc(id)}/act`, { method: 'POST', body: { decision } }),
  reassign: (id: string, target: { kind: 'title' | 'role'; key: string }, note: string) =>
    api<Approval>(`/coordinator/approvals/${enc(id)}/reassign`, { method: 'POST', body: { target, note } }),
  rules: () => api<RuleView[]>('/coordinator/rules'),
  setRule: (key: string, value: boolean) => api<RuleView>(`/coordinator/rules/${enc(key)}`, { method: 'PUT', body: { value } }),
  /** Admin only. */
  ladders: () => api<Ladder[]>('/coordinator/ladders'),
  saveLadder: (ladder: Ladder) => api<Ladder>('/coordinator/ladders', { method: 'PUT', body: ladder }),
  titles: () => api<DutyTitle[]>('/coordinator/titles'),
  saveTitle: (title: DutyTitle) => api<DutyTitle>('/coordinator/titles', { method: 'PUT', body: title }),
  staff: () => api<StaffUser[]>('/coordinator/staff'),
  requestTypes: () => api<RequestType[]>('/coordinator/request-types'),
  ask: (question: string) => api<ChatAnswer>('/coordinator/ask', { method: 'POST', body: { question } }),
  acknowledge: (escalationId: string) => api<{ ok: boolean }>(`/coordinator/escalations/${enc(escalationId)}/ack`, POST)
};

// The ER Agent: the board, arrivals, triage, pathways, bays and the doctor's decision.
export const erService = {
  board: () => api<ErBoard>('/er/board'),
  complaints: () => api<ErComplaintInfo>('/er/complaints'),
  overview: () => api<ErOverview>('/er/overview'),
  /** Hourly counts, oldest first. */
  snapshots: (range: SnapshotRange) => api<{ range: SnapshotRange; points: ErSeriesPoint[] }>(`/er/snapshots?range=${range}`),
  bays: () => api<{ bays: ErBay[] }>('/er/bays').then((r) => r.bays),
  suggestBay: (colour: TriageColour) => api<{ bay: ErBay | null }>(`/er/bays/suggest?colour=${colour}`).then((r) => r.bay),
  /** Admin only. Sends the bare list; the answer is the saved list. */
  saveBays: (bays: ErBayInput[]) => api<{ bays: ErBay[] }>('/er/bays', { method: 'PUT', body: bays }).then((r) => r.bays),
  targets: () => api<{ targets: Record<string, number> }>('/er/targets').then((r) => r.targets),
  /** Admin only: an object of "<pathway>.<step>": minutes. */
  saveTargets: (targets: Record<string, number>) => api<{ targets: Record<string, number> }>('/er/targets', { method: 'PUT', body: targets }).then((r) => r.targets),
  suggestTriage: (body: { complaint: string; vitals?: ErVitals; painScore?: number }) => api<ErTriageSuggestion>('/er/triage/suggest', { method: 'POST', body }),
  arrive: (body: ErArrivalInput) => api<ErVisit>('/er/arrivals', { method: 'POST', body }),
  addExpected: (body: ErExpectedInput) => api<ErExpected>('/er/expected', { method: 'POST', body }),
  deleteExpected: (id: string) => api<{ ok: boolean }>(`/er/expected/${enc(id)}`, { method: 'DELETE' }),
  visit: (id: string) => api<ErVisit>(`/er/visits/${enc(id)}`),
  triage: (id: string, body: ErTriageInput) => api<ErVisit>(`/er/visits/${enc(id)}/triage`, { method: 'POST', body }),
  retriage: (id: string, colour: TriageColour, reason: string) => api<ErVisit>(`/er/visits/${enc(id)}/retriage`, { method: 'POST', body: { colour, reason } }),
  startPathway: (id: string, key: ErPathwayKey) => api<ErVisit>(`/er/visits/${enc(id)}/pathways/${enc(key)}`, POST),
  cancelPathway: (id: string, key: ErPathwayKey, reason: string) => api<ErVisit>(`/er/visits/${enc(id)}/pathways/${enc(key)}/cancel`, { method: 'POST', body: { reason } }),
  tickStep: (id: string, step: string) => api<ErVisit>(`/er/visits/${enc(id)}/steps/${enc(step)}`, POST),
  doctorSeen: (id: string) => api<ErVisit>(`/er/visits/${enc(id)}/doctor-seen`, POST),
  assignBay: (id: string, bayId: string | null) => api<ErVisit>(`/er/visits/${enc(id)}/bay`, { method: 'POST', body: { bayId } }),
  disposition: (id: string, kind: ErDispositionKind, notes?: string) => api<ErVisit>(`/er/visits/${enc(id)}/disposition`, { method: 'POST', body: { kind, notes } }),
  handoverDraft: (id: string) => api<{ text: string; sample: boolean }>(`/er/visits/${enc(id)}/handover-draft`),
  saveHandover: (id: string, note: string) => api<ErVisit>(`/er/visits/${enc(id)}/handover`, { method: 'PUT', body: { note } })
};

// The Lab Agent (named apart from `labService` above, which reads a patient's lab reports).
export const labAgentService = {
  catalogue: () => api<LabCatalogue>('/lab/catalogue'),
  overview: () => api<LabOverview>('/lab/overview'),
  /** Hourly counts, oldest first. */
  snapshots: (range: SnapshotRange) => api<{ range: SnapshotRange; points: LabSeriesPoint[] }>(`/lab/snapshots?range=${range}`),
  requests: (q: LabRequestQuery = {}) => api<{ requests: LabRequestView[] }>('/lab/requests', { query: { ...q } }).then((r) => r.requests),
  request: (id: string) => api<LabRequestView>(`/lab/requests/${enc(id)}`),
  labels: (id: string) => api<{ labels: LabSampleLabel[] }>(`/lab/requests/${enc(id)}/labels`).then((r) => r.labels),
  patientRequests: (patientId: string) => api<{ requests: LabRequestView[] }>(`/lab/patients/${enc(patientId)}/requests`).then((r) => r.requests),
  /** Admin and doctor. A repeat order answers with two requests. */
  order: (body: LabOrderInput) => api<{ requests: LabRequestView[] }>('/lab/requests', { method: 'POST', body }).then((r) => r.requests),
  cancelLine: (lineId: string, reason: string) => api<LabRequestView>(`/lab/lines/${enc(lineId)}/cancel`, { method: 'POST', body: { reason } }),
  notCollected: (requestId: string, reason: string) => api<LabRequestView>(`/lab/requests/${enc(requestId)}/not-collected`, { method: 'POST', body: { reason } }),
  collection: (area?: LabArea) => api<{ samples: LabCollectionItem[] }>('/lab/collection', { query: { area } }).then((r) => r.samples),
  collect: (sampleNumber: string) => api<{ ok: boolean }>('/lab/samples/collect', { method: 'POST', body: { sampleNumber } }),
  receive: (sampleId: string) => api<{ ok: boolean }>(`/lab/samples/${enc(sampleId)}/receive`, POST),
  reject: (sampleId: string, reason: LabRejectReason, note?: string) => api<{ ok: boolean }>(`/lab/samples/${enc(sampleId)}/reject`, { method: 'POST', body: { reason, note } }),
  worklist: () => api<LabWorklist>('/lab/worklist'),
  enterResults: (lineId: string, values: Record<string, number | string>) => api<{ ok: boolean }>(`/lab/lines/${enc(lineId)}/results`, { method: 'PUT', body: { values } }),
  sendBack: (lineId: string, reason: string) => api<{ ok: boolean }>(`/lab/lines/${enc(lineId)}/send-back`, { method: 'POST', body: { reason } }),
  release: (lineId: string) => api<{ ok: boolean }>(`/lab/lines/${enc(lineId)}/release`, POST),
  amend: (lineId: string, values: Record<string, number | string>, reason: string) => api<{ ok: boolean }>(`/lab/lines/${enc(lineId)}/amend`, { method: 'POST', body: { values, reason } }),
  critical: () => api<{ critical: LabCriticalRow[] }>('/lab/critical').then((r) => r.critical),
  acknowledge: (lineId: string, note?: string) => api<{ ok: boolean }>(`/lab/lines/${enc(lineId)}/acknowledge`, { method: 'POST', body: { note } }),
  targets: () => api<{ targets: LabTargets }>('/lab/targets').then((r) => r.targets),
  /** Admin only: an object of "<test>": { stat, routine }. Answers with the saved targets. */
  saveTargets: (targets: Partial<Record<string, { stat?: number; routine?: number }>>) => api<{ targets: LabTargets }>('/lab/targets', { method: 'PUT', body: targets }).then((r) => r.targets),
  limits: () => api<LabLimits>('/lab/limits'),
  /** Admin only: an object of "<test>.<parameter>": { low, high } (null clears a side). */
  saveLimits: (limits: Record<string, { low?: number | null; high?: number | null }>) => api<LabLimits>('/lab/limits', { method: 'PUT', body: limits })
};
