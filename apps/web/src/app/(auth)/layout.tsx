import { ThemeToggle } from '@/components/theme-toggle';
import { Kanban } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b1120]">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Kanban className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white">TeamBoard</span>
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md px-4">{children}</div>
      </div>
    </div>
  );
}
