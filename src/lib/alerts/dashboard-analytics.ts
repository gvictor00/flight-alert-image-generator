import { dashTodayStr, normalizeAlertText, routeKey } from './normalization';
import { ALERT_GROUPS, normalizeAlertGroup, type AlertGroup, type AlertRecord, type OperatorStat, type PeriodFilter, type ProgramStat, type RouteMatrixRow, type RouteSetting } from './types';

const PROGRAM_KEYWORDS: Record<string, string[]> = {
  Smiles: ['smiles'],
  Azul: ['azul'],
  TAP: ['tap'],
  'Latam Pass': ['latam pass'],
  'Flying Blue': ['flying blue'],
  AAdvantage: ['aadvantage'],
  Aeroplan: ['aeroplan'],
  'Avios Iberia': ['avios iberia'],
  'Avios Finnair': ['avios finnair'],
  'Avios British': ['avios british'],
  'Avios Qatar': ['avios qatar'],
  'Aegean Miles+Bonus': ['aegean', 'miles+bonus'],
  Lifemiles: ['lifemiles'],
  Krisflyer: ['krisflyer', 'krissflyer'],
  Suma: ['suma'],
  'Miles&Smiles': ['miles&smiles', 'turkish miles'],
  Connectmiles: ['connectmiles'],
  'Virgin Flying Club': ['virgin flying club'],
  'Mileage Plan Alaska': ['alaska', 'mileage plan'],
  'United MileagePlus': ['mileageplus'],
  'Delta Skymiles': ['delta skymiles'],
  'Miles&More': ['miles&more'],
  'SAS EuroBonus': ['sas eurobonus'],
  'Aeromexico Rewards': ['aeromexico rewards'],
  'Qantas Frequent Flyer': ['qantas']
};

function daysBetween(date: string, now: Date) {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date(`${dashTodayStr(now)}T00:00:00`);
  return Math.floor((today.getTime() - target.getTime()) / 86400000);
}

function keywordMatches(text: string, keyword: string) {
  const escaped = normalizeAlertText(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9&])${escaped}($|[^a-z0-9&])`).test(text);
}

export function filterAlertsByPeriod(alerts: AlertRecord[], filter: PeriodFilter, now = new Date()) {
  const today = dashTodayStr(now);
  return alerts.filter((alert) => {
    if (filter.mode === 'all') return true;
    if (filter.mode === 'today') return alert.data === today;
    if (filter.mode === '7d') {
      const days = daysBetween(alert.data, now);
      return days >= 0 && days < 7;
    }
    if (filter.mode === '30d') {
      const days = daysBetween(alert.data, now);
      return days >= 0 && days < 30;
    }
    const start = filter.startDate || '0000-01-01';
    const end = filter.endDate || '9999-12-31';
    return alert.data >= start && alert.data <= end;
  });
}

export function detectPrograms(text: string) {
  const normalized = normalizeAlertText(text);
  if (!normalized) return [];
  return Object.entries(PROGRAM_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => keywordMatches(normalized, keyword)))
    .map(([program]) => program);
}

export function buildProgramStats(alerts: AlertRecord[]): ProgramStat[] {
  const counts = new Map<string, number>();
  for (const alert of alerts) {
    for (const program of detectPrograms(alert.programa || '')) {
      counts.set(program, (counts.get(program) || 0) + 1);
    }
  }
  const max = Math.max(0, ...counts.values());
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, percentage: max ? Math.round((count / max) * 100) : 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function buildOperatorStats(allAlerts: AlertRecord[], periodAlerts: AlertRecord[], now = new Date()): OperatorStat[] {
  const today = dashTodayStr(now);
  const byOperator = new Map<string, OperatorStat>();
  const ensure = (value: string) => {
    const operator = value.trim() || 'Sem operador';
    const current = byOperator.get(operator) || {
      operator,
      generatedToday: 0,
      sentToday: 0,
      generatedInPeriod: 0,
      sentInPeriod: 0,
      lastAlert: ''
    };
    byOperator.set(operator, current);
    return current;
  };

  for (const alert of periodAlerts) {
    const current = ensure(alert.autor || '');
    current.generatedInPeriod += 1;
    if (alert.enviado) current.sentInPeriod += 1;
    const last = alert.created_at || alert.data;
    if (last > current.lastAlert) current.lastAlert = last;
  }

  for (const alert of allAlerts.filter((item) => item.data === today)) {
    const current = ensure(alert.autor || '');
    current.generatedToday += 1;
    if (alert.enviado) current.sentToday += 1;
    const last = alert.created_at || alert.data;
    if (last > current.lastAlert) current.lastAlert = last;
  }

  return [...byOperator.values()].sort((a, b) => b.generatedInPeriod - a.generatedInPeriod || a.operator.localeCompare(b.operator));
}

function normalizeRouteSettingKey(value: string) {
  const [origin = '', destination = ''] = value.split('-');
  return routeKey(origin, destination);
}

function statusFor(days: number | null, minDays: number): RouteMatrixRow['status'] {
  if (days === null) return 'Nunca enviada';
  if (days > minDays) return 'Vencida';
  if (days > minDays * 0.6) return 'Atenção';
  return 'OK';
}

export function buildRouteMatrixRows(alerts: AlertRecord[], settings: RouteSetting[] = [], now = new Date()): RouteMatrixRow[] {
  const minDaysByRoute = new Map(settings.map((setting) => [normalizeRouteSettingKey(setting.route_key), setting.min_days]));
  const rows = new Map<string, RouteMatrixRow & { lastByGroup: Partial<Record<AlertGroup, string>>; lastDate: string }>();

  for (const alert of alerts) {
    const key = routeKey(alert.origem, alert.destino);
    const group = normalizeAlertGroup(alert.grupo);
    const current = rows.get(key) || {
      key,
      origin: alert.origem,
      destination: alert.destino,
      groupDays: {},
      status: 'Nunca enviada',
      total: 0,
      minDays: minDaysByRoute.get(key) ?? 10,
      programs: [],
      lastByGroup: {},
      lastDate: alert.data
    };
    current.total += 1;
    for (const program of detectPrograms(alert.programa || '')) {
      if (!current.programs.includes(program)) current.programs.push(program);
    }
    if (group && (!current.lastByGroup[group] || alert.data > current.lastByGroup[group])) current.lastByGroup[group] = alert.data;
    if (alert.data > current.lastDate) current.lastDate = alert.data;
    rows.set(key, current);
  }

  return [...rows.values()]
    .map((row) => {
      for (const group of ALERT_GROUPS) {
        row.groupDays[group] = row.lastByGroup[group] ? daysBetween(row.lastByGroup[group], now) : null;
      }
      row.status = statusFor(daysBetween(row.lastDate, now), row.minDays);
      const { lastByGroup: _lastByGroup, lastDate: _lastDate, ...publicRow } = row;
      void _lastByGroup;
      void _lastDate;
      return publicRow;
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}
