import JSZip from 'jszip';
import { loadCanvasAssets } from './assets';
import { renderAlertCanvas } from './render-alert-canvas';
import { renderMavCanvas } from './render-mav-canvas';
import { CANVAS_THEMES } from './themes';
import type { AlertDraft, CanvasTheme } from './types';

export interface GeneratedCanvasExport {
  theme: CanvasTheme;
  canvas: HTMLCanvasElement;
  filename: string;
  pngBlob: Blob;
}

export interface GeneratedZipExport {
  items: GeneratedCanvasExport[];
  filename: string;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Nao foi possivel gerar o PNG.'));
    }, 'image/png');
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function sanitizeForFilename(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export async function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string) {
  triggerDownload(await canvasToBlob(canvas), filename);
}

export function buildPngFilename(draft: AlertDraft, theme: CanvasTheme): string {
  const route = sanitizeForFilename(`${draft.outbound.origin}-${draft.outbound.destination}`) || 'alerta';
  return `${route}-${theme.fileSlug}.png`;
}

export async function generateAllZip(draft: AlertDraft, photoOverrideSrc?: string): Promise<GeneratedZipExport> {
  const zip = new JSZip();
  const items: GeneratedCanvasExport[] = [];
  const destination = photoOverrideSrc ? '' : draft.destinationPhotoMode === 'auto' ? draft.outbound.destination : '';
  const manualPhoto = photoOverrideSrc || (draft.destinationPhotoMode === 'manual' ? draft.manualPhotoDataUrl : undefined);

  for (const theme of CANVAS_THEMES) {
    const canvas = document.createElement('canvas');
    const assets = await loadCanvasAssets(theme, destination, manualPhoto);
    if (theme.key === 'milhasaovivo') renderMavCanvas(canvas, draft, assets);
    else renderAlertCanvas(canvas, draft, theme, assets);
    const filename = buildPngFilename(draft, theme);
    const pngBlob = await canvasToBlob(canvas);
    zip.file(filename, pngBlob);
    items.push({ theme, canvas, filename, pngBlob });
  }

  const route = sanitizeForFilename(`${draft.outbound.origin}-${draft.outbound.destination}`) || 'alertas';
  const filename = `${route}-todos-layouts.zip`;
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, filename);
  return { items, filename };
}
