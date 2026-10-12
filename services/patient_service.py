"""
Patient Service
Handles persistence and CRUD operations for registered patients using SQLite.
"""

from typing import List, Optional
import sqlite3
from database.db import get_db_connection
from models.patient import Patient


class PatientService:
    @staticmethod
    def add_patient(patient: Patient, db_path: Optional[str] = None) -> None:
        """Inserts a single validated patient into the database."""
        patient.validate()
        conn = get_db_connection(db_path)
        try:
            with conn:
                conn.execute(
                    """
                    INSERT INTO patients (patient_id, name, arrival_time, priority, treatment_duration)
                    VALUES (?, ?, ?, ?, ?);
                    """,
                    (patient.patient_id, patient.name, patient.arrival_time, patient.priority, patient.treatment_duration)
                )
        except sqlite3.IntegrityError as e:
            if "UNIQUE" in str(e) or "PRIMARY KEY" in str(e):
                raise ValueError(f"Patient ID '{patient.patient_id}' already exists.")
            raise e
        finally:
            conn.close()

    @staticmethod
    def add_patients_bulk(patients: List[Patient], db_path: Optional[str] = None) -> int:
        """Inserts a list of patients in a single transaction."""
        for p in patients:
            p.validate()

        conn = get_db_connection(db_path)
        inserted = 0
        try:
            with conn:
                cursor = conn.cursor()
                for p in patients:
                    cursor.execute(
                        """
                        INSERT OR REPLACE INTO patients (patient_id, name, arrival_time, priority, treatment_duration)
                        VALUES (?, ?, ?, ?, ?);
                        """,
                        (p.patient_id, p.name, p.arrival_time, p.priority, p.treatment_duration)
                    )
                    inserted += 1
            return inserted
        finally:
            conn.close()

    @staticmethod
    def get_all_patients(db_path: Optional[str] = None) -> List[Patient]:
        """Retrieves all patients ordered by arrival time."""
        conn = get_db_connection(db_path)
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM patients ORDER BY arrival_time ASC, patient_id ASC;")
            rows = cursor.fetchall()
            return [
                Patient(
                    patient_id=row["patient_id"],
                    name=row["name"],
                    arrival_time=float(row["arrival_time"]),
                    priority=int(row["priority"]),
                    treatment_duration=float(row["treatment_duration"]),
                    created_at=row["created_at"]
                )
                for row in rows
            ]
        finally:
            conn.close()

    @staticmethod
    def delete_patient(patient_id: str, db_path: Optional[str] = None) -> bool:
        """Deletes a patient by patient_id."""
        conn = get_db_connection(db_path)
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM patients WHERE patient_id = ?;", (patient_id,))
                return cursor.rowcount > 0
        finally:
            conn.close()

    @staticmethod
    def clear_all_patients(db_path: Optional[str] = None) -> None:
        """Deletes all patient records."""
        conn = get_db_connection(db_path)
        try:
            with conn:
                conn.execute("DELETE FROM patients;")
        finally:
            conn.close()

    @staticmethod
    def get_next_patient_id(db_path: Optional[str] = None) -> str:
        """Generates the next sequential patient ID (e.g., P-001)."""
        conn = get_db_connection(db_path)
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) AS total FROM patients;")
            count = cursor.fetchone()["total"]
            return f"P-{count + 1:03d}"
        finally:
            conn.close()
