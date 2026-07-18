/**
 * lib/modelRegistry.ts — CLIENT-SAFE model catalog.
 * Display-only metadata for the model selector. The actual Fal endpoint slugs +
 * per-model request/response recipes live server-side in lib/modelEndpoints.ts,
 * so the client only ever sends a model id.
 */

export type ModelKind = 'video' | 'image' | 'audio';
/** Back-compat alias — prefer ModelKind in new code. */
export type ModelType = ModelKind;
export type ModelStatus = 'live' | 'beta' | 'preview';

export interface ModelOption {
  id: string;
  label: string;
  provider: string;
  type: ModelKind;
  /** what the render produces */
  output: ModelKind;
  status: ModelStatus;
  blurb: string;
  /**
   * The single best current model of its medium — shown on top, labeled as the
   * top pick. Exactly ONE per medium; everything else groups under "Others".
   */
  top?: boolean;
  /**
   * false = listed for browsing only, no generation endpoint wired yet.
   * Absent means wired (true) — all pre-existing entries keep their behavior.
   */
  wired?: boolean;
  /**
   * Approximate compute cost on the USER'S OWN fal key, shown for transparency
   * (never a price we charge — fal bills them directly at fal's rate).
   * Indicative only; the live-pricing layer (lib/costEstimate) supersedes this
   * when the user's key can fetch fal's current unit prices.
   */
  costHint?: string;
  /**
   * Audio-only: which lane of the Audio Studio the model belongs to. The first
   * model of each lane in MODEL_OPTIONS order is that lane's top pick.
   */
  audioGroup?: 'voice' | 'music' | 'sfx';
}

