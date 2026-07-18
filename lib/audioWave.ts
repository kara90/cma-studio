/**
 * lib/audioWave.ts — CLIENT-side waveform engine for the Audio Studio.
 *
 * Turns a finished render (fal URL or /api/files stream) into drawable peak
 * data via the Web Audio API, with an honest fallback: when a file can't be
 * fetched/decoded (CORS, codec, offline), a deterministic pseudo-wave seeded
 * from the item id keeps the card visually whole — clearly a placeholder
 * shape, never a fake claim about the audio's real envelope once decode works.
 *
 * All decoding is lazy (on first play or when a card requests it) and cached
 * in-module per URL so scrolling the grid never re-decodes.
 */

export interface WavePeaks {
  /** normalized 0..1 peak per bar */
  peaks: number[];
  /** true when derived from the real audio; false = seeded placeholder */
  real: boolean;
  /** duration in seconds when known (real decode only) */
  duration?: number;
}

const cache = new Map<string, WavePeaks>();
const inflight = new Map<string, Promise<WavePeaks>>();

/** Deterministic placeholder wave from a string seed (mulberry32). */
export function seededWave(seed: string, bars = 96): WavePeaks {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const rand = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const peaks: number[] = [];
  for (let i = 0; i < bars; i++) {
    // organic envelope: two slow sines + noise, tapered at the ends
    const t = i / bars;
    const env = Math.sin(Math.PI * t) ** 0.6;
    const body = 0.35 + 0.3 * Math.sin(t * 9 + rand() * 2) * Math.sin(t * 23);
    peaks.push(Math.max(0.06, Math.min(1, env * (body + rand() * 0.35))));
  }
  return { peaks, real: false };
}

/** Compute N peak bars from decoded channel data (max |sample| per window). */
function toPeaks(buf: AudioBuffer, bars: number): number[] {
  const ch = buf.getChannelData(0);
  const win = Math.max(1, Math.floor(ch.length / bars));
  const peaks: number[] = [];
  let max = 0;
  for (let b = 0; b < bars; b++) {
    let peak = 0;
    const start = b * win;
    const end = Math.min(ch.length, start + win);
    for (let i = start; i < end; i += 4) {
      const v = Math.abs(ch[i]);
      if (v > peak) peak = v;
    }
    peaks.push(peak);
    if (peak > max) max = peak;
  }
  // normalize so quiet files still draw
  const scale = max > 0.01 ? 1 / max : 1;
  return peaks.map((p) => Math.max(0.04, Math.min(1, p * scale)));
}

/**
 * Decode a URL into peaks (cached). Falls back to the seeded wave on any
 * failure — the promise never rejects.
 */
export function loadWave(url: string, seed: string, bars = 96): Promise<WavePeaks> {
  const hit = cache.get(url);
  if (hit) return Promise.resolve(hit);
  const running = inflight.get(url);
  if (running) return running;
  const p = (async (): Promise<WavePeaks> => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const buf = await res.arrayBuffer();
      type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
      const Ctx = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
      if (!Ctx) throw new Error('no AudioContext');
      const ctx = new Ctx();
      try {
        const decoded = await ctx.decodeAudioData(buf);
        const wave: WavePeaks = { peaks: toPeaks(decoded, bars), real: true, duration: decoded.duration };
        cache.set(url, wave);
        return wave;
      } finally {
        void ctx.close();
      }
    } catch {
      const fallback = seededWave(seed, bars);
      cache.set(url, fallback);
      return fallback;
    } finally {
      inflight.delete(url);
    }
  })();
  inflight.set(url, p);
  return p;
}

/**
 * Draw peaks as a mirrored bar wave onto a canvas 2D context.
 * `progress` (0..1) splits played (bright) vs remaining (dim) bars.
 */
export function drawWave(
  canvas: HTMLCanvasElement,
  peaks: number[],
  opts: { progress?: number; played?: string; rest?: string; cursor?: string } = {},
) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const n = peaks.length;
  const gap = 1.5;
  const bw = Math.max(1.5, w / n - gap);
  const mid = h / 2;
  const progress = opts.progress ?? 0;
  const playedColor = opts.played ?? '#e7cfa3';
  const restColor = opts.rest ?? 'rgba(188,152,99,0.34)';

  for (let i = 0; i < n; i++) {
    const x = (i / n) * w;
    const amp = Math.max(2, peaks[i] * (h * 0.92)) / 2;
    ctx.fillStyle = i / n <= progress ? playedColor : restColor;
    // rounded vertical bar, mirrored around the midline
    const r = Math.min(bw / 2, 2);
    ctx.beginPath();
    ctx.roundRect(x, mid - amp, bw, amp * 2, r);
    ctx.fill();
  }

  if (progress > 0 && progress < 1 && opts.cursor) {
    ctx.fillStyle = opts.cursor;
    ctx.fillRect(progress * w, 2, 1.5, h - 4);
  }
}
