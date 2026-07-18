/**
 * lib/skills/marketingSkill.ts
 * ─────────────────────────────────────────────────────────────────────────
 * ⚠ PLACEHOLDER — NOT WIRED (Section C of the studios pass, 2026-07-17).
 *
 * CMA Marketing Studio will get its OWN dedicated prompt skill, written by
 * Sebastien, separate from the Director Studio's DP engine. Until then this
 * module exists only as the clearly-labeled seam where that skill plugs in.
 *
 * HARD RULES for whoever wires this later:
 *   • Server-side ONLY (same rule as lib/promptCompiler.ts). Never import
 *     from a client component.
 *   • /api/generate does NOT import this file today. The Marketing console
 *     is INERT: it cannot reach any render path.
 *   • The Director Studio's skill (promptCompiler + autoDirector + vcpMatrix)
 *     is untouched by this file and must stay that way.
 */

export const MARKETING_SKILL_STATUS = 'placeholder-not-wired' as const;

/** Seam: replaced by Sebastien's real product-ad skill in a later pass. */
export function compileMarketingPrompt(): never {
  throw new Error(
    // LANGUAGE RULE: user-visible strings never say "skill" or expose engine internals.
    'CMA Marketing Studio is not wired for rendering yet. This studio is an inert preview; no renders run through it.',
  );
}
