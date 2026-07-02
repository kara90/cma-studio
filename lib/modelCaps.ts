/**
 * lib/modelCaps.ts — per-model output capabilities (client + server safe).
 *
 * Sourced from each model's live fal.ai schema (research run 2026-07-01). The
 * studio only ever offers the resolution / duration / aspect a model REALLY
 * accepts, and the route only sends negative_prompt / seed to models that
 * support them — so a user can never pick a value that 422s the render.
 *
 * duration values are strings in SECONDS as Fal expects; 'auto' = "let the model
 * choose" (we omit the param). resolution / aspect are the raw API values
 * (fmt* helpers give nicer display labels). Empty arrays = no such control → the
 * UI hides it.
 */

export interface ModelCaps {
  resolutionParam: string | null;
  resolutions: readonly string[];
  resolutionDefault: string | null;
  durationParam: string | null;
  durations: readonly string[];
  durationDefault: string | null;
  /**
   * true when the model's duration param is a NUMBER in its schema (e.g.
   * stable-audio-25 `seconds_total`, ace-step `duration`) — the route sends
   * Number(value) instead of the string so the request can't 422 on type.
   */
  durationNumeric?: boolean;
  aspectParam: string | null;
  aspects: readonly string[];
  aspectDefault: string | null;
  supportsSeed: boolean;
  supportsNegativePrompt: boolean;
  /**
   * fal's `safety_tolerance` (string enum "1"–"6"; 1 = strictest, 6 = most
   * permissive; fal default is "4"). Only 3 models accept it per their live
   * schemas — veo-3-1, nano-banana-pro, nano-banana-2 — where we set "6" to cut
   * false-positive content blocks for filmmakers. Every other model leaves this
   * undefined so the route never sends a param that would 422. Verified against
   * the live fal OpenAPI schemas 2026-07-01.
   */
  safetyTolerance?: string;
}

const NONE: ModelCaps = {
  resolutionParam: null, resolutions: [], resolutionDefault: null,
  durationParam: null, durations: [], durationDefault: null,
  aspectParam: null, aspects: [], aspectDefault: null,
  supportsSeed: false, supportsNegativePrompt: false,
};

// The 3 useful aspects we surface (models support more; we keep the UI clean).
const CORE_ASPECTS = ['16:9', '9:16', '1:1'] as const;

// Seedance 2.0 (full) accepts up to 4K per Fal's live schema; the /fast tier is
// genuinely capped at 720p. (Verified against the OpenAPI schema 2026-07-01.)
const SEEDANCE_FULL: ModelCaps = {
  resolutionParam: 'resolution', resolutions: ['480p', '720p', '1080p', '4k'], resolutionDefault: '720p',
  durationParam: 'duration', durations: ['auto', '5', '10', '15'], durationDefault: 'auto',
  aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
  supportsSeed: true, supportsNegativePrompt: false,
};
const SEEDANCE_FAST: ModelCaps = {
  resolutionParam: 'resolution', resolutions: ['480p', '720p'], resolutionDefault: '720p',
  durationParam: 'duration', durations: ['auto', '5', '10', '15'], durationDefault: 'auto',
  aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
  supportsSeed: true, supportsNegativePrompt: false,
};
const KLING_25: ModelCaps = {
  resolutionParam: null, resolutions: [], resolutionDefault: null,
  durationParam: 'duration', durations: ['5', '10'], durationDefault: '5',
  aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
  supportsSeed: false, supportsNegativePrompt: true,
};

