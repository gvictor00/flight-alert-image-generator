import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { destinationPhotoSlug } from '@/lib/canvas/destination-photos';

export const runtime = 'nodejs';

type UserPhotoEntry = {
  destination: string;
  path: string;
  mimeType: string;
  updatedAt: string;
};

type UserPhotoIndex = Record<string, UserPhotoEntry>;

const allowedTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const userPhotoDir = path.join(process.cwd(), 'public', 'assets', 'destinations', 'user');
const indexPath = path.join(userPhotoDir, 'index.json');

async function readIndex(): Promise<UserPhotoIndex> {
  try {
    return JSON.parse(await readFile(indexPath, 'utf8')) as UserPhotoIndex;
  } catch {
    return {};
  }
}

function apiEntry(key: string, entry: UserPhotoEntry): UserPhotoEntry {
  return { ...entry, path: `/api/destination-photo?key=${encodeURIComponent(key)}` };
}

export async function GET(request: Request) {
  const index = await readIndex();
  const key = new URL(request.url).searchParams.get('key');

  if (!key) {
    return NextResponse.json(Object.fromEntries(Object.entries(index).map(([entryKey, entry]) => [entryKey, apiEntry(entryKey, entry)])));
  }

  const entry = index[key];
  if (!entry) {
    return NextResponse.json({ error: 'Imagem nao encontrada.' }, { status: 404 });
  }

  try {
    const filename = path.basename(entry.path.split('?')[0]);
    const bytes = await readFile(path.join(userPhotoDir, filename));
    return new Response(bytes, {
      headers: {
        'Content-Type': entry.mimeType,
        'Cache-Control': 'no-store'
      }
    });
  } catch {
    return NextResponse.json({ error: 'Arquivo da imagem nao encontrado.' }, { status: 404 });
  }
}

export async function POST(request: Request) {
  const form = await request.formData();
  const destination = String(form.get('destination') || '').trim();
  const file = form.get('file');

  if (!destination) {
    return NextResponse.json({ error: 'Informe o destino antes de salvar a imagem.' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Envie um arquivo de imagem.' }, { status: 400 });
  }

  const extension = allowedTypes[file.type];
  if (!extension) {
    return NextResponse.json({ error: 'Formato nao suportado. Use JPG, PNG ou WEBP.' }, { status: 400 });
  }
  if (file.size > 12 * 1024 * 1024) {
    return NextResponse.json({ error: 'A imagem deve ter no maximo 12 MB.' }, { status: 400 });
  }

  const key = destinationPhotoSlug(destination);
  const filename = `${key}.${extension}`;
  const publicPath = `/assets/destinations/user/${filename}`;
  const updatedAt = new Date().toISOString();
  const entry: UserPhotoEntry = { destination, path: publicPath, mimeType: file.type, updatedAt };

  await mkdir(userPhotoDir, { recursive: true });
  await writeFile(path.join(userPhotoDir, filename), Buffer.from(await file.arrayBuffer()));
  await writeFile(indexPath, `${JSON.stringify({ ...(await readIndex()), [key]: entry }, null, 2)}\n`);

  return NextResponse.json({ key, entry: apiEntry(key, entry) });
}
