'use client';

/**
 * CostEstimateChip — the live "≈ $X.XX · estimate, billed by fal" figure shown
 * BEFORE a render, in both the Studio and the general generators.
 *
 * Data path: POST /api/pricing with the user's own fal key (model IDS only —
 * slugs stay server-side) → fal's official pricing API → unit price →
 * lib/costEstimate math. Results are cached in-module for the session.
 *
 * Honest by construction:
 *  - labeled "estimate · billed by fal", never a quote;
 *  - no key or fetch failure → falls back to the model's static costHint
 *    (approximate wording) or renders nothing at all;
 *  - never blocks or delays the render flow — purely informational.
 */
import { useEffect, useState } from 'react';
import { findModel } from '@/lib/modelRegistry';
import { computeEstimate, type LivePrice } from '@/lib/costEstimate';

/** Session-scoped price cache: modelId → LivePrice (or null = known-failed). */
const priceCache = new Map<string, LivePrice | null>();
const inflight = new Map<string, Promise<LivePrice | null>>();

async function fetchPrice(modelId: string, falKey: string): Promise<LivePrice | null> {
  const cached = priceCache.get(modelId);
  if (cached !== undefined) return cached;
  const running = inflight.get(modelId);
  if (running) return running;
  const p = (async () => {
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userApiKey: falKey, models: [modelId] }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { ok?: boolean; prices?: Record<string, LivePrice> };
      return data.ok ? (data.prices?.[modelId] ?? null) : null;
    } catch {
      return null;
    } finally {
      inflight.delete(modelId);
    }
  })();
  inflight.set(modelId, p);
  const result = await p;
  priceCache.set(modelId, result);
  return result;
}

export function CostEstimateChip({
  modelId,
  falKey,
  durationSeconds,
  fallback = null,
  className = '',
}: {
  modelId: string;
  /** the user's fal key from the vault; empty = no live fetch, fallback only */
  falKey: string;
  /** selected clip length in seconds, when the surrounding UI knows it */
  durationSeconds?: number;
  /** rendered when neither a live price nor a static costHint exists */
  fallback?: React.ReactNode;
  className?: string;
}) {
  const [price, setPrice] = useState<LivePrice | null>(null);

  useEffect(() => {
    setPrice(null);
    if (!modelId || !falKey || falKey.length < 8) return;
    let active = true;
    void fetchPrice(modelId, falKey).then((p) => {
      if (active) setPrice(p);
    });
    return () => {
      active = false;
    };
  }, [modelId, falKey]);

  const model = findModel(modelId);

  if (price) {
    const est = computeEstimate(price, { durationSeconds });
    return (
      <span className={`inline-flex items-baseline gap-1.5 font-mono text-[10.5px] text-[#e7cfa3] ${className}`}>
        {est.text}
        <span className="text-[#8b909e]">· estimate, billed by fal</span>
      </span>
    );
  }
  // Fallback: the static approximate hint (already worded as an estimate).
  if (model?.costHint) {
    return (
      <span className={`inline-flex items-baseline gap-1.5 font-mono text-[10.5px] text-[#8b909e] ${className}`}>
        {model.costHint} <span>· billed by fal</span>
      </span>
    );
  }
  return <>{fallback}</>;
}
