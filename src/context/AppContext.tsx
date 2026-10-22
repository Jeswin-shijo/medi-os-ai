import React, { useState, useEffect, useCallback } from 'react';
import { ScreenId, Patient, AuthUser } from '../types';
import { authService, messageService, patientService, taskService } from '../services';
import { UNAUTHORIZED_EVENT, errorMessage } from '../services/api';
import { AppContext, type AuthStatus, type Toast } from './appContextCore';

const LAST_PATIENT_KEY = 'medios_last_patient';

const rememberPatient = (uhid: string | null) => {
  try {
    if (uhid) localStorage.setItem(LAST_PATIENT_KEY, uhid);
    else localStorage.removeItem(LAST_PATIENT_KEY);
  } catch {
    // Only a convenience; ignore blocked storage.
  }
};

const rememberedPatient = () => {
  try {
    return localStorage.getItem(LAST_PATIENT_KEY);
  } catch {
    return null;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() => (authService.hasSession() ? 'checking' : 'signed-out'));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatient, setActivePatientState] = useState<Patient | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [openAlertCount, setOpenAlertCount] = useState(0);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const setActivePatient = useCallback((patient: Patient | null) => {
    setActivePatientState(patient);
    rememberPatient(patient?.uhid ?? null);
  }, []);

  const refreshPatients = useCallback(async () => {
    const list = await patientService.getPatients();
    setPatients(list);
    // Keep the selected patient in sync with the server copy; on first load reopen
    // the patient used last, else the most recently updated one.
    setActivePatientState(current => {
      const uhid = current?.uhid ?? rememberedPatient();
      return list.find(p => p.uhid === uhid) ?? list[0] ?? null;
    });
    return list;
  }, []);

  const resetSession = useCallback(() => {
    setUser(null);
    setPatients([]);
    setActivePatientState(null);
    setActiveScreen('dashboard');
    setUnreadMessagesCount(0);
    setOpenAlertCount(0);
    setAuthStatus('signed-out');
  }, []);

  /** Loads what every screen shares once a session starts. */
  const loadSessionData = useCallback(() => {
    refreshPatients().catch(err => showToast(errorMessage(err), 'error'));
    messageService
      .getUnreadCount()
      .then(setUnreadMessagesCount)
      .catch(() => setUnreadMessagesCount(0));
    taskService
      .getTasks()
      .then(tasks => setOpenAlertCount(tasks.filter(t => t.category === 'Critical' && t.status !== 'Completed').length))
      .catch(() => setOpenAlertCount(0));
  }, [refreshPatients, showToast]);

  // Restore a stored session on load.
  useEffect(() => {
    if (!authService.hasSession()) return;
    authService
      .me()
      .then(me => {
        setUser(me);
        setAuthStatus('signed-in');
        loadSessionData();
      })
      .catch(() => {
        authService.logout();
        resetSession();
      });
  }, [resetSession, loadSessionData]);

  // The API rejected the token (expired or revoked): back to sign-in.
  useEffect(() => {
    const onUnauthorized = () => {
      resetSession();
      showToast('Your session has expired. Please sign in again.', 'warning');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [resetSession, showToast]);

  const signIn = async (email: string, password: string) => {
    const me = await authService.login(email, password);
    setUser(me);
    setAuthStatus('signed-in');
    loadSessionData();
  };

  const signOut = () => {
    authService.logout();
    resetSession();
  };

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

  const navigateToPatientScreen = (screen: ScreenId, patient: Patient) => {
    setActivePatient(patient);
    setActiveScreen(screen);
  };

  return (
    <AppContext.Provider
      value={{
        authStatus,
        user,
        signIn,
        signOut,
        activeScreen,
        setActiveScreen,
        patients,
        refreshPatients,
        activePatient,
        setActivePatient,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        toasts,
        showToast,
        openAlertCount,
        setOpenAlertCount,
        unreadMessagesCount,
        setUnreadMessagesCount,
        navigateToPatientScreen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