export const MODEL_OPTIONS: ModelOption[] = [
  // ── Video ──
  // Every entry below was verified ACTIVE on fal's public model registry
  // (api.fal.ai/v1/models) on 2026-07-18. Deprecated endpoints (Sora 2 line,
  // Imagen 4 preview) and unconfirmed slugs (Grok Imagine) were removed — we
  // never list a model we cannot actually deliver.
  // costHint values are indicative only; fal bills the user directly at fal's
  // rate, and the live-pricing layer supersedes these when available.
  { id: 'seedance-2', label: 'Seedance 2', provider: 'ByteDance', type: 'video', output: 'video', status: 'live', blurb: 'Cinematic motion, native audio', top: true, costHint: 'about $1.50 for 5s at 720p, about $3.40 at 1080p' },
  { id: 'kling-3', label: 'Kling 3 Pro', provider: 'Kuaishou', type: 'video', output: 'video', status: 'live', blurb: 'The real Kling 3 flagship, native audio', costHint: 'about $0.84 for 5s with audio, $0.56 audio off' },
  { id: 'veo-3-1', label: 'Veo 3.1', provider: 'Google', type: 'video', output: 'video', status: 'beta', blurb: 'Google Veo 3.1 · latest', costHint: 'about $2.00 for 5s at 1080p with audio, about $1.00 audio off' },
  { id: 'veo-3-1-fast', label: 'Veo 3.1 Fast', provider: 'Google', type: 'video', output: 'video', status: 'live', blurb: 'Veo speed tier, same controls', costHint: 'about $1.20 for 8s with audio, $0.80 audio off' },
  { id: 'hailuo', label: 'Hailuo 2.3', provider: 'MiniMax', type: 'video', output: 'video', status: 'beta', blurb: 'Expressive, character-driven', costHint: 'about $0.28 for 6s, $0.56 for 10s' },
  { id: 'seedance-1-5-pro', label: 'Seedance 1.5 Pro', provider: 'ByteDance', type: 'video', output: 'video', status: 'live', blurb: 'Proven Seedance workhorse', costHint: 'about $0.26 for 5s at 720p with audio' },
  { id: 'wan-2-5', label: 'Wan 2.5', provider: 'Alibaba', type: 'video', output: 'video', status: 'live', blurb: 'Strong 1080p motion, native audio', costHint: 'about $0.75 for 5s at 1080p, $0.50 at 720p' },
  { id: 'ltx-2', label: 'LTX-2', provider: 'Lightricks', type: 'video', output: 'video', status: 'live', blurb: 'Cheap native 4K, up to 10s', costHint: 'about $0.36 for 6s at 1080p, 4K available' },
  { id: 'kling-o3', label: 'Kling O3', provider: 'Kuaishou', type: 'video', output: 'video', status: 'live', blurb: 'Second-by-second control, 3 to 15s', costHint: 'about $0.42 for 5s, $0.56 with audio on' },
  // id stays 'seedance-2-mini' for back-compat (saved recipes/history); the fal
  // line it maps to is seedance-2.0/fast, so the LABEL now says Fast honestly.
  { id: 'seedance-2-mini', label: 'Seedance 2 Fast', provider: 'ByteDance', type: 'video', output: 'video', status: 'live', blurb: 'Faster, lower-cost Seedance 2 tier', costHint: 'about $1.20 for 5s at 720p' },
  { id: 'kling-2-5', label: 'Kling 2.5', provider: 'Kuaishou', type: 'video', output: 'video', status: 'live', blurb: 'Great motion for the price', costHint: 'about $0.35 for 5s, then $0.07 per extra second' },
  { id: 'kling-2-6', label: 'Kling 2.6', provider: 'Kuaishou', type: 'video', output: 'video', status: 'live', blurb: 'Newer Kling · strong value', costHint: 'about $0.35 for 5s, or $0.70 with audio on' },
  // ── Image / Photo ──
  { id: 'nano-banana-pro', label: 'Nano Banana Pro', provider: 'Google', type: 'image', output: 'image', status: 'live', blurb: 'Gemini 3 Pro Image · up to 4K', top: true, costHint: 'about $0.15 per image, $0.30 for 4K' },
  // Seedream 5 — endpoints verified active on fal 2026-07-18 (v5 pro + lite
  // text-to-image). No published rate verified yet, so no costHint (honesty
  // rule: never invent a price).
  { id: 'seedream-5-pro', label: 'Seedream 5 Pro', provider: 'ByteDance', type: 'image', output: 'image', status: 'live', blurb: 'ByteDance flagship stills, up to 4K' },
  { id: 'seedream-5-lite', label: 'Seedream 5 Lite', provider: 'ByteDance', type: 'image', output: 'image', status: 'live', blurb: 'Fast, light Seedream 5 tier' },
  { id: 'seedream-4-5', label: 'Seedream 4.5', provider: 'ByteDance', type: 'image', output: 'image', status: 'live', blurb: '4K stills, razor detail', costHint: 'about $0.04 per image' },
  { id: 'flux-2-pro', label: 'FLUX.2 Pro', provider: 'Black Forest Labs', type: 'image', output: 'image', status: 'live', blurb: 'The new FLUX flagship', costHint: 'about $0.03 per image' },
  { id: 'ideogram-v3', label: 'Ideogram V3', provider: 'Ideogram', type: 'image', output: 'image', status: 'live', blurb: 'Best-in-class text and typography', costHint: 'about $0.06 per image' },
  { id: 'flux-1-1-ultra', label: 'FLUX 1.1 Ultra', provider: 'Black Forest Labs', type: 'image', output: 'image', status: 'live', blurb: '4MP photoreal, raw mode', costHint: 'about $0.06 per image' },
  { id: 'recraft-v4-1', label: 'Recraft V4.1', provider: 'Recraft', type: 'image', output: 'image', status: 'live', blurb: 'Design and brand-color control', costHint: 'about $0.035 per image' },
  { id: 'nano-banana-2', label: 'Nano Banana 2', provider: 'Google', type: 'image', output: 'image', status: 'beta', blurb: 'Reasoning-guided synthesis', costHint: 'about $0.08 per image, $0.16 at 4K' },
  // Rewired 2026-07-18 to the real GPT Image 2 endpoints (openai/gpt-image-2).
  { id: 'gpt-image-2', label: 'GPT Image 2', provider: 'OpenAI', type: 'image', output: 'image', status: 'live', blurb: 'OpenAI image model, fine-grained edits' },
  // ── Audio ── (GENERAL generators only — the Studio is a visual workflow and
  // offers no audio; see STUDIO_* lists below.)
  // All five are WIRED (server recipes in lib/modelEndpoints.ts, params
  // verified against the live fal OpenAPI schemas; endpoints re-verified active
  // 2026-07-18). Models that require a media-file input (MiniMax Music,
  // MMAudio V2) are NOT listed — we never show a model we cannot deliver;
  // they return with the upload flow.
  //
  // Verified but intentionally omitted from the lineup:
  //   fal-ai/stable-audio     (older v2, superseded by stable-audio-25)
  //   fal-ai/f5-tts           (voice-cloning TTS, needs a reference clip; add if voice cloning becomes a feature)
  // VOICE lane — Eleven v3 is the expressive flagship (verified active + schema
  // 2026-07-18); order inside each lane = ranking, first is the lane top pick.
  { id: 'eleven-v3', label: 'Eleven v3', provider: 'ElevenLabs', type: 'audio', output: 'audio', status: 'live', top: true, audioGroup: 'voice', blurb: 'The most expressive ElevenLabs voice engine, emotion and delivery built in' }, // fal-ai/elevenlabs/tts/eleven-v3 (text, voice, stability)
  { id: 'elevenlabs-multilingual-v2', label: 'ElevenLabs Multilingual v2', provider: 'ElevenLabs', type: 'audio', output: 'audio', status: 'live', audioGroup: 'voice', blurb: 'Premium lifelike voiceover in 29 languages, the go-to for polished narration', costHint: 'about $0.10 per 1000 characters' }, // fal-ai/elevenlabs/tts/multilingual-v2 (tts, text param, voice)
  { id: 'minimax-speech-2-8-hd', label: 'MiniMax Speech 2.8 HD', provider: 'MiniMax', type: 'audio', output: 'audio', status: 'live', audioGroup: 'voice', blurb: 'High-fidelity single-voice narration with pitch and speed control' }, // fal-ai/minimax/speech-2.8-hd (prompt, voice_setting; output_format MUST be url)
  { id: 'kokoro-american-english', label: 'Kokoro (American English)', provider: 'Kokoro', type: 'audio', output: 'audio', status: 'live', audioGroup: 'voice', blurb: 'Very fast, very cheap American English speech for drafts and high volume', costHint: 'about $0.02 per 1000 characters' }, // fal-ai/kokoro/american-english (tts, prompt param, 20-voice enum)
  // MUSIC lane
  { id: 'elevenlabs-music', label: 'ElevenLabs Music', provider: 'ElevenLabs', type: 'audio', output: 'audio', status: 'live', audioGroup: 'music', blurb: 'Full tracks with or without vocals, from a plain description' }, // fal-ai/elevenlabs/music (prompt, music_length_ms, force_instrumental)
  { id: 'lyria2', label: 'Lyria 2', provider: 'Google', type: 'audio', output: 'audio', status: 'live', audioGroup: 'music', blurb: 'Studio-grade instrumental music, cinematic scores and ambient beds', costHint: 'about $0.10 per 30s of music' }, // fal-ai/lyria2 (music, ~30s fixed)
  { id: 'ace-step', label: 'ACE-Step', provider: 'ACE Studio', type: 'audio', output: 'audio', status: 'live', audioGroup: 'music', blurb: 'Fast open-source song generator, complete tracks with vocals from a text prompt', costHint: 'about $0.04 for a 3 minute track' }, // fal-ai/ace-step (music, text param is `tags`, duration 5-240)
  // SFX & DESIGN lane
  { id: 'elevenlabs-sfx-v2', label: 'ElevenLabs SFX v2', provider: 'ElevenLabs', type: 'audio', output: 'audio', status: 'live', audioGroup: 'sfx', blurb: 'Cinematic sound effects and foley from a one-line description' }, // fal-ai/elevenlabs/sound-effects/v2 (text, duration_seconds)
  { id: 'stable-audio-25', label: 'Stable Audio 2.5', provider: 'Stability AI', type: 'audio', output: 'audio', status: 'live', audioGroup: 'sfx', blurb: 'Text-to-audio workhorse for sound effects, textures and short musical stems', costHint: 'about $0.20 per audio generation' }, // fal-ai/stable-audio-25/text-to-audio (sfx, seconds_total 1-190)
];

