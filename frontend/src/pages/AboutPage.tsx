import React from 'react';
import {
  Info,
  BookOpen,
  GraduationCap,
  Layers,
  HelpCircle,
  Code2,
  Cpu,
  CheckCircle2
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-navy">
          Settings & Operating Systems Reference Guide
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Complete academic documentation, Operating Systems theoretical mapping, and lab viva preparation.
        </p>
      </div>

      {/* Project Overview Card */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-teal-medical" />
          <h2 className="font-heading font-bold text-lg text-navy">
            Academic Project Specification
          </h2>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          <strong>PulseCare — Smart Emergency Operations</strong> is a 3rd-Semester Operating Systems Course Project.
          It models process scheduling in an emergency medical center, mapping processes to patients and the CPU to an ER trauma surgeon.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="px-3 py-1 rounded-full bg-background border border-border text-xs font-semibold text-navy">
            Course: Operating Systems (CS 301)
          </span>
          <span className="px-3 py-1 rounded-full bg-background border border-border text-xs font-semibold text-navy">
            Algorithm: Non-Preemptive Priority Scheduling
          </span>
          <span className="px-3 py-1 rounded-full bg-background border border-border text-xs font-semibold text-navy">
            Comparison: First-Come, First-Served (FCFS)
          </span>
          <span className="px-3 py-1 rounded-full bg-background border border-border text-xs font-semibold text-navy">
            Mitigation: Dynamic Priority Aging
          </span>
        </div>
      </div>

      {/* Operating Systems Analogy Mapping Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-heading font-bold text-base text-navy flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-medical" />
            <span>Operating Systems ↔ Emergency Department Conceptual Mapping</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-background border-b border-border text-[11px] font-bold text-navy uppercase tracking-wider">
                <th className="py-3 px-4">Operating Systems Concept</th>
                <th className="py-3 px-4">Hospital ER Analogy</th>
                <th className="py-3 px-4">Technical Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 px-4 font-bold text-navy">Process (P_i)</td>
                <td className="py-3 px-4 font-semibold text-teal-dark">Admitted Patient</td>
                <td className="py-3 px-4 text-text-secondary">The fundamental unit of computational work entering the system.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-navy">CPU / Single Core</td>
                <td className="py-3 px-4 font-semibold text-teal-dark">Physician / Operating Room</td>
                <td className="py-3 px-4 text-text-secondary">The single shared execution resource that can only serve one entity at a time.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-navy">Arrival Time (AT)</td>
                <td className="py-3 px-4 font-semibold text-teal-dark">Arrival Clock</td>
                <td className="py-3 px-4 text-text-secondary">The timestamp when the process enters the Ready Queue.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-navy">Burst Time (BT)</td>
                <td className="py-3 px-4 font-semibold text-teal-dark">Treatment Duration</td>
                <td className="py-3 px-4 text-text-secondary">The total CPU time required to finish executing the task.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-navy">Priority Value</td>
                <td className="py-3 px-4 font-semibold text-teal-dark">Triage Priority (1 to 4)</td>
                <td className="py-3 px-4 text-text-secondary">Numerical rank where lower integer = higher urgency (Level 1: Critical).</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-navy">Ready Queue</td>
                <td className="py-3 px-4 font-semibold text-teal-dark">ER Waiting Room</td>
                <td className="py-3 px-4 text-text-secondary">Queue of processes that have arrived and are awaiting CPU dispatch.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-navy">Non-Preemption</td>
                <td className="py-3 px-4 font-semibold text-teal-dark">Uninterrupted Treatment</td>
                <td className="py-3 px-4 text-text-secondary">Once a process claims the CPU, it runs uninterrupted until completion.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-navy">CPU Idle Time</td>
                <td className="py-3 px-4 font-semibold text-teal-dark">Physician Idle Gap</td>
                <td className="py-3 px-4 text-text-secondary">Periods when the ready queue is completely empty between job arrivals.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-navy">Starvation</td>
                <td className="py-3 px-4 font-semibold text-teal-dark">Indefinite Patient Delay</td>
                <td className="py-3 px-4 text-text-secondary">Low-priority processes delayed indefinitely by high-priority arrivals.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-navy">Aging</td>
                <td className="py-3 px-4 font-semibold text-teal-dark">Dynamic Priority Promotion</td>
                <td className="py-3 px-4 text-text-secondary">Incrementing effective priority over time to guarantee execution.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mathematical Scheduling Formulas */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-4">
        <h3 className="font-heading font-bold text-base text-navy flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal-medical" />
          <span>Core Scheduling Equations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-background border border-border space-y-1.5 font-mono">
            <span className="text-[11px] font-bold text-navy block font-sans">1. Turnaround Time (TAT)</span>
            <div className="text-teal-dark font-extrabold text-sm">TAT = Completion Time − Arrival Time</div>
            <p className="text-[11px] text-text-secondary font-sans">Total elapsed time from job entry to discharge.</p>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border space-y-1.5 font-mono">
            <span className="text-[11px] font-bold text-navy block font-sans">2. Waiting Time (WT)</span>
            <div className="text-teal-dark font-extrabold text-sm">WT = Turnaround Time − Treatment Duration</div>
            <p className="text-[11px] text-text-secondary font-sans">Time spent waiting in the ready queue.</p>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border space-y-1.5 font-mono">
            <span className="text-[11px] font-bold text-navy block font-sans">3. Response Time (RT)</span>
            <div className="text-teal-dark font-extrabold text-sm">RT = First Start Time − Arrival Time</div>
            <p className="text-[11px] text-text-secondary font-sans">In non-preemptive scheduling, Response Time ≡ Waiting Time.</p>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border space-y-1.5 font-mono">
            <span className="text-[11px] font-bold text-navy block font-sans">4. Physician / CPU Utilization</span>
            <div className="text-teal-dark font-extrabold text-sm">Utilization = (Busy Time / Total Time) × 100%</div>
            <p className="text-[11px] text-text-secondary font-sans">Percentage of total elapsed time the physician was treating patients.</p>
          </div>
        </div>
      </div>

      {/* Lab Viva Questions & Model Answers */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-4">
        <h3 className="font-heading font-bold text-base text-navy flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-teal-medical" />
          <span>Frequently Asked Operating Systems Viva Questions</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
            <span className="font-bold text-navy block">
              Q1: Why does lower numerical value represent higher priority?
            </span>
            <p className="text-text-secondary leading-relaxed">
              In UNIX systems (e.g. POSIX and nice values), lower values represent higher priority. In this application, Level 1 (Critical) is the highest priority and Level 4 (Low) is the lowest.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
            <span className="font-bold text-navy block">
              Q2: What is the Convoy Effect in FCFS scheduling?
            </span>
            <p className="text-text-secondary leading-relaxed">
              When a process with a large burst time arrives first, all subsequent short or urgent processes must wait behind it, causing high average waiting times. Priority scheduling prevents this for critical tasks.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
            <span className="font-bold text-navy block">
              Q3: What is Starvation, and how does Aging solve it?
            </span>
            <p className="text-text-secondary leading-relaxed">
              Starvation occurs when a low-priority process is indefinitely delayed because higher-priority processes keep arriving. Aging solves this by boosting the process's effective priority proportionally to its waiting time.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
            <span className="font-bold text-navy block">
              Q4: Why was Non-Preemptive scheduling chosen for the hospital model?
            </span>
            <p className="text-text-secondary leading-relaxed">
              Once an emergency surgery or treatment procedure begins, the physician cannot abandon the patient mid-surgery (uninterrupted burst). In OS, non-preemptive scheduling also avoids the overhead of saving and restoring register state.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
