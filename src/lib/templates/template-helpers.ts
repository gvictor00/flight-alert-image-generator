import type { AlertImagePayload, JourneyBlock, TemplateType } from '@/lib/templates/types';
import { createId } from '@/lib/utils/ids';

function cloneJourneyBlock(block: JourneyBlock, prefix: string): JourneyBlock {
  return {
    route: block.route,
    costs: block.costs.map((item, index) => ({
      id: createId(`${prefix}-cost-${index + 1}`),
      value: item.value
    })),
    dates: block.dates.map((item, index) => ({
      id: createId(`${prefix}-date-${index + 1}`),
      value: item.value
    }))
  };
}

export function clonePayload(payload: AlertImagePayload): AlertImagePayload {
  return {
    ...payload,
    outbound: cloneJourneyBlock(payload.outbound, 'outbound'),
    inbound: payload.inbound ? cloneJourneyBlock(payload.inbound, 'inbound') : undefined,
    footer: { ...payload.footer }
  };
}

export function getDefaultInboundBlock(payload: AlertImagePayload): JourneyBlock {
  if (payload.inbound) {
    return cloneJourneyBlock(payload.inbound, 'inbound-default');
  }

  return {
    route: '',
    costs: [{ id: createId('inbound-cost-1'), value: '' }],
    dates: [{ id: createId('inbound-date-1'), value: '' }]
  };
}

export function applyTemplateToPayload(payload: AlertImagePayload, template: TemplateType): AlertImagePayload {
  if (template === 'one-way') {
    return {
      ...clonePayload(payload),
      template: 'one-way',
      inbound: undefined
    };
  }

  return {
    ...clonePayload(payload),
    template: 'round-trip',
    inbound: getDefaultInboundBlock(payload)
  };
}
