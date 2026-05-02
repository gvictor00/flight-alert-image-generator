import type { JourneyBlock } from '@/lib/templates/types';
import { Field } from '@/components/common/Field';
import { createId } from '@/lib/utils/ids';
import { useState } from 'react';

const inputClassName =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3.5 text-sm text-zinc-900 transition-all hover:bg-zinc-50 hover:border-zinc-300 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/10 placeholder:text-zinc-400';
const textAreaClassName = `${inputClassName} min-h-[120px] resize-y leading-relaxed`;
const sectionClassName = 'grid gap-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/30 p-5 lg:p-6 shadow-sm';

function toTextarea(items: Array<{ value: string }>): string {
  return items.map((item) => item.value).join('\n');
}

function fromTextarea(content: string, prefix: string) {
  return content
    .split('\n')
    .map((value) => ({ id: createId(prefix), value }));
}

function updateJourneyBlock(block: JourneyBlock, field: 'costs' | 'dates', value: string): JourneyBlock {
  return {
    ...block,
    [field]: fromTextarea(value, field)
  };
}

interface JourneyEditorProps {
  title: string;
  block: JourneyBlock;
  onChange: (next: JourneyBlock) => void;
}

export function JourneyEditor({ title, block, onChange }: JourneyEditorProps) {
  return (
    <div className={sectionClassName}>
      <h3 className="text-sm font-bold tracking-wide uppercase text-zinc-900">{title}</h3>
      <Field label="Rota">
        <input
          className={inputClassName}
          value={block.route}
          onChange={(event) => onChange({ ...block, route: event.target.value })}
        />
      </Field>
      <Field label="Custos" hint="Um por linha. O template adiciona OU automaticamente entre as ofertas.">
        <textarea
          className={textAreaClassName}
          value={toTextarea(block.costs)}
          onChange={(event) => onChange(updateJourneyBlock(block, 'costs', event.target.value))}
        />
      </Field>
      <Field label="Datas" hint="Um agrupamento por linha. Ex.: MAI: 1(1), 6(1), 17(1)">
        <textarea
          className={textAreaClassName}
          value={toTextarea(block.dates)}
          onChange={(event) => onChange(updateJourneyBlock(block, 'dates', event.target.value))}
        />
      </Field>
    </div>
  );
}