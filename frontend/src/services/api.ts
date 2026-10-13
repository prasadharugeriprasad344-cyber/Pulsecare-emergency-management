import { Patient, PriorityNumber, SimulationHistoryRecord, ScheduleResponse } from '../types';

const STORAGE_KEY = 'pulsecare_patients';
const HISTORY_KEY = 'pulsecare_history';

// Standard educational scenarios
export const PRESET_SCENARIOS: Record<string, { title: string; description: string; patients: Patient[] }> = {
  small_ed: {
    title: 'Small Emergency Department (6 Patients)',
    description: 'Balanced mix of priorities and staggered arrival times. Ideal for a quick walkthrough.',
    patients: [
      { patient_id: 'P-101', name: 'Emma Watson', arrival_time: 0.0, priority: 3, treatment_duration: 4.0 },
      { patient_id: 'P-102', name: 'Liam Neeson', arrival_time: 2.0, priority: 1, treatment_duration: 5.0 },
      { patient_id: 'P-103', name: 'Olivia Wilde', arrival_time: 3.0, priority: 2, treatment_duration: 3.0 },
      { patient_id: 'P-104', name: 'Noah Centineo', arrival_time: 6.0, priority: 4, treatment_duration: 6.0 },
      { patient_id: 'P-105', name: 'Sophia Loren', arrival_time: 8.0, priority: 2, treatment_duration: 4.0 },
      { patient_id: 'P-106', name: 'Lucas Hedges', arrival_time: 12.0, priority: 1, treatment_duration: 3.0 },
    ],
  },
  busy_ed: {
    title: 'Busy Emergency Department (10 Patients)',
    description: 'High patient load with back-to-back arrivals demonstrating queue accumulation.',
    patients: [
      { patient_id: 'P-201', name: 'Patient Alpha', arrival_time: 0.0, priority: 2, treatment_duration: 5.0 },
      { patient_id: 'P-202', name: 'Patient Beta', arrival_time: 1.0, priority: 3, treatment_duration: 4.0 },
      { patient_id: 'P-203', name: 'Patient Gamma', arrival_time: 2.0, priority: 1, treatment_duration: 6.0 },
      { patient_id: 'P-204', name: 'Patient Delta', arrival_time: 3.0, priority: 4, treatment_duration: 8.0 },
      { patient_id: 'P-205', name: 'Patient Epsilon', arrival_time: 4.0, priority: 2, treatment_duration: 3.0 },
      { patient_id: 'P-206', name: 'Patient Zeta', arrival_time: 5.0, priority: 1, treatment_duration: 5.0 },
      { patient_id: 'P-207', name: 'Patient Eta', arrival_time: 7.0, priority: 3, treatment_duration: 4.0 },
      { patient_id: 'P-208', name: 'Patient Theta', arrival_time: 9.0, priority: 2, treatment_duration: 6.0 },
      { patient_id: 'P-209', name: 'Patient Iota', arrival_time: 11.0, priority: 1, treatment_duration: 3.0 },
      { patient_id: 'P-210', name: 'Patient Kappa', arrival_time: 13.0, priority: 4, treatment_duration: 7.0 },
    ],
  },
  starvation: {
    title: 'Starvation Demonstration (Continuous High-Priority)',
    description: 'Low-priority patient arrives first, but continuous Critical/High arrivals cause severe starvation.',
    patients: [
      { patient_id: 'P-301', name: 'Delayed David (Low)', arrival_time: 0.0, priority: 4, treatment_duration: 5.0 },
      { patient_id: 'P-302', name: 'Emergency Eva (Crit)', arrival_time: 1.0, priority: 1, treatment_duration: 4.0 },
      { patient_id: 'P-303', name: 'Emergency Frank (Crit)', arrival_time: 3.0, priority: 1, treatment_duration: 5.0 },
      { patient_id: 'P-304', name: 'Urgent Grace (High)', arrival_time: 5.0, priority: 2, treatment_duration: 4.0 },
      { patient_id: 'P-305', name: 'Urgent Henry (High)', arrival_time: 8.0, priority: 2, treatment_duration: 4.0 },
      { patient_id: 'P-306', name: 'Emergency Ivy (Crit)', arrival_time: 11.0, priority: 1, treatment_duration: 3.0 },
    ],
  },
  equal_priority: {
    title: 'Equal Priority (FIFO Behavior)',
    description: 'All patients share Medium priority (3). Demonstrates FIFO tie-breaking in priority scheduling.',
    patients: [
      { patient_id: 'P-401', name: 'Aaron Equal', arrival_time: 1.0, priority: 3, treatment_duration: 4.0 },
      { patient_id: 'P-402', name: 'Bella Equal', arrival_time: 3.0, priority: 3, treatment_duration: 5.0 },
      { patient_id: 'P-403', name: 'Cody Equal', arrival_time: 4.0, priority: 3, treatment_duration: 3.0 },
      { patient_id: 'P-404', name: 'Diana Equal', arrival_time: 6.0, priority: 3, treatment_duration: 4.0 },
    ],
  },
  simultaneous: {
    title: 'Simultaneous Arrivals at t=0',
    description: 'All patients arrive together at t=0. Demonstrates immediate sorting strictly by priority rank.',
    patients: [
      { patient_id: 'P-501', name: 'Patient Low (t=0)', arrival_time: 0.0, priority: 4, treatment_duration: 6.0 },
      { patient_id: 'P-502', name: 'Patient Med (t=0)', arrival_time: 0.0, priority: 3, treatment_duration: 4.0 },
      { patient_id: 'P-503', name: 'Patient High (t=0)', arrival_time: 0.0, priority: 2, treatment_duration: 5.0 },
      { patient_id: 'P-504', name: 'Patient Crit (t=0)', arrival_time: 0.0, priority: 1, treatment_duration: 3.0 },
    ],
  },
  idle_periods: {
    title: 'Spaced Arrivals (Doctor Idle Periods)',
    description: 'Wide gaps between arrivals. Demonstrates how CPU/Doctor Idle Time and Utilization are calculated.',
    patients: [
      { patient_id: 'P-601', name: 'Morning Patient', arrival_time: 0.0, priority: 2, treatment_duration: 3.0 },
      { patient_id: 'P-602', name: 'Noon Patient', arrival_time: 8.0, priority: 1, treatment_duration: 4.0 },
      { patient_id: 'P-603', name: 'Evening Patient', arrival_time: 18.0, priority: 3, treatment_duration: 3.0 },
    ],
  },
};

