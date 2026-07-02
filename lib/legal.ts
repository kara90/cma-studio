/**
 * lib/legal.ts — client-safe legal-acceptance constants.
 *
 * TERMS_VERSION must be bumped whenever app/terms or app/privacy materially
 * change (match the "Last updated" date on those pages). The signup clickwrap
 * stamps this version + a timestamp onto the account so we can prove WHICH
 * text a user agreed to — courts enforce clickwrap (an affirmative checkbox),
 * not browsewrap (a footer link nobody clicked).
 */
export const TERMS_VERSION = '2026-07-02';
