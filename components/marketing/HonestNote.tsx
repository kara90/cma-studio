import { Info } from 'lucide-react';

/**
 * HonestNote — a small reusable honest-expectations strip. Drop it under a CTA,
 * a pricing table, or the studio panel. compact mode drops the card chrome.
 */

// Sebastien's expectation-setting rule: the error margin belongs to the AI
// models, not the studio — say it plainly so nobody expects a perfect render
// every single time, in Auto or Manual alike.
const NOTE =
  'Even a perfectly engineered prompt cannot fully control an AI model: every model carries its own error margin, so a render can occasionally miss, drift or be declined — in Auto or Manual alike. That is a limit of today’s AI models, not of the studio. CMA Studio is tuned to get it right in fewer tries; no tool can honestly promise a perfect output every time. Some content, such as prohibited material or real public figures, is blocked by the models themselves.';

export function HonestNote({ className, compact = false }: { className?: string; compact?: boolean }) {
  if (compact) {
    return (
      <p className={`flex items-start gap-2 text-[12px] leading-relaxed text-[#8b909e] ${className ?? ''}`}>
        <Info size={13} className="mt-0.5 shrink-0 text-[#bc9863]" />
        <span>{NOTE}</span>
      </p>
    );
  }
  return (
    <div
      className={`glass flex items-start gap-3 rounded-2xl border-[#bc9863]/18 px-5 py-4 ${className ?? ''}`}
    >
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[#bc9863]/25 bg-[#bc9863]/8 text-[#bc9863]">
        <Info size={14} />
      </span>
      <p className="text-[13px] leading-relaxed text-[#8b8f99]">{NOTE}</p>
    </div>
  );
}
