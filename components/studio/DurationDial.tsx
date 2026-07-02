'use client';

/**
 * DurationDial — the premium length control (Sebastien's "choose duration"
 * upgrade). A chip trigger opens an inline panel with a gold slider that snaps
 * to EXACTLY the values the selected model accepts on fal:
 *   • enum models (Seedance auto+4–15s, Kling 3 3–15s, Kling 2.x 5/10s,
 *     Veo 4/6/8s, Hailuo 6/10s) — the slider moves across the discrete stops;
 *   • numeric-range models (Stable Audio 1–190s, ACE-Step 5–240s) — free
 *     second-by-second control across the schema's real min/max.
 * Everything is driven by lib/modelCaps, so switching models automatically
 * re-ranges the dial — nothing to fetch, nothing to mismatch.
 */
import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Clock, ChevronDown } from 'lucide-react';
import { fmtDur, type ModelCaps } from '@/lib/modelCaps';

export function DurationDial({ caps, value, onChange }: {
  caps: ModelCaps;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  // Discrete stops (enum models). For numeric-range models the presets become
  // tick marks while the slider itself is free within [min, max].
  const stops = caps.durations;
  const range = caps.durationRange;

  // Canonical lengths BEYOND this model's ceiling, shown greyed so the user
  // sees "this model stops at Xs" instead of wondering where 15s went. The
  // slider itself never reaches them — unsupported seconds cannot be sent.
  const maxSeconds = stops.length ? Math.max(...stops.map((s) => parseInt(s, 10) || 0)) : 0;
  const lockedStops = range ? [] : ['5', '10', '15', '20'].filter((s) => Number(s) > maxSeconds);

  const stopIndex = useMemo(() => {
    const i = stops.indexOf(value);
    return i >= 0 ? i : Math.max(0, stops.indexOf(caps.durationDefault ?? stops[0]));
  }, [stops, value, caps.durationDefault]);

  const numericValue = useMemo(() => {
    const n = Number(value);
    if (range) return Number.isFinite(n) && n > 0 ? Math.min(range.max, Math.max(range.min, n)) : Number(caps.durationDefault ?? range.min);
    return 0;
  }, [value, range, caps.durationDefault]);

  if (!caps.durationParam || (stops.length === 0 && !range)) return null;

  const display = fmtDur(value || caps.durationDefault || '');

  return (
    <div>
      <div className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">Length</div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 transition sm:min-h-0 ${
          open ? 'border-[#bc9863] bg-[#bc9863]/12' : 'border-white/8 hover:border-[#bc9863]/40'
        }`}
      >
        <Clock size={13} className="text-[#bc9863]" />
        <span className="font-[family-name:var(--font-sora)] text-[14px] font-semibold text-[#f4efe6]">{display}</span>
        <ChevronDown size={13} className={`text-[#8b8f99] transition ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-[#bc9863]/25 bg-black/40 p-4">
              <div className="mb-3 flex items-end justify-between">
                <span className="font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">Choose duration</span>
                <span className="font-[family-name:var(--font-sora)] text-[22px] font-bold leading-none text-[#e7cfa3]">
                  {display}
                </span>
              </div>

              {range ? (
                // free numeric control, snapped to real schema bounds
                <>
                  <input
                    type="range"
                    min={range.min}
                    max={range.max}
                    step={1}
                    value={numericValue}
                    onChange={(e) => onChange(String(e.target.value))}
                    aria-label="Duration in seconds"
                    className="cma-range w-full cursor-pointer"
                  />
                  <div className="mt-2 flex justify-between font-mono text-[9px] tracking-[0.08em] text-[#8b909e]">
                    <span>{range.min}s</span>
                    <span>{range.max}s</span>
                  </div>
                </>
              ) : (
                // discrete stops — the slider snaps between exactly what fal accepts
                <>
                  <input
                    type="range"
                    min={0}
                    max={stops.length - 1}
                    step={1}
                    value={stopIndex}
                    onChange={(e) => onChange(stops[Number(e.target.value)])}
                    aria-label="Duration"
                    className="cma-range w-full cursor-pointer"
                  />
                  <div className="mt-2 flex justify-between">
                    {stops.map((s, i) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onChange(s)}
                        className={`cursor-pointer font-mono text-[9px] tracking-[0.04em] transition ${
                          i === stopIndex ? 'text-[#e7cfa3]' : 'text-[#8b909e] hover:text-[#c7c2b8]'
                        }`}
                      >
                        {fmtDur(s)}
                      </button>
                    ))}
                    {lockedStops.map((s) => (
                      <span
                        key={s}
                        title="Not supported by this model"
                        aria-disabled="true"
                        className="cursor-not-allowed font-mono text-[9px] tracking-[0.04em] text-[#575b64] line-through opacity-60"
                      >
                        {fmtDur(s)}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <p className="mt-3 font-mono text-[9px] leading-relaxed tracking-[0.04em] text-[#8b909e]">
                Longer runs use more compute on your fal key. The dial only offers what this model truly accepts.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
