'use client';

/**
 * InstallGuide — the canonical "get the app" experience at /app.
 *
 * Built for people who have never installed a web app:
 *   • A "This is the app" gallery of real screenshots in phone frames, first —
 *     you see what you're getting before any instructions.
 *   • One BIG store-style install button per platform. Android/desktop fire
 *     the REAL native install dialog when the browser offers it. iPhone —
 *     where Apple allows no install button at all — gets a guided overlay: a
 *     giant animated arrow physically points at the exact button to tap,
 *     one step at a time.
 * The visitor's platform leads; the others stay below (people help people).
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Share,
  SquarePlus,
  MoreVertical,
  Smartphone,
  MonitorDown,
  CheckCircle2,
  Download,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

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

/** iOS browsers that are NOT Safari can't add to the home screen the same way. */
function isIosNonSafari(): boolean {
  return /CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
}

/* ── The guided overlay: a giant arrow points at the real button to tap ── */

interface GuideStep {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  /** where the animated arrow points while this step is up */
  arrow: 'bottom-center' | 'top-right' | 'none';
}

function stepsFor(platform: Platform): GuideStep[] {
  if (platform === 'ios') {
    return [
      {
        icon: <Share size={26} />,
        title: 'Tap the Share button',
        body: (
          <>
            It&apos;s the <span className="font-semibold text-[#f4efe6]">square with the arrow</span> at the{' '}
            <span className="font-semibold text-[#f4efe6]">bottom center of your screen</span>, in Safari&apos;s toolbar.
            The big arrow below is pointing at it.
          </>
        ),
        arrow: 'bottom-center',
      },
      {
        icon: <SquarePlus size={26} />,
        title: 'Tap "Add to Home Screen"',
        body: (
          <>
            A menu slides up. <span className="font-semibold text-[#f4efe6]">Scroll it</span> until you see{' '}
            <span className="font-semibold text-[#f4efe6]">Add to Home Screen</span>, tap it, then tap{' '}
            <span className="font-semibold text-[#f4efe6]">Add</span> (top right).
          </>
        ),
        arrow: 'none',
      },
      {
        icon: <Smartphone size={26} />,
        title: 'Done — check your home screen',
        body: (
          <>
            Close Safari and look at your home screen: the{' '}
            <span className="font-semibold text-[#e7cfa3]">gold CMA Studio icon</span> is there now. Open the app from
            that icon from now on, like any other app.
          </>
        ),
        arrow: 'none',
      },
    ];
  }
  if (platform === 'android') {
    return [
      {
        icon: <MoreVertical size={26} />,
        title: 'Open the browser menu',
        body: (
          <>
            Tap the <span className="font-semibold text-[#f4efe6]">three dots (⋮)</span> at the{' '}
            <span className="font-semibold text-[#f4efe6]">top right</span> — the arrow is pointing at it.
          </>
        ),
        arrow: 'top-right',
      },
      {
        icon: <Smartphone size={26} />,
        title: 'Tap "Add to Home screen"',
        body: (
          <>
            In the menu, tap <span className="font-semibold text-[#f4efe6]">Add to Home screen</span> (sometimes named{' '}
            <span className="font-semibold text-[#f4efe6]">Install app</span>), then confirm. The gold CMA icon lands on
            your home screen.
          </>
        ),
        arrow: 'none',
      },
    ];
  }
  return [
    {
      icon: <MonitorDown size={26} />,
      title: 'Click the install icon',
      body: (
        <>
          In Chrome or Edge, look at the <span className="font-semibold text-[#f4efe6]">right end of the address bar</span>{' '}
          — a small <span className="font-semibold text-[#f4efe6]">install icon</span> (a screen with a down arrow). Click
          it, then click <span className="font-semibold text-[#f4efe6]">Install</span>. The app opens in its own window.
        </>
      ),
      arrow: 'top-right',
    },
  ];
}

