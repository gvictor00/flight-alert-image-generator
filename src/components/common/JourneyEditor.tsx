import type { JourneyBlock } from '@/lib/templates/types';
import { AirportAutocomplete } from '@/components/common/AirportAutocomplete';
import { Field } from '@/components/common/Field';
import { findAirport, resolveToIata } from '@/lib/data/airports';
import { createId } from '@/lib/utils/ids';

const textAreaClassName =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3.5 text-sm text-zinc-900 transition-all hover:bg-zinc-50 hover:border-zinc-300 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/10 placeholder:text-zinc-400 min-h-[120px] resize-y leading-relaxed';
const sectionClassName =
  'grid gap-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/30 p-5 lg:p-6 shadow-sm';

function toTextarea(items: Array<{ value: string }>): string {
  return items.map((item) => item.value).join('\n');
}

function fromTextarea(content: string, prefix: string) {
  return content.split('\n').map((value) => ({ id: createId(prefix), value }));
}

function updateJourneyBlock(block: JourneyBlock, field: 'costs' | 'dates', value: string): JourneyBlock {
  return { ...block, [field]: fromTextarea(value, field) };
}

function parseRoute(route: string): { origin: string; destination: string } {
  const separator = ' - ';
  const idx = route.indexOf(separator);
  if (idx === -1) return { origin: resolveToIata(route), destination: '' };
  return {
    origin: resolveToIata(route.slice(0, idx)),
    destination: resolveToIata(route.slice(idx + separator.length))
  };
}

// Stores city names in block.route so the rendered image shows readable text.
function composeRoute(originIata: string, destinationIata: string): string {
  const originCity = findAirport(originIata)?.city ?? originIata;
  const destinationCity = findAirport(destinationIata)?.city ?? destinationIata;
  if (!originIata && !destinationIata) return '';
  if (!destinationIata) return originCity;
  if (!originIata) return destinationCity;
  return `${originCity} - ${destinationCity}`;
}

interface JourneyEditorProps {
  title: string;
  block: JourneyBlock;
  onChange: (next: JourneyBlock) => void;
  readOnlyRoute?: boolean;
}

export function JourneyEditor({ title, block, onChange, readOnlyRoute = false }: JourneyEditorProps) {
  const { origin, destination } = parseRoute(block.route);

  return (
    <div className={sectionClassName}>
      <h3 className="text-sm font-bold tracking-wide uppercase text-zinc-900">{title}</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Origem">
          <AirportAutocomplete
            value={origin}
            onChange={(iata) => onChange({ ...block, route: composeRoute(iata, destination) })}
            placeholder="Ex.: GRU, São Paulo…"
            disabled={readOnlyRoute}
          />
        </Field>
        <Field label="Destino">
          <AirportAutocomplete
            value={destination}
            onChange={(iata) => onChange({ ...block, route: composeRoute(origin, iata) })}
            placeholder="Ex.: PPT, Papeete…"
            disabled={readOnlyRoute}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            checked={block.stopsText !== undefined}
            onChange={(e) => {
              if (e.target.checked) {
                onChange({ ...block, stopsText: '1 parada no Panamá' });
              } else {
                const newBlock = { ...block };
                delete newBlock.stopsText;
                onChange(newBlock);
              }
            }}
          />
          Adicionar informação de paradas (Ex.: 1 parada no Panamá)
        </label>
        
        {block.stopsText !== undefined && (
          <input
            type="text"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 transition-all focus:border-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
            value={block.stopsText}
            onChange={(e) => onChange({ ...block, stopsText: e.target.value })}
            placeholder="Ex.: 1 parada no Panamá"
          />
        )}
      </div>

      {readOnlyRoute && (
        <p className="text-xs text-zinc-400">
          Rota de volta preenchida automaticamente a partir da rota de ida.
        </p>
      )}

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
