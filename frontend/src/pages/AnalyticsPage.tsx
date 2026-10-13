import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Zap,
  Clock,
  Activity,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

import { Patient, PRIORITY_CONFIG } from '../types';
import { runPriorityScheduling, runFCFSScheduling } from '../services/scheduler';

interface AnalyticsPageProps {
  patients: Patient[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ patients }) => {
  // Execute both policies deterministically on the exact same dataset
  const prioResult = useMemo(() => runPriorityScheduling(patients), [patients]);
  const fcfsResult = useMemo(() => runFCFSScheduling(patients), [patients]);

  const pMetrics = prioResult.metrics;
  const fMetrics = fcfsResult.metrics;

  // Comparison metrics table
  const comparisonData = [
    {
      metric: 'Average Waiting Time',
      priority: `${pMetrics.avg_waiting_time} min`,
      fcfs: `${fMetrics.avg_waiting_time} min`,
      delta: Number((pMetrics.avg_waiting_time - fMetrics.avg_waiting_time).toFixed(2)),
      winner: pMetrics.avg_waiting_time <= fMetrics.avg_waiting_time ? 'Priority' : 'FCFS',
    },
    {
      metric: 'Average Turnaround Time',
      priority: `${pMetrics.avg_turnaround_time} min`,
      fcfs: `${fMetrics.avg_turnaround_time} min`,
      delta: Number((pMetrics.avg_turnaround_time - fMetrics.avg_turnaround_time).toFixed(2)),
      winner: pMetrics.avg_turnaround_time <= fMetrics.avg_turnaround_time ? 'Priority' : 'FCFS',
    },
    {
      metric: 'Max Waiting Time',
      priority: `${pMetrics.max_waiting_time} min`,
      fcfs: `${fMetrics.max_waiting_time} min`,
      delta: Number((pMetrics.max_waiting_time - fMetrics.max_waiting_time).toFixed(2)),
      winner: pMetrics.max_waiting_time <= fMetrics.max_waiting_time ? 'Priority' : 'FCFS',
    },
    {
      metric: 'Physician Utilization',
      priority: `${pMetrics.resource_utilization}%`,
      fcfs: `${fMetrics.resource_utilization}%`,
      delta: 0,
      winner: 'Identical',
    },
    {
      metric: 'Total Execution Duration',
      priority: `${pMetrics.total_simulation_time} min`,
      fcfs: `${fMetrics.total_simulation_time} min`,
      delta: 0,
      winner: 'Identical',
    },
  ];

  // Grouped wait times by priority level
  const priorityBreakdown = useMemo(() => {
    const data = [
      { priority: 'P1: Critical', Priority: 0, FCFS: 0, count: 0 },
      { priority: 'P2: High', Priority: 0, FCFS: 0, count: 0 },
      { priority: 'P3: Medium', Priority: 0, FCFS: 0, count: 0 },
      { priority: 'P4: Low', Priority: 0, FCFS: 0, count: 0 },
    ];

    patients.forEach((p) => {
      const pWait = prioResult.scheduled.find((s) => s.patient_id === p.patient_id)?.waiting_time || 0;
      const fWait = fcfsResult.scheduled.find((s) => s.patient_id === p.patient_id)?.waiting_time || 0;
      const idx = p.priority - 1;
      data[idx].Priority += pWait;
      data[idx].FCFS += fWait;
      data[idx].count += 1;
    });

    return data.map((d) => ({
      priority: d.priority,
      'Priority Scheduling': d.count ? Number((d.Priority / d.count).toFixed(1)) : 0,
      FCFS: d.count ? Number((d.FCFS / d.count).toFixed(1)) : 0,
    }));
  }, [patients, prioResult, fcfsResult]);

  // Per-patient waiting time comparison
  const perPatientData = useMemo(() => {
    return patients.slice(0, 15).map((p) => {
      const pWait = prioResult.scheduled.find((s) => s.patient_id === p.patient_id)?.waiting_time || 0;
      const fWait = fcfsResult.scheduled.find((s) => s.patient_id === p.patient_id)?.waiting_time || 0;
      return {
        id: p.patient_id,
        'Priority Scheduling': pWait,
        FCFS: fWait,
      };
    });
  }, [patients, prioResult, fcfsResult]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-navy">
          Performance Analytics & Comparative Lab
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Empirical comparison between Non-Preemptive Priority Scheduling and baseline First-Come, First-Served (FCFS).
        </p>
      </div>

      {/* KPI Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-2">
            Average Waiting Time
          </span>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-navy">{pMetrics.avg_waiting_time}m</span>
              <span className="text-xs text-text-secondary block font-semibold">Priority Scheduling</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-text-secondary">{fMetrics.avg_waiting_time}m</span>
              <span className="text-xs text-text-secondary block font-semibold">FCFS Baseline</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border/50 text-xs text-teal-dark font-semibold">
            {pMetrics.avg_waiting_time <= fMetrics.avg_waiting_time
              ? `Priority achieves ${(fMetrics.avg_waiting_time - pMetrics.avg_waiting_time).toFixed(1)}m lower average wait time`
              : `FCFS yields ${(pMetrics.avg_waiting_time - fMetrics.avg_waiting_time).toFixed(1)}m lower overall average wait`}
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-2">
            Average Turnaround Time
          </span>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-navy">{pMetrics.avg_turnaround_time}m</span>
              <span className="text-xs text-text-secondary block font-semibold">Priority Scheduling</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-text-secondary">{fMetrics.avg_turnaround_time}m</span>
              <span className="text-xs text-text-secondary block font-semibold">FCFS Baseline</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border/50 text-xs text-text-secondary">
            Turnaround Time = Completion Time − Arrival Time
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-2">
            Physician / CPU Utilization
          </span>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-teal-medical">{pMetrics.resource_utilization}%</span>
              <span className="text-xs text-text-secondary block font-semibold">Utilization Rate</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-navy">{pMetrics.idle_time}m</span>
              <span className="text-xs text-text-secondary block font-semibold">Idle Resource Gap</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border/50 text-xs text-text-secondary">
            Busy: {pMetrics.busy_time}m / Total: {pMetrics.total_simulation_time}m
          </div>
        </div>
      </div>

      {/* Side-by-Side Summary Table */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-4">
        <h3 className="font-heading font-bold text-base text-navy">
          Detailed Algorithm Benchmark Table
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-background border-b border-border text-[11px] font-bold text-navy uppercase tracking-wider">
                <th className="py-2.5 px-4">Performance Metric</th>
                <th className="py-2.5 px-4">Priority Scheduling</th>
                <th className="py-2.5 px-4">FCFS Baseline</th>
                <th className="py-2.5 px-4">Difference (Delta)</th>
                <th className="py-2.5 px-4 text-right">Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {comparisonData.map((row, idx) => (
                <tr key={idx} className="hover:bg-background/40">
                  <td className="py-3 px-4 font-bold text-navy">{row.metric}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-teal-dark">{row.priority}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-text-secondary">{row.fcfs}</td>
                  <td className="py-3 px-4 font-mono">
                    {row.delta === 0 ? '0.00' : `${row.delta > 0 ? '+' : ''}${row.delta}m`}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-background border border-border text-navy">
                      {row.winner}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparative Charts: Waiting Time by Priority & Per-Patient Waiting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting Time by Priority Chart */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-4">
          <div>
            <h3 className="font-heading font-bold text-base text-navy">
              Average Waiting Time by Priority Level
            </h3>
            <p className="text-xs text-text-secondary">
              Notice how Critical cases wait significantly less under Priority Scheduling
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityBreakdown} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="priority" tick={{ fontSize: 11, fill: '#718096' }} />
                <YAxis tick={{ fontSize: 11, fill: '#718096' }} unit="m" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#15243B', borderRadius: '10px', color: '#FFF', border: 'none', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Priority Scheduling" fill="#12B8A6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="FCFS" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-Patient Wait Times */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-4">
          <div>
            <h3 className="font-heading font-bold text-base text-navy">
              Individual Patient Waiting Time Comparison
            </h3>
            <p className="text-xs text-text-secondary">
              Side-by-side queue delay experienced by individual patients
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perPatientData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="id" tick={{ fontSize: 10, fill: '#718096' }} />
                <YAxis tick={{ fontSize: 11, fill: '#718096' }} unit="m" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#15243B', borderRadius: '10px', color: '#FFF', border: 'none', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Priority Scheduling" fill="#15243B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="FCFS" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* OS Academic Theory Callout */}
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-subtle flex items-start gap-3.5">
        <Info className="w-5 h-5 text-teal-medical shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-heading font-bold text-navy text-sm">
            Operating Systems Academic Evaluation
          </h4>
          <p className="text-text-secondary leading-relaxed">
            While First-Come, First-Served (FCFS) ensures egalitarian fairness by serving strictly in order of arrival time,
            it is vulnerable to the <strong>Convoy Effect</strong>, where an initial lengthy low-priority job holds the CPU and delays life-critical urgent tasks.
            <strong> Non-Preemptive Priority Scheduling</strong> solves this by dispatching the highest-urgency task immediately upon CPU vacancy.
            However, Priority Scheduling introduces the risk of <strong>Starvation</strong>, which is mitigated via dynamic priority aging.
          </p>
        </div>
      </div>
    </div>
  );
};
