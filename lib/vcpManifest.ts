/**
 * lib/vcpManifest.ts — CLIENT-SAFE HARDWARE MANIFEST
 * ─────────────────────────────────────────────────────────────────────────
 * The redacted, display-only view of the hardware matrix. This is the ONLY
 * hardware data a client component may import. It carries labels, specs and
 * selectable ranges for the drum wheels — but deliberately NOT the proprietary
 * `promptInjection` strings from lib/vcpMatrix.ts, which stay on the server.
 *
 * Keep the ids here in sync with lib/vcpMatrix.ts.
 */

export interface CameraOption {
  id: string;
  label: string;
  brand: string;
  /** short spec line shown under the drum item, e.g. "Super 35 · REVEAL" */
  spec: string;
  isCelluloid: boolean;
  /** glyph variant (HardwareGlyph). Or set `image` to a /public path for a real photo. */
  glyph: 's35' | 'largeformat' | 'digital8k' | 'celluloid';
  image?: string;
}

export interface LensOption {
  id: string;
  label: string;
  brand: string;
  spec: string;
  geometry: 'anamorphic' | 'spherical';
  focalLengths: number[];
  maxAperture: number;
  glyph: 'anamorphic' | 'spherical' | 'vintage';
  image?: string;
}

export const CAMERA_OPTIONS: CameraOption[] = [
  { id: 'cinefilm-70', label: 'Cinefilm 70mm', brand: 'Large Format', spec: '70mm film · epic scale', isCelluloid: true, glyph: 'largeformat', image: '/cameras/cinefilm-70.png' },
  { id: 'digital-super35', label: 'Digital Film S35', brand: 'Digital', spec: 'Super 35 · filmic latitude', isCelluloid: false, glyph: 's35', image: '/cameras/digital-super35.png' },
  { id: 'cinema-8k', label: 'Cinema 8K Digital', brand: 'Digital', spec: '8K · high-contrast pop', isCelluloid: false, glyph: 'digital8k', image: '/cameras/cinema-8k.png' },
  { id: 'mirrorless', label: 'Mirrorless Camera', brand: 'Digital', spec: 'Full-frame · modern', isCelluloid: false, glyph: 'largeformat', image: '/cameras/mirrorless.png' },
  { id: 'vintage-cine', label: 'Vintage Cinema Film', brand: 'Celluloid', spec: 'Super 35 · vintage film', isCelluloid: true, glyph: 'celluloid', image: '/cameras/vintage-cine.png' },
  { id: 'super16', label: 'Super 16mm Film', brand: 'Celluloid', spec: '16mm · grainy, nostalgic', isCelluloid: true, glyph: 'celluloid', image: '/cameras/super16.png' },
  { id: 'vintage-photo', label: 'Vintage Photo Camera', brand: 'Celluloid', spec: 'Stills · analog character', isCelluloid: true, glyph: 'celluloid', image: '/cameras/vintage-photo.png' },
];

// Generic, brand-free lens names. The `spec` line is the CATEGORY (the small
// white text under the name). Squeeze is NOT baked into the lens — the user
// picks 1.3×/1.5×/2× in the Anamorphic panel — so no "2x" appears here.
export const LENS_OPTIONS: LensOption[] = [
  {
    id: 'panavision-c-series-anamorphic',
    label: 'Premium Anamorphic',
    brand: 'Anamorphic',
    spec: 'Anamorphic',
    geometry: 'anamorphic',
    focalLengths: [40, 50, 75, 100],
    maxAperture: 2.3,
    glyph: 'anamorphic',
    image: '/lenses/c-series.png',
  },
  {
    id: 'modern-anamorphic',
    label: 'Modern Anamorphic',
    brand: 'Anamorphic',
    spec: 'Anamorphic',
    geometry: 'anamorphic',
    focalLengths: [35, 50, 75, 100],
    maxAperture: 2.3,
    glyph: 'anamorphic',
    image: '/lenses/modern-anamorphic.png',
  },
  {
    id: 'arri-signature-prime',
    label: 'Cine Prime',
    brand: 'Modern Spherical',
    spec: 'Modern Spherical',
    geometry: 'spherical',
    focalLengths: [18, 25, 35, 47, 75, 125],
    maxAperture: 1.8,
    glyph: 'spherical',
    image: '/lenses/signature-prime.png',
  },
  {
    id: 'modern-zoom',
    label: 'Modern Zoom',
    brand: 'Spherical',
    spec: 'Spherical',
    geometry: 'spherical',
    focalLengths: [24, 35, 50, 70, 85, 100],
    maxAperture: 2.8,
    glyph: 'spherical',
    image: '/lenses/zoom.png',
  },
  {
    id: 'cooke-speed-panchro-vintage',
    label: "Vintage 70's",
    brand: 'Spherical Prime',
    spec: 'Spherical Prime',
    geometry: 'spherical',
    focalLengths: [25, 32, 40, 50, 75],
    maxAperture: 2.0,
    glyph: 'vintage',
    image: '/lenses/cooke.png',
  },
];

