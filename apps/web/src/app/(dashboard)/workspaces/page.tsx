'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Users, LayoutGrid, Crown, Loader2 } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  _count: { members: number; boards: number };
  subscription: { status: string } | null;
}

export default function WorkspacesPage() {
  const { fetcher } = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: workspacesRes, isLoading } = useQuery<{ data: Workspace[]; meta: any }>({
    queryKey: ['workspaces'],
    queryFn: () => fetcher('workspaces'),
  });
  const workspaces = workspacesRes?.data;

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      fetcher('workspaces', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setShowCreate(false);
      setNewName('');
      router.push(`/workspaces/${data.id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto dark:bg-[#0b1120]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workspaces</h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">Manage your team workspaces</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Workspace
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 dark:bg-white/[0.03] dark:border-white/10">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Create new workspace</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(newName);
            }}
            className="flex gap-3"
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Workspace name"
              required
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
          </form>
          {createMutation.isError && (
            <p className="text-red-600 text-sm mt-2">{createMutation.error.message}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces?.map((ws) => (
          <button
            key={ws.id}
            onClick={() => router.push(`/workspaces/${ws.id}`)}
            className="bg-white border border-slate-200 rounded-xl p-6 text-left hover:border-blue-300 hover:shadow-md transition-all dark:bg-white/[0.03] dark:border-white/5 dark:hover:border-white/10"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-slate-900 text-lg dark:text-white">{ws.name}</h3>
              {ws.subscription?.status === 'ACTIVE' && (
                <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-amber-500/20 dark:text-amber-400">
                  <Crown className="w-3 h-3" /> Pro
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> {ws._count.members} members
              </span>
              <span className="flex items-center gap-1">
                <LayoutGrid className="w-4 h-4" /> {ws._count.boards} boards
              </span>
            </div>
          </button>
        ))}
      </div>

      {workspaces?.length === 0 && !showCreate && (
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4 dark:text-slate-400">No workspaces yet. Create your first one!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Workspace
          </button>
        </div>
      )}
    </div>
  );
}
