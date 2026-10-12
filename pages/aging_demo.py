"""
Starvation and Aging Lab (Module F)
Demonstrates indefinite blocking (starvation) in priority queues and evaluates
how dynamic aging solves the problem by boosting priority over time.
"""

import streamlit as st
import pandas as pd
import plotly.express as px

from simulation.synthetic_data import get_scenario, ScenarioType
from scheduling.priority import schedule_priority
from scheduling.aging import schedule_priority_with_aging


def render_aging_demo():
    st.markdown("## ⏳ Starvation & Dynamic Aging Lab")
    st.caption("Investigate the classic OS problem of process starvation and see how aging prevents indefinite blocking.")

    st.markdown(
        """
        > [!IMPORTANT]
        > **The Operating Systems Starvation Problem:**
        > In standard Priority Scheduling, a low-priority process can be left waiting indefinitely in the Ready Queue
        > if a continuous stream of higher-priority processes enters the system.
        > **The Solution (Aging):** Gradually increasing the priority of processes that wait in the system for a long time.
        """
    )

    col_ctrl1, col_ctrl2 = st.columns([1, 1])
    with col_ctrl1:
        aging_interval = st.slider(
            "Aging Interval (Minutes of Waiting per Priority Promotion)",
            min_value=2.0,
            max_value=20.0,
            value=6.0,
            step=1.0,
            help="Every X minutes waiting in queue, priority increases by 1 level (e.g. Level 4 -> Level 3)."
        )
    with col_ctrl2:
        st.write("")
        st.write("")
        st.write("Using the standard **Continuous High-Priority Arrivals** benchmark scenario.")

    # Load standard starvation test dataset
    starvation_patients = get_scenario(ScenarioType.STARVATION)

    st.subheader("Patient Cohort in Starvation Scenario")
    st.dataframe([p.to_dict() for p in starvation_patients], use_container_width=True, hide_index=True)

    # Run both algorithms
    pure_prio_sched, pure_timeline, pure_metrics = schedule_priority(starvation_patients)
    aging_sched, aging_timeline, aging_metrics = schedule_priority_with_aging(starvation_patients, aging_interval)

    # Focus specifically on the low-priority patient (Delayed David)
    low_p_pure = next(p for p in pure_prio_sched if p.priority == 4)
    low_p_aging = next(p for p in aging_sched if p.priority == 4)

    st.markdown("---")
    st.subheader("🎯 Impact on the Low-Priority Patient (P-301: Delayed David)")

    c1, c2, c3 = st.columns(3)
    with c1:
        st.metric("Without Aging Wait Time", f"{low_p_pure.waiting_time:.1f} min")
    with c2:
        st.metric("With Aging Wait Time", f"{low_p_aging.waiting_time:.1f} min", delta=f"{low_p_aging.waiting_time - low_p_pure.waiting_time:.1f} min")
    with c3:
        st.metric("Effective Priority Promoted To", f"Level {low_p_aging.effective_priority}")

    # Comparative Gantt Charts
    st.markdown("---")
    st.subheader("Visual Gantt Comparison")

    tab1, tab2 = st.tabs(["Pure Priority (Starvation Observed)", f"Priority with Aging (Interval = {aging_interval}m)"])

    with tab1:
        df_pure_g = pd.DataFrame([{
            "Task": "Doctor",
            "Start": b.start_time,
            "Duration": b.duration,
            "Label": b.label,
            "Type": "Idle" if b.is_idle else f"Priority {b.priority}"
        } for b in pure_timeline])
        fig1 = px.bar(
            df_pure_g, base="Start", x="Duration", y="Task", color="Type", text="Label", orientation="h",
            color_discrete_map={"Priority 1": "#E63946", "Priority 2": "#F4A261", "Priority 4": "#457B9D", "Idle": "#ADB5BD"}
        )
        fig1.update_layout(height=180, margin=dict(t=10, b=10, l=10, r=10))
        st.plotly_chart(fig1, use_container_width=True)
        st.caption("Notice that P-301 (Blue) is pushed all the way to the end despite arriving at t=0!")

    with tab2:
        df_aging_g = pd.DataFrame([{
            "Task": "Doctor",
            "Start": b.start_time,
            "Duration": b.duration,
            "Label": b.label,
            "Type": "Idle" if b.is_idle else f"Effective Priority {b.priority}"
        } for b in aging_timeline])
        fig2 = px.bar(
            df_aging_g, base="Start", x="Duration", y="Task", color="Type", text="Label", orientation="h",
            color_discrete_map={"Effective Priority 1": "#E63946", "Effective Priority 2": "#F4A261", "Effective Priority 3": "#2A9D8F", "Effective Priority 4": "#457B9D"}
        )
        fig2.update_layout(height=180, margin=dict(t=10, b=10, l=10, r=10))
        st.plotly_chart(fig2, use_container_width=True)
        st.caption("With Aging, P-301's effective priority was promoted to a higher level, allowing it to be serviced earlier!")
