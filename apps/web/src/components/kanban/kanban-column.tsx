'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEffect, useRef, useState } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { SortableTaskCard } from './sortable-task-card';
import type { Column, Task } from '@/app/(dashboard)/boards/[id]/page';

interface KanbanColumnProps {
  column: Column;
  onCreateTask: (columnId: string, title: string) => void;
  onSelectTask: (task: Task) => void;
  onRenameColumn?: (columnId: string, name: string) => void;
  onDeleteColumn?: (columnId: string) => void;
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
  onRenameColumn,
  onDeleteColumn,
}: KanbanColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.name);
  const menuRef = useRef<HTMLDivElement>(null);

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  function handleAdd() {
    if (!newTitle.trim()) return;
    onCreateTask(column.id, newTitle.trim());
    setNewTitle('');
    setIsAdding(false);
  }

  function handleRename() {
    if (!renameValue.trim() || renameValue.trim() === column.name) {
      setIsRenaming(false);
      setRenameValue(column.name);
      return;
    }
    onRenameColumn?.(column.id, renameValue.trim());
    setIsRenaming(false);
  }

  const dotColor = columnColors[column.name] || 'bg-slate-400';

  return (
    <div
      ref={setNodeRef}
      data-column-id={column.id}
      className={`w-72 flex-shrink-0 flex flex-col bg-slate-100 dark:bg-white/[0.03] rounded-xl ${
        isOver ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setIsRenaming(false);
                  setRenameValue(column.name);
                }
              }}
              onBlur={handleRename}
              className="text-sm font-semibold text-slate-700 dark:text-white bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-blue-500 w-full min-w-0"
            />
          ) : (
            <h3 className="text-sm font-semibold text-slate-700 dark:text-white truncate">
              {column.name}
            </h3>
          )}
          <span className="text-xs bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
            {column.tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg shadow-lg z-50 py-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setIsRenaming(true);
                    setRenameValue(column.name);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteColumn?.(column.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
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
