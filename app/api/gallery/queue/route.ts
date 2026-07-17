/**
 * GET /api/gallery/queue — OWNER-ONLY list of pending submissions.
 * Guarded by the temporary OWNER_REVIEW_KEY (see lib/ownerGate.ts).
 * ⚠ SEAM (accounts pass): swap the key check for real owner authentication.
 */
import { isOwner } from '@/lib/ownerGate';
import { listGallery } from '@/lib/platformStore';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET(request: Request) {
  const key = request.headers.get('x-owner-key');
  if (!isOwner(key)) {
    return Response.json({ ok: false, error: 'Owner key required.' }, { status: 401, headers: NO_STORE });
  }
  const entries = await listGallery('pending', 100);
  return Response.json({ ok: true, entries }, { headers: NO_STORE });
}
