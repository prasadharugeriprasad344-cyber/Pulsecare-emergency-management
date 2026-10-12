"""
Smart Hospital Emergency Room Management System Using Priority Scheduling
Main Streamlit Application Entrypoint
"""

import streamlit as st
from database.db import init_db
from services.patient_service import PatientService
from simulation.synthetic_data import get_scenario, ScenarioType

# Page modules
from pages.dashboard import render_dashboard
from pages.registration import render_registration
from pages.queue import render_queue
from pages.simulator import render_simulator
from pages.analytics import render_analytics
from pages.aging_demo import render_aging_demo
from pages.history import render_history
from pages.about import render_about


def setup_application():
    """Initializes SQLite schema and seeds initial dataset if empty."""
    init_db()
    existing = PatientService.get_all_patients()
    if not existing:
        PatientService.add_patients_bulk(get_scenario(ScenarioType.SMALL_ED))


def main():
    st.set_page_config(
        page_title="Smart Hospital ER Scheduler",
        page_icon="🏥",
        layout="wide",
        initial_sidebar_state="expanded"
    )

    # Initialize persistence
    setup_application()

    # Styling polish
    st.markdown(
        """
        <style>
        .main-header {
            font-size: 1.8rem;
            font-weight: 700;
            color: #1D3557;
            margin-bottom: 0px;
        }
        .sub-header {
            font-size: 0.95rem;
            color: #457B9D;
            margin-bottom: 20px;
        }
        div[data-testid="stMetricValue"] {
            font-size: 1.8rem;
            color: #1D3557;
        }
        </style>
        """,
        unsafe_allow_html=True
    )

    # Sidebar Navigation
    with st.sidebar:
        st.markdown("### 🏥 ER Management")
        st.caption("Operating Systems Scheduling Simulation")

        nav_selection = st.radio(
            "Navigation Menu",
            [
                "Dashboard",
                "Register Patient",
                "Patient Queue",
                "Scheduling Simulator",
                "Performance Analytics",
                "Starvation & Aging",
                "Simulation History",
                "About the Project"
            ],
            index=0
        )

        st.markdown("---")
        st.markdown("👨‍🏫 **OS Concepts:** Priority Scheduling, FCFS, Non-Preemption, Aging Mechanism.")
        st.caption("v1.0.0 | Academic Course Project")

    # Route to selected page
    if nav_selection == "Dashboard":
        render_dashboard()
    elif nav_selection == "Register Patient":
        render_registration()
    elif nav_selection == "Patient Queue":
        render_queue()
    elif nav_selection == "Scheduling Simulator":
        render_simulator()
    elif nav_selection == "Performance Analytics":
        render_analytics()
    elif nav_selection == "Starvation & Aging":
        render_aging_demo()
    elif nav_selection == "Simulation History":
        render_history()
    elif nav_selection == "About the Project":
        render_about()


if __name__ == "__main__":
    main()
