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
  /** curated "Best" group (quality flagships) */
  top?: boolean;
  /** curated "Best for price" group (value / cheaper tiers) */
  value?: boolean;
  /**
   * false = listed for browsing only, no generation endpoint wired yet.
   * Absent means wired (true) — all pre-existing entries keep their behavior.
   */
  wired?: boolean;
  /**
   * Approximate compute cost on the USER'S OWN fal key, shown for transparency
   * (never a price we charge — fal bills them directly at fal's rate).
   * PLACEHOLDER estimates until verified against fal's live pricing pages.
   */
  costHint?: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  // ── Video ──
  // costHint values verified against fal's live model pages 2026-07-02 —
  // transparency estimates only; fal bills the user directly at fal's rate.
  // Ranked: flagships (top) first, strong-value tiers after.
  { id: 'seedance-2', label: 'Seedance 2', provider: 'ByteDance', type: 'video', output: 'video', status: 'live', blurb: 'Cinematic motion, native audio', top: true, costHint: 'about $1.50 for 5s at 720p, about $3.40 at 1080p' },
  { id: 'kling-3', label: 'Kling 3 Pro', provider: 'Kuaishou', type: 'video', output: 'video', status: 'live', blurb: 'The real Kling 3 flagship, native audio', top: true, costHint: 'about $0.84 for 5s with audio, $0.56 audio off' },
  { id: 'sora-2-pro', label: 'Sora 2 Pro', provider: 'OpenAI', type: 'video', output: 'video', status: 'live', blurb: 'OpenAI flagship, up to 20s with native audio', top: true, costHint: 'about $2.00 for 4s at 1080p' },
  { id: 'veo-3-1', label: 'Veo 3.1', provider: 'Google', type: 'video', output: 'video', status: 'beta', blurb: 'Google Veo 3.1 · latest', top: true, costHint: 'about $2.00 for 5s at 1080p with audio, about $1.00 audio off' },
  { id: 'hailuo', label: 'Hailuo 2.3', provider: 'MiniMax', type: 'video', output: 'video', status: 'beta', blurb: 'Expressive, character-driven', top: true, costHint: 'about $0.28 for 6s, $0.56 for 10s' },
  { id: 'sora-2', label: 'Sora 2', provider: 'OpenAI', type: 'video', output: 'video', status: 'live', blurb: 'Sora quality at a value rate, up to 20s', value: true, costHint: 'about $0.40 for 4s, $0.10 per second' },
  { id: 'veo-3-1-fast', label: 'Veo 3.1 Fast', provider: 'Google', type: 'video', output: 'video', status: 'live', blurb: 'Veo speed tier, same controls', value: true, costHint: 'about $1.20 for 8s with audio, $0.80 audio off' },
  { id: 'seedance-1-5-pro', label: 'Seedance 1.5 Pro', provider: 'ByteDance', type: 'video', output: 'video', status: 'live', blurb: 'Proven Seedance workhorse', value: true, costHint: 'about $0.26 for 5s at 720p with audio' },
  { id: 'wan-2-5', label: 'Wan 2.5', provider: 'Alibaba', type: 'video', output: 'video', status: 'live', blurb: 'Strong 1080p motion, native audio', value: true, costHint: 'about $0.75 for 5s at 1080p, $0.50 at 720p' },
  { id: 'ltx-2', label: 'LTX-2', provider: 'Lightricks', type: 'video', output: 'video', status: 'live', blurb: 'Cheap native 4K, up to 10s', value: true, costHint: 'about $0.36 for 6s at 1080p, 4K available' },
  { id: 'kling-o3', label: 'Kling O3', provider: 'Kuaishou', type: 'video', output: 'video', status: 'live', blurb: 'Second-by-second control, 3 to 15s', value: true, costHint: 'about $0.42 for 5s, $0.56 with audio on' },
  { id: 'seedance-2-mini', label: 'Seedance 2 Mini', provider: 'ByteDance', type: 'video', output: 'video', status: 'live', blurb: 'Faster, lower-cost tier', value: true, costHint: 'about $1.20 for 5s at 720p' },
  { id: 'kling-2-5', label: 'Kling 2.5', provider: 'Kuaishou', type: 'video', output: 'video', status: 'live', blurb: 'Great motion for the price', value: true, costHint: 'about $0.35 for 5s, then $0.07 per extra second' },
  { id: 'kling-2-6', label: 'Kling 2.6', provider: 'Kuaishou', type: 'video', output: 'video', status: 'live', blurb: 'Newer Kling · strong value', value: true, costHint: 'about $0.35 for 5s, or $0.70 with audio on' },
  // wired:false — the fal slug is unconfirmed; the server must refuse it too.
  { id: 'grok-imagine', label: 'Grok Imagine', provider: 'xAI', type: 'video', output: 'video', status: 'preview', wired: false, blurb: 'Coming soon to the studio' },
  // ── Image / Photo ──
  { id: 'nano-banana-pro', label: 'Nano Banana Pro', provider: 'Google', type: 'image', output: 'image', status: 'live', blurb: 'Gemini 3 Pro Image · up to 4K', top: true, costHint: 'about $0.15 per image, $0.30 for 4K' },
  { id: 'seedream-4-5', label: 'Seedream 4.5', provider: 'ByteDance', type: 'image', output: 'image', status: 'live', blurb: 'Next-gen 4K stills, razor detail', top: true, costHint: 'about $0.04 per image' },
  { id: 'flux-2-pro', label: 'FLUX.2 Pro', provider: 'Black Forest Labs', type: 'image', output: 'image', status: 'live', blurb: 'The new FLUX flagship', top: true, costHint: 'about $0.03 per image' },
  { id: 'imagen-4', label: 'Imagen 4', provider: 'Google', type: 'image', output: 'image', status: 'live', blurb: 'Google photorealism, up to 2K', top: true, costHint: 'about $0.05 per image' },
  { id: 'ideogram-v3', label: 'Ideogram V3', provider: 'Ideogram', type: 'image', output: 'image', status: 'live', blurb: 'Best-in-class text and typography', top: true, costHint: 'about $0.06 per image' },
  { id: 'flux-1-1-ultra', label: 'FLUX 1.1 Ultra', provider: 'Black Forest Labs', type: 'image', output: 'image', status: 'live', blurb: '4MP photoreal, raw mode', value: true, costHint: 'about $0.06 per image' },
  { id: 'recraft-v4-1', label: 'Recraft V4.1', provider: 'Recraft', type: 'image', output: 'image', status: 'live', blurb: 'Design and brand-color control', value: true, costHint: 'about $0.035 per image' },
  { id: 'nano-banana-2', label: 'Nano Banana 2', provider: 'Google', type: 'image', output: 'image', status: 'beta', blurb: 'Reasoning-guided synthesis', value: true, costHint: 'about $0.08 per image, $0.16 at 4K' },
  { id: 'gpt-image-2', label: 'GPT Image', provider: 'OpenAI', type: 'image', output: 'image', status: 'beta', blurb: 'High-fidelity text-to-image', costHint: 'about $0.04 per image at medium quality, $0.17 at high' },
  // ── Audio ──
  // The five text-to-audio models below are WIRED (server recipes in
  // lib/modelEndpoints.ts, params verified against the live fal OpenAPI schemas
  // on 2026-07-02). MiniMax Music and MMAudio V2 stay browse-only: both REQUIRE
  // a media file input (reference track / video), which needs its own upload
  // flow in a later pass. Slugs stay in comments only, per the client-safe rule
  // at the top of this file.
  //
  // Verified but intentionally omitted from the lineup:
  //   fal-ai/stable-audio     (older v2, superseded by stable-audio-25)
  //   fal-ai/f5-tts           (voice-cloning TTS, needs a reference clip; add if voice cloning becomes a feature)
  // Checked and NOT available on Fal (404, do not add):
  //   fal-ai/playai/tts/v3, /tts/dialog, /tts/v3-turbo, fal-ai/playht/tts/v3
  { id: 'lyria2', label: 'Lyria 2', provider: 'Google', type: 'audio', output: 'audio', status: 'live', top: true, blurb: 'Studio-grade instrumental music, cinematic scores and ambient beds', costHint: 'about $0.10 per 30s of music' }, // fal-ai/lyria2 (music, ~30s fixed)
  { id: 'elevenlabs-multilingual-v2', label: 'ElevenLabs Multilingual v2', provider: 'ElevenLabs', type: 'audio', output: 'audio', status: 'live', top: true, blurb: 'Premium lifelike voiceover in 29 languages, the go-to for polished narration', costHint: 'about $0.10 per 1000 characters' }, // fal-ai/elevenlabs/tts/multilingual-v2 (tts, text param)
  { id: 'stable-audio-25', label: 'Stable Audio 2.5', provider: 'Stability AI', type: 'audio', output: 'audio', status: 'live', top: true, blurb: 'Text-to-audio workhorse for sound effects, foley and short musical stems', costHint: 'about $0.20 per audio generation' }, // fal-ai/stable-audio-25/text-to-audio (sfx, seconds_total 1-190)
  { id: 'ace-step', label: 'ACE-Step', provider: 'ACE Studio', type: 'audio', output: 'audio', status: 'live', value: true, blurb: 'Fast open-source song generator, complete tracks with vocals from a text prompt', costHint: 'about $0.04 for a 3 minute track' }, // fal-ai/ace-step (music, text param is `tags`, duration 5-240)
  { id: 'kokoro-american-english', label: 'Kokoro (American English)', provider: 'Kokoro', type: 'audio', output: 'audio', status: 'live', value: true, blurb: 'Very fast, very cheap American English speech for drafts and high volume', costHint: 'about $0.02 per 1000 characters' }, // fal-ai/kokoro/american-english (tts, prompt param)
  { id: 'minimax-music', label: 'MiniMax Music', provider: 'MiniMax', type: 'audio', output: 'audio', status: 'preview', wired: false, blurb: 'Turns your lyrics plus a reference track into a full song with vocals' }, // fal-ai/minimax-music (REQUIRES reference_audio_url — needs upload flow)
  { id: 'mmaudio-v2', label: 'MMAudio V2', provider: 'MMAudio', type: 'audio', output: 'audio', status: 'preview', wired: false, blurb: 'Watches a video and generates synced sound effects and ambience for it' }, // fal-ai/mmaudio-v2 (REQUIRES video input — needs upload flow)
];

export const DEFAULT_MODEL = 'seedance-2';

export function findModel(id: string): ModelOption | undefined {
  return MODEL_OPTIONS.find((m) => m.id === id);
}

export const VIDEO_MODELS = MODEL_OPTIONS.filter((m) => m.type === 'video');
export const IMAGE_MODELS = MODEL_OPTIONS.filter((m) => m.type === 'image');
export const AUDIO_MODELS = MODEL_OPTIONS.filter((m) => m.type === 'audio');
