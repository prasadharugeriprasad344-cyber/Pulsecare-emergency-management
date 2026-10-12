"""
Patient Queue Page
Visual representation of the ER triage waiting room and ready queue ordering.
"""

import streamlit as st
import pandas as pd
from services.patient_service import PatientService
from models.patient import PriorityLevel


def render_queue():
    st.markdown("## 👥 Emergency Room Triage & Waiting Queue")
    st.caption("Inspect the active queue ordering. Higher priority patients (smaller number) are served first.")

    patients = PatientService.get_all_patients()

    if not patients:
        st.info("The waiting room is currently empty. Please register or generate patients.")
        return

    # Sort in ready queue priority order: Priority ascending (1..4), then arrival_time ascending
    queue_sorted = sorted(patients, key=lambda p: (p.priority, p.arrival_time, p.patient_id))

    st.subheader(f"Waiting Room Queue ({len(queue_sorted)} Patients in System)")

    # Render clean cards for each patient
    for idx, p in enumerate(queue_sorted, start=1):
        color = PriorityLevel(p.priority).color
        label = PriorityLevel(p.priority).label
        
        with st.container():
            st.markdown(
                f"""
                <div style="border-left: 6px solid {color}; background-color: #F8F9FA; padding: 12px 18px; margin-bottom: 10px; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-weight: 700; font-size: 1.1em; color: #1D3557;">#{idx} &nbsp; {p.patient_id} — {p.name}</span>
                            <span style="margin-left: 12px; background-color: {color}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.8em; font-weight: 600;">
                                Priority {p.priority}: {label}
                            </span>
                        </div>
                        <div style="text-align: right; color: #495057; font-size: 0.9em;">
                            <strong>Arrival:</strong> t={p.arrival_time}m &nbsp;|&nbsp; <strong>Duration:</strong> {p.treatment_duration}m
                        </div>
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )

    st.markdown("---")
    st.caption("ℹ️ **OS Principle:** When multiple processes are in the Ready Queue, the Priority Scheduler selects the process with the smallest priority value (Level 1: Critical). Ties are broken by FIFO (earliest arrival time).")