// Seeded pseudorandom number generator for reproducibility
function pseudoRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateSyntheticCohort(
  count: number = 8,
  arrivalSpan: number = 20.0,
  minDuration: number = 3.0,
  maxDuration: number = 8.0,
  seed: number = 42
): Patient[] {
  const rng = pseudoRandom(seed);
  const names = [
    'Alex Taylor', 'Jordan Smith', 'Morgan Lee', 'Casey Rivera',
    'Riley Chen', 'Sam Wilson', 'Chris Evans', 'Pat Murphy',
    'Avery Clark', 'Jamie Vance', 'Dakota Blue', 'Quinn Davis',
    'Reese Miller', 'Rowan Adams', 'Skyler White', 'Hayden Brooks'
  ];

  const priorities: PriorityNumber[] = [1, 2, 3, 4];
  const weights = [0.15, 0.30, 0.35, 0.20]; // 15% Crit, 30% High, 35% Med, 20% Low

  const patients: Patient[] = [];
  for (let i = 0; i < count; i++) {
    const r = rng();
    let cumulative = 0;
    let chosenPrio: PriorityNumber = 3;
    for (let j = 0; j < weights.length; j++) {
      cumulative += weights[j];
      if (r <= cumulative) {
        chosenPrio = priorities[j];
        break;
      }
    }

    const arrival = Number((rng() * arrivalSpan).toFixed(1));
    const duration = Number((minDuration + rng() * (maxDuration - minDuration)).toFixed(1));
    const name = `${names[Math.floor(rng() * names.length)]} (Synthetic)`;

    patients.push({
      patient_id: `SYN-${String(i + 1).padStart(3, '0')}`,
      name,
      arrival_time: arrival,
      priority: chosenPrio,
      treatment_duration: duration,
      status: 'waiting',
    });
  }

  patients.sort((a, b) => a.arrival_time - b.arrival_time || a.patient_id.localeCompare(b.patient_id));
  return patients;
}

