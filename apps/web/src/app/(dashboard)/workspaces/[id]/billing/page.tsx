'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useParams, useSearchParams } from 'next/navigation';
import { Check, CreditCard, Loader2 } from 'lucide-react';

export default function BillingPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { fetcher } = useApi();
  const success = searchParams.get('success');

  const { data: subscription } = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => fetcher(`workspaces/${id}/subscription`),
  });

  const checkout = useMutation({
    mutationFn: () => fetcher(`workspaces/${id}/checkout`, { method: 'POST' }),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  return (
    <div className="p-8 max-w-3xl mx-auto dark:bg-[#0b1120]">
      <h1 className="text-2xl font-bold text-slate-900 mb-8 dark:text-white">Plan & Billing</h1>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3 dark:bg-green-500/10 dark:border-green-500/20">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-green-700 font-medium dark:text-green-400">
            Successfully upgraded to Pro! Enjoy unlimited features.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div
          className={`border rounded-xl p-6 ${
            subscription?.status !== 'ACTIVE'
              ? 'border-blue-300 bg-blue-50/30 dark:border-blue-500/30 dark:bg-blue-500/10'
              : 'border-slate-200 bg-white dark:border-white/5 dark:bg-white/[0.03]'
          }`}
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Free</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2 dark:text-white">
            $0<span className="text-sm font-normal text-slate-500 dark:text-slate-400">/month</span>
          </p>
          <ul className="mt-6 space-y-3">
            {['1 workspace', 'Up to 5 members', 'Unlimited boards', 'Unlimited tasks'].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Check className="w-4 h-4 text-green-500" />
                {f}
              </li>
            ))}
          </ul>
          {subscription?.status !== 'ACTIVE' && (
            <div className="mt-6 text-center text-sm text-blue-600 font-medium dark:text-blue-400">
              Current plan
            </div>
          )}
        </div>

        {/* Pro Plan */}
        <div
          className={`border rounded-xl p-6 ${
            subscription?.status === 'ACTIVE'
              ? 'border-blue-300 bg-blue-50/30 dark:border-blue-500/30 dark:bg-blue-500/10'
              : 'border-slate-200 bg-white dark:border-white/5 dark:bg-white/[0.03]'
          }`}
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Pro</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2 dark:text-white">
            $12<span className="text-sm font-normal text-slate-500 dark:text-slate-400">/month</span>
          </p>
          <ul className="mt-6 space-y-3">
            {[
              'Unlimited workspaces',
              'Unlimited members',
              'Unlimited boards',
              'Priority support',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Check className="w-4 h-4 text-green-500" />
                {f}
              </li>
            ))}
          </ul>
          {subscription?.status === 'ACTIVE' ? (
            <div className="mt-6 text-center text-sm text-blue-600 font-medium dark:text-blue-400">
              Current plan
            </div>
          ) : (
            <button
              onClick={() => checkout.mutate()}
              disabled={checkout.isPending}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {checkout.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
