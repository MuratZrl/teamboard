'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { toast } from 'sonner';
import { X, Trash2, Send, Paperclip, Download, MessageSquare, Tag } from 'lucide-react';
import type { Task, Label } from '@/app/(dashboard)/boards/[id]/page';

interface TaskModalProps {
  task: Task;
  workspaceId: string;
  onClose: () => void;
  onUpdate: (data: Partial<Task> & { labelIds?: string[] }) => void;
  onDelete: () => void;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; image: string | null };
}

interface Attachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  createdAt: string;
  uploader: { id: string; name: string };
}

export function TaskModal({ task, workspaceId, onClose, onUpdate, onDelete }: TaskModalProps) {
  const { fetcher } = useApi();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split('T')[0] : '');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(task.labels?.map((l) => l.id) || []);
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'files'>('details');

  // Fetch workspace labels
  const { data: workspaceLabels } = useQuery<Label[]>({
    queryKey: ['labels', workspaceId],
    queryFn: () => fetcher(`workspaces/${workspaceId}/labels`),
  });

  // Fetch comments
  const { data: commentsRes } = useQuery<{ data: Comment[] }>({
    queryKey: ['comments', task.id],
    queryFn: () => fetcher(`tasks/${task.id}/comments?limit=50`),
  });
  const comments = commentsRes?.data || [];

  // Fetch attachments
  const { data: attachments } = useQuery<Attachment[]>({
    queryKey: ['attachments', task.id],
    queryFn: () => fetcher(`tasks/${task.id}/attachments`),
  });

  // Add comment
  const addComment = useMutation({
    mutationFn: (content: string) =>
      fetcher(`tasks/${task.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', task.id] });
      setCommentText('');
    },
    onError: (err) => toast.error(err.message),
  });

  // Delete comment
  const deleteComment = useMutation({
    mutationFn: (id: string) => fetcher(`comments/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', task.id] }),
  });

  // Upload file
  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${API_URL}/tasks/${task.id}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${(window as any).__session_token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', task.id] });
      toast.success('File uploaded');
    },
    onError: () => toast.error('Upload failed'),
  });

  // Delete attachment
  const deleteAttachment = useMutation({
    mutationFn: (id: string) => fetcher(`attachments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', task.id] });
      toast.success('File deleted');
    },
  });

  function handleSave() {
    onUpdate({
      title,
      description: description || undefined,
      priority,
      dueDate: dueDate || undefined,
      labelIds: selectedLabelIds,
    } as any);
  }

  function toggleLabel(labelId: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const tabs = [
    { key: 'details', label: 'Details' },
    { key: 'comments', label: 'Comments', count: comments.length },
    { key: 'files', label: 'Files', count: attachments?.length || 0 },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-[5vh] overflow-y-auto">
      <div className="bg-white dark:bg-[#0b1120] rounded-xl shadow-xl w-full max-w-2xl mx-4 mb-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/10 px-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
              {'count' in tab && tab.count > 0 && (
                <span className="ml-1.5 text-xs bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none dark:placeholder-slate-500"
                placeholder="Add a description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Task['priority'])}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Tag className="w-3.5 h-3.5 inline mr-1" />
                Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {workspaceLabels?.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label.id)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                      selectedLabelIds.includes(label.id)
                        ? 'ring-2 ring-offset-1 ring-blue-500 text-white dark:ring-offset-[#0b1120]'
                        : 'text-white opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </button>
                ))}
                {(!workspaceLabels || workspaceLabels.length === 0) && (
                  <p className="text-xs text-slate-400">No labels. Create them in workspace settings.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="p-5">
            {/* Add comment */}
            <div className="flex gap-2 mb-4">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commentText.trim()) addComment.mutate(commentText.trim());
                }}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none dark:placeholder-slate-500"
              />
              <button
                onClick={() => commentText.trim() && addComment.mutate(commentText.trim())}
                disabled={!commentText.trim() || addComment.isPending}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Comment list */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.length === 0 && (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No comments yet</p>
              )}
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                    {comment.author.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{comment.author.name}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => deleteComment.mutate(comment.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="p-5">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile.mutate(file);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadFile.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors mb-4"
            >
              <Paperclip className="w-4 h-4" />
              {uploadFile.isPending ? 'Uploading...' : 'Click to upload (max 10MB)'}
            </button>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(!attachments || attachments.length === 0) && (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No files attached</p>
              )}
              {attachments?.map((att) => (
                <div key={att.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 group">
                  <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 dark:text-white truncate">{att.filename}</p>
                    <p className="text-xs text-slate-400">{formatSize(att.size)}</p>
                  </div>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/attachments/${att.id}/download`}
                    className="p-1 text-slate-400 hover:text-blue-500"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => deleteAttachment.mutate(att.id)}
                    className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-200 dark:border-white/10">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete task
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
