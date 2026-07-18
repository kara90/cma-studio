/**
 * lib/skills/realEstateSkill.ts
 * ─────────────────────────────────────────────────────────────────────────
 * ⚠ PLACEHOLDER — NOT WIRED (Section C of the studios pass, 2026-07-17).
 *
 * CMA Real Estate Studio will get its OWN dedicated prompt skill, written by
 * Sebastien, separate from the Director Studio's DP engine. Until then this
 * module exists only as the clearly-labeled seam where that skill plugs in.
 *
 * HARD RULES for whoever wires this later:
 *   • Server-side ONLY (same rule as lib/promptCompiler.ts). Never import
 *     from a client component.
 *   • /api/generate does NOT import this file today. The Real Estate console
 *     is INERT: it cannot reach any render path.
 *   • The Director Studio's skill (promptCompiler + autoDirector + vcpMatrix)
 *     is untouched by this file and must stay that way.
 */

export const REAL_ESTATE_SKILL_STATUS = 'placeholder-not-wired' as const;

/** Seam: replaced by Sebastien's real listing-film skill in a later pass. */
export function compileRealEstatePrompt(): never {
  throw new Error(
    // LANGUAGE RULE: user-visible strings never say "skill" or expose engine internals.
    'CMA Real Estate Studio is not wired for rendering yet. This studio is an inert preview; no renders run through it.',
  );
}
