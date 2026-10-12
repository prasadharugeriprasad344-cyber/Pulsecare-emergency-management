"""
Unit Tests for Non-Preemptive Priority Scheduling Algorithm
Validates priority ordering, tie-breaking, arrival time handling, non-preemption, and idle gaps.
"""

import pytest
from models.patient import Patient
from scheduling.priority import schedule_priority


def test_simultaneous_arrivals_priority_order():
    """
    Given patients arriving simultaneously at t=0 with different priorities,
    verify that they are served strictly in order of priority (1 -> 2 -> 3 -> 4).
    """
    patients = [
        Patient(patient_id="P_LOW", name="Low Patient", arrival_time=0.0, priority=4, treatment_duration=3.0),
        Patient(patient_id="P_CRIT", name="Critical Patient", arrival_time=0.0, priority=1, treatment_duration=2.0),
        Patient(patient_id="P_HIGH", name="High Patient", arrival_time=0.0, priority=2, treatment_duration=4.0),
        Patient(patient_id="P_MED", name="Medium Patient", arrival_time=0.0, priority=3, treatment_duration=1.0),
    ]

    scheduled, timeline, metrics = schedule_priority(patients)

    execution_order = [p.patient_id for p in scheduled]
    assert execution_order == ["P_CRIT", "P_HIGH", "P_MED", "P_LOW"]

    # Verify P_CRIT started at 0 and finished at 2
    assert scheduled[0].start_time == 0.0
    assert scheduled[0].completion_time == 2.0
    assert scheduled[0].waiting_time == 0.0

    # Verify P_HIGH started at 2 and finished at 6
    assert scheduled[1].start_time == 2.0
    assert scheduled[1].completion_time == 6.0
    assert scheduled[1].waiting_time == 2.0


def test_equal_priority_fifo_tie_breaking():
    """
    If two patients have identical priority, the one who arrived earlier must be served first.
    """
    patients = [
        Patient(patient_id="P_LATE", name="Late", arrival_time=3.0, priority=2, treatment_duration=4.0),
        Patient(patient_id="P_EARLY", name="Early", arrival_time=1.0, priority=2, treatment_duration=5.0),
    ]

    scheduled, timeline, metrics = schedule_priority(patients)

    assert scheduled[0].patient_id == "P_EARLY"
    assert scheduled[1].patient_id == "P_LATE"


def test_non_preemption_invariance():
    """
    Crucial OS concept: Non-preemptive scheduling.
    If a low-priority patient is already running, a newly arrived Critical patient
    must wait until the running patient completes treatment.
    """
    patients = [
        # P1 starts at t=0, runs for 6 minutes (until t=6)
        Patient(patient_id="P1_LOW", name="P1", arrival_time=0.0, priority=4, treatment_duration=6.0),
        # P2 arrives at t=2 with CRITICAL priority (1), but P1 is already in treatment!
        Patient(patient_id="P2_CRIT", name="P2", arrival_time=2.0, priority=1, treatment_duration=3.0),
    ]

    scheduled, timeline, metrics = schedule_priority(patients)

    # P1 is not preempted!
    assert scheduled[0].patient_id == "P1_LOW"
    assert scheduled[0].start_time == 0.0
    assert scheduled[0].completion_time == 6.0

    # P2 starts immediately when P1 finishes at t=6
    assert scheduled[1].patient_id == "P2_CRIT"
    assert scheduled[1].start_time == 6.0
    assert scheduled[1].completion_time == 9.0
    assert scheduled[1].waiting_time == 4.0  # Arrived at 2, started at 6 -> WT = 4


def test_idle_resource_periods():
    """
    Test when there is an idle gap between patient arrivals.
    Example: P1 finishes at t=3. P2 does not arrive until t=7.
    Doctor is idle from t=3 to t=7 (idle_time = 4).
    """
    patients = [
        Patient(patient_id="P1", name="P1", arrival_time=0.0, priority=1, treatment_duration=3.0),
        Patient(patient_id="P2", name="P2", arrival_time=7.0, priority=1, treatment_duration=2.0),
    ]

    scheduled, timeline, metrics = schedule_priority(patients)

    assert len(scheduled) == 2
    assert metrics["idle_time"] == 4.0
    assert metrics["total_simulation_time"] == 9.0
    assert metrics["busy_time"] == 5.0
    assert metrics["resource_utilization"] == round((5.0 / 9.0) * 100, 2)

    # Verify IDLE block is in timeline
    idle_blocks = [b for b in timeline if b.is_idle]
    assert len(idle_blocks) == 1
    assert idle_blocks[0].start_time == 3.0
    assert idle_blocks[0].end_time == 7.0


def test_input_validation_rules():
    """Verify that invalid patient data raises ValueError with informative messages."""
    # Negative arrival time
    with pytest.raises(ValueError, match="Arrival time cannot be negative"):
        Patient(patient_id="P1", name="Bad Arrival", arrival_time=-1.0, priority=1, treatment_duration=5.0)

    # Zero treatment duration
    with pytest.raises(ValueError, match="Treatment duration must be strictly greater than 0"):
        Patient(patient_id="P2", name="Zero Duration", arrival_time=0.0, priority=1, treatment_duration=0.0)

    # Negative treatment duration
    with pytest.raises(ValueError, match="Treatment duration must be strictly greater than 0"):
        Patient(patient_id="P3", name="Negative Duration", arrival_time=0.0, priority=1, treatment_duration=-4.0)

    # Invalid priority number (outside 1..4)
    with pytest.raises(ValueError, match="Priority must be an integer between 1 and 4"):
        Patient(patient_id="P4", name="Bad Priority", arrival_time=0.0, priority=5, treatment_duration=3.0)


def test_empty_patient_list():
    """Empty input should return empty lists without crashing."""
    scheduled, timeline, metrics = schedule_priority([])
    assert scheduled == []
    assert timeline == []
    assert metrics["total_patients"] == 0
    assert metrics["total_simulation_time"] == 0.0
