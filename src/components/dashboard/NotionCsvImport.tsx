'use client';

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import { normalizeAlertText } from '@/lib/alerts/normalization';
import { rowsToAlertRecords, type NotionCsvRow } from '@/lib/alerts/notion-csv';
import type { AlertRecord } from '@/lib/alerts/types';

const operators = ['Jose', 'Lucas', 'Anderson', 'Ana'] as const;
const inputClass = 'rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]';

function dedupeKey(record: Pick<AlertRecord, 'origem' | 'destino' | 'data' | 'programa'>) {
  return [record.origem, record.destino, record.data, record.programa].map((value) => normalizeAlertText(value || '')).join('|');
}

export function NotionCsvImport({
  existingAlerts,
  onImported
}: {
  existingAlerts: AlertRecord[];
  onImported(alerts: AlertRecord[]): void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [author, setAuthor] = useState<(typeof operators)[number]>(() => operators[0]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function importFile(file: File) {
    setBusy(true);
    setMessage('');
    Papa.parse<NotionCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        try {
          const existing = new Set(existingAlerts.map(dedupeKey));
          const seen = new Set<string>();
          const records = rowsToAlertRecords(result.data, author).filter((record) => {
            const key = dedupeKey({ ...record, data: record.data || '' });
            if (existing.has(key) || seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          if (!records.length) {
            setMessage('Nenhuma linha nova para importar.');
            return;
          }

          const response = await fetch('/api/alerts/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'insert', records })
          });
          if (response.status === 503) {
            setMessage('Banco de dados nao configurado. Importe novamente quando o historico estiver ativo.');
            return;
          }
          const payload = (await response.json()) as { alerts?: AlertRecord[]; error?: string };
          if (!response.ok || !payload.alerts) throw new Error(payload.error || 'Falha ao importar CSV.');
          onImported(payload.alerts);
          setMessage(`${payload.alerts.length} alertas importados.`);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Falha ao importar CSV.');
        } finally {
          setBusy(false);
          if (inputRef.current) inputRef.current.value = '';
        }
      },
      error: (error) => {
        setMessage(error.message || 'Falha ao ler CSV.');
        setBusy(false);
      }
    });
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Importar CSV do Notion</h2>
          <p className="text-sm text-zinc-500">Importa rotas, datas e valores para o historico.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-semibold text-zinc-500">
            Operador
            <select className={inputClass} value={author} onChange={(event) => setAuthor(event.target.value as (typeof operators)[number])}>
              {operators.map((operator) => (
                <option key={operator} value={operator}>{operator}</option>
              ))}
            </select>
          </label>
          <input ref={inputRef} className="hidden" type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && void importFile(event.target.files[0])} />
          <button type="button" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50 dark:bg-[var(--ecm-gold)] dark:text-[var(--ecm-blue-bg)]" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? 'Importando...' : 'Importar CSV do Notion'}
          </button>
        </div>
      </div>
      {message ? <p className="mt-2 text-sm text-zinc-500">{message}</p> : null}
    </section>
  );
}
