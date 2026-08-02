'use client';

import { useState } from 'react';
import { AlertsDashboard } from '@/components/dashboard/AlertsDashboard';
import { AlertGenerator } from '@/components/generator/AlertGenerator';
import type { AlertDraft } from '@/lib/canvas/types';

export default function HomePage() {
  const [tab, setTab] = useState<'generator' | 'dashboard'>('generator');
  const [loadedDraft, setLoadedDraft] = useState<AlertDraft | null>(null);

  function loadSnapshot(snapshot: AlertDraft) {
    setLoadedDraft({ ...snapshot });
    setTab('generator');
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-[var(--ecm-blue-bg)]">
      <nav className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] sm:px-6">
        <div className="mx-auto flex max-w-[1700px] flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-md px-4 py-2 text-sm font-bold ${
              tab === 'generator'
                ? 'bg-zinc-900 text-white dark:bg-[var(--ecm-gold)] dark:text-[var(--ecm-blue-bg)]'
                : 'border border-zinc-300 text-zinc-700 dark:border-[var(--ecm-blue-border)] dark:text-[var(--ecm-blue-muted)]'
            }`}
            onClick={() => setTab('generator')}
          >
            Gerador de cards
          </button>
          <button
            type="button"
            className={`rounded-md px-4 py-2 text-sm font-bold ${
              tab === 'dashboard'
                ? 'bg-zinc-900 text-white dark:bg-[var(--ecm-gold)] dark:text-[var(--ecm-blue-bg)]'
                : 'border border-zinc-300 text-zinc-700 dark:border-[var(--ecm-blue-border)] dark:text-[var(--ecm-blue-muted)]'
            }`}
            onClick={() => setTab('dashboard')}
          >
            Dashboard de alertas
          </button>
        </div>
      </nav>
      {tab === 'generator' ? <AlertGenerator loadedDraft={loadedDraft} /> : <AlertsDashboard onLoadSnapshot={loadSnapshot} />}
    </div>
  );
}
