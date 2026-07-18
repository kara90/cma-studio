/**
 * lib/betaGate.ts — TEMPORARY beta access wall (constants only).
 *
 * The whole site sits behind a single shared beta password while CMA Studio is
 * in beta. This module holds ONLY constants + a pure helper, with NO imports,
 * so the edge `proxy.ts` can compare the cookie to a token WITHOUT reading any
 * secret at request time (robust: the proxy can never lock the site out over an
 * env-read failure). The password itself is checked once, in /api/unlock, where
 * the Cloudflare secret is definitely readable.
 *
 * ⚠ SEAM: this entire wall is removed at public launch. It protects nothing
 * sensitive (payments are off; real data lives behind Supabase auth). The
 * BETA_TOKEN is a bypass token for a beta gate, not a security boundary; it is
 * server-only (proxy.ts never ships to the browser) and rotatable.
 */

/** Cookie set once the shared beta password has been entered. */
export const BETA_COOKIE = 'cma_beta';

/** The value a valid beta cookie must equal. Rotating this re-locks everyone. */
export const BETA_TOKEN = 'cma_beta_ok_4fed42a2d9379d20ec8c2935ca6bfdeb';

/** How long a successful unlock lasts (30 days). */
export const BETA_MAX_AGE = 30 * 24 * 60 * 60;

/**
 * Sanitize a post-unlock redirect target: only same-origin ABSOLUTE PATHS are
 * allowed (starts with a single "/", never "//" or a scheme), so the unlock
 * flow can never be turned into an open redirect.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || typeof next !== 'string') return '/';
  if (!next.startsWith('/') || next.startsWith('//')) return '/';
  return next;
}
