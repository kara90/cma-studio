/**
 * lib/vcpTypes.ts — shared wire types (safe for client + server).
 * Only type declarations live here, so importing it ships nothing to the bundle.
 */
import type { GenreStyle, VisualStyle, ShotSize, CameraMove, ColorGrade } from './vcpManifest';

export type OutputKind = 'video' | 'image';

export interface GenerateRequestBody {
  prompt: string;
  /** model id from lib/modelRegistry */
  model: string;
  /** when true, the Auto-Director picks the hardware; the fields below are ignored */
  auto?: boolean;
  /** rotates Auto-Director coverage across takes */
  variant?: number;
  cameraKey: string;
  lensKey: string;
  focalLength: number;
  aperture: number;
  isoValue: number;
  /** 0–100 film-grain intensity from the UI slider */
  cineNoise: number;
  /** 45–360 degrees */
  shutterAngle: number;
  genreStyle: GenreStyle;
  /** overall film aesthetic — a second axis above the lighting genre */
  style: VisualStyle;
  /** Director controls (Manual only; omitted in Auto, where the shot angle covers framing) */
  shotSize?: ShotSize;
  cameraMove?: CameraMove;
  grade?: ColorGrade;
  /** "what to avoid" — forwarded only to Fal models that accept negative_prompt */
  negativePrompt?: string;
  /** output format — validated per-model against lib/modelCaps before sending */
  resolution?: string;
  duration?: string;
  aspect?: string;
  /** optional seed for reproducibility (only sent to models that accept it) */
  seed?: number;
  /** user's private Fal token — BYOK, never persisted server-side */
  userApiKey: string;
}

export interface GenerateAccepted {
  ok: true;
  /** Fal queue request id — the tracking token handed back to the client */
  trackingToken: string;
  status: string;
  model: string;
  output: OutputKind;
  /** redacted, user-facing echo of the visible knobs (never the secret prompt) */
  summary: {
    model: string;
    camera: string;
    lens: string;
    focalLength: number;
    aperture: number;
    iso: number;
    grain: number;
    genre: GenreStyle;
    style: VisualStyle;
    /** true when the Auto-Director chose the package */
    auto: boolean;
  };
}

export interface GenerateError {
  ok: false;
  error: string;
}

export type StatusState = 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR';

export interface StatusResult {
  ok: boolean;
  status: StatusState;
  /** present when COMPLETED — the finished video or image */
  mediaUrl?: string;
  output?: OutputKind;
  /** queue position when IN_QUEUE */
  queuePosition?: number;
  /** the seed the model actually used (present when COMPLETED, if the model reports it) */
  seed?: number;
  error?: string;
}
