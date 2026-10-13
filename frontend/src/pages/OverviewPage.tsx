import React, { useMemo } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  Hourglass,
  Activity,
  Flame,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

import { MetricCard } from '../components/MetricCard';
import { Patient, ScheduledPatient, TimelineBlock, SimulationMetrics, ActivityEvent, PRIORITY_CONFIG } from '../types';

interface OverviewPageProps {
  patients: Patient[];
  scheduledPatients: ScheduledPatient[];
  timeline: TimelineBlock[];
  metrics: SimulationMetrics;
  activities: ActivityEvent[];
  setCurrentTab: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  patients,
  scheduledPatients,
  timeline,
  metrics,
  activities,
  setCurrentTab,
}) => {
  // Priority counts for Donut Chart
  const priorityDistribution = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    patients.forEach((p) => {
      counts[p.priority] = (counts[p.priority] || 0) + 1;
    });
    return [
      { name: 'Critical', value: counts[1], color: PRIORITY_CONFIG[1].color },
      { name: 'High', value: counts[2], color: PRIORITY_CONFIG[2].color },
      { name: 'Medium', value: counts[3], color: PRIORITY_CONFIG[3].color },
      { name: 'Low', value: counts[4], color: PRIORITY_CONFIG[4].color },
    ].filter((item) => item.value > 0);
  }, [patients]);

  // Arrivals over time (grouped into buckets)
  const arrivalsData = useMemo(() => {
    if (patients.length === 0) return [];
    const sorted = [...patients].sort((a, b) => a.arrival_time - b.arrival_time);
    let cumulative = 0;
    return sorted.map((p) => {
      cumulative += 1;
      return {
        time: `t=${p.arrival_time}m`,
        timeNum: p.arrival_time,
        arrivals: cumulative,
        patient: p.patient_id,
      };
    });
  }, [patients]);

  // Waiting vs Completed per Priority
  const waitingVsCompletedData = useMemo(() => {
    const data = [
      { priority: 'Critical', waiting: 0, completed: 0 },
      { priority: 'High', waiting: 0, completed: 0 },
      { priority: 'Medium', waiting: 0, completed: 0 },
      { priority: 'Low', waiting: 0, completed: 0 },
    ];
    patients.forEach((p) => {
      const isCompleted = scheduledPatients.some((s) => s.patient_id === p.patient_id);
      const cat = p.priority === 1 ? 0 : p.priority === 2 ? 1 : p.priority === 3 ? 2 : 3;
      if (isCompleted) {
        data[cat].completed += 1;
      } else {
        data[cat].waiting += 1;
      }
    });
    return data;
  }, [patients, scheduledPatients]);

  // Average Waiting Time by Priority
  const avgWaitByPriority = useMemo(() => {
    const totals: Record<number, { sum: number; count: number }> = { 1: { sum: 0, count: 0 }, 2: { sum: 0, count: 0 }, 3: { sum: 0, count: 0 }, 4: { sum: 0, count: 0 } };
    scheduledPatients.forEach((p) => {
      totals[p.priority].sum += p.waiting_time;
      totals[p.priority].count += 1;
    });

    return [
      { name: 'P1: Critical', waitTime: totals[1].count ? Number((totals[1].sum / totals[1].count).toFixed(1)) : 0, fill: PRIORITY_CONFIG[1].color },
      { name: 'P2: High', waitTime: totals[2].count ? Number((totals[2].sum / totals[2].count).toFixed(1)) : 0, fill: PRIORITY_CONFIG[2].color },
      { name: 'P3: Medium', waitTime: totals[3].count ? Number((totals[3].sum / totals[3].count).toFixed(1)) : 0, fill: PRIORITY_CONFIG[3].color },
      { name: 'P4: Low', waitTime: totals[4].count ? Number((totals[4].sum / totals[4].count).toFixed(1)) : 0, fill: PRIORITY_CONFIG[4].color },
    ];
  }, [scheduledPatients]);

  const currentlyInTreatment = useMemo(() => {
    // If simulator has active block
    return scheduledPatients.length > 0 && scheduledPatients.length < patients.length ? 1 : 0;
  }, [patients, scheduledPatients]);

  const completedCount = scheduledPatients.length;
  const waitingCount = Math.max(0, patients.length - completedCount);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-navy">
            Emergency Operations Center
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Monitor patient flow, treatment queues, and scheduling performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('registration')}
            className="px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-semibold text-navy hover:bg-background transition-colors shadow-subtle"
          >
            + Admit Patient
          </button>
          <button
            onClick={() => setCurrentTab('simulator')}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-light transition-colors shadow-subtle flex items-center gap-1.5"
          >
            <span>Live Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6 Core Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          title="Total Registered"
          value={patients.length}
          subtitle="All admitted patients"
          icon={Users}
          iconColor="text-navy"
          iconBg="bg-slate-100"
        />
        <MetricCard
          title="Waiting in Queue"
          value={waitingCount}
          subtitle="Pending physician"
          icon={Hourglass}
          iconColor="text-priority-high"
          iconBg="bg-amber-50"
        />
        <MetricCard
          title="In Treatment"
          value={currentlyInTreatment}
          subtitle="Physician active"
          icon={Activity}
          iconColor="text-teal-medical"
          iconBg="bg-teal-soft"
        />
        <MetricCard
          title="Completed"
          value={completedCount}
          subtitle="Discharged / resolved"
          icon={CheckCircle2}
          iconColor="text-priority-low"
          iconBg="bg-green-50"
        />
        <MetricCard
          title="Avg Wait Time"
          value={metrics.avg_waiting_time}
          unit="min"
          subtitle="Ready queue duration"
          icon={Clock}
          iconColor="text-teal-medical"
          iconBg="bg-teal-soft"
        />
        <MetricCard
          title="Avg Turnaround"
          value={metrics.avg_turnaround_time}
          unit="min"
          subtitle="Arrival to discharge"
          icon={TrendingUp}
          iconColor="text-navy"
          iconBg="bg-blue-50"
        />
      </div>

      {/* Row 2: Charts (Arrivals Area Chart & Priority Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Arrivals over Time */}
        <div className="lg:col-span-2 bg-surface rounded-2xl p-5 border border-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-navy">
                Cumulative Patient Arrivals (Timeline)
              </h3>
              <p className="text-xs text-text-secondary">Arrival time distribution in simulation minutes</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-background border border-border text-navy">
              Arrival Model
            </span>
          </div>

          <div className="h-64 w-full">
            {arrivalsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={arrivalsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="arrivalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#12B8A6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#12B8A6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#718096' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#718096' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#15243B', borderRadius: '10px', color: '#FFF', border: 'none', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="arrivals" stroke="#12B8A6" strokeWidth={2.5} fillOpacity={1} fill="url(#arrivalGrad)" name="Total Arrived" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-secondary">
                No patient arrival data available.
              </div>
            )}
          </div>
        </div>

        {/* Priority Distribution Donut */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="font-heading font-bold text-base text-navy">
              Priority Triage Breakdown
            </h3>
            <p className="text-xs text-text-secondary">Admitted cohort distribution</p>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            {priorityDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {priorityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#15243B', borderRadius: '10px', color: '#FFF', border: 'none', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-text-secondary">No patients registered.</div>
            )}

            {priorityDistribution.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-heading font-extrabold text-navy leading-none">
                  {patients.length}
                </span>
                <span className="text-[10px] text-text-secondary font-medium">Patients</span>
              </div>
            )}
          </div>

          {/* Legend chips */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
            {Object.entries(PRIORITY_CONFIG).map(([level, cfg]) => {
              const count = patients.filter((p) => p.priority === Number(level)).length;
              return (
                <div key={level} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                  <span className="text-text-secondary text-[11px] truncate">{cfg.label}:</span>
                  <span className="font-bold text-navy ml-auto">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Waiting Time by Priority & Waiting vs Completed Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting Time by Priority */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle">
          <div className="mb-4">
            <h3 className="font-heading font-bold text-base text-navy">
              Average Waiting Time by Priority
            </h3>
            <p className="text-xs text-text-secondary">
              Validates that Critical (P1) cases receive minimal delay under Priority Scheduling
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgWaitByPriority} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#718096' }} unit="m" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#172033', fontWeight: 500 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} min`, 'Avg Wait']}
                  contentStyle={{ backgroundColor: '#15243B', borderRadius: '10px', color: '#FFF', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="waitTime" radius={[0, 6, 6, 0]}>
                  {avgWaitByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waiting vs Completed Bar Chart */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle">
          <div className="mb-4">
            <h3 className="font-heading font-bold text-base text-navy">
              Patient Queue Progression
            </h3>
            <p className="text-xs text-text-secondary">Waiting in triage queue vs finished treatment</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waitingVsCompletedData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="priority" tick={{ fontSize: 11, fill: '#718096' }} />
                <YAxis tick={{ fontSize: 11, fill: '#718096' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#15243B', borderRadius: '10px', color: '#FFF', border: 'none', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="waiting" name="Waiting" fill="#F97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#12B8A6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Treatment Timeline (Gantt-Style) & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gantt Timeline Bar */}
        <div className="lg:col-span-2 bg-surface rounded-2xl p-5 border border-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-navy">
                Treatment Execution Timeline (Gantt Overview)
              </h3>
              <p className="text-xs text-text-secondary">Chronological CPU/Doctor allocation intervals</p>
            </div>
            <button
              onClick={() => setCurrentTab('simulator')}
              className="text-xs font-semibold text-teal-medical hover:underline flex items-center gap-1"
            >
              Interactive Player <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {timeline.length > 0 ? (
            <div className="space-y-3">
              {/* Gantt Strip */}
              <div className="w-full h-11 bg-background rounded-xl p-1 flex items-center gap-1 border border-border overflow-x-auto">
                {timeline.map((block, idx) => {
                  const widthPercent = Math.max(8, (block.duration / (metrics.total_simulation_time || 1)) * 100);
                  const color = block.is_idle
                    ? '#94A3B8'
                    : block.priority
                    ? PRIORITY_CONFIG[block.priority].color
                    : '#12B8A6';

                  return (
                    <div
                      key={idx}
                      className="h-full rounded-lg text-[10px] font-bold text-white flex items-center justify-center px-1.5 shrink-0 transition-transform hover:scale-105 cursor-pointer shadow-subtle"
                      style={{
                        backgroundColor: color,
                        flexGrow: block.duration,
                        minWidth: '55px',
                      }}
                      title={`${block.label} | ${block.start_time}m - ${block.end_time}m (${block.duration}m)`}
                    >
                      <span className="truncate">{block.label.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-text-secondary pt-1 font-mono">
                <span>t = 0.0m</span>
                <span className="text-teal-dark font-semibold">Doctor Busy: {metrics.busy_time}m</span>
                <span className="text-amber-700 font-semibold">Idle: {metrics.idle_time}m</span>
                <span>t = {metrics.total_simulation_time}m</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-text-secondary">
              No simulation timeline generated yet. Click "Run Simulator" to execute scheduling.
            </div>
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-base text-navy">
              Live Operations Feed
            </h3>
            <span className="w-2 h-2 rounded-full bg-teal-medical animate-ping" />
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {activities.slice(0, 6).map((item) => (
              <div key={item.id} className="p-2.5 rounded-xl bg-background border border-border/70 text-xs flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-teal-medical mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy truncate">{item.title}</span>
                    <span className="text-[10px] text-text-muted shrink-0">{item.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">{item.description}</p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-center py-6 text-xs text-text-secondary">
                No recent activity recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
