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

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid batch payload.' }, { status: 400 });
  }

  const sb = getSupabaseServerClient();

  if (body.action === 'insert') {
    const { data, error } = await sb.from('alerts').insert(body.records || []).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ alerts: data || [] });
  }

  if (body.action === 'update') {
    const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string') : [];
    const changes = allowedChanges(body.changes);
    if (!ids.length || Object.keys(changes).length === 0) {
      return NextResponse.json({ error: 'Update requires ids and at least one allowed field.' }, { status: 400 });
    }
    const out = [];
    for (const id of ids) {
      const { data, error } = await sb.from('alerts').update(changes).eq('id', id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      out.push(data);
    }
    return NextResponse.json({ alerts: out });
  }

  if (body.action === 'delete') {
    const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string') : [];
    if (!ids.length) return NextResponse.json({ error: 'Delete requires ids.' }, { status: 400 });
    const { error } = await sb.from('alerts').delete().in('id', ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ alerts: [] });
  }

  return NextResponse.json({ error: 'Invalid batch action.' }, { status: 400 });
}
