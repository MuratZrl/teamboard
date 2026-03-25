'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertTriangle, Users, ListTodo } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Analytics {
  totalTasks: number;
  overdueTasks: number;
  completionRate: number;
  activeMembers: number;
  tasksByStatus: { status: string; count: number }[];
  tasksByPriority: { priority: string; count: number }[];
  createdVsCompleted: { date: string; created: number; completed: number }[];
  memberActivity: {
    userId: string;
    name: string;
    image: string | null;
    tasksCreated: number;
    tasksCompleted: number;
    comments: number;
  }[];
}

const STATUS_COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6'];
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#3b82f6',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { fetcher } = useApi();

  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['analytics', id],
    queryFn: () => fetcher(`workspaces/${id}/analytics`),
  });

  if (isLoading || !analytics) {
    return (
      <div className="p-8 max-w-6xl mx-auto dark:bg-[#0b1120]">
        <div className="h-8 w-48 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-6">
              <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded animate-pulse mb-3" />
              <div className="h-8 w-16 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-6 h-72">
              <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-6 h-72">
          <div className="h-4 w-48 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto dark:bg-[#0b1120]">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/workspaces/${id}`}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <ListTodo className="w-4 h-4" />
            Total Tasks
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{analytics.totalTasks}</p>
        </div>
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Overdue
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{analytics.overdueTasks}</p>
        </div>
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Completion Rate
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.completionRate}%</p>
        </div>
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <Users className="w-4 h-4 text-blue-500" />
            Active Members
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{analytics.activeMembers}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tasks by Status - Pie Chart */}
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Tasks by Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics.tasksByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {analytics.tasksByStatus.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by Priority - Bar Chart */}
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Tasks by Priority</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.tasksByPriority}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="priority" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {analytics.tasksByPriority.map((entry) => (
                  <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] || '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Created vs Completed Line Chart */}
      <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Created vs Completed (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.createdVsCompleted}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelFormatter={(val) => new Date(val).toLocaleDateString()}
            />
            <Legend />
            <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Member Activity Table */}
      <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Member Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10">
                <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Member</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Created</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Completed</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Comments</th>
              </tr>
            </thead>
            <tbody>
              {analytics.memberActivity.map((member) => (
                <tr key={member.userId} className="border-b border-slate-100 dark:border-white/5 last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-700 dark:text-blue-400 text-xs font-medium">
                        {member.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{member.name}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-slate-600 dark:text-slate-300">{member.tasksCreated}</td>
                  <td className="text-right py-3 px-4 text-slate-600 dark:text-slate-300">{member.tasksCompleted}</td>
                  <td className="text-right py-3 px-4 text-slate-600 dark:text-slate-300">{member.comments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
