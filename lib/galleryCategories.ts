/**
 * lib/galleryCategories.ts — the community gallery's MODEL CATEGORIES
 * (client-safe: imported by the submit form, the public wall, the owner queue
 * and the API routes).
 *
 * Submissions are organized BY MODEL, not mixed together. To add a category
 * later (a new model or studio), append one line here — the submit picker, the
 * grouped public display, the owner queue's category selector and the API
 * validation all follow automatically.
 */

export const GALLERY_CATEGORIES = [
  { id: 'seedance', label: 'Seedance' },
  { id: 'nano-banana', label: 'Nano Banana' },
  { id: 'kling-director', label: 'Kling Director' },
  { id: 'cma-director-studio', label: 'CMA Director Studio' },
] as const;

export type GalleryCategoryId = (typeof GALLERY_CATEGORIES)[number]['id'];

export const CATEGORY_IDS = GALLERY_CATEGORIES.map((c) => c.id) as [GalleryCategoryId, ...GalleryCategoryId[]];

export function categoryLabel(id: string | undefined): string {
  return GALLERY_CATEGORIES.find((c) => c.id === id)?.label ?? 'CMA Studio';
}

/**
 * Resolve an entry's category, tolerating records submitted before categories
 * existed (those carried only the legacy `tool` field).
 */
export function entryCategory(e: { category?: string; tool?: string }): GalleryCategoryId {
  if (e.category && (CATEGORY_IDS as readonly string[]).includes(e.category)) return e.category as GalleryCategoryId;
  if (e.tool === 'director-studio') return 'cma-director-studio';
  return 'cma-director-studio'; // legacy default; the owner queue can reassign
}
