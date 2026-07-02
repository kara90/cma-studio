/**
 * lib/vcpMatrix.ts — CORE HARDWARE MATRIX  (server-authoritative)
 * ─────────────────────────────────────────────────────────────────────────
 * Type-safe map from physical film-production hardware signatures to explicit
 * descriptive prompt injections. This module holds the *proprietary* injection
 * strings and texture math inputs. It is imported ONLY by server code
 * (app/api/**) and the prompt compiler — never by a client component — so the
 * full injection language is never shipped to the browser bundle. The UI reads
 * the redacted `lib/vcpManifest.ts` instead.
 */

export type SensorType = 'Celluloid' | 'S35-Digital' | 'LargeFormat-Digital' | 'Digital-8K';

export interface CameraRecord {
  /** stable key used across the wire */
  readonly id: string;
  /** human label shown in the drum selector */
  readonly label: string;
  readonly brand: string;
  /** capture format, e.g. "Super 35" */
  readonly format: string;
  /** sensor family — drives the texture/grain branch in the compiler */
  readonly sensor: SensorType;
  readonly colorScience: string;
  /** proprietary descriptive injection appended to the render prompt */
  readonly promptInjection: string;
  /**
   * baseline organic grain coefficient (0–1). For Celluloid bodies this seeds
   * the chemical film-grain matrix; for digital bodies it is a floor that
   * native-ISO luminance gain adds to.
   */
  readonly grainBias: number;
  /** native ISO of the sensor/stock — reference point for gain noise */
  readonly nativeIso: number;
}

export interface LensRecord {
  readonly id: string;
  readonly label: string;
  readonly brand: string;
  /** 'anamorphic' squeezes; 'spherical' does not — affects aspect guidance */
  readonly geometry: 'anamorphic' | 'spherical';
  /** anamorphic squeeze factor, 1 for spherical */
  readonly squeeze: number;
  readonly promptInjection: string;
  /** recommended focal lengths (mm) surfaced in the focal drum */
  readonly focalLengths: readonly number[];
  /** widest usable aperture (T-stop) for the aperture drum */
  readonly maxAperture: number;
}

/* ───────────────────────────── CAMERA_DATABASE ───────────────────────────── */

export const CAMERA_DATABASE: Record<string, CameraRecord> = {
  'cinefilm-70': {
    id: 'cinefilm-70',
    label: 'Cinefilm 70mm',
    brand: 'Large Format',
    format: '70mm Film',
    sensor: 'Celluloid',
    colorScience: '70mm large-format film',
    promptInjection:
      'shot on large-format 70mm motion-picture film, immense resolution and fine detail, ' +
      'rich organic film grain, epic cinematic scale and depth, gentle halation around ' +
      'highlights, deep filmic latitude and creamy highlight roll-off',
    grainBias: 0.4,
    nativeIso: 500,
  },
  'digital-super35': {
    id: 'digital-super35',
    label: 'Digital Film Camera Super 35mm',
    brand: 'Digital',
    format: 'Super 35',
    sensor: 'S35-Digital',
    colorScience: 'filmic color science',
    promptInjection:
      'captured on a professional Super 35 digital cinema sensor with filmic color science, ' +
      'natural filmic latitude holding highlight roll-off and deep shadow detail, ' +
      'soft rendered skin tones, wide dynamic range, organic photochemical-style response',
    grainBias: 0.12,
    nativeIso: 800,
  },
  'cinema-8k': {
    id: 'cinema-8k',
    label: 'Cinema 8K Digital',
    brand: 'Digital',
    format: 'Full-Frame 8K',
    sensor: 'Digital-8K',
    colorScience: 'wide-gamut digital',
    promptInjection:
      'captured on an 8K digital cinema sensor, razor-sharp precision and micro-detail, ' +
      'modern high-contrast digital pop, clean crisp edges, punchy saturated color, ' +
      'pristine commercial-grade clarity',
    grainBias: 0.04,
    nativeIso: 800,
  },
  'mirrorless': {
    id: 'mirrorless',
    label: 'Mirrorless Camera',
    brand: 'Digital',
    format: 'Full Frame',
    sensor: 'LargeFormat-Digital',
    colorScience: 'full-frame digital',
    promptInjection:
      'captured on a full-frame mirrorless camera, clean modern digital rendering, ' +
      'shallow depth of field with smooth natural bokeh, contemporary color, ' +
      'crisp fine detail and pleasing subject separation',
    grainBias: 0.06,
    nativeIso: 400,
  },
  'vintage-cine': {
    id: 'vintage-cine',
    label: 'Vintage Cinema Film',
    brand: 'Celluloid',
    format: 'Super 35 Film',
    sensor: 'Celluloid',
    colorScience: 'vintage film emulsion',
    promptInjection:
      'shot on vintage Super 35 celluloid film stock, warm chemical emulsion response, ' +
      'gentle halation around highlights, living breathing organic film grain, ' +
      'subtle gate weave, nostalgic analog photochemical texture',
    grainBias: 0.5,
    nativeIso: 500,
  },
  'super16': {
    id: 'super16',
    label: 'Super 16mm Film',
    brand: 'Celluloid',
    format: 'Super 16 Film',
    sensor: 'Celluloid',
    colorScience: '16mm film stock',
    promptInjection:
      'shot on Super 16mm film, pronounced coarse organic grain, softer nostalgic ' +
      'resolution, vintage documentary texture, gentle gate weave, warm analog film character',
    grainBias: 0.65,
    nativeIso: 400,
  },
  'vintage-photo': {
    id: 'vintage-photo',
    label: 'Vintage Photo Camera',
    brand: 'Celluloid',
    format: '35mm Stills Film',
    sensor: 'Celluloid',
    colorScience: 'photographic film',
    promptInjection:
      'shot on a vintage film photo camera, classic still-photography rendering, ' +
      'timeless analog character, fine organic film grain, natural film color, ' +
      'subtle corner vignette',
    grainBias: 0.45,
    nativeIso: 400,
  },
};

