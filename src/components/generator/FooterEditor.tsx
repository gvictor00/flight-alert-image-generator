'use client';

import { defaultFooters, seatCountFooters } from '@/lib/canvas/default-draft';
import { CANVAS_THEMES } from '@/lib/canvas/themes';
import type { CanvasThemeKey } from '@/lib/canvas/types';

interface FooterEditorProps {
  values: Record<CanvasThemeKey, string>;
  presets: Record<CanvasThemeKey, FooterPreset>;
  onPresetChange: (theme: CanvasThemeKey, preset: FooterPreset, value: string) => void;
  onTextChange: (theme: CanvasThemeKey, value: string) => void;
}

export type FooterPreset = 'default' | 'seats' | 'custom';

const textareaClass = 'min-h-24 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-relaxed text-zinc-900 dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)] dark:placeholder:text-[var(--ecm-blue-muted)]';
const selectClass = 'rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs font-semibold text-zinc-900 dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]';

export function FooterEditor({ values, presets, onPresetChange, onTextChange }: FooterEditorProps) {
  function applyPreset(theme: CanvasThemeKey, preset: FooterPreset) {
    if (preset === 'custom') {
      onPresetChange(theme, preset, values[theme]);
      return;
    }
    const presetValues = preset === 'seats' ? seatCountFooters() : defaultFooters();
    onPresetChange(theme, preset, presetValues[theme]);
  }

  return (
    <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]">
      <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-900 dark:text-[var(--ecm-blue-text)]">Rodapés</h2>
      {CANVAS_THEMES.map((theme) => (
        <div key={theme.key} className="grid gap-2 rounded-md border border-zinc-200 p-3 dark:border-[var(--ecm-blue-border)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{theme.name}</span>
            <select className={selectClass} value={presets[theme.key]} onChange={(event) => applyPreset(theme.key, event.target.value as FooterPreset)}>
              <option value="default">1 passageiro</option>
              <option value="seats">Vagas entre parênteses</option>
              <option value="custom">Manual</option>
            </select>
          </div>
          <textarea className={textareaClass} value={values[theme.key]} onChange={(event) => onTextChange(theme.key, event.target.value)} />
        </div>
      ))}
    </section>
  );
}
