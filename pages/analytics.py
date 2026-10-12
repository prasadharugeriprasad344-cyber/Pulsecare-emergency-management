"""
Performance Analytics Page (Module E)
Calculates and visualizes comparative performance between Priority Scheduling and FCFS,
displaying waiting time distributions, turnaround times, and doctor utilization.
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from services.patient_service import PatientService
from scheduling.priority import schedule_priority
from scheduling.fcfs import schedule_fcfs
from models.patient import PriorityLevel


def render_analytics():
    st.markdown("## 📊 Performance Analytics & Algorithm Comparison")
    st.caption("Empirical evaluation of Non-Preemptive Priority Scheduling versus baseline First-Come, First-Served (FCFS).")

    patients = PatientService.get_all_patients()
    if not patients:
        st.warning("No patients loaded. Please register or generate patients first.")
        return

    # Execute both policies on the exact same patient cohort
    prio_sched, prio_timeline, prio_metrics = schedule_priority(patients)
    fcfs_sched, fcfs_timeline, fcfs_metrics = schedule_fcfs(patients)

    # Top-level Comparative Metrics
    st.subheader("1. Comparative Summary Metrics")
    comp_df = pd.DataFrame([
        {
            "Policy": "Priority Scheduling",
            "Avg Waiting Time (m)": prio_metrics["avg_waiting_time"],
            "Avg Turnaround Time (m)": prio_metrics["avg_turnaround_time"],
            "Max Waiting Time (m)": prio_metrics["max_waiting_time"],
            "Doctor Utilization (%)": prio_metrics["resource_utilization"],
            "Total Time (m)": prio_metrics["total_simulation_time"]
        },
        {
            "Policy": "FCFS (First-Come, First-Served)",
            "Avg Waiting Time (m)": fcfs_metrics["avg_waiting_time"],
            "Avg Turnaround Time (m)": fcfs_metrics["avg_turnaround_time"],
            "Max Waiting Time (m)": fcfs_metrics["max_waiting_time"],
            "Doctor Utilization (%)": fcfs_metrics["resource_utilization"],
            "Total Time (m)": fcfs_metrics["total_simulation_time"]
        }
    ])
    st.dataframe(comp_df, use_container_width=True, hide_index=True)

    st.markdown("---")

    # Waiting Time by Priority Level
    st.subheader("2. Waiting Time Breakdown by Priority Level")
    st.caption("Demonstrates how Priority Scheduling prioritizes critical cases compared to FCFS.")

    # Group waiting times by priority
    prio_records = []
    for p in prio_sched:
        prio_records.append({
            "Patient": p.patient_id,
            "Priority": f"P{p.priority} ({PriorityLevel(p.priority).label})",
            "Priority_Num": p.priority,
            "Priority Scheduling WT": p.waiting_time,
            "FCFS WT": next(f.waiting_time for f in fcfs_sched if f.patient_id == p.patient_id)
        })
    df_prio_comp = pd.DataFrame(prio_records)

    df_prio_avg = df_prio_comp.groupby("Priority")[["Priority Scheduling WT", "FCFS WT"]].mean().reset_index()

    fig_bar = px.bar(
        df_prio_avg,
        x="Priority",
        y=["Priority Scheduling WT", "FCFS WT"],
        barmode="group",
        title="Average Waiting Time by Priority Level (Minutes)",
        labels={"value": "Avg Waiting Time (min)", "variable": "Policy"},
        color_discrete_map={
            "Priority Scheduling WT": "#1D3557",
            "FCFS WT": "#E63946"
        }
    )
    fig_bar.update_layout(height=350, margin=dict(t=40, b=20, l=10, r=10))
    st.plotly_chart(fig_bar, use_container_width=True)

    st.markdown("---")

    # Per-Patient Waiting & Turnaround Times
    st.subheader("3. Individual Patient Waiting Times")
    fig_patient = px.bar(
        df_prio_comp,
        x="Patient",
        y=["Priority Scheduling WT", "FCFS WT"],
        barmode="group",
        title="Per-Patient Waiting Time Comparison",
        labels={"value": "Waiting Time (min)", "variable": "Policy"},
        color_discrete_map={
            "Priority Scheduling WT": "#457B9D",
            "FCFS WT": "#F4A261"
        }
    )
    fig_patient.update_layout(height=350, margin=dict(t=40, b=20, l=10, r=10))
    st.plotly_chart(fig_patient, use_container_width=True)

    st.markdown("---")

    # OS Theoretical Insights Callout
    st.markdown(
        """
        > [!NOTE]
        > **Operating Systems Academic Analysis:**
        > - **Priority Scheduling** drastically reduces waiting time for high-urgency tasks (Level 1 & 2), ensuring life-critical processes receive immediate CPU allocation.
        > - **FCFS** offers equal fairness in order of arrival, but results in severe delays when long low-priority jobs arrive just before urgent jobs (the *Convoy Effect*).
        > - Notice that total execution time and doctor utilization remain identical if both schedules experience the same idle gaps, but the *distribution of waiting time* differs significantly.
        """
    )
