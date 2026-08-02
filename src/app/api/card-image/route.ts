import { NextResponse } from 'next/server';
import { dashTodayStr, normalizeAlertText } from '@/lib/alerts/normalization';
import { getSupabaseServerClient, getSupabaseStorageBucket, isSupabaseConfigured } from '@/lib/server/supabase';

export const runtime = 'nodejs';

const maxJpegBytes = 5 * 1024 * 1024;

function pathPart(value: string) {
  return normalizeAlertText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ publicUrl: null, configured: false });

  const form = await request.formData();
  const file = form.get('file');
  const group = String(form.get('group') || '').trim();
  const origin = String(form.get('origin') || '').trim();
  const destination = String(form.get('destination') || '').trim();

  if (!(file instanceof File) || !group || !origin || !destination) {
    return NextResponse.json({ error: 'File, group, origin and destination are required.' }, { status: 400 });
  }
  if (file.type !== 'image/jpeg') {
    return NextResponse.json({ error: 'Card images must be JPEG files.' }, { status: 400 });
  }
  if (file.size === 0 || file.size > maxJpegBytes) {
    return NextResponse.json({ error: 'Card image must be between 1 byte and 5 MB.' }, { status: 400 });
  }

  const slugGroup = pathPart(group);
  const originCode = pathPart(origin).slice(0, 3).toUpperCase();
  const destinationCode = pathPart(destination).slice(0, 3).toUpperCase();
  const date = dashTodayStr();
  const path = `${slugGroup}/${date}-${originCode}-${destinationCode}-${Date.now()}.jpg`;
  const sb = getSupabaseServerClient();
  const bucket = getSupabaseStorageBucket();
  const { error } = await sb.storage.from(bucket).upload(path, file, { contentType: 'image/jpeg' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ publicUrl: data.publicUrl });
}
