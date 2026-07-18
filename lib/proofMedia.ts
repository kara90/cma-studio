/**
 * ============================================================================
 * PROOF MEDIA  >>>  SEBASTIEN: DROP THE TWO COMPARISON CLIPS HERE  <<<
 * ============================================================================
 *
 * This file feeds the homepage "Same model. Different director." side-by-side
 * (app/page.tsx). It is the single highest-value proof slot on the site.
 *
 * TO PUBLISH: render the SAME base idea on the SAME model twice —
 *   raw      = the prompt as a beginner would type it, sent as written
 *   directed = the same idea after the DP engine composed the shot
 * compress both for web (short, muted-friendly), drop them in /public/clips,
 * and fill in the two `src` values below. Nothing else to change: the section
 * automatically switches from its "coming soon" state to the live comparison.
 *
 * DO NOT FABRICATE: leave src empty until the clips are real renders.
 */

export interface ProofClip {
  /** e.g. '/clips/compare-raw.mp4' — empty string = not supplied yet */
  src: string;
  caption: string;
}

export const COMPARISON: { raw: ProofClip; directed: ProofClip } = {
  raw: {
    src: '', // ← drop the RAW-prompt render here
    caption: 'Raw prompt, straight to the model',
  },
  directed: {
    src: '', // ← drop the DP-ENGINE render here
    caption: 'Same idea, directed by the DP engine',
  },
};

/** True once both clips are supplied — the section shows the live comparison. */
export const COMPARISON_READY = Boolean(COMPARISON.raw.src && COMPARISON.directed.src);
