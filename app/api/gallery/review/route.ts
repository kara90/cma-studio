/**
 * POST /api/gallery/review — OWNER-ONLY approve/reject for pending entries.
 *
 * approve → the entry moves gal/pending/ → gal/approved/ (with approvedAt) and
 *           only then becomes publicly visible.
 * reject  → the pending entry is deleted. Nothing is ever auto-published.
 *
 * Guarded by the temporary OWNER_REVIEW_KEY (see lib/ownerGate.ts).
 * ⚠ SEAM (accounts pass): swap the key check for real owner authentication.
 */
import { z } from 'zod';
import { isOwner } from '@/lib/ownerGate';
import { getGalleryEntry, putGalleryEntry, deleteGalleryEntry } from '@/lib/platformStore';
import { CATEGORY_IDS } from '@/lib/galleryCategories';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

const BodySchema = z.object({
  id: z.string().min(1).max(64),
  action: z.enum(['approve', 'reject']),
  /** owner assigns/confirms the model category at approval time */
  category: z.enum(CATEGORY_IDS).optional(),
});

export async function POST(request: Request) {
  const key = request.headers.get('x-owner-key');
  if (!isOwner(key)) {
    return Response.json({ ok: false, error: 'Owner key required.' }, { status: 401, headers: NO_STORE });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return Response.json({ ok: false, error: 'Invalid review request.' }, { status: 400, headers: NO_STORE });
  }

  const entry = await getGalleryEntry('pending', body.id);
  if (!entry) return Response.json({ ok: false, error: 'Entry not found (already reviewed?).' }, { status: 404, headers: NO_STORE });

  if (body.action === 'approve') {
    const ok = await putGalleryEntry('approved', {
      ...entry,
      // the owner's category call wins over the submitter's filing
      category: body.category ?? entry.category,
      approvedAt: new Date().toISOString(),
    });
    if (!ok) return Response.json({ ok: false, error: 'Could not approve. Try again.' }, { status: 500, headers: NO_STORE });
  }
  await deleteGalleryEntry('pending', body.id);

  return Response.json({ ok: true }, { headers: NO_STORE });
}
