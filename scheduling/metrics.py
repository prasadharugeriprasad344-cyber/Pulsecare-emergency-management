"""
Operating Systems Scheduling Metrics Calculator
Computes and validates OS performance metrics including Turnaround Time,
Waiting Time, Response Time, and CPU/Resource Utilization.
"""

from typing import List, Dict, Any
from models.patient import ScheduledPatient


def calculate_metrics(
    scheduled_patients: List[ScheduledPatient],
    total_simulation_time: float,
    idle_time: float
) -> Dict[str, float]:
    """
    Computes summary scheduling metrics according to Operating Systems standards.

    Args:
        scheduled_patients: List of completed patient execution records.
        total_simulation_time: Total elapsed simulation time (end of last job).
        idle_time: Total time the single treatment resource / CPU was idle.

    Returns:
        Dictionary containing aggregate performance metrics.
    """
    count = len(scheduled_patients)
    if count == 0:
        return {
            "total_patients": 0,
            "total_simulation_time": round(total_simulation_time, 2),
            "idle_time": round(idle_time, 2),
            "busy_time": 0.0,
            "resource_utilization": 0.0,
            "avg_waiting_time": 0.0,
            "avg_turnaround_time": 0.0,
            "avg_response_time": 0.0,
            "max_waiting_time": 0.0,
            "throughput": 0.0
        }

    total_wt = sum(p.waiting_time for p in scheduled_patients)
    total_tat = sum(p.turnaround_time for p in scheduled_patients)
    total_rt = sum(p.response_time for p in scheduled_patients)
    max_wt = max(p.waiting_time for p in scheduled_patients)

    busy_time = sum(p.treatment_duration for p in scheduled_patients)
    
    # Utilization = (Busy Time / Total Time) * 100
    utilization = (busy_time / total_simulation_time * 100.0) if total_simulation_time > 0 else 0.0
    utilization = min(100.0, max(0.0, utilization))

    # Throughput = Patients processed per unit time
    throughput = (count / total_simulation_time) if total_simulation_time > 0 else 0.0

    return {
        "total_patients": count,
        "total_simulation_time": round(total_simulation_time, 2),
        "idle_time": round(idle_time, 2),
        "busy_time": round(busy_time, 2),
        "resource_utilization": round(utilization, 2),
        "avg_waiting_time": round(total_wt / count, 2),
        "avg_turnaround_time": round(total_tat / count, 2),
        "avg_response_time": round(total_rt / count, 2),
        "max_waiting_time": round(max_wt, 2),
        "throughput": round(throughput, 4)
    }


def verify_patient_formulas(p: ScheduledPatient) -> bool:
    """
    Validates mathematical invariants for a scheduled patient:
      1. Turnaround Time = Completion Time - Arrival Time
      2. Waiting Time = Turnaround Time - Treatment Duration
      3. Response Time = Start Time - Arrival Time
      4. Completion Time = Start Time + Treatment Duration
    """
    eps = 1e-6
    expected_tat = p.completion_time - p.arrival_time
    expected_wt = p.turnaround_time - p.treatment_duration
    expected_rt = p.start_time - p.arrival_time
    expected_ct = p.start_time + p.treatment_duration

    return (
        abs(p.turnaround_time - expected_tat) < eps and
        abs(p.waiting_time - expected_wt) < eps and
        abs(p.response_time - expected_rt) < eps and
        abs(p.completion_time - expected_ct) < eps
    )
