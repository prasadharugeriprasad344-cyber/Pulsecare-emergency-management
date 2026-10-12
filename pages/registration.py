"""
Patient Registration Page (Module B & H)
Allows manual patient intake with validation, as well as synthetic scenario generation.
"""

import streamlit as st
from services.patient_service import PatientService
from models.patient import Patient, PriorityLevel
from simulation.synthetic_data import (
    generate_synthetic_patients,
    get_scenario,
    ScenarioType,
    SCENARIO_METADATA
)


def render_registration():
    st.markdown("## 📝 Patient Admission & Intake")
    st.caption("Register individual patients or populate standard educational benchmark scenarios.")

    tab1, tab2, tab3 = st.columns([1, 1, 1])

    mode = st.radio(
        "Choose Intake Mode:",
        ["Manual Registration", "Load Educational Scenario", "Generate Custom Synthetic Batch"],
        horizontal=True
    )

    st.markdown("---")

    if mode == "Manual Registration":
        st.subheader("Single Patient Admission Form")
        next_id = PatientService.get_next_patient_id()

        with st.form("manual_patient_form"):
            col1, col2 = st.columns(2)
            with col1:
                pid = st.text_input("Patient ID (Unique)", value=next_id)
                name = st.text_input("Patient Name / Identifier", value="Jane Doe (Synthetic)")
                arrival_time = st.number_input("Arrival Time (Simulation Minutes)", min_value=0.0, value=0.0, step=0.5)

            with col2:
                priority_choice = st.selectbox(
                    "Triage Priority Level (Lower # = Higher Priority)",
                    options=[1, 2, 3, 4],
                    format_func=lambda x: f"{x} - {PriorityLevel(x).label}"
                )
                duration = st.number_input("Treatment Duration (Doctor Minutes)", min_value=0.5, value=4.0, step=0.5)

            submitted = st.form_submit_button("🏥 Admit Patient to ER", use_container_width=True)

            if submitted:
                try:
                    patient = Patient(
                        patient_id=pid.strip(),
                        name=name.strip(),
                        arrival_time=float(arrival_time),
                        priority=int(priority_choice),
                        treatment_duration=float(duration)
                    )
                    PatientService.add_patient(patient)
                    st.success(f"Patient {patient.patient_id} ({patient.name}) admitted successfully!")
                    st.rerun()
                except Exception as e:
                    st.error(f"Validation Error: {str(e)}")

    elif mode == "Load Educational Scenario":
        st.subheader("Load Curated Educational Scenarios")
        st.write("These standard scenarios demonstrate specific Operating Systems scheduling dynamics:")

        scenario_options = {
            ScenarioType.SMALL_ED: "Scenario 1: Small Emergency Department (6 Patients)",
            ScenarioType.BUSY_ED: "Scenario 2: Busy Emergency Department (10 Patients)",
            ScenarioType.STARVATION: "Scenario 3: Starvation Demo (Continuous High Priority)",
            ScenarioType.EQUAL_PRIORITY: "Scenario 4: Equal Priority (FIFO Tie-Breaker)",
            ScenarioType.SIMULTANEOUS: "Scenario 5: Simultaneous Arrivals at t=0",
            ScenarioType.IDLE_PERIODS: "Scenario 6: Spaced Arrivals (CPU Idle Periods)"
        }

        selected_key = st.selectbox(
            "Select Scenario:",
            options=list(scenario_options.keys()),
            format_func=lambda k: scenario_options[k]
        )

        st.info(SCENARIO_METADATA[selected_key]["description"])

        preview_patients = get_scenario(selected_key)
        st.write(f"**Preview ({len(preview_patients)} patients):**")
        st.dataframe([p.to_dict() for p in preview_patients], use_container_width=True, hide_index=True)

        if st.button("🚀 Load This Scenario into Database", type="primary", use_container_width=True):
            PatientService.clear_all_patients()
            PatientService.add_patients_bulk(preview_patients)
            st.success(f"Loaded '{scenario_options[selected_key]}' into the active database!")
            st.rerun()

    elif mode == "Generate Custom Synthetic Batch":
        st.subheader("Synthetic Random Data Generator")
        st.caption("Generate a randomized but reproducible synthetic patient arrival cohort.")

        col1, col2 = st.columns(2)
        with col1:
            count = st.slider("Number of Patients", min_value=3, max_value=30, value=8)
            arrival_span = st.slider("Arrival Span (Minutes)", min_value=5.0, max_value=60.0, value=25.0)
            seed = st.number_input("Random Seed (for Deterministic Reproducibility)", value=42, step=1)
        with col2:
            min_dur = st.number_input("Min Treatment Duration", min_value=1.0, value=3.0, step=0.5)
            max_dur = st.number_input("Max Treatment Duration", min_value=2.0, value=8.0, step=0.5)

        if st.button("🎲 Generate & Load Batch", use_container_width=True):
            synth_patients = generate_synthetic_patients(
                count=count,
                arrival_span=arrival_span,
                min_duration=min_dur,
                max_duration=max_dur,
                seed=int(seed)
            )
            PatientService.clear_all_patients()
            PatientService.add_patients_bulk(synth_patients)
            st.success(f"Generated and loaded {len(synth_patients)} synthetic patients with seed {seed}!")
            st.rerun()

    st.markdown("---")
    st.subheader("Database Management")
    c_clear, c_space = st.columns([1, 3])
    with c_clear:
        if st.button("🗑️ Clear All Patients", type="secondary"):
            PatientService.clear_all_patients()
            st.warning("All patient records cleared from database.")
            st.rerun()
