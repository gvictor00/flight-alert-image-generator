import type { AlertImagePayload } from '@/lib/templates/types';
import { OneWayPreview } from '@/components/preview/layouts/one-way-preview';
import { RoundTripPreview } from '@/components/preview/layouts/round-trip-preview';

interface AlertImagePreviewProps {
  payload: AlertImagePayload;
}

export function AlertImagePreview({ payload }: AlertImagePreviewProps) {
  if (payload.template === 'one-way') {
    return <OneWayPreview payload={payload} />;
  }

  return <RoundTripPreview payload={payload} />;
}
