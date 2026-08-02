import { dashTodayStr, normalizeAlertText, routeKey } from './normalization';
import { EXPERIENCIAS_AO_VIVO, normalizeAlertGroup, type AlertGroup, type AlertRecord, type RouteSetting } from './types';

export const DAILY_GOALS: Record<AlertGroup, number> = {
  'Go Miles Club': 8,
  'Executiva com Milhas': 8,
  FirstClass: 4,
  [EXPERIENCIAS_AO_VIVO]: 8,
  'Milhas Ao Vivo': 8
};

export interface GroupStats {
  goal: number;
  generatedToday: number;
  sentToday: number;
  total: number;
}

export interface DashboardStats {
  generatedToday: number;
  generatedThisWeek: number;
  overdueRoutes: number;
  groups: Record<AlertGroup, GroupStats>;
}

export interface RouteSummary {
  key: string;
  origin: string;
  destination: string;
  total: number;
  sentTotal: number;
  lastDate: string;
  daysSinceLast: number;
  groups: Partial<Record<AlertGroup, number>>;
  minDays: number;
}

export interface RouteSuggestions {
  routes: RouteSummary[];
  stale: RouteSummary[];
  variety: RouteSummary[];
  rotation: RouteSummary[];
}

function daysBetween(fromDate: string, now: Date) {
  const from = new Date(`${fromDate}T00:00:00`);
  const today = new Date(`${dashTodayStr(now)}T00:00:00`);
  return Math.floor((today.getTime() - from.getTime()) / 86400000);
}

function isWithinDays(date: string, now: Date, days: number) {
  const diff = daysBetween(date, now);
  return diff >= 0 && diff < days;
}

function normalizeRouteSettingKey(value: string) {
  const [origin = '', destination = ''] = value.split('-');
  return routeKey(origin, destination);
}

export function buildRouteSummaries(alerts: AlertRecord[], settings: RouteSetting[] = [], now = new Date()): RouteSummary[] {
  const minDaysByRoute = new Map(settings.map((setting) => [normalizeRouteSettingKey(setting.route_key), setting.min_days]));
  const summaries = new Map<string, RouteSummary>();

  for (const alert of alerts) {
    const key = routeKey(alert.origem, alert.destino);
    const current =
      summaries.get(key) ||
      ({
        key,
        origin: alert.origem,
        destination: alert.destino,
        total: 0,
        sentTotal: 0,
        lastDate: alert.data,
        daysSinceLast: daysBetween(alert.data, now),
        groups: {},
        minDays: minDaysByRoute.get(key) ?? 10
      } satisfies RouteSummary);

    current.total += 1;
    if (alert.enviado) current.sentTotal += 1;
    const group = normalizeAlertGroup(alert.grupo);
    if (group) current.groups[group] = (current.groups[group] || 0) + 1;
    if (alert.data > current.lastDate) {
      current.lastDate = alert.data;
      current.daysSinceLast = daysBetween(alert.data, now);
    }
    summaries.set(key, current);
  }

  return [...summaries.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

export function buildDashboardStats(alerts: AlertRecord[], settings: RouteSetting[] = [], now = new Date()): DashboardStats {
  const today = dashTodayStr(now);
  const groups = Object.fromEntries(
    Object.entries(DAILY_GOALS).map(([group, goal]) => [group, { goal, generatedToday: 0, sentToday: 0, total: 0 }])
  ) as Record<AlertGroup, GroupStats>;

  let generatedToday = 0;
  let generatedThisWeek = 0;
  for (const alert of alerts) {
    const group = normalizeAlertGroup(alert.grupo);
    if (!group) continue;
    groups[group].total += 1;
    if (alert.data === today) {
      generatedToday += 1;
      groups[group].generatedToday += 1;
      if (alert.enviado) groups[group].sentToday += 1;
    }
    if (isWithinDays(alert.data, now, 7)) generatedThisWeek += 1;
  }

  const overdueRoutes = buildRouteSummaries(alerts, settings, now).filter((route) => route.daysSinceLast >= route.minDays).length;
  return { generatedToday, generatedThisWeek, overdueRoutes, groups };
}

export function buildRouteSuggestions(alerts: AlertRecord[], settings: RouteSetting[] = [], now = new Date()): RouteSuggestions {
  const routes = buildRouteSummaries(alerts, settings, now);
  const stale = routes.filter((route) => route.daysSinceLast >= route.minDays).sort((a, b) => b.daysSinceLast - a.daysSinceLast);
  const variety = routes
    .filter((route) => Object.keys(route.groups).length <= 1)
    .sort((a, b) => a.total - b.total || b.daysSinceLast - a.daysSinceLast)
    .slice(0, 12);

  const sentExecutivaRecently = new Set(
    alerts
      .filter((alert) => alert.enviado && normalizeAlertGroup(alert.grupo) === 'Executiva com Milhas' && isWithinDays(alert.data, now, 3))
      .map((alert) => routeKey(alert.origem, alert.destino))
  );
  const sentInTargetGroups = new Set(
    alerts
      .filter((alert) => {
        const group = normalizeAlertGroup(alert.grupo);
        return alert.enviado && (group === 'Go Miles Club' || group === 'FirstClass');
      })
      .map((alert) => routeKey(alert.origem, alert.destino))
  );
  const rotation = routes.filter((route) => sentExecutivaRecently.has(route.key) && !sentInTargetGroups.has(route.key));

  return { routes, stale, variety, rotation };
}

export function matchesAlertSearch(alert: AlertRecord, search: string) {
  const term = normalizeAlertText(search);
  if (!term) return true;
  return normalizeAlertText(`${alert.origem} ${alert.destino} ${alert.cia} ${alert.programa}`).includes(term);
}