/* ────────────────────────────── LENS_DATABASE ────────────────────────────── */

export const LENS_DATABASE: Record<string, LensRecord> = {
  'panavision-c-series-anamorphic': {
    id: 'panavision-c-series-anamorphic',
    label: 'Premium Anamorphic',
    brand: 'Anamorphic',
    geometry: 'anamorphic',
    squeeze: 2,
    promptInjection:
      'through a premium anamorphic lens, vertically-squeezed oval bokeh, ' +
      'horizontal streak lens flares, romantic soft corner falloff, gentle edge ' +
      'distortion, characterful widescreen anamorphic scope rendering',
    focalLengths: [40, 50, 75, 100],
    maxAperture: 2.3,
  },
  'modern-anamorphic': {
    id: 'modern-anamorphic',
    label: 'Modern Anamorphic',
    brand: 'Anamorphic',
    geometry: 'anamorphic',
    squeeze: 2,
    promptInjection:
      'through a modern anamorphic lens, clean oval bokeh, controlled horizontal ' +
      'streak flares, crisp edges with subtle anamorphic character, contemporary ' +
      'widescreen anamorphic scope rendering',
    focalLengths: [35, 50, 75, 100],
    maxAperture: 2.3,
  },
  'cooke-speed-panchro-vintage': {
    id: 'cooke-speed-panchro-vintage',
    label: "Vintage 70's",
    brand: 'Spherical Prime',
    geometry: 'spherical',
    squeeze: 1,
    promptInjection:
      'through a vintage 1970s spherical prime lens, swirly warm painterly bokeh, ' +
      'golden low-contrast veiling flare, gentle bloom in highlights, soft romantic ' +
      'vintage rendering',
    focalLengths: [25, 32, 40, 50, 75],
    maxAperture: 2.0,
  },
  'arri-signature-prime': {
    id: 'arri-signature-prime',
    label: 'Cine Prime',
    brand: 'Modern Spherical',
    geometry: 'spherical',
    squeeze: 1,
    promptInjection:
      'through a modern cine prime lens, velvety perfectly-round bokeh circles, ' +
      'edge-to-edge sharpness, zero geometric distortion, smooth natural focus roll-off, ' +
      'clean neutral high-fidelity rendering',
    focalLengths: [18, 25, 35, 47, 75, 125],
    maxAperture: 1.8,
  },
  'modern-zoom': {
    id: 'modern-zoom',
    label: 'Modern Zoom',
    brand: 'Spherical',
    geometry: 'spherical',
    squeeze: 1,
    promptInjection:
      'through a modern spherical cine zoom lens, clean neutral high-fidelity rendering, ' +
      'sharp edge-to-edge across a versatile focal range, smooth even circular bokeh, ' +
      'minimal geometric distortion, controlled modern flare',
    focalLengths: [24, 35, 50, 70, 85, 100],
    maxAperture: 2.8,
  },
};

/* ───────────────────────────── lookup helpers ───────────────────────────── */

export function getCamera(key: string): CameraRecord | undefined {
  return CAMERA_DATABASE[key];
}
export function getLens(key: string): LensRecord | undefined {
  return LENS_DATABASE[key];
}
