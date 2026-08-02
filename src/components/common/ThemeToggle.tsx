'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/common/ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/70 text-zinc-700 transition-all hover:bg-zinc-100 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)] dark:text-[var(--ecm-blue-muted)] dark:hover:bg-[var(--ecm-blue-panel)] dark:focus:ring-[var(--ecm-blue-accent)]/20"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
