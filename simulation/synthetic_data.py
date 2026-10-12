"""
Synthetic Patient Data Generator
Produces deterministic, reproducible synthetic patient datasets and pre-configured
educational scenarios demonstrating specific Operating Systems scheduling dynamics.
"""

import random
from typing import List, Dict, Any, Optional
from models.patient import Patient, PriorityLevel


class ScenarioType:
    SMALL_ED = "small_ed"
    BUSY_ED = "busy_ed"
    STARVATION = "starvation"
    EQUAL_PRIORITY = "equal_priority"
    SIMULTANEOUS = "simultaneous"
    IDLE_PERIODS = "idle_periods"


def generate_synthetic_patients(
    count: int = 8,
    arrival_span: float = 20.0,
    min_duration: float = 3.0,
    max_duration: float = 8.0,
    priority_weights: Optional[Dict[int, float]] = None,
    seed: Optional[int] = 42
) -> List[Patient]:
    """
    Generates a list of synthetic patients with configurable distributions and seed.

    Args:
        count: Number of patients to generate.
        arrival_span: Time window in minutes across which patients arrive.
        min_duration: Minimum treatment duration.
        max_duration: Maximum treatment duration.
        priority_weights: Mapping of {Priority (1..4): weight}.
        seed: Random seed for 100% deterministic reproducibility.

    Returns:
        List of validated Patient objects sorted by arrival time.
    """
    if count <= 0:
        return []

    if seed is not None:
        rng = random.Random(seed)
    else:
        rng = random.Random()

    if priority_weights is None:
        # Default: 15% Critical, 30% High, 35% Medium, 20% Low
        priority_weights = {1: 0.15, 2: 0.30, 3: 0.35, 4: 0.20}

    priorities = list(priority_weights.keys())
    weights = list(priority_weights.values())

    first_names = [
        "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Sam", "Chris",
        "Pat", "Avery", "Jamie", "Dakota", "Quinn", "Reese", "Rowan", "Skyler"
    ]

    patients: List[Patient] = []
    for i in range(count):
        patient_id = f"SYN-{i + 1:03d}"
        chosen_name = f"{rng.choice(first_names)} (Synthetic)"
        arrival_time = round(rng.uniform(0.0, arrival_span), 1)
        priority = rng.choices(priorities, weights=weights, k=1)[0]
        treatment_duration = round(rng.uniform(min_duration, max_duration), 1)

        patient = Patient(
            patient_id=patient_id,
            name=chosen_name,
            arrival_time=arrival_time,
            priority=priority,
            treatment_duration=treatment_duration
        )
        patients.append(patient)

    # Sort strictly by arrival time, then by patient_id
    patients.sort(key=lambda p: (p.arrival_time, p.patient_id))
    return patients


