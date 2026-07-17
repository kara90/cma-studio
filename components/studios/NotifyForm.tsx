'use client';

/**
 * NotifyForm — launch-notify email capture for the preview studios (and any
 * other "tell me when it opens" spot). Posts {email, source} to /api/notify;
 * nothing else is collected.
 */
import { useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { track } from '@/lib/track';

export function NotifyForm({
  source,
  title,
  note,
}: {
  source: 'marketing' | 'real-estate' | 'general';
  title: string;
  note: string;
}) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'busy' || state === 'done') return;
    setState('busy');
    setError('');
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setState('done');
        track('signup_intent');
      } else {
        setState('error');
        setError(data.error ?? 'Could not save your email. Try again.');
      }
    } catch {
      setState('error');
      setError('Could not reach the server. Try again.');
    }
  }

  return (
    <div className="glass glass-gold rounded-2xl p-5 text-center">
      <div className="mb-1 font-[family-name:var(--font-sora)] text-[15px] font-semibold text-[#e7cfa3]">{title}</div>
      <p className="mx-auto mb-4 max-w-sm text-[12.5px] leading-relaxed text-[#8b909e]">{note}</p>
      {state === 'done' ? (
        <p className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-2.5 text-[13.5px] font-medium text-emerald-300">
          <Check size={15} /> You&apos;re on the list.
        </p>
      ) : (
        <form onSubmit={submit} className="mx-auto flex max-w-sm gap-2">
          <label htmlFor={`notify-${source}`} className="sr-only">
            Email address
          </label>
          <input
            id={`notify-${source}`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.com"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-[14px] text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
          />
          <button
            type="submit"
            disabled={state === 'busy'}
            className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-4 py-2.5 text-[13.5px] font-semibold text-black transition hover:brightness-105 disabled:opacity-50"
          >
            <Mail size={14} /> {state === 'busy' ? 'Saving…' : 'Notify me'}
          </button>
        </form>
      )}
      {state === 'error' && <p className="mt-2.5 font-mono text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
