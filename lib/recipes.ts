/**
 * lib/recipes.ts — CAMERA RECIPES (client-safe).
 *
 * A recipe is the shareable "EXIF" of a CMA render: every visible knob of the
 * camera package + director's frame, saved under a name, re-appliable, and
 * shareable at /r/[id]. The share id IS the recipe: a versioned base64url
 * JSON payload — so share pages work with zero server storage today.
 *
 * ⚠ SEAMS (accounts/storage pass):
 *   • Saved recipes live in THIS browser's localStorage until account sync.
 *   • /r/[id] OG thumbnails are the brand card until per-recipe render
 *     thumbnails exist in storage.
 *
 * Only redacted-manifest ids appear here — never the server-side prompt
 * injections. Decoding VALIDATES every field against the manifest so a
 * crafted URL can only ever produce a legal recipe or null.
 */
import {
  findCamera,
  findLens,
  findAnamorphic,
  findStyle,
  findShot,
  findMove,
  findGrade,
  findSpeed,
  APERTURE_STOPS,
  type GenreStyle,
  type VisualStyle,
  type ShotSize,
  type CameraMove,
  type ColorGrade,
  type SpeedStyle,
  type FlareColor,
} from './vcpManifest';

export interface RecipeSettings {
  cameraKey: string;
  lensKey: string;
  focalLength: number;
  aperture: number;
  iso: number;
  grain: number;
  shutter: number;
  genre: GenreStyle;
  style: VisualStyle;
  shotSize: ShotSize;
  cameraMove: CameraMove;
  grade: ColorGrade;
  speed: SpeedStyle;
  anamorphic: string;
  flare: FlareColor;
}

export interface SavedRecipe {
  id: string;
  name: string;
  settings: RecipeSettings;
  createdAt: string; // ISO
}

const STORE_KEY = 'cma_recipes';
const SHARE_VERSION = 'r1';

/* ── validation ─────────────────────────────────────────────────────────── */

const GENRES: GenreStyle[] = ['neutral', 'horror', 'drama', 'action-high-motion'];

export function isValidRecipe(r: unknown): r is RecipeSettings {
  if (!r || typeof r !== 'object') return false;
  const s = r as Record<string, unknown>;
  const lens = typeof s.lensKey === 'string' ? findLens(s.lensKey) : undefined;
  return Boolean(
    typeof s.cameraKey === 'string' && findCamera(s.cameraKey) &&
    lens &&
    typeof s.focalLength === 'number' && lens.focalLengths.includes(s.focalLength) &&
    typeof s.aperture === 'number' && (APERTURE_STOPS as readonly number[]).includes(s.aperture) && s.aperture >= lens.maxAperture &&
    typeof s.iso === 'number' && s.iso >= 100 && s.iso <= 6400 &&
    typeof s.grain === 'number' && s.grain >= 0 && s.grain <= 100 &&
    typeof s.shutter === 'number' && s.shutter >= 45 && s.shutter <= 360 &&
    typeof s.genre === 'string' && GENRES.includes(s.genre as GenreStyle) &&
    typeof s.style === 'string' && findStyle(s.style as VisualStyle) &&
    typeof s.shotSize === 'string' && findShot(s.shotSize as ShotSize) &&
    typeof s.cameraMove === 'string' && findMove(s.cameraMove as CameraMove) &&
    typeof s.grade === 'string' && findGrade(s.grade as ColorGrade) &&
    typeof s.speed === 'string' && findSpeed(s.speed as SpeedStyle) &&
    typeof s.anamorphic === 'string' && findAnamorphic(s.anamorphic) &&
    (s.flare === 'blue' || s.flare === 'gold'),
  );
}

/* ── share codec (the id IS the payload) ───────────────────────────────── */

function b64urlEncode(s: string): string {
  const b64 = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): string | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    return typeof atob === 'function'
      ? decodeURIComponent(escape(atob(b64)))
      : Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

export function encodeRecipeId(settings: RecipeSettings): string {
  return `${SHARE_VERSION}.${b64urlEncode(JSON.stringify(settings))}`;
}

export function decodeRecipeId(id: string): RecipeSettings | null {
  if (!id.startsWith(`${SHARE_VERSION}.`) || id.length > 2000) return null;
  const json = b64urlDecode(id.slice(SHARE_VERSION.length + 1));
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    return isValidRecipe(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/* ── local store (browser-only; account sync is a later pass) ──────────── */

export function listRecipes(): SavedRecipe[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const arr: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter((r): r is SavedRecipe => {
      const s = r as SavedRecipe;
      return Boolean(s && typeof s.id === 'string' && typeof s.name === 'string' && isValidRecipe(s.settings));
    });
  } catch {
    return [];
  }
}

function persist(recipes: SavedRecipe[]): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(recipes.slice(0, 100)));
  } catch {
    /* storage full/blocked — saving silently fails, UI stays consistent */
  }
}

export function saveRecipe(name: string, settings: RecipeSettings): SavedRecipe {
  const recipe: SavedRecipe = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || 'Untitled recipe',
    settings,
    createdAt: new Date().toISOString(),
  };
  persist([recipe, ...listRecipes()]);
  return recipe;
}

export function duplicateRecipe(id: string): SavedRecipe | null {
  const source = listRecipes().find((r) => r.id === id);
  if (!source) return null;
  return saveRecipe(`${source.name} copy`, source.settings);
}

export function deleteRecipe(id: string): void {
  persist(listRecipes().filter((r) => r.id !== id));
}

/** Human-readable one-line summary, used by share pages and OG descriptions. */
export function recipeSummary(s: RecipeSettings): string {
  const camera = findCamera(s.cameraKey)?.label ?? s.cameraKey;
  const lens = findLens(s.lensKey)?.label ?? s.lensKey;
  return `${camera} · ${lens} · ${s.focalLength}mm · T${s.aperture.toFixed(1)} · ISO ${s.iso} · ${s.shutter}° · ${findStyle(s.style).label} · ${s.genre}`;
}
