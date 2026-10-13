"""
PulseCare - FastAPI Backend API Server
Provides high-performance REST API endpoints for patient records,
scheduling algorithms, simulation history, and synthetic data generation.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import csv
import io
from fastapi.responses import Response

from database.db import init_db
from models.patient import Patient, PriorityLevel
from services.patient_service import PatientService
from services.history_service import HistoryService
from scheduling.priority import schedule_priority
from scheduling.fcfs import schedule_fcfs
from scheduling.aging import schedule_priority_with_aging
from simulation.synthetic_data import (
    generate_synthetic_patients,
    get_scenario,
    ScenarioType,
    SCENARIO_METADATA
)

# Initialize database schema
init_db()

app = FastAPI(
    title="PulseCare - Smart Emergency Operations API",
    description="Educational OS Priority Scheduling and Hospital ER Simulation Backend",
    version="2.0.0"
)

# Allow React / Vite frontend on any port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Request Models ---

class PatientIn(BaseModel):
    patient_id: str
    name: str
    arrival_time: float = Field(..., ge=0.0)
    priority: int = Field(..., ge=1, le=4)
    treatment_duration: float = Field(..., gt=0.0)


class SyntheticBatchRequest(BaseModel):
    count: int = Field(8, ge=1, le=1000)
    arrival_span: float = Field(20.0, gt=0.0)
    min_duration: float = Field(3.0, gt=0.0)
    max_duration: float = Field(8.0, gt=0.0)
    seed: Optional[int] = 42


class ScheduleRequest(BaseModel):
    patients: Optional[List[PatientIn]] = None
    aging_interval: Optional[float] = 6.0


class SaveSimulationRequest(BaseModel):
    simulation_id: str
    policy: str
    metrics: Dict[str, Any]
    results: List[Dict[str, Any]]
    aging_interval: Optional[float] = None


# --- Endpoints ---

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "app": "PulseCare", "version": "2.0.0"}


@app.get("/api/patients")
def get_patients():
    patients = PatientService.get_all_patients()
    return [p.to_dict() for p in patients]


@app.post("/api/patients")
def add_patient(patient_in: PatientIn):
    try:
        p = Patient(
            patient_id=patient_in.patient_id,
            name=patient_in.name,
            arrival_time=patient_in.arrival_time,
            priority=patient_in.priority,
            treatment_duration=patient_in.treatment_duration
        )
        PatientService.add_patient(p)
        return {"message": "Patient admitted successfully", "patient": p.to_dict()}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/patients/bulk")
def add_patients_bulk(patients_in: List[PatientIn]):
    try:
        p_list = [
            Patient(
                patient_id=p.patient_id,
                name=p.name,
                arrival_time=p.arrival_time,
                priority=p.priority,
                treatment_duration=p.treatment_duration
            )
            for p in patients_in
        ]
        count = PatientService.add_patients_bulk(p_list)
        return {"message": f"Successfully loaded {count} patients"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/patients/{patient_id}")
def delete_patient(patient_id: str):
    success = PatientService.delete_patient(patient_id)
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": "Patient deleted successfully"}


@app.delete("/api/patients")
def clear_all_patients():
    PatientService.clear_all_patients()
    return {"message": "All patients cleared"}


@app.get("/api/scenarios")
def get_all_scenarios():
    return SCENARIO_METADATA


@app.get("/api/scenarios/{scenario_key}")
def load_scenario(scenario_key: str):
    try:
        patients = get_scenario(scenario_key)
        return [p.to_dict() for p in patients]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/synthetic/generate")
def generate_synthetic(req: SyntheticBatchRequest):
    patients = generate_synthetic_patients(
        count=req.count,
        arrival_span=req.arrival_span,
        min_duration=req.min_duration,
        max_duration=req.max_duration,
        seed=req.seed
    )
    return [p.to_dict() for p in patients]


@app.post("/api/schedule/priority")
def api_schedule_priority(req: ScheduleRequest):
    if req.patients is not None:
        raw_list = [
            Patient(p.patient_id, p.name, p.arrival_time, p.priority, p.treatment_duration)
            for p in req.patients
        ]
    else:
        raw_list = PatientService.get_all_patients()

    scheduled, timeline, metrics = schedule_priority(raw_list)
    return {
        "policy": "PRIORITY",
        "scheduled": [s.to_dict() for s in scheduled],
        "timeline": [
            {
                "start_time": b.start_time,
                "end_time": b.end_time,
                "duration": b.duration,
                "label": b.label,
                "priority": b.priority,
                "is_idle": b.is_idle,
                "patient_id": b.patient_id
            }
            for b in timeline
        ],
        "metrics": metrics
    }


@app.post("/api/schedule/fcfs")
def api_schedule_fcfs(req: ScheduleRequest):
    if req.patients is not None:
        raw_list = [
            Patient(p.patient_id, p.name, p.arrival_time, p.priority, p.treatment_duration)
            for p in req.patients
        ]
    else:
        raw_list = PatientService.get_all_patients()

    scheduled, timeline, metrics = schedule_fcfs(raw_list)
    return {
        "policy": "FCFS",
        "scheduled": [s.to_dict() for s in scheduled],
        "timeline": [
            {
                "start_time": b.start_time,
                "end_time": b.end_time,
                "duration": b.duration,
                "label": b.label,
                "priority": b.priority,
                "is_idle": b.is_idle,
                "patient_id": b.patient_id
            }
            for b in timeline
        ],
        "metrics": metrics
    }


@app.post("/api/schedule/aging")
def api_schedule_aging(req: ScheduleRequest):
    if req.patients is not None:
        raw_list = [
            Patient(p.patient_id, p.name, p.arrival_time, p.priority, p.treatment_duration)
            for p in req.patients
        ]
    else:
        raw_list = PatientService.get_all_patients()

    interval = req.aging_interval if req.aging_interval and req.aging_interval > 0 else 6.0
    scheduled, timeline, metrics = schedule_priority_with_aging(raw_list, interval)
    return {
        "policy": "PRIORITY_AGING",
        "aging_interval": interval,
        "scheduled": [s.to_dict() for s in scheduled],
        "timeline": [
            {
                "start_time": b.start_time,
                "end_time": b.end_time,
                "duration": b.duration,
                "label": b.label,
                "priority": b.priority,
                "is_idle": b.is_idle,
                "patient_id": b.patient_id
            }
            for b in timeline
        ],
        "metrics": metrics
    }


@app.get("/api/simulations")
def get_simulations():
    return HistoryService.get_all_simulations()


@app.get("/api/simulations/{simulation_id}")
def get_simulation_details(simulation_id: str):
    results = HistoryService.get_simulation_results(simulation_id)
    if not results:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return results


@app.post("/api/simulations")
def save_simulation(req: SaveSimulationRequest):
    from models.patient import ScheduledPatient
    scheduled_objs = [
        ScheduledPatient(
            patient_id=r["patient_id"],
            name=r["name"] if "name" in r else r.get("patient_name", ""),
            arrival_time=r["arrival_time"],
            priority=r["priority"],
            effective_priority=r.get("effective_priority", r["priority"]),
            treatment_duration=r["treatment_duration"],
            start_time=r["start_time"],
            completion_time=r["completion_time"],
            waiting_time=r["waiting_time"],
            turnaround_time=r["turnaround_time"],
            response_time=r["response_time"]
        )
        for r in req.results
    ]
    saved_id = HistoryService.save_simulation(
        simulation_id=req.simulation_id,
        policy=req.policy,
        metrics=req.metrics,
        results=scheduled_objs,
        aging_interval=req.aging_interval
    )
    return {"message": "Simulation saved", "simulation_id": saved_id}


@app.delete("/api/simulations/{simulation_id}")
def delete_simulation(simulation_id: str):
    success = HistoryService.delete_simulation(simulation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return {"message": "Simulation deleted"}


@app.get("/api/simulations/{simulation_id}/export")
def export_simulation_csv(simulation_id: str):
    results = HistoryService.get_simulation_results(simulation_id)
    if not results:
        raise HTTPException(status_code=404, detail="Simulation not found")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=results[0].keys())
    writer.writeheader()
    writer.writerows(results)

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={simulation_id}_results.csv"}
    )
