import { describe, expect, it } from 'vitest';
import { countDistinctAlerts, extractCiaFromTitle, extractClassFromTitle, programSummaryFromBands, routeKey } from './normalization';

describe('alert normalization', () => {
  it('normalizes route keys', () => {
    expect(routeKey('S\u00e3o Paulo', 'Madri')).toBe('SAO PAULO-MADRI');
  });

  it('extracts class and airline from alert title', () => {
    expect(extractClassFromTitle('EXECUTIVA AIR EUROPA')).toBe('Classe Executiva');
    expect(extractCiaFromTitle('EXECUTIVA AIR EUROPA')).toBe('AIR EUROPA');
  });

  it('summarizes all mileage lines from price bands', () => {
    expect(
      programSummaryFromBands([
        { id: '1', miles: '51,5K Milhas Flying Blue\n75K Milhas Aeroplan', dates: 'Ago: 1, 2' }
      ])
    ).toBe('51,5K Milhas Flying Blue | 75K Milhas Aeroplan');
  });

  it('counts same route/program/date across groups once', () => {
    const base = { origem: 'GRU', destino: 'MAD', programa: '51K FB', data: '2026-08-01', enviado: false };
    expect(
      countDistinctAlerts([
        { id: '1', grupo: 'Executiva com Milhas', cia: 'Air Europa', autor: 'Jose', ...base },
        { id: '2', grupo: 'Go Miles Club', cia: 'Air Europa', autor: 'Jose', ...base }
      ])
    ).toBe(1);
  });

  it('counts split round-trip halves with same par_id once', () => {
    expect(
      countDistinctAlerts([
        { id: '1', origem: 'GRU', destino: 'MAD', programa: '51K FB', data: '2026-08-01', grupo: 'Executiva com Milhas', cia: 'Air Europa', autor: 'Jose', enviado: false, par_id: 'pair-1' },
        { id: '2', origem: 'MAD', destino: 'GRU', programa: '51K FB', data: '2026-08-01', grupo: 'Executiva com Milhas', cia: 'Air Europa', autor: 'Jose', enviado: false, par_id: 'pair-1' }
      ])
    ).toBe(1);
  });
});
