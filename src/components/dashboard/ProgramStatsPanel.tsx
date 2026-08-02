'use client';

import { useMemo, useState } from 'react';
import { buildProgramStats, filterAlertsByPeriod } from '@/lib/alerts/dashboard-analytics';
import type { AlertRecord, PeriodFilter } from '@/lib/alerts/types';

const panelClass = 'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]';
const selectClass = 'rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]';

export function ProgramStatsPanel({ alerts, sharedPeriod }: { alerts: AlertRecord[]; sharedPeriod: PeriodFilter }) {
  const [mode, setMode] = useState<'shared' | 'today' | '7d' | '30d' | 'all'>('shared');
  const period: PeriodFilter = mode === 'shared' ? sharedPeriod : { mode };
  const stats = useMemo(() => buildProgramStats(filterAlertsByPeriod(alerts, period)), [alerts, period]);

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Por programa de fidelidade</h2>
          <p className="text-sm text-zinc-500 dark:text-[var(--ecm-blue-muted)]">Volume detectado no campo programa.</p>
        </div>
        <select className={selectClass} value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
          <option value="shared">Periodo da dashboard</option>
          <option value="today">Hoje</option>
          <option value="7d">Ultimos 7 dias</option>
          <option value="30d">Ultimos 30 dias</option>
          <option value="all">Todos</option>
        </select>
      </div>
      <div className="mt-4 grid gap-2">
        {stats.length ? (
          stats.map((item) => (
            <div key={item.name} className="grid grid-cols-[150px_1fr_48px] items-center gap-3 text-sm">
              <span className="font-bold">{item.name}</span>
              <span className="h-2 rounded-full bg-zinc-100 dark:bg-[var(--ecm-blue-bg)]">
                <span className="block h-2 rounded-full bg-blue-600 dark:bg-[var(--ecm-gold)]" style={{ width: `${item.percentage}%` }} />
              </span>
              <span className="text-right">{item.count}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-500">Ainda sem dados suficientes.</p>
        )}
      </div>
    </section>
  );
}
