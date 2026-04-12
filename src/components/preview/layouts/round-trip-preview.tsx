import { getBrandTheme } from '@/lib/templates/themes';
import type { AlertImagePayload } from '@/lib/templates/types';
import { PreviewScaffold, sharedStyles } from '@/components/preview/layouts/shared';
import { JourneySection } from '@/components/preview/sections/journey-section';

interface RoundTripPreviewProps {
  payload: AlertImagePayload;
}

export function RoundTripPreview({ payload }: RoundTripPreviewProps) {
  const theme = getBrandTheme(payload.themeKey);

  return (
    <PreviewScaffold payload={payload}>
      <section style={sharedStyles.leftColumn}>
        <header>
          <div style={{ ...sharedStyles.title, color: theme.primaryColor }}>{payload.title}</div>
        </header>

        <JourneySection block={payload.outbound} primaryColor={theme.primaryColor} dense />

        {payload.inbound ? <JourneySection block={payload.inbound} primaryColor={theme.primaryColor} dense /> : null}
      </section>
    </PreviewScaffold>
  );
}
