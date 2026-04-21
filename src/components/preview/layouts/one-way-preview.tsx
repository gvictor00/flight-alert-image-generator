import { getBrandTheme, getFontWeightForVariant } from '@/lib/templates/themes';
import type { AlertImagePayload } from '@/lib/templates/types';
import { PreviewScaffold, sharedStyles } from '@/components/preview/layouts/shared';
import { JourneySection } from '@/components/preview/sections/journey-section';

interface OneWayPreviewProps {
  payload: AlertImagePayload;
}

export function OneWayPreview({ payload }: OneWayPreviewProps) {
  const theme = getBrandTheme(payload.themeKey);
  const leftColumnStyle = {
    ...sharedStyles.leftColumn,
    left: theme.mainTextOverlay.x,
    top: theme.mainTextOverlay.oneWayY,
    width: theme.mainTextOverlay.width
  };
  const fontWeights = theme.textFontVariants;

  return (
    <PreviewScaffold payload={payload}>
      <section style={leftColumnStyle}>
        <header>
          <div
            style={{ ...sharedStyles.title, color: theme.primaryColor, marginBottom: 28, fontWeight: getFontWeightForVariant(fontWeights.title) }}
          >
            {payload.title}
          </div>
        </header>

        <div style={{ maxWidth: 660, paddingRight: 8 }}>
          <JourneySection
            block={payload.outbound}
            primaryColor={theme.primaryColor}
            routeFontWeight={getFontWeightForVariant(fontWeights.route)}
            costFontWeight={getFontWeightForVariant(fontWeights.cost)}
            datesFontWeight={getFontWeightForVariant(fontWeights.dates)}
            orLabelFontWeight={getFontWeightForVariant(fontWeights.orLabel)}
          />
        </div>
      </section>
    </PreviewScaffold>
  );
}
