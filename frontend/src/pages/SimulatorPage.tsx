import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  UserPlus,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Shield,
  Save,
  Gauge
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { Patient, ScheduledPatient, TimelineBlock, PriorityNumber, PRIORITY_CONFIG } from '../types';
import { runPriorityScheduling, runFCFSScheduling, runAgingScheduling } from '../services/scheduler';
import { ApiService } from '../services/api';

interface SimulatorPageProps {
  patients: Patient[];
  onDynamicPatientAdded: (patient: Patient) => void;
  onSimulationSaved: () => void;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  patients,
  onDynamicPatientAdded,
  onSimulationSaved,
}) => {
  // Simulator Controls
  const [policy, setPolicy] = useState<'PRIORITY' | 'FCFS' | 'PRIORITY_AGING'>('PRIORITY');
  const [agingInterval, setAgingInterval] = useState<number>(6.0);
  const [speed, setSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Simulation Clock and State
  const [simClock, setSimClock] = useState<number>(0);
  const [completedPatients, setCompletedPatients] = useState<ScheduledPatient[]>([]);
  const [activePatient, setActivePatient] = useState<{
    patient: Patient;
    startTime: number;
    completionTime: number;
  } | null>(null);

  const [decisionLogs, setDecisionLogs] = useState<string[]>([]);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Dynamic Injection Form State
  const [showInjectForm, setShowInjectForm] = useState<boolean>(false);
  const [injId, setInjId] = useState(`DYN-${String(patients.length + 1).padStart(2, '0')}`);
  const [injName, setInjName] = useState('Emergency Influx (Synthetic)');
  const [injPriority, setInjPriority] = useState<PriorityNumber>(1);
  const [injDuration, setInjDuration] = useState<number>(3.5);

  // Dynamic Ready Pool and Unarrived Pool
  const [waitingQueue, setWaitingQueue] = useState<Patient[]>([]);
  const [unarrivedPool, setUnarrivedPool] = useState<Patient[]>([]);
  const [timelineBlocks, setTimelineBlocks] = useState<TimelineBlock[]>([]);

  // Initialize simulation state when patients or policy changes
  const resetSimulation = () => {
    setIsPlaying(false);
    setSimClock(0);
    setCompletedPatients([]);
    setActivePatient(null);
    setTimelineBlocks([]);
    setSavedSuccess(false);

    // Patients at t=0 are ready; others are unarrived
    const ready = patients.filter((p) => p.arrival_time <= 0);
    const unarrived = patients.filter((p) => p.arrival_time > 0).sort((a, b) => a.arrival_time - b.arrival_time);

    setWaitingQueue(ready);
    setUnarrivedPool(unarrived);
    setDecisionLogs([`[t=0.0m] Initialized simulation with policy ${policy}. ${ready.length} patient(s) waiting at t=0.`]);
  };

  useEffect(() => {
    resetSimulation();
  }, [patients, policy, agingInterval]);

  // Compute effective priority for a patient given clock
  const getEffectivePriority = (p: Patient, currTime: number): PriorityNumber => {
    if (policy !== 'PRIORITY_AGING' || agingInterval <= 0) return p.priority;
    const wait = Math.max(0, currTime - p.arrival_time);
    const boost = Math.floor(wait / agingInterval);
    return Math.max(1, p.priority - boost) as PriorityNumber;
  };

  // Step function: advances discrete event or tick
  const stepForward = () => {
    // Check if finished
    if (!activePatient && waitingQueue.length === 0 && unarrivedPool.length === 0) {
      setIsPlaying(false);
      return;
    }

    // 1. If a patient is active in treatment, advance clock to finish their treatment
    if (activePatient) {
      const p = activePatient.patient;
      const startT = activePatient.startTime;
      const endT = activePatient.completionTime;

      const tat = endT - p.arrival_time;
      const wt = tat - p.treatment_duration;
      const rt = startT - p.arrival_time;
      const effP = getEffectivePriority(p, startT);

      const scheduledRec: ScheduledPatient = {
        patient_id: p.patient_id,
        name: p.name,
        arrival_time: p.arrival_time,
        priority: p.priority,
        effective_priority: effP,
        treatment_duration: p.treatment_duration,
        start_time: startT,
        completion_time: endT,
        waiting_time: Number(wt.toFixed(2)),
        turnaround_time: Number(tat.toFixed(2)),
        response_time: Number(rt.toFixed(2)),
      };

      const newCompleted = [...completedPatients, scheduledRec];
      setCompletedPatients(newCompleted);

      setTimelineBlocks((prev) => [
        ...prev,
        {
          start_time: startT,
          end_time: endT,
          duration: Number((endT - startT).toFixed(2)),
          label: `${p.patient_id} (${p.name})`,
          priority: p.priority,
          is_idle: false,
          patient_id: p.patient_id,
        },
      ]);

      const newClock = endT;
      setSimClock(newClock);

      // Check newly arrived patients during this treatment block
      const newlyArrived = unarrivedPool.filter((item) => item.arrival_time <= newClock);
      const remainingUnarrived = unarrivedPool.filter((item) => item.arrival_time > newClock);

      const newWaiting = [...waitingQueue, ...newlyArrived];
      setWaitingQueue(newWaiting);
      setUnarrivedPool(remainingUnarrived);
      setActivePatient(null);

      setDecisionLogs((prev) => [
        `[t=${newClock.toFixed(1)}m] COMPLETED: ${p.patient_id} (${p.name}) discharged. Turnaround: ${tat.toFixed(1)}m, Waiting: ${wt.toFixed(1)}m.`,
        ...prev,
      ]);

      // Check if this was the last patient
      if (newWaiting.length === 0 && remainingUnarrived.length === 0) {
        setIsPlaying(false);
        confetti({ particleCount: 70, spread: 60 });
        setDecisionLogs((prev) => [
          `[t=${newClock.toFixed(1)}m] All patients successfully treated! Simulation complete.`,
          ...prev,
        ]);
      }
      return;
    }

    // 2. Doctor is free -> check waitingQueue
    if (waitingQueue.length > 0) {
      // Pick next patient based on policy
      let sortedQueue = [...waitingQueue];
      let selected: Patient;
      let reason: string;

      if (policy === 'FCFS') {
        sortedQueue.sort((a, b) => a.arrival_time - b.arrival_time || a.patient_id.localeCompare(b.patient_id));
        selected = sortedQueue[0];
        reason = `First arrival in queue (Arrived: t=${selected.arrival_time}m)`;
      } else if (policy === 'PRIORITY_AGING') {
        sortedQueue.sort((a, b) => {
          const effA = getEffectivePriority(a, simClock);
          const effB = getEffectivePriority(b, simClock);
          return effA - effB || a.arrival_time - b.arrival_time;
        });
        selected = sortedQueue[0];
        const effP = getEffectivePriority(selected, simClock);
        reason = `Effective Priority Level ${effP} (Base ${selected.priority}, Arrived: t=${selected.arrival_time}m)`;
      } else {
        // PRIORITY
        sortedQueue.sort((a, b) => a.priority - b.priority || a.arrival_time - b.arrival_time);
        selected = sortedQueue[0];
        reason = `Highest priority (Level ${selected.priority} - ${PRIORITY_CONFIG[selected.priority].label}, Arrived: t=${selected.arrival_time}m)`;
      }

      const remainingWaiting = waitingQueue.filter((p) => p.patient_id !== selected.patient_id);
      setWaitingQueue(remainingWaiting);

      const startT = simClock;
      const endT = startT + selected.treatment_duration;
      setActivePatient({ patient: selected, startTime: startT, completionTime: endT });

      setDecisionLogs((prev) => [
        `[t=${simClock.toFixed(1)}m] SCHEDULER DISPATCH: Assigned doctor to ${selected.patient_id} (${selected.name}). Reason: ${reason}.`,
        ...prev,
      ]);
    } else {
      // Waiting queue is empty -> advance to next unarrived arrival (IDLE gap)
      if (unarrivedPool.length > 0) {
        const nextArrival = unarrivedPool[0].arrival_time;
        const gap = nextArrival - simClock;

        setTimelineBlocks((prev) => [
          ...prev,
          {
            start_time: simClock,
            end_time: nextArrival,
            duration: Number(gap.toFixed(2)),
            label: 'IDLE (Resource Free)',
            priority: null,
            is_idle: true,
            patient_id: null,
          },
        ]);

        const newClock = nextArrival;
        setSimClock(newClock);

        const newlyArrived = unarrivedPool.filter((item) => item.arrival_time <= newClock);
        const remainingUnarrived = unarrivedPool.filter((item) => item.arrival_time > newClock);

        setWaitingQueue(newlyArrived);
        setUnarrivedPool(remainingUnarrived);

        setDecisionLogs((prev) => [
          `[t=${simClock.toFixed(1)}m] DOCTOR IDLE: Waiting room empty. Advanced clock by ${gap.toFixed(1)}m to next arrival at t=${nextArrival}m.`,
          ...prev,
        ]);
      } else {
        setIsPlaying(false);
      }
    }
  };

  // Timer loop for auto playback
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(300, 1500 / speed);
    const timer = setInterval(() => {
      stepForward();
    }, intervalMs);
    return () => clearInterval(timer);
  });

  const handleInject = (e: React.FormEvent) => {
    e.preventDefault();
    const newP: Patient = {
      patient_id: injId.trim().toUpperCase(),
      name: injName.trim(),
      arrival_time: simClock,
      priority: injPriority,
      treatment_duration: Number(injDuration),
      status: 'waiting',
    };

    onDynamicPatientAdded(newP);
    setWaitingQueue((prev) => [...prev, newP]);
    setDecisionLogs((prev) => [
      `[t=${simClock.toFixed(1)}m] 🚑 DYNAMIC INJECTION: Patient ${newP.patient_id} admitted directly into active ER waiting room!`,
      ...prev,
    ]);

    setShowInjectForm(false);
    setInjId(`DYN-${String(patients.length + 2).padStart(2, '0')}`);
  };

  const handleSaveToHistory = async () => {
    if (completedPatients.length === 0) return;
    const simId = `SIM-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}`;

    const totalTime = simClock;
    const busyTime = completedPatients.reduce((acc, p) => acc + p.treatment_duration, 0);
    const idleTime = Math.max(0, totalTime - busyTime);
    const totalWt = completedPatients.reduce((acc, p) => acc + p.waiting_time, 0);
    const totalTat = completedPatients.reduce((acc, p) => acc + p.turnaround_time, 0);
    const count = completedPatients.length;

    await ApiService.saveHistory({
      simulation_id: simId,
      policy,
      aging_interval: policy === 'PRIORITY_AGING' ? agingInterval : undefined,
      metrics: {
        total_patients: count,
        total_simulation_time: Number(totalTime.toFixed(2)),
        idle_time: Number(idleTime.toFixed(2)),
        resource_utilization: Number(((busyTime / (totalTime || 1)) * 100).toFixed(2)),
        avg_waiting_time: Number((totalWt / count).toFixed(2)),
        avg_turnaround_time: Number((totalTat / count).toFixed(2)),
      },
      results: completedPatients,
    });

    setSavedSuccess(true);
    onSimulationSaved();
  };

  const isCompletedAll = !activePatient && waitingQueue.length === 0 && unarrivedPool.length === 0 && completedPatients.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-navy">
            Interactive Scheduling Simulator
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time step engine demonstrating CPU/Physician dispatching, tie-breaking, and preemption rules.
          </p>
        </div>

        {/* Live Clock Badge */}
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-2xl bg-surface border border-border flex items-center gap-2.5 shadow-subtle">
            <Clock className="w-4 h-4 text-teal-medical" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-text-muted">Simulated Time</span>
              <span className="font-heading font-extrabold text-lg text-navy leading-none">
                t = {simClock.toFixed(1)} min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-surface rounded-2xl p-4 border border-border shadow-subtle flex flex-wrap items-center justify-between gap-3">
        {/* Left: Policy & Settings */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border text-xs">
            <span className="font-semibold text-text-secondary">Policy:</span>
            <select
              value={policy}
              onChange={(e) => setPolicy(e.target.value as any)}
              className="bg-transparent font-bold text-navy focus:outline-none cursor-pointer"
            >
              <option value="PRIORITY">Non-Preemptive Priority</option>
              <option value="FCFS">First-Come, First-Served (FCFS)</option>
              <option value="PRIORITY_AGING">Priority with Aging</option>
            </select>
          </div>

          {policy === 'PRIORITY_AGING' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border text-xs">
              <span className="font-semibold text-text-secondary">Aging Interval:</span>
              <input
                type="number"
                min="1"
                max="20"
                value={agingInterval}
                onChange={(e) => setAgingInterval(parseFloat(e.target.value) || 5)}
                className="w-12 bg-transparent font-bold text-navy text-center focus:outline-none"
              />
              <span className="text-text-muted">min</span>
            </div>
          )}

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border text-xs">
            {[0.5, 1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-colors
                  ${speed === s ? 'bg-navy text-white' : 'text-text-secondary hover:text-navy'}
                `}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Right: Playback Buttons */}
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              onClick={() => setIsPlaying(false)}
              className="px-4 py-2 rounded-xl bg-priority-high text-white text-xs font-bold hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-subtle"
            >
              <Pause className="w-3.5 h-3.5 fill-white" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (isCompletedAll) resetSimulation();
                setIsPlaying(true);
              }}
              className="px-4 py-2 rounded-xl bg-teal-medical text-white text-xs font-bold hover:bg-teal-dark transition-colors flex items-center gap-1.5 shadow-subtle"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isCompletedAll ? 'Replay' : 'Start / Resume'}</span>
            </button>
          )}

          <button
            onClick={stepForward}
            disabled={isCompletedAll || isPlaying}
            className="px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-navy hover:bg-background disabled:opacity-50 transition-colors shadow-subtle flex items-center gap-1.5"
          >
            <SkipForward className="w-3.5 h-3.5 text-navy" />
            <span>Step Forward</span>
          </button>

          <button
            onClick={resetSimulation}
            className="p-2 rounded-xl bg-surface border border-border text-text-secondary hover:text-navy hover:bg-background transition-colors shadow-subtle"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowInjectForm(true)}
            className="px-3 py-2 rounded-xl bg-teal-soft text-teal-dark border border-teal-medical/30 text-xs font-bold hover:bg-teal-100 transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-medical" />
            <span>Inject Patient</span>
          </button>
        </div>
      </div>

      {/* Dynamic Injection Modal */}
      {showInjectForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-5 border border-border shadow-floating space-y-4">
            <h3 className="font-heading font-bold text-base text-navy">
              Dynamic Runtime Patient Admission
            </h3>
            <p className="text-xs text-text-secondary">
              Inject a patient while the simulation clock is actively running at t = {simClock.toFixed(1)}m.
            </p>

            <form onSubmit={handleInject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-navy mb-1">Patient ID</label>
                <input
                  type="text"
                  value={injId}
                  onChange={(e) => setInjId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-background border border-border font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">Name</label>
                <input
                  type="text"
                  value={injName}
                  onChange={(e) => setInjName(e.target.value)}
                  className="w-full p-2 rounded-xl bg-background border border-border"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">Priority</label>
                <select
                  value={injPriority}
                  onChange={(e) => setInjPriority(parseInt(e.target.value) as any)}
                  className="w-full p-2 rounded-xl bg-background border border-border font-bold"
                >
                  <option value="1">Priority 1 (Critical Emergency)</option>
                  <option value="2">Priority 2 (High Urgency)</option>
                  <option value="3">Priority 3 (Medium Urgency)</option>
                  <option value="4">Priority 4 (Low Non-Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">Treatment Duration (min)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={injDuration}
                  onChange={(e) => setInjDuration(parseFloat(e.target.value) || 1)}
                  className="w-full p-2 rounded-xl bg-background border border-border font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-light"
                >
                  Admit Directly to Ready Queue
                </button>
                <button
                  type="button"
                  onClick={() => setShowInjectForm(false)}
                  className="px-3 py-2 rounded-xl bg-background border border-border font-bold text-text-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Simulation Viewport: Active Treatment Room + Waiting Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Doctor Treatment Room (Single CPU Resource) */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-medical" />
                <h3 className="font-heading font-bold text-base text-navy">
                  Treatment Room (Physician 1)
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-text-muted">CPU Resource</span>
            </div>

            {activePatient ? (
              <div
                className="p-5 rounded-2xl border-2 space-y-4 animate-soft-pulse"
                style={{
                  borderColor: PRIORITY_CONFIG[activePatient.patient.priority].color,
                  backgroundColor: PRIORITY_CONFIG[activePatient.patient.priority].bg,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-navy">
                    {activePatient.patient.patient_id}
                  </span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-subtle"
                    style={{ backgroundColor: PRIORITY_CONFIG[activePatient.patient.priority].color }}
                  >
                    Priority {activePatient.patient.priority}: {PRIORITY_CONFIG[activePatient.patient.priority].label}
                  </span>
                </div>

                <div>
                  <h4 className="font-heading font-extrabold text-lg text-navy">
                    {activePatient.patient.name}
                  </h4>
                  <p className="text-xs text-text-secondary">
                    Treatment Duration: {activePatient.patient.treatment_duration} minutes
                  </p>
                </div>

                {/* Treatment Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <div className="flex justify-between text-xs font-mono font-semibold text-navy">
                    <span>Started: t={activePatient.startTime.toFixed(1)}m</span>
                    <span>Ends: t={activePatient.completionTime.toFixed(1)}m</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface/80 overflow-hidden border border-border/50">
                    <div
                      className="h-full bg-teal-medical transition-all duration-300"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 px-4 rounded-2xl border border-dashed border-border text-center bg-background">
                {isCompletedAll ? (
                  <>
                    <CheckCircle2 className="w-10 h-10 text-priority-low mx-auto mb-2" />
                    <h4 className="font-heading font-bold text-base text-navy">Treatment Complete</h4>
                    <p className="text-xs text-text-secondary mt-1">All patients discharged.</p>
                  </>
                ) : (
                  <>
                    <Clock className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-50" />
                    <h4 className="font-heading font-bold text-base text-navy">Physician IDLE</h4>
                    <p className="text-xs text-text-secondary mt-1">
                      Ready to accept the highest priority waiting patient.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border text-xs text-text-secondary">
            <strong>Non-preemptive rule:</strong> Once treatment initiates, the physician cannot be interrupted until procedure ends.
          </div>
        </div>

        {/* Ready Queue (Patients currently waiting) */}
        <div className="lg:col-span-2 bg-surface rounded-2xl p-6 border border-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-navy">
                Triage Ready Queue ({waitingQueue.length} Waiting)
              </h3>
              <p className="text-xs text-text-secondary">
                Patients who have arrived ($t \le {simClock.toFixed(1)}m$) awaiting doctor assignment
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-background border border-border text-navy">
              Priority Sorted
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {waitingQueue.map((p, idx) => {
              const prioCfg = PRIORITY_CONFIG[p.priority];
              const effPrio = getEffectivePriority(p, simClock);
              const isPromoted = effPrio < p.priority;

              return (
                <div
                  key={p.patient_id}
                  className="p-3 rounded-xl bg-background border border-border flex items-center justify-between hover:border-teal-medical transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-xs text-navy shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-navy">{p.patient_id} — {p.name}</span>
                        {isPromoted && (
                          <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-800 font-bold text-[10px]">
                            Aged → P{effPrio}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-text-secondary">
                        Arrived: t={p.arrival_time}m &nbsp;|&nbsp; Duration: {p.treatment_duration}m
                      </span>
                    </div>
                  </div>

                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0"
                    style={{ backgroundColor: prioCfg.bg, color: prioCfg.color, border: `1px solid ${prioCfg.border}` }}
                  >
                    Priority {p.priority}: {prioCfg.label}
                  </span>
                </div>
              );
            })}

            {waitingQueue.length === 0 && (
              <div className="py-12 text-center text-xs text-text-secondary">
                Ready queue is currently empty.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>Unarrived patients: <strong>{unarrivedPool.length}</strong></span>
            <span>Completed treatments: <strong>{completedPatients.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Live Timeline Gantt Chart */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-base text-navy">
              Dynamic Gantt Chart Timeline
            </h3>
            <p className="text-xs text-text-secondary">
              Contiguous allocation segments of the single treatment room resource
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-navy">
            Clock: t = {simClock.toFixed(1)}m
          </span>
        </div>

        {timelineBlocks.length > 0 ? (
          <div className="space-y-2">
            <div className="w-full h-12 bg-background rounded-xl p-1.5 flex items-center gap-1 border border-border overflow-x-auto">
              {timelineBlocks.map((b, idx) => {
                const color = b.is_idle
                  ? '#94A3B8'
                  : b.priority
                  ? PRIORITY_CONFIG[b.priority].color
                  : '#12B8A6';
                return (
                  <div
                    key={idx}
                    className="h-full rounded-lg text-[10px] font-bold text-white flex items-center justify-center px-2 shrink-0 transition-all hover:scale-105 shadow-subtle cursor-pointer"
                    style={{
                      backgroundColor: color,
                      flexGrow: b.duration,
                      minWidth: '60px',
                    }}
                    title={`${b.label} | ${b.start_time}m - ${b.end_time}m (${b.duration}m)`}
                  >
                    <span className="truncate">{b.label.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-text-secondary font-mono px-1">
              <span>0.0m</span>
              <span>{simClock.toFixed(1)}m</span>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-text-secondary">
            Timeline will populate as treatment events execute.
          </div>
        )}
      </div>

      {/* Decision Explainability Log & Save Run Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-navy flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-teal-medical" />
              <span>Scheduler Decision Explanation Log</span>
            </h3>
            <span className="text-xs text-text-muted">Real-time OS trace</span>
          </div>

          <div className="bg-background rounded-xl p-3 border border-border max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs text-navy">
            {decisionLogs.map((log, i) => (
              <div key={i} className="py-0.5 border-b border-border/40 last:border-none">
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Save Run Card */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-base text-navy mb-2">
              Persist Simulation Run
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Save execution metrics and timeline logs to SQLite database for historical reporting and CSV download.
            </p>

            {savedSuccess && (
              <div className="p-3 mb-3 rounded-xl bg-green-50 border border-green-200 text-xs text-priority-low font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulation saved to history!</span>
              </div>
            )}
          </div>

          <button
            onClick={handleSaveToHistory}
            disabled={completedPatients.length === 0}
            className="w-full py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-light disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-subtle"
          >
            <Save className="w-4 h-4 text-teal-medical" />
            <span>Save Run to History Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
