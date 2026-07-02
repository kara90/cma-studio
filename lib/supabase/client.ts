/**
 * lib/supabase/client.ts — browser Supabase client (@supabase/ssr).
 * Uses cookie-backed sessions so the SAME session is readable server-side by
 * proxy.ts and the API routes. Falls back to a syntactically-valid placeholder
 * so the app builds/runs with blank env (dev only — see lib/access.ts).
 */
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (cached) return cached;
  cached = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  );
  return cached;
}
