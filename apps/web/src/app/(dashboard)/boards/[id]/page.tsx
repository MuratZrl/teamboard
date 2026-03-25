'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BoardColumnSkeleton } from '@/components/ui/skeleton';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { TaskModal } from '@/components/kanban/task-modal';
import { FilterBar, FilterState } from '@/components/kanban/filter-bar';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useRealtime } from '@/hooks/use-realtime';

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  order: number;
  dueDate: string | null;
  columnId: string;
  assignee: { id: string; name: string; image: string | null } | null;
  labels: Label[];
  _count: { comments: number; attachments: number };
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

interface WorkspaceDetail {
  id: string;
  name: string;
  members: { id: string; role: string; user: { id: string; name: string; email: string; image: string | null } }[];
}

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const { fetcher } = useApi();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<FilterState>({ priority: [], assigneeId: '', dueBefore: '' });

  const { data: board, isLoading } = useQuery<Board>({
    queryKey: ['board', id],
    queryFn: () => fetcher(`boards/${id}`),
  });

  // Subscribe to real-time events
  useRealtime(board?.workspaceId);

  // Fetch workspace members for assignee filter
  const { data: workspace } = useQuery<WorkspaceDetail>({
    queryKey: ['workspace', board?.workspaceId],
    queryFn: () => fetcher(`workspaces/${board!.workspaceId}`),
    enabled: !!board?.workspaceId,
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

  const addColumn = useMutation({
    mutationFn: (name: string) =>
      fetcher(`boards/${id}/columns`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', id] });
      toast.success('Column added');
    },
    onError: (err) => toast.error(err.message),
  });

  const renameColumn = useMutation({
    mutationFn: ({ columnId, name }: { columnId: string; name: string }) =>
      fetcher(`columns/${columnId}/rename`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', id] });
      toast.success('Column renamed');
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteColumn = useMutation({
    mutationFn: (columnId: string) =>
      fetcher(`columns/${columnId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', id] });
      toast.success('Column deleted');
    },
    onError: (err) => toast.error(err.message),
  });

  // Filter tasks client-side
  const filteredColumns = useMemo(() => {
    if (!board) return [];
    const hasFilters = filters.priority.length > 0 || filters.assigneeId || filters.dueBefore;
    if (!hasFilters) return board.columns;

    return board.columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((task) => {
        // Priority filter
        if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
          return false;
        }
        // Assignee filter
        if (filters.assigneeId && task.assignee?.id !== filters.assigneeId) {
          return false;
        }
        // Due date filter
        if (filters.dueBefore) {
          if (!task.dueDate) return false;
          const due = new Date(task.dueDate);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (filters.dueBefore === 'overdue') {
            if (due >= today) return false;
          } else if (filters.dueBefore === 'today') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (due < today || due >= tomorrow) return false;
          } else if (filters.dueBefore === 'week') {
            const endOfWeek = new Date(today);
            endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
            if (due < today || due > endOfWeek) return false;
          }
        }
        return true;
      }),
    }));
  }, [board, filters]);

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

      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        members={workspace?.members || []}
      />

      <div className="flex-1 overflow-x-auto p-6">
        <KanbanBoard
          columns={filteredColumns}
          onMoveTask={(taskId, columnId, order) =>
            moveTask.mutate({ taskId, columnId, order })
          }
          onCreateTask={(columnId, title) =>
            createTask.mutate({ columnId, title })
          }
          onSelectTask={setSelectedTask}
          onAddColumn={(name) => addColumn.mutate(name)}
          onRenameColumn={(columnId, name) =>
            renameColumn.mutate({ columnId, name })
          }
          onDeleteColumn={(columnId) => deleteColumn.mutate(columnId)}
        />
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          workspaceId={board.workspaceId}
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
