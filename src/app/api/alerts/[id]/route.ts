import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/server/supabase';

export const runtime = 'nodejs';

const updateFields = new Set([
  'origem',
  'destino',
  'programa',
  'cia',
  'grupo',
  'data',
  'autor',
  'obs',
  'image_url',
  'par_id',
  'card_data',
  'enviado'
]);

function allowedChanges(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  return Object.fromEntries(Object.entries(body).filter(([field]) => updateFields.has(field)));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const changes = allowedChanges(body);
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: 'At least one allowed field is required.' }, { status: 400 });
  }

  const sb = getSupabaseServerClient();
  const { data, error } = await sb.from('alerts').update(changes).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alert: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  const { id } = await params;
  const sb = getSupabaseServerClient();
  const { error } = await sb.from('alerts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
