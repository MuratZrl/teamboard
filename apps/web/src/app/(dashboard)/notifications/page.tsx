'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useRouter } from 'next/navigation';
import {
  Bell,
  UserPlus,
  MessageSquare,
  Clock,
  AlertTriangle,
  UserCheck,
  CheckCheck,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ElementType> = {
  TASK_ASSIGNED: UserPlus,
  COMMENT_ADDED: MessageSquare,
  TASK_DUE_SOON: Clock,
  TASK_OVERDUE: AlertTriangle,
  INVITE_ACCEPTED: UserCheck,
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage() {
  const { fetcher } = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notificationsRes } = useQuery<{ data: Notification[] }>({
    queryKey: ['notifications'],
    queryFn: () => fetcher('notifications?limit=50'),
  });
  const notifications = notificationsRes?.data;

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['notifications-unread-count'],
    queryFn: () => fetcher('notifications/unread-count'),
  });
  const unreadCount = unreadData?.count ?? 0;

  const markRead = useMutation({
    mutationFn: (notificationId: string) =>
      fetcher(`notifications/${notificationId}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => fetcher('notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  function handleClick(n: Notification) {
    if (!n.read) markRead.mutate(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
        {!notifications || notifications.length === 0 ? (
          <div className="py-20 text-center">
            <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
              No notifications yet
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              You'll be notified when something important happens.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = typeIcons[n.type] || Bell;
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors border-b border-slate-100 dark:border-white/5 last:border-b-0 ${
                  !n.read
                    ? 'bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                    : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                }`}
              >
                <div
                  className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !n.read
                      ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-snug ${
                      !n.read
                        ? 'font-semibold text-slate-900 dark:text-white'
                        : 'font-medium text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {n.title}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                    {relativeTime(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <div className="mt-2 w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
