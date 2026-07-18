/**
 * ============================================================================
 * PROOF MEDIA  >>>  SEBASTIEN: DROP THE TWO COMPARISON CLIPS HERE  <<<
 * ============================================================================
 *
 * This file feeds the homepage "Same model. Different director." side-by-side
 * (app/page.tsx). It is the single highest-value proof slot on the site.
 *
 * ── TO PUBLISH (two ways, pick one per clip) ──────────────────────────────
 *   A) SELF-HOSTED (simplest, already fast):
 *      render the SAME base idea on the SAME model twice —
 *        raw      = the prompt as a beginner would type it, sent as written
 *        directed = the same idea after the Cinematographer engine composed it
 *      compress both for web (short, ~3–6s, muted-friendly, faststart mp4),
 *      drop them in /public/clips, and set each `src` below. They serve over
 *      Cloudflare's CDN automatically (the whole site is on Cloudflare).
 *
 *   B) CLOUDFLARE STREAM (adaptive, optional, PAID — enable later):
 *      leave `src` empty and set `streamUid` to the video's Stream UID. Also
 *      set NEXT_PUBLIC_CF_STREAM_SUBDOMAIN (e.g. customer-xxxx.cloudflarestream.com)
 *      and enable MP4 downloads on the video in the Stream dashboard, so it
 *      plays through the native <video> element (keeps our locked muted-autoplay
 *      contract — no third-party player iframe). Stream is a paid add-on; it is
 *      NOT enabled yet, so this path stays inert until you turn it on.
 *
 * Either way the homepage flips itself from the "coming soon" card to the live
 * side-by-side automatically — no code change beyond this file.
 *
 * DO NOT FABRICATE: leave src (and streamUid) empty until the clips are real
 * renders. `poster` is a pure-CSS gradient, so the slot is never blank.
 * ============================================================================
 */

export interface ProofClip {
  /** e.g. '/clips/compare-raw.mp4' — empty string = not supplied yet. */
  src: string;
  /**
   * Optional Cloudflare Stream UID (path B above). Resolved to a native-playable
   * MP4 URL by streamSrcFor(); ignored while src is set. Empty = not used.
   */
  streamUid?: string;
  /** Pure-CSS gradient shown instantly under the video and before it loads. */
  poster: string;
  caption: string;
}

export const COMPARISON: { raw: ProofClip; directed: ProofClip } = {
  raw: {
    src: '', // ← drop the RAW-prompt render here (or set streamUid)
    streamUid: '',
    // Flat, cool, undirected — the "before".
    poster: 'linear-gradient(160deg, #0a0d14 0%, #141922 55%, #1b2028 100%)',
    caption: 'Raw prompt, straight to the model',
  },
  directed: {
    src: '', // ← drop the CINEMATOGRAPHER-engine render here (or set streamUid)
    streamUid: '',
    // Cinematic teal→amber split tone — the "after".
    poster:
      'radial-gradient(90% 80% at 70% 25%, rgba(222,160,84,0.5) 0%, rgba(222,160,84,0) 55%), linear-gradient(150deg, #071f27 0%, #0d3844 46%, #4c3a20 78%, #b0803c 100%)',
    caption: 'Same idea, directed by the Cinematographer engine',
  },
};

/**
 * Turns an optional Cloudflare Stream UID into a native-playable MP4 URL, or ''
 * when Stream isn't configured. Reads NEXT_PUBLIC_CF_STREAM_SUBDOMAIN (inlined
 * at build). No subdomain or no UID → '' (falls back to self-hosted src).
 */
export function streamSrcFor(uid?: string): string {
  const sub = process.env.NEXT_PUBLIC_CF_STREAM_SUBDOMAIN;
  if (!uid || !sub) return '';
  return `https://${sub}/${uid}/downloads/default.mp4`;
}

/** The URL a clip should actually play: self-hosted src first, then Stream. */
export function proofSrc(clip: ProofClip): string {
  return clip.src || streamSrcFor(clip.streamUid);
}

/** True once both clips resolve to a real source — section shows the comparison. */
export const COMPARISON_READY = Boolean(proofSrc(COMPARISON.raw) && proofSrc(COMPARISON.directed));
