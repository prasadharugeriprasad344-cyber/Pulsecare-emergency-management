import React, { useState, useMemo } from 'react';
import {
  Hourglass,
  Sliders,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2
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
} from 'recharts';

import { Patient, PRIORITY_CONFIG } from '../types';
import { PRESET_SCENARIOS } from '../services/api';
import { runPriorityScheduling, runAgingScheduling } from '../services/scheduler';

export const StarvationPage: React.FC = () => {
  const [agingInterval, setAgingInterval] = useState<number>(5.0);

  // Standard Starvation scenario patients
  const starvationPatients = useMemo(() => PRESET_SCENARIOS.starvation.patients, []);

  // Run pure Priority (Starvation exists) vs Priority with Aging
  const pureResult = useMemo(() => runPriorityScheduling(starvationPatients), [starvationPatients]);
  const agingResult = useMemo(() => runAgingScheduling(starvationPatients, agingInterval), [starvationPatients, agingInterval]);

  // Target low-priority patient (Delayed David: P-301)
  const davidPure = pureResult.scheduled.find((p) => p.priority === 4);
  const davidAging = agingResult.scheduled.find((p) => p.priority === 4);

  // Comparative data for chart
  const comparisonData = useMemo(() => {
    return starvationPatients.map((p) => {
      const pureP = pureResult.scheduled.find((s) => s.patient_id === p.patient_id);
      const agingP = agingResult.scheduled.find((s) => s.patient_id === p.patient_id);
      return {
        id: p.patient_id,
        name: p.name.split(' ')[0],
        priority: `P${p.priority}`,
        'Without Aging': pureP ? pureP.waiting_time : 0,
        'With Dynamic Aging': agingP ? agingP.waiting_time : 0,
      };
    });
  }, [starvationPatients, pureResult, agingResult]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-navy">
          Starvation & Dynamic Aging Laboratory
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Investigate indefinite process blocking (starvation) in priority queues and evaluate aging mitigation.
        </p>
      </div>

      {/* Explanatory Banner */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3.5 shadow-subtle">
        <ShieldAlert className="w-5 h-5 text-priority-high shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-heading font-bold text-sm text-amber-950">
            The Operating Systems Starvation Phenomenon
          </h4>
          <p className="text-amber-900 leading-relaxed">
            In standard Priority Scheduling, if a steady stream of higher-priority processes enters the ready queue,
            a lower-priority process can be delayed indefinitely (<strong>Indefinite Blocking / Starvation</strong>).
            <strong> Aging</strong> is a mitigation technique that gradually increments the effective scheduling priority of processes
            as their waiting time in the queue increases.
          </p>
        </div>
      </div>

      {/* Interactive Aging Interval Slider */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-base text-navy flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-medical" />
              <span>Configure Aging Rate</span>
            </h3>
            <p className="text-xs text-text-secondary">
              Every <strong>{agingInterval} minutes</strong> waiting in queue promotes priority by 1 level (e.g., P4 → P3 → P2 → P1).
            </p>
          </div>
          <span className="font-mono font-extrabold text-lg text-teal-dark bg-teal-soft px-3 py-1 rounded-xl">
            Interval: {agingInterval.toFixed(1)}m
          </span>
        </div>

        <input
          type="range"
          min="2"
          max="15"
          step="0.5"
          value={agingInterval}
          onChange={(e) => setAgingInterval(parseFloat(e.target.value))}
          className="w-full accent-teal-medical h-2 bg-background rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[11px] text-text-muted font-mono">
          <span>Aggressive Aging (2.0 min)</span>
          <span>Moderate (8.0 min)</span>
          <span>Slow Aging (15.0 min)</span>
        </div>
      </div>

      {/* Spotlight on the Starved Patient */}
      {davidPure && davidAging && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">
              Low-Priority Target Patient
            </span>
            <span className="text-lg font-heading font-extrabold text-navy">
              {davidPure.patient_id} ({davidPure.name})
            </span>
            <div className="mt-2 text-xs text-text-secondary">
              Arrived at <strong>t = {davidPure.arrival_time}m</strong> with Base Priority 4 (Low).
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">
              Waiting Time WITHOUT Aging
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-priority-critical">
                {davidPure.waiting_time}m
              </span>
              <span className="text-xs text-text-muted">starved by 5 higher priority arrivals</span>
            </div>
            <div className="mt-2 text-xs text-priority-critical font-semibold">
              Dispatched LAST despite arriving first!
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">
              Waiting Time WITH Aging ({agingInterval}m)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-priority-low">
                {davidAging.waiting_time}m
              </span>
              <span className="text-xs text-green-700 font-bold">
                ({(davidPure.waiting_time - davidAging.waiting_time).toFixed(1)}m reduction!)
              </span>
            </div>
            <div className="mt-2 text-xs text-teal-dark font-semibold">
              Effective Priority promoted to: <strong>Level {davidAging.effective_priority}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-4">
        <div>
          <h3 className="font-heading font-bold text-base text-navy">
            Per-Patient Waiting Time: Pure Priority vs. Aging-Enhanced
          </h3>
          <p className="text-xs text-text-secondary">
            Notice the drastic drop in wait time for P-301 when Aging is enabled
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <XAxis dataKey="id" tick={{ fontSize: 11, fill: '#718096' }} />
              <YAxis tick={{ fontSize: 11, fill: '#718096' }} unit="m" />
              <Tooltip
                contentStyle={{ backgroundColor: '#15243B', borderRadius: '10px', color: '#FFF', border: 'none', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Without Aging" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="With Dynamic Aging" fill="#12B8A6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Timeline Gantt Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pure Timeline */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle space-y-3">
          <h4 className="font-heading font-bold text-sm text-navy">
            Pure Priority Gantt (Starvation Evident)
          </h4>
          <div className="w-full h-10 bg-background rounded-xl p-1 flex items-center gap-1 border border-border overflow-x-auto">
            {pureResult.timeline.map((b, i) => (
              <div
                key={i}
                className="h-full rounded-md text-[10px] font-bold text-white flex items-center justify-center px-2 shrink-0"
                style={{
                  backgroundColor: b.priority ? PRIORITY_CONFIG[b.priority].color : '#94A3B8',
                  flexGrow: b.duration,
                  minWidth: '45px',
                }}
                title={`${b.label}: ${b.duration}m`}
              >
                {b.label.split(' ')[0]}
              </div>
            ))}
          </div>
          <span className="text-[11px] text-priority-critical block font-semibold">
            P-301 (Blue) is forced to wait until all other treatments finish.
          </span>
        </div>

        {/* Aging Timeline */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle space-y-3">
          <h4 className="font-heading font-bold text-sm text-navy">
            Aging-Enhanced Gantt (Starvation Prevented)
          </h4>
          <div className="w-full h-10 bg-background rounded-xl p-1 flex items-center gap-1 border border-border overflow-x-auto">
            {agingResult.timeline.map((b, i) => (
              <div
                key={i}
                className="h-full rounded-md text-[10px] font-bold text-white flex items-center justify-center px-2 shrink-0"
                style={{
                  backgroundColor: b.priority ? PRIORITY_CONFIG[b.priority].color : '#94A3B8',
                  flexGrow: b.duration,
                  minWidth: '45px',
                }}
                title={`${b.label}: ${b.duration}m`}
              >
                {b.label.split(' ')[0]}
              </div>
            ))}
          </div>
          <span className="text-[11px] text-teal-dark block font-semibold">
            P-301 advances in the queue and completes treatment much earlier.
          </span>
        </div>
      </div>
    </div>
  );
};
