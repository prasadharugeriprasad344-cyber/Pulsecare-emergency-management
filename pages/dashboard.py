"""
Dashboard Page (Module A)
Hospital Operations Control Center displaying real-time patient metrics,
active triage queue status, and recent activity.
"""

import streamlit as st
import pandas as pd
import plotly.express as px
from services.patient_service import PatientService
from models.patient import PriorityLevel
from scheduling.priority import schedule_priority


def render_dashboard():
    st.markdown("## 🏥 Hospital ER Operations Dashboard")
    st.caption("Live monitoring of patient arrivals, treatment capacity, and scheduling throughput.")

    patients = PatientService.get_all_patients()
    
    if not patients:
        st.info("No patients currently registered in the ER system. Go to **Register Patient** to admit patients or load a synthetic scenario.")
        return

    # Calculate baseline schedule metrics
    scheduled, timeline, metrics = schedule_priority(patients)

    # Top KPI Metrics Row
    c1, c2, c3, c4, c5 = st.columns(5)
    with c1:
        st.metric("Total Patients", f"{len(patients)}")
    with c2:
        st.metric("Avg Waiting Time", f"{metrics['avg_waiting_time']} min")
    with c3:
        st.metric("Avg Turnaround", f"{metrics['avg_turnaround_time']} min")
    with c4:
        st.metric("Max Wait Time", f"{metrics['max_waiting_time']} min")
    with c5:
        st.metric("Doctor Utilization", f"{metrics['resource_utilization']}%")

    st.markdown("---")

    col_left, col_right = st.columns([3, 2])

    with col_left:
        st.subheader("📋 Registered Patient Registry")
        table_data = []
        for p in patients:
            table_data.append({
                "Patient ID": p.patient_id,
                "Name": p.name,
                "Arrival Time (m)": p.arrival_time,
                "Priority Level": f"{p.priority} - {PriorityLevel(p.priority).label}",
                "Duration (m)": p.treatment_duration
            })
        df_display = pd.DataFrame(table_data)
        st.dataframe(df_display, use_container_width=True, hide_index=True)

    with col_right:
        st.subheader("📊 Priority Distribution")
        prio_counts = {PriorityLevel(i).label: 0 for i in (1, 2, 3, 4)}
        for p in patients:
            prio_counts[PriorityLevel(p.priority).label] += 1
        
        df_prio = pd.DataFrame(list(prio_counts.items()), columns=["Priority", "Count"])
        fig_donut = px.pie(
            df_prio,
            names="Priority",
            values="Count",
            hole=0.45,
            color="Priority",
            color_discrete_map={
                "Critical": "#E63946",
                "High": "#F4A261",
                "Medium": "#2A9D8F",
                "Low": "#457B9D"
            }
        )
        fig_donut.update_layout(margin=dict(t=10, b=10, l=10, r=10), height=260)
        st.plotly_chart(fig_donut, use_container_width=True)

    st.markdown("---")
    st.subheader("⚡ Scheduling Execution Overview (Non-Preemptive Priority)")
    res_df = pd.DataFrame([p.to_dict() for p in scheduled])
    if not res_df.empty:
        st.dataframe(
            res_df[["patient_id", "name", "arrival_time", "priority", "treatment_duration", "start_time", "completion_time", "waiting_time", "turnaround_time"]].rename(columns={
                "patient_id": "Patient ID",
                "name": "Name",
                "arrival_time": "Arrival (m)",
                "priority": "Priority",
                "treatment_duration": "Duration (m)",
                "start_time": "Start (m)",
                "completion_time": "End (m)",
                "waiting_time": "Wait (m)",
                "turnaround_time": "Turnaround (m)"
            }),
            use_container_width=True,
            hide_index=True
        )
