'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Mail,
  Crown,
  Shield,
  User,
  CreditCard,
  Tag,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { SettingsSkeleton } from '@/components/ui/skeleton';

interface Member {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: { id: string; name: string; email: string; image: string | null };
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  invitedBy: { name: string; email: string };
}

interface Workspace {
  id: string;
  name: string;
  members: Member[];
  subscription: { status: string } | null;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
};

const presetColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function WorkspaceSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const { fetcher } = useApi();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState(presetColors[0]);

  const { data: workspace, isLoading } = useQuery<Workspace>({
    queryKey: ['workspace', id],
    queryFn: () => fetcher(`workspaces/${id}`),
  });

  const { data: invitations } = useQuery<Invitation[]>({
    queryKey: ['invitations', id],
    queryFn: () => fetcher(`workspaces/${id}/invitations`),
  });

  const { data: labels } = useQuery<Label[]>({
    queryKey: ['labels', id],
    queryFn: () => fetcher(`workspaces/${id}/labels`),
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) =>
      fetcher(`workspaces/${id}/invitations`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', id] });
      setInviteEmail('');
      toast.success('Invitation sent');
    },
    onError: (err) => toast.error(err.message),
  });

  const createLabel = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      fetcher(`workspaces/${id}/labels`, {
        method: 'POST',
        body: JSON.stringify({ name, color }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', id] });
      setLabelName('');
      setLabelColor(presetColors[0]);
      toast.success('Label created');
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteLabel = useMutation({
    mutationFn: (labelId: string) =>
      fetcher(`labels/${labelId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', id] });
      toast.success('Label deleted');
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="h-8 w-60 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse mb-8" />
        <SettingsSkeleton />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto dark:bg-[#0b1120]">
      <h1 className="text-2xl font-bold text-slate-900 mb-8 dark:text-white">
        {workspace?.name} — Settings
      </h1>

      {/* Invite */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 mb-6 dark:bg-white/[0.03] dark:border-white/10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
          <Mail className="w-5 h-5 text-blue-600" />
          Invite Members
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            inviteMutation.mutate(inviteEmail);
          }}
          className="flex gap-3"
        >
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={inviteMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            Send Invite
          </button>
        </form>
        {inviteMutation.isError && (
          <p className="text-red-600 text-sm mt-2">{inviteMutation.error.message}</p>
        )}
        {inviteMutation.isSuccess && (
          <p className="text-green-600 text-sm mt-2">Invitation sent!</p>
        )}
      </section>

      {/* Pending invitations */}
      {invitations && invitations.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 mb-6 dark:bg-white/[0.03] dark:border-white/10">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Pending Invitations</h2>
          <div className="space-y-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 dark:border-white/5"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{inv.email}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Invited by {inv.invitedBy.name}
                  </p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full dark:bg-amber-500/20 dark:text-amber-400">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Members */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 mb-6 dark:bg-white/[0.03] dark:border-white/10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
          <Users className="w-5 h-5 text-blue-600" />
          Members ({workspace?.members.length})
        </h2>
        <div className="space-y-3">
          {workspace?.members.map((member) => {
            const RoleIcon = roleIcons[member.role];
            return (
              <div
                key={member.id}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 dark:border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-medium dark:bg-blue-500/10 dark:text-blue-400">
                    {member.user.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {member.user.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{member.user.email}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-slate-500 capitalize dark:text-slate-400">
                  <RoleIcon className="w-3.5 h-3.5" />
                  {member.role.toLowerCase()}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Labels */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 mb-6 dark:bg-white/[0.03] dark:border-white/10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
          <Tag className="w-5 h-5 text-blue-600" />
          Labels
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!labelName.trim()) return;
            createLabel.mutate({ name: labelName.trim(), color: labelColor });
          }}
          className="flex flex-col gap-3 mb-4"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              placeholder="Label name"
              required
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={createLabel.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 text-sm"
            >
              Add Label
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Color:</span>
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setLabelColor(color)}
                className={`w-6 h-6 rounded-full transition-all ${
                  labelColor === color
                    ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900'
                    : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </form>
        {labels && labels.length > 0 && (
          <div className="space-y-2 border-t border-slate-100 dark:border-white/5 pt-4">
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center justify-between py-1.5"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {label.name}
                  </span>
                </div>
                <button
                  onClick={() => deleteLabel.mutate(label.id)}
                  className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {labels && labels.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">No labels yet. Create one above.</p>
        )}
      </section>

      {/* Billing */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 dark:bg-white/[0.03] dark:border-white/10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Plan & Billing
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Current plan:{' '}
              <span className="text-blue-600">
                {workspace?.subscription?.status === 'ACTIVE' ? 'Pro' : 'Free'}
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
              {workspace?.subscription?.status === 'ACTIVE'
                ? 'Unlimited members and workspaces'
                : 'Up to 5 members, 1 workspace'}
            </p>
          </div>
          {workspace?.subscription?.status !== 'ACTIVE' && (
            <Link
              href={`/workspaces/${id}/billing`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Upgrade to Pro
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
