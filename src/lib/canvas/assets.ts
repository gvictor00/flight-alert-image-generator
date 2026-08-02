import type { CanvasAssets, CanvasTheme } from './types';
import { photoPathForDestination } from './destination-photos';

export const MAV_LOGO_ASSET = '/assets/logos/milhas-aovivo.png';

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

export function loadImage(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);

  const cached = imageCache.get(src);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

export async function loadCanvasAssets(theme: CanvasTheme, destination: string, manualPhotoDataUrl?: string): Promise<CanvasAssets> {
  const destinationSrc = manualPhotoDataUrl || photoPathForDestination(destination) || undefined;
  const gomilesSrc = manualPhotoDataUrl || photoPathForDestination(destination, true) || undefined;
  const logoSources = Array.from(new Set([theme.watermarkAsset, theme.brandMarkAsset, theme.ownLogoAsset, theme.poweredLogoAsset].filter(Boolean) as string[]));

  const [plane, destinationPhoto, gomilesDestinationPhoto, ...logos] = await Promise.all([
    loadImage('/assets/plane/airplane.png'),
    loadImage(destinationSrc),
    loadImage(gomilesSrc),
    ...logoSources.map(loadImage)
  ]);

  return {
    plane,
    destinationPhoto,
    gomilesDestinationPhoto,
    logos: Object.fromEntries(logoSources.map((src, index) => [src, logos[index] ?? null]))
  };
}
