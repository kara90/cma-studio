/**
 * lib/modelCaps.ts — per-model output capabilities (client + server safe).
 *
 * Sourced from each model's live fal.ai schema (research runs 2026-07-01/02).
 * The studio only ever offers the resolution / duration / aspect a model REALLY
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
  /**
   * Free numeric duration window (schema min/max) for models whose param is an
   * unrestricted number — unlocks second-by-second control on the DurationDial
   * (the `durations` presets become tick marks). Requires durationNumeric.
   */
  durationRange?: { min: number; max: number };
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
  /**
   * Sound on/off switch (fal's `generate_audio`) — re-verified against the live
   * fal OpenAPI schemas 2026-07-18: seedance-2 / seedance-2-mini / kling-2-6 /
   * kling-3 / veo-3-1 ALL default true (an earlier note here wrongly said
   * kling-3 defaults false — fal's own schema default is true, matching ours).
   * Absent = the model has no audio switch. The route ALWAYS sends it
   * explicitly (user pick or this default) so the compute cost is predictable —
   * audio can double the price on some models, and the sound toggle in the UI
   * always shows the real state before render.
   */
  audioParam?: string;
  audioDefault?: boolean;
  /**
   * Client-safe start/end-frame capability (the actual i2v slugs + param names
   * live server-side in modelEndpoints): 'start-end' = start + end frames,
   * 'start' = start/reference image only, absent = text only.
   */
  frames?: 'start' | 'start-end';
  /**
   * Voice selection (TTS models, audio path only) — schema-verified 2026-07-18.
   * voiceParam = the request param name; voices = the VERIFIED enum when the
   * schema publishes one (empty = free string, capped server-side, curated
   * presets live client-side); voiceWrap 'minimax' nests the id as
   * { voice_id } inside the param (MiniMax's voice_setting object).
   */
  voiceParam?: string;
  voices?: readonly string[];
  voiceDefault?: string;
  voiceWrap?: 'minimax';
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
// duration: fal accepts EVERY second 4-15 (re-verified 2026-07-02) — full control.
// fal also accepts 'auto' duration, but length drives the compute price, so the
// user ALWAYS picks a concrete length (Sebastien's rule: never auto on price).
const SEEDANCE_FULL: ModelCaps = {
  resolutionParam: 'resolution', resolutions: ['480p', '720p', '1080p', '4k'], resolutionDefault: '720p',
  durationParam: 'duration', durations: ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'], durationDefault: '5',
  aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
  // ⚠ Seedance 2.0's LIVE schema has NO seed param (global wiring audit
  // 2026-07-18) — sending one 422s the render. Seedance 1.5 Pro keeps seed.
  supportsSeed: false, supportsNegativePrompt: false,
  audioParam: 'generate_audio', audioDefault: true, // audio included in seedance pricing
  frames: 'start-end',
};
const SEEDANCE_FAST: ModelCaps = {
  resolutionParam: 'resolution', resolutions: ['480p', '720p'], resolutionDefault: '720p',
  durationParam: 'duration', durations: ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'], durationDefault: '5',
  aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
  // ⚠ same as SEEDANCE_FULL: the fast line's schema has no seed param either.
  supportsSeed: false, supportsNegativePrompt: false,
  audioParam: 'generate_audio', audioDefault: true,
  frames: 'start-end',
};
const KLING_25: ModelCaps = {
  resolutionParam: null, resolutions: [], resolutionDefault: null,
  durationParam: 'duration', durations: ['5', '10'], durationDefault: '5',
  aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
  supportsSeed: false, supportsNegativePrompt: true,
  frames: 'start-end', // image_url + tail_image_url on the i2v variant
};

