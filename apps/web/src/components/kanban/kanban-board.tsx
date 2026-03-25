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
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import type { Column, Task } from '@/app/(dashboard)/boards/[id]/page';

interface KanbanBoardProps {
  columns: Column[];
  onMoveTask: (taskId: string, columnId: string, order: number) => void;
  onCreateTask: (columnId: string, title: string) => void;
  onSelectTask: (task: Task) => void;
}

export function KanbanBoard({
  columns,
  onMoveTask,
  onCreateTask,
  onSelectTask,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
