import React, { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { ScreenId, Patient, AuthUser } from '../types';
import { authService, messageService, patientService, settingsService, taskService } from '../services';
import { parseSessionTimeout, useIdleSignOut } from '../hooks/useIdleSignOut';
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
  // Always 'checking' first: whether a session exists is only known by asking the
  // API (the refresh cookie is httpOnly, so the page cannot see it).
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const authStatusRef = useRef<AuthStatus>('checking');
  useEffect(() => {
    authStatusRef.current = authStatus;
  }, [authStatus]);
  const [idleMinutes, setIdleMinutes] = useState<number | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeScreen, setActiveScreenState] = useState<ScreenId>('dashboard');

  // Screen changes run as a view transition where the browser supports it (styles in index.css):
  // the content crossfades and the sidebar highlight glides to the new item. Elsewhere it is instant.
  const activeScreenRef = useRef(activeScreen);
  const setActiveScreen = useCallback((screen: ScreenId) => {
    if (screen === activeScreenRef.current) return;
    activeScreenRef.current = screen;
    const swap = () => {
      setActiveScreenState(screen);
      document.getElementById('main-content-viewport')?.scrollTo(0, 0);
    };
    if (!document.startViewTransition) {
      swap();
      return;
    }
    const transition = document.startViewTransition(() => flushSync(swap));
    // A quick second click skips the first transition; that is expected, not an error.
    transition.ready.catch(() => {});
    transition.finished.catch(() => {});
  }, []);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatient, setActivePatientState] = useState<Patient | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [openAlertCount, setOpenAlertCount] = useState(0);
  const [focusRequestId, setFocusRequestId] = useState<string | null>(null);

  const refreshAlertCount = useCallback(async () => {
    try {
      const tasks = await taskService.getTasks();
      setOpenAlertCount(tasks.filter(t => t.category === 'Critical' && t.status !== 'Completed').length);
    } catch {
      setOpenAlertCount(0);
    }
  }, []);

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
    activeScreenRef.current = 'dashboard';
    setActiveScreenState('dashboard');
    setUnreadMessagesCount(0);
    setOpenAlertCount(0);
    setFocusRequestId(null);
    setIdleMinutes(null);
    setAuthStatus('signed-out');
  }, []);

  /** Loads what every screen shares once a session starts. */
  const loadSessionData = useCallback(() => {
    refreshPatients().catch(err => showToast(errorMessage(err), 'error'));
    messageService
      .getUnreadCount()
      .then(setUnreadMessagesCount)
      .catch(() => setUnreadMessagesCount(0));
    void refreshAlertCount();
    settingsService
      .getSettings()
      .then(s => setIdleMinutes(parseSessionTimeout(s.security?.sessionTimeout)))
      .catch(() => setIdleMinutes(null));
  }, [refreshPatients, refreshAlertCount, showToast]);

  // Resume the session from the refresh cookie on page load.
  useEffect(() => {
    authService.restore().then(me => {
      if (!me) {
        resetSession();
        return;
      }
      setUser(me);
      setAuthStatus('signed-in');
      loadSessionData();
    });
  }, [resetSession, loadSessionData]);

  // The session could not be renewed (expired, revoked, signed out elsewhere).
  useEffect(() => {
    const onUnauthorized = () => {
      // Several requests can fail at once; report it a single time.
      if (authStatusRef.current !== 'signed-in') return;
      resetSession();
      showToast('Your session has ended. Please sign in again.', 'warning');
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

  const signOut = useCallback(() => {
    resetSession();
    authService.logout();
  }, [resetSession]);

  // Sign out unattended workstations (Settings → Session Timeout).
  useIdleSignOut(authStatus === 'signed-in' ? idleMinutes : null, () => {
    signOut();
    showToast(`Signed out after ${idleMinutes} minutes of inactivity`, 'info');
  });

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

  const openBedRequest = useCallback(
    (id: string) => {
      setFocusRequestId(id);
      setActiveScreen('bed-agent');
    },
    [setActiveScreen]
  );
  const clearFocusRequest = useCallback(() => setFocusRequestId(null), []);

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
        refreshAlertCount,
        openBedRequest,
        focusRequestId,
        clearFocusRequest,
        setSessionTimeout: (label: string) => setIdleMinutes(parseSessionTimeout(label)),
        unreadMessagesCount,
        setUnreadMessagesCount,
        navigateToPatientScreen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
