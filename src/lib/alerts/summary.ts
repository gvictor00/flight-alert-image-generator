import { detectPrograms } from './dashboard-analytics';
import type { AlertRecord } from './types';

export interface AlertSummaryDraft {
  date: string;
  profile: string;
  programs: AlertSummaryProgram[];
}

export interface AlertSummaryProgram {
  id: string;
  name: string;
  alerts: AlertSummaryItem[];
}

export interface AlertSummaryItem {
  id: string;
  origin: string;
  destination: string;
  destinationCountry: string;
  destinationFlag: string;
  airlines: string[];
  cabin: string;
  milesType: 'fixed' | 'range';
  miles: string;
  minimumMiles: string;
  maximumMiles: string;
  displayProgram: string;
  notes: string;
}

export const COUNTRY_FLAGS = [
  { country: 'Japao', flag: '🇯🇵' },
  { country: 'Tailandia', flag: '🇹🇭' },
  { country: 'Colombia', flag: '🇨🇴' },
  { country: 'Estados Unidos', flag: '🇺🇸' },
  { country: 'Portugal', flag: '🇵🇹' },
  { country: 'Espanha', flag: '🇪🇸' },
  { country: 'Franca', flag: '🇫🇷' },
  { country: 'Alemanha', flag: '🇩🇪' },
  { country: 'Italia', flag: '🇮🇹' },
  { country: 'Mexico', flag: '🇲🇽' }
];

const MILES_RE = /\b\d+[\d.,]*\s*K?\b/gi;
const SEPARATOR = '————————————';

function formatDefaultDate(date = new Date()) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function splitAirlines(value: string) {
  return value
    .split(/\s+ou\s+/i)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function milesParts(value: string) {
  const matches = value.match(MILES_RE) || [];
  if (matches.length >= 2 && /\s+a\s+/i.test(value)) {
    return { milesType: 'range' as const, miles: '', minimumMiles: (matches[0] || '').trim(), maximumMiles: (matches[1] || '').trim() };
  }
  return { milesType: 'fixed' as const, miles: matches[0]?.trim() || '', minimumMiles: '', maximumMiles: '' };
}

function displayProgramFromText(value: string) {
  return detectPrograms(value)[0] || '';
}

export function validateSummaryItem(item: AlertSummaryItem) {
  const missing: string[] = [];
  if (!item.origin.trim()) missing.push('origem');
  if (!item.destination.trim()) missing.push('destino');
  if (!item.destinationFlag.trim()) missing.push('bandeira');
  if (!item.airlines.length) missing.push('companhia');
  if (item.milesType === 'fixed' && !item.miles.trim()) missing.push('milhas');
  if (item.milesType === 'range' && (!item.minimumMiles.trim() || !item.maximumMiles.trim())) missing.push('milhas');
  if (!item.displayProgram.trim()) missing.push('programa exibido');
  return missing;
}

function alertText(item: AlertSummaryItem) {
  const airline = item.airlines.map((name) => name.toUpperCase()).join(' ou ');
  const airlineLine = item.cabin.trim() ? `${airline}(${item.cabin.trim()})` : airline;
  const milesLine = item.milesType === 'range'
    ? `${item.minimumMiles} a ${item.maximumMiles} Milhas ${item.displayProgram}`
    : `${item.miles} Milhas ${item.displayProgram}`;
  return `${item.origin} - ${item.destination}${item.destinationFlag}\n${airlineLine}\n${milesLine}`;
}

export function generateWhatsAppSummary(draft: AlertSummaryDraft) {
  const groups = draft.programs
    .map((program) => {
      const complete = program.alerts.filter((item) => validateSummaryItem(item).length === 0);
      if (!complete.length) return '';
      return [`Milhas ${program.name}`, complete.map(alertText).join('\n\n')].join('\n');
    })
    .filter(Boolean);

  return [`RESUMO ALERTAS (${draft.date})`, groups.join(`\n${SEPARATOR}\n`), draft.profile].filter(Boolean).join('\n\n');
}

export function createSummaryDraftFromAlerts(alerts: AlertRecord[], date = formatDefaultDate(), profile = '@executivacommilhas'): AlertSummaryDraft {
  const programs = new Map<string, AlertSummaryProgram>();
  for (const alert of alerts) {
    const displayProgram = displayProgramFromText(alert.programa || '');
    if (!displayProgram) continue;
    const program = programs.get(displayProgram) || { id: slug(displayProgram), name: displayProgram, alerts: [] };
    const miles = milesParts(alert.programa || '');
    program.alerts.push({
      id: alert.id,
      origin: alert.origem,
      destination: alert.destino,
      destinationCountry: '',
      destinationFlag: '',
      airlines: splitAirlines(alert.cia || ''),
      cabin: '',
      displayProgram,
      notes: alert.obs || '',
      ...miles
    });
    programs.set(displayProgram, program);
  }
  return { date, profile, programs: [...programs.values()] };
}