export const ApiService = {
  async getPatients(): Promise<{ patients: Patient[]; isBackend: boolean }> {
    try {
      const res = await fetch('/api/patients', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return { patients: data, isBackend: true };
        }
      }
    } catch {
      // Backend unavailable or timed out, fallback to local storage
    }

    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      try {
        return { patients: JSON.parse(local), isBackend: false };
      } catch {
        // fallback
      }
    }

    // Default seed
    const defaultBatch = PRESET_SCENARIOS.small_ed.patients;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBatch));
    return { patients: defaultBatch, isBackend: false };
  },

  async savePatient(patient: Patient): Promise<void> {
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) return;
    } catch {
      // fallback
    }

    // Local storage fallback
    const { patients } = await this.getPatients();
    const existingIdx = patients.findIndex((p) => p.patient_id === patient.patient_id);
    if (existingIdx >= 0) {
      patients[existingIdx] = patient;
    } else {
      patients.push(patient);
    }
    patients.sort((a, b) => a.arrival_time - b.arrival_time);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  },

  async bulkSavePatients(patients: Patient[]): Promise<void> {
    try {
      const res = await fetch('/api/patients/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patients),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) return;
    } catch {
      // fallback
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  },

  async deletePatient(patientId: string): Promise<void> {
    try {
      await fetch(`/api/patients/${patientId}`, { method: 'DELETE', signal: AbortSignal.timeout(1500) });
    } catch {
      // fallback
    }

    const { patients } = await this.getPatients();
    const updated = patients.filter((p) => p.patient_id !== patientId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  async clearAllPatients(): Promise<void> {
    try {
      await fetch('/api/patients', { method: 'DELETE', signal: AbortSignal.timeout(1500) });
    } catch {
      // fallback
    }
    localStorage.removeItem(STORAGE_KEY);
  },

  async getHistory(): Promise<SimulationHistoryRecord[]> {
    try {
      const res = await fetch('/api/simulations', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }

    const local = localStorage.getItem(HISTORY_KEY);
    return local ? JSON.parse(local) : [];
  },

  async saveHistory(record: {
    simulation_id: string;
    policy: string;
    metrics: any;
    results: any[];
    aging_interval?: number;
  }): Promise<void> {
    try {
      const res = await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) return;
    } catch {
      // fallback
    }

    // Local storage fallback
    const history = await this.getHistory();
    const newEntry: SimulationHistoryRecord = {
      simulation_id: record.simulation_id,
      policy: record.policy,
      aging_interval: record.aging_interval,
      total_patients: record.metrics.total_patients,
      total_simulation_time: record.metrics.total_simulation_time,
      idle_time: record.metrics.idle_time,
      resource_utilization: record.metrics.resource_utilization,
      avg_waiting_time: record.metrics.avg_waiting_time,
      avg_turnaround_time: record.metrics.avg_turnaround_time,
      avg_response_time: record.metrics.avg_response_time,
      max_waiting_time: record.metrics.max_waiting_time,
      created_at: new Date().toISOString(),
    };
    history.unshift(newEntry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },

  async deleteHistory(simulationId: string): Promise<void> {
    try {
      await fetch(`/api/simulations/${simulationId}`, { method: 'DELETE', signal: AbortSignal.timeout(1500) });
    } catch {
      // fallback
    }

    const history = await this.getHistory();
    const updated = history.filter((h) => h.simulation_id !== simulationId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  },
};