export const APERTURE_STOPS = [1.4, 1.8, 2, 2.3, 2.8, 4, 5.6, 8, 11, 16] as const;

/**
 * Anamorphic squeeze options. `ratio` is the delivery aspect the scope is
 * letterboxed to (the preview bars are computed from it vs the 16:9 monitor);
 * `falAspect` is the nearest aspect Fal actually renders at.
 */
export interface AnamorphicOption {
  id: string;
  label: string;
  squeeze: number;
  ratio: number; // width / height of the delivered frame
  falAspect: '16:9' | '21:9';
}

// falAspect is the aspect actually sent to Fal. Fal's text-to-video models only
// accept 16:9 / 9:16 / 1:1 — NOT 21:9 (sending it 422s every render). So every
// squeeze renders at 16:9; the anamorphic SCOPE is expressed in the prompt text
// and drawn as a letterbox preview in the scope, never as an unsupported ratio.
export const ANAMORPHIC_OPTIONS: AnamorphicOption[] = [
  { id: 'none', label: 'None · 16:9', squeeze: 1, ratio: 16 / 9, falAspect: '16:9' },
  { id: '1.3', label: '1.3× · 1.85:1', squeeze: 1.3, ratio: 1.85, falAspect: '16:9' },
  { id: '1.5', label: '1.5× · 2.0:1', squeeze: 1.5, ratio: 2.0, falAspect: '16:9' },
  { id: '2', label: '2× · 2.39:1', squeeze: 2, ratio: 2.39, falAspect: '16:9' },
];

export function findAnamorphic(id: string): AnamorphicOption {
  return ANAMORPHIC_OPTIONS.find((a) => a.id === id) ?? ANAMORPHIC_OPTIONS[0];
}

/**
 * Anamorphic flare colour. Only meaningful when a squeeze is active; the choice
 * is forwarded to the server compiler, which tweaks the prompt toward warm
 * golden or cool blue horizontal streak flares.
 */
export type FlareColor = 'blue' | 'gold';

export const FLARE_OPTIONS: { id: FlareColor; label: string; swatch: string }[] = [
  { id: 'blue', label: 'Blue flares', swatch: '#5b8dd6' },
  { id: 'gold', label: 'Golden flares', swatch: '#e7b45a' },
];

/** Letterbox bar height as a fraction of a 16:9 monitor, for a target ratio. */
export function letterboxPct(ratio: number): number {
  const container = 16 / 9;
  if (ratio <= container) return 0;
  return ((1 - container / ratio) / 2) * 100;
}

export type GenreStyle = 'neutral' | 'horror' | 'drama' | 'action-high-motion';

export const GENRE_OPTIONS: { id: GenreStyle; label: string; hint: string }[] = [
  { id: 'neutral', label: 'Neutral', hint: 'No stylistic lighting bias' },
  { id: 'drama', label: 'Drama', hint: 'Soft wrap-around window key, gentle contrast' },
  { id: 'horror', label: 'Horror', hint: 'Chiaroscuro shadow, hard low-key edge' },
  { id: 'action-high-motion', label: 'Action', hint: 'High motion, hard directional light, deep contrast' },
];

