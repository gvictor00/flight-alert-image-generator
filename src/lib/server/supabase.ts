import 'server-only';
import { createClient, type SupabaseClientOptions } from '@supabase/supabase-js';

type RealtimeTransport = NonNullable<NonNullable<SupabaseClientOptions<'public'>['realtime']>['transport']>;

class DisabledRealtimeWebSocket {
  constructor() {
    throw new Error('Supabase Realtime is disabled for the Next server client.');
  }
}

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

export function getSupabaseStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'alert-cards';
}

export function getSupabaseServerClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required for database features.');
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    realtime: { transport: DisabledRealtimeWebSocket as unknown as RealtimeTransport }
  });
}
