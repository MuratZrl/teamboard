'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useSession } from 'next-auth/react';
import {
  Search,
  FileText,
  LayoutDashboard,
  Kanban,
  Loader2,
} from 'lucide-react';

interface TaskResult {
  id: string;
  title: string;
  priority: string;
  column: {
    id: string;
    name: string;
    board: { id: string; name: string };
  };
  assignee: { id: string; name: string } | null;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface Board {
  id: string;
  name: string;
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  MEDIUM: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
  HIGH: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400',
  URGENT: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { fetcher } = useApi();
  const { data: session } = useSession();


  // Reset search when closed
  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  // Fetch workspaces
  const { data: workspacesRes } = useQuery<{ data: Workspace[] }>({
    queryKey: ['workspaces'],
    queryFn: () => fetcher('workspaces'),
    enabled: !!session?.accessToken,
  });
  const workspaces = workspacesRes?.data || [];

  // Fetch boards for each workspace
  const { data: allBoards } = useQuery<Board[]>({
    queryKey: ['all-boards', workspaces.map((w) => w.id)],
    queryFn: async () => {
      const results: Board[] = [];
      for (const ws of workspaces) {
        const res = await fetcher(`workspaces/${ws.id}/boards`);
        for (const b of res) {
          results.push({ ...b, workspaceId: ws.id } as any);
        }
      }
      return results;
    },
    enabled: workspaces.length > 0,
  });

  // Search tasks across workspaces (debounced via query)
  const { data: taskResults, isLoading: searchLoading } = useQuery<TaskResult[]>({
    queryKey: ['search-tasks', search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const results: TaskResult[] = [];
      for (const ws of workspaces) {
        const res = await fetcher(
          `workspaces/${ws.id}/tasks?search=${encodeURIComponent(search.trim())}&limit=5`,
        );
        results.push(...(res.data || []));
      }
      return results;
    },
    enabled: search.trim().length > 0 && workspaces.length > 0,
    placeholderData: (prev) => prev,
  });

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(path);
    },
    [router],
  );

  const hasQuery = search.trim().length > 0;
  const boards = (allBoards || []) as (Board & { workspaceId: string })[];

  // Filter workspaces and boards by search
  const filteredWorkspaces = hasQuery
    ? workspaces.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))
    : workspaces;
  const filteredBoards = hasQuery
    ? boards.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    : boards;

  const showResults = open && hasQuery;
  const [activeIndex, setActiveIndex] = useState(-1);

  // Build flat list of all results for keyboard navigation
  type ResultItem =
    | { type: 'task'; data: TaskResult; path: string }
    | { type: 'board'; data: Board & { workspaceId: string }; path: string }
    | { type: 'workspace'; data: Workspace; path: string };

  const items: ResultItem[] = [];
  if (hasQuery && taskResults) {
    for (const task of taskResults) {
      items.push({ type: 'task', data: task, path: `/boards/${task.column.board.id}` });
    }
  }
  for (const board of filteredBoards) {
    items.push({ type: 'board', data: board, path: `/boards/${board.id}` });
  }
  for (const ws of filteredWorkspaces) {
    items.push({ type: 'workspace', data: ws, path: `/workspaces/${ws.id}` });
  }

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      navigate(items[activeIndex].path);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Scroll active item into view
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Track item index across groups
  let itemIndex = 0;

  return (
    <div className="relative">
      {/* Inline search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="w-full pl-9 pr-4 py-1.5 text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 focus:bg-white dark:focus:bg-white/10 rounded-lg border border-slate-200 dark:border-white/10 focus:border-blue-400 dark:focus:border-blue-500 outline-none transition-colors placeholder:text-slate-400"
        />
        {searchLoading && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-slate-400" />
        )}
      </div>

      {/* Dropdown results */}
      {showResults && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div ref={listRef} className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-[#1a1f2e] rounded-lg shadow-xl border border-slate-200 dark:border-white/10 max-h-72 overflow-y-auto">
            {items.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">No results found.</p>
            )}

            {/* Tasks */}
            {hasQuery && taskResults && taskResults.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pt-2 pb-1">Tasks</p>
                {taskResults.map((task) => {
                  const idx = itemIndex++;
                  return (
                    <button
                      key={task.id}
                      data-index={idx}
                      onClick={() => navigate(`/boards/${task.column.board.id}`)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 ${idx === activeIndex ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}
                    >
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{task.title}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {task.column.board.name} &middot; {task.column.name}
                        </p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityColors[task.priority] || ''}`}>
                        {task.priority.toLowerCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Boards */}
            {filteredBoards.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pt-2 pb-1">Boards</p>
                {filteredBoards.map((board) => {
                  const idx = itemIndex++;
                  return (
                    <button
                      key={board.id}
                      data-index={idx}
                      onClick={() => navigate(`/boards/${board.id}`)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 ${idx === activeIndex ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}
                    >
                      <Kanban className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{board.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Workspaces */}
            {filteredWorkspaces.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pt-2 pb-1">Workspaces</p>
                {filteredWorkspaces.map((ws) => {
                  const idx = itemIndex++;
                  return (
                    <button
                      key={ws.id}
                      data-index={idx}
                      onClick={() => navigate(`/workspaces/${ws.id}`)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 ${idx === activeIndex ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{ws.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
