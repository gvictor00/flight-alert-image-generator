import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="grid gap-2.5">
      <label className="text-sm font-semibold text-zinc-900">{label}</label>
      {children}
      {hint ? <div className="text-xs text-zinc-500 leading-normal">{hint}</div> : null}
    </div>
  );
}