import type { CSSProperties } from 'react';
import type { JourneyBlock } from '@/lib/templates/types';
import { normalizeListText } from '@/lib/rendering/formatters';

interface JourneySectionProps {
  block: JourneyBlock;
  primaryColor: string;
  routeFontWeight: number;
  costFontWeight: number;
  datesFontWeight: number;
  orLabelFontWeight: number;
  dense?: boolean;
}

export function JourneySection({
  block,
  primaryColor,
  routeFontWeight,
  costFontWeight,
  datesFontWeight,
  orLabelFontWeight,
  dense = false
}: JourneySectionProps) {
  const costs = normalizeListText(block.costs);
  const dates = normalizeListText(block.dates);

  return (
    <section style={{ ...styles.container, marginBottom: dense ? 34 : 46 }}>
      <div style={{ ...styles.route, ...getRouteStyles(dense), color: primaryColor, fontWeight: routeFontWeight }}>{block.route}</div>

      <div style={{ ...styles.costList, gap: dense ? 6 : 8, marginBottom: dense ? 18 : 22 }}>
        {costs.map((item, index) => (
          <div key={`${block.route}-cost-${index}`} style={{ ...styles.costRow, gap: dense ? 6 : 8 }}>
            {index > 0 ? <div style={{ ...styles.orRow, fontSize: dense ? 18 : 20, fontWeight: orLabelFontWeight }}>OU</div> : null}
            <div style={{ ...styles.costText, ...getCostStyles(dense), fontWeight: costFontWeight }}>{item}</div>
          </div>
        ))}
      </div>

      <div style={{ ...styles.dateList, ...getDateStyles(dense), fontWeight: datesFontWeight }}>
        {dates.map((item, index) => (
          <div key={`${block.route}-date-${index}`}>{item}</div>
        ))}
      </div>
    </section>
  );
}

function getRouteStyles(dense: boolean): CSSProperties {
  return dense
    ? {
        fontSize: 36,
        marginBottom: 12,
        maxWidth: 650
      }
    : {
        fontSize: 54,
        marginBottom: 16,
        maxWidth: 660
      };
}

function getCostStyles(dense: boolean): CSSProperties {
  return dense
    ? {
        fontSize: 24,
        lineHeight: 1.2
      }
    : {
        fontSize: 28,
        lineHeight: 1.24
      };
}

function getDateStyles(dense: boolean): CSSProperties {
  return dense
    ? {
        gap: 6,
        fontSize: 20,
        lineHeight: 1.25
      }
    : {
        gap: 8,
        fontSize: 24,
        lineHeight: 1.3
      };
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'grid'
  },
  route: {
    letterSpacing: '-0.04em',
    lineHeight: 1.05,
    wordBreak: 'break-word'
  },
  costList: {
    display: 'grid'
  },
  costRow: {
    display: 'grid'
  },
  orRow: {
    letterSpacing: '0.08em'
  },
  costText: {
    wordBreak: 'break-word'
  },
  dateList: {
    display: 'grid',
    maxWidth: 660,
    wordBreak: 'break-word'
  }
};
