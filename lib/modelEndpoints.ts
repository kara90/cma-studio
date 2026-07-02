/**
 * lib/modelEndpoints.ts — server-only Fal endpoint + I/O recipes per model.
 * Maps a model id → its Fal queue slug, the base submit body, and how to pull
 * the finished asset URL out of the result. BYOK: every call authenticates with
 * the USER's own Fal key.
 *
 * buildBody only sets the required `prompt`. Every optional format param
 * (aspect_ratio, resolution, duration, negative_prompt, seed) is added by the
 * route from lib/modelCaps.ts — validated per-model — so nothing here can ever
 * send a value a model rejects.
 */
import { findModel } from './modelRegistry';
import type { OutputKind } from './vcpTypes';

export interface ModelEndpoint {
  slug: string;
  output: OutputKind;
  buildBody: (prompt: string) => Record<string, unknown>;
  parseResult: (json: Record<string, unknown>) => string | undefined;
}

const base = (prompt: string) => ({ prompt });

const videoUrl = (j: Record<string, unknown>) => {
  const v = j as { video?: { url?: string }; videos?: { url?: string }[]; url?: string };
  return v.video?.url ?? v.videos?.[0]?.url ?? v.url;
};
const imageUrl = (j: Record<string, unknown>) => {
  const v = j as { images?: { url?: string }[]; image?: { url?: string }; url?: string };
  return v.images?.[0]?.url ?? v.image?.url ?? v.url;
};
// All wired fal audio models return the finished file at audio.url (schema-verified).
const audioUrl = (j: Record<string, unknown>) => {
  const v = j as { audio?: { url?: string }; audio_file?: { url?: string }; url?: string };
  return v.audio?.url ?? v.audio_file?.url ?? v.url;
};

const ENDPOINTS: Record<string, ModelEndpoint> = {
  // ── Video ── (verified slugs)
  'seedance-2': { slug: 'bytedance/seedance-2.0/text-to-video', output: 'video', buildBody: base, parseResult: videoUrl },
  'seedance-2-mini': { slug: 'bytedance/seedance-2.0/fast/text-to-video', output: 'video', buildBody: base, parseResult: videoUrl },
  'kling-2-5': { slug: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video', output: 'video', buildBody: base, parseResult: videoUrl },
  'kling-2-6': { slug: 'fal-ai/kling-video/v2.6/pro/text-to-video', output: 'video', buildBody: base, parseResult: videoUrl },
  // best-known for the Kling o-series; update when the v3 slug is final.
  'kling-3': { slug: 'fal-ai/kling-video/o3/standard/text-to-video', output: 'video', buildBody: base, parseResult: videoUrl },
  hailuo: { slug: 'fal-ai/minimax/hailuo-2.3/standard/text-to-video', output: 'video', buildBody: base, parseResult: videoUrl },
  // best-known Veo slug on fal; confirm the exact 3.1 path when wiring live.
  'veo-3-1': { slug: 'fal-ai/veo3.1', output: 'video', buildBody: base, parseResult: videoUrl },
  // preview — no confirmed Fal slug yet; kept so the UI can list it.
  'grok-imagine': { slug: 'fal-ai/grok-imagine/text-to-video', output: 'video', buildBody: base, parseResult: videoUrl },
  // ── Image ── (verified slugs)
  'nano-banana-pro': { slug: 'fal-ai/nano-banana-pro', output: 'image', buildBody: base, parseResult: imageUrl },
  'nano-banana-2': { slug: 'fal-ai/nano-banana-2', output: 'image', buildBody: base, parseResult: imageUrl },
  // best-known GPT Image slug on fal; update when GPT Image 2 lands.
  'gpt-image-2': { slug: 'fal-ai/gpt-image-1/text-to-image', output: 'image', buildBody: base, parseResult: imageUrl },
  // ── Audio ── (params verified against the live fal OpenAPI schemas 2026-07-02;
  // duration params are merged by the route from lib/modelCaps, numerically)
  lyria2: { slug: 'fal-ai/lyria2', output: 'audio', buildBody: base, parseResult: audioUrl },
  'stable-audio-25': {
    slug: 'fal-ai/stable-audio-25/text-to-audio',
    output: 'audio',
    // seconds_total DEFAULTS to the 190s max on fal — caps merge overrides it,
    // but keep a sane 30s floor here so a caps miss can never bill 190s.
    buildBody: (prompt) => ({ prompt, seconds_total: 30 }),
    parseResult: audioUrl,
  },
  'ace-step': {
    slug: 'fal-ai/ace-step',
    output: 'audio',
    // ACE-Step's text input is `tags` (comma-separated style tags), not `prompt`.
    // Empty `lyrics` keeps it instrumental by default.
    buildBody: (prompt) => ({ tags: prompt }),
    parseResult: audioUrl,
  },
  'elevenlabs-multilingual-v2': {
    slug: 'fal-ai/elevenlabs/tts/multilingual-v2',
    output: 'audio',
    // TTS: the input param is `text`; voice defaults to "Rachel" server-side at fal.
    buildBody: (prompt) => ({ text: prompt }),
    parseResult: audioUrl,
  },
  'kokoro-american-english': {
    slug: 'fal-ai/kokoro/american-english',
    output: 'audio',
    buildBody: base, // `prompt` param; voice defaults to af_heart
    parseResult: audioUrl,
  },
};

export function getModelEndpoint(id: string): ModelEndpoint | undefined {
  // Only resolve ids that exist in the client-facing registry.
  return findModel(id) ? ENDPOINTS[id] : undefined;
}
