/**
 * lib/legal.ts — client-safe legal-acceptance constants.
 *
 * TERMS_VERSION must be bumped whenever app/terms, app/privacy or app/refunds
 * materially change (match the "Last updated" date on those pages). The signup
 * clickwrap stamps this version + a timestamp onto the account so we can prove
 * WHICH text a user agreed to. Courts enforce clickwrap (an affirmative
 * checkbox), not browsewrap (a footer link nobody clicked).
 */
export const TERMS_VERSION = '2026-07-18';

/**
 * Per-document versions (the "Last updated" date on each page). The enrollment
 * consent gate logs exactly WHICH version of every document the user scrolled
 * and accepted, so consent proof survives future edits.
 */
export const LEGAL_DOCS = [
  { id: 'terms', label: 'Terms of Service', href: '/terms', version: '2026-07-18' },
  { id: 'privacy', label: 'Privacy Policy', href: '/privacy', version: '2026-07-18' },
  { id: 'refunds', label: 'Refund & Cancellation Policy', href: '/refunds', version: '2026-07-03' },
  { id: 'aup', label: 'Acceptable Use Policy', href: '/acceptable-use', version: '2026-07-18' },
] as const;

export type LegalDocId = (typeof LEGAL_DOCS)[number]['id'];

/**
 * Operator identity. One source of truth, rendered verbatim in Terms Section 1
 * and Section 21, and in the contact blocks of the Privacy and Refund pages.
 * Do not paraphrase: this is the contracting party on the agreement.
 */
export const OPERATOR_IDENTITY =
  'CMA Studio is operated by Sebastien Vautier, professionally known as Sebastien Ricci, doing business as CineMaster Academy, 4375 N Las Vegas Blvd, Suite 7 PMB 5028, Las Vegas, NV 89115, United States, and any successor entity to which these Terms are assigned.';
