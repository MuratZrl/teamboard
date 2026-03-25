'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import type { Column, Task } from '@/app/(dashboard)/boards/[id]/page';

interface KanbanBoardProps {
  columns: Column[];
  onMoveTask: (taskId: string, columnId: string, order: number) => void;
  onCreateTask: (columnId: string, title: string) => void;
  onSelectTask: (task: Task) => void;
  onAddColumn?: (name: string) => void;
  onRenameColumn?: (columnId: string, name: string) => void;
  onDeleteColumn?: (columnId: string) => void;
}

export function KanbanBoard({
  columns,
  onMoveTask,
  onCreateTask,
  onSelectTask,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = findTask(active.id as string);
    if (task) setActiveTask(task);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    let targetColumnId: string;
    let targetOrder: number;

    // Check if dropped over a column
    const overColumn = columns.find((col) => col.id === over.id);
    if (overColumn) {
      targetColumnId = overColumn.id;
      targetOrder = overColumn.tasks.length;
    } else {
      // Dropped over a task — find which column it belongs to
      const overTask = findTask(over.id as string);
      if (!overTask) return;
      targetColumnId = overTask.columnId;
      const col = columns.find((c) => c.id === targetColumnId);
      targetOrder = col?.tasks.findIndex((t) => t.id === over.id) ?? 0;
    }

    const sourceTask = findTask(taskId);
    if (!sourceTask) return;
    if (sourceTask.columnId === targetColumnId && sourceTask.order === targetOrder) return;

    onMoveTask(taskId, targetColumnId, targetOrder);
  }

  function findTask(taskId: string): Task | undefined {
    for (const col of columns) {
      const task = col.tasks.find((t) => t.id === taskId);
      if (task) return task;
    }
    return undefined;
  }

  function handleAddColumn() {
    if (!newColumnName.trim()) return;
    onAddColumn?.(newColumnName.trim());
    setNewColumnName('');
    setIsAddingColumn(false);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full min-h-0">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onCreateTask={onCreateTask}
            onSelectTask={onSelectTask}
            onRenameColumn={onRenameColumn}
            onDeleteColumn={onDeleteColumn}
          />
        ))}

        {/* Add Column */}
        {isAddingColumn ? (
          <div className="w-72 flex-shrink-0 bg-slate-100 dark:bg-white/[0.03] rounded-xl p-4">
            <input
              autoFocus
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddColumn();
                if (e.key === 'Escape') {
                  setIsAddingColumn(false);
                  setNewColumnName('');
                }
              }}
              placeholder="Column name..."
              className="w-full text-sm font-semibold outline-none placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 dark:text-white"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddColumn}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium"
              >
                Add Column
              </button>
              <button
                onClick={() => {
                  setIsAddingColumn(false);
                  setNewColumnName('');
                }}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          onAddColumn && (
            <button
              onClick={() => setIsAddingColumn(true)}
              className="w-72 flex-shrink-0 flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/[0.03] rounded-xl border-2 border-dashed border-slate-300 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-white/20 hover:text-slate-600 dark:hover:text-slate-300 transition-colors h-fit py-8"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Column</span>
            </button>
          )
        )}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
