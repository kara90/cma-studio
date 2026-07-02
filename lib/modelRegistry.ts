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
}

export const MODEL_OPTIONS: ModelOption[] = [
  // ── Video ──
  { id: 'seedance-2', label: 'Seedance 2', provider: 'ByteDance', type: 'video', output: 'video', status: 'live', blurb: 'Cinematic motion, native audio', top: true },
  { id: 'kling-3', label: 'Kling 3', provider: 'Kuaishou', type: 'video', output: 'video', status: 'beta', blurb: 'Next-gen Kling · second-best flagship', top: true },
  { id: 'veo-3-1', label: 'Veo 3.1', provider: 'Google', type: 'video', output: 'video', status: 'beta', blurb: 'Google Veo 3.1 · latest', top: true },
  { id: 'hailuo', label: 'Hailuo 2.3', provider: 'MiniMax', type: 'video', output: 'video', status: 'beta', blurb: 'Expressive, character-driven', top: true },
  { id: 'grok-imagine', label: 'Grok Imagine', provider: 'xAI', type: 'video', output: 'video', status: 'preview', blurb: 'Coming soon to the studio', top: true },
  { id: 'seedance-2-mini', label: 'Seedance 2 Mini', provider: 'ByteDance', type: 'video', output: 'video', status: 'live', blurb: 'Faster, lower-cost tier', value: true },
  { id: 'kling-2-5', label: 'Kling 2.5', provider: 'Kuaishou', type: 'video', output: 'video', status: 'live', blurb: 'Great motion for the price', value: true },
  { id: 'kling-2-6', label: 'Kling 2.6', provider: 'Kuaishou', type: 'video', output: 'video', status: 'live', blurb: 'Newer Kling · strong value', value: true },
  // ── Image / Photo ──
  { id: 'nano-banana-pro', label: 'Nano Banana Pro', provider: 'Google', type: 'image', output: 'image', status: 'live', blurb: 'Gemini 3 Pro Image · up to 4K', top: true },
  { id: 'nano-banana-2', label: 'Nano Banana 2', provider: 'Google', type: 'image', output: 'image', status: 'beta', blurb: 'Reasoning-guided synthesis', value: true },
  { id: 'gpt-image-2', label: 'GPT Image 2', provider: 'OpenAI', type: 'image', output: 'image', status: 'beta', blurb: 'High-fidelity text-to-image' },
  // ── Audio ──
  // AUDIO lineup is a browse-only placeholder: generation wiring (server-side
  // recipes in lib/modelEndpoints.ts) comes in a later pass, and Sebastien is
  // to confirm the final lineup. Every entry below was verified live on Fal on
  // 2026-07-02 via https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=<slug>
  // (HTTP 200 with a real OpenAPI schema). Slugs stay in comments only, per the
  // client-safe rule at the top of this file.
  //
  // Verified but intentionally omitted from the lineup:
  //   fal-ai/stable-audio     (older v2, superseded by stable-audio-25)
  //   fal-ai/f5-tts           (voice-cloning TTS, needs a reference clip; add if voice cloning becomes a feature)
  // Checked and NOT available on Fal (404, do not add):
  //   fal-ai/playai/tts/v3, /tts/dialog, /tts/v3-turbo, fal-ai/playht/tts/v3
  { id: 'lyria2', label: 'Lyria 2', provider: 'Google', type: 'audio', output: 'audio', status: 'preview', wired: false, top: true, blurb: 'Studio-grade instrumental music, cinematic scores and ambient beds' }, // fal-ai/lyria2 (music)
  { id: 'elevenlabs-multilingual-v2', label: 'ElevenLabs Multilingual v2', provider: 'ElevenLabs', type: 'audio', output: 'audio', status: 'preview', wired: false, top: true, blurb: 'Premium lifelike voiceover in 29 languages, the go-to for polished narration' }, // fal-ai/elevenlabs/tts/multilingual-v2 (tts)
  { id: 'stable-audio-25', label: 'Stable Audio 2.5', provider: 'Stability AI', type: 'audio', output: 'audio', status: 'preview', wired: false, top: true, blurb: 'Text-to-audio workhorse for sound effects, foley and short musical stems' }, // fal-ai/stable-audio-25/text-to-audio (sfx)
  { id: 'ace-step', label: 'ACE-Step', provider: 'ACE Studio', type: 'audio', output: 'audio', status: 'preview', wired: false, value: true, blurb: 'Fast open-source song generator, complete tracks with vocals from a text prompt' }, // fal-ai/ace-step (music)
  { id: 'kokoro-american-english', label: 'Kokoro (American English)', provider: 'Kokoro', type: 'audio', output: 'audio', status: 'preview', wired: false, value: true, blurb: 'Very fast, very cheap American English speech for drafts and high volume' }, // fal-ai/kokoro/american-english (tts)
  { id: 'minimax-music', label: 'MiniMax Music', provider: 'MiniMax', type: 'audio', output: 'audio', status: 'preview', wired: false, blurb: 'Turns your lyrics plus a reference track into a full song with vocals' }, // fal-ai/minimax-music (music)
  { id: 'mmaudio-v2', label: 'MMAudio V2', provider: 'MMAudio', type: 'audio', output: 'audio', status: 'preview', wired: false, blurb: 'Watches a video and generates synced sound effects and ambience for it' }, // fal-ai/mmaudio-v2 (video-to-audio sfx)
];

export const DEFAULT_MODEL = 'seedance-2';

export function findModel(id: string): ModelOption | undefined {
  return MODEL_OPTIONS.find((m) => m.id === id);
}

export const VIDEO_MODELS = MODEL_OPTIONS.filter((m) => m.type === 'video');
export const IMAGE_MODELS = MODEL_OPTIONS.filter((m) => m.type === 'image');
export const AUDIO_MODELS = MODEL_OPTIONS.filter((m) => m.type === 'audio');
