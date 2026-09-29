import { createContext, useContext } from 'react';
import { ScreenId, Patient } from '../types';

// The context object lives apart from AppProvider (which imports the mock data
// services) so hot-reloading a mock file doesn't create a new context identity
// and crash every consumer with "useApp must be used within an AppProvider".

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface AppContextType {
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
  activePatient: Patient | null;
  setActivePatient: (patient: Patient | null) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
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