export const MODEL_CAPS: Record<string, ModelCaps> = {
  'seedance-2': SEEDANCE_FULL,
  'seedance-2-mini': SEEDANCE_FAST,
  'kling-2-5': KLING_25,
  'kling-2-6': {
    ...KLING_25,
    // Kling 2.6 has the audio switch (2.5 does not); audio ON doubles fal's price.
    audioParam: 'generate_audio', audioDefault: true,
  },
  // Kling 3 Pro (v3/pro) — every second 3-15, native audio default ON, negative prompt.
  'kling-3': {
    resolutionParam: null, resolutions: [], resolutionDefault: null,
    durationParam: 'duration', durations: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'], durationDefault: '5',
    aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
    supportsSeed: false, supportsNegativePrompt: true,
    audioParam: 'generate_audio', audioDefault: true,
  },
  // Kling O3 Standard — the old value tier keeps frames + audio-off default.
  'kling-o3': {
    resolutionParam: null, resolutions: [], resolutionDefault: null,
    durationParam: 'duration', durations: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'], durationDefault: '5',
    aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
    supportsSeed: false, supportsNegativePrompt: false,
    audioParam: 'generate_audio', audioDefault: false,
    frames: 'start-end',
  },
  // Sora 2 / Sora 2 Pro REMOVED 2026-07-18: fal deprecated the fal-ai/sora-2 line.
  // Veo 3.1 Fast — same controls as full Veo at the speed-tier price.
  'veo-3-1-fast': {
    resolutionParam: 'resolution', resolutions: ['720p', '1080p', '4k'], resolutionDefault: '720p',
    durationParam: 'duration', durations: ['4s', '6s', '8s'], durationDefault: '8s',
    aspectParam: 'aspect_ratio', aspects: ['16:9', '9:16'], aspectDefault: '16:9',
    supportsSeed: true, supportsNegativePrompt: true, safetyTolerance: '6',
    audioParam: 'generate_audio', audioDefault: true,
  },
  'seedance-1-5-pro': {
    resolutionParam: 'resolution', resolutions: ['480p', '720p', '1080p'], resolutionDefault: '720p',
    durationParam: 'duration', durations: ['4', '5', '6', '7', '8', '9', '10', '11', '12'], durationDefault: '5',
    aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
    supportsSeed: true, supportsNegativePrompt: false,
    audioParam: 'generate_audio', audioDefault: true,
  },
  'wan-2-5': {
    resolutionParam: 'resolution', resolutions: ['480p', '720p', '1080p'], resolutionDefault: '1080p',
    durationParam: 'duration', durations: ['5', '10'], durationDefault: '5',
    aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
    supportsSeed: true, supportsNegativePrompt: true,
  },
  // LTX-2 — integer durations, native 4K tier, no aspect param.
  'ltx-2': {
    resolutionParam: 'resolution', resolutions: ['1080p', '1440p', '2160p'], resolutionDefault: '1080p',
    durationParam: 'duration', durations: ['6', '8', '10'], durationDefault: '6', durationNumeric: true,
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: false, supportsNegativePrompt: false,
    audioParam: 'generate_audio', audioDefault: true,
  },
  hailuo: {
    resolutionParam: null, resolutions: [], resolutionDefault: null,
    durationParam: 'duration', durations: ['6', '10'], durationDefault: '6',
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: false, supportsNegativePrompt: false,
    frames: 'start', // hailuo i2v takes a start image only
  },
  'veo-3-1': {
    resolutionParam: 'resolution', resolutions: ['720p', '1080p', '4k'], resolutionDefault: '1080p',
    durationParam: 'duration', durations: ['4s', '6s', '8s'], durationDefault: '8s',
    aspectParam: 'aspect_ratio', aspects: ['16:9', '9:16'], aspectDefault: '16:9',
    supportsSeed: true, supportsNegativePrompt: true, safetyTolerance: '6',
    audioParam: 'generate_audio', audioDefault: true, // audio OFF halves veo's price
    frames: 'start-end', // start via image-to-video; both frames via first-last endpoint
  },
  // grok-imagine REMOVED 2026-07-18 (unconfirmed slug — never listed unverified).
  // Image models — resolution + aspect (no duration). frames:'start' = a
  // reference image flips them to their /edit variant (image_urls array).
  'nano-banana-pro': {
    resolutionParam: 'resolution', resolutions: ['1K', '2K', '4K'], resolutionDefault: '2K',
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
    supportsSeed: true, supportsNegativePrompt: false, safetyTolerance: '6',
    frames: 'start',
  },
  'nano-banana-2': {
    resolutionParam: 'resolution', resolutions: ['0.5K', '1K', '2K', '4K'], resolutionDefault: '2K',
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: 'aspect_ratio', aspects: CORE_ASPECTS, aspectDefault: '16:9',
    supportsSeed: true, supportsNegativePrompt: false, safetyTolerance: '6',
    frames: 'start',
  },
  'gpt-image-2': {
    // Rewired to openai/gpt-image-2 (2026-07-18). Its image_size union isn't
    // enum-verified yet, so we send NO format params — fal applies the model's
    // own default (landscape_4_3) and a render can never 422 on a format value.
    resolutionParam: null, resolutions: [], resolutionDefault: null,
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: false, supportsNegativePrompt: false,
    frames: 'start',
  },
  // ── New image lineup (schema-verified 2026-07-02) ──
  'seedream-4-5': {
    // image_size enum carries the size; auto_2K/auto_4K are the clean choices.
    resolutionParam: 'image_size', resolutions: ['auto_2K', 'auto_4K'], resolutionDefault: 'auto_2K',
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: true, supportsNegativePrompt: false,
  },
  'flux-2-pro': {
    // image_size named enums carry shape; safety_tolerance is 1-5 on FLUX.2.
    resolutionParam: 'image_size', resolutions: ['landscape_16_9', 'portrait_16_9', 'square_hd'], resolutionDefault: 'landscape_16_9',
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: true, supportsNegativePrompt: false, safetyTolerance: '5',
  },
  // imagen-4 REMOVED 2026-07-18: fal deprecated the imagen4/preview line.
  // Seedream 5 (pro + lite) — schema-verified 2026-07-18: prompt is the only
  // required input; image_size defaults to auto_2K server-side at fal and its
  // enum isn't verified, so we send no format params (can never 422). No seed
  // or negative_prompt in the schema.
  'seedream-5-pro': { ...NONE },
  'seedream-5-lite': { ...NONE },
  'ideogram-v3': {
    resolutionParam: 'image_size', resolutions: ['landscape_16_9', 'portrait_16_9', 'square_hd'], resolutionDefault: 'square_hd',
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: true, supportsNegativePrompt: true,
  },
  'flux-1-1-ultra': {
    resolutionParam: null, resolutions: [], resolutionDefault: null, // fixed ~4MP
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: 'aspect_ratio', aspects: ['16:9', '9:16', '1:1', '21:9'], aspectDefault: '16:9',
    supportsSeed: true, supportsNegativePrompt: false, safetyTolerance: '6',
  },
  'recraft-v4-1': {
    resolutionParam: 'image_size', resolutions: ['landscape_16_9', 'portrait_16_9', 'square_hd'], resolutionDefault: 'square_hd',
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: false, supportsNegativePrompt: false,
  },
  // ── Audio models ── (schemas re-verified live 2026-07-18; no resolution/aspect)
  // Eleven v3 — text + free-string voice (fal default "Rachel"); curated preset
  // names live in the Audio Studio UI, anything typed is passed through.
  'eleven-v3': {
    ...NONE,
    voiceParam: 'voice', voices: [], voiceDefault: 'Rachel',
  },
  // MiniMax Speech 2.8 HD — voice rides inside voice_setting.voice_id; the
  // endpoint's buildBody forces output_format:'url' (fal default is hex!).
  'minimax-speech-2-8-hd': {
    ...NONE,
    voiceParam: 'voice_setting', voiceWrap: 'minimax', voiceDefault: 'Wise_Woman',
    voices: [
      'Wise_Woman', 'Friendly_Person', 'Deep_Voice_Man', 'Calm_Woman', 'Casual_Guy',
      'Lively_Girl', 'Patient_Man', 'Elegant_Man', 'Determined_Man', 'Lovely_Girl',
      'Decent_Boy', 'Abbess',
    ],
  },
  // ElevenLabs SFX v2 — duration_seconds float; ElevenLabs caps SFX at ~22s,
  // 'auto' omits the param and lets the model choose.
  'elevenlabs-sfx-v2': {
    ...NONE,
    durationParam: 'duration_seconds', durations: ['auto', '5', '10', '15', '22'],
    durationDefault: 'auto', durationNumeric: true, durationRange: { min: 1, max: 22 },
  },
  // ElevenLabs Music — length in MILLISECONDS (music_length_ms); the Audio
  // Studio renders these values as seconds. force_instrumental rides the
  // audioParam channel and is labeled "Instrumental" in the UI.
  'elevenlabs-music': {
    ...NONE,
    durationParam: 'music_length_ms', durations: ['auto', '30000', '60000', '120000', '180000'],
    durationDefault: 'auto', durationNumeric: true,
    audioParam: 'force_instrumental', audioDefault: false,
  },
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
    durationParam: 'seconds_total', durations: ['10', '30', '60', '120', '190'], durationDefault: '30', durationNumeric: true, durationRange: { min: 1, max: 190 },
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: true, supportsNegativePrompt: false,
  },
  'ace-step': {
    // duration is a NUMBER 5-240 seconds, default 60.
    resolutionParam: null, resolutions: [], resolutionDefault: null,
    durationParam: 'duration', durations: ['30', '60', '120', '240'], durationDefault: '60', durationNumeric: true, durationRange: { min: 5, max: 240 },
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: true, supportsNegativePrompt: false,
  },
  'elevenlabs-multilingual-v2': {
    // TTS — length is driven by the text; free-string voice, fal default Rachel.
    resolutionParam: null, resolutions: [], resolutionDefault: null,
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: false, supportsNegativePrompt: false,
    voiceParam: 'voice', voices: [], voiceDefault: 'Rachel',
  },
  'kokoro-american-english': {
    resolutionParam: null, resolutions: [], resolutionDefault: null,
    durationParam: null, durations: [], durationDefault: null,
    aspectParam: null, aspects: [], aspectDefault: null,
    supportsSeed: false, supportsNegativePrompt: false,
    // the full VERIFIED enum from Kokoro's live fal schema (af = female, am = male)
    voiceParam: 'voice', voiceDefault: 'af_heart',
    voices: [
      'af_heart', 'af_alloy', 'af_aoede', 'af_bella', 'af_jessica', 'af_kore',
      'af_nicole', 'af_nova', 'af_river', 'af_sarah', 'af_sky',
      'am_adam', 'am_echo', 'am_eric', 'am_fenrir', 'am_liam', 'am_michael',
      'am_onyx', 'am_puck', 'am_santa',
    ],
  },
};

