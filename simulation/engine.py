"""
Simulation Engine
Discrete-event execution engine that supports step-by-step interactive simulation,
dynamic patient intake during execution, and transparent scheduler decision logs.
"""

from typing import List, Optional, Dict, Any
import copy

from models.patient import Patient, ScheduledPatient, TimelineBlock, PriorityLevel
from scheduling.metrics import calculate_metrics
from simulation.state import SimulationState, SimulationStatus


class SimulationEngine:
    """
    Stateful, discrete-event scheduling engine designed for interactive Streamlit playback.
    """

    def __init__(
        self,
        initial_patients: List[Patient],
        policy: str = "PRIORITY",
        aging_interval: Optional[float] = None
    ):
        self.initial_patients = [
            copy.deepcopy(p) for p in sorted(initial_patients, key=lambda x: (x.arrival_time, x.patient_id))
        ]
        self.policy = policy
        self.aging_interval = aging_interval
        self.state = SimulationState(
            current_time=0.0,
            status=SimulationStatus.NOT_STARTED,
            policy=policy,
            aging_interval=aging_interval,
            active_patient=None,
            active_start_time=None,
            active_completion_time=None,
            ready_queue=[],
            unarrived_pool=[copy.deepcopy(p) for p in self.initial_patients],
            completed_patients=[],
            timeline=[],
            decision_log=[],
            total_idle_time=0.0
        )
        # Check initial admissions at t=0
        self._check_arrivals()

    def reset(self) -> None:
        """Resets the simulation to the initial t=0 state."""
        self.state = SimulationState(
            current_time=0.0,
            status=SimulationStatus.NOT_STARTED,
            policy=self.policy,
            aging_interval=self.aging_interval,
            active_patient=None,
            active_start_time=None,
            active_completion_time=None,
            ready_queue=[],
            unarrived_pool=[copy.deepcopy(p) for p in self.initial_patients],
            completed_patients=[],
            timeline=[],
            decision_log=[f"[t=0.0] Simulation reset to initial state with policy {self.policy}."],
            total_idle_time=0.0
        )
        self._check_arrivals()

    def _check_arrivals(self) -> None:
        """Transfers newly arrived patients from unarrived_pool to ready_queue."""
        arrived = [p for p in self.state.unarrived_pool if p.arrival_time <= self.state.current_time]
        for p in arrived:
            self.state.unarrived_pool.remove(p)
            self.state.ready_queue.append(p)
            self.state.decision_log.append(
                f"[t={self.state.current_time:.1f}] Patient {p.patient_id} ({p.name}) arrived at ER (Priority {p.priority} - {PriorityLevel(p.priority).label}, Duration: {p.treatment_duration}m)."
            )

    def calculate_effective_priority(self, patient: Patient) -> int:
        """Calculates dynamic priority considering the aging mechanism."""
        if self.policy != "PRIORITY_AGING" or not self.aging_interval or self.aging_interval <= 0:
            return patient.priority
        
        waiting_time = max(0.0, self.state.current_time - patient.arrival_time)
        promotions = int(waiting_time // self.aging_interval)
        # Numerical minimum is 1 (Critical)
        return max(1, patient.priority - promotions)

    def add_patient_dynamically(self, patient: Patient) -> None:
        """
        Dynamically admits a new patient while the simulation is running.
        """
        patient.validate()
        p = copy.deepcopy(patient)
        
        # If arrival time is earlier than current clock, clamp to current clock
        if p.arrival_time < self.state.current_time:
            p.arrival_time = self.state.current_time

        if p.arrival_time <= self.state.current_time:
            self.state.ready_queue.append(p)
            self.state.decision_log.append(
                f"[t={self.state.current_time:.1f}] DYNAMIC ADMISSION: Patient {p.patient_id} ({p.name}) entered waiting room (Priority {p.priority} - {PriorityLevel(p.priority).label})."
            )
        else:
            self.state.unarrived_pool.append(p)
            self.state.unarrived_pool.sort(key=lambda x: (x.arrival_time, x.patient_id))
            self.state.decision_log.append(
                f"[t={self.state.current_time:.1f}] DYNAMIC ADMISSION: Patient {p.patient_id} scheduled for future arrival at t={p.arrival_time:.1f}."
            )

    def _select_next_patient(self) -> Optional[Patient]:
        """Selects the next patient from ready_queue according to policy."""
        if not self.state.ready_queue:
            return None

        if self.policy == "FCFS":
            selected = min(
                self.state.ready_queue,
                key=lambda p: (p.arrival_time, p.patient_id)
            )
            reason = f"First arrival in queue (Arrived: t={selected.arrival_time:.1f})"
        elif self.policy == "PRIORITY_AGING":
            # Sort by effective priority, then arrival time, then patient_id
            selected = min(
                self.state.ready_queue,
                key=lambda p: (self.calculate_effective_priority(p), p.arrival_time, p.patient_id)
            )
            eff_p = self.calculate_effective_priority(selected)
            reason = f"Effective Priority {eff_p} (Base: {selected.priority}, Arrived: t={selected.arrival_time:.1f})"
        else:
            # Default: PRIORITY
            selected = min(
                self.state.ready_queue,
                key=lambda p: (p.priority, p.arrival_time, p.patient_id)
            )
            reason = f"Highest priority (Level {selected.priority} - {PriorityLevel(selected.priority).label}, Arrived: t={selected.arrival_time:.1f})"

        self.state.ready_queue.remove(selected)
        self.state.decision_log.append(
            f"[t={self.state.current_time:.1f}] SCHEDULER DECISION: Assigned Doctor to {selected.patient_id} ({selected.name}). Reason: {reason} out of {len(self.state.ready_queue) + 1} candidates."
        )
        return selected

    def step(self) -> bool:
        """
        Advances the simulation to the next discrete event boundary.
        Returns True if simulation is still active, False if completed.
        """
        if self.state.is_finished:
            self.state.status = SimulationStatus.COMPLETED
            return False

        self.state.status = SimulationStatus.RUNNING

        # Case 1: A patient is currently in treatment -> complete treatment
        if self.state.active_patient is not None:
            p = self.state.active_patient
            start_t = self.state.active_start_time
            end_t = self.state.active_completion_time
            self.state.current_time = end_t

            # Calculate metrics
            tat = end_t - p.arrival_time
            wt = tat - p.treatment_duration
            rt = start_t - p.arrival_time
            eff_p = self.calculate_effective_priority(p)

            scheduled_p = ScheduledPatient(
                patient_id=p.patient_id,
                name=p.name,
                arrival_time=round(p.arrival_time, 2),
                priority=p.priority,
                effective_priority=eff_p,
                treatment_duration=round(p.treatment_duration, 2),
                start_time=round(start_t, 2),
                completion_time=round(end_t, 2),
                waiting_time=round(wt, 2),
                turnaround_time=round(tat, 2),
                response_time=round(rt, 2)
            )
            self.state.completed_patients.append(scheduled_p)

            self.state.timeline.append(TimelineBlock(
                start_time=round(start_t, 2),
                end_time=round(end_t, 2),
                patient_id=p.patient_id,
                label=f"{p.patient_id} ({p.name})",
                priority=p.priority,
                is_idle=False
            ))

            self.state.decision_log.append(
                f"[t={self.state.current_time:.1f}] COMPLETED: Patient {p.patient_id} ({p.name}) discharged. WT: {wt:.1f}m, TAT: {tat:.1f}m."
            )

            self.state.active_patient = None
            self.state.active_start_time = None
            self.state.active_completion_time = None

            # Check any arrivals that landed while doctor was busy
            self._check_arrivals()

            if self.state.is_finished:
                self.state.status = SimulationStatus.COMPLETED
                self.state.decision_log.append(f"[t={self.state.current_time:.1f}] All patients successfully treated. Simulation complete.")
                return False

        # Case 2: Doctor is free -> schedule next patient or advance over idle gap
        self._check_arrivals()

        if self.state.ready_queue:
            next_p = self._select_next_patient()
            self.state.active_patient = next_p
            self.state.active_start_time = self.state.current_time
            self.state.active_completion_time = self.state.current_time + next_p.treatment_duration
        else:
            # Ready queue is empty
            if self.state.unarrived_pool:
                next_arr = self.state.unarrived_pool[0].arrival_time
                if next_arr > self.state.current_time:
                    gap = next_arr - self.state.current_time
                    self.state.total_idle_time += gap
                    self.state.timeline.append(TimelineBlock(
                        start_time=round(self.state.current_time, 2),
                        end_time=round(next_arr, 2),
                        patient_id=None,
                        label="IDLE",
                        priority=None,
                        is_idle=True
                    ))
                    self.state.decision_log.append(
                        f"[t={self.state.current_time:.1f}] IDLE DOCTOR: Ready queue is empty. Advancing clock by {gap:.1f}m to next arrival at t={next_arr:.1f}."
                    )
                    self.state.current_time = next_arr
                self._check_arrivals()
                if self.state.ready_queue:
                    next_p = self._select_next_patient()
                    self.state.active_patient = next_p
                    self.state.active_start_time = self.state.current_time
                    self.state.active_completion_time = self.state.current_time + next_p.treatment_duration
            else:
                self.state.status = SimulationStatus.COMPLETED
                return False

        return True

    def run_all(self) -> Dict[str, float]:
        """Runs the simulation to completion and returns aggregate metrics."""
        while not self.state.is_finished:
            self.step()
        return self.get_metrics()

    def get_metrics(self) -> Dict[str, float]:
        """Calculates current aggregate metrics."""
        return calculate_metrics(
            self.state.completed_patients,
            self.state.current_time,
            self.state.total_idle_time
        )
