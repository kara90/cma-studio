/**
 * app/api/usage/route.ts — the signed-in member's DP-engine allowance (GET).
 * Read-only: { used, included, refreshesOn }. The studio console shows this
 * next to the render button so nobody is ever surprised by the allowance.
 */
import { verifyAccess } from '@/lib/authGuard';
import { readEngineUsage, publicAllowance } from '@/lib/engineUsage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await verifyAccess();
  if (!access.ok) {
    return Response.json({ ok: false, error: access.error }, { status: access.status, headers: { 'Cache-Control': 'no-store' } });
  }
  const allowance = await readEngineUsage(access.userId, access.tier);
  // publicAllowance REDACTS the hidden fair-use cap on unlimited-display tiers.
  return Response.json({ ok: true, allowance: publicAllowance(allowance) }, { headers: { 'Cache-Control': 'no-store' } });
}
