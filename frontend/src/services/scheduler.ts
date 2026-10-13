import { Patient, ScheduledPatient, TimelineBlock, SimulationMetrics, ScheduleResponse, PriorityNumber } from '../types';

export function calculateMetrics(
  scheduled: ScheduledPatient[],
  totalSimulationTime: number,
  idleTime: number
): SimulationMetrics {
  const count = scheduled.length;
  if (count === 0) {
    return {
      total_patients: 0,
      total_simulation_time: Number(totalSimulationTime.toFixed(2)),
      idle_time: Number(idleTime.toFixed(2)),
      busy_time: 0,
      resource_utilization: 0,
      avg_waiting_time: 0,
      avg_turnaround_time: 0,
      avg_response_time: 0,
      max_waiting_time: 0,
      throughput: 0,
    };
  }

  const totalWt = scheduled.reduce((acc, p) => acc + p.waiting_time, 0);
  const totalTat = scheduled.reduce((acc, p) => acc + p.turnaround_time, 0);
  const totalRt = scheduled.reduce((acc, p) => acc + p.response_time, 0);
  const maxWt = Math.max(...scheduled.map((p) => p.waiting_time));
  const busyTime = scheduled.reduce((acc, p) => acc + p.treatment_duration, 0);

  const utilization = totalSimulationTime > 0
    ? Math.min(100, Math.max(0, (busyTime / totalSimulationTime) * 100))
    : 0;

  const throughput = totalSimulationTime > 0 ? count / totalSimulationTime : 0;

  return {
    total_patients: count,
    total_simulation_time: Number(totalSimulationTime.toFixed(2)),
    idle_time: Number(idleTime.toFixed(2)),
    busy_time: Number(busyTime.toFixed(2)),
    resource_utilization: Number(utilization.toFixed(2)),
    avg_waiting_time: Number((totalWt / count).toFixed(2)),
    avg_turnaround_time: Number((totalTat / count).toFixed(2)),
    avg_response_time: Number((totalRt / count).toFixed(2)),
    max_waiting_time: Number(maxWt.toFixed(2)),
    throughput: Number(throughput.toFixed(4)),
  };
}

export function runPriorityScheduling(patients: Patient[]): ScheduleResponse {
  if (patients.length === 0) {
    return {
      policy: 'PRIORITY',
      scheduled: [],
      timeline: [],
      metrics: calculateMetrics([], 0, 0),
    };
  }

  // Preserve arrival time and index for tie-breaking
  const indexed = patients.map((p, index) => ({ p: { ...p }, index }));
  indexed.sort((a, b) => a.p.arrival_time - b.p.arrival_time || a.index - b.index);

  let currentTime = 0;
  let idleTime = 0;
  const timeline: TimelineBlock[] = [];
  const scheduled: ScheduledPatient[] = [];
  const unprocessed = [...indexed];

  while (unprocessed.length > 0) {
    let readyPool = unprocessed.filter((item) => item.p.arrival_time <= currentTime);

    if (readyPool.length === 0) {
      const nextArrival = unprocessed[0].p.arrival_time;
      if (nextArrival > currentTime) {
        const gap = nextArrival - currentTime;
        idleTime += gap;
        timeline.push({
          start_time: Number(currentTime.toFixed(2)),
          end_time: Number(nextArrival.toFixed(2)),
          duration: Number(gap.toFixed(2)),
          label: 'IDLE (Resource Free)',
          priority: null,
          is_idle: true,
          patient_id: null,
        });
        currentTime = nextArrival;
      }
      readyPool = unprocessed.filter((item) => item.p.arrival_time <= currentTime);
    }

    // Select smallest priority (1 is highest), break tie with arrival_time, then initial index
    readyPool.sort((a, b) => a.p.priority - b.p.priority || a.p.arrival_time - b.p.arrival_time || a.index - b.index);
    const selected = readyPool[0];

    // Remove from unprocessed
    const idxInUnprocessed = unprocessed.findIndex((item) => item.p.patient_id === selected.p.patient_id);
    unprocessed.splice(idxInUnprocessed, 1);

    const p = selected.p;
    const startTime = currentTime;
    const completionTime = startTime + p.treatment_duration;
    const turnaroundTime = completionTime - p.arrival_time;
    const waitingTime = turnaroundTime - p.treatment_duration;
    const responseTime = startTime - p.arrival_time;

    scheduled.push({
      patient_id: p.patient_id,
      name: p.name,
      arrival_time: Number(p.arrival_time.toFixed(2)),
      priority: p.priority,
      effective_priority: p.priority,
      treatment_duration: Number(p.treatment_duration.toFixed(2)),
      start_time: Number(startTime.toFixed(2)),
      completion_time: Number(completionTime.toFixed(2)),
      waiting_time: Number(waitingTime.toFixed(2)),
      turnaround_time: Number(turnaroundTime.toFixed(2)),
      response_time: Number(responseTime.toFixed(2)),
    });

    timeline.push({
      start_time: Number(startTime.toFixed(2)),
      end_time: Number(completionTime.toFixed(2)),
      duration: Number(p.treatment_duration.toFixed(2)),
      label: `${p.patient_id} (${p.name})`,
      priority: p.priority,
      is_idle: false,
      patient_id: p.patient_id,
    });

    currentTime = completionTime;
  }

  const metrics = calculateMetrics(scheduled, currentTime, idleTime);
  return { policy: 'PRIORITY', scheduled, timeline, metrics };
}

