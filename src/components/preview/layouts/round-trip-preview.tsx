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
    width: theme.mainTextOverlay.width,
    display: 'flex',
    flexDirection: 'column' as const,
    height: 920
  };
  const fontWeights = theme.textFontVariants;

  return (
    <PreviewScaffold payload={payload}>
      <section style={leftColumnStyle} data-scale-to-fit="920">
        <header style={{ flexShrink: 0 }}>
          <div
            data-fit-text
            data-fit-text-lines="2"
            data-fit-text-min="20"
            data-fit-text-base="31"
            style={{ ...sharedStyles.title, color: theme.primaryColor, marginBottom: 0, fontWeight: getFontWeightForVariant(fontWeights.title) }}
          >
            {payload.title}
          </div>
        </header>

        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', maxWidth: 660, paddingRight: 8 }}>
          <JourneySection
            block={payload.outbound}
            primaryColor={theme.primaryColor}
            routeFontWeight={getFontWeightForVariant(fontWeights.route)}
            costFontWeight={getFontWeightForVariant(fontWeights.cost)}
            datesFontWeight={getFontWeightForVariant(fontWeights.dates)}
            orLabelFontWeight={getFontWeightForVariant(fontWeights.orLabel)}
            dense
            noMarginBottom
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
              noMarginBottom
            />
          ) : null}
        </div>
      </section>
    </PreviewScaffold>
  );
}
