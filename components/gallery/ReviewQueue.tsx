'use client';

/**
 * ReviewQueue — OWNER-ONLY approval console for community submissions.
 *
 * ⚠ TEMPORARY GATE: unlocked with the OWNER_REVIEW_KEY secret (checked
 * server-side on every request; the key itself is only held in this tab's
 * sessionStorage). Final owner authentication ships with the accounts pass.
 */
import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Check, X, RefreshCw, AlertTriangle } from 'lucide-react';
import type { GalleryEntry } from '@/lib/platformStore';
import { GALLERY_CATEGORIES, entryCategory, type GalleryCategoryId } from '@/lib/galleryCategories';

const KEY_STORAGE = 'cma_owner_review_key';

export function ReviewQueue() {
  const [ownerKey, setOwnerKey] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  /** per-entry category override (owner assigns/confirms before approving) */
  const [catPick, setCatPick] = useState<Record<string, GalleryCategoryId>>({});

  const load = useCallback(async (key: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/gallery/queue', { headers: { 'x-owner-key': key } });
      const data = (await res.json()) as { ok: boolean; entries?: GalleryEntry[]; error?: string };
      if (data.ok) {
        setUnlocked(true);
        setEntries(data.entries ?? []);
        window.sessionStorage.setItem(KEY_STORAGE, key);
      } else {
        setUnlocked(false);
        setError(data.error ?? 'Owner key rejected.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-unlock silently if the key is already in this tab's session.
  useEffect(() => {
    const stored = window.sessionStorage.getItem(KEY_STORAGE);
    if (stored) {
      setOwnerKey(stored);
      void load(stored);
    }
  }, [load]);

  async function review(id: string, action: 'approve' | 'reject', category?: GalleryCategoryId) {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch('/api/gallery/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-owner-key': ownerKey },
        body: JSON.stringify({ id, action, category }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) setEntries((prev) => prev.filter((e) => e.id !== id));
      else setError(data.error ?? 'Review failed.');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusyId(null);
    }
  }

  if (!unlocked) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load(ownerKey);
        }}
        className="glass glass-gold mx-auto max-w-md rounded-2xl p-6 text-center"
      >
        <ShieldCheck size={22} className="mx-auto mb-3 text-[#bc9863]" />
        <p className="mb-1 font-[family-name:var(--font-sora)] text-[15px] font-semibold text-[#e7cfa3]">Owner review queue</p>
        <p className="mx-auto mb-4 max-w-xs text-[12px] leading-relaxed text-[#8b909e]">
          Temporary gate: enter the owner review key. Real owner sign-in arrives with the accounts pass.
        </p>
        <input
          type="password"
          value={ownerKey}
          onChange={(e) => setOwnerKey(e.target.value)}
          placeholder="Owner review key"
          aria-label="Owner review key"
          className="mb-3 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-center font-mono text-[13px] text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
        />
        <button
          type="submit"
          disabled={loading || !ownerKey}
          className="w-full cursor-pointer rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-5 py-3 text-[14px] font-semibold text-black transition hover:brightness-105 disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Unlock queue'}
        </button>
        {error && (
          <p role="alert" className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[11px] text-red-400">
            <AlertTriangle size={12} /> {error}
          </p>
        )}
      </form>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="font-mono text-[12px] text-[#8b909e]">
          {entries.length === 0 ? 'Queue is clear.' : `${entries.length} awaiting review`}
        </p>
        <button
          type="button"
          onClick={() => void load(ownerKey)}
          disabled={loading}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 font-mono text-[11px] text-[#c7c2b8] transition hover:border-[#bc9863]/40 hover:text-[#e7cfa3] disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {entries.length === 0 && !loading && (
        <div className="glass rounded-2xl px-6 py-12 text-center text-[14px] text-[#8b909e]">
          Nothing waiting. New submissions land here for your approve / reject call.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((e) => (
          <div key={e.id} className="overflow-hidden rounded-xl border border-white/8 bg-black/40">
            <div className="aspect-video overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.thumb} alt={e.title} className="h-full w-full object-cover" />
            </div>
            <div className="p-3.5">
              <p className="truncate text-[13.5px] font-medium text-[#f4efe6]">{e.title}</p>
              <p className="mt-0.5 truncate font-mono text-[10.5px] text-[#8b909e]">
                {e.name} · {new Date(e.submittedAt).toLocaleString()}
              </p>
              {e.url && (
                <a href={e.url} target="_blank" rel="noopener nofollow" className="mt-1 block truncate font-mono text-[10.5px] text-[#bc9863] hover:text-[#e7cfa3]">
                  {e.url}
                </a>
              )}
              {/* assign/confirm the model category — the pick travels with Approve */}
              <label className="mt-2.5 block">
                <span className="mb-1 block font-mono text-[9px] tracking-[0.16em] text-[#8b909e] uppercase">
                  Model category
                </span>
                <select
                  value={catPick[e.id] ?? entryCategory(e)}
                  onChange={(ev) => setCatPick((prev) => ({ ...prev, [e.id]: ev.target.value as GalleryCategoryId }))}
                  className="w-full cursor-pointer rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 font-mono text-[11px] text-[#e7cfa3] outline-none transition focus:border-[#bc9863]"
                >
                  {GALLERY_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void review(e.id, 'approve', catPick[e.id] ?? entryCategory(e))}
                  disabled={busyId === e.id}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-3 py-2 text-[12.5px] font-semibold text-black transition hover:brightness-105 disabled:opacity-50"
                >
                  <Check size={14} /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => void review(e.id, 'reject')}
                  disabled={busyId === e.id}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-2 text-[12.5px] font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  <X size={14} /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 flex items-center justify-center gap-1.5 font-mono text-[11px] text-red-400">
          <AlertTriangle size={12} /> {error}
        </p>
      )}
    </div>
  );
}