export function runFCFSScheduling(patients: Patient[]): ScheduleResponse {
  if (patients.length === 0) {
    return {
      policy: 'FCFS',
      scheduled: [],
      timeline: [],
      metrics: calculateMetrics([], 0, 0),
    };
  }

  const indexed = patients.map((p, index) => ({ p: { ...p }, index }));
  indexed.sort((a, b) => a.p.arrival_time - b.p.arrival_time || a.index - b.index);

  let currentTime = 0;
  let idleTime = 0;
  const timeline: TimelineBlock[] = [];
  const scheduled: ScheduledPatient[] = [];
  const unprocessed = [...indexed];

  while (unprocessed.length > 0) {
    let readyPool = unprocessed.filter((item) => item.p.arrival_time <= currentTime);

    if (readyPool.length === 0) {
      const nextArrival = unprocessed[0].p.arrival_time;
      if (nextArrival > currentTime) {
        const gap = nextArrival - currentTime;
        idleTime += gap;
        timeline.push({
          start_time: Number(currentTime.toFixed(2)),
          end_time: Number(nextArrival.toFixed(2)),
          duration: Number(gap.toFixed(2)),
          label: 'IDLE (Resource Free)',
          priority: null,
          is_idle: true,
          patient_id: null,
        });
        currentTime = nextArrival;
      }
      readyPool = unprocessed.filter((item) => item.p.arrival_time <= currentTime);
    }

    // In FCFS, sort strictly by arrival_time, then initial index
    readyPool.sort((a, b) => a.p.arrival_time - b.p.arrival_time || a.index - b.index);
    const selected = readyPool[0];

    const idxInUnprocessed = unprocessed.findIndex((item) => item.p.patient_id === selected.p.patient_id);
    unprocessed.splice(idxInUnprocessed, 1);

    const p = selected.p;
    const startTime = currentTime;
    const completionTime = startTime + p.treatment_duration;
    const turnaroundTime = completionTime - p.arrival_time;
    const waitingTime = turnaroundTime - p.treatment_duration;
    const responseTime = startTime - p.arrival_time;

    scheduled.push({
      patient_id: p.patient_id,
      name: p.name,
      arrival_time: Number(p.arrival_time.toFixed(2)),
      priority: p.priority,
      effective_priority: p.priority,
      treatment_duration: Number(p.treatment_duration.toFixed(2)),
      start_time: Number(startTime.toFixed(2)),
      completion_time: Number(completionTime.toFixed(2)),
      waiting_time: Number(waitingTime.toFixed(2)),
      turnaround_time: Number(turnaroundTime.toFixed(2)),
      response_time: Number(responseTime.toFixed(2)),
    });

    timeline.push({
      start_time: Number(startTime.toFixed(2)),
      end_time: Number(completionTime.toFixed(2)),
      duration: Number(p.treatment_duration.toFixed(2)),
      label: `${p.patient_id} (${p.name})`,
      priority: p.priority,
      is_idle: false,
      patient_id: p.patient_id,
    });

    currentTime = completionTime;
  }

  const metrics = calculateMetrics(scheduled, currentTime, idleTime);
  return { policy: 'FCFS', scheduled, timeline, metrics };
}

