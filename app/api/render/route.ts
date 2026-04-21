export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import { alertImageSchema } from '@/lib/validation/alert-image-schema';
import { renderAlertImage } from '@/lib/rendering/render-alert-image';
import { appendHistory } from '@/lib/rendering/history-store';

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const payload = alertImageSchema.parse(input);

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `alert-${stamp}.png`;
    const absolutePath = await renderAlertImage(payload, fileName);

    const historyId = crypto.randomUUID();
    await appendHistory({
      id: historyId,
      template: payload.template,
      route: payload.outbound.route,
      createdAt: new Date().toISOString(),
      payload: JSON.stringify(payload)
    });

    const pngBuffer = await fs.readFile(absolutePath);

    return new Response(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
        'X-History-Id': historyId
      }
    });
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Falha ao renderizar a imagem.' }, { status: 500 });
  }
}
