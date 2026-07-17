/**
 * GET /api/gallery — the PUBLIC community gallery: approved entries only.
 * Nothing reaches this list without explicit owner approval (see
 * /api/gallery/review). Pending submissions are never exposed here.
 */
import { listGallery } from '@/lib/platformStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const entries = await listGallery('approved', 60);
  // Thumbs are self-contained data URIs, so the page renders even after a
  // fal render URL has expired.
  return Response.json(
    { ok: true, entries },
    // Small edge/browser cache so busy days don't hammer KV reads.
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  );
}
