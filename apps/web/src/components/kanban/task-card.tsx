'use client';

import { Calendar, MessageSquare, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/app/(dashboard)/boards/[id]/page';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-400/10 dark:text-slate-400',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-400/20 dark:text-orange-400',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-400/20 dark:text-red-400',
};

export function TaskCard({ task, isDragging, onClick }: TaskCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-white/[0.03] rounded-lg p-3 shadow-sm border border-slate-200 dark:border-white/5 cursor-pointer hover:border-blue-300 dark:hover:border-white/10 transition-all',
        isDragging && 'opacity-75 shadow-lg rotate-2 scale-105',
      )}
    >
      {/* Labels */}
      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{task.title}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded font-medium',
              priorityColors[task.priority],
            )}
          >
            {task.priority.toLowerCase()}
          </span>
          {task.dueDate && (
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
          {task._count?.comments > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-slate-400 dark:text-slate-500">
              <MessageSquare className="w-3 h-3" />
              {task._count.comments}
            </span>
          )}
          {task._count?.attachments > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-slate-400 dark:text-slate-500">
              <Paperclip className="w-3 h-3" />
              {task._count.attachments}
            </span>
          )}
        </div>

        {task.assignee && (
          <div
            className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-400/20 flex items-center justify-center text-blue-700 dark:text-blue-400 text-xs font-medium"
            title={task.assignee.name}
          >
            {task.assignee.name[0].toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
