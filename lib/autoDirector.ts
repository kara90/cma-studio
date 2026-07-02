/**
 * lib/autoDirector.ts — CMA Auto-Director (server-only, proprietary).
 * Our "AI skill": read the user's scene and choose the whole camera package for
 * them — body, glass, focal, aperture, ISO, grain, shutter, genre, and a camera
 * angle — so a user who doesn't know (or doesn't have time for) the hardware can
 * just type and shoot. Successive renders rotate through different angles.
 */
import type { GenreStyle, VisualStyle } from './vcpManifest';

export interface AutoDirection {
  cameraKey: string;
  lensKey: string;
  focalLength: number;
  aperture: number;
  isoValue: number;
  cineNoise: number;
  shutterAngle: number;
  genreStyle: GenreStyle;
  style: VisualStyle;
  /** appended to the prompt to vary the coverage across takes */
  angle: string;
}

interface Recipe {
  words: string[];
  cameraKey: string;
  lensKey: string;
  focalLength: number;
  aperture: number;
  isoValue: number;
  cineNoise: number;
  shutterAngle: number;
  genreStyle: GenreStyle;
  style: VisualStyle;
}

// Each recipe is a tuned "look" the Auto-Director reaches for when the scene
// matches. Ordered by specificity; the first strong keyword match wins.
const RECIPES: Recipe[] = [
  {
    words: ['horror', 'dark', 'shadow', 'nightmare', 'haunted', 'blood', 'creepy', 'fear'],
    cameraKey: 'digital-super35', lensKey: 'cooke-speed-panchro-vintage',
    focalLength: 32, aperture: 2, isoValue: 1600, cineNoise: 45, shutterAngle: 180, genreStyle: 'horror', style: 'noir',
  },
  {
    words: ['chase', 'fight', 'run', 'explosion', 'battle', 'action', 'race', 'crash', 'storm'],
    cameraKey: 'cinema-8k', lensKey: 'arri-signature-prime',
    focalLength: 35, aperture: 2.8, isoValue: 800, cineNoise: 8, shutterAngle: 90, genreStyle: 'action-high-motion', style: 'cinematic',
  },
  {
    words: ['epic', 'landscape', 'ocean', 'mountain', 'desert', 'city', 'wide', 'vista', 'sky', 'space'],
    cameraKey: 'cinefilm-70', lensKey: 'panavision-c-series-anamorphic',
    focalLength: 40, aperture: 2.8, isoValue: 800, cineNoise: 12, shutterAngle: 180, genreStyle: 'drama', style: 'cinematic',
  },
  {
    words: ['memory', 'vintage', 'nostalgia', 'romance', 'love', 'warm', 'grandmother', 'childhood', 'film'],
    cameraKey: 'super16', lensKey: 'cooke-speed-panchro-vintage',
    focalLength: 50, aperture: 2, isoValue: 500, cineNoise: 60, shutterAngle: 180, genreStyle: 'drama', style: 'vintage',
  },
];

// Sensible default when nothing matches strongly: a clean, flattering drama look.
const DEFAULT_RECIPE: Recipe = {
  words: [],
  cameraKey: 'digital-super35', lensKey: 'arri-signature-prime',
  focalLength: 35, aperture: 2, isoValue: 800, cineNoise: 15, shutterAngle: 180, genreStyle: 'drama', style: 'cinematic',
};

const ANGLES = [
  'framed as a sweeping wide establishing shot',
  'a slow low-angle hero push-in',
  'an intimate medium close-up with a shallow plane of focus',
  'a high-angle overhead framing looking down',
  'a tracking over-the-shoulder move',
  'a dramatic dutch-tilt close-up',
  'a locked-off symmetrical wide, subject centered',
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * @param prompt the user's scene
 * @param variant rotate coverage across takes (e.g. attempt index)
 */
export function autoDirect(prompt: string, variant = 0): AutoDirection {
  const t = prompt.toLowerCase();
  let best: Recipe = DEFAULT_RECIPE;
  let bestScore = 0;
  for (const r of RECIPES) {
    const score = r.words.reduce((n, w) => (t.includes(w) ? n + 1 : n), 0);
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  const angle = ANGLES[(hash(prompt) + variant) % ANGLES.length];
  return { ...pickFields(best), angle };
}

function pickFields(r: Recipe): Omit<AutoDirection, 'angle'> {
  return {
    cameraKey: r.cameraKey,
    lensKey: r.lensKey,
    focalLength: r.focalLength,
    aperture: r.aperture,
    isoValue: r.isoValue,
    cineNoise: r.cineNoise,
    shutterAngle: r.shutterAngle,
    genreStyle: r.genreStyle,
    style: r.style,
  };
}
