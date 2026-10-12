# Smart Hospital Emergency Room Management System Using Priority Scheduling

An educational Operating Systems process-scheduling simulation built in Python, Streamlit, SQLite, and Plotly. Demonstrates **CPU/Process Priority Scheduling**, **FCFS comparison**, **Indefinite Starvation**, and **Dynamic Aging**.

---

## 1. Project Overview & OS Concept Mapping

This application models an Emergency Department (ED) triage environment as an operating system process scheduler:

| Operating System Concept | Hospital ER Simulation Counterpart | Meaning / Role |
| :--- | :--- | :--- |
| **Process ($P_i$)** | **Patient** | The unit of work entering the system |
| **CPU / Processor** | **ER Doctor / Operating Room** | Single shared resource executing work |
| **Arrival Time ($AT$)** | **Patient Arrival Time** | The simulation minute when a patient arrives ($t \ge 0$) |
| **Burst Time ($BT$)** | **Treatment Duration** | Time required with the doctor to complete treatment |
| **Priority Level ($P$)** | **Triage Level** | $1 = \text{Critical}$, $2 = \text{High}$, $3 = \text{Medium}$, $4 = \text{Low}$ |
| **Ready Queue** | **ER Waiting Area** | Arrived patients waiting for the doctor |
| **Non-preemptive Execution** | **Uninterrupted Treatment** | Once a doctor begins treating, treatment continues to completion |
| **CPU Idle Time** | **Doctor Idle Time** | Time periods when no patients are in the ER |
| **Starvation (Indefinite Blocking)** | **Low-Priority Delay** | Low-priority patients delayed indefinitely by higher-priority arrivals |
| **Aging Technique** | **Priority Promotion** | Gradually boosting patient priority the longer they wait |

---

## 2. Mathematical Equations

All scheduling calculations strictly adhere to standard OS formulas:

1. **Turnaround Time ($\text{TAT}$):**
   $$\text{TAT} = \text{Completion Time (CT)} - \text{Arrival Time (AT)}$$

2. **Waiting Time ($\text{WT}$):**
   $$\text{WT} = \text{Turnaround Time (TAT)} - \text{Treatment Duration (BT)}$$

3. **Response Time ($\text{RT}$):**
   $$\text{RT} = \text{First Start Time (ST)} - \text{Arrival Time (AT)}$$

4. **Resource / CPU Utilization:**
   $$\text{Utilization (\%)} = \left(\frac{\sum \text{Treatment Durations}}{\text{Total Simulation Elapsed Time}}\right) \times 100\%$$

5. **Dynamic Aging Formula:**
   $$\text{Effective Priority} = \max\left(1, \text{Base Priority} - \left\lfloor \frac{\text{Current Time} - \text{Arrival Time}}{\text{Aging Interval}} \right\rfloor\right)$$

---

## 3. System Architecture & Features

### Modules Included:
- **Module A: Dashboard (`pages/dashboard.py`)**: Real-time KPI metric cards, active registry table, and priority distribution donut charts.
- **Module B: Patient Registration (`pages/registration.py`)**: Validated intake form and preset scenario loader.
- **Module C: Core Schedulers (`scheduling/`)**: Non-preemptive Priority, FCFS, and Aging algorithms.
- **Module D: Interactive Simulator (`pages/simulator.py`)**: Discrete-event step-by-step playback, live Plotly Gantt charts, scheduler decision explanations, and dynamic runtime patient injection.
- **Module E: Performance Analytics (`pages/analytics.py`)**: Side-by-side empirical comparison between Priority Scheduling and FCFS with priority-grouped waiting times.
- **Module F: Starvation & Aging Lab (`pages/aging_demo.py`)**: Interactive demonstration of process starvation and dynamic aging mitigation.
- **Module G: SQLite Persistence & History (`pages/history.py`)**: Relational database storage with CSV dataset export.
- **Module H: Synthetic Data Generator (`simulation/synthetic_data.py`)**: Deterministic reproducible scenario generator.

---

## 4. How to Run Locally

### 1. Clone & Open Project
```powershell
cd "C:\Users\prasa\.gemini\antigravity\scratch\smart_hospital"
```

### 2. Activate Virtual Environment
```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Install Requirements
```powershell
pip install -r requirements.txt
```

### 4. Run Automated Test Suite
```powershell
$env:PYTHONPATH="."
python -m pytest -v
```

### 5. Launch the Streamlit Web Application
```powershell
streamlit run app.py
```
Open **http://localhost:8501** in your browser.

---

## 5. Operating Systems Viva Questions & Answers

1. **Why is smaller integer used for higher priority?**  
   In standard UNIX and educational operating systems (such as nice values and POSIX priorities), priority levels are ranked starting at 0 or 1. Here, Level 1 (Critical) represents highest urgency, and Level 4 represents lowest urgency.

2. **Why does FCFS suffer from the Convoy Effect?**  
   If a process with a large burst time arrives first, all short or urgent processes arriving immediately after must wait behind it, causing high average waiting time.

3. **How does Aging solve Starvation?**  
   In static priority scheduling, low-priority processes can starve if high-priority processes continually enter the ready queue. Aging increments the effective priority of waiting processes proportionally to their waiting time until they reach the front of the queue.
