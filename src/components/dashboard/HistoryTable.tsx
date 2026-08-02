'use client';

import { useMemo, useState } from 'react';
import { ALERT_GROUPS, type AlertGroup, type AlertRecord } from '@/lib/alerts/types';
import { dashTodayStr } from '@/lib/alerts/normalization';
import { matchesAlertSearch } from '@/lib/alerts/dashboard';
import type { AlertDraft } from '@/lib/canvas/types';

const inputClass = 'w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]';

function snapshotFromAlert(alert: AlertRecord): AlertDraft | null {
  if (!alert.card_data) return null;
  try {
    const value = typeof alert.card_data === 'string' ? JSON.parse(alert.card_data) : alert.card_data;
    if (value && typeof value === 'object' && 'outbound' in value && 'typography' in value) return value as AlertDraft;
  } catch {}
  return null;
}

export function HistoryTable({
  alerts,
  onUpdate,
  onDelete,
  onLoadSnapshot
}: {
  alerts: AlertRecord[];
  onUpdate(id: string, changes: Partial<AlertRecord>): Promise<void>;
  onDelete(alert: AlertRecord): Promise<void>;
  onLoadSnapshot(snapshot: AlertDraft): void;
}) {
  const [period, setPeriod] = useState<'today' | 'all'>('today');
  const [group, setGroup] = useState<AlertGroup | 'all'>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<AlertRecord>>({});
  const today = dashTodayStr();

  const visibleAlerts = useMemo(() => {
    return alerts
      .filter((alert) => period === 'all' || alert.data === today)
      .filter((alert) => group === 'all' || alert.grupo === group)
      .filter((alert) => matchesAlertSearch(alert, search))
      .sort((a, b) => `${b.data}-${b.created_at || ''}`.localeCompare(`${a.data}-${a.created_at || ''}`));
  }, [alerts, group, period, search, today]);

  function startEdit(alert: AlertRecord) {
    setEditingId(alert.id);
    setDraft({
      origem: alert.origem,
      destino: alert.destino,
      cia: alert.cia,
      programa: alert.programa,
      grupo: alert.grupo
    });
  }

  async function saveEdit(id: string) {
    await onUpdate(id, draft);
    setEditingId(null);
    setDraft({});
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Historico de alertas</h2>
          <p className="text-sm text-zinc-500">{visibleAlerts.length} registros filtrados</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className={inputClass} value={period} onChange={(event) => setPeriod(event.target.value as 'today' | 'all')}>
            <option value="today">Hoje</option>
            <option value="all">Todos</option>
          </select>
          <select className={inputClass} value={group} onChange={(event) => setGroup(event.target.value as AlertGroup | 'all')}>
            <option value="all">Todos os grupos</option>
            {ALERT_GROUPS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <input className={`${inputClass} min-w-60`} placeholder="Buscar rota, cia ou programa" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr className="border-b border-zinc-200 dark:border-[var(--ecm-blue-border)]">
              <th className="py-2 pr-3">Data</th>
              <th className="py-2 pr-3">Origem</th>
              <th className="py-2 pr-3">Destino</th>
              <th className="py-2 pr-3">Cia</th>
              <th className="py-2 pr-3">Programa</th>
              <th className="py-2 pr-3">Grupo</th>
              <th className="py-2 pr-3">Env.</th>
              <th className="py-2 pr-3">Card</th>
              <th className="py-2">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {visibleAlerts.map((alert) => {
              const editing = editingId === alert.id;
              const snapshot = snapshotFromAlert(alert);
              return (
                <tr key={alert.id} className="border-b border-zinc-100 align-top dark:border-[var(--ecm-blue-border)]">
                  <td className="py-2 pr-3">{alert.data}</td>
                  <td className="py-2 pr-3">{editing ? <input className={inputClass} value={draft.origem || ''} onChange={(event) => setDraft((current) => ({ ...current, origem: event.target.value }))} /> : alert.origem}</td>
                  <td className="py-2 pr-3">{editing ? <input className={inputClass} value={draft.destino || ''} onChange={(event) => setDraft((current) => ({ ...current, destino: event.target.value }))} /> : alert.destino}</td>
                  <td className="py-2 pr-3">{editing ? <input className={inputClass} value={draft.cia || ''} onChange={(event) => setDraft((current) => ({ ...current, cia: event.target.value }))} /> : alert.cia}</td>
                  <td className="max-w-80 py-2 pr-3">{editing ? <textarea className={inputClass} value={draft.programa || ''} onChange={(event) => setDraft((current) => ({ ...current, programa: event.target.value }))} /> : alert.programa}</td>
                  <td className="py-2 pr-3">
                    {editing ? (
                      <select className={inputClass} value={draft.grupo || alert.grupo} onChange={(event) => setDraft((current) => ({ ...current, grupo: event.target.value as AlertGroup }))}>
                        {ALERT_GROUPS.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    ) : (
                      alert.grupo
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <input type="checkbox" checked={alert.enviado} onChange={(event) => void onUpdate(alert.id, { enviado: event.target.checked })} />
                  </td>
                  <td className="py-2 pr-3">
                    {alert.image_url ? (
                      <a className="font-bold text-blue-700 dark:text-[var(--ecm-blue-accent)]" href={alert.image_url} target="_blank" rel="noreferrer">Abrir</a>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      {editing ? (
                        <>
                          <button type="button" className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-bold text-white dark:bg-[var(--ecm-gold)] dark:text-[var(--ecm-blue-bg)]" onClick={() => void saveEdit(alert.id)}>Salvar</button>
                          <button type="button" className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-bold dark:border-[var(--ecm-blue-border)]" onClick={() => setEditingId(null)}>Cancelar</button>
                        </>
                      ) : (
                        <button type="button" className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-bold dark:border-[var(--ecm-blue-border)]" onClick={() => startEdit(alert)}>Editar</button>
                      )}
                      <button type="button" className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-bold dark:border-[var(--ecm-blue-border)] disabled:opacity-40" disabled={!snapshot} onClick={() => snapshot && onLoadSnapshot(snapshot)}>Carregar</button>
                      <button type="button" className="rounded-md border border-red-300 px-2 py-1 text-xs font-bold text-red-700 dark:border-red-800 dark:text-red-300" onClick={() => void onDelete(alert)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
