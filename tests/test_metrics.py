"""
Unit Tests for OS Scheduling Metrics
Validates turnaround time, waiting time, response time, and CPU utilization equations.
"""

import pytest
from models.patient import ScheduledPatient
from scheduling.metrics import calculate_metrics, verify_patient_formulas


def test_single_patient_formulas():
    """Verify that a single scheduled patient satisfies all core OS equations."""
    patient = ScheduledPatient(
        patient_id="P1",
        name="Alice",
        arrival_time=0.0,
        priority=1,
        effective_priority=1,
        treatment_duration=5.0,
        start_time=0.0,
        completion_time=5.0,
        waiting_time=0.0,
        turnaround_time=5.0,
        response_time=0.0
    )
    assert verify_patient_formulas(patient) is True


def test_delayed_patient_formulas():
    """Verify formulas when a patient had to wait in the ready queue."""
    patient = ScheduledPatient(
        patient_id="P2",
        name="Bob",
        arrival_time=2.0,
        priority=2,
        effective_priority=2,
        treatment_duration=4.0,
        start_time=5.0,
        completion_time=9.0,
        waiting_time=3.0,       # WT = TAT - BT = 7 - 4 = 3
        turnaround_time=7.0,   # TAT = CT - AT = 9 - 2 = 7
        response_time=3.0      # RT = ST - AT = 5 - 2 = 3
    )
    assert verify_patient_formulas(patient) is True


def test_aggregate_metrics_calculation():
    """Verify average WT, TAT, RT, idle time, and resource utilization."""
    patients = [
        ScheduledPatient(
            patient_id="P1", name="Alice", arrival_time=0.0, priority=1,
            effective_priority=1, treatment_duration=4.0, start_time=0.0,
            completion_time=4.0, waiting_time=0.0, turnaround_time=4.0, response_time=0.0
        ),
        ScheduledPatient(
            patient_id="P2", name="Bob", arrival_time=1.0, priority=2,
            effective_priority=2, treatment_duration=6.0, start_time=4.0,
            completion_time=10.0, waiting_time=3.0, turnaround_time=9.0, response_time=3.0
        ),
    ]

    total_sim_time = 10.0
    idle_time = 0.0

    metrics = calculate_metrics(patients, total_sim_time, idle_time)

    assert metrics["total_patients"] == 2
    assert metrics["avg_waiting_time"] == 1.5   # (0 + 3) / 2
    assert metrics["avg_turnaround_time"] == 6.5 # (4 + 9) / 2
    assert metrics["avg_response_time"] == 1.5   # (0 + 3) / 2
    assert metrics["max_waiting_time"] == 3.0
    assert metrics["busy_time"] == 10.0
    assert metrics["resource_utilization"] == 100.0
    assert metrics["throughput"] == 0.2  # 2 patients / 10 mins


def test_metrics_with_idle_time():
    """Verify resource utilization calculation when doctor is idle."""
    patients = [
        ScheduledPatient(
            patient_id="P1", name="Alice", arrival_time=0.0, priority=1,
            effective_priority=1, treatment_duration=5.0, start_time=0.0,
            completion_time=5.0, waiting_time=0.0, turnaround_time=5.0, response_time=0.0
        )
    ]
    # Total time is 10, doctor was busy for 5, idle for 5
    metrics = calculate_metrics(patients, total_simulation_time=10.0, idle_time=5.0)

    assert metrics["idle_time"] == 5.0
    assert metrics["busy_time"] == 5.0
    assert metrics["resource_utilization"] == 50.0


def test_empty_metrics():
    """Ensure empty patient list returns safe default values without ZeroDivisionError."""
    metrics = calculate_metrics([], 0.0, 0.0)
    assert metrics["total_patients"] == 0
    assert metrics["resource_utilization"] == 0.0
    assert metrics["avg_waiting_time"] == 0.0
    assert metrics["throughput"] == 0.0
