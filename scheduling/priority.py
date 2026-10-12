"""
Non-Preemptive Priority Scheduling Algorithm
Selects waiting patients based on priority level (1=Critical .. 4=Low),
resolving ties with First-Come, First-Served (FIFO) arrival order.
"""

from typing import List, Tuple, Dict, Any
from models.patient import Patient, ScheduledPatient, TimelineBlock
from scheduling.metrics import calculate_metrics


def schedule_priority(
    patients: List[Patient]
) -> Tuple[List[ScheduledPatient], List[TimelineBlock], Dict[str, float]]:
    """
    Executes non-preemptive Priority Scheduling on a list of patients.

    Scheduling Invariants:
      1. Only arrived patients (arrival_time <= current_time) enter the ready queue.
      2. Highest priority patient (smallest numerical value) is scheduled next.
      3. Tie-breaker: Earlier arrival time (FIFO). Secondary tie-breaker: initial sequence order.
      4. Non-preemptive: Once treatment starts, it runs to completion (start + duration).
      5. Idle CPU/Doctor: If the ready queue is empty, clock advances to next arrival.

    Args:
        patients: List of Patient objects to be scheduled.

    Returns:
        Tuple of (scheduled_patients, timeline_blocks, aggregate_metrics)
    """
    if not patients:
        return [], [], calculate_metrics([], 0.0, 0.0)

    # Preserve stable initial index for consistent tie-breaking
    indexed_patients = list(enumerate(patients))
    
    # Sort primarily by arrival time to facilitate arrival-driven simulation
    indexed_patients.sort(key=lambda item: (item[1].arrival_time, item[0]))

    current_time = 0.0
    idle_time = 0.0
    timeline: List[TimelineBlock] = []
    scheduled_patients: List[ScheduledPatient] = []
    
    # Pool of patients not yet admitted
    unprocessed = indexed_patients.copy()

    while unprocessed:
        # 1. Filter ready queue: patients who have arrived by current_time
        ready_pool = [item for item in unprocessed if item[1].arrival_time <= current_time]

        # 2. If no patient has arrived yet, CPU/Doctor is IDLE
        if not ready_pool:
            next_arrival_time = unprocessed[0][1].arrival_time
            if next_arrival_time > current_time:
                gap = next_arrival_time - current_time
                idle_time += gap
                timeline.append(TimelineBlock(
                    start_time=round(current_time, 2),
                    end_time=round(next_arrival_time, 2),
                    patient_id=None,
                    label="IDLE",
                    priority=None,
                    is_idle=True
                ))
                current_time = next_arrival_time
            # Now at least the earliest patient has arrived
            ready_pool = [item for item in unprocessed if item[1].arrival_time <= current_time]

        # 3. Select patient with highest priority (numerical min), tie-break with arrival_time, then original index
        selected_item = min(
            ready_pool,
            key=lambda item: (item[1].priority, item[1].arrival_time, item[0])
        )
        unprocessed.remove(selected_item)

        orig_idx, patient = selected_item

        # 4. Execute treatment (Non-preemptive)
        start_time = current_time
        completion_time = start_time + patient.treatment_duration
        turnaround_time = completion_time - patient.arrival_time
        waiting_time = turnaround_time - patient.treatment_duration
        response_time = start_time - patient.arrival_time

        scheduled_patient = ScheduledPatient(
            patient_id=patient.patient_id,
            name=patient.name,
            arrival_time=round(patient.arrival_time, 2),
            priority=patient.priority,
            effective_priority=patient.priority,
            treatment_duration=round(patient.treatment_duration, 2),
            start_time=round(start_time, 2),
            completion_time=round(completion_time, 2),
            waiting_time=round(waiting_time, 2),
            turnaround_time=round(turnaround_time, 2),
            response_time=round(response_time, 2)
        )
        scheduled_patients.append(scheduled_patient)

        timeline.append(TimelineBlock(
            start_time=round(start_time, 2),
            end_time=round(completion_time, 2),
            patient_id=patient.patient_id,
            label=f"{patient.patient_id} ({patient.name})",
            priority=patient.priority,
            is_idle=False
        ))

        # Advance clock to completion time
        current_time = completion_time

    total_simulation_time = current_time
    metrics = calculate_metrics(scheduled_patients, total_simulation_time, idle_time)

    return scheduled_patients, timeline, metrics
