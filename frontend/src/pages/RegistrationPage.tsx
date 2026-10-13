import React, { useState } from 'react';
import {
  UserPlus,
  Sparkles,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  Activity,
  HeartPulse
} from 'lucide-react';
import { Patient, PriorityNumber, PRIORITY_CONFIG } from '../types';
import { ApiService, PRESET_SCENARIOS, generateSyntheticCohort } from '../services/api';

interface RegistrationPageProps {
  patients: Patient[];
  onPatientAdded: (patient: Patient) => void;
  onBulkAdded: (patients: Patient[], scenarioTitle: string) => void;
  onClearAll: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({
  patients,
  onPatientAdded,
  onBulkAdded,
  onClearAll,
}) => {
  // Form State
  const defaultNextId = `P-${String(patients.length + 101).padStart(3, '0')}`;
  const [patientId, setPatientId] = useState(defaultNextId);
  const [name, setName] = useState('');
  const [arrivalTime, setArrivalTime] = useState<number>(0);
  const [priority, setPriority] = useState<PriorityNumber>(2);
  const [duration, setDuration] = useState<number>(4.0);
  const [notes, setNotes] = useState('');

  // UI Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Synthetic Generator State
  const [seed, setSeed] = useState<number>(42);
  const [customCount, setCustomCount] = useState<number>(20);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    const cleanId = patientId.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanId) {
      setErrorMsg('Patient ID is required.');
      return;
    }
    if (patients.some((p) => p.patient_id.toLowerCase() === cleanId.toLowerCase())) {
      setErrorMsg(`Patient ID "${cleanId}" already exists. Please choose a unique ID.`);
      return;
    }
    if (!cleanName) {
      setErrorMsg('Patient name or synthetic identifier is required.');
      return;
    }
    if (arrivalTime < 0) {
      setErrorMsg('Arrival time cannot be negative.');
      return;
    }
    if (duration <= 0) {
      setErrorMsg('Treatment duration must be greater than 0.');
      return;
    }

    const newPatient: Patient = {
      patient_id: cleanId,
      name: cleanName,
      arrival_time: Number(arrivalTime),
      priority,
      treatment_duration: Number(duration),
      notes: notes.trim() || undefined,
      status: 'waiting',
      created_at: new Date().toISOString(),
    };

    onPatientAdded(newPatient);
    setSuccessMsg(`Patient ${newPatient.patient_id} (${newPatient.name}) admitted successfully.`);

