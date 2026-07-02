/**
 * lib/modelRegistry.ts — CLIENT-SAFE model catalog.
 * Display-only metadata for the model selector. The actual Fal endpoint slugs +
 * per-model request/response recipes live server-side in lib/modelEndpoints.ts,
 * so the client only ever sends a model id.
 */

export type ModelType = 'video' | 'image';
export type ModelStatus = 'live' | 'beta' | 'preview';

export interface ModelOption {
  id: string;
  label: string;
  provider: string;
  type: ModelType;
  /** what the render produces */
  output: ModelType;
  status: ModelStatus;
  blurb: string;
  /** curated "Best" group (quality flagships) */
  top?: boolean;
  /** curated "Best for price" group (value / cheaper tiers) */
  value?: boolean;
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
];

export const DEFAULT_MODEL = 'seedance-2';

export function findModel(id: string): ModelOption | undefined {
  return MODEL_OPTIONS.find((m) => m.id === id);
}

export const VIDEO_MODELS = MODEL_OPTIONS.filter((m) => m.type === 'video');
export const IMAGE_MODELS = MODEL_OPTIONS.filter((m) => m.type === 'image');
