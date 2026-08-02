import { ALERT_GROUPS, type AlertGroup, type NewAlertRecord } from './types';

export type NotionCsvRow = Record<string, unknown>;

const PT_MONTHS: Record<string, string> = {
  janeiro: '01',
  fevereiro: '02',
  marco: '03',
  março: '03',
  abril: '04',
  maio: '05',
  junho: '06',
  julho: '07',
  agosto: '08',
  setembro: '09',
  outubro: '10',
  novembro: '11',
  dezembro: '12'
};

function text(row: NotionCsvRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function parseNotionDate(value: string): string | null {
  const clean = value.trim().toLowerCase();
  const iso = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const br = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;

  const long = clean.match(/^(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})$/i);
  if (!long) return null;
  const month = PT_MONTHS[long[2]];
  if (!month) return null;
  return `${long[3]}-${month}-${long[1].padStart(2, '0')}`;
}

export function extractRouteCodes(value: string): { origem: string; destino: string } | null {
  const codes = [...value.matchAll(/\(([A-Z]{3})\)/g)].map((match) => match[1]);
  if (codes.length >= 2) return { origem: codes[0], destino: codes[1] };

  const bare = value.toUpperCase().match(/\b([A-Z]{3})\b\s*[-–>]+\s*\b([A-Z]{3})\b/);
  if (bare) return { origem: bare[1], destino: bare[2] };
  return null;
}

function alertGroup(value: string): AlertGroup {
  return ALERT_GROUPS.find((group) => group === value) || 'Executiva com Milhas';
}

export function rowsToAlertRecords(rows: NotionCsvRow[], author: string): NewAlertRecord[] {
  return rows.flatMap((row) => {
    const route = extractRouteCodes(text(row, 'Rotas', 'Rota', 'Route'));
    const data = parseNotionDate(text(row, 'Data da Viagem', 'Data', 'Date'));
    const programa = text(row, 'Últimos Valores', 'Ultimos Valores', 'Programas de Milhas', 'Programa');
    if (!route || !data || !programa) return [];

    return [
      {
        origem: route.origem,
        destino: route.destino,
        programa,
        cia: text(row, 'Cia', 'CIA', 'Companhia', 'Companhia Aerea'),
        grupo: alertGroup(text(row, 'Grupo')),
        data,
        autor: author,
        obs: text(row, 'Obs', 'Observacoes', 'Observações')
      }
    ];
  });
}
