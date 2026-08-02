import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NewAlertRecord } from './types';
import { buildAlertRecordForTheme, createAlert, groupForTheme, uploadCardJpeg } from './client';
import { createDefaultAlertDraft } from '../canvas/default-draft';
import { getCanvasTheme } from '../canvas/themes';

const baseRecord: NewAlertRecord = {
  origem: 'Sao Paulo',
  destino: 'Madri',
  programa: '51K Milhas Flying Blue',
  cia: 'Air Europa',
  grupo: 'Executiva com Milhas',
  autor: 'Jose'
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('alert client helpers', () => {
  it('returns null when alert history is not configured', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'Database is not configured.' }), { status: 503 }))
    );

    await expect(createAlert(baseRecord)).resolves.toBeNull();
  });

  it('returns null when alert history is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('fetch failed'))));

    await expect(createAlert(baseRecord)).resolves.toBeNull();
  });

  it('posts alert records and returns the created alert', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ alert: { id: '1', enviado: false, data: '2026-08-01', ...baseRecord } })));
    vi.stubGlobal('fetch', fetchMock);

    const alert = await createAlert(baseRecord);

    expect(alert?.id).toBe('1');
    expect(fetchMock).toHaveBeenCalledWith('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseRecord)
    });
  });

  it('uploads a JPEG generated from canvas and returns the public URL', async () => {
    const blob = new Blob(['jpeg'], { type: 'image/jpeg' });
    const canvas = {
      toBlob: vi.fn((callback: BlobCallback, type?: string, quality?: number) => callback(blob))
    } as unknown as HTMLCanvasElement;
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ publicUrl: 'https://cdn/card.jpg' })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(uploadCardJpeg(canvas, 'Go Miles Club', 'Sao Paulo', 'Madri')).resolves.toBe('https://cdn/card.jpg');
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.85);
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(init?.body).toBeInstanceOf(FormData);
    const file = (init?.body as FormData).get('file') as File;
    expect(file.name).toBe('card.jpg');
    expect(file.type).toBe('image/jpeg');
  });

  it('returns null when card storage is not configured', async () => {
    const canvas = {
      toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['jpeg'], { type: 'image/jpeg' })))
    } as unknown as HTMLCanvasElement;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ publicUrl: null, configured: false }))));

    await expect(uploadCardJpeg(canvas, 'Go Miles Club', 'Sao Paulo', 'Madri')).resolves.toBeNull();
  });

  it('returns null when card storage is unavailable', async () => {
    const canvas = {
      toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['jpeg'], { type: 'image/jpeg' })))
    } as unknown as HTMLCanvasElement;
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('fetch failed'))));

    await expect(uploadCardJpeg(canvas, 'Go Miles Club', 'Sao Paulo', 'Madri')).resolves.toBeNull();
  });

  it('maps the Milhas Ao Vivo canvas theme to the selected operational group', () => {
    const theme = getCanvasTheme('milhasaovivo');

    expect(groupForTheme(theme, { mavVariant: 'experiencias' })).toBe('Experiências Ao Vivo');
    expect(groupForTheme(theme, { mavVariant: 'milhasaovivo' })).toBe('Milhas Ao Vivo');
  });

  it('builds alert metadata from the current draft and theme', () => {
    const draft = {
      ...createDefaultAlertDraft(),
      title: 'EXECUTIVA AIR EUROPA',
      outbound: {
        ...createDefaultAlertDraft().outbound,
        origin: 'Salvador',
        destination: 'Madri',
        bands: [{ id: '1', miles: '51,5K Milhas Flying Blue\n75K Milhas Aeroplan', dates: 'Ago: 1, 2' }]
      }
    };

    expect(buildAlertRecordForTheme(draft, getCanvasTheme('executiva'), 'Lucas', 'https://cdn/card.jpg', 'pair-1')).toMatchObject({
      origem: 'Salvador',
      destino: 'Madri',
      programa: '51,5K Milhas Flying Blue | 75K Milhas Aeroplan',
      cia: 'AIR EUROPA',
      grupo: 'Executiva com Milhas',
      autor: 'Lucas',
      image_url: 'https://cdn/card.jpg',
      par_id: 'pair-1',
      card_data: JSON.stringify(draft)
    });
  });
});
