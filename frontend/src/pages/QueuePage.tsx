import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  Clock,
  Activity,
  X,
  AlertTriangle
} from 'lucide-react';
import { Patient, ScheduledPatient, PriorityNumber, PRIORITY_CONFIG } from '../types';

interface QueuePageProps {
  patients: Patient[];
  scheduledPatients: ScheduledPatient[];
  onDeletePatient: (patientId: string) => void;
  onUpdatePatient: (patient: Patient) => void;
}

export const QueuePage: React.FC<QueuePageProps> = ({
  patients,
  scheduledPatients,
  onDeletePatient,
  onUpdatePatient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'arrival' | 'priority' | 'id'>('arrival');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Selected patient for details modal
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Determine patient statuses and waiting times based on current schedule
  const enrichedPatients = useMemo(() => {
    return patients.map((p) => {
      const scheduled = scheduledPatients.find((s) => s.patient_id === p.patient_id);
      let status: 'waiting' | 'in_treatment' | 'completed' = 'waiting';
      let waitTime = 0;

      if (scheduled) {
        status = 'completed';
        waitTime = scheduled.waiting_time;
      }

      return {
        ...p,
        computedStatus: status,
        computedWaitTime: waitTime,
        scheduledRecord: scheduled,
      };
    });
  }, [patients, scheduledPatients]);

  // Filtering & Sorting
  const filteredPatients = useMemo(() => {
    return enrichedPatients
      .filter((p) => {
        const matchesSearch =
          p.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority =
          priorityFilter === 'all' || p.priority === parseInt(priorityFilter);
        const matchesStatus =
          statusFilter === 'all' || p.computedStatus === statusFilter;
        return matchesSearch && matchesPriority && matchesStatus;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'arrival') {
          diff = a.arrival_time - b.arrival_time;
        } else if (sortBy === 'priority') {
          diff = a.priority - b.priority || a.arrival_time - b.arrival_time;
        } else if (sortBy === 'id') {
          diff = a.patient_id.localeCompare(b.patient_id);
        }
        return sortAsc ? diff : -diff;
      });
  }, [enrichedPatients, searchQuery, priorityFilter, statusFilter, sortBy, sortAsc]);

  const toggleSort = (field: 'arrival' | 'priority' | 'id') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-navy">
          Emergency Room Triage Queue
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Inspect waiting room queue ordering, filter triage priorities, and manage active records.
        </p>
      </div>

      {/* Control Bar: Search, Filters, Sort */}
      <div className="bg-surface rounded-2xl p-4 border border-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Patient ID or name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs text-navy focus:outline-none focus:border-teal-medical transition-colors"
          />
        </div>

        {/* Filters and Sorters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-xs text-navy font-medium focus:outline-none focus:border-teal-medical"
          >
            <option value="all">All Priorities</option>
            <option value="1">Critical (P1)</option>
            <option value="2">High (P2)</option>
            <option value="3">Medium (P3)</option>
            <option value="4">Low (P4)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-xs text-navy font-medium focus:outline-none focus:border-teal-medical"
          >
            <option value="all">All Statuses</option>
            <option value="waiting">Waiting</option>
            <option value="completed">Completed</option>
          </select>

          {/* Sort Selector */}
          <button
            onClick={() => toggleSort('priority')}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors
              ${sortBy === 'priority' ? 'bg-navy text-white border-navy' : 'bg-background border-border text-navy hover:bg-surface'}
            `}
          >
            <span>Priority</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>

          <button
            onClick={() => toggleSort('arrival')}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors
              ${sortBy === 'arrival' ? 'bg-navy text-white border-navy' : 'bg-background border-border text-navy hover:bg-surface'}
            `}
          >
            <span>Arrival Time</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-background border-b border-border text-[11px] font-bold text-navy uppercase tracking-wider">
                <th className="py-3 px-4">Queue #</th>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Arrival Clock</th>
                <th className="py-3 px-4">Triage Priority</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Calculated Wait</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPatients.map((p, idx) => {
                const prioCfg = PRIORITY_CONFIG[p.priority];
                return (
                  <tr key={p.patient_id} className="hover:bg-background/60 transition-colors group">
                    <td className="py-3 px-4 font-bold text-text-muted">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-navy">
                      {p.patient_id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-navy">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      t = {p.arrival_time}m
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{
                          backgroundColor: prioCfg.bg,
                          color: prioCfg.color,
                          border: `1px solid ${prioCfg.border}`,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: prioCfg.color }} />
                        {p.priority} - {prioCfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {p.treatment_duration} min
                    </td>
                    <td className="py-3 px-4 text-text-secondary font-mono">
                      {p.computedStatus === 'completed' ? `${p.computedWaitTime}m` : 'Pending'}
                    </td>
                    <td className="py-3 px-4">
                      {p.computedStatus === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-priority-low border border-green-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Discharged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-priority-high border border-amber-200 text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          Waiting
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedPatient(p)}
                          className="p-1 rounded-lg text-text-muted hover:text-navy hover:bg-background transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingPatient(p)}
                          className="p-1 rounded-lg text-text-muted hover:text-navy hover:bg-background transition-colors"
                          title="Edit Duration"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete record for ${p.patient_id} (${p.name})?`)) {
                              onDeletePatient(p.patient_id);
                            }
                          }}
                          className="p-1 rounded-lg text-text-muted hover:text-priority-critical hover:bg-red-50 transition-colors"
                          title="Delete Patient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-secondary">
                    <Users className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-navy">No patients match your criteria</p>
                    <p className="text-xs text-text-muted mt-0.5">Try clearing filters or search query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 border border-border shadow-floating space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-base text-navy">
                Patient Case File: {selectedPatient.patient_id}
              </h3>
              <button onClick={() => setSelectedPatient(null)} className="p-1 rounded-lg hover:bg-background text-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-secondary">Full Name:</span>
                <span className="font-bold text-navy">{selectedPatient.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-secondary">Arrival Clock:</span>
                <span className="font-semibold text-navy">t = {selectedPatient.arrival_time} min</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-secondary">Assigned Priority:</span>
                <span className="font-bold" style={{ color: PRIORITY_CONFIG[selectedPatient.priority].color }}>
                  Level {selectedPatient.priority} ({PRIORITY_CONFIG[selectedPatient.priority].label})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-secondary">Treatment Duration:</span>
                <span className="font-semibold text-navy">{selectedPatient.treatment_duration} min</span>
              </div>
              {selectedPatient.notes && (
                <div className="py-1">
                  <span className="text-text-secondary block mb-1">Notes:</span>
                  <p className="p-2.5 rounded-lg bg-background text-text-primary text-[11px]">{selectedPatient.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedPatient(null)}
              className="w-full py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-light"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 border border-border shadow-floating space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-base text-navy">
                Edit Record: {editingPatient.patient_id}
              </h3>
              <button onClick={() => setEditingPatient(null)} className="p-1 rounded-lg hover:bg-background text-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-text-secondary font-semibold mb-1">Name</label>
                <input
                  type="text"
                  value={editingPatient.name}
                  onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })}
                  className="w-full p-2 rounded-lg bg-background border border-border"
                />
              </div>
              <div>
                <label className="block text-text-secondary font-semibold mb-1">Treatment Duration (m)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={editingPatient.treatment_duration}
                  onChange={(e) => setEditingPatient({ ...editingPatient, treatment_duration: parseFloat(e.target.value) || 1 })}
                  className="w-full p-2 rounded-lg bg-background border border-border"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  onUpdatePatient(editingPatient);
                  setEditingPatient(null);
                }}
                className="flex-1 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-light"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingPatient(null)}
                className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-text-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
