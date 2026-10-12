"""
Simulation History Page (Module G)
Allows reviewing past simulation runs stored in SQLite and exporting execution data to CSV.
"""

import streamlit as st
import pandas as pd
from services.history_service import HistoryService


def render_history():
    st.markdown("## 📜 Simulation History & Export")
    st.caption("Inspect persisted simulation sessions, review timeline logs, and export datasets to CSV.")

    sims = HistoryService.get_all_simulations()

    if not sims:
        st.info("No past simulations stored yet. Run a simulation in the **Scheduling Simulator** and click 'Save Simulation Run'.")
        return

    df_sims = pd.DataFrame(sims)
    st.subheader("Saved Simulation Runs")
    st.dataframe(
        df_sims[[
            "simulation_id", "policy", "total_patients", "total_simulation_time",
            "resource_utilization", "avg_waiting_time", "avg_turnaround_time", "created_at"
        ]].rename(columns={
            "simulation_id": "Simulation ID",
            "policy": "Policy",
            "total_patients": "Patients",
            "total_simulation_time": "Total Time (m)",
            "resource_utilization": "Doctor Util (%)",
            "avg_waiting_time": "Avg WT (m)",
            "avg_turnaround_time": "Avg TAT (m)",
            "created_at": "Timestamp"
        }),
        use_container_width=True,
        hide_index=True
    )

    st.markdown("---")
    st.subheader("🔍 Inspect Simulation Run Details")

    selected_id = st.selectbox("Select Simulation ID to inspect:", options=[s["simulation_id"] for s in sims])

    if selected_id:
        results = HistoryService.get_simulation_results(selected_id)
        df_res = pd.DataFrame(results)

        if not df_res.empty:
            st.dataframe(
                df_res[[
                    "patient_id", "patient_name", "arrival_time", "priority",
                    "effective_priority", "treatment_duration", "start_time",
                    "completion_time", "waiting_time", "turnaround_time"
                ]],
                use_container_width=True,
                hide_index=True
            )

            # CSV Download Button
            csv_data = df_res.to_csv(index=False).encode('utf-8')
            st.download_button(
                label="📥 Export This Run as CSV",
                data=csv_data,
                file_name=f"{selected_id}_results.csv",
                mime="text/csv"
            )

            # Delete Run Option
            if st.button("🗑️ Delete This Simulation Record", type="secondary"):
                HistoryService.delete_simulation(selected_id)
                st.warning(f"Deleted {selected_id} from database.")
                st.rerun()
