"""
Priority Scheduling with Aging (Starvation Prevention)
Implements an educational aging mechanism that periodically boosts the priority
of waiting patients to prevent indefinite starvation of low-priority patients.
"""

from typing import List, Tuple, Dict, Any, Optional
from models.patient import Patient, ScheduledPatient, TimelineBlock
from scheduling.metrics import calculate_metrics


def calculate_patient_effective_priority(
    patient: Patient,
    current_time: float,
    aging_interval: float
) -> int:
    """
    Computes effective priority for a patient:
    Effective Priority = max(1, Priority - floor((current_time - arrival_time) / aging_interval))
    """
    if aging_interval <= 0:
        return patient.priority
    wait_duration = max(0.0, current_time - patient.arrival_time)
    boost = int(wait_duration // aging_interval)
    return max(1, patient.priority - boost)


def schedule_priority_with_aging(
    patients: List[Patient],
    aging_interval: float = 10.0
) -> Tuple[List[ScheduledPatient], List[TimelineBlock], Dict[str, float]]:
    """
    Executes non-preemptive Priority Scheduling with dynamic aging.

    Args:
        patients: List of patients to schedule.
        aging_interval: Time units (minutes) waiting in queue before priority increases by 1.

    Returns:
        Tuple of (scheduled_patients, timeline_blocks, aggregate_metrics)
    """
    if not patients:
        return [], [], calculate_metrics([], 0.0, 0.0)

    indexed_patients = list(enumerate(patients))
    indexed_patients.sort(key=lambda item: (item[1].arrival_time, item[0]))

    current_time = 0.0
    idle_time = 0.0
    timeline: List[TimelineBlock] = []
    scheduled_patients: List[ScheduledPatient] = []
    unprocessed = indexed_patients.copy()

    while unprocessed:
        ready_pool = [item for item in unprocessed if item[1].arrival_time <= current_time]

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
            ready_pool = [item for item in unprocessed if item[1].arrival_time <= current_time]

        # Select candidate with lowest effective priority, breaking ties by arrival time
        selected_item = min(
            ready_pool,
            key=lambda item: (
                calculate_patient_effective_priority(item[1], current_time, aging_interval),
                item[1].arrival_time,
                item[0]
            )
        )
        unprocessed.remove(selected_item)

        orig_idx, patient = selected_item
        effective_prio = calculate_patient_effective_priority(patient, current_time, aging_interval)

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
            effective_priority=effective_prio,
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
            label=f"{patient.patient_id} (P:{patient.priority}→{effective_prio})",
            priority=effective_prio,
            is_idle=False
        ))

        current_time = completion_time

    total_simulation_time = current_time
    metrics = calculate_metrics(scheduled_patients, total_simulation_time, idle_time)

    return scheduled_patients, timeline, metrics
