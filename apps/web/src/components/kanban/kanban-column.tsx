'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SortableTaskCard } from './sortable-task-card';
import type { Column, Task } from '@/app/(dashboard)/boards/[id]/page';

interface KanbanColumnProps {
  column: Column;
  onCreateTask: (columnId: string, title: string) => void;
  onSelectTask: (task: Task) => void;
}

const columnColors: Record<string, string> = {
  Todo: 'bg-slate-400',
  'In Progress': 'bg-blue-500',
  Review: 'bg-amber-500',
  Done: 'bg-green-500',
};

export function KanbanColumn({
  column,
  onCreateTask,
  onSelectTask,
}: KanbanColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  function handleAdd() {
    if (!newTitle.trim()) return;
    onCreateTask(column.id, newTitle.trim());
    setNewTitle('');
    setIsAdding(false);
  }

  const dotColor = columnColors[column.name] || 'bg-slate-400';

  return (
    <div
      ref={setNodeRef}
      className={`w-72 flex-shrink-0 flex flex-col bg-slate-100 dark:bg-white/[0.03] rounded-xl ${
        isOver ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white">
            {column.name}
          </h3>
          <span className="text-xs bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-[100px]">
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onSelectTask(task)}
            />
          ))}
        </SortableContext>

        {isAdding && (
          <div className="bg-white dark:bg-white/[0.03] rounded-lg p-3 shadow-sm border border-slate-200 dark:border-white/10">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              placeholder="Task title..."
              className="w-full text-sm outline-none placeholder-slate-400 dark:placeholder-slate-500 bg-transparent dark:text-slate-300"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAdd}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
