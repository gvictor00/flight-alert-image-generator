import { describe, expect, it } from 'vitest';
import type { AlertRecord, RouteSetting } from './types';
import { buildDashboardStats, buildRouteSuggestions, DAILY_GOALS } from './dashboard';

function alert(overrides: Partial<AlertRecord>): AlertRecord {
  return {
    id: overrides.id || crypto.randomUUID(),
    origem: overrides.origem || 'GRU',
    destino: overrides.destino || 'MAD',
    programa: overrides.programa || '51K Flying Blue',
    cia: overrides.cia || 'Air Europa',
    grupo: overrides.grupo || 'Executiva com Milhas',
    data: overrides.data || '2026-08-01',
    autor: overrides.autor || 'Jose',
    enviado: overrides.enviado ?? false,
    created_at: overrides.created_at,
    image_url: overrides.image_url,
    card_data: overrides.card_data,
    par_id: overrides.par_id
  };
}

describe('dashboard calculations', () => {
  it('counts daily and weekly production by group with fixed goals', () => {
    const stats = buildDashboardStats(
      [
        alert({ id: '1', grupo: 'Go Miles Club', data: '2026-08-01', enviado: true }),
        alert({ id: '2', grupo: 'Go Miles Club', data: '2026-08-01', enviado: false }),
        alert({ id: '3', grupo: 'FirstClass', data: '2026-07-30', enviado: true }),
        alert({ id: '4', grupo: 'Milhas Ao Vivo', data: '2026-07-25', enviado: true })
      ],
      [],
      new Date('2026-08-01T12:00:00Z')
    );

    expect(DAILY_GOALS['Go Miles Club']).toBe(8);
    expect(DAILY_GOALS.FirstClass).toBe(4);
    expect(stats.generatedToday).toBe(2);
    expect(stats.generatedThisWeek).toBe(3);
    expect(stats.groups['Go Miles Club']).toEqual({ goal: 8, generatedToday: 2, sentToday: 1, total: 2 });
    expect(stats.groups.FirstClass).toEqual({ goal: 4, generatedToday: 0, sentToday: 0, total: 1 });
  });

  it('normalizes the accented ECMv2 group name before counting dashboard stats', () => {
    const legacyAlert = alert({
      id: 'legacy-eav',
      grupo: 'Experiências Ao Vivo' as AlertRecord['grupo'],
      data: '2026-08-01',
      enviado: true
    });

    const stats = buildDashboardStats([legacyAlert], [], new Date('2026-08-01T12:00:00Z'));

    expect(stats.groups['Experiências Ao Vivo']).toEqual({ goal: 8, generatedToday: 1, sentToday: 1, total: 1 });
  });

  it('finds stale routes, low-variety routes, and rotation candidates', () => {
    const alerts = [
      alert({ id: '1', origem: 'GRU', destino: 'MAD', grupo: 'Executiva com Milhas', data: '2026-07-30', enviado: true }),
      alert({ id: '2', origem: 'GRU', destino: 'MAD', grupo: 'Go Miles Club', data: '2026-07-20', enviado: false }),
      alert({ id: '3', origem: 'SSA', destino: 'MEX', grupo: 'Executiva com Milhas', data: '2026-07-01', enviado: true }),
      alert({ id: '4', origem: 'FRA', destino: 'EZE', grupo: 'FirstClass', data: '2026-07-31', enviado: true })
    ];
    const settings: RouteSetting[] = [{ route_key: 'SSA-MEX', min_days: 10 }];

    const suggestions = buildRouteSuggestions(alerts, settings, new Date('2026-08-01T12:00:00Z'));

    expect(suggestions.routes.find((route) => route.key === 'GRU-MAD')?.total).toBe(2);
    expect(suggestions.stale.map((route) => route.key)).toContain('SSA-MEX');
    expect(suggestions.variety.map((route) => route.key)).toContain('FRA-EZE');
    expect(suggestions.rotation.map((route) => route.key)).toEqual(['GRU-MAD']);
  });
});
