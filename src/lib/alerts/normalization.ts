import type { PriceBand } from '@/lib/canvas/types';
import type { AlertRecord } from './types';

export function normalizeAlertText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function routeKey(origin: string, destination: string) {
  return `${normalizeAlertText(origin).toUpperCase()}-${normalizeAlertText(destination).toUpperCase()}`;
}

export function dashTodayStr(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const titlePrefixes = ['PRIMEIRA CLASSE', 'EXECUTIVA', 'ECONOMICA', 'PREMIUM ECONOMY', 'PREMIUM'];

export function extractCiaFromTitle(title: string) {
  const raw = title.trim();
  const normalized = normalizeAlertText(raw).toUpperCase();
  const prefix = titlePrefixes
    .slice()
    .sort((a, b) => b.length - a.length)
    .find((item) => normalized.startsWith(normalizeAlertText(item).toUpperCase()));
  return prefix ? raw.slice(prefix.length).trim() : raw;
}

export function extractClassFromTitle(title: string) {
  const normalized = normalizeAlertText(title).toUpperCase();
  if (normalized.startsWith('PRIMEIRA CLASSE')) return 'Primeira Classe';
  if (normalized.startsWith('EXECUTIVA')) return 'Classe Executiva';
  if (normalized.startsWith('PREMIUM ECONOMY')) return 'Premium Economy';
  if (normalized.startsWith('PREMIUM')) return 'Premium';
  if (normalized.startsWith('ECONOMICA')) return 'Classe Economica';
  return null;
}

export function programSummaryFromBands(bands: PriceBand[]) {
  return bands
    .flatMap((band) => band.miles.split('\n').map((line) => line.trim()).filter(Boolean))
    .join(' | ');
}

function find(parent: number[], index: number): number {
  while (parent[index] !== index) {
    parent[index] = parent[parent[index]];
    index = parent[index];
  }
  return index;
}

export function countDistinctAlerts(alerts: AlertRecord[]) {
  const parent = alerts.map((_, index) => index);
  const union = (a: number, b: number) => {
    const rootA = find(parent, a);
    const rootB = find(parent, b);
    if (rootA !== rootB) parent[rootA] = rootB;
  };

  const byRoute = new Map<string, number>();
  const byPair = new Map<string, number>();

  alerts.forEach((alert, index) => {
    const program = normalizeAlertText(alert.programa || '').replace(/\s+/g, ' ').trim();
    const key = `${normalizeAlertText(alert.origem)}|${normalizeAlertText(alert.destino)}|${program}|${alert.data}`;
    const routeMatch = byRoute.get(key);
    if (routeMatch === undefined) byRoute.set(key, index);
    else union(index, routeMatch);

    if (alert.par_id) {
      const pairMatch = byPair.get(alert.par_id);
      if (pairMatch === undefined) byPair.set(alert.par_id, index);
      else union(index, pairMatch);
    }
  });

  return new Set(alerts.map((_, index) => find(parent, index))).size;
}
