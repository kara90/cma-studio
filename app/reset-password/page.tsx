'use client';

/**
 * app/reset-password/page.tsx — landing page for the Supabase password-recovery
 * email link. The link carries a one-time recovery code; the browser client
 * (@supabase/ssr, detectSessionInUrl) exchanges it for a temporary session on
 * load, after which updateUser({ password }) sets the new password. Standard,
 * minimal Supabase flow — no custom token handling of our own.
 *
 * Ops note: this URL must be allowlisted in Supabase → Auth → URL
 * Configuration → Redirect URLs (https://cinemasterstudio.com/reset-password).
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShieldCheck, AlertTriangle, Check } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/access';

type Stage = 'checking' | 'ready' | 'invalid' | 'done';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [stage, setStage] = useState<Stage>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStage('invalid');
      return;
    }
    let active = true;
    // The recovery code in the URL is exchanged automatically by the client;
    // poll briefly for the resulting session instead of racing it.
    const started = Date.now();
    const tick = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        setStage('ready');
        return;
      }
      if (Date.now() - started > 8000) {
        setStage('invalid');
        return;
      }
      setTimeout(tick, 400);
    };
    void tick();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('The new password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const { error: e1 } = await supabase.auth.updateUser({ password });
      if (e1) throw e1;
      setStage('done');
      setTimeout(() => router.replace('/login'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the password. Request a new link and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5">
      <div
        className="pointer-events-none absolute -top-1/4 left-1/2 h-[60vw] w-[60vw] -translate-x-1/2 rounded-full opacity-40 blur-[100px]"
        style={{ background: 'radial-gradient(circle, rgba(188,152,99,0.4), transparent 62%)' }}
      />
      <div className="relative w-full max-w-[420px]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <Logo size={42} />
          <span className="font-[family-name:var(--font-sora)] text-xl font-semibold tracking-[-0.01em]">CMA Studio</span>
        </Link>

        <div className="glass glass-gold rounded-2xl p-7">
          <div className="mb-6 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#bc9863]/25 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-[#bc9863] uppercase">
              <ShieldCheck size={12} /> Account recovery
            </div>
            <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold">Set a new password</h1>
          </div>

          {stage === 'checking' && (
            <p className="flex items-center justify-center gap-2 py-6 font-mono text-[12px] text-[#8b8f99]">
              <Loader2 size={15} className="animate-spin" /> Verifying your reset link…
            </p>
          )}

          {stage === 'invalid' && (
            <div className="flex flex-col gap-4 py-2 text-center">
              <p className="rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-3.5 py-3 text-[12.5px] leading-relaxed text-amber-200/90">
                This reset link is invalid or has expired. Links are single-use and only work for a short time.
              </p>
              <Link href="/login" className="font-mono text-[12px] text-[#e7cfa3] underline underline-offset-2 hover:text-[#f4efe6]">
                Request a new link from the sign-in page →
              </Link>
            </div>
          )}

          {stage === 'ready' && (
            <form onSubmit={submit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-[0.18em] text-[#8b8f99] uppercase">New password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="rounded-lg border border-white/10 bg-black/50 px-3.5 py-3 text-sm text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-[0.18em] text-[#8b8f99] uppercase">Confirm new password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="rounded-lg border border-white/10 bg-black/50 px-3.5 py-3 text-sm text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
                />
              </label>

              {error && (
                <p className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/8 px-3 py-2 font-mono text-[11px] leading-relaxed text-red-300">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] py-3 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-60"
              >
                {busy && <Loader2 size={15} className="animate-spin" />}
                Save new password
              </button>
            </form>
          )}

          {stage === 'done' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-emerald-400 uppercase">
                <Check size={13} /> Password updated
              </span>
              <p className="text-[13px] text-[#8b8f99]">Taking you to the sign-in page…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
