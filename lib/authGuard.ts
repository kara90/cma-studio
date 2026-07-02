/**
 * lib/authGuard.ts — AUTHORITATIVE server-side access check (server-only).
 * Every protected API route calls verifyAccess() before doing any work. This
 * is the real gate; proxy.ts only does an optimistic /studio redirect for UX.
 *
 * Layers, in order:
 *   1. Dev bypass — only when NODE_ENV!=='production' AND Supabase unconfigured.
 *   2. Config present — else 503 (fail closed in prod).
 *   3. Valid Supabase session (getUser validates the JWT against Supabase).
 *   4. Academy gate (isAcademyEmail).
 *   5. Optional per-user entitlement (CMA_REQUIRE_ENTITLEMENT=true).
 */
import { createServerSupabase } from './supabase/server';
import { isSupabaseConfigured, isAcademyEmail, DEV_AUTH_BYPASS } from './access';

export type AccessResult =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; status: number; error: string };

export async function verifyAccess(): Promise<AccessResult> {
  if (DEV_AUTH_BYPASS) return { ok: true, userId: 'dev-user', email: 'dev@local' };

  if (!isSupabaseConfigured) {
    return { ok: false, status: 503, error: 'Workspace auth is not configured.' };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, status: 401, error: 'Sign in to render.' };
  if (!isAcademyEmail(user.email)) {
    return { ok: false, status: 403, error: 'Academy access required.' };
  }

  // HARD PAYWALL: an active subscription is REQUIRED to render — no free access.
  // app_metadata ONLY. user_metadata is user-writable (supabase.auth.updateUser),
  // so trusting it would let anyone self-grant a plan. The Stripe webhook writes
  // the entitlement into app_metadata via the service-role key, which users cannot edit.
  const plan = (user.app_metadata as Record<string, unknown> | undefined)?.cma_plan;
  if (!isPlanActive(plan)) return { ok: false, status: 402, error: 'Subscribe to unlock rendering.' };

  return { ok: true, userId: user.id, email: user.email ?? null };
}

function isPlanActive(plan: unknown): boolean {
  if (!plan || typeof plan !== 'object') return false;
  const p = plan as { status?: string; expires?: string };
  // Explicit allowlist — only paid-through states grant access. Never infer
  // "active" from a future `expires` when the status itself is missing/failed.
  if (p.status !== 'active' && p.status !== 'trialing') return false;
  if (p.expires) return Date.parse(p.expires) > Date.now();
  return true;
}
