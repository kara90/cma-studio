'use client';

/**
 * UnlockForm — the beta access-code entry. POSTs to /api/unlock; on success the
 * server sets the httpOnly beta cookie and we navigate to the requested page
 * (sanitized) with a full reload so the proxy sees the new cookie.
 */
import { useState } from 'react';
import { KeyRound, ArrowRight, AlertTriangle } from 'lucide-react';
import { safeNext } from '@/lib/betaGate';

export function UnlockForm({ next }: { next: string }) {
  const [password, setPassword] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'busy' || !password) return;
    setState('busy');
    setError('');
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        // Full navigation so the proxy re-runs with the fresh cookie.
        window.location.assign(safeNext(next));
      } else {
        setState('error');
        setError(data.error ?? 'That access code is not right.');
      }
    } catch {
      setState('error');
      setError('Could not reach the server. Try again.');
    }
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="relative">
        <KeyRound size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b909e]" />
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (state === 'error') setState('idle');
          }}
          placeholder="Access code"
          autoFocus
          autoComplete="off"
          aria-label="Beta access code"
          className="w-full rounded-xl border border-white/12 bg-black/50 py-3.5 pl-10 pr-4 text-[15px] text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
        />
      </div>
      <button
        type="submit"
        disabled={state === 'busy' || !password}
        className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-5 py-3.5 text-[15px] font-semibold text-black shadow-[0_10px_30px_rgba(188,152,99,0.3)] transition hover:brightness-105 disabled:opacity-50"
      >
        {state === 'busy' ? 'Checking…' : 'Enter the studio'} <ArrowRight size={16} />
      </button>
      {state === 'error' && (
        <p role="alert" className="mt-3 flex items-center justify-center gap-2 font-mono text-[12px] text-red-400">
          <AlertTriangle size={13} /> {error}
        </p>
      )}
    </form>
  );
}
