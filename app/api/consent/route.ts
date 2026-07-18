/**
 * POST /api/consent — log an enrollment-gate acceptance as proof of consent.
 *
 * Records date + the exact VERSION of each document the user scrolled and
 * accepted + which clause boxes were ticked, in CMA_PLATFORM KV under
 * consent/{id}. The returned id also rides into the checkout payload and on
 * to Stripe metadata, tying the payment to this record.
 *
 * ⚠ SEAM (accounts pass): records are anonymous today (no accounts system);
 * they gain a user id when auth lands. No PII is collected here.
 */
import { z } from 'zod';
import { softRateLimit } from '@/lib/rateLimit';
import { platformKV, newId } from '@/lib/platformStore';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

const BodySchema = z.object({
  context: z.enum(['checkout', 'signup']),
  plan: z.string().max(60).optional(),
  docs: z
    .array(z.object({ id: z.string().max(20), version: z.string().max(20) }))
    .min(1)
    .max(8),
  clauses: z.array(z.string().max(20)).max(12),
});

export async function POST(request: Request) {
  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'anon';
  if (!softRateLimit(`consent:${ip}`, 10, 60_000)) {
    return Response.json({ ok: false, error: 'Too many attempts.' }, { status: 429, headers: NO_STORE });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return Response.json({ ok: false, error: 'Invalid consent record.' }, { status: 400, headers: NO_STORE });
  }

  const kv = platformKV();
  const id = newId();
  const record = {
    id,
    at: new Date().toISOString(),
    context: body.context,
    plan: body.plan,
    docs: body.docs,
    clauses: body.clauses,
    // SEAM (accounts pass): userId lands here once auth exists.
  };
  if (kv) {
    try {
      await kv.put(`consent/${id}`, JSON.stringify(record));
    } catch {
      /* best-effort: the checkout payload still carries consent independently */
    }
  }
  return Response.json({ ok: true, id }, { headers: NO_STORE });
}
