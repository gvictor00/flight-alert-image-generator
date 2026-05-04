import type { CSSProperties, ReactNode } from 'react';
import { useEffect } from 'react';
import { getBrandTheme, getFontWeightForVariant } from '@/lib/templates/themes';
import type { AlertImagePayload, DestinationImageSettings, FooterTextPosition } from '@/lib/templates/types';
import { applyFitText } from '@/lib/utils/fit-text';

interface PreviewScaffoldProps {
  payload: AlertImagePayload;
  children: ReactNode;
}

export function PreviewScaffold({ payload, children }: PreviewScaffoldProps) {
  const theme = getBrandTheme(payload.themeKey);
  const footerLayout = theme.footerOverlayLayout;
  const footerFontWeights = theme.textFontVariants;

  useEffect(() => {
    // Atrasar a execucao em 1 tick para garantir que as fontes carreguem/renderizem primeiro
    const timer = setTimeout(() => {
      const container = document.getElementById('alert-preview-canvas');
      if (container) {
        applyFitText(container);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [payload]);

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
        </section>

        {payload.extraObservation && (
          <div
            data-fit-text
            data-fit-text-lines="1"
            data-fit-text-min="10"
            style={{
              position: 'absolute',
              zIndex: 3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              fontSize: 16,
              lineHeight: 1.25,
              left: 25,
              top: 935,
              width: 1030,
              color: theme.primaryColor,
              fontWeight: getFontWeightForVariant(footerFontWeights.footerPrimary)
            }}
          >
            {payload.extraObservation}
          </div>
        )}

        <div
          data-fit-text
          data-fit-text-lines="1"
          data-fit-text-min="10"
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
          data-fit-text
          data-fit-text-lines="1"
          data-fit-text-min="10"
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
          data-fit-text
          data-fit-text-lines="1"
          data-fit-text-min="9"
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
    marginBottom: 22,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
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
    left: 5,
    top: 175,
    width: 270,
    height: 150,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3
  },
  planeImage: {
    width: 250,
    height: 'auto',
    objectFit: 'contain'
  },
  footerStrongLine: {
    position: 'absolute',
    zIndex: 3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    fontSize: 17,
    lineHeight: 1.25
  },
  footerDateLine: {
    position: 'absolute',
    zIndex: 3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    fontSize: 15,
    lineHeight: 1.2
  }
};
