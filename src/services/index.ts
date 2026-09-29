import { Patient, Appointment, SoapNote, PrescriptionRecord, PrescriptionItem, LabTestReport, ImagingStudy, BillInvoice, FollowUpItem, TaskAlertItem, MessageThread } from '../types';
import { mockPatients } from '../mock/patientsData';
import { mockAppointments } from '../mock/appointmentsData';
import { mockSoapNote } from '../mock/consultationsData';
import { mockPrescriptionRecord } from '../mock/prescriptionsData';
import { mockLabReports } from '../mock/labReportsData';
import { mockImagingStudies } from '../mock/imagingData';
import { mockBillInvoices } from '../mock/billingData';
import { mockFollowUps } from '../mock/followUpsData';
import { mockTasksAlerts } from '../mock/tasksAlertsData';
import { mockMessageThreads } from '../mock/messagesData';
import { initialSettings, SettingsState } from '../mock/settingsData';

// Helper for local storage persistence
function getStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(`medios_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`medios_${key}`, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// Patient Service
export const patientService = {
  async getPatients(): Promise<Patient[]> {
    return getStorage<Patient[]>('patients', mockPatients);
  },
  async getPatientById(id: string): Promise<Patient | undefined> {
    const list = await this.getPatients();
    return list.find(p => p.id === id || p.uhid === id);
  },
  async addPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
    const list = await this.getPatients();
    const newPatient: Patient = {
      ...patient,
      id: `p-${Date.now()}`
    };
    const updated = [newPatient, ...list];
    setStorage('patients', updated);
    return newPatient;
  },
  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
    const list = await this.getPatients();
    const index = list.findIndex(p => p.id === id || p.uhid === id);
    if (index === -1) return null;
    const updatedPatient = { ...list[index], ...updates };
    list[index] = updatedPatient;
    setStorage('patients', list);
    return updatedPatient;
  }
};

// Appointment Service
export const appointmentService = {
  async getAppointments(): Promise<Appointment[]> {
    return getStorage<Appointment[]>('appointments', mockAppointments);
  },
  async addAppointment(apt: Omit<Appointment, 'id'>): Promise<Appointment> {
    const list = await this.getAppointments();
    const newApt: Appointment = {
      ...apt,
      id: `apt-${Date.now()}`
    };
    const updated = [...list, newApt];
    setStorage('appointments', updated);
    return newApt;
  },
  async updateStatus(id: string, status: Appointment['status']): Promise<void> {
    const list = await this.getAppointments();
    const item = list.find(a => a.id === id);
    if (item) {
      item.status = status;
      setStorage('appointments', list);
    }
  }
};

// Consultation / EMR Service
export const consultationService = {
  async getSoapNote(uhid: string): Promise<SoapNote> {
    const saved = getStorage<SoapNote | null>(`soap_${uhid}`, null);
    return saved || mockSoapNote;
  },
  async saveSoapNote(note: SoapNote): Promise<void> {
    setStorage(`soap_${note.uhid}`, note);
  }
};

// Prescription Service
export const prescriptionService = {
  async getPrescription(uhid: string): Promise<PrescriptionRecord> {
    const saved = getStorage<PrescriptionRecord | null>(`prescription_${uhid}`, null);
    return saved || mockPrescriptionRecord;
  },
  async savePrescription(rx: PrescriptionRecord): Promise<void> {
    setStorage(`prescription_${rx.uhid}`, rx);
  },
  async addMedicine(uhid: string, item: Omit<PrescriptionItem, 'id'>): Promise<PrescriptionRecord> {
    const rx = await this.getPrescription(uhid);
    const newItem: PrescriptionItem = { ...item, id: `rx-${Date.now()}` };
    const updated: PrescriptionRecord = {
      ...rx,
      items: [...rx.items, newItem]
    };
    await this.savePrescription(updated);
    return updated;
  },
  async removeMedicine(uhid: string, id: string): Promise<PrescriptionRecord> {
    const rx = await this.getPrescription(uhid);
    const updated: PrescriptionRecord = {
      ...rx,
      items: rx.items.filter(i => i.id !== id)
    };
    await this.savePrescription(updated);
    return updated;
  }
};

// Lab Service
export const labService = {
  async getReports(uhid?: string): Promise<LabTestReport[]> {
    const list = getStorage<LabTestReport[]>('lab_reports', mockLabReports);
    if (uhid) return list.filter(r => r.uhid === uhid);
    return list;
  }
};

// Imaging Service
export const imagingService = {
  async getStudies(uhid?: string): Promise<ImagingStudy[]> {
    const list = getStorage<ImagingStudy[]>('imaging_studies', mockImagingStudies);
    if (uhid) return list.filter(i => i.uhid === uhid);
    return list;
  }
};

// Billing Service
export const billingService = {
  async getInvoices(uhid?: string): Promise<BillInvoice[]> {
    const list = getStorage<BillInvoice[]>('bill_invoices', mockBillInvoices);
    if (uhid) return list.filter(b => b.uhid === uhid);
    return list;
  },
  async createInvoice(invoice: Omit<BillInvoice, 'id'>): Promise<BillInvoice> {
    const list = await this.getInvoices();
    const newInv: BillInvoice = { ...invoice, id: `b-${Date.now()}` };
    const updated = [newInv, ...list];
    setStorage('bill_invoices', updated);
    return newInv;
  }
};

// Follow-up Service
export const followUpService = {
  async getFollowUps(): Promise<FollowUpItem[]> {
    return getStorage<FollowUpItem[]>('follow_ups', mockFollowUps);
  },
  async updateStatus(id: string, status: FollowUpItem['status']): Promise<void> {
    const list = await this.getFollowUps();
    const item = list.find(f => f.id === id);
    if (item) {
      item.status = status;
      setStorage('follow_ups', list);
    }
  }
};

// Tasks & Alerts Service
export const taskService = {
  async getTasks(): Promise<TaskAlertItem[]> {
    return getStorage<TaskAlertItem[]>('tasks_alerts', mockTasksAlerts);
  },
  async toggleTaskStatus(id: string): Promise<TaskAlertItem[]> {
    const list = await this.getTasks();
    const item = list.find(t => t.id === id);
    if (item) {
      item.status = item.status === 'Completed' ? 'Pending' : 'Completed';
      setStorage('tasks_alerts', list);
    }
    return list;
  }
};

// Messages Service
export const messageService = {
  async getThreads(): Promise<MessageThread[]> {
    return getStorage<MessageThread[]>('message_threads', mockMessageThreads);
  },
  async sendMessage(threadId: string, text: string): Promise<MessageThread[]> {
    const list = await this.getThreads();
    const thread = list.find(t => t.id === threadId);
    if (thread) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      thread.messages.push({
        id: `m-${Date.now()}`,
        sender: 'doctor',
        text,
        time: timeStr,
        status: 'delivered'
      });
      thread.preview = text;
      thread.time = timeStr;
      setStorage('message_threads', list);
    }
    return list;
  }
};

// Settings Service
export const settingsService = {
  async getSettings(): Promise<SettingsState> {
    return getStorage<SettingsState>('settings', initialSettings);
  },
  async saveSettings(settings: SettingsState): Promise<void> {
    setStorage('settings', settings);
  }
};
