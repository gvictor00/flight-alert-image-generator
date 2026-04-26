import type { CostOption, MonthAvailability } from '@/lib/templates/types';

export function normalizeListText(items: Array<CostOption | MonthAvailability>): string[] {
  return items
    .map((item) => item.value.trim())
    .filter((value) => value.length > 0);
}
