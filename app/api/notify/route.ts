/**
 * app/api/notify/route.ts — launch-notify email capture (public, no auth).
 *
 * Stores {email, source} in CMA_PLATFORM KV under nl/{source}/{id}. Nothing
 * else is collected. The email is NEVER logged (same discipline as the fal
 * key: no console call in this handler touches request data).
 */
import { z } from 'zod';
import { softRateLimit } from '@/lib/rateLimit';
import { platformKV, newId } from '@/lib/platformStore';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

const BodySchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email.').max(200),
  source: z.enum(['marketing', 'real-estate', 'general']),
});

export async function POST(request: Request) {
  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'anon';
  if (!softRateLimit(`notify:${ip}`, 6, 60_000)) {
    return Response.json({ ok: false, error: 'Too many attempts. Give it a minute.' }, { status: 429, headers: NO_STORE });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return Response.json({ ok: false, error: 'Enter a valid email.' }, { status: 400, headers: NO_STORE });
  }

  const kv = platformKV();
  if (!kv) {
    // Local dev without bindings — accept without storing so the UI flow works.
    return Response.json({ ok: true }, { headers: NO_STORE });
  }
  try {
    await kv.put(`nl/${body.source}/${newId()}`, JSON.stringify({ email: body.email, at: new Date().toISOString() }));
  } catch {
    return Response.json({ ok: false, error: 'Could not save your email. Try again.' }, { status: 500, headers: NO_STORE });
  }
  return Response.json({ ok: true }, { headers: NO_STORE });
}
