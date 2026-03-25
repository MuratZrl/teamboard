import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-slate-200 dark:bg-white/10',
        className,
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl p-6">
      <Skeleton className="h-5 w-2/3 mb-4" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function BoardColumnSkeleton() {
  return (
    <div className="w-72 flex-shrink-0 bg-slate-100 dark:bg-white/[0.03] rounded-xl">
      <div className="px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="px-3 pb-3 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-white/[0.03] rounded-lg p-3 border border-slate-200 dark:border-white/5">
            <Skeleton className="h-4 w-full mb-2" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkspaceListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
