import { getBrandTheme } from '@/lib/templates/themes';
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

  return (
    <PreviewScaffold payload={payload}>
      <section style={leftColumnStyle}>
        <header>
          <div style={{ ...sharedStyles.title, color: theme.primaryColor }}>{payload.title}</div>
        </header>

        <JourneySection block={payload.outbound} primaryColor={theme.primaryColor} dense />

        {payload.inbound ? <JourneySection block={payload.inbound} primaryColor={theme.primaryColor} dense /> : null}
      </section>
    </PreviewScaffold>
  );
}
