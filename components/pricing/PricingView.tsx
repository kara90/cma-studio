'use client';

/**
 * PricingView - the /pricing experience.
 *   - VISITOR (not paid): the three base plans.
 *   - MEMBER (already paid): base plans hidden, current plan summary instead.
 * Storage top-ups were REMOVED (consolidated finalize pass): they were sold but
 * never honored by the retention logic, so nothing may sell one. Retention is
 * tier-based only.
 * Buying starts a real Stripe Checkout via /api/checkout (price resolved
 * server-side). Membership is read from the authenticated user's entitlement
 * (app_metadata.cma_plan). A dev-only preview switch lets you see both states.
 *
 * NOTE: all prices/retention windows come from lib/plans.ts and are
 * PLACEHOLDERS until Sebastien finalizes them (hence PRICING_SCOPE_NOTE,
 * the microcopy line under the billing toggle).
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ShieldCheck, ArrowRight, Archive, Hourglass, Loader2, AlertTriangle } from 'lucide-react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { isSupabaseConfigured, IS_PROD } from '@/lib/access';
import { TIERS, PRICING_SCOPE_NOTE, PRICE_LOCK_NOTE, findTier, type Cycle, type Tier } from '@/lib/plans';
import { TERMS_VERSION } from '@/lib/legal';
import { track } from '@/lib/track';
import { FalCostTable } from '@/components/pricing/FalCostTable';
import { EnrollmentGate } from '@/components/pricing/EnrollmentGate';
import { LEGAL_DOCS } from '@/lib/legal';

type PlanMeta = { tier?: string; status?: string; expires?: string } | undefined;

// Mirrors the SERVER's isPlanActive exactly (lib/authGuard.ts) so this page
// never shows "you're a member" to a user the API would still 402.
function planIsActive(p: PlanMeta): boolean {
  if (!p || typeof p !== 'object') return false;
  if (p.status !== 'active' && p.status !== 'trialing') return false;
  if (p.expires) return Date.parse(p.expires) > Date.now();
  return true;
}

export function PricingView() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [cycle, setCycle] = useState<Cycle>('yearly');
  const [realPlan, setRealPlan] = useState<string | null>(null);
  const [preview, setPreview] = useState<'auto' | 'visitor' | 'member'>('auto');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Checkout consent gate (G4.1 / G4.2): a purchase click opens this with the
  // plan disclosures + the required consent checkbox before any checkout fires.
  const [pending, setPending] = useState<PendingCheckout | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const p = (data.user?.app_metadata as { cma_plan?: PlanMeta } | undefined)?.cma_plan;
      if (planIsActive(p)) setRealPlan(p?.tier ?? 'pro');
    });
    return () => {
      active = false;
    };
  }, [supabase]);

  // Intercept every pay button: derive the disclosures and open the consent
  // gate. The real checkout only runs after the shopper confirms.
  function requestCheckout(payload: Record<string, unknown>, id: string) {
    track('subscribe_intent'); // first-party beacon, event name only
    setNotice(null);
    const t = findTier(String(payload.tier));
    const cyc: Cycle = payload.cycle === 'monthly' ? 'monthly' : 'yearly';
    const name = t?.name ?? 'Plan';
    const price = t?.price[cyc] ?? '';
    const frequency = cyc === 'yearly' ? 'per month, billed yearly' : 'per month, billed monthly';
    setPending({ payload, id, name, price, frequency });
  }

  function confirmCheckout(consentLogId: string | null) {
    if (!pending) return;
    const withConsent = {
      ...pending.payload,
      consent: true,
      consent_at: new Date().toISOString(),
      consent_version: TERMS_VERSION,
      // enrollment-gate proof: the KV consent record + the exact doc versions read
      consent_log_id: consentLogId ?? undefined,
      consent_docs: LEGAL_DOCS.map((d) => `${d.id}@${d.version}`).join(','),
    };
    const id = pending.id;
    setPending(null);
    void startCheckout(withConsent, id);
  }

  async function startCheckout(payload: Record<string, unknown>, id: string) {
    setNotice(null);
    setBusyId(id);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      if (!data.ok || !data.url) {
        setNotice(data.error ?? 'Checkout is not available yet.');
        setBusyId(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setNotice('Could not start checkout. Try again.');
      setBusyId(null);
    }
  }

  const isMember = preview === 'member' ? true : preview === 'visitor' ? false : Boolean(realPlan);
  const currentTier = findTier(preview === 'member' ? realPlan ?? 'pro' : realPlan) ?? TIERS[1];

  return (
    <div>
      {notice && (
        <p className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/8 px-4 py-2 font-mono text-[12px] text-amber-300">
          <AlertTriangle size={14} /> {notice}
        </p>
      )}

      {isMember ? <MemberView tier={currentTier} /> : <VisitorPlans cycle={cycle} setCycle={setCycle} busyId={busyId} onCheckout={requestCheckout} />}

      {/* Enrollment consent gate (Section H): scroll-through of all four legal
          documents + explicit clause checkboxes + consent logging. Supersedes
          the earlier single-checkbox modal; its G4 disclosures and verbatim
          consent text are preserved inside the gate. */}
      {pending && <EnrollmentGate pending={pending} onConfirm={confirmCheckout} onCancel={() => setPending(null)} />}

      {!IS_PROD && (
        <div className="mx-auto mt-14 flex w-fit items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/5 px-2 py-1.5">
          <span className="px-2 font-mono text-[9px] tracking-[0.16em] text-amber-400/80 uppercase">Preview</span>
          {(['auto', 'visitor', 'member'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setPreview(v)}
              className={`cursor-pointer rounded-full px-3 py-1 font-mono text-[10px] uppercase transition ${
                preview === v ? 'bg-amber-400/20 text-amber-300' : 'text-[#8b8f99] hover:text-amber-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type CheckoutFn = (payload: Record<string, unknown>, id: string) => void;

interface PendingCheckout {
  payload: Record<string, unknown>;
  id: string;
  name: string;
  price: string;
  frequency: string;
}

/* The single-checkbox CheckoutConsent modal was SUPERSEDED by the Section-H
 * EnrollmentGate (components/pricing/EnrollmentGate.tsx): scroll-through of all
 * four legal documents + explicit clause checkboxes + consent logging. Its G4.1
 * disclosures and the verbatim G4.2 consent text are preserved inside the gate,
 * so nothing from the original flow was lost. */

/* ── visitor: full plans ── */
function VisitorPlans({ cycle, setCycle, busyId, onCheckout }: { cycle: Cycle; setCycle: (c: Cycle) => void; busyId: string | null; onCheckout: CheckoutFn }) {
  const reduce = useReducedMotion();
  return (
    <div>
      {/* LEAD: the UNLIMITED convenience layer. The metered Cinematographer
          engine reads as a generous allowance on top, never the headline limit. */}
      <div className="mx-auto mb-8 max-w-xl text-center">
        <p className="text-[15px] leading-relaxed text-[#c7c2b8]">
          One flat fee, <span className="font-semibold text-[#e7cfa3]">unlimited use of the studio</span>: every
          generator, your key saved once, your library — all on your own fal.ai key at fal&apos;s own rate, with no
          markup from us.
        </p>
        <p className="mx-auto mt-3 max-w-lg text-[13px] leading-relaxed text-[#8b8f99]">
          Filmmaker and Pro unlock the <span className="text-[#e7cfa3]">complete studio</span>, built around the{' '}
          <span className="text-[#e7cfa3]">Cinematographer engine</span>: it composes real camera, lens, film-stock
          and lighting decisions into your prompt before a single unit of compute is spent, directed like a working
          Director of Photography would. A generous monthly allowance of directed generations sits on top of the
          unlimited layer.
        </p>
      </div>

      {/* Beta price lock — the strongest cold-traffic reason to subscribe NOW. */}
      <div className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full border border-[#bc9863]/40 bg-[#bc9863]/10 px-5 py-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#bc9863]" aria-hidden />
        <p className="font-mono text-[12px] tracking-[0.08em] text-[#e7cfa3]">{PRICE_LOCK_NOTE}</p>
      </div>

      {/* ── PAY-PER-USE vs EXPIRING-CREDITS — no per-clip price claim. The best
          models cost what they cost everywhere; the honest difference is no
          markup and nothing expiring, not a lower price per render. ── */}
      <section id="wedge-math" className="mx-auto mb-12 max-w-3xl scroll-mt-24">
        <h3 className="mb-4 text-center font-[family-name:var(--font-sora)] text-[clamp(1.4rem,3vw,1.9rem)] font-bold tracking-[-0.02em]">
          Same models. <span className="text-[#bc9863]">A fairer way to pay.</span>
        </h3>
        <p className="mx-auto mb-6 max-w-lg text-center text-[13.5px] leading-relaxed text-[#8b8f99]">
          The best models cost what they cost, everywhere. We just don&apos;t mark them up, and we never let your
          unused money disappear.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="glass rounded-2xl p-6">
            <div className="mb-3 font-mono text-[11px] tracking-[0.2em] text-[#8b909e] uppercase">Credit platforms</div>
            <p className="font-[family-name:var(--font-sora)] text-[1.4rem] font-bold text-[#f4efe6]">
              You pay up front, every month
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-[#8b8f99]">
              You buy a credit pack whether or not you create. Unused credits vanish at the end of the month, so most
              people end up paying for renders they never make.
            </p>
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-[#8b909e]">
              Prices and pack sizes vary by platform, and unused credits usually expire.
            </p>
          </div>
          <div className="glass glass-gold rounded-2xl border border-[#bc9863]/35 p-6">
            <div className="mb-3 font-mono text-[11px] tracking-[0.2em] text-[#e7cfa3] uppercase">CMA Studio</div>
            <p className="font-[family-name:var(--font-sora)] text-[1.4rem] font-bold text-[#f4efe6]">
              You pay only for what you render
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-[#cfcabf]">
              Compute is billed by fal.ai directly to you, at fal&apos;s real rate, with no markup from us — only when
              you actually render. Nothing expires, nothing is wasted.
            </p>
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-[#8b909e]">
              fal bills you directly. We never touch your compute money.
            </p>
          </div>
        </div>
        <p className="mt-5 text-center font-[family-name:var(--font-sora)] text-[1.05rem] font-semibold text-[#e7cfa3]">
          Same model. No markup. Nothing expires.
        </p>
      </section>

      <div className="glass mx-auto mb-4 flex w-fit items-center gap-1 rounded-full p-1">
        {(['yearly', 'monthly'] as Cycle[]).map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={`relative cursor-pointer rounded-full px-5 py-2 font-mono text-[11px] tracking-[0.14em] uppercase transition ${
              cycle === c ? 'text-black' : 'text-[#8b8f99] hover:text-[#e7cfa3]'
            }`}
          >
            {cycle === c && (
              <motion.span
                layoutId="cycle-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-b from-[#e7cfa3] to-[#bc9863]"
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{c === 'yearly' ? 'Yearly · two months free' : 'Monthly'}</span>
          </button>
        ))}
      </div>

      {/* billing terms, stated where the toggle is: matches the Refund Policy */}
      <p className="mx-auto mb-3 max-w-md text-center font-mono text-[10.5px] leading-relaxed tracking-[0.06em] text-[#8b909e]">
        Monthly: cancel anytime. Yearly: a one-year commitment, non-refundable.
      </p>

      {/* legal-safety scope line: prices cover today's toolset, never a forever promise */}
      <p className="mx-auto mb-12 max-w-md text-center font-mono text-[10px] leading-relaxed tracking-[0.08em] text-[#8b909e]">
        {PRICING_SCOPE_NOTE}
      </p>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
        {TIERS.map((t) => (
          <TierCard key={t.id} tier={t} cycle={cycle} busyId={busyId} onCheckout={onCheckout} />
        ))}
      </div>

      {/* "fair use", defined once in plain, friendly language (FIX 5) — its own
          clearly separated block so it always reads complete, never clipped. */}
      <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/10 bg-black/20 px-6 py-5 text-center">
        <div className="mb-1.5 font-mono text-[10px] tracking-[0.18em] text-[#bc9863] uppercase">
          What &ldquo;fair use&rdquo; means
        </div>
        <p className="text-[13px] leading-relaxed text-[#9a9ea8]">
          Your monthly Cinematographer allowance is for normal creative work by one person: your own projects, at a
          human pace. It is not for sharing one seat between multiple people, running bots or scripts, bulk rendering
          at machine speed, or reselling access. Use it the way a working creative would and you will never bump into
          it.
        </p>
      </div>

      {/* what compute actually costs on the user's own key — separate, indicative, disclaimed */}
      <FalCostTable />

      {/* ── objection-killer strip: the 3 questions cold traffic actually has,
          answered where the buying decision happens ── */}
      <section className="mx-auto mt-12 max-w-3xl">
        <h3 className="mb-5 text-center font-[family-name:var(--font-sora)] text-[1.2rem] font-semibold text-[#f4efe6]">
          Before you decide
        </h3>
        <div className="flex flex-col gap-3">
          {[
            {
              q: 'What counts as a Cinematographer generation?',
              a: 'One engine call. Each time the Cinematographer engine composes or recomposes a prompt for you, that is one generation. Raw renders on your own key are never counted.',
            },
            {
              q: 'Why does this cost less for most people?',
              a: 'Not because any single render is cheaper — the best models cost what they cost everywhere. It is because we do not mark up compute and nothing expires: you pay fal directly at their published rate, only when you actually render. On credit platforms you buy a pack whether you create or not, and unused credits vanish every month, so most people pay for renders they never make. Our margin is on the software, never on your renders.',
            },
            {
              q: 'What is a fal key and is it hard to set up?',
              a: 'It is a free account credential from fal.ai, the infrastructure our renders run on. Setup takes about five minutes once. Full walkthrough in the key guide.',
            },
          ].map((f) => (
            <div key={f.q} className="glass rounded-2xl p-5">
              <div className="mb-1.5 font-[family-name:var(--font-sora)] text-[14.5px] font-semibold text-[#e7cfa3]">{f.q}</div>
              <p className="text-[13.5px] leading-relaxed text-[#8b8f99]">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center">
          <Link href="/faq" className="font-mono text-[12px] tracking-[0.14em] text-[#bc9863] uppercase transition hover:text-[#e7cfa3]">
            See all questions →
          </Link>
        </p>
      </section>

      {/* founder student line — the price itself stays inside the course dashboard */}
      <p className="mx-auto mt-10 text-center font-mono text-[12px] tracking-[0.06em] text-[#8b909e]">
        CineMaster Academy students: your student rate is waiting inside your course dashboard.
      </p>

      {/* Clickwrap reaffirmation at the payment step (accounts already agreed
          at signup — this restates it where money changes hands). */}
      <p className="mx-auto mt-8 max-w-md text-center text-[12px] leading-relaxed text-[#8b909e]">
        By subscribing you agree to the{' '}
        <Link href="/terms" className="text-[#e7cfa3] underline hover:text-[#f4efe6]">
          Terms of Service
        </Link>
        ,{' '}
        <Link href="/privacy" className="text-[#e7cfa3] underline hover:text-[#f4efe6]">
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link href="/refunds" className="text-[#e7cfa3] underline hover:text-[#f4efe6]">
          Refund &amp; Cancellation Policy
        </Link>
        . Plans renew automatically until you cancel, and cancelling takes one click or one email. Your rate is
        locked while you stay subscribed; price changes apply to new subscribers only. Monthly plans cancel anytime.
        Yearly plans are a one-year commitment and are non-refundable.
      </p>
    </div>
  );
}

function TierCard({ tier, cycle, busyId, onCheckout }: { tier: Tier; cycle: Cycle; busyId: string | null; onCheckout: CheckoutFn }) {
  const id = `tier-${tier.id}`;
  const busy = busyId === id;
  return (
    <div
      id={tier.id}
      className={`relative flex scroll-mt-28 flex-col rounded-2xl p-7 transition ${tier.featured ? 'glass glass-gold border-[#bc9863] shadow-[0_30px_80px_-30px_rgba(188,152,99,0.4)]' : 'glass'}`}
    >
      {tier.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] text-black uppercase whitespace-nowrap">
          Most popular
        </span>
      )}
      <div className="font-mono text-[11px] tracking-[0.22em] text-[#bc9863] uppercase">{tier.name}</div>
      <div className="mt-4 flex items-end gap-1.5">
        <span className="font-[family-name:var(--font-sora)] text-4xl font-bold tracking-[-0.03em]">{tier.price[cycle]}</span>
        <span className="mb-1.5 font-mono text-[11px] text-[#8b8f99]">/mo{cycle === 'yearly' ? ' · billed yearly' : ''}</span>
      </div>
      {cycle === 'yearly' && <div className="mt-1.5 font-mono text-[10px] tracking-[0.06em] text-[#e7cfa3]">{tier.yearlySave}</div>}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#bc9863]/20 bg-[#bc9863]/6 px-3 py-2 font-mono text-[11px] text-[#e7cfa3]">
        <Archive size={13} className="shrink-0 text-[#bc9863]" /> {tier.retention}
      </div>
      <p className="mt-4 text-sm text-[#8b8f99]">{tier.blurb}</p>
      <ul className="mt-5 mb-7 flex flex-1 flex-col gap-3">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-[#cfcabf]">
            <Check size={16} className="mt-0.5 shrink-0 text-[#bc9863]" /> {f}
          </li>
        ))}
      </ul>
      {tier.checkout ? (
        <button
          onClick={() => onCheckout({ kind: 'tier', tier: tier.id, cycle }, id)}
          disabled={busy}
          className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${
            tier.featured ? 'bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] text-black hover:brightness-105' : 'border border-white/12 text-[#f4efe6] hover:border-[#bc9863] hover:text-[#e7cfa3]'
          }`}
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : tier.academy ? <ShieldCheck size={15} /> : null}
          {tier.cta}
          {!busy && <ArrowRight size={15} />}
        </button>
      ) : (
        /* Not checkout-able yet (no Stripe price in lib/billing.ts). Instead of
           a dead "Coming at launch" button, capture interested visitors on a
           waitlist so the top tier's demand isn't lost (FIX 6). */
        <ProWaitlist />
      )}
      {/* cycle-aware billing terms: monthly cancels anytime; yearly is a
          non-refundable one-year commitment (matches the Refund Policy —
          never "cancel anytime" on yearly). Hidden on the waitlist tier,
          which has its own copy. */}
      {tier.checkout && (
        <p className="mt-3 text-center font-mono text-[10px] leading-relaxed text-[#8b909e]">
          {tier.note}{' '}
          {cycle === 'yearly'
            ? 'One-year commitment, non-refundable.'
            : 'Cancel anytime.'}
        </p>
      )}
    </div>
  );
}

