import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Trash2,
  Calendar,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { SimulationHistoryRecord } from '../types';
import { ApiService } from '../services/api';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<SimulationHistoryRecord[]>([]);
  const [selectedRun, setSelectedRun] = useState<SimulationHistoryRecord | null>(null);

  const loadHistory = async () => {
    const list = await ApiService.getHistory();
    setHistory(list);
    if (list.length > 0 && !selectedRun) {
      setSelectedRun(list[0]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm(`Delete simulation run ${id}?`)) {
      await ApiService.deleteHistory(id);
      await loadHistory();
      if (selectedRun?.simulation_id === id) {
        setSelectedRun(null);
      }
    }
  };

  const handleExportCSV = (record: SimulationHistoryRecord) => {
    // Generate CSV content
    const headers = [
      'Simulation_ID',
      'Policy',
      'Total_Patients',
      'Total_Time',
      'Idle_Time',
      'Resource_Utilization_Pct',
      'Avg_Waiting_Time',
      'Avg_Turnaround_Time',
      'Timestamp'
    ];
    const row = [
      record.simulation_id,
      record.policy,
      record.total_patients,
      record.total_simulation_time,
      record.idle_time,
      record.resource_utilization,
      record.avg_waiting_time,
      record.avg_turnaround_time,
      record.created_at
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${record.simulation_id}_summary.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-navy">
          Simulation History & CSV Exports
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Review persisted simulation runs, inspect metrics, and export data files.
        </p>
      </div>

      {/* History Runs List */}
      <div className="bg-surface rounded-2xl border border-border shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-navy flex items-center gap-2">
            <History className="w-4 h-4 text-teal-medical" />
            <span>Persisted Simulation Runs ({history.length})</span>
          </h3>
          <span className="text-xs text-text-muted">SQLite & Local Cache</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-background border-b border-border text-[11px] font-bold text-navy uppercase tracking-wider">
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Policy</th>
                <th className="py-3 px-4">Cohort Size</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Avg Wait</th>
                <th className="py-3 px-4">Avg Turnaround</th>
                <th className="py-3 px-4">Physician Util</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((item) => (
                <tr
                  key={item.simulation_id}
                  className={`hover:bg-background/60 transition-colors cursor-pointer
                    ${selectedRun?.simulation_id === item.simulation_id ? 'bg-teal-soft/20' : ''}
                  `}
                  onClick={() => setSelectedRun(item)}
                >
                  <td className="py-3 px-4 font-mono font-bold text-navy">
                    {item.simulation_id}
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-background border border-border text-[10px] font-bold text-navy">
                      {item.policy}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-navy">
                    {item.total_patients} patients
                  </td>
                  <td className="py-3 px-4 text-text-secondary font-mono">
                    {item.total_simulation_time}m
                  </td>
                  <td className="py-3 px-4 text-teal-dark font-mono font-semibold">
                    {item.avg_waiting_time}m
                  </td>
                  <td className="py-3 px-4 text-text-secondary font-mono">
                    {item.avg_turnaround_time}m
                  </td>
                  <td className="py-3 px-4 text-navy font-semibold">
                    {item.resource_utilization}%
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleExportCSV(item)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-teal-dark hover:bg-teal-soft transition-colors"
                        title="Download CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.simulation_id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-priority-critical hover:bg-red-50 transition-colors"
                        title="Delete Run"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {history.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-secondary">
                    <History className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-navy">No simulation runs saved yet.</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Run a simulation in the "Scheduling Simulator" tab and click "Save Run".
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Run Details Spotlight */}
      {selectedRun && (
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-navy">
                Run Summary: {selectedRun.simulation_id}
              </h3>
              <p className="text-xs text-text-secondary">
                Executed on {new Date(selectedRun.created_at).toLocaleString()} with {selectedRun.policy} policy
              </p>
            </div>
            <button
              onClick={() => handleExportCSV(selectedRun)}
              className="px-3.5 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-light flex items-center gap-2 shadow-subtle"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-medical" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-text-muted block text-[10px]">Cohort Size</span>
              <span className="text-base font-bold text-navy">{selectedRun.total_patients} Patients</span>
            </div>
            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-text-muted block text-[10px]">Physician Utilization</span>
              <span className="text-base font-bold text-teal-dark">{selectedRun.resource_utilization}%</span>
            </div>
            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-text-muted block text-[10px]">Avg Waiting Time</span>
              <span className="text-base font-bold text-navy">{selectedRun.avg_waiting_time} min</span>
            </div>
            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-text-muted block text-[10px]">Avg Turnaround Time</span>
              <span className="text-base font-bold text-navy">{selectedRun.avg_turnaround_time} min</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
