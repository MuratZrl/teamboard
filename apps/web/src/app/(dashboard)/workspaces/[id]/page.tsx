'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  Plus,
  Settings,
  LayoutGrid,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { CardSkeleton } from '@/components/ui/skeleton';

interface Board {
  id: string;
  name: string;
  createdAt: string;
  _count: { columns: number };
}

interface Workspace {
  id: string;
  name: string;
  members: { id: string; role: string; user: { id: string; name: string; email: string; image: string | null } }[];
  subscription: { status: string } | null;
}

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { fetcher } = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [boardName, setBoardName] = useState('');

  const { data: workspace } = useQuery<Workspace>({
    queryKey: ['workspace', id],
    queryFn: () => fetcher(`workspaces/${id}`),
  });

  const { data: boards, isLoading } = useQuery<Board[]>({
    queryKey: ['boards', id],
    queryFn: () => fetcher(`workspaces/${id}/boards`),
  });

  const createBoard = useMutation({
    mutationFn: (name: string) =>
      fetcher(`workspaces/${id}/boards`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boards', id] });
      setShowCreate(false);
      setBoardName('');
      toast.success('Board created');
      router.push(`/boards/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="p-8 max-w-5xl mx-auto dark:bg-[#0b1120]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {workspace?.name || 'Loading...'}
          </h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">
            {workspace?.members.length} members
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Board
          </button>
          <Link
            href={`/workspaces/${id}/analytics`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
          <Link
            href={`/workspaces/${id}/settings`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </div>

      {showCreate && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 dark:bg-white/[0.03] dark:border-white/10">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Create new board</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createBoard.mutate(boardName);
            }}
            className="flex gap-3"
          >
            <input
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="Board name"
              required
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={createBoard.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : boards && boards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all dark:bg-white/[0.03] dark:border-white/5 dark:hover:border-white/10"
            >
              <div className="flex items-center gap-3 mb-3">
                <LayoutGrid className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white">{board.name}</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Created {new Date(board.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <LayoutGrid className="w-12 h-12 text-slate-300 mx-auto mb-4 dark:text-slate-600" />
          <p className="text-slate-500 mb-4 dark:text-slate-400">No boards yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium"
          >
            Create your first board
          </button>
        </div>
      )}
    </div>
  );
}
