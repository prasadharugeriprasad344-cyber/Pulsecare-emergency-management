"""
Unit Tests for First-Come, First-Served (FCFS) Scheduling Algorithm
Validates chronological scheduling, tie-breaking, idle gaps, and compares against Priority Scheduling.
"""

import pytest
from models.patient import Patient
from scheduling.fcfs import schedule_fcfs
from scheduling.priority import schedule_priority


def test_fcfs_chronological_order():
    """Verify that FCFS serves patients strictly based on arrival time, ignoring priority."""
    patients = [
        Patient(patient_id="P1", name="P1", arrival_time=5.0, priority=1, treatment_duration=3.0),
        Patient(patient_id="P2", name="P2", arrival_time=1.0, priority=4, treatment_duration=4.0),
        Patient(patient_id="P3", name="P3", arrival_time=3.0, priority=2, treatment_duration=2.0),
    ]

    scheduled, timeline, metrics = schedule_fcfs(patients)

    execution_order = [p.patient_id for p in scheduled]
    # In FCFS, arrival times are 1.0 (P2), 3.0 (P3), 5.0 (P1)
    assert execution_order == ["P2", "P3", "P1"]


def test_fcfs_simultaneous_arrival_tie_breaker():
    """Simultaneous arrivals should be served in their submission sequence order."""
    patients = [
        Patient(patient_id="P_FIRST", name="First", arrival_time=0.0, priority=3, treatment_duration=2.0),
        Patient(patient_id="P_SECOND", name="Second", arrival_time=0.0, priority=1, treatment_duration=4.0),
    ]

    scheduled, timeline, metrics = schedule_fcfs(patients)

    assert scheduled[0].patient_id == "P_FIRST"
    assert scheduled[1].patient_id == "P_SECOND"


def test_fcfs_idle_handling():
    """Verify idle gap is correctly recognized in FCFS."""
    patients = [
        Patient(patient_id="P1", name="P1", arrival_time=0.0, priority=2, treatment_duration=2.0),
        Patient(patient_id="P2", name="P2", arrival_time=6.0, priority=2, treatment_duration=3.0),
    ]

    scheduled, timeline, metrics = schedule_fcfs(patients)

    assert metrics["idle_time"] == 4.0
    assert metrics["total_simulation_time"] == 9.0
    assert scheduled[1].start_time == 6.0


def test_fcfs_vs_priority_comparison():
    """
    Demonstrates the fundamental OS contrast:
    In FCFS, a Low-priority patient arriving just before a Critical patient will delay the Critical patient.
    In Priority Scheduling (when both are in the queue), Critical is selected first.
    """
    # Both patients arrive at t=0
    patients = [
        Patient(patient_id="P_LOW", name="Cold/Flu", arrival_time=0.0, priority=4, treatment_duration=10.0),
        Patient(patient_id="P_CRIT", name="Cardiac Arrest", arrival_time=0.0, priority=1, treatment_duration=5.0),
    ]

    fcfs_sched, _, _ = schedule_fcfs(patients)
    prio_sched, _, _ = schedule_priority(patients)

    # In FCFS, P_LOW was entered first, so P_CRIT waits 10 minutes!
    fcfs_crit = next(p for p in fcfs_sched if p.patient_id == "P_CRIT")
    assert fcfs_crit.waiting_time == 10.0

    # In Priority Scheduling, P_CRIT is served immediately (waiting time = 0 minutes)!
    prio_crit = next(p for p in prio_sched if p.patient_id == "P_CRIT")
    assert prio_crit.waiting_time == 0.0