export function getModelCaps(id: string): ModelCaps {
  return MODEL_CAPS[id] ?? NONE;
}

/** Nicer display labels (the stored value is still the raw API value). */
export function fmtRes(v: string): string {
  const map: Record<string, string> = {
    '4k': '4K',
    true_1080p: '1080p+',
    '1024x1024': 'Square', '1536x1024': 'Landscape', '1024x1536': 'Portrait',
    auto_2K: '2K', auto_4K: '4K',
    landscape_16_9: 'Landscape', portrait_16_9: 'Portrait', square_hd: 'Square',
  };
  return map[v] ?? v;
}
export function fmtDur(v: string): string {
  if (v === 'auto') return 'Auto';
  return /s$/.test(v) ? v : `${v}s`;
}

/**
 * Resolution options for the UI, Sebastien's rule: the ladder shows the
 * canonical tiers even when this model does not reach them, GREYED OUT, so a
 * user always sees "this model has no 4K" instead of wondering where 4K went.
 * Only applies to pixel-ladder models (480p/720p/1080p...); image-size enums
 * (Square/Landscape/2K/4K auto sizes) are left exactly as the model defines.
 */
const RES_TIERS = ['480p', '720p', '1080p', '4K'] as const;
export function resolutionLadder(caps: ModelCaps): { id: string; label: string; disabled?: boolean }[] {
  const real = caps.resolutions.map((v) => ({ id: v, label: fmtRes(v) }));
  const isPixelLadder = caps.resolutions.some((v) => /^(480p|720p|1080p)$/i.test(v));
  if (!isPixelLadder) return real;
  const have = new Set(real.map((o) => o.label.replace('+', '')));
  const padded = [
    ...real,
    ...RES_TIERS.filter((t) => !have.has(t)).map((t) => ({ id: `unsupported-${t}`, label: t, disabled: true })),
  ];
  const rank = (l: string) => {
    const i = RES_TIERS.indexOf(l.replace('+', '') as (typeof RES_TIERS)[number]);
    return i === -1 ? 90 + padded.findIndex((o) => o.label === l) : i * 2 + (l.endsWith('+') ? 1 : 0);
  };
  return padded.sort((a, b) => rank(a.label) - rank(b.label));
}
export function fmtAspect(v: string): string {
  const map: Record<string, string> = { '16:9': 'Landscape', '9:16': 'Vertical', '1:1': 'Square' };
  return map[v] ?? v;
}
