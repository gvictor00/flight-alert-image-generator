import { useEffect, useRef, useState } from 'react';
import { AlertImagePreview } from '@/components/preview/alert-image-preview';
import type { AlertImagePayload } from '@/lib/templates/types';

const previewBaseSize = 1080;

interface ResponsivePreviewProps {
  payload: AlertImagePayload;
}

export function ResponsivePreview({ payload }: ResponsivePreviewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [hostWidth, setHostWidth] = useState(previewBaseSize);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) {
      return;
    }

    const updateSize = () => setHostWidth(element.clientWidth);
    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const scale = Math.min(hostWidth / previewBaseSize, 1);
  const scaledSize = previewBaseSize * scale;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div ref={hostRef} className="w-full">
        <div className="mx-auto" style={{ width: scaledSize, height: scaledSize }}>
          <div
            style={{
              width: previewBaseSize,
              height: previewBaseSize,
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }}
          >
            <AlertImagePreview payload={payload} />
          </div>
        </div>
      </div>
    </div>
  );
}