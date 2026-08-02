'use client';

import { useState } from 'react';
import type { TypographySettings } from '@/lib/canvas/types';

interface TypographyControlsProps {
  value: TypographySettings;
  onChange: (value: TypographySettings) => void;
  onReset: () => void;
  onSaveDefault: () => void;
}

const rows: Array<{ label: string; sizeKey: keyof TypographySettings; boldKey: keyof TypographySettings }> = [
  { label: 'Cabeçalho', sizeKey: 'headerSize', boldKey: 'headerBold' },
  { label: 'Título da rota', sizeKey: 'routeSize', boldKey: 'routeBold' },
  { label: 'Milhas / preço', sizeKey: 'milesSize', boldKey: 'milesBold' },
  { label: 'Datas', sizeKey: 'datesSize', boldKey: 'datesBold' },
  { label: 'Rodapé', sizeKey: 'footerSize', boldKey: 'footerBold' }
];

const inputClass = 'w-20 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]';

export function TypographyControls({ value, onChange, onReset, onSaveDefault }: TypographyControlsProps) {
  const [collapsed, setCollapsed] = useState(true);

  function setNumber(key: keyof TypographySettings, raw: string) {
    const next = Number(raw);
    if (Number.isFinite(next)) onChange({ ...value, [key]: next });
  }

  return (
    <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]">
      <button type="button" className="flex items-center justify-between text-left text-sm font-bold uppercase tracking-wide text-zinc-900 dark:text-[var(--ecm-blue-text)]" onClick={() => setCollapsed((current) => !current)}>
        <span>Ajustes finos</span>
        <span className="text-base leading-none">{collapsed ? '+' : '-'}</span>
      </button>

      {collapsed ? null : (
        <>
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-zinc-100 pb-2 text-sm last:border-b-0 dark:border-[var(--ecm-blue-border)]">
              <span>{row.label}</span>
              <input className={inputClass} type="number" value={value[row.sizeKey] as number} onChange={(event) => setNumber(row.sizeKey, event.target.value)} />
              <label className="flex items-center gap-2 text-xs text-zinc-500">
                <input type="checkbox" checked={value[row.boldKey] as boolean} onChange={(event) => onChange({ ...value, [row.boldKey]: event.target.checked })} />
                Negrito
              </label>
            </div>
          ))}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-xs text-zinc-500">
              Espaço após cabeçalho
              <input className={inputClass} type="number" value={value.headerRouteGap} onChange={(event) => setNumber('headerRouteGap', event.target.value)} />
            </label>
            <label className="grid gap-1 text-xs text-zinc-500">
              Espaço entre datas
              <input className={inputClass} type="number" step="0.05" value={value.datesLineHeight} onChange={(event) => setNumber('datesLineHeight', event.target.value)} />
            </label>
            <label className="grid gap-1 text-xs text-zinc-500">
              Espaço entre milhas
              <input className={inputClass} type="number" step="0.05" value={value.milesLineHeight} onChange={(event) => setNumber('milesLineHeight', event.target.value)} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-bold dark:border-[var(--ecm-blue-border)]" onClick={onReset}>
              Restaurar medidas
            </button>
            <button type="button" className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-bold dark:border-[var(--ecm-blue-border)]" onClick={onSaveDefault}>
              Salvar como padrão
            </button>
          </div>
        </>
      )}
    </section>
  );
}
