'use client';

import { useMemo, useState } from 'react';
import { buildRouteMatrixRows } from '@/lib/alerts/dashboard-analytics';
import { normalizeAlertText } from '@/lib/alerts/normalization';
import { EXPERIENCIAS_AO_VIVO, type AlertGroup, type AlertRecord, type RouteMatrixRow, type RouteSetting } from '@/lib/alerts/types';

const GROUP_COLUMNS: ReadonlyArray<[AlertGroup, string]> = [
  ['Go Miles Club', 'GMC'],
  ['Executiva com Milhas', 'ECM'],
  ['FirstClass', 'FC'],
  [EXPERIENCIAS_AO_VIVO, 'EAV'],
  ['Milhas Ao Vivo', 'MAV']
];

const panelClass = 'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]';
const inputClass = 'rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]';

function formatDays(value: number | null | undefined) {
  return value === null || value === undefined ? '-' : `${value}d`;
}

function statusClass(status: RouteMatrixRow['status']) {
  if (status === 'Vencida') return 'border-red-300 text-red-700 dark:border-red-800 dark:text-red-300';
  if (status === 'Atenção') return 'border-amber-300 text-amber-700 dark:border-[var(--ecm-gold)] dark:text-[var(--ecm-gold)]';
  return 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300';
}

function rowStaleScore(row: RouteMatrixRow) {
  return Math.max(...Object.values(row.groupDays).map((value) => value ?? 9999));
}

export function RouteMatrixPanel({ alerts, routeSettings, onRouteSettingSaved }: { alerts: AlertRecord[]; routeSettings: RouteSetting[]; onRouteSettingSaved(setting: RouteSetting): void }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'stale' | 'recent' | 'az' | 'count'>('stale');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const rows = useMemo(() => {
    const term = normalizeAlertText(search);
    const base = buildRouteMatrixRows(alerts, routeSettings).filter((row) => !term || normalizeAlertText(`${row.key} ${row.programs.join(' ')}`).includes(term));
    return base.sort((a, b) => {
      const maxA = rowStaleScore(a);
      const maxB = rowStaleScore(b);
      if (sort === 'stale') return maxB - maxA;
      if (sort === 'recent') return maxA - maxB;
      if (sort === 'count') return b.total - a.total;
      return a.key.localeCompare(b.key);
    });
  }, [alerts, routeSettings, search, sort]);

  async function saveMinDays(row: RouteMatrixRow, minDays: number) {
    setSaving(row.key);
    setError('');
    try {
      const response = await fetch('/api/route-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route_key: row.key, min_days: minDays })
      });
      const payload = (await response.json()) as { setting?: RouteSetting; error?: string };
      if (!response.ok || !payload.setting) throw new Error(payload.error || 'Falha ao salvar rota.');
      onRouteSettingSaved(payload.setting);
      setOpenKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar rota.');
    } finally {
      setSaving('');
    }
  }

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Rotas e ultima busca</h2>
          <p className="text-sm text-zinc-500 dark:text-[var(--ecm-blue-muted)]">Ultima busca por grupo e status de recencia.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className={inputClass} placeholder="Buscar rota ou programa" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className={inputClass} value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
            <option value="stale">Mais vencida primeiro</option>
            <option value="recent">Mais recente primeiro</option>
            <option value="az">A-Z</option>
            <option value="count">Mais enviadas</option>
          </select>
        </div>
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}
      <div className="mt-4 max-h-[860px] overflow-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="sticky top-0 bg-white text-xs uppercase text-zinc-500 dark:bg-[var(--ecm-blue-surface)]">
            <tr>
              <th className="py-2 pr-3">Rota</th>
              {GROUP_COLUMNS.map(([, label]) => <th key={label} className="py-2 pr-3">{label}</th>)}
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2">Ajuste</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-zinc-100 dark:border-[var(--ecm-blue-border)]">
                <td className="py-2 pr-3 font-bold">{row.origin} - {row.destination}</td>
                {GROUP_COLUMNS.map(([group]) => <td key={group} className="py-2 pr-3">{formatDays(row.groupDays[group])}</td>)}
                <td className="py-2 pr-3"><span className={`rounded-full border px-2 py-1 text-xs font-bold ${statusClass(row.status)}`}>{row.status}</span></td>
                <td className="py-2 pr-3">{row.total}x</td>
                <td className="py-2">
                  {openKey === row.key ? (
                    <input className={`${inputClass} w-20`} type="number" min={1} max={365} defaultValue={row.minDays} disabled={saving === row.key} onBlur={(event) => void saveMinDays(row, Number(event.target.value) || 10)} />
                  ) : (
                    <button type="button" className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-bold dark:border-[var(--ecm-blue-border)]" onClick={() => setOpenKey(row.key)}>Editar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
