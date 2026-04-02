'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  ClipboardList,
  Columns,
  UserPlus,
  UserMinus,
  Kanban,
  MessageSquare,
  Tag,
  Trash2,
  PenLine,
  ArrowRightLeft,
} from 'lucide-react';

interface ActivityEntry {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
}

interface Workspace {
  id: string;
  name: string;
}

const actionTextMap: Record<string, string> = {
  TASK_CREATED: 'created a task',
  TASK_UPDATED: 'updated a task',
  TASK_MOVED: 'moved a task',
  TASK_DELETED: 'deleted a task',
  TASK_ASSIGNED: 'assigned a task',
  COLUMN_CREATED: 'created a column',
  COLUMN_DELETED: 'deleted a column',
  MEMBER_JOINED: 'joined the workspace',
  MEMBER_REMOVED: 'was removed from the workspace',
  BOARD_CREATED: 'created a board',
  BOARD_DELETED: 'deleted a board',
  COMMENT_ADDED: 'added a comment',
  LABEL_CREATED: 'created a label',
};

const actionIcons: Record<string, React.ElementType> = {
  TASK_CREATED: ClipboardList,
  TASK_UPDATED: PenLine,
  TASK_MOVED: ArrowRightLeft,
  TASK_DELETED: Trash2,
  TASK_ASSIGNED: UserPlus,
  COLUMN_CREATED: Columns,
  COLUMN_DELETED: Trash2,
  MEMBER_JOINED: UserPlus,
  MEMBER_REMOVED: UserMinus,
  BOARD_CREATED: Kanban,
  BOARD_DELETED: Trash2,
  COMMENT_ADDED: MessageSquare,
  LABEL_CREATED: Tag,
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function groupByDate(entries: ActivityEntry[]): Record<string, ActivityEntry[]> {
  const groups: Record<string, ActivityEntry[]> = {};
  for (const entry of entries) {
    const key = new Date(entry.createdAt).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return groups;
}

export default function ActivityPage() {
  const { id } = useParams<{ id: string }>();
  const { fetcher } = useApi();

  const { data: workspace } = useQuery<Workspace>({
    queryKey: ['workspace', id],
    queryFn: () => fetcher(`workspaces/${id}`),
  });

  const { data: activityRes } = useQuery<{ data: ActivityEntry[] }>({
    queryKey: ['activity', id],
    queryFn: () => fetcher(`workspaces/${id}/activity?limit=100`),
  });
  const activities = activityRes?.data || [];
  const grouped = groupByDate(activities);

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/workspaces/${id}`}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Activity Log
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {workspace?.name}
          </p>
        </div>
      </div>

      {/* Activity feed */}
      {activities.length === 0 ? (
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl py-20 text-center">
          <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
            No activity yet
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Activity will appear here as your team works.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([dateKey, entries]) => (
            <div key={dateKey}>
              <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">
                {formatDate(entries[0].createdAt)}
              </h2>
              <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                {entries.map((entry, i) => {
                  const Icon = actionIcons[entry.action] || Activity;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-start gap-4 px-5 py-4 ${
                        i < entries.length - 1 ? 'border-b border-slate-100 dark:border-white/5' : ''
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {entry.user.name}
                          </span>{' '}
                          {actionTextMap[entry.action] || entry.action}
                        </p>
                        {entry.details && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {entry.details}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {timeAgo(entry.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
