import type { AlertImagePayload } from '@/lib/templates/types';

const samplePayloadSeed: AlertImagePayload = {
  template: 'round-trip',
  title: 'EXECUTIVA QATAR AIRWAYS',
  themeKey: 'executiva-com-milhas',
  destinationImage: '/assets/destinations/placeholder-destination.svg',
  destinationImageSettings: {
    fit: 'cover',
    scale: 1,
    offsetX: 0,
    offsetY: 0
  },
  outbound: {
    route: 'São Paulo - Doha',
    costs: [
      { id: 'out-1', value: '70K Milhas Avios Qatar + R$ 1.108,24' },
      { id: 'out-2', value: '94,5K Milhas Avios Qatar + R$ 1.108,24' }
    ],
    dates: [
      { id: 'out-date-1', value: 'MAI: 31(1)' },
      { id: 'out-date-2', value: 'JUN: 1(2), 2(2), 4(1), 11(1)' }
    ]
  },
  inbound: {
    route: 'Doha - São Paulo',
    costs: [
      { id: 'in-1', value: '70K Milhas Avios Qatar + 870.00 QAR' },
      { id: 'in-2', value: '94,5K Milhas Avios Qatar + 870.00 QAR' }
    ],
    dates: [
      { id: 'in-date-1', value: 'ABR: 17(1)' },
      { id: 'in-date-2', value: 'MAI: 1(1), 6(1), 17(1)' },
      { id: 'in-date-3', value: 'JUN: 5(1), 12(1)' }
    ]
  },
  footer: {
    primaryLine: 'Alerta para uso próprio. Não encaminhar para outros grupos.',
    secondaryLine: 'Pesquisa realizada para 1 passageiro. Em parênteses os assentos disponíveis.',
    generatedAtLine: 'Pesquisa realizada no dia 05 de Abril.'
  }
};


export const samplePayload: AlertImagePayload = structuredClone(samplePayloadSeed);
