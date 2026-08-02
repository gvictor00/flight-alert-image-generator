'use client';

import { useState } from 'react';
import { buildRouteSuggestions, type RouteSummary } from '@/lib/alerts/dashboard';
import type { AlertRecord, RouteSetting } from '@/lib/alerts/types';

const panelClass = 'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]';
const inputClass = 'rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]';

function RouteList({ title, routes }: { title: string; routes: RouteSummary[] }) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-wide">{title}</h3>
      <div className="mt-2 grid gap-2">
        {routes.length ? (
          routes.slice(0, 8).map((route) => (
            <div key={route.key} className="rounded-md border border-zinc-200 p-2 text-sm dark:border-[var(--ecm-blue-border)]">
              <div className="flex items-center justify-between gap-2">
                <strong>{route.origin} - {route.destination}</strong>
                <span className="text-xs text-zinc-500">{route.daysSinceLast} dias</span>
              </div>
              <p className="text-xs text-zinc-500">
                {route.total} cards, {route.sentTotal} enviados
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-500">Sem itens no momento.</p>
        )}
      </div>
    </div>
  );
}

export function RouteSuggestions({
  alerts,
  routeSettings,
  onRouteSettingSaved
}: {
  alerts: AlertRecord[];
  routeSettings: RouteSetting[];
  onRouteSettingSaved(setting: RouteSetting): void;
}) {
  const [routeKey, setRouteKey] = useState('');
  const [minDays, setMinDays] = useState(10);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const suggestions = buildRouteSuggestions(alerts, routeSettings);

  async function saveSetting() {
    if (!routeKey.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/route-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route_key: routeKey.trim().toUpperCase(), min_days: minDays })
      });
      if (response.status === 503) {
        setMessage('Banco de dados nao configurado.');
        return;
      }
      const payload = (await response.json()) as { setting?: RouteSetting; error?: string };
      if (!response.ok || !payload.setting) throw new Error(payload.error || 'Falha ao salvar rota.');
      onRouteSettingSaved(payload.setting);
      setMessage('Intervalo salvo.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao salvar rota.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Sugestoes de rotas</h2>
          <p className="text-sm text-zinc-500">Rotas vencidas, baixa variedade e candidatos para rotacao.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-semibold text-zinc-500">
            Rota
            <input className={inputClass} placeholder="GRU-MAD" value={routeKey} onChange={(event) => setRouteKey(event.target.value)} />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-zinc-500">
            Dias min.
            <input className={`${inputClass} w-20`} type="number" min={1} max={365} value={minDays} onChange={(event) => setMinDays(Number(event.target.value))} />
          </label>
          <button type="button" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-50 dark:bg-[var(--ecm-gold)] dark:text-[var(--ecm-blue-bg)]" onClick={saveSetting} disabled={saving}>
            Salvar
          </button>
        </div>
      </div>
      {message ? <p className="mt-2 text-sm text-zinc-500">{message}</p> : null}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <RouteList title="Vencidas" routes={suggestions.stale} />
        <RouteList title="Baixa variedade" routes={suggestions.variety} />
        <RouteList title="Rotacao" routes={suggestions.rotation} />
      </div>
    </section>
  );
}
