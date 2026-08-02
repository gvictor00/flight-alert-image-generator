'use client';

import { useEffect, useRef, useState } from 'react';
import { loadCanvasAssets } from '@/lib/canvas/assets';
import { renderAlertCanvas } from '@/lib/canvas/render-alert-canvas';
import { renderMavCanvas } from '@/lib/canvas/render-mav-canvas';
import type { AlertDraft, CanvasTheme } from '@/lib/canvas/types';

interface CanvasPreviewCardProps {
  draft: AlertDraft;
  theme: CanvasTheme;
  collapsed: boolean;
  canDownload: boolean;
  photoOverrideSrc?: string;
  onToggle: () => void;
  onDownload: (canvas: HTMLCanvasElement, theme: CanvasTheme) => void;
}

export function CanvasPreviewCard({ draft, theme, collapsed, canDownload, photoOverrideSrc, onToggle, onDownload }: CanvasPreviewCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setReady(false);
      const destination = photoOverrideSrc ? '' : draft.destinationPhotoMode === 'auto' ? draft.outbound.destination : '';
      const manualPhoto = photoOverrideSrc || (draft.destinationPhotoMode === 'manual' ? draft.manualPhotoDataUrl : undefined);
      const assets = await loadCanvasAssets(theme, destination, manualPhoto);
      if (cancelled) return;
      if (theme.key === 'milhasaovivo') renderMavCanvas(canvas, draft, assets);
      else renderAlertCanvas(canvas, draft, theme, assets);
      setReady(true);
    }

    void render();

    return () => {
      cancelled = true;
    };
  }, [draft, theme, photoOverrideSrc]);

  return (
    <section className="min-w-0 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-3 py-2 dark:border-[var(--ecm-blue-border)]">
        <button type="button" className="text-left text-sm font-bold text-zinc-900 dark:text-[var(--ecm-blue-text)]" onClick={onToggle}>
          {collapsed ? '+' : '-'} {theme.name}
        </button>
        <button
          type="button"
          className="rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-45 dark:bg-[var(--ecm-gold)] dark:text-[var(--ecm-blue-bg)]"
          disabled={!ready || !canDownload}
          onClick={() => {
            const canvas = canvasRef.current;
            if (canvas) onDownload(canvas, theme);
          }}
        >
          Baixar PNG
        </button>
      </div>
      <div className={`bg-zinc-100 p-2 dark:bg-[var(--ecm-blue-bg)] ${collapsed ? 'sr-only' : ''}`}>
        <canvas ref={canvasRef} className="mx-auto block h-auto w-full max-w-[520px] rounded-md bg-white shadow-sm" />
      </div>
    </section>
  );
}
