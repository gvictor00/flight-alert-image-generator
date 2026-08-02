'use client';

import type { JourneyLeg } from '@/lib/canvas/types';

interface JourneyLegEditorProps {
  title: string;
  leg: JourneyLeg;
  prefix: string;
  onChange: (leg: JourneyLeg) => void;
}

const inputClass = 'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)] dark:placeholder:text-[var(--ecm-blue-muted)]';
const textareaClass = `${inputClass} min-h-24 resize-y leading-relaxed`;

export function JourneyLegEditor({ title, leg, prefix, onChange }: JourneyLegEditorProps) {
  function updateBand(id: string, field: 'miles' | 'dates', value: string) {
    onChange({
      ...leg,
      bands: leg.bands.map((band) => (band.id === id ? { ...band, [field]: value } : band))
    });
  }

  return (
    <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]">
      <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-900 dark:text-[var(--ecm-blue-text)]">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-semibold text-zinc-500">
          Origem
          <input className={inputClass} value={leg.origin} onChange={(event) => onChange({ ...leg, origin: event.target.value })} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-zinc-500">
          Destino
          <input className={inputClass} value={leg.destination} onChange={(event) => onChange({ ...leg, destination: event.target.value })} />
        </label>
      </div>

      {leg.bands.map((band, index) => (
        <div key={band.id} className="grid gap-3 rounded-md border border-dashed border-zinc-300 p-3 dark:border-[var(--ecm-blue-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">Faixa {index + 1}</span>
            {leg.bands.length > 1 ? (
              <button
                type="button"
                className="text-xs font-semibold text-red-600"
                onClick={() => onChange({ ...leg, bands: leg.bands.filter((item) => item.id !== band.id) })}
              >
                Remover
              </button>
            ) : null}
          </div>
          <label className="grid gap-1 text-xs font-semibold text-zinc-500">
            Opções de milhas
            <textarea className={textareaClass} value={band.miles} onChange={(event) => updateBand(band.id, 'miles', event.target.value)} />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-zinc-500">
            Datas disponíveis
            <textarea className={textareaClass} value={band.dates} onChange={(event) => updateBand(band.id, 'dates', event.target.value)} />
          </label>
        </div>
      ))}

      <button
        type="button"
        className="rounded-md border border-dashed border-zinc-400 px-3 py-2 text-sm font-bold text-zinc-700 dark:border-[var(--ecm-blue-border)] dark:text-[var(--ecm-blue-muted)]"
        onClick={() =>
          onChange({
            ...leg,
            bands: [...leg.bands, { id: `${prefix}-${Date.now()}`, miles: '', dates: '' }]
          })
        }
      >
        + Adicionar faixa
      </button>
    </section>
  );
}
