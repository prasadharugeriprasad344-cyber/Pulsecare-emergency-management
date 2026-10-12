"""
First-Come, First-Served (FCFS) Scheduling Algorithm
Baseline comparison policy that schedules patients strictly in order of arrival.
"""

from typing import List, Tuple, Dict, Any
from models.patient import Patient, ScheduledPatient, TimelineBlock
from scheduling.metrics import calculate_metrics


def schedule_fcfs(
    patients: List[Patient]
) -> Tuple[List[ScheduledPatient], List[TimelineBlock], Dict[str, float]]:
    """
    Executes non-preemptive First-Come, First-Served (FCFS) scheduling on patients.

    Scheduling Invariants:
      1. Arrived patients are placed into the ready queue based strictly on arrival time.
      2. The patient with the earliest arrival time is served next.
      3. Tie-breaker: If simultaneous arrival occurs, preserve submission sequence order.
      4. Non-preemptive: Treatment runs until completion.
      5. Gaps between arrivals are recorded as IDLE CPU/Doctor blocks.

    Args:
        patients: List of Patient objects to be scheduled.

    Returns:
        Tuple of (scheduled_patients, timeline_blocks, aggregate_metrics)
    """
    if not patients:
        return [], [], calculate_metrics([], 0.0, 0.0)

    # Preserve initial index for stable tie-breaking on simultaneous arrivals
    indexed_patients = list(enumerate(patients))
    # Sort by arrival time first, then original index
    indexed_patients.sort(key=lambda item: (item[1].arrival_time, item[0]))

    current_time = 0.0
    idle_time = 0.0
    timeline: List[TimelineBlock] = []
    scheduled_patients: List[ScheduledPatient] = []
    unprocessed = indexed_patients.copy()

    while unprocessed:
        # Check ready queue
        ready_pool = [item for item in unprocessed if item[1].arrival_time <= current_time]

        # If no patient is ready yet, doctor is IDLE until next arrival
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

        # In FCFS, pick the patient with minimum arrival_time, then initial order
        selected_item = min(
            ready_pool,
            key=lambda item: (item[1].arrival_time, item[0])
        )
        unprocessed.remove(selected_item)

        orig_idx, patient = selected_item

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

        current_time = completion_time

    total_simulation_time = current_time
    metrics = calculate_metrics(scheduled_patients, total_simulation_time, idle_time)

    return scheduled_patients, timeline, metrics
