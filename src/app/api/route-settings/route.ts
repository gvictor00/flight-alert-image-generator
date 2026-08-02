import { NextResponse } from 'next/server';
import type { RouteSetting } from '@/lib/alerts/types';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/server/supabase';

export const runtime = 'nodejs';

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ settings: [], configured: false });
  const sb = getSupabaseServerClient();
  const { data, error } = await sb.from('route_settings').select('*').order('route_key');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data || [], configured: true });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  const body = (await request.json()) as RouteSetting;
  const routeKey = body.route_key?.trim();
  const minDays = Number(body.min_days);

  if (!routeKey || !Number.isInteger(minDays) || minDays < 1 || minDays > 365) {
    return NextResponse.json({ error: 'Route key and min_days between 1 and 365 are required.' }, { status: 400 });
  }

  const sb = getSupabaseServerClient();
  const { data, error } = await sb
    .from('route_settings')
    .upsert({ route_key: routeKey, min_days: minDays, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ setting: data });
}