export const MODEL_CAPS: Record<string, ModelCaps> = {
  'seedance-2': SEEDANCE_FULL,
  'seedance-2-mini': SEEDANCE_FAST,
  'kling-2-5': KLING_25,
  'kling-2-6': KLING_25,
  'kling-3': {
    resolutionParam: null, resolutions: [], resolutionDefault: null,
    durationParam: 'duration', durations: ['5', '10', '15'], durationDefault: '5',
    aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
    supportsSeed: false, supportsNegativePrompt: false,
  },
  hailuo: {
    resolutionParam: null, resolutions: [], resolutionDefault: null,
    durationParam: 'duration', durations: ['6', '10'], durationDefault: '6',
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: false, supportsNegativePrompt: false,
  },
  'veo-3-1': {
    resolutionParam: 'resolution', resolutions: ['720p', '1080p', '4k'], resolutionDefault: '1080p',
    durationParam: 'duration', durations: ['4s', '6s', '8s'], durationDefault: '8s',
    aspectParam: 'aspect_ratio', aspects: ['16:9', '9:16'], aspectDefault: '16:9',
    supportsSeed: true, supportsNegativePrompt: true, safetyTolerance: '6',
  },
  'grok-imagine': {
    resolutionParam: 'resolution', resolutions: ['480p', '720p'], resolutionDefault: '720p',
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
    supportsSeed: false, supportsNegativePrompt: false,
  },
  // Image models — resolution + aspect (no duration).
  'nano-banana-pro': {
    resolutionParam: 'resolution', resolutions: ['1K', '2K', '4K'], resolutionDefault: '2K',
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
    supportsSeed: true, supportsNegativePrompt: false, safetyTolerance: '6',
  },
  'nano-banana-2': {
    resolutionParam: 'resolution', resolutions: ['0.5K', '1K', '2K', '4K'], resolutionDefault: '2K',
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
    supportsSeed: true, supportsNegativePrompt: false, safetyTolerance: '6',
  },
  'gpt-image-2': {
    // GPT Image uses image_size (square/landscape/portrait) instead of aspect_ratio.
    resolutionParam: 'image_size', resolutions: ['1024x1024', '1536x1024', '1024x1536'], resolutionDefault: '1024x1024',
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: false, supportsNegativePrompt: false,
  },
  // ── Audio models ── (schema-verified 2026-07-02; no resolution/aspect params)
  lyria2: {
    // Fixed ~30s output; supports negative_prompt + seed per its live schema.
    resolutionParam: null, resolutions: [], resolutionDefault: null,
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: true, supportsNegativePrompt: true,
  },
  'stable-audio-25': {
    // seconds_total is an INTEGER 1-190 (fal default is the 190 MAX — we never send that blind).
    resolutionParam: null, resolutions: [], resolutionDefault: null,
    durationParam: 'seconds_total', durations: ['10', '30', '60', '120', '190'], durationDefault: '30', durationNumeric: true,
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: true, supportsNegativePrompt: false,
  },
  'ace-step': {
    // duration is a NUMBER 5-240 seconds, default 60.
    resolutionParam: null, resolutions: [], resolutionDefault: null,
    durationParam: 'duration', durations: ['30', '60', '120', '240'], durationDefault: '60', durationNumeric: true,
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: true, supportsNegativePrompt: false,
  },
  'elevenlabs-multilingual-v2': {
    // TTS — length is driven by the text; no duration/seed/negative params.
    resolutionParam: null, resolutions: [], resolutionDefault: null,
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: false, supportsNegativePrompt: false,
  },
  'kokoro-american-english': {
    resolutionParam: null, resolutions: [], resolutionDefault: null,
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: false, supportsNegativePrompt: false,
  },
};

export function getModelCaps(id: string): ModelCaps {
  return MODEL_CAPS[id] ?? NONE;
}

/** Nicer display labels (the stored value is still the raw API value). */
export function fmtRes(v: string): string {
  const map: Record<string, string> = { '4k': '4K', '1024x1024': 'Square', '1536x1024': 'Landscape', '1024x1536': 'Portrait' };
  return map[v] ?? v;
}
export function fmtDur(v: string): string {
  if (v === 'auto') return 'Auto';
  return /s$/.test(v) ? v : `${v}s`;
}
export function fmtAspect(v: string): string {
  const map: Record<string, string> = { '16:9': 'Landscape', '9:16': 'Vertical', '1:1': 'Square' };
  return map[v] ?? v;
}
