'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const { status } = useSession();
  const router = useRouter();
  const { fetcher } = useApi();

  const acceptMutation = useMutation({
    mutationFn: () =>
      fetcher('invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/invite/${token}`);
      return;
    }
    if (status === 'authenticated' && !acceptMutation.isSuccess && !acceptMutation.isError && !acceptMutation.isPending) {
      acceptMutation.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (status === 'loading' || acceptMutation.isPending) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-600">Accepting invitation...</p>
      </div>
    );
  }

  if (acceptMutation.isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <XCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Invitation Failed</h1>
        <p className="text-slate-500 mb-6">{acceptMutation.error.message}</p>
        <Link
          href="/workspaces"
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium"
        >
          Go to Workspaces
        </Link>
      </div>
    );
  }

  if (acceptMutation.isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Invitation Accepted!</h1>
        <p className="text-slate-500 mb-6">You&apos;ve been added to the workspace.</p>
        <Link
          href={`/workspaces/${acceptMutation.data.workspaceId}`}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium"
        >
          Go to Workspace
        </Link>
      </div>
    );
  }

  return null;
}
