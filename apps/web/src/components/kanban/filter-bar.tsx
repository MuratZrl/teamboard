'use client';

import { X } from 'lucide-react';

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string; email: string; image: string | null };
}

export interface FilterState {
  priority: string[];
  assigneeId: string;
  dueBefore: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  members: Member[];
}

const priorities = [
  { value: 'LOW', label: 'Low', color: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300', activeColor: 'bg-slate-500 text-white dark:bg-slate-500 dark:text-white' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', activeColor: 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400', activeColor: 'bg-orange-600 text-white dark:bg-orange-600 dark:text-white' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', activeColor: 'bg-red-600 text-white dark:bg-red-600 dark:text-white' },
];

const dueDateOptions = [
  { value: '', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
];

export function FilterBar({ filters, onFiltersChange, members }: FilterBarProps) {
  const activeCount =
    filters.priority.length +
    (filters.assigneeId ? 1 : 0) +
    (filters.dueBefore ? 1 : 0);

  function togglePriority(value: string) {
    const next = filters.priority.includes(value)
      ? filters.priority.filter((p) => p !== value)
      : [...filters.priority, value];
    onFiltersChange({ ...filters, priority: next });
  }

  function clearFilters() {
    onFiltersChange({ priority: [], assigneeId: '', dueBefore: '' });
  }

  return (
    <div className="px-4 sm:px-8 py-3 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] flex flex-wrap items-center gap-3">
      {/* Priority toggles */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">Priority:</span>
        {priorities.map((p) => {
          const isActive = filters.priority.includes(p.value);
          return (
            <button
              key={p.value}
              onClick={() => togglePriority(p.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isActive ? p.activeColor : p.color
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Assignee dropdown */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Assignee:</span>
        <select
          value={filters.assigneeId}
          onChange={(e) => onFiltersChange({ ...filters, assigneeId: e.target.value })}
          className="text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All</option>
          {members.map((m) => (
            <option key={m.user.id} value={m.user.id}>
              {m.user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Due date quick filters */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Due:</span>
        {dueDateOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFiltersChange({ ...filters, dueBefore: opt.value })}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filters.dueBefore === opt.value
                ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Clear filters */}
      {activeCount > 0 && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors ml-auto"
        >
          <X className="w-3 h-3" />
          Clear ({activeCount})
        </button>
      )}
    </div>
  );
}
