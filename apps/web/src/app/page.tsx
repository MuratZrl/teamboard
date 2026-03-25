import Link from 'next/link';
import {
  Users,
  Zap,
  Shield,
  Check,
  ArrowRight,
  Star,
  Kanban,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const features = [
  {
    icon: Kanban,
    title: 'Kanban Boards',
    description: 'Drag & drop tasks across columns. Todo, In Progress, Review, Done — ready out of the box.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite members via email, assign tasks, and manage roles with granular permissions.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Shield,
    title: 'Tenant Isolation',
    description: 'Every workspace is a fortress. Complete data isolation between organizations.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'No bloat. Create a workspace, add a board, start shipping — all under a minute.',
    gradient: 'from-amber-500 to-orange-500',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Engineering Lead at Acme',
    text: 'TeamBoard replaced our bloated PM tool. The simplicity is refreshing — my team actually uses it.',
    avatar: 'SC',
  },
  {
    name: 'Marcus Rivera',
    role: 'Founder at LaunchPad',
    text: 'We set up our workspace in 5 minutes and were tracking tasks immediately. No training needed.',
    avatar: 'MR',
  },
  {
    name: 'Ayesha Patel',
    role: 'Product Manager at CloudSync',
    text: 'The multi-tenant setup means I manage 3 client projects without any data leaking between them.',
    avatar: 'AP',
  },
];

const stats = [
  { value: '10k+', label: 'Tasks created' },
  { value: '500+', label: 'Teams' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<50ms', label: 'API response' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1120] overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#0b1120]/80 border-b border-slate-200/60 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Kanban className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">TeamBoard</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-[#0b1120]" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center px-6 pt-24 pb-20">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <Zap className="w-3.5 h-3.5" />
            Now in public beta
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Project management{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              your team will
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              actually use
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mt-6 max-w-2xl mx-auto leading-relaxed">
            Simple kanban boards, isolated team workspaces, and task management
            that gets out of your way. No bloat, no complexity — just ship.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-semibold text-lg shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all"
            >
              Start for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#pricing"
              className="px-8 py-3.5 border border-slate-300 dark:border-white/10 rounded-xl font-semibold text-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg max-w-2xl mx-auto">
              Built for teams who want to move fast without drowning in features.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative bg-white dark:bg-white/[0.03] rounded-2xl p-8 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all hover:shadow-lg dark:hover:shadow-2xl"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Board Preview */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-6 md:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden">
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: 'Todo', color: 'bg-slate-400', tasks: ['Design landing page', 'Write API docs', 'Setup CI/CD'] },
                { name: 'In Progress', color: 'bg-blue-500', tasks: ['Auth module', 'Kanban drag & drop'] },
                { name: 'Review', color: 'bg-amber-500', tasks: ['Stripe integration'] },
                { name: 'Done', color: 'bg-emerald-500', tasks: ['Database schema', 'Project scaffold', 'JWT auth'] },
              ].map((col) => (
                <div key={col.name} className="min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.name}</span>
                    <span className="text-xs bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                      {col.tasks.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {col.tasks.map((task) => (
                      <div
                        key={task}
                        className="bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/5 rounded-lg p-3 shadow-sm"
                      >
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{task}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                            medium
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-slate-50 dark:bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg">
              Start free. Upgrade when your team grows.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Free</h3>
              <p className="text-4xl font-bold text-slate-900 dark:text-white mt-4">
                $0<span className="text-base font-normal text-slate-500 dark:text-slate-400">/month</span>
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">For small teams getting started</p>
              <ul className="mt-8 space-y-3">
                {['1 workspace', 'Up to 5 members', 'Unlimited boards', 'Unlimited tasks', 'Email invitations'].map(
                  (f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ),
                )}
              </ul>
              <Link
                href="/register"
                className="mt-8 block text-center w-full py-3 border border-slate-300 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="relative bg-white dark:bg-white/[0.03] border-2 border-blue-600 dark:border-blue-500 rounded-2xl p-8">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                Most Popular
              </span>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Pro</h3>
              <p className="text-4xl font-bold text-slate-900 dark:text-white mt-4">
                $12<span className="text-base font-normal text-slate-500 dark:text-slate-400">/month</span>
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">For growing teams that need more</p>
              <ul className="mt-8 space-y-3">
                {[
                  'Unlimited workspaces',
                  'Unlimited members',
                  'Unlimited boards',
                  'Unlimited tasks',
                  'Priority support',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 block text-center w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/25 transition-all"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Trusted by teams everywhere
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-12 md:p-16 text-center">
            <div className="absolute inset-0">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to ship faster?
              </h2>
              <p className="text-blue-100 mb-8 text-lg">
                Create your free workspace in seconds. No credit card required.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
              >
                Start for Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} TeamBoard. All rights reserved.
          </span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
              <Kanban className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">TeamBoard</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