export const DEFAULT_MODEL = 'seedance-2';

export function findModel(id: string): ModelOption | undefined {
  return MODEL_OPTIONS.find((m) => m.id === id);
}

export const VIDEO_MODELS = MODEL_OPTIONS.filter((m) => m.type === 'video');
export const IMAGE_MODELS = MODEL_OPTIONS.filter((m) => m.type === 'image');
export const AUDIO_MODELS = MODEL_OPTIONS.filter((m) => m.type === 'audio');

/**
 * ── STUDIO lineup (Director Studio + every studio that shares its browser) ──
 * The Studio is deliberately CURATED: two verified flagships per visual medium,
 * nothing else, and NO audio (the studio workflow is visual only). The general
 * /video /image /audio generator pages keep the broad catalog above.
 * Both lists were endpoint-verified on fal 2026-07-18.
 */
const STUDIO_VIDEO_IDS = ['seedance-2', 'kling-3'] as const;
const STUDIO_IMAGE_IDS = ['nano-banana-pro', 'seedream-5-pro'] as const;

export const STUDIO_VIDEO_MODELS = STUDIO_VIDEO_IDS
  .map((id) => MODEL_OPTIONS.find((m) => m.id === id))
  .filter((m): m is ModelOption => Boolean(m));
export const STUDIO_IMAGE_MODELS = STUDIO_IMAGE_IDS
  .map((id) => MODEL_OPTIONS.find((m) => m.id === id))
  .filter((m): m is ModelOption => Boolean(m));

/** Is this model part of the curated Studio lineup? */
export function isStudioModel(id: string): boolean {
  return (STUDIO_VIDEO_IDS as readonly string[]).includes(id) || (STUDIO_IMAGE_IDS as readonly string[]).includes(id);
}
