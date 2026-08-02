'use client';

import type { PeriodFilter } from '@/lib/alerts/types';

const inputClass = 'rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]';

export function PeriodFilterBar({ value, onChange }: { value: PeriodFilter; onChange(value: PeriodFilter): void }) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="grid gap-1 text-xs font-semibold text-zinc-500 dark:text-[var(--ecm-blue-muted)]">
        Periodo
        <select className={inputClass} value={value.mode} onChange={(event) => onChange({ ...value, mode: event.target.value as PeriodFilter['mode'] })}>
          <option value="today">Hoje</option>
          <option value="7d">Ultimos 7 dias</option>
          <option value="30d">Ultimos 30 dias</option>
          <option value="all">Todos</option>
          <option value="custom">Intervalo</option>
        </select>
      </label>
      {value.mode === 'custom' ? (
        <>
          <label className="grid gap-1 text-xs font-semibold text-zinc-500 dark:text-[var(--ecm-blue-muted)]">
            Inicio
            <input className={inputClass} type="date" value={value.startDate || ''} onChange={(event) => onChange({ ...value, startDate: event.target.value })} />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-zinc-500 dark:text-[var(--ecm-blue-muted)]">
            Fim
            <input className={inputClass} type="date" value={value.endDate || ''} onChange={(event) => onChange({ ...value, endDate: event.target.value })} />
          </label>
        </>
      ) : null}
    </div>
  );
}