    // Reset form
    const nextNum = patients.length + 102;
    setPatientId(`P-${String(nextNum).padStart(3, '0')}`);
    setName('');
    setNotes('');
  };

  const handleQuickCohort = (count: number) => {
    const cohort = generateSyntheticCohort(count, 30.0, 2.0, 9.0, seed);
    onBulkAdded(cohort, `Generated cohort of ${count} synthetic patients (Seed: ${seed})`);
    setSuccessMsg(`Generated and admitted ${count} synthetic patients with random seed ${seed}.`);
  };

  const handleLoadScenario = (key: string) => {
    const sc = PRESET_SCENARIOS[key];
    if (sc) {
      onBulkAdded(sc.patients, `Loaded scenario: ${sc.title}`);
      setSuccessMsg(`Successfully populated scenario: ${sc.title}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-navy">
          Patient Registration & Intake
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Admit individual patients with validated triage parameters or populate synthetic educational cohorts.
        </p>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-priority-low shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs text-green-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-priority-critical shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs text-red-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Form and Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Registration Form */}
        <div className="lg:col-span-2 bg-surface rounded-2xl p-6 border border-border shadow-subtle">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border">
            <UserPlus className="w-5 h-5 text-teal-medical" />
            <h2 className="font-heading font-bold text-lg text-navy">
              Single Patient Admission Form
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Patient ID */}
              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-1.5">
                  Patient ID <span className="text-priority-critical">*</span>
                </label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="e.g. P-101"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-navy focus:outline-none focus:border-teal-medical transition-colors"
                  required
                />
              </div>

              {/* Patient Name */}
              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-1.5">
                  Patient Name or Synthetic ID <span className="text-priority-critical">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Taylor (Synthetic)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-navy focus:outline-none focus:border-teal-medical transition-colors"
                  required
                />
              </div>

              {/* Arrival Time */}
              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-1.5">
                  Arrival Time (Simulation Minutes) <span className="text-priority-critical">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-navy focus:outline-none focus:border-teal-medical transition-colors"
                  required
                />
              </div>

              {/* Treatment Duration */}
              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-1.5">
                  Treatment Duration (Minutes) <span className="text-priority-critical">*</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={duration}
                  onChange={(e) => setDuration(parseFloat(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-navy focus:outline-none focus:border-teal-medical transition-colors"
                  required
                />
              </div>
            </div>

            {/* Priority Level Radio Cards */}
            <div>
              <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                Triage Priority Level (Lower Number = Higher CPU Scheduling Priority)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(Object.entries(PRIORITY_CONFIG) as [unknown, typeof PRIORITY_CONFIG[1]][]).map(([lvlStr, cfg]) => {
                  const lvl = Number(lvlStr) as PriorityNumber;
                  const isSelected = priority === lvl;
                  return (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setPriority(lvl)}
                      className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between
                        ${isSelected
                          ? 'border-navy bg-navy text-white shadow-subtle'
                          : 'border-border bg-background hover:bg-surface text-navy'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${isSelected ? 'text-teal-soft' : ''}`}>
                          Level {lvl}
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                      </div>
                      <span className="text-sm font-heading font-extrabold truncate">
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-text-secondary mt-1.5">
                ⚠️ Academic simulation note: Priority levels are numerical process weights for educational OS demonstration, not clinical diagnosis.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-1.5">
                Non-Clinical Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Synthetic test record, room A-3"
                className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs text-navy focus:outline-none focus:border-teal-medical transition-colors"
              />
            </div>

            {/* Submit & Reset Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-light transition-colors shadow-subtle flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4 text-teal-medical" />
                <span>Admit Patient to System</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setName('');
                  setArrivalTime(0);
                  setDuration(4);
                  setNotes('');
                }}
                className="px-4 py-2.5 rounded-xl bg-surface border border-border text-sm font-semibold text-text-secondary hover:text-navy hover:bg-background transition-colors"
              >
                Reset Fields
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Live Preview Card */}
        <div className="space-y-4">
          <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle">
            <span className="text-xs font-heading font-bold text-navy uppercase tracking-wider mb-3 block">
              Patient Record Preview
            </span>

            <div className="p-4 rounded-xl border border-border bg-background space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-navy">{patientId || 'P-???'}</span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: PRIORITY_CONFIG[priority].bg,
                    color: PRIORITY_CONFIG[priority].color,
                    border: `1px solid ${PRIORITY_CONFIG[priority].border}`,
                  }}
                >
                  Priority {priority}: {PRIORITY_CONFIG[priority].label}
                </span>
              </div>

              <div>
                <h4 className="font-heading font-bold text-base text-navy">
                  {name || 'Patient Name Preview'}
                </h4>
                <p className="text-xs text-text-secondary">
                  {notes || 'No additional notes provided'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                <div>
                  <span className="text-text-muted block text-[10px]">Arrival Clock</span>
                  <span className="font-semibold text-navy">t = {arrivalTime}m</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">Est. Duration</span>
                  <span className="font-semibold text-navy">{duration} min</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-teal-soft/60 border border-teal-medical/20 text-xs text-teal-dark">
              💡 <strong>OS Analogy:</strong> This patient will enter the ready queue at $t={arrivalTime}$. When the CPU doctor becomes idle, the patient with lowest numeric priority is dispatched first.
            </div>
          </div>
        </div>
      </div>

      {/* Synthetic Cohort Generator & Educational Scenarios */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-6">
        <div>
          <h2 className="font-heading font-bold text-lg text-navy flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-medical" />
            <span>Built-in Synthetic Data & Benchmark Scenarios</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Instantly populate reproducible cohorts or classical OS benchmark test cases.
          </p>
        </div>

        {/* Quick Batch Buttons (20, 100, 500) */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-navy uppercase tracking-wider">
              Quick Cohort Size:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Random Seed:</span>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
                className="w-16 px-2 py-1 rounded-lg bg-background border border-border text-xs text-center font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleQuickCohort(20)}
              className="p-3.5 rounded-xl border border-border bg-background hover:bg-surface hover:border-teal-medical transition-all text-left flex items-center justify-between group shadow-subtle"
            >
              <div>
                <span className="font-bold text-sm text-navy block group-hover:text-teal-medical">
                  Generate 20 Patients
                </span>
                <span className="text-xs text-text-secondary">Standard small emergency ward</span>
              </div>
              <Sparkles className="w-4 h-4 text-text-muted group-hover:text-teal-medical" />
            </button>

            <button
              onClick={() => handleQuickCohort(100)}
              className="p-3.5 rounded-xl border border-border bg-background hover:bg-surface hover:border-teal-medical transition-all text-left flex items-center justify-between group shadow-subtle"
            >
              <div>
                <span className="font-bold text-sm text-navy block group-hover:text-teal-medical">
                  Generate 100 Patients
                </span>
                <span className="text-xs text-text-secondary">High throughput stress test</span>
              </div>
              <Sparkles className="w-4 h-4 text-text-muted group-hover:text-teal-medical" />
            </button>

            <button
              onClick={() => handleQuickCohort(500)}
              className="p-3.5 rounded-xl border border-border bg-background hover:bg-surface hover:border-teal-medical transition-all text-left flex items-center justify-between group shadow-subtle"
            >
              <div>
                <span className="font-bold text-sm text-navy block group-hover:text-teal-medical">
                  Generate 500 Patients
                </span>
                <span className="text-xs text-text-secondary">Mass-casualty load simulation</span>
              </div>
              <Sparkles className="w-4 h-4 text-text-muted group-hover:text-teal-medical" />
            </button>
          </div>
        </div>

        {/* Curated Educational Scenarios */}
        <div className="space-y-3 pt-3 border-t border-border">
          <span className="text-xs font-semibold text-navy uppercase tracking-wider block">
            Curated Educational Scenarios:
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(PRESET_SCENARIOS).map(([key, sc]) => (
              <div
                key={key}
                className="p-3.5 rounded-xl border border-border bg-background hover:bg-surface transition-all flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs text-navy">{sc.title}</h4>
                  <p className="text-[11px] text-text-secondary mt-1">{sc.description}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-semibold">{sc.patients.length} patients</span>
                  <button
                    onClick={() => handleLoadScenario(key)}
                    className="px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-semibold text-teal-dark hover:bg-teal-soft hover:border-teal-medical transition-colors"
                  >
                    Load Scenario
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clear All Patients with Confirmation */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            Currently loaded: <strong>{patients.length} patients</strong> in active registry.
          </span>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete all registered patient records?')) {
                onClearAll();
                setSuccessMsg('All patient records successfully cleared.');
              }
            }}
            className="px-3 py-1.5 rounded-xl border border-red-200 text-xs font-semibold text-priority-critical hover:bg-red-50 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Patients</span>
          </button>
        </div>
      </div>
    </div>
  );
};
