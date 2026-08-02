'use client';

import { useEffect, useState } from 'react';
import type { AlertRecord, RouteSetting } from '@/lib/alerts/types';
import type { AlertDraft } from '@/lib/canvas/types';
import { HistoryTable } from './HistoryTable';
import { NotionCsvImport } from './NotionCsvImport';
import { RouteSuggestions } from './RouteSuggestions';
import { StatsPanels } from './StatsPanels';

export function AlertsDashboard({ onLoadSnapshot }: { onLoadSnapshot(snapshot: AlertDraft): void }) {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [routeSettings, setRouteSettings] = useState<RouteSetting[]>([]);
  const [configured, setConfigured] = useState(true);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setStatus('');
    try {
      const [alertsResponse, settingsResponse] = await Promise.all([
        fetch('/api/alerts', { cache: 'no-store' }),
        fetch('/api/route-settings', { cache: 'no-store' })
      ]);
      const alertsPayload = (await alertsResponse.json()) as { alerts?: AlertRecord[]; configured?: false; error?: string };
      const settingsPayload = (await settingsResponse.json()) as { settings?: RouteSetting[]; configured?: false; error?: string };

      if (alertsPayload.configured === false || settingsPayload.configured === false) {
        setConfigured(false);
        setAlerts([]);
        setRouteSettings([]);
        setStatus('Supabase nao configurado. O gerador continua funcionando, mas dashboard, historico, importacao CSV e status de envio ficam desativados.');
        return;
      }
      if (!alertsResponse.ok) throw new Error(alertsPayload.error || 'Falha ao carregar alertas.');
      if (!settingsResponse.ok) throw new Error(settingsPayload.error || 'Falha ao carregar rotas.');

      setConfigured(true);
      setAlerts(alertsPayload.alerts || []);
      setRouteSettings(settingsPayload.settings || []);
      setStatus((alertsPayload.alerts || []).length === 0 ? 'Supabase configurado. Nenhum alerta encontrado ainda.' : '');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateAlert(id: string, changes: Partial<AlertRecord>) {
    setStatus('');
    const response = await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes)
    });
    if (response.status === 503) {
      setConfigured(false);
      setStatus('Supabase nao configurado. O gerador continua funcionando, mas dashboard, historico, importacao CSV e status de envio ficam desativados.');
      return;
    }
    const payload = (await response.json()) as { alert?: AlertRecord; error?: string };
    if (!response.ok || !payload.alert) throw new Error(payload.error || 'Falha ao atualizar alerta.');
    setAlerts((current) => current.map((alert) => (alert.id === id ? payload.alert as AlertRecord : alert)));
  }

  async function deleteAlert(alert: AlertRecord) {
    const grouped = alert.par_id ? alerts.filter((item) => item.par_id === alert.par_id) : [alert];
    const label = grouped.length > 1 ? `${grouped.length} registros vinculados` : 'este registro';
    if (!window.confirm(`Excluir ${label}?`)) return;

    setStatus('');
    const response = await fetch('/api/alerts/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', ids: grouped.map((item) => item.id) })
    });
    if (response.status === 503) {
      setConfigured(false);
      setStatus('Supabase nao configurado. O gerador continua funcionando, mas dashboard, historico, importacao CSV e status de envio ficam desativados.');
      return;
    }
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(payload.error || 'Falha ao excluir alerta.');
    const deleted = new Set(grouped.map((item) => item.id));
    setAlerts((current) => current.filter((item) => !deleted.has(item.id)));
  }

  function saveRouteSetting(setting: RouteSetting) {
    setRouteSettings((current) => {
      const exists = current.some((item) => item.route_key === setting.route_key);
      return exists ? current.map((item) => (item.route_key === setting.route_key ? setting : item)) : [...current, setting];
    });
  }

  function addImportedAlerts(imported: AlertRecord[]) {
    setAlerts((current) => [...imported, ...current]);
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-5 text-zinc-900 dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)] sm:px-6">
      <div className="mx-auto grid max-w-[1700px] gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Dashboard de alertas</h1>
            <p className="text-sm text-zinc-500 dark:text-[var(--ecm-blue-muted)]">Acompanhe geracao, envio, historico e rotacao de rotas.</p>
          </div>
          <button type="button" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-bold dark:border-[var(--ecm-blue-border)] dark:text-[var(--ecm-blue-text)]" onClick={() => void load()} disabled={loading}>
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
        </header>

        {status ? (
          <div className={`rounded-md border px-4 py-3 text-sm ${configured ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-[var(--ecm-gold)] dark:bg-[var(--ecm-blue-panel)] dark:text-[var(--ecm-gold)]' : 'border-zinc-200 bg-white text-zinc-600 dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)] dark:text-[var(--ecm-blue-muted)]'}`}>
            {status}
          </div>
        ) : null}

        <NotionCsvImport existingAlerts={alerts} onImported={addImportedAlerts} />
        <StatsPanels alerts={alerts} routeSettings={routeSettings} />
        <RouteSuggestions alerts={alerts} routeSettings={routeSettings} onRouteSettingSaved={saveRouteSetting} />
        <HistoryTable alerts={alerts} onUpdate={updateAlert} onDelete={deleteAlert} onLoadSnapshot={onLoadSnapshot} />
      </div>
    </main>
  );
}
