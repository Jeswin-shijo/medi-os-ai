import React, { createContext, useContext, useState, useEffect } from 'react';
import { ScreenId, Patient } from '../types';
import { patientService } from '../services';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextType {
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(3);

  // Initialize active patient to Arun Kumar
  useEffect(() => {
    patientService.getPatients().then(list => {
      const arun = list.find(p => p.uhid === 'MHK202500321');
      if (arun) {
        setActivePatient(arun);
      } else if (list.length > 0) {
        setActivePatient(list[0]);
      }
    });
  }, []);

  // Listen for keyboard shortcut Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const navigateToPatientScreen = (screen: ScreenId, patient: Patient) => {
    setActivePatient(patient);
    setActiveScreen(screen);
  };

  return (
    <AppContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        activePatient,
        setActivePatient,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        toasts,
        showToast,
        unreadMessagesCount,
        setUnreadMessagesCount,
        navigateToPatientScreen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
