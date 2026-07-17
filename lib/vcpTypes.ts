/**
 * lib/vcpTypes.ts — shared wire types (safe for client + server).
 * Only type declarations live here, so importing it ships nothing to the bundle.
 */
import type { GenreStyle, VisualStyle, ShotSize, CameraMove, ColorGrade, SpeedStyle } from './vcpManifest';

export type OutputKind = 'video' | 'image' | 'audio';

export interface GenerateRequestBody {
  prompt: string;
  /** model id from lib/modelRegistry */
  model: string;
  /** when true, the Auto-Director picks the hardware; the fields below are ignored */
  auto?: boolean;
  /** DIRECT mode — raw prompt pass-through for the plain generator pages */
  direct?: boolean;
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
  /** temporal speed treatment — video renders only */
  speed?: SpeedStyle;
  /** sound on/off for models with a generate_audio switch (cost can change) */
  sound?: boolean;
  /** start frame (image URL or data URI) — switches video models to image-to-video */
  startImage?: string;
  /** end/tail frame — only for models whose i2v endpoint supports it */
  endImage?: string;
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
  /** present when COMPLETED — the finished video, image or audio */
  mediaUrl?: string;
  output?: OutputKind;
  /** queue position when IN_QUEUE */
  queuePosition?: number;
  /** the seed the model actually used (present when COMPLETED, if the model reports it) */
  seed?: number;
  /** true when the finished file was copied into CMA storage (plan retention) */
  stored?: boolean;
  error?: string;
}

/** The full camera recipe captured with a stored render.
 * ⚠ SEAM (accounts/storage pass): today's stored files carry no recipe yet;
 * render-time capture starts populating this when per-user persistence lands.
 * The Library UI already searches/filters on it when present. */
export interface StoredRecipe {
  camera?: string;
  lens?: string;
  focalLength?: number;
  aperture?: number;
  stock?: string;
  grain?: number;
  shutterAngle?: number;
  lighting?: string;
  grade?: string;
  style?: string;
}

/** One file in the user's CMA storage library (GET /api/files). */
export interface StoredFile {
  /** basename inside the user's prefix, e.g. "abc123.mp4" — the id for /api/files/[id] */
  id: string;
  output: OutputKind;
  model: string;
  /** short user-supplied scene note captured at render time */
  note: string;
  /** ISO timestamp of when the file entered storage */
  createdAt: string;
  bytes: number;
  /** whole days of plan retention remaining before this file expires */
  daysLeft: number;
  /** optional project label (SEAM: set once per-user persistence lands) */
  project?: string;
  /** optional full camera recipe (SEAM: captured at render time later) */
  recipe?: StoredRecipe;
}

export interface FilesResult {
  ok: boolean;
  files?: StoredFile[];
  /** plan retention window applied, in days */
  retentionDays?: number;
  /** true when the storage binding is unavailable (local dev without wrangler) */
  storageOffline?: boolean;
  error?: string;
}
