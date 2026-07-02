/**
 * lib/authGuard.ts — AUTHORITATIVE server-side access check (server-only).
 * Every protected API route calls one of these before doing any work. This is
 * the real gate; the /studio page only does an optimistic client-side redirect.
 *
 *   verifySession() — signed-in (+ optional domain allowlist). Used by
 *     /api/checkout: buying a plan must NOT require already having one.
 *   verifyAccess()  — verifySession PLUS the hard paywall (active plan in
 *     server-controlled app_metadata). Used by every render/storage route.
 */
import { createServerSupabase } from './supabase/server';
import { isSupabaseConfigured, isAcademyEmail, DEV_AUTH_BYPASS } from './access';

export type AccessResult =
  | { ok: true; userId: string; email: string | null; tier: string | null }
  | { ok: false; status: number; error: string };

/** Signed-in check WITHOUT the paywall — checkout's gate (fixes the catch-22
 * where buying a subscription required already having one). */
export async function verifySession(): Promise<AccessResult> {
  if (DEV_AUTH_BYPASS) return { ok: true, userId: 'dev-user', email: 'dev@local', tier: null };

  if (!isSupabaseConfigured) {
    return { ok: false, status: 503, error: 'Workspace auth is not configured.' };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, status: 401, error: 'Sign in first.' };
  if (!isAcademyEmail(user.email)) {
    return { ok: false, status: 403, error: 'This email domain is not allowed on this workspace.' };
  }

  const plan = (user.app_metadata as Record<string, unknown> | undefined)?.cma_plan;
  const tier = plan && typeof plan === 'object' ? ((plan as { tier?: string }).tier ?? null) : null;
  return { ok: true, userId: user.id, email: user.email ?? null, tier };
}

export async function verifyAccess(): Promise<AccessResult> {
  const session = await verifySession();
  if (!session.ok) return session;
  if (session.userId === 'dev-user') return session; // dev bypass

  // HARD PAYWALL: an active subscription is REQUIRED to render — no free access.
  // app_metadata ONLY. user_metadata is user-writable (supabase.auth.updateUser),
  // so trusting it would let anyone self-grant a plan. The Stripe webhook writes
  // the entitlement into app_metadata via the service-role key, which users cannot edit.
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const plan = (user?.app_metadata as Record<string, unknown> | undefined)?.cma_plan;
  if (!isPlanActive(plan)) return { ok: false, status: 402, error: 'Subscribe to unlock rendering.' };

  return session;
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
