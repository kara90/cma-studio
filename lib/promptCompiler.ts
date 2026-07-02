/**
 * lib/promptCompiler.ts — PROPRIETARY CINEMATIC COMPILER  (server-only)
 * ─────────────────────────────────────────────────────────────────────────
 * Turns the user's visible knobs + the hardware matrix into a single dense
 * render prompt. This is CineMaster Academy's protected prompt-engineering
 * logic: it is imported only by app/api/generate/route.ts (an edge handler),
 * so none of these formulas or injection strings ever reach the client.
 *
 * Do NOT import this file from a client component.
 */
import { CAMERA_DATABASE, LENS_DATABASE, type CameraRecord, type LensRecord } from './vcpMatrix';
import type { GenreStyle, VisualStyle, ShotSize, CameraMove, ColorGrade } from './vcpManifest';
import type { GenerateRequestBody } from './vcpTypes';

/* ── texture math ─────────────────────────────────────────────────────────
 * Celluloid bodies get an organic chemical grain matrix seeded by the user's
 * cineNoise slider. Digital bodies instead scale native-ISO luminance gain
 * noise, and only push visible noise into the shadows once ISO climbs high.
 */

function celluloidGrainMatrix(cam: CameraRecord, cineNoise: number): string {
  // 0–100 slider → 0–1, floored by the stock's inherent grain bias.
  const intensity = Math.min(1, cam.grainBias + (cineNoise / 100) * (1 - cam.grainBias));
  const block = Math.round(intensity * 100);
  let size: string;
  if (intensity < 0.3) size = 'fine 16-micron';
  else if (intensity < 0.6) size = 'medium 35mm';
  else size = 'coarse pushed-stock';
  return (
    `organic ${size} chemical film grain at ${block}% density, ` +
    `grain sitting in the midtones and breathing between frames, analog emulsion texture`
  );
}

function digitalGainNoise(cam: CameraRecord, iso: number): string {
  const stops = Math.max(0, Math.log2(iso / cam.nativeIso));
  if (iso >= 3200) {
    // heavy native-ISO gain: luminance noise concentrated in the shadows
    const shadowGain = Math.min(100, Math.round(stops * 22));
    return (
      `elevated native-ISO luminance gain, fine digital sensor noise rising ~${shadowGain}% ` +
      `in the darkest shadow values while highlights stay clean`
    );
  }
  if (stops <= 0.01) return 'clean native-ISO capture, negligible sensor noise';
  return `mild digital sensor noise, ~${stops.toFixed(1)} stops above native ISO, clean midtones`;
}

/* ── genre lighting rules ────────────────────────────────────────────────── */

function genreInjection(genre: GenreStyle): string {
  switch (genre) {
    case 'horror':
      return (
        'chiaroscuro low-key lighting, single hard edge key, crushed inky shadows, ' +
        'negative fill, tense unsettling atmosphere, pools of darkness'
      );
    case 'drama':
      return (
        'soft wrap-around window key light, gentle motivated practicals, ' +
        'controlled contrast, intimate naturalistic mood'
      );
    case 'action-high-motion':
      return (
        'high-motion energy, hard directional key, deep punchy contrast, ' +
        'dynamic rim separation, atmospheric haze catching the light, kinetic staging'
      );
    case 'neutral':
    default:
      return 'balanced naturalistic lighting, motivated sources, faithful contrast';
  }
}

/* ── visual style ─────────────────────────────────────────────────────────── */

function styleInjection(style: VisualStyle): string {
  switch (style) {
    case 'commercial':
      return 'polished high-end commercial look, glossy pristine finish, immaculate product-grade lighting, crisp clean surfaces, aspirational gloss';
    case 'vintage':
      return 'vintage retro period-film aesthetic, era-authentic styling, nostalgic faded palette, classic film texture, timeless throwback mood';
    case 'noir':
      return 'film-noir aesthetic, high-contrast moody chiaroscuro, deep inky shadows, dramatic silhouettes, mysterious tension';
    case 'cinematic':
    default:
      return 'polished cinematic film aesthetic, deliberate composition, filmic depth and atmosphere, blockbuster production value';
  }
}

/* ── director controls: framing, movement, grade ─────────────────────────────
 * Optional — only present in Manual mode. In Auto mode the shot ANGLE already
 * carries framing/movement, so these are left undefined to avoid conflicts. */

