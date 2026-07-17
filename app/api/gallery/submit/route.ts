/**
 * POST /api/gallery/submit — community submissions (public, rate-limited).
 *
 * SUBMIT-THEN-APPROVE, hard rule: everything lands in gal/pending/ and stays
 * invisible until the owner approves it in the review queue. Nothing in this
 * route can write to gal/approved/.
 */
import { z } from 'zod';
import { softRateLimit } from '@/lib/rateLimit';
import { platformKV, putGalleryEntry, newId, type GalleryEntry } from '@/lib/platformStore';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function bad(status: number, error: string) {
  return Response.json({ ok: false, error }, { status, headers: NO_STORE });
}

const BodySchema = z.object({
  name: z.string().trim().min(1, 'Add your name or handle.').max(80),
  title: z.string().trim().min(1, 'Give the piece a title.').max(140),
  tool: z.enum(['director-studio', 'video', 'image', 'audio']),
  /** small client-made JPEG/WebP data URI — the durable visual */
  thumb: z.string().regex(/^data:image\/(jpeg|webp|png);base64,/, 'Invalid thumbnail.').max(400_000),
  /** optional link to the full render (may expire; thumb is what we keep) */
  url: z.string().trim().url().max(2000).startsWith('https://').optional().or(z.literal('').transform(() => undefined)),
});

export async function POST(request: Request) {
  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'anon';
  if (!softRateLimit(`gal-submit:${ip}`, 4, 60_000)) {
    return bad(429, 'Too many submissions in a short window. Give it a minute.');
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? (e.issues[0]?.message ?? 'Invalid submission.') : 'Malformed submission.';
    return bad(400, msg);
  }

  if (!platformKV()) return bad(503, 'The gallery store is offline right now. Try again later.');

  const entry: GalleryEntry = {
    id: newId(),
    name: body.name,
    title: body.title,
    tool: body.tool,
    thumb: body.thumb,
    url: body.url,
    submittedAt: new Date().toISOString(),
  };
  const saved = await putGalleryEntry('pending', entry);
  if (!saved) return bad(500, 'Could not save your submission. Try again.');

  return Response.json({ ok: true, id: entry.id }, { headers: NO_STORE });
}
