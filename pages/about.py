"""
About & Educational OS Guide Page
Explains the OS theory, formulas, system architecture, and common viva examination questions.
"""

import streamlit as st


def render_about():
    st.markdown("## 📖 About the Project & OS Theory Guide")
    st.caption("Educational reference guide linking the Hospital Emergency Room simulation to Operating Systems principles.")

    st.markdown(
        """
        ### 1. Course Assignment Overview
        - **Course:** Operating Systems (3rd Semester CS/IT)
        - **Project Title:** Smart Hospital Emergency Room Management System Using Priority Scheduling
        - **Core Concept:** CPU Process Scheduling with Priority Queue & Dynamic Aging

        ---

        ### 2. Operating Systems Mapping Table
        | Operating System Concept | Hospital ER Counterpart | Description |
        | :--- | :--- | :--- |
        | **Process ($P_i$)** | Patient | The unit of computational work |
        | **CPU / Processor** | ER Doctor / OR | The single shared execution resource |
        | **Arrival Time ($AT$)** | Patient Arrival Time | Minute at which process enters Ready Queue |
        | **Burst Time ($BT$)** | Treatment Duration | Time required on CPU to finish execution |
        | **Priority Level ($P$)** | Triage Priority | 1 (Critical) to 4 (Low). Lower integer = higher priority |
        | **Ready Queue** | ER Waiting Room | Set of processes that have arrived and are awaiting CPU |
        | **Non-preemptive Execution** | Uninterrupted Treatment | Once assigned to CPU, process runs until completion |
        | **Starvation (Indefinite Blocking)** | Low Priority Delay | Continuous high-priority arrivals prevent low-priority from running |
        | **Aging Technique** | Priority Escalation | Increasing process priority as waiting time grows |

        ---

        ### 3. Core Scheduling Equations
        1. **Turnaround Time ($\text{TAT}$):**
           $$\\text{TAT} = \\text{Completion Time (CT)} - \\text{Arrival Time (AT)}$$
        2. **Waiting Time ($\text{WT}$):**
           $$\\text{WT} = \\text{Turnaround Time (TAT)} - \\text{Treatment Duration (BT)}$$
        3. **Response Time ($\text{RT}$):**
           $$\\text{RT} = \\text{First Start Time (ST)} - \\text{Arrival Time (AT)}$$
        4. **Doctor / CPU Utilization:**
           $$\\text{Utilization} = \\left(\\frac{\\sum \\text{Treatment Durations}}{\\text{Total Simulation Elapsed Time}}\\right) \\times 100\\%$$

        ---

        ### 4. Key OS Viva Questions & Answers
        1. **Q: Why is non-preemptive priority scheduling used here instead of preemptive?**  
           *A:* In our hospital analogy, once an emergency surgery or treatment begins, the doctor cannot leave the patient mid-procedure (uninterrupted burst). In OS, non-preemptive scheduling is simpler and avoids the overhead of saving and restoring register context state.

        2. **Q: How does Priority Scheduling solve the Convoy Effect observed in FCFS?**  
           *A:* In FCFS, a long low-priority process arriving at $t=0$ forces all subsequent short or urgent processes to wait behind it. Priority scheduling allows critical processes to jump ahead in the ready queue regardless of later arrival.

        3. **Q: What is Starvation, and how does Aging prevent it?**  
           *A:* Starvation occurs when a low-priority process waits indefinitely because higher-priority processes continually enter the ready queue. Aging gradually increments the process's priority based on its waiting time in the queue until it becomes the highest-priority process.
        """
    )