/**
 * Visual style — a second creative axis, above the lighting genre. Where the
 * genre sets the LIGHTING mood, the style sets the overall film aesthetic. It's
 * forwarded to the server compiler, which injects the matching look language.
 */
export type VisualStyle = 'cinematic' | 'commercial' | 'vintage' | 'noir';

export const STYLE_OPTIONS: { id: VisualStyle; label: string; hint: string }[] = [
  { id: 'cinematic', label: 'Cinematic', hint: 'Filmic blockbuster look — the default' },
  { id: 'commercial', label: 'Commercial', hint: 'Polished, glossy, pristine product-grade' },
  { id: 'vintage', label: 'Vintage', hint: 'Retro period-film aesthetic' },
  { id: 'noir', label: 'Noir', hint: 'High-contrast, deep shadow, moody' },
];

export function findStyle(id: string): { id: VisualStyle; label: string; hint: string } {
  return STYLE_OPTIONS.find((s) => s.id === id) ?? STYLE_OPTIONS[0];
}

/* ── Director controls (Manual): framing, movement, colour grade ──────────────
 * Each maps to a descriptive injection compiled server-side, exactly like style
 * and genre. Auto-Direct sets its own framing via the shot ANGLE, so these are
 * only sent in Manual mode. */

export type ShotSize = 'wide' | 'full' | 'medium' | 'close' | 'extreme-close';
export const SHOT_OPTIONS: { id: ShotSize; label: string; hint: string }[] = [
  { id: 'wide', label: 'Wide', hint: 'Establishing — the full environment' },
  { id: 'full', label: 'Full', hint: 'Whole subject, head to toe' },
  { id: 'medium', label: 'Medium', hint: 'Framed from the waist up' },
  { id: 'close', label: 'Close-up', hint: 'On the face, shallow focus' },
  { id: 'extreme-close', label: 'Extreme CU', hint: 'Macro detail filling the frame' },
];

export type CameraMove = 'static' | 'push-in' | 'tracking' | 'pan' | 'tilt' | 'crane' | 'handheld';
export const MOVE_OPTIONS: { id: CameraMove; label: string; hint: string }[] = [
  { id: 'static', label: 'Static', hint: 'Locked-off, steady frame' },
  { id: 'push-in', label: 'Push-in', hint: 'Slow dolly toward the subject' },
  { id: 'tracking', label: 'Tracking', hint: 'Moves alongside the subject' },
  { id: 'pan', label: 'Pan', hint: 'Horizontal sweep' },
  { id: 'tilt', label: 'Tilt', hint: 'Vertical sweep' },
  { id: 'crane', label: 'Crane', hint: 'Sweeping jib reveal' },
  { id: 'handheld', label: 'Handheld', hint: 'Organic documentary shake' },
];

export type ColorGrade = 'neutral' | 'warm' | 'cool' | 'teal-orange' | 'bleach' | 'mono';
export const GRADE_OPTIONS: { id: ColorGrade; label: string; hint: string }[] = [
  { id: 'neutral', label: 'Neutral', hint: 'Faithful, natural colour' },
  { id: 'warm', label: 'Warm', hint: 'Golden, amber highlights' },
  { id: 'cool', label: 'Cool', hint: 'Cold blue shadows' },
  { id: 'teal-orange', label: 'Teal & Orange', hint: 'Blockbuster grade' },
  { id: 'bleach', label: 'Bleach Bypass', hint: 'Desaturated silver, high contrast' },
  { id: 'mono', label: 'B&W', hint: 'Monochrome' },
];

export function findShot(id: string) { return SHOT_OPTIONS.find((o) => o.id === id) ?? SHOT_OPTIONS[2]; }
export function findMove(id: string) { return MOVE_OPTIONS.find((o) => o.id === id) ?? MOVE_OPTIONS[0]; }
export function findGrade(id: string) { return GRADE_OPTIONS.find((o) => o.id === id) ?? GRADE_OPTIONS[0]; }

export function findCamera(id: string): CameraOption | undefined {
  return CAMERA_OPTIONS.find((c) => c.id === id);
}
export function findLens(id: string): LensOption | undefined {
  return LENS_OPTIONS.find((l) => l.id === id);
}
