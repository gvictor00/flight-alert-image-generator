import type { CSSProperties } from 'react';
import { getBrandTheme } from '@/lib/templates/themes';
import type { AlertImagePayload, JourneyBlock } from '@/lib/templates/types';
import { normalizeListText } from '@/lib/rendering/formatters';

interface AlertImagePreviewProps {
  payload: AlertImagePayload;
}

const CANVAS_SIZE = 1080;

export function AlertImagePreview({ payload }: AlertImagePreviewProps) {
  const theme = getBrandTheme(payload.themeKey);
  const showInbound = payload.template === 'round-trip' && payload.inbound;

  return (
    <div style={styles.scaleWrapper}>
      <div
        id="alert-preview-canvas"
        style={{
          ...styles.canvas,
          background: theme.backgroundColor,
          color: theme.textColor
        }}
      >
        <div
          style={{
            ...styles.watermark,
            color: `${theme.primaryColor}14`
          }}
        >
          {theme.watermarkText.split('\n').map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>

        <section style={styles.leftColumn}>
          <header>
            <div style={{ ...styles.title, color: theme.primaryColor }}>{payload.title}</div>
          </header>

          <JourneySection block={payload.outbound} primaryColor={theme.primaryColor} />

          {showInbound ? (
            <JourneySection block={payload.inbound as JourneyBlock} primaryColor={theme.primaryColor} />
          ) : null}
        </section>

        <section style={styles.rightColumn}>
          <div style={styles.destinationFrame}>
            <img
              src={payload.destinationImage}
              alt="Destino"
              style={styles.destinationImage}
            />
          </div>
          <div style={styles.planeContainer}>
            <img src="/assets/plane/plane-placeholder.svg" alt="Plane" style={styles.planeImage} />
          </div>
        </section>

        <footer style={{ ...styles.footer, background: theme.footerColor }}>
          <div style={styles.footerAccent} />
          <div style={styles.footerTextGroup}>
            <div style={styles.footerStrong}>{payload.footer.primaryLine}</div>
            <div style={styles.footerStrong}>{payload.footer.secondaryLine}</div>
            <div style={styles.footerLight}>{payload.footer.generatedAtLine}</div>
          </div>
          <div style={styles.footerBrand}>{theme.name.toUpperCase()}</div>
        </footer>
      </div>
    </div>
  );
}

function JourneySection({ block, primaryColor }: { block: JourneyBlock; primaryColor: string }) {
  const costs = normalizeListText(block.costs);
  const dates = normalizeListText(block.dates);

  return (
    <section style={styles.journeySection}>
      <div style={{ ...styles.route, color: primaryColor }}>{block.route}</div>

      <div style={styles.costList}>
        {costs.map((item, index) => (
          <div key={`${block.route}-cost-${index}`} style={styles.costRow}>
            {index > 0 ? <div style={styles.orRow}>OU</div> : null}
            <div style={styles.costText}>{item}</div>
          </div>
        ))}
      </div>

      <div style={styles.dateList}>
        {dates.map((item, index) => (
          <div key={`${block.route}-date-${index}`} style={styles.dateRow}>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  scaleWrapper: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  canvas: {
    position: 'relative',
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    overflow: 'hidden',
    fontFamily: 'Montserrat, Arial, sans-serif'
  },
  leftColumn: {
    position: 'absolute',
    left: 36,
    top: 40,
    width: 670,
    zIndex: 2
  },
  rightColumn: {
    position: 'absolute',
    right: 36,
    top: 42,
    width: 284,
    zIndex: 2
  },
  title: {
    fontSize: 31,
    fontWeight: 500,
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    textTransform: 'uppercase',
    marginBottom: 22
  },
  journeySection: {
    marginBottom: 44
  },
  route: {
    fontSize: 38,
    lineHeight: 1.06,
    fontWeight: 700,
    letterSpacing: '-0.04em',
    marginBottom: 14,
    maxWidth: 650,
    wordBreak: 'break-word'
  },
  costList: {
    display: 'grid',
    gap: 8,
    marginBottom: 22
  },
  costRow: {
    display: 'grid',
    gap: 8
  },
  orRow: {
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: '0.08em'
  },
  costText: {
    fontSize: 25,
    lineHeight: 1.22,
    fontWeight: 700,
    wordBreak: 'break-word'
  },
  dateList: {
    display: 'grid',
    gap: 8,
    fontSize: 21,
    lineHeight: 1.28,
    fontWeight: 700,
    maxWidth: 660,
    wordBreak: 'break-word'
  },
  dateRow: {},
  destinationFrame: {
    width: 254,
    height: 254,
    borderRadius: 28,
    overflow: 'hidden',
    boxShadow: '0 18px 24px rgba(30, 41, 59, 0.12)'
  },
  destinationImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  planeContainer: {
    position: 'absolute',
    left: 2,
    top: 198,
    width: 270,
    height: 150,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  planeImage: {
    width: 250,
    height: 'auto',
    objectFit: 'contain'
  },
  watermark: {
    position: 'absolute',
    left: 403,
    top: 350,
    fontSize: 95,
    lineHeight: 0.94,
    fontWeight: 800,
    whiteSpace: 'pre-line',
    userSelect: 'none',
    zIndex: 1,
    letterSpacing: '-0.04em'
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 112,
    display: 'grid',
    gridTemplateColumns: '240px 1fr 220px',
    alignItems: 'center',
    padding: '16px 28px 16px 0',
    color: '#fff',
    zIndex: 3
  },
  footerAccent: {
    width: 240,
    height: 22,
    background:
      'repeating-linear-gradient(120deg, #f4d000 0 18px, #101010 18px 36px)',
    alignSelf: 'start'
  },
  footerTextGroup: {
    paddingLeft: 18,
    display: 'grid',
    gap: 2
  },
  footerStrong: {
    fontSize: 17,
    lineHeight: 1.25,
    fontWeight: 700
  },
  footerLight: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 1.2,
    fontWeight: 500
  },
  footerBrand: {
    justifySelf: 'end',
    textAlign: 'right',
    fontSize: 20,
    lineHeight: 1,
    fontWeight: 800,
    maxWidth: 150
  }
};
