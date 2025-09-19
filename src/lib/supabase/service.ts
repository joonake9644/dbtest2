import 'server-only';
import { createClient } from '@supabase/supabase-js';

let warnedAboutAnonFallback = false;

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const key = serviceKey || anonKey;

  if (!url || !key) {
    throw new Error('Server misconfigured: missing Supabase URL or key');
  }

  if (!serviceKey && !warnedAboutAnonFallback) {
    console.warn('[supabase/service] SUPABASE_SERVICE_ROLE_KEY is not set; falling back to anon key. Configure the service role key for full admin access.');
    warnedAboutAnonFallback = true;
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

