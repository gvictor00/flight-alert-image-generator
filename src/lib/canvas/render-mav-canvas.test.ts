import { describe, expect, it } from 'vitest';
import { createDefaultAlertDraft } from './default-draft';
import { MAV_PALETTES } from './render-mav-canvas';

describe('Milhas Ao Vivo draft contract', () => {
  it('includes fourth layout footer and variant', () => {
    const draft = createDefaultAlertDraft();
    expect(draft.footersByTheme.milhasaovivo).toContain('Pesquisa realizada');
    expect(draft.mavVariant).toBe('experiencias');
  });

  it('uses the ECMv2 layout 1 palette for experiencias', () => {
    expect(MAV_PALETTES.experiencias).toMatchObject({ bg: '#FFFFFF', showHeaderText: true });
  });
});
