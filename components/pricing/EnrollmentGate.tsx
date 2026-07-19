'use client';

/**
 * EnrollmentGate — the consent gate a buyer passes BEFORE any checkout fires
 * (mirrors the Beyond the Edge enrollment pattern).
 *
 * Step 1 · READ: all four documents (Terms, Privacy, Refunds, Acceptable Use)
 *   render in scrollable same-origin frames. Each must be scrolled to the end
 *   before it counts as read; Continue stays disabled until all four are read.
 * Step 2 · CONFIRM: the G4 purchase disclosures (plan, price, renewal, term,
 *   cancel method), SIX explicit clause acknowledgements, and the original
 *   verbatim consent checkbox. Checkout stays disabled until every box is
 *   ticked.
 *
 * Acceptance is LOGGED via POST /api/consent with the date + the exact version
 * of each document (lib/legal.ts LEGAL_DOCS) + which boxes were ticked; the
 * returned log id rides into the checkout payload → Stripe metadata.
 *
 * ⚠ SEAM (accounts pass): consent records are anonymous today; they bind to a
 * user id when the accounts system lands. Payments themselves remain OFF until
 * the legal gate clears — this gate simply stands ready in front of checkout.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, ScrollText } from 'lucide-react';
import { LEGAL_DOCS, type LegalDocId } from '@/lib/legal';

export interface PendingCheckout {
  payload: Record<string, unknown>;
  id: string;
  name: string;
  price: string;
  frequency: string;
}

/** The explicit clause acknowledgements (Section H of the upgrade brief). */
const CLAUSES = [
  { id: 'uploads', text: 'I own, or have the rights to, everything I upload, including reference images.' },
  { id: 'compute', text: 'Compute is billed by fal.ai directly to me and is not refundable by CMA.' },
  { id: 'outputs', text: 'AI outputs are not guaranteed; a generation can miss or be declined and still cost compute.' },
  { id: 'seat', text: 'My subscription is a single seat for me alone; I will not share login credentials.' },
  { id: 'human', text: 'I am subscribing for my own human use, not for bots, scripts or resale.' },
  { id: 'age', text: 'I am 18 or older.' },
] as const;

/** One legal document in a scroll-tracked frame. Marks itself read when the
 * reader reaches (or the document is shorter than) ~the end. */
