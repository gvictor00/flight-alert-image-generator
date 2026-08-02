import type { AlertDraft, CanvasTheme } from '../canvas/types';
import { extractCiaFromTitle, programSummaryFromBands } from './normalization';
import { EXPERIENCIAS_AO_VIVO, type AlertGroup, type AlertRecord, type NewAlertRecord } from './types';

async function errorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallback;
  } catch {
    return fallback;
  }
}

export async function createAlert(record: NewAlertRecord): Promise<AlertRecord | null> {
  let response: Response;
  try {
    response = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  } catch {
    return null;
  }

  if (response.status === 503) return null;
  if (!response.ok) throw new Error(await errorMessage(response, 'Falha ao registrar alerta.'));

  const payload = (await response.json()) as { alert?: AlertRecord; configured?: false };
  if (payload.configured === false) return null;
  if (!payload.alert) throw new Error('Resposta invalida ao registrar alerta.');
  return payload.alert;
}

export async function uploadCardJpeg(canvas: HTMLCanvasElement, group: string, origin: string, destination: string): Promise<string | null> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) return null;

  const form = new FormData();
  form.append('file', new File([blob], 'card.jpg', { type: 'image/jpeg' }));
  form.append('group', group);
  form.append('origin', origin);
  form.append('destination', destination);

  let response: Response;
  try {
    response = await fetch('/api/card-image', { method: 'POST', body: form });
  } catch {
    return null;
  }
  if (response.status === 503) return null;
  if (!response.ok) throw new Error(await errorMessage(response, 'Falha ao enviar copia JPEG do card.'));

  const payload = (await response.json()) as { publicUrl: string | null; configured?: false };
  if (payload.configured === false) return null;
  return payload.publicUrl || null;
}

export function groupForTheme(theme: CanvasTheme, draft: Pick<AlertDraft, 'mavVariant'>): AlertGroup {
  if (theme.key === 'milhasaovivo') {
    return draft.mavVariant === 'experiencias' ? EXPERIENCIAS_AO_VIVO : 'Milhas Ao Vivo';
  }
  if (theme.key === 'gomiles') return 'Go Miles Club';
  if (theme.key === 'executiva') return 'Executiva com Milhas';
  return 'FirstClass';
}

export function buildAlertRecordForTheme(draft: AlertDraft, theme: CanvasTheme, author: string, imageUrl: string | null, parId: string | null): NewAlertRecord {
  return {
    origem: draft.outbound.origin,
    destino: draft.outbound.destination,
    programa: programSummaryFromBands(draft.outbound.bands),
    cia: extractCiaFromTitle(draft.title),
    grupo: groupForTheme(theme, draft),
    autor: author,
    image_url: imageUrl,
    par_id: parId,
    card_data: JSON.stringify(draft)
  };
}
