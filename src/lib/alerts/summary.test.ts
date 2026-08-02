import { describe, expect, it } from 'vitest';
import type { AlertRecord } from './types';
import { createSummaryDraftFromAlerts, generateWhatsAppSummary, validateSummaryItem } from './summary';

function alert(overrides: Partial<AlertRecord>): AlertRecord {
  return {
    id: overrides.id || 'alert',
    origem: overrides.origem || 'Cairo',
    destino: overrides.destino || 'Tokyo',
    programa: overrides.programa || '80K Milhas TAP',
    cia: overrides.cia || 'EGYPTAIR',
    grupo: overrides.grupo || 'Executiva com Milhas',
    data: overrides.data || '2026-07-31',
    autor: overrides.autor || 'Lucas',
    enviado: overrides.enviado ?? true
  };
}

describe('alert summary generation', () => {
  it('generates WhatsApp text grouped by mileage program', () => {
    const text = generateWhatsAppSummary({
      date: '31/07',
      profile: '@executivacommilhas',
      programs: [
        {
          id: 'tap',
          name: 'TAP',
          alerts: [
            { id: '1', origin: 'Cairo', destination: 'Tokyo', destinationCountry: 'Japao', destinationFlag: '🇯🇵', airlines: ['EGYPTAIR'], cabin: '', milesType: 'fixed', miles: '80K', minimumMiles: '', maximumMiles: '', displayProgram: 'TAP', notes: '' },
            { id: '2', origin: 'Zurique', destination: 'Bangkok', destinationCountry: 'Tailandia', destinationFlag: '🇹🇭', airlines: ['SWISS', 'THAI AIRWAYS'], cabin: '', milesType: 'fixed', miles: '80K', minimumMiles: '', maximumMiles: '', displayProgram: 'TAP', notes: '' }
          ]
        },
        {
          id: 'avios',
          name: 'AVIOS',
          alerts: [
            { id: '3', origin: 'Doha', destination: 'Bogotá', destinationCountry: 'Colombia', destinationFlag: '🇨🇴', airlines: ['QATAR'], cabin: '', milesType: 'range', miles: '', minimumMiles: '70K', maximumMiles: '94.5K', displayProgram: 'Avios Qatar', notes: '' }
          ]
        }
      ]
    });

    expect(text).toBe('RESUMO ALERTAS (31/07)\n\nMilhas TAP\nCairo - Tokyo🇯🇵\nEGYPTAIR\n80K Milhas TAP\n\nZurique - Bangkok🇹🇭\nSWISS ou THAI AIRWAYS\n80K Milhas TAP\n————————————\nMilhas AVIOS\nDoha - Bogotá🇨🇴\nQATAR\n70K a 94.5K Milhas Avios Qatar\n\n@executivacommilhas');
  });

  it('validates required summary fields', () => {
    expect(validateSummaryItem({ id: 'bad', origin: '', destination: '', destinationCountry: '', destinationFlag: '', airlines: [], cabin: '', milesType: 'fixed', miles: '', minimumMiles: '', maximumMiles: '', displayProgram: '', notes: '' })).toEqual([
      'origem',
      'destino',
      'bandeira',
      'companhia',
      'milhas',
      'programa exibido'
    ]);
  });

  it('creates an editable draft from Supabase alerts', () => {
    const draft = createSummaryDraftFromAlerts([
      alert({ id: '1', origem: 'Cairo', destino: 'Tokyo', cia: 'EGYPTAIR', programa: '80K Milhas TAP' }),
      alert({ id: '2', origem: 'Doha', destino: 'Bogotá', cia: 'QATAR', programa: '70K a 94.5K Milhas Avios Qatar' })
    ], '31/07', '@executivacommilhas');

    expect(draft.programs.map((program) => program.name)).toEqual(['TAP', 'Avios Qatar']);
    expect(draft.programs[0].alerts[0]).toMatchObject({ origin: 'Cairo', destination: 'Tokyo', airlines: ['EGYPTAIR'], miles: '80K', displayProgram: 'TAP' });
    expect(draft.programs[1].alerts[0]).toMatchObject({ minimumMiles: '70K', maximumMiles: '94.5K', displayProgram: 'Avios Qatar' });
  });
});
