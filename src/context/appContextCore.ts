import { createContext, useContext } from 'react';
import { ScreenId, Patient, AuthUser } from '../types';

// The context object lives apart from AppProvider (which imports the data
// services) so hot-reloading a service file doesn't create a new context identity
// and crash every consumer with "useApp must be used within an AppProvider".

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

/** `checking` while a stored token is being verified on load. */
export type AuthStatus = 'checking' | 'signed-in' | 'signed-out';

export interface AppContextType {
  authStatus: AuthStatus;
  user: AuthUser | null;
  /** Throws ApiError on bad credentials or when the API is unreachable. */
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  /** Applies a Settings "Session Timeout" value (e.g. "30 minutes") to the inactivity sign-out. */
  setSessionTimeout: (label: string) => void;
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
  /** All patients, most recently updated first. */
  patients: Patient[];
  /** Reloads `patients` (and the active patient's copy) from the API. */
  refreshPatients: () => Promise<Patient[]>;
  activePatient: Patient | null;
  setActivePatient: (patient: Patient | null) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  /** Open critical tasks/alerts (header bell). */
  openAlertCount: number;
  setOpenAlertCount: (count: number) => void;
  unreadMessagesCount: number;
  setUnreadMessagesCount: (count: number) => void;
  navigateToPatientScreen: (screen: ScreenId, patient: Patient) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
