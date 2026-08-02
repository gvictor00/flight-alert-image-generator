import { NextResponse } from 'next/server';
import { dashTodayStr } from '@/lib/alerts/normalization';
import type { NewAlertRecord } from '@/lib/alerts/types';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/server/supabase';

export const runtime = 'nodejs';

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ alerts: [], configured: false });
  const sb = getSupabaseServerClient();
  const { data, error } = await sb.from('alerts').select('*').order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts: data || [], configured: true });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });

  let body: NewAlertRecord;
  try {
    body = (await request.json()) as NewAlertRecord;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== 'object' ||
    typeof body.origem !== 'string' ||
    typeof body.destino !== 'string' ||
    typeof body.programa !== 'string' ||
    typeof body.cia !== 'string' ||
    typeof body.grupo !== 'string' ||
    typeof body.autor !== 'string' ||
    (body.obs !== undefined && typeof body.obs !== 'string') ||
    (body.image_url !== undefined && body.image_url !== null && typeof body.image_url !== 'string') ||
    (body.par_id !== undefined && body.par_id !== null && typeof body.par_id !== 'string') ||
    (body.card_data !== undefined && body.card_data !== null && typeof body.card_data !== 'string')
  ) {
    return NextResponse.json({ error: 'Invalid alert payload.' }, { status: 400 });
  }

  let cardData: unknown = null;
  if (body.card_data) {
    try {
      cardData = JSON.parse(body.card_data);
    } catch {
      return NextResponse.json({ error: 'card_data must be valid JSON.' }, { status: 400 });
    }
  }

  const record = {
    origem: body.origem.trim(),
    destino: body.destino.trim(),
    programa: body.programa.trim(),
    cia: body.cia.trim(),
    grupo: body.grupo,
    data: body.data || dashTodayStr(),
    autor: body.autor.trim(),
    obs: body.obs || '',
    image_url: body.image_url || null,
    par_id: body.par_id || null,
    card_data: cardData
  };

  if (!record.origem || !record.destino || !record.grupo) {
    return NextResponse.json({ error: 'Origin, destination and group are required.' }, { status: 400 });
  }

  const sb = getSupabaseServerClient();
  const { data, error } = await sb.from('alerts').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alert: data });
}
