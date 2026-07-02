'use client';

/**
 * app/login/page.tsx — student entrance firewall.
 * Supabase email/password auth. Non-academy accounts are signed straight back
 * out and blocked from the workspace (see isAcademyEmail).
 */
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Turnstile, type TurnstileHandle } from '@/components/Turnstile';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { isSupabaseConfigured, isAcademyEmail, hasActivePlan, IS_PROD } from '@/lib/access';
import { TERMS_VERSION } from '@/lib/legal';

type Mode = 'signin' | 'signup';

// Cloudflare Turnstile site key (public). In production it must be set as an env
// var; in dev we fall back to Cloudflare's always-pass TEST key so local login is
// never blocked. The token is verified server-side by Supabase (enable CAPTCHA in
// Supabase Auth → Attack Protection and paste the Turnstile SECRET there).
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? (IS_PROD ? '' : '1x00000000000000000000AA');

export default function LoginPage() {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const turnstileEnabled = Boolean(TURNSTILE_SITE_KEY);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!isSupabaseConfigured) {
      setError('Auth is not configured yet. Add Supabase keys to .env.local, or continue in dev mode below.');
      return;
    }
    if (!isAcademyEmail(email)) {
      setError('That email domain is not allowed on this workspace.');
      return;
    }

    if (mode === 'signup' && !agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy to create your account.');
      return;
    }
    if (turnstileEnabled && !captchaToken) {
      setError('Please complete the human-verification check.');
      return;
    }
    const captcha = captchaToken ?? undefined;

    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error: e1 } = await supabase.auth.signUp({
          email,
          password,
          options: {
            captchaToken: captcha,
            // Clickwrap record: WHEN they agreed and to WHICH version of the
            // documents. Stamped at account creation, kept on the account.
            data: { terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION },
          },
        });
        if (e1) throw e1;
        setNotice('Check your inbox to confirm your address, then sign in.');
        setMode('signin');
        return;
      }
      const { data, error: e2 } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken: captcha } });
      if (e2) throw e2;
      // Double-check the gate against the authenticated identity.
      if (!isAcademyEmail(data.user?.email)) {
        await supabase.auth.signOut();
        throw new Error('This account is not authorized for the academy workspace.');
      }
      // Hard paywall: only subscribers reach the studio; everyone else → pricing.
      router.replace(hasActivePlan(data.user?.app_metadata) ? '/studio' : '/pricing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
      // Turnstile tokens are single-use — clear + re-challenge after every attempt.
      setCaptchaToken(null);
      turnstileRef.current?.reset();
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5">
      {/* ambient gold leak */}
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
              <ShieldCheck size={12} /> Your account
            </div>
            <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold">
              {mode === 'signin' ? 'Enter the studio' : 'Create your account'}
            </h1>
            <p className="mt-2 text-sm text-[#8b8f99]">
              One account. Every model, your key, your library.
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] tracking-[0.18em] text-[#8b8f99] uppercase">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="rounded-lg border border-white/10 bg-black/50 px-3.5 py-3 text-sm text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] tracking-[0.18em] text-[#8b8f99] uppercase">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="rounded-lg border border-white/10 bg-black/50 px-3.5 py-3 text-sm text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
              />
            </label>

            {error && (
              <p className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/8 px-3 py-2 font-mono text-[11px] leading-relaxed text-red-300">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {error}
              </p>
            )}
            {notice && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-3 py-2 font-mono text-[11px] text-emerald-300">
                {notice}
              </p>
            )}

            {mode === 'signup' && (
              /* Clickwrap: unchecked by default, blocks signup until ticked.
                 Links open in a new tab so the form state is never lost. */
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 bg-black/40 px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#bc9863]"
                />
                <span className="text-xs leading-relaxed text-[#8b8f99]">
                  I have read and agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-[#e7cfa3] underline hover:text-[#f4efe6]">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" target="_blank" className="text-[#e7cfa3] underline hover:text-[#f4efe6]">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            )}

            {turnstileEnabled && (
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken(null)}
              />
            )}

            <button
              type="submit"
              disabled={busy || (turnstileEnabled && !captchaToken) || (mode === 'signup' && !agreed)}
              className="mt-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] py-3 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-60"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-[#8b8f99]">
            {mode === 'signin' ? (
              <>
                New here?{' '}
                <button onClick={() => setMode('signup')} className="cursor-pointer text-[#e7cfa3] hover:underline">
                  Register
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button onClick={() => setMode('signin')} className="cursor-pointer text-[#e7cfa3] hover:underline">
                  Sign in
                </button>
              </>
            )}
          </div>

          {!isSupabaseConfigured && !IS_PROD && (
            <div className="mt-5 rounded-lg border border-amber-500/25 bg-amber-500/6 p-3 text-center">
              <p className="mb-2 font-mono text-[10px] leading-relaxed text-amber-300/90">
                Dev only — Supabase not configured. This escape hatch is stripped from production builds.
              </p>
              <Link href="/studio" className="font-mono text-[11px] text-[#e7cfa3] underline">
                Continue in dev mode →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
