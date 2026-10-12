"""
Integration Tests for SQLite Database and Persistence Layer
Validates schema setup, patient CRUD operations, simulation history persistence, and cascade deletes.
"""

import pytest
import os
import tempfile
from database.db import init_db
from models.patient import Patient, ScheduledPatient
from services.patient_service import PatientService
from services.history_service import HistoryService


@pytest.fixture
def temp_db():
    """Provides a fresh isolated SQLite database file for testing."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(path)
    yield path
    if os.path.exists(path):
        os.remove(path)


def test_patient_crud(temp_db):
    """Test adding, retrieving, counting, and deleting patients."""
    p1 = Patient("P-001", "Alice", 0.0, 1, 5.0)
    p2 = Patient("P-002", "Bob", 2.0, 3, 4.0)

    PatientService.add_patient(p1, temp_db)
    PatientService.add_patient(p2, temp_db)

    patients = PatientService.get_all_patients(temp_db)
    assert len(patients) == 2
    assert patients[0].patient_id == "P-001"
    assert patients[1].patient_id == "P-002"

    # Duplicate ID rejection
    with pytest.raises(ValueError, match="already exists"):
        PatientService.add_patient(p1, temp_db)

    # Deletion
    deleted = PatientService.delete_patient("P-001", temp_db)
    assert deleted is True
    remaining = PatientService.get_all_patients(temp_db)
    assert len(remaining) == 1
    assert remaining[0].patient_id == "P-002"


def test_simulation_history_persistence(temp_db):
    """Test saving a simulation run and querying the saved execution timeline."""
    sim_id = "SIM-TEST-001"
    metrics = {
        "total_patients": 1,
        "total_simulation_time": 6.0,
        "idle_time": 1.0,
        "resource_utilization": 83.33,
        "avg_waiting_time": 1.0,
        "avg_turnaround_time": 6.0,
        "avg_response_time": 1.0,
        "max_waiting_time": 1.0
    }
    results = [
        ScheduledPatient(
            patient_id="P-001",
            name="Charlie",
            arrival_time=1.0,
            priority=2,
            effective_priority=2,
            treatment_duration=5.0,
            start_time=2.0,
            completion_time=7.0,
            waiting_time=1.0,
            turnaround_time=6.0,
            response_time=1.0
        )
    ]

    saved_id = HistoryService.save_simulation(sim_id, "PRIORITY", metrics, results, db_path=temp_db)
    assert saved_id == sim_id

    sims = HistoryService.get_all_simulations(temp_db)
    assert len(sims) == 1
    assert sims[0]["simulation_id"] == sim_id
    assert sims[0]["policy"] == "PRIORITY"

    details = HistoryService.get_simulation_results(sim_id, temp_db)
    assert len(details) == 1
    assert details[0]["patient_id"] == "P-001"
    assert details[0]["waiting_time"] == 1.0

    # Test export dataframe
    df = HistoryService.export_to_dataframe(sim_id, temp_db)
    assert len(df) == 1
    assert "waiting_time" in df.columns

    # Test deletion
    HistoryService.delete_simulation(sim_id, temp_db)
    assert len(HistoryService.get_all_simulations(temp_db)) == 0
    assert len(HistoryService.get_simulation_results(sim_id, temp_db)) == 0
