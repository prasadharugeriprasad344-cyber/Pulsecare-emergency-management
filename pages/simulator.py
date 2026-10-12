"""
Interactive Scheduling Simulator Page (Module D)
Provides step-by-step playback, real-time Gantt charts, transparent scheduler decision logs,
and dynamic patient injection during simulation execution.
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

from services.patient_service import PatientService
from services.history_service import HistoryService
from simulation.engine import SimulationEngine
from simulation.state import SimulationStatus
from models.patient import Patient, PriorityLevel


def render_simulator():
    st.markdown("## 🕹️ Interactive Scheduling Simulator")
    st.caption("Step through the simulation clock, inspect scheduler decisions, and visualize the Gantt chart in real time.")

    patients = PatientService.get_all_patients()

    if not patients:
        st.warning("No patients loaded. Please register or load synthetic patients first.")
        return

    # Simulation engine stored in Streamlit session state
    if "engine" not in st.session_state or st.session_state.get("engine_patients_hash") != len(patients):
        st.session_state.engine = SimulationEngine(patients, policy="PRIORITY")
        st.session_state.engine_patients_hash = len(patients)

    engine: SimulationEngine = st.session_state.engine

    # Controls Toolbar
    col_pol, col_step, col_run, col_reset = st.columns([2, 1, 1, 1])

    with col_pol:
        policy_choice = st.selectbox(
            "Scheduling Policy",
            ["PRIORITY", "FCFS", "PRIORITY_AGING"],
            index=["PRIORITY", "FCFS", "PRIORITY_AGING"].index(engine.policy),
            key="sim_policy_select"
        )
        if policy_choice != engine.policy:
            engine.policy = policy_choice
            engine.state.policy = policy_choice
            engine.reset()
            st.rerun()

    with col_step:
        st.write("")
        st.write("")
        if st.button("⏩ Step Forward", use_container_width=True, disabled=engine.state.is_finished):
            engine.step()
            st.rerun()

    with col_run:
        st.write("")
        st.write("")
        if st.button("▶️ Run to End", use_container_width=True, disabled=engine.state.is_finished):
            engine.run_all()
            st.rerun()

    with col_reset:
        st.write("")
        st.write("")
        if st.button("🔄 Reset", use_container_width=True):
            engine.reset()
            st.rerun()

    st.markdown("---")

    # Current Live Status Indicators
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.metric("Simulation Clock", f"t = {engine.state.current_time:.1f} min")
    with c2:
        status_label = "Finished" if engine.state.is_finished else ("Treating" if engine.state.active_patient else "Idle / Ready")
        st.metric("Status", status_label)
    with c3:
        st.metric("Waiting in Queue", f"{len(engine.state.ready_queue)}")
    with c4:
        st.metric("Completed", f"{len(engine.state.completed_patients)} / {len(patients)}")

    # Doctor Treatment Room Status
    st.subheader("👨‍⚕️ Treatment Room (Single CPU Resource)")
    if engine.state.active_patient:
        act_p = engine.state.active_patient
        col = PriorityLevel(act_p.priority).color
        lbl = PriorityLevel(act_p.priority).label
        progress_val = min(1.0, max(0.0, (engine.state.current_time - engine.state.active_start_time) / act_p.treatment_duration)) if act_p.treatment_duration > 0 else 1.0

        st.markdown(
            f"""
            <div style="background-color: #EBF2FA; border: 2px solid {col}; padding: 15px; border-radius: 8px;">
                <h4 style="margin: 0; color: #1D3557;">Currently Treating: {act_p.patient_id} — {act_p.name}</h4>
                <p style="margin: 5px 0 0 0; color: #333;">
                    <strong>Priority:</strong> <span style="color: {col}; font-weight: bold;">Level {act_p.priority} ({lbl})</span> &nbsp;|&nbsp; 
                    <strong>Started:</strong> t={engine.state.active_start_time:.1f}m &nbsp;|&nbsp; 
                    <strong>Finishes at:</strong> t={engine.state.active_completion_time:.1f}m
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )
    else:
        if engine.state.is_finished:
            st.success("🎉 All admitted patients have completed treatment!")
        else:
            st.info("Doctor is currently IDLE waiting for patient selection or next arrival.")

    # Live Gantt Chart
    st.markdown("---")
    st.subheader("📈 Scheduling Timeline (Gantt Chart)")

    if engine.state.timeline:
        gantt_records = []
        for b in engine.state.timeline:
            color = "#6C757D" if b.is_idle else (PriorityLevel(b.priority).color if b.priority else "#457B9D")
            gantt_records.append({
                "Task": "Doctor 1",
                "Start": b.start_time,
                "End": b.end_time,
                "Duration": b.duration,
                "Label": b.label,
                "Type": "Idle" if b.is_idle else f"Priority {b.priority}",
                "Color": color
            })
        df_gantt = pd.DataFrame(gantt_records)

        fig = px.bar(
            df_gantt,
            base="Start",
            x="Duration",
            y="Task",
            color="Type",
            text="Label",
            orientation="h",
            color_discrete_map={
                "Priority 1": "#E63946",
                "Priority 2": "#F4A261",
                "Priority 3": "#2A9D8F",
                "Priority 4": "#457B9D",
                "Idle": "#ADB5BD"
            }
        )
        fig.update_layout(
            xaxis_title="Simulation Time (minutes)",
            yaxis_title="",
            height=200,
            margin=dict(t=20, b=20, l=10, r=10),
            showlegend=True
        )
        fig.update_traces(textposition='inside', insidetextanchor='middle')
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.write("*Click 'Step Forward' or 'Run to End' to generate timeline blocks.*")

    # Decision Log & Dynamic Admission Side-by-Side
    col_log, col_inject = st.columns([3, 2])

    with col_log:
        st.subheader("📜 Scheduler Decision Explanation Log")
        log_text = "\n".join(reversed(engine.state.decision_log[-12:])) if engine.state.decision_log else "No logs yet."
        st.text_area("Recent Decisions (Newest on Top)", value=log_text, height=200, disabled=True)

    with col_inject:
        st.subheader("⚡ Dynamic Patient Injection")
        st.caption("Admit a patient while the simulation is actively executing.")
        with st.form("dyn_patient_form"):
            dyn_id = st.text_input("Patient ID", value=f"DYN-{len(patients)+1:02d}")
            dyn_name = st.text_input("Name", value="Urgent Influx (Synthetic)")
            dyn_prio = st.selectbox(
                "Priority",
                [1, 2, 3, 4],
                format_func=lambda x: f"{x} - {PriorityLevel(x).label}"
            )
            dyn_dur = st.number_input("Duration (min)", min_value=1.0, value=4.0, step=0.5)
            dyn_submitted = st.form_submit_button("🚑 Inject Patient Now")

            if dyn_submitted:
                new_p = Patient(
                    patient_id=dyn_id,
                    name=dyn_name,
                    arrival_time=engine.state.current_time,
                    priority=dyn_prio,
                    treatment_duration=dyn_dur
                )
                engine.add_patient_dynamically(new_p)
                st.success(f"Injected {new_p.patient_id} into running simulation!")
                st.rerun()

    # Save Results to History Button
    if engine.state.is_finished and engine.state.completed_patients:
        st.markdown("---")
        if st.button("💾 Save Simulation Run to History Database", type="primary"):
            sim_id = f"SIM-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
            HistoryService.save_simulation(
                simulation_id=sim_id,
                policy=engine.policy,
                metrics=engine.get_metrics(),
                results=engine.state.completed_patients,
                aging_interval=engine.aging_interval
            )
            st.success(f"Simulation saved to permanent history with ID: {sim_id}")
