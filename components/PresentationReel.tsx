'use client';

/**
 * PresentationReel — the studio's presentation film.
 *
 * LOCKED autoplay contract (this is the part that kept breaking with embeds):
 *   • The clip is SELF-HOSTED (public/clips), faststart mp4, so no third-party
 *     player runtime can ever block or delay playback.
 *   • It autoplays MUTED + looping on load, the only autoplay every browser
 *     allows without a user gesture. muted is forced on the DOM element too,
 *     because React does not reliably reflect the `muted` prop to the property.
 *   • An explicit muted play() runs on mount and again when the tab becomes
 *     visible, covering hydration timing and the strictest autoplay policies.
 *   • Sound is OFF until the viewer clicks the button. Unmuting is a real user
 *     gesture, so playing with sound is always permitted at that point.
 */
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function PresentationReel({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // Force muted on the property (React's muted attribute is unreliable), then
    // kick playback. A muted play() is never rejected by autoplay policy.
    v.muted = true;
    const play = () => {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    play();
    const onVisible = () => {
      if (!document.hidden && v.paused) play();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [src]);

  function toggleSound() {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    setMuted(next);
    v.muted = next;
    // Unmuting is a user gesture; playing with audio is allowed here.
    if (!next) {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className={className}
      />
      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? 'Turn on sound' : 'Mute'}
        aria-pressed={!muted}
        className="absolute right-3 bottom-3 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 text-[13px] font-medium text-[#f4efe6] backdrop-blur-md transition hover:border-[#bc9863]/60 hover:text-[#e7cfa3] sm:right-4 sm:bottom-4"
      >
        {muted ? (
          <>
            <VolumeX size={17} />
            <span>Tap for sound</span>
          </>
        ) : (
          <Volume2 size={17} />
        )}
      </button>
    </div>
  );
}
