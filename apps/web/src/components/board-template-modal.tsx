'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  X,
  Zap,
  Bug,
  Megaphone,
  LayoutGrid,
  FileText,
  Loader2,
  Columns3,
} from 'lucide-react';

interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  columns: { name: string; order: number }[];
}

interface BoardTemplateModalProps {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (boardId: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  zap: Zap,
  bug: Bug,
  megaphone: Megaphone,
  'layout-grid': LayoutGrid,
  'file-text': FileText,
};

export function BoardTemplateModal({
  workspaceId,
  open,
  onClose,
  onSuccess,
}: BoardTemplateModalProps) {
  const { fetcher } = useApi();
  const router = useRouter();
  const [selected, setSelected] = useState<BoardTemplate | 'blank' | null>(null);
  const [boardName, setBoardName] = useState('');

  const { data: templates, isLoading: loadingTemplates } = useQuery<BoardTemplate[]>({
    queryKey: ['board-templates'],
    queryFn: () => fetcher('board-templates'),
    enabled: open,
  });

  const createBlankBoard = useMutation({
    mutationFn: (name: string) =>
      fetcher(`workspaces/${workspaceId}/boards`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: (data) => {
      toast.success('Board created');
      handleClose();
      onSuccess(data.id);
      router.push(`/boards/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const createFromTemplate = useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name: string }) =>
      fetcher(`board-templates/${templateId}/create`, {
        method: 'POST',
        body: JSON.stringify({ workspaceId, name }),
      }),
    onSuccess: (data) => {
      toast.success('Board created from template');
      handleClose();
      onSuccess(data.id);
      router.push(`/boards/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  function handleClose() {
    setSelected(null);
    setBoardName('');
    onClose();
  }

  function handleCreate() {
    if (!boardName.trim()) return;
    if (selected === 'blank') {
      createBlankBoard.mutate(boardName);
    } else if (selected && typeof selected !== 'string') {
      createFromTemplate.mutate({ templateId: selected.id, name: boardName });
    }
  }

  const isPending = createBlankBoard.isPending || createFromTemplate.isPending;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {selected ? 'Name your board' : 'Create a new board'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {selected ? (
            /* Name input step */
            <div>
              <div className="flex items-center gap-2 mb-4 text-sm text-slate-500 dark:text-slate-400">
                {selected === 'blank' ? (
                  <>
                    <Columns3 className="w-4 h-4" />
                    <span>Blank Board</span>
                  </>
                ) : (
                  <>
                    {(() => {
                      const Icon = iconMap[selected.icon] || LayoutGrid;
                      return <Icon className="w-4 h-4" />;
                    })()}
                    <span>{selected.name}</span>
                  </>
                )}
                <button
                  onClick={() => {
                    setSelected(null);
                    setBoardName('');
                  }}
                  className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Change
                </button>
              </div>
              <input
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
                placeholder="Board name"
                autoFocus
                required
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          ) : (
            /* Template selection step */
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {/* Blank board option */}
              <button
                onClick={() => setSelected('blank')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/5 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Columns3 className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                    Blank Board
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Start with default columns: To Do, In Progress, Review, Done
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    {['To Do', 'In Progress', 'Review', 'Done'].map((col) => (
                      <span
                        key={col}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </button>

              {loadingTemplates ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : (
                templates?.map((t) => {
                  const Icon = iconMap[t.icon] || LayoutGrid;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/5 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {t.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {t.description}
                        </p>
                        {t.columns.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {t.columns
                              .sort((a, b) => a.order - b.order)
                              .map((col) => (
                                <span
                                  key={col.name}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                >
                                  {col.name}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {selected && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-white/5 flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!boardName.trim() || isPending}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Board
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