export function runAgingScheduling(patients: Patient[], agingInterval: number = 6.0): ScheduleResponse {
  if (patients.length === 0) {
    return {
      policy: 'PRIORITY_AGING',
      aging_interval: agingInterval,
      scheduled: [],
      timeline: [],
      metrics: calculateMetrics([], 0, 0),
    };
  }

  const indexed = patients.map((p, index) => ({ p: { ...p }, index }));
  indexed.sort((a, b) => a.p.arrival_time - b.p.arrival_time || a.index - b.index);

  let currentTime = 0;
  let idleTime = 0;
  const timeline: TimelineBlock[] = [];
  const scheduled: ScheduledPatient[] = [];
  const unprocessed = [...indexed];

  const getEffectivePriority = (p: Patient, currTime: number): PriorityNumber => {
    if (agingInterval <= 0) return p.priority;
    const wait = Math.max(0, currTime - p.arrival_time);
    const boost = Math.floor(wait / agingInterval);
    const promoted = Math.max(1, p.priority - boost);
    return promoted as PriorityNumber;
  };

  while (unprocessed.length > 0) {
    let readyPool = unprocessed.filter((item) => item.p.arrival_time <= currentTime);

    if (readyPool.length === 0) {
      const nextArrival = unprocessed[0].p.arrival_time;
      if (nextArrival > currentTime) {
        const gap = nextArrival - currentTime;
        idleTime += gap;
        timeline.push({
          start_time: Number(currentTime.toFixed(2)),
          end_time: Number(nextArrival.toFixed(2)),
          duration: Number(gap.toFixed(2)),
          label: 'IDLE (Resource Free)',
          priority: null,
          is_idle: true,
          patient_id: null,
        });
        currentTime = nextArrival;
      }
      readyPool = unprocessed.filter((item) => item.p.arrival_time <= currentTime);
    }

    readyPool.sort((a, b) => {
      const effA = getEffectivePriority(a.p, currentTime);
      const effB = getEffectivePriority(b.p, currentTime);
      return effA - effB || a.p.arrival_time - b.p.arrival_time || a.index - b.index;
    });

    const selected = readyPool[0];
    const idxInUnprocessed = unprocessed.findIndex((item) => item.p.patient_id === selected.p.patient_id);
    unprocessed.splice(idxInUnprocessed, 1);

    const p = selected.p;
    const effectivePrio = getEffectivePriority(p, currentTime);
    const startTime = currentTime;
    const completionTime = startTime + p.treatment_duration;
    const turnaroundTime = completionTime - p.arrival_time;
    const waitingTime = turnaroundTime - p.treatment_duration;
    const responseTime = startTime - p.arrival_time;

    scheduled.push({
      patient_id: p.patient_id,
      name: p.name,
      arrival_time: Number(p.arrival_time.toFixed(2)),
      priority: p.priority,
      effective_priority: effectivePrio,
      treatment_duration: Number(p.treatment_duration.toFixed(2)),
      start_time: Number(startTime.toFixed(2)),
      completion_time: Number(completionTime.toFixed(2)),
      waiting_time: Number(waitingTime.toFixed(2)),
      turnaround_time: Number(turnaroundTime.toFixed(2)),
      response_time: Number(responseTime.toFixed(2)),
    });

    timeline.push({
      start_time: Number(startTime.toFixed(2)),
      end_time: Number(completionTime.toFixed(2)),
      duration: Number(p.treatment_duration.toFixed(2)),
      label: `${p.patient_id} (P:${p.priority}→${effectivePrio})`,
      priority: effectivePrio,
      is_idle: false,
      patient_id: p.patient_id,
    });

    currentTime = completionTime;
  }

  const metrics = calculateMetrics(scheduled, currentTime, idleTime);
  return { policy: 'PRIORITY_AGING', aging_interval: agingInterval, scheduled, timeline, metrics };
}
