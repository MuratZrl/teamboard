'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { TaskModal } from '@/components/kanban/task-modal';

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
    },
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
    },
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) =>
      fetcher(`tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', id] });
      setSelectedTask(null);
    },
  });

  if (isLoading || !board) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03]">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{board.name}</h1>
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
