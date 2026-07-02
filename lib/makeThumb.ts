'use client';

/**
 * lib/makeThumb.ts — lightweight preview generator (client-only).
 *
 * Turns a finished Fal render (image or video URL) into a tiny, self-contained
 * JPEG data-URL (~a few KB). We store THAT, never the full file — so the history
 * strip keeps a light memory of each job that survives 24h even after the Fal
 * URL expires, while the full quality stays on the user's own Fal account.
 *
 * Requires the Fal media CDN to allow cross-origin canvas reads (it normally
 * does). If it doesn't — or anything else fails — every path resolves to
 * `undefined`, and the caller falls back to the raw Fal URL. It can't break.
 */
import type { OutputKind } from './vcpTypes';

const MAX_W = 360; // preview width in px — plenty for a thumbnail, tiny to store
const QUALITY = 0.62; // JPEG quality — small file, still readable
const TIMEOUT_MS = 8000;

export async function makeThumb(url: string, output: OutputKind): Promise<string | undefined> {
  if (typeof document === 'undefined') return undefined;
  try {
    return output === 'image' ? await imageThumb(url) : await videoThumb(url);
  } catch {
    return undefined; // CORS taint, decode error, timeout — fall back to the raw URL
  }
}

function toJpeg(source: CanvasImageSource, srcW: number, srcH: number): string {
  const scale = Math.min(1, MAX_W / (srcW || MAX_W));
  const w = Math.max(1, Math.round((srcW || MAX_W) * scale));
  const h = Math.max(1, Math.round((srcH || Math.round((MAX_W * 9) / 16)) * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  ctx.drawImage(source, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', QUALITY); // throws if the canvas is tainted
}

function imageThumb(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS);
    img.onload = () => {
      clearTimeout(timer);
      try {
        resolve(toJpeg(img, img.naturalWidth, img.naturalHeight));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('image load error'));
    };
    img.src = url;
  });
}

function videoThumb(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';
    let done = false;
    const timer = setTimeout(() => finish(new Error('timeout')), TIMEOUT_MS);

    function finish(err?: Error, data?: string) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      if (data) resolve(data);
      else reject(err ?? new Error('video thumb failed'));
    }

    video.onloadeddata = () => {
      // seek a hair in so we grab a real frame, not black
      try {
        video.currentTime = Math.min(0.1, (video.duration || 1) * 0.1);
      } catch {
        /* some sources don't allow seeking — onseeked may still fire at 0 */
      }
    };
    video.onseeked = () => {
      try {
        finish(undefined, toJpeg(video, video.videoWidth, video.videoHeight));
      } catch (e) {
        finish(e as Error);
      }
    };
    video.onerror = () => finish(new Error('video load error'));
    video.src = url;
  });
}
