/**
 * lib/lookPreviews.ts, visual previews for the Style and Lighting tile rows.
 *
 * ============================================================================
 * PLACEHOLDER PREVIEWS. Drop a short muted mp4/webm URL into `clip` for any
 * look and the tile auto plays it. Sebastien supplies real clips later.
 * ============================================================================
 *
 * Every `poster` is a self-contained CSS background value built from gradients
 * only (no external URLs), crafted to evoke the look it stands for. The poster
 * always stays as the fallback, so the grid never shows a blank tile even when
 * a clip URL is missing or the viewer prefers reduced motion.
 *
 * Keys are the EXACT ids from STYLE_OPTIONS and GENRE_OPTIONS in
 * lib/vcpManifest.ts, enforced at compile time via `satisfies`.
 */

import type { VisualStyle, GenreStyle } from '@/lib/vcpManifest';

export interface LookPreview {
  id: string;
  label: string;
  /** Optional short muted video URL. When set, the tile auto plays it. */
  clip?: string;
  /** Gradient-only CSS background evoking the look. Always the fallback. */
  poster: string;
}

/** Visual style axis, keyed by STYLE_OPTIONS ids. */
export const STYLE_PREVIEWS: Record<string, LookPreview> = {
  cinematic: {
    id: 'cinematic',
    label: 'Cinematic',
    clip: '/clips/style-cinematic.mp4', // Sebastien's real sample, compressed for web

    // Deep teal shadows rolling into amber highlights, the blockbuster split tone.
    poster:
      'radial-gradient(120% 90% at 78% 28%, rgba(222,160,84,0.55) 0%, rgba(222,160,84,0) 55%), linear-gradient(108deg, #071f27 0%, #0d3844 46%, #4c3a20 76%, #b0803c 100%)',
  },
  commercial: {
    id: 'commercial',
    label: 'Commercial',
    clip: '/clips/style-commercial.mp4', // Sebastien's real sample

    // Clean silver-white sheen with a single bright sweep, pristine product light.
    poster:
      'linear-gradient(118deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.9) 46%, rgba(255,255,255,0) 62%), linear-gradient(180deg, #f4f6f8 0%, #d9dde2 55%, #b3b9c1 100%)',
  },
  vintage: {
    id: 'vintage',
    label: 'Vintage',
    clip: '/clips/style-vintage.mp4', // Sebastien's real sample, compressed for web
    // Warm faded amber with lifted blacks and a slight magenta bloom.
    poster:
      'radial-gradient(120% 90% at 30% 20%, rgba(224,148,168,0.24) 0%, rgba(224,148,168,0) 58%), linear-gradient(112deg, #55402c 0%, #8a6a44 48%, #b08a5b 78%, #caa878 100%)',
  },
  noir: {
    id: 'noir',
    label: 'Noir',
    clip: '/clips/style-noir.mp4', // Sebastien's real sample, compressed for web

    // Near-black frame cut by one hard white diagonal key streak.
    poster:
      'linear-gradient(118deg, rgba(255,255,255,0) 42%, rgba(244,244,246,0.85) 49%, rgba(255,255,255,0.95) 51%, rgba(228,228,232,0.75) 53%, rgba(255,255,255,0) 60%), linear-gradient(150deg, #0b0c10 0%, #111318 45%, #030304 100%)',
  },
} satisfies Record<VisualStyle, LookPreview>;

/** Lighting axis (genre mood), keyed by GENRE_OPTIONS ids. */
export const LIGHTING_PREVIEWS: Record<string, LookPreview> = {
  neutral: {
    id: 'neutral',
    label: 'Neutral',
    clip: '/clips/style-neutral.mp4', // Sebastien's real sample

    // Balanced grey ramp, no stylistic bias, an even exposure sweep.
    poster:
      'linear-gradient(90deg, #1c1e22 0%, #4a4e55 34%, #82878f 66%, #c6cad1 100%)',
  },
  drama: {
    id: 'drama',
    label: 'Drama',
    clip: '/clips/style-drama.mp4', // Sebastien's real sample, compressed for web
    // Warm soft window key wrapping out of deep shadow, gentle falloff.
    poster:
      'radial-gradient(95% 120% at 28% 32%, rgba(233,178,106,0.75) 0%, rgba(148,94,44,0.28) 42%, rgba(148,94,44,0) 66%), linear-gradient(135deg, #201409 0%, #120b05 55%, #050302 100%)',
  },
  horror: {
    id: 'horror',
    label: 'Horror',
    clip: '/clips/style-horror.mp4', // Sebastien's real sample (the creature clip)

    // Cold green-cyan low key sinking into near-black.
    poster:
      'radial-gradient(90% 110% at 72% 18%, rgba(88,178,150,0.45) 0%, rgba(38,92,78,0.18) 45%, rgba(38,92,78,0) 68%), linear-gradient(160deg, #071310 0%, #0a1a16 50%, #020504 100%)',
  },
  'action-high-motion': {
    id: 'action-high-motion',
    label: 'Action',
    clip: '/clips/style-action.mp4', // Sebastien's real sample, compressed for web

    // High-contrast orange against teal with a hot diagonal motion streak.
    poster:
      'linear-gradient(102deg, rgba(255,150,60,0) 40%, rgba(255,150,60,0.85) 50%, rgba(255,196,120,0.55) 55%, rgba(255,150,60,0) 66%), linear-gradient(102deg, #06222c 0%, #0d3d4d 45%, #7a3c12 78%, #d96f24 100%)',
  },
} satisfies Record<GenreStyle, LookPreview>;
