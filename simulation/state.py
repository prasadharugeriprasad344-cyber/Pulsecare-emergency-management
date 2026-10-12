"""
Simulation State Representation
Encapsulates the discrete runtime state of the ER scheduling simulation.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from models.patient import Patient, ScheduledPatient, TimelineBlock


class SimulationStatus:
    NOT_STARTED = "NOT_STARTED"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"


@dataclass
class SimulationState:
    """
    Immutable or serializable snapshot of the simulation at a given moment in time.
    """
    current_time: float = 0.0
    status: str = SimulationStatus.NOT_STARTED
    policy: str = "PRIORITY"
    aging_interval: Optional[float] = None
    
    # Active execution state
    active_patient: Optional[Patient] = None
    active_start_time: Optional[float] = None
    active_completion_time: Optional[float] = None
    
    # Queues
    ready_queue: List[Patient] = field(default_factory=list)
    unarrived_pool: List[Patient] = field(default_factory=list)
    
    # Completed records and history
    completed_patients: List[ScheduledPatient] = field(default_factory=list)
    timeline: List[TimelineBlock] = field(default_factory=list)
    decision_log: List[str] = field(default_factory=list)
    
    # Metrics
    total_idle_time: float = 0.0

    @property
    def is_finished(self) -> bool:
        return (
            self.active_patient is None and
            len(self.ready_queue) == 0 and
            len(self.unarrived_pool) == 0
        )
