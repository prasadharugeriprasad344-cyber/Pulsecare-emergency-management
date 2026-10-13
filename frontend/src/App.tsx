import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { OverviewPage } from './pages/OverviewPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { QueuePage } from './pages/QueuePage';
import { SimulatorPage } from './pages/SimulatorPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { StarvationPage } from './pages/StarvationPage';
import { HistoryPage } from './pages/HistoryPage';
import { AboutPage } from './pages/AboutPage';

import { Patient, ScheduledPatient, TimelineBlock, SimulationMetrics, ActivityEvent } from './types';
import { ApiService, PRESET_SCENARIOS } from './services/api';
import { runPriorityScheduling } from './services/scheduler';
import { Search, X, Activity } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // Core Patient State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  // Search Modal
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Initial Data Load
  useEffect(() => {
    const loadInitialData = async () => {
      const { patients: loadedPatients, isBackend } = await ApiService.getPatients();
      setPatients(loadedPatients);
      setIsBackendConnected(isBackend);

      setActivities([
        {
          id: 'act-1',
          timestamp: 'Just now',
          title: 'System Initialized',
          description: `Loaded ${loadedPatients.length} patient records into active triage.`,
          type: 'admit',
        },
      ]);
    };
    loadInitialData();
  }, []);

  // Compute baseline priority schedule
  const scheduleResult = useMemo(() => {
    return runPriorityScheduling(patients);
  }, [patients]);

  const addActivity = (title: string, description: string, type: ActivityEvent['type'] = 'admit') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newAct: ActivityEvent = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      title,
      description,
      type,
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 19)]);
  };

  // Handlers
  const handlePatientAdded = async (patient: Patient) => {
    await ApiService.savePatient(patient);
    setPatients((prev) => [...prev, patient].sort((a, b) => a.arrival_time - b.arrival_time));
    addActivity('Patient Admitted', `${patient.patient_id} (${patient.name}) admitted with Priority ${patient.priority}.`, 'register');
  };

  const handleBulkAdded = async (newCohort: Patient[], title: string) => {
    await ApiService.bulkSavePatients(newCohort);
    setPatients(newCohort);
    addActivity('Cohort Loaded', title, 'admit');
  };

  const handleClearAll = async () => {
    await ApiService.clearAllPatients();
    setPatients([]);
    addActivity('Database Cleared', 'All active patient records were removed.', 'reset');
  };

  const handleDeletePatient = async (patientId: string) => {
    await ApiService.deletePatient(patientId);
    setPatients((prev) => prev.filter((p) => p.patient_id !== patientId));
    addActivity('Patient Removed', `Deleted patient ${patientId} from system.`, 'reset');
  };

  const handleUpdatePatient = async (updated: Patient) => {
    await ApiService.savePatient(updated);
    setPatients((prev) =>
      prev.map((p) => (p.patient_id === updated.patient_id ? updated : p))
    );
    addActivity('Record Updated', `Updated parameters for ${updated.patient_id}.`, 'admit');
  };

  const handleDynamicAdmission = async (patient: Patient) => {
    await ApiService.savePatient(patient);
    setPatients((prev) => [...prev, patient]);
    addActivity('Dynamic Influx', `Patient ${patient.patient_id} arrived during active simulation!`, 'register');
  };

  // Keyboard shortcut for Cmd+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return patients.filter((p) => p.patient_id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
  }, [patients, searchQuery]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isBackendConnected={isBackendConnected}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileDrawerOpen}
        setMobileOpen={setMobileDrawerOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
        `}
      >
        <TopNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          setMobileOpen={setMobileDrawerOpen}
          activities={activities}
          onSearchOpen={() => setSearchModalOpen(true)}
        />

        {/* Dynamic Page Router */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && (
            <OverviewPage
              patients={patients}
              scheduledPatients={scheduleResult.scheduled}
              timeline={scheduleResult.timeline}
              metrics={scheduleResult.metrics}
              activities={activities}
              setCurrentTab={setCurrentTab}
            />
          )}

          {currentTab === 'registration' && (
            <RegistrationPage
              patients={patients}
              onPatientAdded={handlePatientAdded}
              onBulkAdded={handleBulkAdded}
              onClearAll={handleClearAll}
            />
          )}

          {currentTab === 'queue' && (
            <QueuePage
              patients={patients}
              scheduledPatients={scheduleResult.scheduled}
              onDeletePatient={handleDeletePatient}
              onUpdatePatient={handleUpdatePatient}
            />
          )}

          {currentTab === 'simulator' && (
            <SimulatorPage
              patients={patients}
              onDynamicPatientAdded={handleDynamicAdmission}
              onSimulationSaved={() => addActivity('Simulation Saved', 'Session results persisted to history.', 'admit')}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsPage patients={patients} />
          )}

          {currentTab === 'starvation' && (
            <StarvationPage />
          )}

          {currentTab === 'history' && (
            <HistoryPage />
          )}

          {currentTab === 'about' && (
            <AboutPage />
          )}
        </main>
      </div>

      {/* Quick Search Modal (Cmd+K) */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="bg-surface rounded-2xl max-w-lg w-full border border-border shadow-floating overflow-hidden">
            <div className="p-3 border-b border-border flex items-center gap-2">
              <Search className="w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient ID, name, or triage..."
                className="flex-1 bg-transparent text-sm text-navy focus:outline-none"
                autoFocus
              />
              <button onClick={() => setSearchModalOpen(false)} className="p-1 rounded-lg text-text-muted hover:text-navy">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              {searchResults.map((p) => (
                <div
                  key={p.patient_id}
                  onClick={() => {
                    setSearchModalOpen(false);
                    setCurrentTab('queue');
                  }}
                  className="p-2.5 rounded-xl hover:bg-background cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-navy">{p.patient_id}</span>
                    <span className="font-semibold text-text-secondary">{p.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-background border border-border text-navy">
                    Priority {p.priority} | t={p.arrival_time}m
                  </span>
                </div>
              ))}

              {searchQuery && searchResults.length === 0 && (
                <div className="p-6 text-center text-xs text-text-secondary">
                  No matching patients found.
                </div>
              )}

              {!searchQuery && (
                <div className="p-3 text-[11px] text-text-muted text-center">
                  Type a patient ID (e.g. "P-101") or name to search records.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
