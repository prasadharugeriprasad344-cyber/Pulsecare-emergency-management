"""
Patient and Scheduling Data Models
Defines core data structures and validation rules for patients and execution timelines.
"""

from dataclasses import dataclass, asdict
from enum import IntEnum
from typing import Optional, Dict, Any


class PriorityLevel(IntEnum):
    """
    Educational Priority Levels for ER Triage Simulation.
    Lower numerical value indicates higher scheduling priority.
    """
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4

    @property
    def label(self) -> str:
        labels = {
            1: "Critical",
            2: "High",
            3: "Medium",
            4: "Low"
        }
        return labels[self.value]

    @property
    def color(self) -> str:
        """Hex color for UI and Gantt visualization."""
        colors = {
            1: "#E63946",  # Red
            2: "#F4A261",  # Orange
            3: "#2A9D8F",  # Teal
            4: "#457B9D"   # Blue
        }
        return colors[self.value]


@dataclass
class Patient:
    """
    Represents an admitted patient (equivalent to an OS Process).
    
    Attributes:
        patient_id: Unique identifier (e.g., 'P-001')
        name: Synthetic or entered patient name
        arrival_time: Time of arrival at ER in simulation minutes (>= 0)
        priority: Priority level (1=Critical, 2=High, 3=Medium, 4=Low)
        treatment_duration: Estimated doctor time required (> 0)
        created_at: ISO timestamp of record creation
    """
    patient_id: str
    name: str
    arrival_time: float
    priority: int
    treatment_duration: float
    created_at: Optional[str] = None

    def __post_init__(self):
        self.validate()

    def validate(self) -> None:
        """Enforces OS simulation constraints and data integrity."""
        if not self.patient_id or not isinstance(self.patient_id, str) or not self.patient_id.strip():
            raise ValueError("Patient ID must be a non-empty string.")
        
        if not self.name or not isinstance(self.name, str) or not self.name.strip():
            raise ValueError("Patient name must be a non-empty string.")

        try:
            self.arrival_time = float(self.arrival_time)
        except (ValueError, TypeError):
            raise ValueError("Arrival time must be a valid number.")

        if self.arrival_time < 0:
            raise ValueError(f"Arrival time cannot be negative: {self.arrival_time}")

        if not isinstance(self.priority, int) or self.priority not in (1, 2, 3, 4):
            raise ValueError(f"Priority must be an integer between 1 and 4, got: {self.priority}")

        try:
            self.treatment_duration = float(self.treatment_duration)
        except (ValueError, TypeError):
            raise ValueError("Treatment duration must be a valid number.")

        if self.treatment_duration <= 0:
            raise ValueError(f"Treatment duration must be strictly greater than 0, got: {self.treatment_duration}")

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Patient":
        return cls(
            patient_id=data["patient_id"],
            name=data["name"],
            arrival_time=float(data["arrival_time"]),
            priority=int(data["priority"]),
            treatment_duration=float(data["treatment_duration"]),
            created_at=data.get("created_at")
        )


@dataclass
class ScheduledPatient:
    """
    Represents a patient after being processed by the CPU/Doctor scheduler.
    Contains all computed OS scheduling metrics.
    """
    patient_id: str
    name: str
    arrival_time: float
    priority: int
    effective_priority: int
    treatment_duration: float
    start_time: float
    completion_time: float
    waiting_time: float
    turnaround_time: float
    response_time: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class TimelineBlock:
    """
    Represents a contiguous block of time on the Gantt chart / timeline.
    Either a patient treatment block or an IDLE CPU block.
    """
    start_time: float
    end_time: float
    patient_id: Optional[str] = None
    label: str = "IDLE"
    priority: Optional[int] = None
    is_idle: bool = False

    @property
    def duration(self) -> float:
        return self.end_time - self.start_time
