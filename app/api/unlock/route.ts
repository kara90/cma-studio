/**
 * POST /api/unlock — check the shared BETA password and grant the beta cookie.
 *
 * The password lives in the Cloudflare secret BETA_ACCESS_PASSWORD (never in the
 * repo or the client bundle). On a match we set an httpOnly cookie the edge
 * proxy accepts. The submitted password is compared in constant time and is
 * NEVER logged. This is the ONLY place the password is read.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { softRateLimit } from '@/lib/rateLimit';
import { BETA_COOKIE, BETA_TOKEN, BETA_MAX_AGE } from '@/lib/betaGate';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function betaPassword(): string {
  try {
    const env = getCloudflareContext().env as unknown as Record<string, unknown>;
    if (typeof env.BETA_ACCESS_PASSWORD === 'string' && env.BETA_ACCESS_PASSWORD) return env.BETA_ACCESS_PASSWORD;
  } catch {
    /* plain `next dev` without bindings — fall back to process.env (.dev.vars) */
  }
  return process.env.BETA_ACCESS_PASSWORD ?? '';
}

/** Length-safe constant-time string compare. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'anon';
  // Slow brute force to a crawl (shared password, but still).
  if (!softRateLimit(`unlock:${ip}`, 10, 60_000)) {
    return Response.json({ ok: false, error: 'Too many attempts. Wait a minute and try again.' }, { status: 429, headers: NO_STORE });
  }

  let supplied = '';
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password === 'string') supplied = body.password;
  } catch {
    return Response.json({ ok: false, error: 'Enter the access code.' }, { status: 400, headers: NO_STORE });
  }

  const real = betaPassword();
  if (!real || !timingSafeEqual(supplied.trim(), real)) {
    return Response.json({ ok: false, error: 'That access code is not right.' }, { status: 401, headers: NO_STORE });
  }

  const res = Response.json({ ok: true }, { headers: NO_STORE });
  // httpOnly so page JS can't read it; Secure + Lax; site-wide; 30 days.
  res.headers.append(
    'Set-Cookie',
    `${BETA_COOKIE}=${BETA_TOKEN}; Path=/; Max-Age=${BETA_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
  );
  return res;
}
