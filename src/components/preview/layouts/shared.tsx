import type { CSSProperties, ReactNode } from 'react';
import { getBrandTheme, getFontWeightForVariant } from '@/lib/templates/themes';
import type { AlertImagePayload, DestinationImageSettings, FooterTextPosition } from '@/lib/templates/types';

interface PreviewScaffoldProps {
  payload: AlertImagePayload;
  children: ReactNode;
}

export function PreviewScaffold({ payload, children }: PreviewScaffoldProps) {
  const theme = getBrandTheme(payload.themeKey);
  const footerLayout = theme.footerOverlayLayout;
  const footerFontWeights = theme.textFontVariants;

  return (
    <div style={styles.scaleWrapper}>
      <div
        id="alert-preview-canvas"
        style={{
          ...styles.canvas,
          color: theme.textColor
        }}
      >
        <img src={theme.backgroundImage} alt="" aria-hidden style={styles.backgroundImage} />

        {children}

        <section style={styles.rightColumn}>
          <div style={styles.destinationFrame}>
            <img src={payload.destinationImage} alt="Destino" style={getDestinationImageStyle(payload.destinationImageSettings)} />
          </div>
          <div style={styles.planeContainer}>
            <img src="/assets/plane/plane-placeholder.svg" alt="Plane" style={styles.planeImage} />
          </div>
        </section>

        <div
          style={{
            ...styles.footerStrongLine,
            ...toFooterLineStyle(footerLayout.primaryLine),
            color: theme.footerTextColor,
            fontWeight: getFontWeightForVariant(footerFontWeights.footerPrimary)
          }}
        >
          {payload.footer.primaryLine}
        </div>
        <div
          style={{
            ...styles.footerStrongLine,
            ...toFooterLineStyle(footerLayout.secondaryLine),
            color: theme.footerTextColor,
            fontWeight: getFontWeightForVariant(footerFontWeights.footerSecondary)
          }}
        >
          {payload.footer.secondaryLine}
        </div>
        <div
          style={{
            ...styles.footerDateLine,
            ...toFooterLineStyle(footerLayout.generatedAtLine),
            color: theme.footerTextColor,
            fontWeight: getFontWeightForVariant(footerFontWeights.footerDate)
          }}
        >
          {payload.footer.generatedAtLine}
        </div>
      </div>
    </div>
  );
}

function toFooterLineStyle(position: FooterTextPosition): CSSProperties {
  return {
    left: position.x,
    top: position.y,
    width: position.width
  };
}

function getDestinationImageStyle(settings: DestinationImageSettings): CSSProperties {
  return {
    ...styles.destinationImage,
    objectFit: settings.fit,
    transform: `translate(${settings.offsetX}px, ${settings.offsetY}px) scale(${settings.scale})`,
    transformOrigin: 'center center'
  };
}

export const sharedStyles: Record<string, CSSProperties> = {
  leftColumn: {
    position: 'absolute',
    left: 36,
    top: 40,
    width: 670,
    zIndex: 2
  },
  title: {
    fontSize: 31,
    fontWeight: 500,
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    textTransform: 'uppercase',
    marginBottom: 22
  }
};

const styles: Record<string, CSSProperties> = {
  scaleWrapper: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  canvas: {
    position: 'relative',
    width: 1080,
    height: 1080,
    overflow: 'hidden',
    fontFamily: 'var(--font-montserrat), Montserrat, Arial, sans-serif'
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 1080,
    height: 1080,
    objectFit: 'cover',
    userSelect: 'none',
    pointerEvents: 'none',
    zIndex: 0
  },
  rightColumn: {
    position: 'absolute',
    right: 36,
    top: 42,
    width: 284,
    zIndex: 2
  },
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
  footerStrongLine: {
    position: 'absolute',
    zIndex: 3,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 17,
    lineHeight: 1.25
  },
  footerDateLine: {
    position: 'absolute',
    zIndex: 3,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 15,
    lineHeight: 1.2
  }
};
