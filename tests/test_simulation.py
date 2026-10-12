"""
Unit Tests for Synthetic Data Generation and Discrete-Event Simulation Engine
Validates reproducibility, scenarios, step execution, dynamic admissions, and reset logic.
"""

import pytest
from models.patient import Patient
from simulation.synthetic_data import (
    generate_synthetic_patients,
    get_scenario,
    ScenarioType
)
from simulation.engine import SimulationEngine
from simulation.state import SimulationStatus
from scheduling.priority import schedule_priority


def test_synthetic_generator_determinism():
    """Verify that a fixed random seed generates identical synthetic datasets."""
    set1 = generate_synthetic_patients(count=5, seed=123)
    set2 = generate_synthetic_patients(count=5, seed=123)
    set3 = generate_synthetic_patients(count=5, seed=999)

    # Identical seed -> identical fields
    for p1, p2 in zip(set1, set2):
        assert p1.patient_id == p2.patient_id
        assert p1.arrival_time == p2.arrival_time
        assert p1.priority == p2.priority
        assert p1.treatment_duration == p2.treatment_duration

    # Different seed -> distinct values
    assert set1[0].treatment_duration != set3[0].treatment_duration or set1[0].arrival_time != set3[0].arrival_time


def test_all_predefined_scenarios_are_valid():
    """Verify each educational scenario generates valid patients with proper fields."""
    scenarios = [
        ScenarioType.SMALL_ED,
        ScenarioType.BUSY_ED,
        ScenarioType.STARVATION,
        ScenarioType.EQUAL_PRIORITY,
        ScenarioType.SIMULTANEOUS,
        ScenarioType.IDLE_PERIODS
    ]

    for key in scenarios:
        patients = get_scenario(key)
        assert len(patients) > 0
        for p in patients:
            p.validate()


def test_step_by_step_matches_batch_scheduler():
    """
    Core OS verification:
    The step-by-step discrete-event SimulationEngine must yield the exact same
    metrics and schedule as the pure batch schedule_priority function!
    """
    patients = get_scenario(ScenarioType.SMALL_ED)

    # Batch run
    batch_scheduled, _, batch_metrics = schedule_priority(patients)

    # Step-by-step simulation run
    engine = SimulationEngine(patients, policy="PRIORITY")
    engine.run_all()

    step_scheduled = engine.state.completed_patients
    step_metrics = engine.get_metrics()

    assert len(step_scheduled) == len(batch_scheduled)
    for b_p, s_p in zip(batch_scheduled, step_scheduled):
        assert b_p.patient_id == s_p.patient_id
        assert b_p.start_time == s_p.start_time
        assert b_p.completion_time == s_p.completion_time
        assert b_p.waiting_time == s_p.waiting_time

    assert step_metrics["avg_waiting_time"] == batch_metrics["avg_waiting_time"]
    assert step_metrics["resource_utilization"] == batch_metrics["resource_utilization"]


def test_dynamic_patient_admission():
    """
    Verify that admitting a patient dynamically during a running simulation
    correctly places the patient in the queue and schedules them.
    """
    initial = [
        Patient("P1", "First", arrival_time=0.0, priority=3, treatment_duration=5.0),
        Patient("P2", "Second", arrival_time=0.0, priority=4, treatment_duration=5.0)
    ]
    engine = SimulationEngine(initial, policy="PRIORITY")

    # Step 1: Doctor starts P1 at t=0
    engine.step()
    assert engine.state.active_patient.patient_id == "P1"

    # Step 2: P1 completes at t=5. Doctor is about to pick P2.
    # Dynamically inject a Critical patient at t=5!
    new_patient = Patient("P_DYN_CRIT", "Dynamic Emergency", arrival_time=5.0, priority=1, treatment_duration=3.0)
    engine.add_patient_dynamically(new_patient)

    # Step 3: Scheduler must pick the newly arrived Critical patient over P2!
    engine.step()
    assert engine.state.active_patient.patient_id == "P_DYN_CRIT"

    # Finish simulation
    engine.run_all()
    completed_ids = [p.patient_id for p in engine.state.completed_patients]
    assert completed_ids == ["P1", "P_DYN_CRIT", "P2"]


def test_simulation_reset():
    """Verify resetting the engine restores initial conditions cleanly."""
    patients = get_scenario(ScenarioType.SMALL_ED)
    engine = SimulationEngine(patients, policy="PRIORITY")

    engine.step()
    engine.step()
    assert engine.state.current_time > 0.0

    engine.reset()
    assert engine.state.current_time == 0.0
    assert engine.state.status == SimulationStatus.NOT_STARTED
    assert len(engine.state.completed_patients) == 0
    assert len(engine.state.timeline) == 0
