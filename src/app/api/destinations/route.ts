export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg']);

export async function GET() {
  try {
    const destinationsDir = path.join(process.cwd(), 'public', 'assets', 'destinations');
    const entries = await fs.readdir(destinationsDir, { withFileTypes: true });

    const items = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => allowedExtensions.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((fileName) => ({
        fileName,
        path: `/assets/destinations/${fileName}`
      }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Falha ao listar imagens de destino.' }, { status: 500 });
  }
}
