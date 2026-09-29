import React from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/appContextCore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/layout/ToastContainer';
import { CommandPaletteModal } from './components/layout/CommandPaletteModal';

// 17 Hospital SaaS Modules (Pixel-perfect to screenshots)
import { DashboardScreen } from './components/screens/DashboardScreen';
import { PatientsScreen } from './components/screens/PatientsScreen';
import { AppointmentsScreen } from './components/screens/AppointmentsScreen';
import { ConsultationScreen } from './components/screens/ConsultationScreen';
import { ClinicalNotesScreen } from './components/screens/ClinicalNotesScreen';
import { LabReportsScreen } from './components/screens/LabReportsScreen';
import { ImagingScreen } from './components/screens/ImagingScreen';
import { PrescriptionsScreen } from './components/screens/PrescriptionsScreen';
import { MedicationsScreen } from './components/screens/MedicationsScreen';
import { BillingScreen } from './components/screens/BillingScreen';
import { FollowUpsScreen } from './components/screens/FollowUpsScreen';
import { TimelineScreen } from './components/screens/TimelineScreen';
import { DocumentsScreen } from './components/screens/DocumentsScreen';
import { VitalsScreen } from './components/screens/VitalsScreen';
import { HospitalKnowledgeScreen } from './components/screens/HospitalKnowledgeScreen';
import { ClinicalGuidelinesScreen } from './components/screens/ClinicalGuidelinesScreen';
import { VoiceToNotesScreen } from './components/screens/VoiceToNotesScreen';
import { TasksAlertsScreen } from './components/screens/TasksAlertsScreen';
import { MessagesScreen } from './components/screens/MessagesScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';

const MainLayout: React.FC = () => {
  const { activeScreen } = useApp();

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'patients':
        return <PatientsScreen />;
      case 'appointments':
        return <AppointmentsScreen />;
      case 'consultation':
        return <ConsultationScreen />;
      case 'emr':
        return <ClinicalNotesScreen />;
      case 'timeline':
        return <TimelineScreen />;
      case 'lab-reports':
        return <LabReportsScreen />;
      case 'imaging':
        return <ImagingScreen />;
      case 'prescriptions':
        return <PrescriptionsScreen />;
      case 'medications':
        return <MedicationsScreen />;
      case 'documents':
        return <DocumentsScreen />;
      case 'vitals':
        return <VitalsScreen />;
      case 'billing':
        return <BillingScreen />;
      case 'follow-ups':
        return <FollowUpsScreen />;
      case 'hospital-knowledge':
        return <HospitalKnowledgeScreen />;
      case 'clinical-guidelines':
        return <ClinicalGuidelinesScreen />;
      case 'voice-to-notes':
        return <VoiceToNotesScreen />;
      case 'tasks-alerts':
        return <TasksAlertsScreen />;
      case 'messages':
        return <MessagesScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="app-container">
      {/* 17-Module Sidebar Navigation */}
      <Sidebar />

      {/* Main Workstation Area */}
      <div className="app-main">
        {/* Top Header with ⌘K Search, Notifications & Doctor Profile */}
        <Header />

        {/* Scrollable Viewport for Active Screen */}
        <main
          id="main-content-viewport"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: 'var(--bg-body)'
          }}
        >
          {renderActiveScreen()}
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <CommandPaletteModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
