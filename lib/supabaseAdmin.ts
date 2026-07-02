/**
 * lib/supabaseAdmin.ts — server-only Supabase admin client (service role).
 * Used ONLY by the Stripe webhook to write entitlement into a user's
 * app_metadata. The service-role key bypasses RLS and must never reach the
 * client — it is NOT a NEXT_PUBLIC var.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const isAdminConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export function getSupabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role',
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
