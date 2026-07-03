'use client';

/**
 * PricingView - the /pricing experience.
 *   - VISITOR (not paid): base plans + storage top-ups shown as a "later" suggestion.
 *   - MEMBER (already paid): base plans hidden, current plan summary + buyable
 *     top-up blocks shown instead.
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
import { Check, ShieldCheck, ArrowRight, Plus, Archive, Hourglass, Loader2, AlertTriangle } from 'lucide-react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { isSupabaseConfigured, IS_PROD } from '@/lib/access';
import { TIERS, EXTENSIONS, PRICING_SCOPE_NOTE, PRICE_LOCK_NOTE, findTier, type Cycle, type Tier } from '@/lib/plans';

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

      {isMember ? <MemberView tier={currentTier} /> : <VisitorPlans cycle={cycle} setCycle={setCycle} busyId={busyId} onCheckout={startCheckout} />}

      <Extensions member={isMember} busyId={busyId} onCheckout={startCheckout} />

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

/* ── visitor: full plans ── */
function VisitorPlans({ cycle, setCycle, busyId, onCheckout }: { cycle: Cycle; setCycle: (c: Cycle) => void; busyId: string | null; onCheckout: CheckoutFn }) {
  const reduce = useReducedMotion();
  return (
    <div>
      {/* Category positioning: flat software fee vs expiring-credit subscriptions. */}
      <div className="mx-auto mb-8 max-w-xl text-center">
        <p className="text-[15px] leading-relaxed text-[#8b8f99]">
          A low flat fee for the software. Compute runs on your own fal.ai key at fal&apos;s own rate, with no markup from us. No expiring credits, no wasted budget.
        </p>
      </div>

      {/* Beta price lock — the strongest cold-traffic reason to subscribe NOW. */}
      <div className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full border border-[#bc9863]/40 bg-[#bc9863]/10 px-5 py-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#bc9863]" aria-hidden />
        <p className="font-mono text-[12px] tracking-[0.08em] text-[#e7cfa3]">{PRICE_LOCK_NOTE}</p>
      </div>

      {/* ── WEDGE MATH — one identical render, two ways to pay for it ── */}
      <section id="wedge-math" className="mx-auto mb-12 max-w-3xl scroll-mt-24">
        <h3 className="mb-5 text-center font-[family-name:var(--font-sora)] text-[clamp(1.4rem,3vw,1.9rem)] font-bold tracking-[-0.02em]">
          Do the math <span className="text-[#bc9863]">yourself.</span>
        </h3>
        <p className="mx-auto mb-6 max-w-lg text-center text-[13.5px] leading-relaxed text-[#8b8f99]">
          One identical render: a 5 second, 720p Seedance 2.0 clip.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="glass rounded-2xl p-6">
            <div className="mb-3 font-mono text-[11px] tracking-[0.2em] text-[#8b909e] uppercase">Typical credit platform</div>
            {/* TODO — VERIFY BEFORE LAUNCH, DO NOT FABRICATE: replace the range
                below with a current, defensible effective-cost calculation
                (mid-tier credit pack price divided by the credits that class of
                video model consumes per clip). */}
            <p className="font-[family-name:var(--font-sora)] text-[1.7rem] font-bold text-[#f4efe6]">
              $2.50 to $5.00 <span className="text-[0.85rem] font-normal text-[#8b8f99]">per clip, effective</span>
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-[#8b8f99]">
              What that clip typically costs once you divide a mid-tier credit pack by the credits premium video
              models consume.
            </p>
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-[#8b909e]">
              Credit prices vary by platform and pack size, and unused credits often expire.
            </p>
          </div>
          <div className="glass glass-gold rounded-2xl border border-[#bc9863]/35 p-6">
            <div className="mb-3 font-mono text-[11px] tracking-[0.2em] text-[#e7cfa3] uppercase">CMA Studio</div>
            <p className="font-[family-name:var(--font-sora)] text-[1.7rem] font-bold text-[#f4efe6]">
              about $1.50 <span className="text-[0.85rem] font-normal text-[#8b8f99]">at fal&apos;s published rate</span>
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-[#cfcabf]">
              Plus your flat CMA fee, no markup, no expiring credits.
            </p>
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-[#8b909e]">
              fal bills you directly. We never touch your compute money.
            </p>
          </div>
        </div>
        <p className="mt-5 text-center font-[family-name:var(--font-sora)] text-[1.05rem] font-semibold text-[#e7cfa3]">
          Same model. Same output. You keep the difference.
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
            <span className="relative">{c === 'yearly' ? 'Yearly · up to $10/mo off' : 'Monthly'}</span>
          </button>
        ))}
      </div>

      {/* legal-safety scope line: prices cover today's toolset, never a forever promise */}
      <p className="mx-auto mb-12 max-w-md text-center font-mono text-[10px] leading-relaxed tracking-[0.08em] text-[#8b909e]">
        {PRICING_SCOPE_NOTE}
      </p>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
        {TIERS.map((t) => (
          <TierCard key={t.id} tier={t} cycle={cycle} busyId={busyId} onCheckout={onCheckout} />
        ))}
      </div>

      {/* ── objection-killer strip: the 3 questions cold traffic actually has,
          answered where the buying decision happens ── */}
      <section className="mx-auto mt-12 max-w-3xl">
        <h3 className="mb-5 text-center font-[family-name:var(--font-sora)] text-[1.2rem] font-semibold text-[#f4efe6]">
          Before you decide
        </h3>
        <div className="flex flex-col gap-3">
          {[
            {
              q: 'What counts as a DP-engine generation?',
              a: 'One engine call. Each time the DP engine composes or recomposes a prompt for you, that is one generation. Raw renders on your own key are never counted.',
            },
            {
              q: 'Why is this cheaper than credit platforms?',
              a: 'Because we do not resell compute. You pay fal directly at their published rates. Our fee covers the studio, the DP engine, and your render library. Our margin does not depend on marking up your renders.',
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
        Yearly plans carry a 14-day money-back guarantee.
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
        /* Not checkout-able yet (no Stripe price in lib/billing.ts) - a real
           checkout call would 400, so this stays a quiet disabled button. */
        <button
          disabled
          aria-disabled="true"
          className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-[#8b909e]"
        >
          <Hourglass size={15} /> {tier.cta}
        </button>
      )}
      <p className="mt-3 text-center font-mono text-[10px] text-[#8b909e]">{tier.note}</p>
    </div>
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
        <p className="mt-4 text-sm text-[#8b8f99]">Want your renders kept longer? Add a top-up below, no plan change, cancel anytime.</p>
        <Link href="/studio" className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-6 py-3 text-sm font-semibold text-black transition hover:brightness-105">
          Open CMA Studio <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

/* ── storage top-ups - suggestion for visitors, buyable for members ── */
function Extensions({ member, busyId, onCheckout }: { member: boolean; busyId: string | null; onCheckout: CheckoutFn }) {
  return (
    <div className="mt-16">
      <div className="mb-8 text-center">
        <div className="mb-3 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">{member ? 'Top up your plan' : 'Top-ups for later'}</div>
        <h3 className="font-[family-name:var(--font-sora)] text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.02em]">{member ? 'Extend your storage window' : 'Need more room? Top up anytime.'}</h3>
        {!member && <p className="mx-auto mt-3 max-w-md text-sm text-[#8b8f99]">Once you&apos;re on a plan, you can stack a monthly storage top-up for extra headroom, no upgrade required.</p>}
      </div>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        {EXTENSIONS.map((e) => {
          const id = `ext-${e.id}`;
          const busy = busyId === id;
          return (
            <div key={e.id} className={`glass relative flex flex-col rounded-2xl p-6 transition ${member ? 'glass-gold' : 'opacity-70'}`}>
              {!member && <span className="absolute right-4 top-4 rounded border border-white/15 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.14em] text-[#8b8f99] uppercase">on a plan</span>}
              <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-[#bc9863] uppercase">
                <Plus size={13} /> {e.name}
              </div>
              <div className="mt-3 flex items-end gap-1.5">
                <span className="font-[family-name:var(--font-sora)] text-3xl font-bold tracking-[-0.03em]">{e.price}</span>
                <span className="mb-1 font-mono text-[11px] text-[#8b8f99]">/mo</span>
              </div>
              <p className="mt-2 text-sm text-[#8b8f99]">{e.blurb}</p>
              <div className="mt-3 rounded-lg border border-[#bc9863]/15 bg-[#bc9863]/5 px-3 py-2 font-mono text-[10.5px] text-[#e7cfa3]">{e.detail}</div>
              <button
                disabled={!member || busy}
                onClick={() => member && onCheckout({ kind: 'extension', extensionId: e.id }, id)}
                className={`mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  member ? 'cursor-pointer bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] text-black hover:brightness-105 disabled:opacity-60' : 'cursor-not-allowed border border-white/10 text-[#8b909e]'
                }`}
              >
                {busy && <Loader2 size={15} className="animate-spin" />}
                {member ? 'Add top-up' : 'Available on a plan'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
