/**
 * lib/supabase/server.ts — server Supabase client bound to the request cookies.
 * Used by the API route handlers to read + validate the caller's session
 * server-side (the authoritative gate). Edge-runtime compatible.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function createServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In a Server Component render this can throw; it's safe to ignore
          // there because the browser Supabase client keeps the session cookie
          // refreshed (route handlers, which CAN set cookies, use this too).
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* noop */
          }
        },
      },
    },
  );
}
