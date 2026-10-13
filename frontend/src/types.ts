export type PriorityNumber = 1 | 2 | 3 | 4;

export interface Patient {
  patient_id: string;
  name: string;
  arrival_time: number;
  priority: PriorityNumber;
  treatment_duration: number;
  status?: 'waiting' | 'in_treatment' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
}

export interface ScheduledPatient {
  patient_id: string;
  name: string;
  arrival_time: number;
  priority: PriorityNumber;
  effective_priority?: PriorityNumber;
  treatment_duration: number;
  start_time: number;
  completion_time: number;
  waiting_time: number;
  turnaround_time: number;
  response_time: number;
}

export interface TimelineBlock {
  start_time: number;
  end_time: number;
  duration: number;
  label: string;
  priority: PriorityNumber | null;
  is_idle: boolean;
  patient_id: string | null;
}

export interface SimulationMetrics {
  total_patients: number;
  total_simulation_time: number;
  idle_time: number;
  busy_time: number;
  resource_utilization: number;
  avg_waiting_time: number;
  avg_turnaround_time: number;
  avg_response_time: number;
  max_waiting_time: number;
  throughput: number;
}

export interface ScheduleResponse {
  policy: string;
  aging_interval?: number;
  scheduled: ScheduledPatient[];
  timeline: TimelineBlock[];
  metrics: SimulationMetrics;
}

export interface SimulationHistoryRecord {
  simulation_id: string;
  policy: string;
  aging_interval?: number | null;
  total_patients: number;
  total_simulation_time: number;
  idle_time: number;
  resource_utilization: number;
  avg_waiting_time: number;
  avg_turnaround_time: number;
  avg_response_time?: number;
  max_waiting_time?: number;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'register' | 'admit' | 'treatment_start' | 'treatment_done' | 'policy_change' | 'reset';
  badgeColor?: string;
}

export const PRIORITY_CONFIG: Record<PriorityNumber, { label: string; color: string; bg: string; border: string }> = {
  1: { label: 'Critical', color: '#EF4444', bg: '#FEF2F2', border: '#FCA5A5' },
  2: { label: 'High', color: '#F97316', bg: '#FFF7ED', border: '#FDBA74' },
  3: { label: 'Medium', color: '#EAB308', bg: '#FEFCE8', border: '#FDE047' },
  4: { label: 'Low', color: '#22C55E', bg: '#F0FDF4', border: '#86EFAC' },
};
