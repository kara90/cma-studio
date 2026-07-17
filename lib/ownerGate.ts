/**
 * lib/ownerGate.ts — TEMPORARY owner-only gate for the gallery approval queue.
 *
 * ⚠ SEAM (accounts pass): final owner authentication arrives with the user
 * accounts system. Until then the queue is protected by a long random secret
 * (OWNER_REVIEW_KEY, stored as a Cloudflare secret, never in the client
 * bundle). Only Sebastien holds the key. Replace this module's check with a
 * real owner-account check in the accounts pass.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';

function configuredKey(): string {
  try {
    const env = getCloudflareContext().env as Record<string, unknown>;
    if (typeof env.OWNER_REVIEW_KEY === 'string' && env.OWNER_REVIEW_KEY) return env.OWNER_REVIEW_KEY;
  } catch {
    /* plain `next dev` without bindings */
  }
  return process.env.OWNER_REVIEW_KEY ?? '';
}

/** True only when a key is configured AND the supplied key matches it. */
export function isOwner(suppliedKey: string | null | undefined): boolean {
  const real = configuredKey();
  if (!real || !suppliedKey) return false; // unconfigured = locked shut, never open
  if (suppliedKey.length !== real.length) return false;
  // constant-time-ish compare
  let diff = 0;
  for (let i = 0; i < real.length; i++) diff |= real.charCodeAt(i) ^ suppliedKey.charCodeAt(i);
  return diff === 0;
}