function shotInjection(s: ShotSize): string {
  switch (s) {
    case 'wide': return 'wide establishing shot, the full environment in frame';
    case 'full': return 'full shot framing the whole subject head to toe';
    case 'close': return 'close-up on the subject, shallow focus, intimate framing';
    case 'extreme-close': return 'extreme close-up, macro detail filling the frame';
    case 'medium':
    default: return 'medium shot framed from roughly the waist up';
  }
}

function moveInjection(m: CameraMove): string {
  switch (m) {
    case 'push-in': return 'slow dolly push-in toward the subject, building intimacy';
    case 'tracking': return 'smooth tracking shot moving alongside the subject';
    case 'pan': return 'smooth horizontal panning camera move';
    case 'tilt': return 'deliberate vertical tilting camera move';
    case 'crane': return 'sweeping crane and jib move revealing the scene';
    case 'handheld': return 'organic handheld camera with subtle natural shake, documentary energy';
    case 'static':
    default: return 'static locked-off camera, steady still framing';
  }
}

function gradeInjection(g: ColorGrade): string {
  switch (g) {
    case 'warm': return 'warm golden colour grade, amber highlights, inviting tone';
    case 'cool': return 'cool blue colour grade, cold shadows, restrained tone';
    case 'teal-orange': return 'teal-and-orange blockbuster colour grade, warm skin against teal shadows';
    case 'bleach': return 'bleach-bypass look, desaturated high-contrast silvery palette';
    case 'mono': return 'black-and-white monochrome, rich tonal range and deep contrast';
    case 'neutral':
    default: return 'neutral natural colour grade, faithful balanced colour';
  }
}

/* ── shutter → motion cue ─────────────────────────────────────────────────── */

function motionCue(shutterAngle: number): string {
  if (shutterAngle >= 270) return 'pronounced silky motion blur from a wide shutter angle';
  if (shutterAngle <= 90) return 'crisp staccato motion with minimal blur from a narrow shutter angle';
  return 'natural 180-degree-shutter motion blur';
}

export interface CompileOutput {
  prompt: string;
  camera: CameraRecord;
  lens: LensRecord;
}

/** Compile input: the request fields the compiler needs + an optional Auto angle. */
type CompileInput = Omit<GenerateRequestBody, 'userApiKey' | 'model' | 'auto' | 'variant'> & {
  autoAngle?: string;
};

/**
 * Compile the full production prompt. Throws a typed error the route can surface
 * if the hardware keys are invalid.
 */
export function compileProductionPrompt(input: CompileInput): CompileOutput {
  const camera = CAMERA_DATABASE[input.cameraKey];
  const lens = LENS_DATABASE[input.lensKey];
  if (!camera) throw new Error(`Unknown cameraKey: ${input.cameraKey}`);
  if (!lens) throw new Error(`Unknown lensKey: ${input.lensKey}`);

  const texture =
    camera.sensor === 'Celluloid'
      ? celluloidGrainMatrix(camera, input.cineNoise)
      : digitalGainNoise(camera, input.isoValue);

  const optics =
    `${input.focalLength}mm focal length at T${input.aperture.toFixed(1)}, ` +
    // No hard-coded ratio here — the route appends the user's real chosen squeeze
    // (1.85 / 2.0 / 2.39) so the prompt never carries two conflicting aspects.
    (lens.geometry === 'anamorphic' ? 'anamorphic scope framing' : 'clean spherical framing');

  // Order matters: subject first, then the hardware/texture/lighting stack.
  const segments = [
    input.prompt.trim(),
    input.autoAngle,
    input.shotSize ? shotInjection(input.shotSize) : undefined,
    input.cameraMove ? moveInjection(input.cameraMove) : undefined,
    camera.promptInjection,
    lens.promptInjection,
    optics,
    texture,
    styleInjection(input.style),
    input.grade ? gradeInjection(input.grade) : undefined,
    genreInjection(input.genreStyle),
    motionCue(input.shutterAngle),
    'shot with intentional cinematic composition, professional color grading, filmic contrast curve',
  ];

  return { prompt: segments.filter(Boolean).join('. ') + '.', camera, lens };
}
