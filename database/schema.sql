-- ============================================================================
-- Smart Hospital Emergency Room Management System (Priority Scheduling)
-- SQLite Database Schema
-- ============================================================================

-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- Table: patients
-- Stores patient master records available for scheduling
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    patient_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    arrival_time REAL NOT NULL CHECK (arrival_time >= 0),
    priority INTEGER NOT NULL CHECK (priority IN (1, 2, 3, 4)),
    treatment_duration REAL NOT NULL CHECK (treatment_duration > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index to optimize querying patients by arrival order
CREATE INDEX IF NOT EXISTS idx_patients_arrival ON patients(arrival_time);

-- ----------------------------------------------------------------------------
-- Table: simulations
-- Stores summary metrics and configurations for completed simulation runs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS simulations (
    simulation_id TEXT PRIMARY KEY,
    policy TEXT NOT NULL CHECK (policy IN ('PRIORITY', 'FCFS', 'PRIORITY_AGING')),
    aging_interval REAL DEFAULT NULL,
    total_patients INTEGER NOT NULL CHECK (total_patients >= 0),
    total_simulation_time REAL NOT NULL CHECK (total_simulation_time >= 0),
    idle_time REAL NOT NULL CHECK (idle_time >= 0),
    resource_utilization REAL NOT NULL CHECK (resource_utilization >= 0 AND resource_utilization <= 100),
    avg_waiting_time REAL NOT NULL CHECK (avg_waiting_time >= 0),
    avg_turnaround_time REAL NOT NULL CHECK (avg_turnaround_time >= 0),
    avg_response_time REAL NOT NULL CHECK (avg_response_time >= 0),
    max_waiting_time REAL NOT NULL CHECK (max_waiting_time >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for ordering simulation history by time
CREATE INDEX IF NOT EXISTS idx_sim_created ON simulations(created_at);

-- ----------------------------------------------------------------------------
-- Table: simulation_results
-- Stores individual patient schedule timelines for each completed simulation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS simulation_results (
    result_id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id TEXT NOT NULL REFERENCES simulations(simulation_id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    arrival_time REAL NOT NULL,
    priority INTEGER NOT NULL CHECK (priority IN (1, 2, 3, 4)),
    effective_priority INTEGER DEFAULT NULL,
    treatment_duration REAL NOT NULL CHECK (treatment_duration > 0),
    start_time REAL NOT NULL CHECK (start_time >= arrival_time),
    completion_time REAL NOT NULL CHECK (completion_time >= start_time),
    waiting_time REAL NOT NULL CHECK (waiting_time >= 0),
    turnaround_time REAL NOT NULL CHECK (turnaround_time >= treatment_duration),
    response_time REAL NOT NULL CHECK (response_time >= 0)
);

-- Index to rapidly fetch results by simulation run
CREATE INDEX IF NOT EXISTS idx_sim_results_sim_id ON simulation_results(simulation_id);
