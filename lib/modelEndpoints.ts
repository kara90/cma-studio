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

/** Image-input variant (start/end frames or reference images) — slugs + exact
 * param names verified against the live fal OpenAPI schemas 2026-07-02. */
export interface ImageVariant {
  slug: string;
  /** param carrying the start/reference image URL */
  imageParam: string;
  /** param carrying the END frame, when the endpoint supports one */
  endImageParam?: string;
  /** true when the image param is an ARRAY of URLs (image edit models) */
  imageIsArray?: boolean;
  /** i2v schemas that DROP aspect_ratio vs their t2v sibling (Kling family) */
  noAspect?: boolean;
  /** used only when BOTH frames are present and a dedicated endpoint exists (Veo) */
  firstLast?: { slug: string; firstParam: string; lastParam: string };
}

export interface ModelEndpoint {
  slug: string;
  output: OutputKind;
  buildBody: (prompt: string) => Record<string, unknown>;
  parseResult: (json: Record<string, unknown>) => string | undefined;
  i2v?: ImageVariant;
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
  // ── Video ── (verified slugs; i2v variants schema-verified 2026-07-02)
  'seedance-2': {
    slug: 'bytedance/seedance-2.0/text-to-video', output: 'video', buildBody: base, parseResult: videoUrl,
    i2v: { slug: 'bytedance/seedance-2.0/image-to-video', imageParam: 'image_url', endImageParam: 'end_image_url' },
  },
  'seedance-2-mini': {
    slug: 'bytedance/seedance-2.0/fast/text-to-video', output: 'video', buildBody: base, parseResult: videoUrl,
    i2v: { slug: 'bytedance/seedance-2.0/fast/image-to-video', imageParam: 'image_url', endImageParam: 'end_image_url' },
  },
  'kling-2-5': {
    slug: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video', output: 'video', buildBody: base, parseResult: videoUrl,
    i2v: { slug: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video', imageParam: 'image_url', endImageParam: 'tail_image_url', noAspect: true },
  },
  'kling-2-6': {
    slug: 'fal-ai/kling-video/v2.6/pro/text-to-video', output: 'video', buildBody: base, parseResult: videoUrl,
    // ⚠ 2.6 renames the start image to start_image_url (2.5 and o3 use image_url)
    i2v: { slug: 'fal-ai/kling-video/v2.6/pro/image-to-video', imageParam: 'start_image_url', endImageParam: 'end_image_url', noAspect: true },
  },
  // best-known for the Kling o-series; update when the v3 slug is final.
  'kling-3': {
    slug: 'fal-ai/kling-video/o3/standard/text-to-video', output: 'video', buildBody: base, parseResult: videoUrl,
    i2v: { slug: 'fal-ai/kling-video/o3/standard/image-to-video', imageParam: 'image_url', endImageParam: 'end_image_url', noAspect: true },
  },
  hailuo: {
    slug: 'fal-ai/minimax/hailuo-2.3/standard/text-to-video', output: 'video', buildBody: base, parseResult: videoUrl,
    i2v: { slug: 'fal-ai/minimax/hailuo-2.3/standard/image-to-video', imageParam: 'image_url', noAspect: true },
  },
  'veo-3-1': {
    slug: 'fal-ai/veo3.1', output: 'video', buildBody: base, parseResult: videoUrl,
    i2v: {
      slug: 'fal-ai/veo3.1/image-to-video', imageParam: 'image_url',
      // both frames → Veo's dedicated first/last endpoint
      firstLast: { slug: 'fal-ai/veo3.1/first-last-frame-to-video', firstParam: 'first_frame_url', lastParam: 'last_frame_url' },
    },
  },
  // preview — no confirmed Fal slug yet; kept so the UI can list it.
  'grok-imagine': { slug: 'fal-ai/grok-imagine/text-to-video', output: 'video', buildBody: base, parseResult: videoUrl },
  // ── Image ── (verified slugs; edit variants take image_urls ARRAYS)
  'nano-banana-pro': {
    slug: 'fal-ai/nano-banana-pro', output: 'image', buildBody: base, parseResult: imageUrl,
    i2v: { slug: 'fal-ai/nano-banana-pro/edit', imageParam: 'image_urls', imageIsArray: true },
  },
  'nano-banana-2': {
    slug: 'fal-ai/nano-banana-2', output: 'image', buildBody: base, parseResult: imageUrl,
    i2v: { slug: 'fal-ai/nano-banana-2/edit', imageParam: 'image_urls', imageIsArray: true },
  },
  // best-known GPT Image slug on fal; update when GPT Image 2 lands.
  'gpt-image-2': {
    slug: 'fal-ai/gpt-image-1/text-to-image', output: 'image', buildBody: base, parseResult: imageUrl,
    i2v: { slug: 'fal-ai/gpt-image-1/edit-image', imageParam: 'image_urls', imageIsArray: true },
  },
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
