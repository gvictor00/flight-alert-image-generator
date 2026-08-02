'use client';

import { buildOperatorStats } from '@/lib/alerts/dashboard-analytics';
import type { AlertRecord } from '@/lib/alerts/types';

const panelClass = 'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]';

function formatLastAlert(value: string) {
  if (!value) return '-';
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function OperatorStatsTable({ alerts, periodAlerts }: { alerts: AlertRecord[]; periodAlerts: AlertRecord[] }) {
  const rows = buildOperatorStats(alerts, periodAlerts);

  return (
    <section className={panelClass}>
      <h2 className="text-lg font-black">Historico por operador</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              <th className="py-2 pr-3">Operador</th>
              <th className="py-2 pr-3">Gerados hoje</th>
              <th className="py-2 pr-3">Enviados hoje</th>
              <th className="py-2 pr-3">Gerados no periodo</th>
              <th className="py-2 pr-3">Enviados no periodo</th>
              <th className="py-2">Ultimo alerta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.operator} className="border-t border-zinc-100 dark:border-[var(--ecm-blue-border)]">
                <td className="py-2 pr-3 font-bold">{row.operator}</td>
                <td className="py-2 pr-3">{row.generatedToday}</td>
                <td className="py-2 pr-3">{row.sentToday}</td>
                <td className="py-2 pr-3">{row.generatedInPeriod}</td>
                <td className="py-2 pr-3">{row.sentInPeriod}</td>
                <td className="py-2">{formatLastAlert(row.lastAlert)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