function GuidedOverlay({ platform, onClose }: { platform: Platform; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const steps = stepsFor(platform);
  const step = steps[i];
  const last = i === steps.length - 1;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* the pointing arrow — physically aimed at the browser control to tap */}
      {step.arrow === 'bottom-center' && (
        <motion.div
          key={`arrow-b-${i}`}
          animate={reduce ? {} : { y: [0, 18, 0] }}
          transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
          className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[#e7cfa3]"
        >
          <ChevronDown size={72} strokeWidth={2.5} />
        </motion.div>
      )}
      {step.arrow === 'top-right' && (
        <motion.div
          key={`arrow-t-${i}`}
          animate={reduce ? {} : { y: [0, -14, 0] }}
          transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
          className="pointer-events-none absolute top-4 right-6 text-[#e7cfa3]"
        >
          <ChevronUp size={64} strokeWidth={2.5} />
        </motion.div>
      )}

      {/* the step card */}
      <div className="flex h-full items-center justify-center px-5" onClick={(e) => e.stopPropagation()}>
        <motion.div
          key={`card-${i}`}
          initial={reduce ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass glass-gold w-full max-w-sm rounded-3xl border border-[#bc9863]/40 p-6"
        >
          <div className="mb-1 font-mono text-[10px] tracking-[0.22em] text-[#bc9863] uppercase">
            Step {i + 1} of {steps.length}
          </div>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl border border-[#bc9863]/35 bg-[#bc9863]/10 text-[#e7cfa3]">
              {step.icon}
            </span>
            <h3 className="font-[family-name:var(--font-sora)] text-[18px] leading-snug font-semibold text-[#f4efe6]">
              {step.title}
            </h3>
          </div>
          <p className="text-[14.5px] leading-relaxed text-[#cfcabf]">{step.body}</p>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => (last ? onClose() : setI(i + 1))}
              className="inline-flex min-h-[48px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] py-3 text-[15px] font-semibold text-black transition hover:brightness-105"
            >
              {last ? 'Done' : 'I did it — next step'}
            </button>
            <button
              onClick={onClose}
              aria-label="Close guide"
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-white/12 text-[#8b8f99] transition hover:text-[#e7cfa3]"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Store-style install button ── */

function BigInstallButton({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] p-4 text-left shadow-[0_14px_44px_rgba(188,152,99,0.36)] transition hover:-translate-y-0.5 hover:brightness-105 sm:w-auto sm:min-w-[300px]"
    >
      <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-black/85 text-[#e7cfa3]">
        <Download size={22} />
      </span>
      <span className="min-w-0">
        <span className="block font-mono text-[9.5px] tracking-[0.18em] text-black/60 uppercase">{sub}</span>
        <span className="block font-[family-name:var(--font-sora)] text-[17px] leading-tight font-bold text-black">
          {label}
        </span>
      </span>
    </button>
  );
}

/* ── Screenshot gallery: this is what you're installing ── */

const SCREENS = [
  { src: '/screens/app-home.png', label: 'Home' },
  { src: '/screens/app-video.png', label: 'Video generator' },
  { src: '/screens/app-pricing.png', label: 'Plans' },
];

function PhoneGallery() {
  return (
    <section className="mb-10">
      <div className="mb-4 text-center">
        <div className="mb-2 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">This is the app</div>
        <p className="mx-auto max-w-md text-[13.5px] leading-relaxed text-[#8b8f99]">
          Real screens from CMA Studio on a phone — full screen, no browser bar, the gold icon on your home screen.
        </p>
      </div>
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-2 pb-3 sm:justify-center sm:overflow-visible">
        {SCREENS.map((s) => (
          <figure key={s.src} className="flex flex-none snap-center flex-col items-center gap-2.5">
            <div className="w-[220px] rounded-[2.1rem] border border-[#bc9863]/25 bg-black p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
              <div className="relative overflow-hidden rounded-[1.6rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={`CMA Studio app — ${s.label}`} loading="lazy" className="w-full" />
                <span className="absolute top-1.5 left-1/2 h-4 w-16 -translate-x-1/2 rounded-full bg-black/90" aria-hidden />
              </div>
            </div>
            <figcaption className="font-mono text-[10px] tracking-[0.16em] text-[#8b909e] uppercase">{s.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ── Per-platform cards ── */

function SectionCard({ title, badge, children, highlight }: { title: string; badge?: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <section className={`rounded-3xl p-6 sm:p-8 ${highlight ? 'glass glass-gold border border-[#bc9863]/40' : 'glass'}`}>
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
  const [overlay, setOverlay] = useState<Platform | null>(null);
  const [iosOtherBrowser, setIosOtherBrowser] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());
    setIosOtherBrowser(isIosNonSafari());
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

  const nativeInstall = async (fallback: Platform) => {
    if (installEvt) {
      await installEvt.prompt();
      const choice = await installEvt.userChoice;
      if (choice.outcome === 'accepted') setDone(true);
      setInstallEvt(null);
    } else {
      // Browser didn't offer the native dialog — walk them through by hand.
      setOverlay(fallback);
    }
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
      {iosOtherBrowser && (
        <p className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-amber-300/90">
          You&apos;re not in Safari. Open this page in Safari first — copy the address and paste it there — then tap the
          button below.
        </p>
      )}
      <BigInstallButton
        label="Install on iPhone / iPad"
        sub="Guided · 30 seconds"
        onClick={() => setOverlay('ios')}
      />
      <p className="mt-4 text-[13px] leading-relaxed text-[#8b8f99]">
        Apple doesn&apos;t sell web apps in the App Store, so there&apos;s no download — instead, Safari pins the app to
        your home screen in two taps. The button above walks you through each tap with an arrow pointing at the real
        buttons on your screen.
      </p>
    </SectionCard>
  );

  const android = (
    <SectionCard title="Android phones & tablets" badge={platform === 'android' ? 'Your device' : undefined} highlight={platform === 'android'}>
      <BigInstallButton
        label="Install on Android"
        sub={installEvt ? 'One tap · native install' : 'Guided · 30 seconds'}
        onClick={() => nativeInstall('android')}
      />
      <p className="mt-4 text-[13px] leading-relaxed text-[#8b8f99]">
        On most Android phones this opens the real install dialog in one tap — accept it and the app is on your home
        screen. If your browser doesn&apos;t offer it, a guide with a pointing arrow takes over.
      </p>
    </SectionCard>
  );

  const desktop = (
    <SectionCard title="Computer (Windows & Mac)" badge={platform === 'desktop' ? 'Your device' : undefined} highlight={platform === 'desktop'}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <BigInstallButton
            label="Install on this computer"
            sub={installEvt ? 'One click · native install' : 'Guided'}
            onClick={() => nativeInstall('desktop')}
          />
          <p className="mt-4 text-[13px] leading-relaxed text-[#8b8f99]">
            In Chrome or Edge the app installs in one click and opens in its own window. Rather have it on your phone?
            Point your camera at the code — it opens this page there.
          </p>
        </div>
        <div className="mx-auto flex-none rounded-2xl bg-[#f4efe6] p-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qr-app.png" alt="QR code — open the install page on your phone" className="h-40 w-40 rounded-lg" />
        </div>
      </div>
    </SectionCard>
  );

  const order =
    platform === 'ios' ? [ios, android, desktop] : platform === 'android' ? [android, ios, desktop] : [desktop, ios, android];

  return (
    <div className="flex flex-col gap-5">
      <PhoneGallery />
      {order.map((card, i) => (
        <div key={i}>{card}</div>
      ))}
      <AnimatePresence>{overlay && <GuidedOverlay platform={overlay} onClose={() => setOverlay(null)} />}</AnimatePresence>
    </div>
  );
}
