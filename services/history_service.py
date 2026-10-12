"""
Simulation History Service
Handles database persistence and CSV export for completed simulation runs and per-patient timelines.
"""

from typing import List, Dict, Any, Optional
import sqlite3
import pandas as pd
from database.db import get_db_connection
from models.patient import ScheduledPatient


class HistoryService:
    @staticmethod
    def save_simulation(
        simulation_id: str,
        policy: str,
        metrics: Dict[str, float],
        results: List[ScheduledPatient],
        aging_interval: Optional[float] = None,
        db_path: Optional[str] = None
    ) -> str:
        """
        Persists a completed simulation header and its individual patient timeline records
        within a single atomic transaction.
        """
        conn = get_db_connection(db_path)
        try:
            with conn:
                # 1. Insert header record into simulations table
                conn.execute(
                    """
                    INSERT INTO simulations (
                        simulation_id, policy, aging_interval, total_patients,
                        total_simulation_time, idle_time, resource_utilization,
                        avg_waiting_time, avg_turnaround_time, avg_response_time,
                        max_waiting_time
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """,
                    (
                        simulation_id,
                        policy,
                        aging_interval,
                        metrics.get("total_patients", len(results)),
                        metrics.get("total_simulation_time", 0.0),
                        metrics.get("idle_time", 0.0),
                        metrics.get("resource_utilization", 0.0),
                        metrics.get("avg_waiting_time", 0.0),
                        metrics.get("avg_turnaround_time", 0.0),
                        metrics.get("avg_response_time", 0.0),
                        metrics.get("max_waiting_time", 0.0)
                    )
                )

                # 2. Insert detail rows into simulation_results table
                cursor = conn.cursor()
                for p in results:
                    cursor.execute(
                        """
                        INSERT INTO simulation_results (
                            simulation_id, patient_id, patient_name, arrival_time,
                            priority, effective_priority, treatment_duration,
                            start_time, completion_time, waiting_time, turnaround_time, response_time
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                        """,
                        (
                            simulation_id,
                            p.patient_id,
                            p.name,
                            p.arrival_time,
                            p.priority,
                            p.effective_priority,
                            p.treatment_duration,
                            p.start_time,
                            p.completion_time,
                            p.waiting_time,
                            p.turnaround_time,
                            p.response_time
                        )
                    )
            return simulation_id
        finally:
            conn.close()

    @staticmethod
    def get_all_simulations(db_path: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns all simulation header records ordered by newest first."""
        conn = get_db_connection(db_path)
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM simulations ORDER BY created_at DESC;")
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()

    @staticmethod
    def get_simulation_results(simulation_id: str, db_path: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns the timeline records for a specific simulation."""
        conn = get_db_connection(db_path)
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM simulation_results WHERE simulation_id = ? ORDER BY start_time ASC;",
                (simulation_id,)
            )
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()

    @staticmethod
    def delete_simulation(simulation_id: str, db_path: Optional[str] = None) -> bool:
        """Deletes a simulation and cascades to its results."""
        conn = get_db_connection(db_path)
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM simulations WHERE simulation_id = ?;", (simulation_id,))
                return cursor.rowcount > 0
        finally:
            conn.close()

    @staticmethod
    def export_to_dataframe(simulation_id: str, db_path: Optional[str] = None) -> pd.DataFrame:
        """Exports simulation results as a Pandas DataFrame for CSV download."""
        results = HistoryService.get_simulation_results(simulation_id, db_path)
        if not results:
            return pd.DataFrame()
        return pd.DataFrame(results)