def get_scenario(scenario_key: str) -> List[Patient]:
    """
    Returns curated, standard educational scenarios designed for OS demonstrations.
    """
    if scenario_key == ScenarioType.SMALL_ED:
        # Scenario 1: Small ED - diverse priorities and moderate arrivals
        return [
            Patient("P-101", "Emma Watson (Synthetic)", arrival_time=0.0, priority=3, treatment_duration=4.0),
            Patient("P-102", "Liam Neeson (Synthetic)", arrival_time=2.0, priority=1, treatment_duration=5.0),
            Patient("P-103", "Olivia Wilde (Synthetic)", arrival_time=3.0, priority=2, treatment_duration=3.0),
            Patient("P-104", "Noah Centineo (Synthetic)", arrival_time=6.0, priority=4, treatment_duration=6.0),
            Patient("P-105", "Sophia Loren (Synthetic)", arrival_time=8.0, priority=2, treatment_duration=4.0),
            Patient("P-106", "Lucas Hedges (Synthetic)", arrival_time=12.0, priority=1, treatment_duration=3.0),
        ]

    elif scenario_key == ScenarioType.BUSY_ED:
        # Scenario 2: Busy ED - heavy load with back-to-back arrivals
        return [
            Patient("P-201", "Patient Alpha (Synthetic)", arrival_time=0.0, priority=2, treatment_duration=5.0),
            Patient("P-202", "Patient Beta (Synthetic)", arrival_time=1.0, priority=3, treatment_duration=4.0),
            Patient("P-203", "Patient Gamma (Synthetic)", arrival_time=2.0, priority=1, treatment_duration=6.0),
            Patient("P-204", "Patient Delta (Synthetic)", arrival_time=3.0, priority=4, treatment_duration=8.0),
            Patient("P-205", "Patient Epsilon (Synthetic)", arrival_time=4.0, priority=2, treatment_duration=3.0),
            Patient("P-206", "Patient Zeta (Synthetic)", arrival_time=5.0, priority=1, treatment_duration=5.0),
            Patient("P-207", "Patient Eta (Synthetic)", arrival_time=7.0, priority=3, treatment_duration=4.0),
            Patient("P-208", "Patient Theta (Synthetic)", arrival_time=9.0, priority=2, treatment_duration=6.0),
            Patient("P-209", "Patient Iota (Synthetic)", arrival_time=11.0, priority=1, treatment_duration=3.0),
            Patient("P-210", "Patient Kappa (Synthetic)", arrival_time=13.0, priority=4, treatment_duration=7.0),
        ]

    elif scenario_key == ScenarioType.STARVATION:
        # Scenario 3: Continuous High-Priority Arrivals (Classic Starvation)
        # P-301 is Low priority (4) arriving at t=0.
        # But an ongoing stream of Critical (1) and High (2) patients keep arriving before P-301 can get the doctor!
        return [
            Patient("P-301", "Delayed David (Low Priority)", arrival_time=0.0, priority=4, treatment_duration=5.0),
            Patient("P-302", "Emergency Eva (Critical)", arrival_time=1.0, priority=1, treatment_duration=4.0),
            Patient("P-303", "Emergency Frank (Critical)", arrival_time=3.0, priority=1, treatment_duration=5.0),
            Patient("P-304", "Urgent Grace (High)", arrival_time=5.0, priority=2, treatment_duration=4.0),
            Patient("P-305", "Urgent Henry (High)", arrival_time=8.0, priority=2, treatment_duration=4.0),
            Patient("P-306", "Emergency Ivy (Critical)", arrival_time=11.0, priority=1, treatment_duration=3.0),
        ]

    elif scenario_key == ScenarioType.EQUAL_PRIORITY:
        # Scenario 4: Equal Priority (demonstrates pure FIFO tie-breaker)
        return [
            Patient("P-401", "Aaron Equal (Medium)", arrival_time=1.0, priority=3, treatment_duration=4.0),
            Patient("P-402", "Bella Equal (Medium)", arrival_time=3.0, priority=3, treatment_duration=5.0),
            Patient("P-403", "Cody Equal (Medium)", arrival_time=4.0, priority=3, treatment_duration=3.0),
            Patient("P-404", "Diana Equal (Medium)", arrival_time=6.0, priority=3, treatment_duration=4.0),
        ]

    elif scenario_key == ScenarioType.SIMULTANEOUS:
        # Scenario 5: Simultaneous arrivals at t=0
        return [
            Patient("P-501", "Patient Low (t=0)", arrival_time=0.0, priority=4, treatment_duration=6.0),
            Patient("P-502", "Patient Med (t=0)", arrival_time=0.0, priority=3, treatment_duration=4.0),
            Patient("P-503", "Patient High (t=0)", arrival_time=0.0, priority=2, treatment_duration=5.0),
            Patient("P-504", "Patient Crit (t=0)", arrival_time=0.0, priority=1, treatment_duration=3.0),
        ]

    elif scenario_key == ScenarioType.IDLE_PERIODS:
        # Scenario 6: Wide gaps between arrivals (demonstrating CPU/Doctor Idle Time)
        return [
            Patient("P-601", "Morning Patient", arrival_time=0.0, priority=2, treatment_duration=3.0),    # Busy 0..3, Idle 3..8
            Patient("P-602", "Noon Patient", arrival_time=8.0, priority=1, treatment_duration=4.0),       # Busy 8..12, Idle 12..18
            Patient("P-603", "Evening Patient", arrival_time=18.0, priority=3, treatment_duration=3.0),   # Busy 18..21
        ]

    else:
        raise ValueError(f"Unknown scenario key: {scenario_key}")


SCENARIO_METADATA = {
    ScenarioType.SMALL_ED: {
        "title": "Small Emergency Department",
        "description": "6 patients with balanced arrival times and mixed priorities. Great for a quick walkthrough."
    },
    ScenarioType.BUSY_ED: {
        "title": "Busy Emergency Department",
        "description": "10 patients arriving in rapid succession. Demonstrates high queue accumulation."
    },
    ScenarioType.STARVATION: {
        "title": "Starvation Demonstration",
        "description": "A Low-priority patient arrives first, but continuous Critical/High arrivals cause severe waiting delays."
    },
    ScenarioType.EQUAL_PRIORITY: {
        "title": "Equal Priority (FIFO Behavior)",
        "description": "All patients have Medium priority (3). Demonstrates how Priority scheduling behaves like FCFS when priorities match."
    },
    ScenarioType.SIMULTANEOUS: {
        "title": "Simultaneous Arrivals (t=0)",
        "description": "All patients arrive simultaneously at t=0. Demonstrates immediate strict priority sorting."
    },
    ScenarioType.IDLE_PERIODS: {
        "title": "Idle Periods Between Arrivals",
        "description": "Spaced arrivals with significant gaps. Demonstrates how CPU/Doctor Idle Time and Utilization are calculated."
    }
}
