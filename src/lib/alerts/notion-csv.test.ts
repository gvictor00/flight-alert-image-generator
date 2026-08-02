import { describe, expect, it } from 'vitest';
import { extractRouteCodes, parseNotionDate, rowsToAlertRecords } from './notion-csv';

describe('Notion CSV import helpers', () => {
  it('parses Portuguese dates', () => {
    expect(parseNotionDate('3 de agosto de 2026')).toBe('2026-08-03');
    expect(parseNotionDate('03/08/2026')).toBe('2026-08-03');
  });

  it('extracts IATA codes from route text', () => {
    expect(extractRouteCodes('São Paulo (GRU) - Madri (MAD)')).toEqual({ origem: 'GRU', destino: 'MAD' });
    expect(extractRouteCodes('GRU-MAD')).toEqual({ origem: 'GRU', destino: 'MAD' });
  });

  it('maps valid rows to new alert records', () => {
    expect(
      rowsToAlertRecords(
        [
          {
            Rotas: 'São Paulo (GRU) - Madri (MAD)',
            'Data da Viagem': '3 de agosto de 2026',
            'Últimos Valores': '51K Flying Blue',
            Grupo: 'Go Miles Club'
          }
        ],
        'Jose'
      )
    ).toEqual([
      expect.objectContaining({
        origem: 'GRU',
        destino: 'MAD',
        data: '2026-08-03',
        programa: '51K Flying Blue',
        grupo: 'Go Miles Club',
        autor: 'Jose'
      })
    ]);
  });
});
