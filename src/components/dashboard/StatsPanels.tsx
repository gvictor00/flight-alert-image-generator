'use client';

import { buildDashboardStats, DAILY_GOALS } from '@/lib/alerts/dashboard';
import type { AlertRecord, RouteSetting } from '@/lib/alerts/types';

const panelClass = 'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]';

export function StatsPanels({ alerts, routeSettings }: { alerts: AlertRecord[]; routeSettings: RouteSetting[] }) {
  const stats = buildDashboardStats(alerts, routeSettings);

  return (
    <section className="grid gap-3 xl:grid-cols-[repeat(3,minmax(0,1fr))]">
      <div className={panelClass}>
        <p className="text-xs font-bold uppercase text-zinc-500">Gerados hoje</p>
        <p className="mt-1 text-3xl font-black">{stats.generatedToday}</p>
      </div>
      <div className={panelClass}>
        <p className="text-xs font-bold uppercase text-zinc-500">Gerados em 7 dias</p>
        <p className="mt-1 text-3xl font-black">{stats.generatedThisWeek}</p>
      </div>
      <div className={panelClass}>
        <p className="text-xs font-bold uppercase text-zinc-500">Rotas vencidas</p>
        <p className="mt-1 text-3xl font-black">{stats.overdueRoutes}</p>
      </div>
      <div className={`${panelClass} xl:col-span-3`}>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {Object.keys(DAILY_GOALS).map((group) => {
            const item = stats.groups[group as keyof typeof stats.groups];
            return (
              <div key={group} className="rounded-md border border-zinc-200 p-3 dark:border-[var(--ecm-blue-border)]">
                <p className="min-h-8 text-xs font-bold uppercase text-zinc-500">{group}</p>
                <p className="mt-2 text-sm">
                  Hoje: <strong>{item.generatedToday}</strong> / {item.goal}
                </p>
                <p className="text-sm">
                  Enviados: <strong>{item.sentToday}</strong>
                </p>
                <p className="text-sm">
                  Total: <strong>{item.total}</strong>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
