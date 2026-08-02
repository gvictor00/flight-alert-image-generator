import { describe, expect, it } from 'vitest';
import type { AlertRecord, RouteSetting } from './types';
import { buildOperatorStats, buildProgramStats, buildRouteMatrixRows, detectPrograms, filterAlertsByPeriod } from './dashboard-analytics';

function alert(overrides: Partial<AlertRecord>): AlertRecord {
  return {
    id: overrides.id || 'alert',
    origem: overrides.origem || 'GRU',
    destino: overrides.destino || 'MAD',
    programa: overrides.programa || '51K Milhas Flying Blue',
    cia: overrides.cia || 'Air Europa',
    grupo: overrides.grupo || 'Executiva com Milhas',
    data: overrides.data || '2026-08-02',
    autor: overrides.autor === undefined ? 'Lucas' : overrides.autor,
    enviado: overrides.enviado ?? false,
    created_at: overrides.created_at
  };
}

describe('dashboard analytics helpers', () => {
  it('filters alerts by shared period options', () => {
    const alerts = [
      alert({ id: 'today', data: '2026-08-02' }),
      alert({ id: 'week', data: '2026-07-29' }),
      alert({ id: 'old', data: '2026-06-01' })
    ];
    const now = new Date('2026-08-02T12:00:00Z');

    expect(filterAlertsByPeriod(alerts, { mode: 'today' }, now).map((item) => item.id)).toEqual(['today']);
    expect(filterAlertsByPeriod(alerts, { mode: '7d' }, now).map((item) => item.id)).toEqual(['today', 'week']);
    expect(filterAlertsByPeriod(alerts, { mode: 'custom', startDate: '2026-07-01', endDate: '2026-07-31' }, now).map((item) => item.id)).toEqual(['week']);
  });

  it('detects loyalty programs from alert text', () => {
    expect(detectPrograms('100K Milhas Aeroplan ou 55K Milhas Miles+Bonus')).toEqual(['Aeroplan', 'Aegean Miles+Bonus']);
    expect(detectPrograms('70K a 94.5K Milhas Avios Qatar')).toEqual(['Avios Qatar']);
  });

  it('builds program bar stats sorted by count', () => {
    const stats = buildProgramStats([
      alert({ id: '1', programa: '80K Milhas TAP' }),
      alert({ id: '2', programa: '51K Milhas Flying Blue' }),
      alert({ id: '3', programa: '75K Milhas TAP' })
    ]);

    expect(stats).toEqual([
      { name: 'TAP', count: 2, percentage: 100 },
      { name: 'Flying Blue', count: 1, percentage: 50 }
    ]);
  });

  it('builds operator stats for today and selected period', () => {
    const all = [
      alert({ id: '1', autor: 'Lucas', data: '2026-08-02', enviado: true, created_at: '2026-08-02T10:00:00Z' }),
      alert({ id: '2', autor: 'Lucas', data: '2026-07-30', enviado: false, created_at: '2026-07-30T10:00:00Z' }),
      alert({ id: '3', autor: '', data: '2026-08-02', enviado: false, created_at: '2026-08-02T09:00:00Z' })
    ];
    const period = filterAlertsByPeriod(all, { mode: '7d' }, new Date('2026-08-02T12:00:00Z'));

    expect(buildOperatorStats(all, period, new Date('2026-08-02T12:00:00Z'))).toEqual([
      { operator: 'Lucas', generatedToday: 1, sentToday: 1, generatedInPeriod: 2, sentInPeriod: 1, lastAlert: '2026-08-02T10:00:00Z' },
      { operator: 'Sem operador', generatedToday: 1, sentToday: 0, generatedInPeriod: 1, sentInPeriod: 0, lastAlert: '2026-08-02T09:00:00Z' }
    ]);
  });

  it('builds route matrix rows with group days and status', () => {
    const settings: RouteSetting[] = [{ route_key: 'GRU-MAD', min_days: 3 }];
    const rows = buildRouteMatrixRows([
      alert({ id: '1', origem: 'GRU', destino: 'MAD', grupo: 'Go Miles Club', data: '2026-08-01' }),
      alert({ id: '2', origem: 'GRU', destino: 'MAD', grupo: 'Executiva com Milhas', data: '2026-07-20' })
    ], settings, new Date('2026-08-02T12:00:00Z'));

    expect(rows[0]).toMatchObject({
      key: 'GRU-MAD',
      groupDays: { 'Go Miles Club': 1, 'Executiva com Milhas': 13 },
      status: 'OK',
      total: 2,
      minDays: 3
    });
  });
});