/* ── Pro-tier waitlist: compact email capture for the not-yet-purchasable top
   tier. Posts to /api/notify (source 'pro-waitlist'); reuses the same beacon
   as the studio launch-notify forms. No account needed. ── */
function ProWaitlist() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'busy' || state === 'done') return;
    setState('busy');
    setError('');
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'pro-waitlist' }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setState('done');
        track('subscribe_intent');
      } else {
        setState('error');
        setError(data.error ?? 'Could not join. Try again.');
      }
    } catch {
      setState('error');
      setError('Could not reach the server. Try again.');
    }
  }

  if (state === 'done') {
    return (
      <div className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/8 px-4 py-3 text-[13px] font-semibold text-emerald-300">
        <Check size={15} /> You&apos;re on the waitlist
      </div>
    );
  }

  return (
    <form onSubmit={join} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label htmlFor="pro-waitlist" className="sr-only">
          Email for the Pro waitlist
        </label>
        <input
          id="pro-waitlist"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-[13px] text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
        />
        <button
          type="submit"
          disabled={state === 'busy'}
          className="inline-flex flex-none min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#bc9863]/45 bg-[#bc9863]/10 px-4 text-[13px] font-semibold text-[#e7cfa3] transition hover:border-[#bc9863] hover:bg-[#bc9863]/16 disabled:opacity-50"
        >
          <Hourglass size={14} /> {state === 'busy' ? 'Joining…' : 'Join the waitlist'}
        </button>
      </div>
      <p className="text-center font-mono text-[10px] leading-relaxed text-[#8b909e]">
        {error || 'Pro opens at launch. Get first access the day it does.'}
      </p>
    </form>
  );
}

/* ── member: current plan summary ── */
function MemberView({ tier }: { tier: Tier }) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="glass glass-gold rounded-2xl p-7 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-emerald-400 uppercase">
          <Check size={12} /> Active plan
        </div>
        <h3 className="font-[family-name:var(--font-sora)] text-2xl font-bold">You&apos;re on {tier.name}</h3>
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#bc9863]/20 bg-[#bc9863]/6 px-3 py-2 font-mono text-[12px] text-[#e7cfa3]">
          <Archive size={14} className="shrink-0 text-[#bc9863]" /> {tier.retention}
        </div>
        <Link href="/studio" className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-6 py-3 text-sm font-semibold text-black transition hover:brightness-105">
          Open CMA Studio <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
