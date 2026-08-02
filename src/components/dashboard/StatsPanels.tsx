'use client';

import { buildDashboardStats, DAILY_GOALS } from '@/lib/alerts/dashboard';
import type { AlertGroup, AlertRecord, RouteSetting } from '@/lib/alerts/types';

const panelClass = 'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]';

export function StatsPanels({ alerts, periodAlerts, routeSettings }: { alerts: AlertRecord[]; periodAlerts: AlertRecord[]; routeSettings: RouteSetting[] }) {
  const stats = buildDashboardStats(alerts, routeSettings);
  const sentInPeriodByGroup = periodAlerts.reduce<Record<string, number>>((acc, alert) => {
    if (alert.enviado) acc[alert.grupo] = (acc[alert.grupo] || 0) + 1;
    return acc;
  }, {});

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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-2 pr-3">Grupo</th>
                <th className="py-2 pr-3">Gerados hoje</th>
                <th className="py-2 pr-3">Enviados hoje</th>
                <th className="py-2 pr-3">Gerados total</th>
                <th className="py-2 pr-3">Enviados periodo</th>
                <th className="py-2">Meta hoje</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(DAILY_GOALS).map((group) => {
                const typedGroup = group as AlertGroup;
                const item = stats.groups[typedGroup];
                return (
                  <tr key={group} className="border-t border-zinc-100 dark:border-[var(--ecm-blue-border)]">
                    <td className="py-2 pr-3 font-bold">{group}</td>
                    <td className="py-2 pr-3">{item.generatedToday}</td>
                    <td className="py-2 pr-3">{item.sentToday}</td>
                    <td className="py-2 pr-3">{item.total}</td>
                    <td className="py-2 pr-3">{sentInPeriodByGroup[group] || 0}</td>
                    <td className="py-2">{item.goal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
