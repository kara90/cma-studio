'use client';

/**
 * InstallGuide — the canonical "get the app" experience at /app.
 * Detects the visitor's platform and leads with THEIR path:
 *   • Android / Chromium: a REAL one-tap install button (native prompt via
 *     beforeinstallprompt). Fallback: browser-menu steps.
 *   • iOS: Apple allows no programmatic install and no deep link into the
 *     share sheet — so the steps are drawn to look like the exact buttons
 *     the user must tap. Honest and visual beats vague.
 *   • Desktop: address-bar install icon + a QR code to jump to the phone.
 * The other platforms stay reachable below (people help each other install).
 */
import { useEffect, useState } from 'react';
import { Share, SquarePlus, MoreVertical, Smartphone, MonitorDown, CheckCircle2, Download } from 'lucide-react';

type Platform = 'ios' | 'android' | 'desktop';
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** One illustrated step row — icon drawn big so it matches what the OS shows. */
function Step({ n, icon, children }: { n: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-4 rounded-2xl border border-white/8 bg-black/40 p-4">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] font-[family-name:var(--font-sora)] text-[14px] font-bold text-black">
        {n}
      </span>
      <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-[#bc9863]/30 bg-[#bc9863]/8 text-[#e7cfa3]">
        {icon}
      </span>
      <span className="text-[14.5px] leading-relaxed text-[#cfcabf]">{children}</span>
    </li>
  );
}

function SectionCard({ title, badge, children, highlight }: { title: string; badge?: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <section
      className={`rounded-3xl p-6 sm:p-8 ${highlight ? 'glass glass-gold border border-[#bc9863]/40' : 'glass'}`}
    >
      <div className="mb-5 flex items-center gap-3">
        <h2 className="font-[family-name:var(--font-sora)] text-[19px] font-semibold text-[#f4efe6]">{title}</h2>
        {badge && (
          <span className="rounded-full border border-[#bc9863]/40 bg-[#bc9863]/10 px-2.5 py-1 font-mono text-[9px] tracking-[0.18em] text-[#e7cfa3] uppercase">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

export function InstallGuide() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    const onInstalled = () => setDone(true);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const nativeInstall = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    const choice = await installEvt.userChoice;
    if (choice.outcome === 'accepted') setDone(true);
    setInstallEvt(null);
  };

  if (installed) {
    return (
      <div className="glass glass-gold flex flex-col items-center gap-3 rounded-3xl p-10 text-center">
        <CheckCircle2 size={40} className="text-[#bc9863]" />
        <h2 className="font-[family-name:var(--font-sora)] text-[20px] font-semibold text-[#f4efe6]">
          You&apos;re already in the app.
        </h2>
        <p className="max-w-sm text-[14px] leading-relaxed text-[#8b8f99]">
          This is the installed CMA Studio. Same account, same library, every model — nothing else to set up.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="glass glass-gold flex flex-col items-center gap-3 rounded-3xl p-10 text-center">
        <CheckCircle2 size={40} className="text-[#bc9863]" />
        <h2 className="font-[family-name:var(--font-sora)] text-[20px] font-semibold text-[#f4efe6]">Installed.</h2>
        <p className="max-w-sm text-[14px] leading-relaxed text-[#8b8f99]">
          CMA Studio is on your home screen — open it from there like any app.
        </p>
      </div>
    );
  }

  const ios = (
    <SectionCard title="iPhone & iPad" badge={platform === 'ios' ? 'Your device' : undefined} highlight={platform === 'ios'}>
      <p className="mb-4 text-[13.5px] leading-relaxed text-[#8b8f99]">
        Apple doesn&apos;t allow a download button for web apps — installing takes <span className="text-[#e7cfa3]">two taps in Safari</span>. Here is exactly where they are:
      </p>
      <ol className="flex flex-col gap-3">
        <Step n={1} icon={<Share size={22} />}>
          Tap the <span className="font-semibold text-[#f4efe6]">Share</span> button — the square with the arrow, in the
          <span className="font-semibold text-[#f4efe6]"> bottom center of Safari&apos;s toolbar</span>.
        </Step>
        <Step n={2} icon={<SquarePlus size={22} />}>
          Scroll the list and tap <span className="font-semibold text-[#f4efe6]">Add to Home Screen</span>.
        </Step>
        <Step n={3} icon={<Smartphone size={22} />}>
          Tap <span className="font-semibold text-[#f4efe6]">Add</span> (top right). The gold CMA icon lands on your home
          screen — open it like any app.
        </Step>
      </ol>
      <p className="mt-4 font-mono text-[11px] leading-relaxed text-[#8b909e]">
        Using Chrome on iPhone? Same steps — its Share button sits at the top right of the address bar.
      </p>
    </SectionCard>
  );

  const android = (
    <SectionCard title="Android phones & tablets" badge={platform === 'android' ? 'Your device' : undefined} highlight={platform === 'android'}>
      {installEvt ? (
        <>
          <p className="mb-4 text-[13.5px] leading-relaxed text-[#8b8f99]">
            One tap. Your phone shows the install dialog, and the app lands on your home screen.
          </p>
          <button
            onClick={nativeInstall}
            className="inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-8 py-4 text-[16px] font-semibold text-black shadow-[0_14px_44px_rgba(188,152,99,0.36)] transition hover:brightness-105 sm:w-auto"
          >
            <Download size={18} /> Install CMA Studio now
          </button>
        </>
      ) : (
        <>
          <p className="mb-4 text-[13.5px] leading-relaxed text-[#8b8f99]">
            In Chrome, two taps:
          </p>
          <ol className="flex flex-col gap-3">
            <Step n={1} icon={<MoreVertical size={22} />}>
              Open the <span className="font-semibold text-[#f4efe6]">browser menu</span> — the three dots, top right.
            </Step>
            <Step n={2} icon={<Smartphone size={22} />}>
              Tap <span className="font-semibold text-[#f4efe6]">Add to Home screen</span>, then{' '}
              <span className="font-semibold text-[#f4efe6]">Install</span>.
            </Step>
          </ol>
        </>
      )}
    </SectionCard>
  );

  const desktop = (
    <SectionCard title="Computer" badge={platform === 'desktop' ? 'Your device' : undefined} highlight={platform === 'desktop'}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="flex-1">
          <p className="mb-4 text-[13.5px] leading-relaxed text-[#8b8f99]">
            In Chrome or Edge, click the <span className="text-[#e7cfa3]">install icon</span> at the right end of the
            address bar and confirm — CMA Studio opens in its own window like a desktop app.
          </p>
          <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/40 p-4">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-[#bc9863]/30 bg-[#bc9863]/8 text-[#e7cfa3]">
              <MonitorDown size={22} />
            </span>
            <span className="text-[14px] leading-relaxed text-[#cfcabf]">
              Rather have it on your phone? Point your camera at the code — it opens this page there.
            </span>
          </div>
        </div>
        <div className="rounded-2xl bg-[#f4efe6] p-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qr-app.png" alt="QR code — open the install page on your phone" className="h-44 w-44 rounded-lg" />
        </div>
      </div>
    </SectionCard>
  );

  // The visitor's platform leads; the others follow for anyone helping someone else.
  const order =
    platform === 'ios' ? [ios, android, desktop] : platform === 'android' ? [android, ios, desktop] : [desktop, ios, android];

  return (
    <div className="flex flex-col gap-5">
      {order.map((card, i) => (
        <div key={i}>{card}</div>
      ))}
    </div>
  );
}