function DocFrame({
  doc,
  read,
  onRead,
}: {
  doc: (typeof LEGAL_DOCS)[number];
  read: boolean;
  onRead: (id: LegalDocId) => void;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  const attach = useCallback(() => {
    const frame = frameRef.current;
    const win = frame?.contentWindow;
    const docEl = win?.document?.documentElement;
    if (!win || !docEl) return;
    const check = () => {
      const bottom = win.scrollY + win.innerHeight;
      if (bottom >= docEl.scrollHeight * 0.92) onRead(doc.id);
    };
    check(); // short docs (or tall frames) count as read immediately
    win.addEventListener('scroll', check, { passive: true });
  }, [doc.id, onRead]);

  return (
    <div className={`overflow-hidden rounded-xl border transition ${read ? 'border-emerald-500/40' : 'border-white/10'}`}>
      <div className="flex items-center justify-between gap-2 border-b border-white/8 bg-black/40 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2">
          <ScrollText size={13} className="shrink-0 text-[#bc9863]" />
          <span className="truncate text-[12.5px] font-medium text-[#f4efe6]">{doc.label}</span>
          <span className="font-mono text-[9px] text-[#8b909e]">v{doc.version}</span>
        </span>
        {read ? (
          <span className="inline-flex flex-none items-center gap-1 font-mono text-[10px] text-emerald-400">
            <Check size={11} /> Read
          </span>
        ) : (
          <span className="flex-none font-mono text-[10px] text-[#8b909e]">Scroll to the end</span>
        )}
      </div>
      <iframe
        ref={frameRef}
        src={doc.href}
        title={doc.label}
        onLoad={attach}
        className="h-44 w-full bg-[#05060a]"
      />
    </div>
  );
}

export function EnrollmentGate({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: PendingCheckout;
  onConfirm: (consentLogId: string | null) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [readDocs, setReadDocs] = useState<Record<string, boolean>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [agree, setAgree] = useState(false);
  // EU/UK statutory-withdrawal waiver: REQUIRED for every buyer (the statutory
  // right only exists for some, but one consistent flow is simpler and safer).
  // Logged with the consent record. ⚠ ATTORNEY REVIEW before launch.
  const [withdrawalWaiver, setWithdrawalWaiver] = useState(false);
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const markRead = useCallback((id: LegalDocId) => {
    setReadDocs((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  }, []);

  const allRead = LEGAL_DOCS.every((d) => readDocs[d.id]);
  const allChecked = CLAUSES.every((c) => checks[c.id]) && withdrawalWaiver && agree;

  // Focus management (a11y): Escape cancels; on open, focus moves into the
  // dialog and is TRAPPED there (Tab/Shift+Tab cycle within the panel); on
  // close, focus returns to whatever opened it (the pay button).
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.focus();

    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.offsetParent !== null)
        : [];

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCancel(); return; }
      if (e.key !== 'Tab' || !panel) return;
      const items = focusables();
      if (items.length === 0) { e.preventDefault(); panel.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [onCancel]);

  async function confirm() {
    if (!allChecked || busy) return;
    setBusy(true);
    // LOG the acceptance: date + exact doc versions + ticked clauses. The log
    // id travels with the checkout payload into Stripe metadata as proof.
    let logId: string | null = null;
    try {
      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'checkout',
          plan: pending.name,
          docs: LEGAL_DOCS.map((d) => ({ id: d.id, version: d.version })),
          // 'withdrawal-waiver' records the immediate-access / loss-of-withdrawal
          // acknowledgement (EU/UK consumer law) alongside the other clauses.
          clauses: [...CLAUSES.map((c) => c.id), 'withdrawal-waiver'],
        }),
      });
      const data = (await res.json()) as { ok?: boolean; id?: string };
      if (data.ok && data.id) logId = data.id;
    } catch {
      /* logging is best-effort here; the checkout payload still carries consent */
    }
    onConfirm(logId);
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Review and agree before checkout"
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="glass glass-gold flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#bc9863]/40 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/8 px-6 py-4">
          <h3 className="font-[family-name:var(--font-sora)] text-[17px] font-semibold text-[#f4efe6]">
            {step === 1 ? 'Read before you subscribe' : 'Confirm your subscription'}
          </h3>
          <p className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-[#8b909e] uppercase">
            Step {step} of 2 · {pending.name} · {pending.price} {pending.frequency}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 1 ? (
            <div className="flex flex-col gap-3">
              <p className="text-[12.5px] leading-relaxed text-[#8b909e]">
                Scroll each document to the end. The confirm step unlocks when all four are read. Each also opens{' '}
                full-size: {LEGAL_DOCS.map((d, i) => (
                  <span key={d.id}>
                    <Link href={d.href} target="_blank" className="text-[#bc9863] underline hover:text-[#e7cfa3]">
                      {d.label}
                    </Link>
                    {i < LEGAL_DOCS.length - 1 ? ' · ' : ''}
                  </span>
                ))}
                .
              </p>
              {LEGAL_DOCS.map((d) => (
                <DocFrame key={d.id} doc={d} read={Boolean(readDocs[d.id])} onRead={markRead} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* G4.1 disclosures, adjacent to the pay button (preserved verbatim) */}
              <dl className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-[12px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#8b909e]">Plan</dt>
                  <dd className="text-[#f4efe6]">{pending.name}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#8b909e]">Price</dt>
                  <dd className="text-[#f4efe6]">
                    {pending.price} <span className="text-[#8b909e]">{pending.frequency}</span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#8b909e]">Renewal</dt>
                  <dd className="text-[#e7cfa3]">Renews automatically until cancelled</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-[#8b909e]">Term</dt>
                  <dd className="text-right text-[#cfcabf]">
                    {pending.payload.cycle === 'yearly'
                      ? 'One-year commitment · non-refundable'
                      : 'Month to month · cancel anytime'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-[#8b909e]">Cancel</dt>
                  <dd className="text-right text-[#cfcabf]">One click in your account, or email hello@cinemasteracademy.com</dd>
                </div>
              </dl>

              {/* the six explicit clause acknowledgements */}
              <fieldset className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-4">
                <legend className="px-1 font-mono text-[10px] tracking-[0.14em] text-[#8b909e] uppercase">
                  I acknowledge, specifically
                </legend>
                {CLAUSES.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={Boolean(checks[c.id])}
                      onChange={(e) => setChecks((prev) => ({ ...prev, [c.id]: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#bc9863]"
                    />
                    <span className="text-[12px] leading-relaxed text-[#8b8f99]">{c.text}</span>
                  </label>
                ))}
              </fieldset>

              {/* EU/UK statutory-withdrawal waiver — REQUIRED for every buyer,
                  logged with the consent record. ⚠ ATTORNEY REVIEW before launch. */}
              <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-[#bc9863]/25 bg-[#bc9863]/[0.05] px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={withdrawalWaiver}
                  onChange={(e) => setWithdrawalWaiver(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#bc9863]"
                />
                <span className="text-[12px] leading-relaxed text-[#8b8f99]">
                  I request immediate access to the Service and acknowledge that, once it begins, I lose my right of
                  withdrawal.
                </span>
              </label>

              {/* G4.2 required consent, verbatim (preserved from the legal gate) */}
              <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-white/10 bg-black/40 px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#bc9863]"
                />
                <span className="text-[12px] leading-relaxed text-[#8b8f99]">
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-[#e7cfa3] underline hover:text-[#f4efe6]">
                    Terms of Service
                  </Link>
                  ,{' '}
                  <Link href="/privacy" target="_blank" className="text-[#e7cfa3] underline hover:text-[#f4efe6]">
                    Privacy Policy
                  </Link>
                  ,{' '}
                  <Link href="/refunds" target="_blank" className="text-[#e7cfa3] underline hover:text-[#f4efe6]">
                    Refund &amp; Cancellation Policy
                  </Link>{' '}
                  and{' '}
                  <Link href="/acceptable-use" target="_blank" className="text-[#e7cfa3] underline hover:text-[#f4efe6]">
                    Acceptable Use Policy
                  </Link>
                  , including automatic renewal.
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-white/8 px-6 py-4 sm:flex-row-reverse">
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!allRead}
              className="inline-flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-5 py-3 text-[14px] font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {allRead ? 'Continue' : `Read all four to continue (${LEGAL_DOCS.filter((d) => readDocs[d.id]).length}/4)`}
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={() => void confirm()}
              disabled={!allChecked || busy}
              className="inline-flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-5 py-3 text-[14px] font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Recording consent…' : 'Continue to secure checkout'}
            </button>
          )}
          <button
            onClick={step === 1 ? onCancel : () => setStep(1)}
            className="inline-flex min-h-[46px] cursor-pointer items-center justify-center rounded-xl border border-white/12 px-5 py-3 text-[14px] font-semibold text-[#cfcabf] transition hover:border-[#bc9863] hover:text-[#e7cfa3]"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
        </div>
      </div>
    </div>
  );
}
