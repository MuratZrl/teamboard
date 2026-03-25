'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BoardColumnSkeleton } from '@/components/ui/skeleton';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { TaskModal } from '@/components/kanban/task-modal';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  order: number;
  dueDate: string | null;
  columnId: string;
  assignee: { id: string; name: string; image: string | null } | null;
}

export interface Column {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
}

export interface Board {
  id: string;
  name: string;
  workspaceId: string;
  columns: Column[];
}

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const { fetcher } = useApi();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: board, isLoading } = useQuery<Board>({
    queryKey: ['board', id],
    queryFn: () => fetcher(`boards/${id}`),
  });

  const moveTask = useMutation({
    mutationFn: ({ taskId, columnId, order }: { taskId: string; columnId: string; order: number }) =>
      fetcher(`tasks/${taskId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ columnId, order }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', id] });
    },
  });

  const createTask = useMutation({
    mutationFn: ({ columnId, title }: { columnId: string; title: string }) =>
      fetcher(`columns/${columnId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', id] });
      toast.success('Task created');
    },
    onError: (err) => toast.error(err.message),
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<Task> }) =>
      fetcher(`tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', id] });
      setSelectedTask(null);
      toast.success('Task updated');
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) =>
      fetcher(`tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', id] });
      setSelectedTask(null);
      toast.success('Task deleted');
    },
    onError: (err) => toast.error(err.message),
  });

  // Keyboard shortcuts
  const shortcuts = useMemo(
    () => ({
      escape: () => setSelectedTask(null),
      'mod+shift+n': () => {
        // Focus first column's add button
        if (board?.columns[0]) {
          const firstCol = document.querySelector('[data-column-id]');
          const addBtn = firstCol?.querySelector('button');
          addBtn?.click();
        }
      },
    }),
    [board],
  );
  useKeyboardShortcuts(shortcuts);

  if (isLoading || !board) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-8 py-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03]">
          <div className="h-6 w-40 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex-1 flex gap-4 p-6">
          {[1, 2, 3, 4].map((i) => <BoardColumnSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 sm:px-8 py-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{board.name}</h1>
        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 rounded text-[10px] font-mono">Esc</kbd>
          <span>close modal</span>
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 rounded text-[10px] font-mono">Ctrl+Shift+N</kbd>
          <span>new task</span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <KanbanBoard
          columns={board.columns}
          onMoveTask={(taskId, columnId, order) =>
            moveTask.mutate({ taskId, columnId, order })
          }
          onCreateTask={(columnId, title) =>
            createTask.mutate({ columnId, title })
          }
          onSelectTask={setSelectedTask}
        />
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(data) =>
            updateTask.mutate({ taskId: selectedTask.id, data })
          }
          onDelete={() => deleteTask.mutate(selectedTask.id)}
        />
      )}
    </div>
  );
}
