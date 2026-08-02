'use client';

import { useEffect, useMemo, useState } from 'react';
import { inferIataFromCity } from '@/lib/canvas/airports';
import type { AlertDraft, JourneyLeg, PriceBand } from '@/lib/canvas/types';

interface WhatsAppTextPanelProps {
  draft: AlertDraft;
  onMessage: (message: string) => void;
}

const textareaClass = 'min-h-56 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm leading-relaxed text-zinc-900 dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)] dark:placeholder:text-[var(--ecm-blue-muted)]';

function routeLine(leg: JourneyLeg) {
  const originIata = inferIataFromCity(leg.origin);
  const destinationIata = inferIataFromCity(leg.destination);
  const origin = originIata ? `${leg.origin} (${originIata})` : leg.origin;
  const destination = destinationIata ? `${leg.destination} (${destinationIata})` : leg.destination;
  return `${origin} - ${destination}`;
}

function cleanMilesLine(line: string) {
  return line
    .replace(/\s*\+\s*(?:R\$\s*)?\d+(?:[,.]\d+)?\s*(?:USD|BRL|EUR|R\$)?\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function milesLines(bands: PriceBand[]) {
  const seen = new Set<string>();
  return bands
    .flatMap((band) => band.miles.split('\n'))
    .map((line) => cleanMilesLine(line))
    .filter(Boolean)
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function buildWhatsAppText(draft: AlertDraft) {
  const routes = [routeLine(draft.outbound)];
  if (draft.tripMode === 'round-trip') routes.push(routeLine(draft.inbound));

  const bands = draft.tripMode === 'round-trip' ? [...draft.outbound.bands, ...draft.inbound.bands] : draft.outbound.bands;
  const miles = milesLines(bands);

  return [`*${draft.title.trim()}*`, ...routes, '', ...miles].join('\n').trim();
}

export function WhatsAppTextPanel({ draft, onMessage }: WhatsAppTextPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const generatedText = useMemo(() => buildWhatsAppText(draft), [draft]);
  const [text, setText] = useState(generatedText);

  useEffect(() => {
    setText(generatedText);
  }, [generatedText]);

  async function copyText() {
    await navigator.clipboard.writeText(text);
    onMessage('Texto copiado para o WhatsApp.');
  }

  return (
    <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]">
      <button type="button" className="flex items-center justify-between text-left text-sm font-bold uppercase tracking-wide text-zinc-900 dark:text-[var(--ecm-blue-text)]" onClick={() => setCollapsed((current) => !current)} aria-expanded={!collapsed}>
        <span>Texto para WhatsApp</span>
        <span className="text-base leading-none">{collapsed ? '+' : '-'}</span>
      </button>

      {collapsed ? null : (
        <>
          <textarea className={textareaClass} value={text} onChange={(event) => setText(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-bold text-white dark:bg-[var(--ecm-gold)] dark:text-[var(--ecm-blue-bg)]" onClick={copyText}>
              Copiar texto
            </button>
            <button type="button" className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-bold dark:border-[var(--ecm-blue-border)]" onClick={() => setText(generatedText)}>
              Regenerar
            </button>
          </div>
        </>
      )}
    </section>
  );
}
