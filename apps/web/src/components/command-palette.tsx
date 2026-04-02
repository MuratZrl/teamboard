'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const router = useRouter();
  const { fetcher } = useApi();
  const { data: session } = useSession();

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

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

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-slate-200 dark:border-white/10"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded text-slate-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command palette modal */}
      {open && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex justify-center pt-[20vh]">
            <Command
              className="w-full max-w-lg bg-white dark:bg-[#1a1f2e] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
              shouldFilter={false}
            >
              <div className="flex items-center gap-3 px-4 border-b border-slate-200 dark:border-white/5">
                <Search className="w-4 h-4 text-slate-400" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search tasks, boards, workspaces..."
                  className="flex-1 h-12 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                />
                {searchLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                <kbd
                  className="text-[10px] px-1.5 py-0.5 border border-slate-200 dark:border-white/10 rounded text-slate-400 cursor-pointer"
                  onClick={() => setOpen(false)}
                >
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-slate-500">
                  No results found.
                </Command.Empty>

                {/* Tasks */}
                {hasQuery && taskResults && taskResults.length > 0 && (
                  <Command.Group
                    heading={
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                        Tasks
                      </span>
                    }
                  >
                    {taskResults.map((task) => (
                      <Command.Item
                        key={task.id}
                        value={task.title}
                        onSelect={() => navigate(`/boards/${task.column.board.id}`)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 data-[selected=true]:bg-slate-100 dark:data-[selected=true]:bg-white/5"
                      >
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{task.title}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {task.column.board.name} &middot; {task.column.name}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityColors[task.priority] || ''}`}
                        >
                          {task.priority.toLowerCase()}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Boards */}
                {filteredBoards.length > 0 && (
                  <Command.Group
                    heading={
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                        Boards
                      </span>
                    }
                  >
                    {filteredBoards.map((board) => (
                      <Command.Item
                        key={board.id}
                        value={board.name}
                        onSelect={() => navigate(`/boards/${board.id}`)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 data-[selected=true]:bg-slate-100 dark:data-[selected=true]:bg-white/5"
                      >
                        <Kanban className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{board.name}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Workspaces */}
                {filteredWorkspaces.length > 0 && (
                  <Command.Group
                    heading={
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                        Workspaces
                      </span>
                    }
                  >
                    {filteredWorkspaces.map((ws) => (
                      <Command.Item
                        key={ws.id}
                        value={ws.name}
                        onSelect={() => navigate(`/workspaces/${ws.id}`)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 data-[selected=true]:bg-slate-100 dark:data-[selected=true]:bg-white/5"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{ws.name}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
