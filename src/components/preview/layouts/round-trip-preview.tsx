import { getBrandTheme, getFontWeightForVariant } from '@/lib/templates/themes';
import type { AlertImagePayload } from '@/lib/templates/types';
import { PreviewScaffold, sharedStyles } from '@/components/preview/layouts/shared';
import { JourneySection } from '@/components/preview/sections/journey-section';

interface RoundTripPreviewProps {
  payload: AlertImagePayload;
}

export function RoundTripPreview({ payload }: RoundTripPreviewProps) {
  const theme = getBrandTheme(payload.themeKey);
  const leftColumnStyle = {
    ...sharedStyles.leftColumn,
    left: theme.mainTextOverlay.x,
    top: theme.mainTextOverlay.roundTripY,
    width: theme.mainTextOverlay.width
  };
  const fontWeights = theme.textFontVariants;

  return (
    <PreviewScaffold payload={payload}>
      <section style={leftColumnStyle} data-scale-to-fit="920">
        <header>
          <div
            data-fit-text
            data-fit-text-lines="2"
            data-fit-text-min="20"
            style={{ ...sharedStyles.title, color: theme.primaryColor, fontWeight: getFontWeightForVariant(fontWeights.title) }}
          >
            {payload.title}
          </div>
        </header>

        <JourneySection
          block={payload.outbound}
          primaryColor={theme.primaryColor}
          routeFontWeight={getFontWeightForVariant(fontWeights.route)}
          costFontWeight={getFontWeightForVariant(fontWeights.cost)}
          datesFontWeight={getFontWeightForVariant(fontWeights.dates)}
          orLabelFontWeight={getFontWeightForVariant(fontWeights.orLabel)}
          dense
        />

        {payload.inbound ? (
          <JourneySection
            block={payload.inbound}
            primaryColor={theme.primaryColor}
            routeFontWeight={getFontWeightForVariant(fontWeights.route)}
            costFontWeight={getFontWeightForVariant(fontWeights.cost)}
            datesFontWeight={getFontWeightForVariant(fontWeights.dates)}
            orLabelFontWeight={getFontWeightForVariant(fontWeights.orLabel)}
            dense
          />
        ) : null}
      </section>
    </PreviewScaffold>
  );
}
