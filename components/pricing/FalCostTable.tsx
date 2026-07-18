'use client';

/**
 * FalCostTable — the expandable "What rendering costs on your own key" section
 * on /pricing. SEPARATE from the plan allowance on purpose: the CMA fee is the
 * software; compute is billed by fal.ai directly to the user, at fal's rate,
 * with no markup from CMA.
 *
 * Rates come from lib/falRates.ts (one editable place + visible as-of date).
 * Everything here is INDICATIVE ONLY — the disclaimer and the live link to
 * fal's official pricing page are part of the component, not optional copy.
 */
import { useState } from 'react';
import { ChevronDown, ExternalLink, Film, Image as ImageIcon } from 'lucide-react';
import { FAL_RATES, RATES_AS_OF, FAL_PRICING_URL } from '@/lib/falRates';

export function FalCostTable() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mx-auto mt-14 max-w-3xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="glass flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition hover:border-[#bc9863]/40"
      >
        <span>
          <span className="block font-[family-name:var(--font-sora)] text-[15.5px] font-semibold text-[#f4efe6]">
            What rendering costs on your own key
          </span>
          <span className="mt-0.5 block text-[12.5px] text-[#8b909e]">
            Indicative fal.ai rates for the models people use most. Billed by fal, not by us.
          </span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-[#bc9863] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="glass mt-2 rounded-2xl p-5">
          <ul className="flex flex-col">
            {FAL_RATES.map((r) => (
              <li
                key={r.model}
                className="flex items-center justify-between gap-3 border-b border-white/5 py-3 last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {r.kind === 'video' ? (
                    <Film size={15} className="shrink-0 text-[#bc9863]" />
                  ) : (
                    <ImageIcon size={15} className="shrink-0 text-[#bc9863]" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-[#f4efe6]">{r.model}</span>
                    <span className="block font-mono text-[10.5px] text-[#8b909e]">{r.unit}</span>
                  </span>
                </span>
                <span className="flex-none font-mono text-[13px] text-[#e7cfa3]">{r.approx}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-xl border border-white/8 bg-black/30 p-3.5">
            <p className="text-[11.5px] leading-relaxed text-[#8b909e]">
              <span className="font-semibold text-[#c7c2b8]">Indicative pricing, for information only.</span> These
              figures are approximate, set entirely by fal.ai, and may change at any time without notice to us. They
              are not a quote or a guarantee. Compute is billed by fal.ai directly to your own fal account at
              fal&apos;s current rate, with no markup from CMA, and is separate from the CMA software fee. Inside the
              generators, the current estimated cost for your selected model and settings is shown live before you
              generate, based on fal&apos;s current rate for your own account — also an estimate, never a quote.
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] text-[#8b909e]">
              <span>Rates as of {RATES_AS_OF}</span>
              <a
                href={FAL_PRICING_URL}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-[#bc9863] transition hover:text-[#e7cfa3]"
              >
                Current rates on fal.ai <ExternalLink size={11} />
              </a>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
