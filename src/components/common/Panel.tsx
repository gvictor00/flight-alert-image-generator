import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  subtitle: string;
  className?: string;
  children: ReactNode;
}

export function Panel({ title, subtitle, className, children }: PanelProps) {
  return (
    <section className={`rounded-3xl border border-zinc-200/60 bg-white/70 backdrop-blur-md shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/70 ${className ?? ''}`}>
      <div className="border-b border-zinc-100 px-6 py-6 lg:px-8 dark:border-zinc-800">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h2>
        <p className="mt-2 text-sm text-zinc-500 leading-relaxed dark:text-zinc-400">{subtitle}</p>
      </div>
      <div className="p-6 lg:p-8">{children}</div>
    </section>
  );
}
