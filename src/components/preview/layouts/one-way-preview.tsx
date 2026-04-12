import { getBrandTheme } from '@/lib/templates/themes';
import type { AlertImagePayload } from '@/lib/templates/types';
import { PreviewScaffold, sharedStyles } from '@/components/preview/layouts/shared';
import { JourneySection } from '@/components/preview/sections/journey-section';

interface OneWayPreviewProps {
  payload: AlertImagePayload;
}

export function OneWayPreview({ payload }: OneWayPreviewProps) {
  const theme = getBrandTheme(payload.themeKey);

  return (
    <PreviewScaffold payload={payload}>
      <section style={{ ...sharedStyles.leftColumn, top: 52 }}>
        <header>
          <div style={{ ...sharedStyles.title, color: theme.primaryColor, marginBottom: 28 }}>{payload.title}</div>
        </header>

        <div style={{ maxWidth: 660, paddingRight: 8 }}>
          <JourneySection block={payload.outbound} primaryColor={theme.primaryColor} />
        </div>
      </section>
    </PreviewScaffold>
  );
}
