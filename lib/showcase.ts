/**
 * ============================================================================
 * SHOWCASE FEED  >>>  SEBASTIEN: DROP REAL WORK HERE  <<<
 * ============================================================================
 *
 * This file feeds the "From the wire" grid on the homepage
 * (components/marketing/Showcase.tsx). Every entry below is a PLACEHOLDER:
 * `src` is undefined, so the tile renders its gradient poster with a small
 * "sample" chip.
 *
 * To publish a real render, just fill in `src`:
 *
 *   - kind: 'video'  -> src is an .mp4/.webm URL. The tile auto-renders it
 *                       as a muted, looping, inline video. No code changes.
 *   - kind: 'image'  -> src is an image URL. The tile renders it full-bleed.
 *   - kind: 'audio'  -> src is an audio URL. The tile keeps its poster and
 *                       overlays a native player at the bottom.
 *
 * `poster` is a CSS background (any gradient string) shown behind media while
 * it loads, and as the whole tile when src is missing. `author` is optional
 * and appears in the hover overlay under the title.
 *
 * Order matters: the first item is the large 2x2 feature tile, the sixth is
 * the wide strip. Swap array positions to re-run the layout rhythm.
 * ============================================================================
 */

export interface ShowcaseItem {
  id: string;
  title: string;
  kind: 'video' | 'image' | 'audio';
  /** Real media URL. Leave undefined to show the poster + "sample" chip. */
  src?: string;
  /** CSS background value (gradient) used as the tile poster. */
  poster: string;
  author?: string;
}

// Every tile below carries a REAL render (Sebastien's clips, compressed for
// web) — no empty sample cases on the homepage.
export const ITEMS: ShowcaseItem[] = [
  {
    id: 'feature-reel',
    title: 'Made with CMA Studio',
    kind: 'video',
    src: '/clips/home-showcase.mp4',
    poster:
      'radial-gradient(120% 90% at 80% 15%, rgba(214,120,52,0.55) 0%, transparent 55%), radial-gradient(90% 70% at 15% 85%, rgba(38,74,138,0.5) 0%, transparent 60%), linear-gradient(150deg, #060a16 0%, #0b1430 55%, #1d1206 100%)',
    author: 'CineMaster',
  },
  {
    id: 'cinematic-sample',
    title: 'Cinematic',
    kind: 'video',
    src: '/clips/style-cinematic.mp4',
    poster:
      'radial-gradient(120% 90% at 78% 28%, rgba(222,160,84,0.55) 0%, transparent 55%), linear-gradient(108deg, #071f27 0%, #0d3844 46%, #4c3a20 76%, #b0803c 100%)',
    author: 'CineMaster',
  },
  {
    id: 'commercial-sample',
    title: 'Commercial',
    kind: 'video',
    src: '/clips/style-commercial.mp4',
    poster:
      'linear-gradient(118deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.9) 46%, rgba(255,255,255,0) 62%), linear-gradient(180deg, #f4f6f8 0%, #d9dde2 55%, #b3b9c1 100%)',
    author: 'CineMaster',
  },
  {
    id: 'action-sample',
    title: 'Action',
    kind: 'video',
    src: '/clips/style-action.mp4',
    poster:
      'radial-gradient(100% 70% at 50% 0%, rgba(232,168,124,0.42) 0%, transparent 55%), linear-gradient(180deg, #23130c 0%, #6e4226 60%, #b57e50 100%)',
    author: 'CineMaster',
  },
  {
    id: 'horror-sample',
    title: 'Horror',
    kind: 'video',
    src: '/clips/style-horror.mp4',
    poster:
      'radial-gradient(70% 90% at 70% 30%, rgba(188,152,99,0.4) 0%, transparent 50%), linear-gradient(120deg, #050507 0%, #101014 60%, #1c150a 100%)',
    author: 'CineMaster',
  },
  {
    id: 'wide-reel',
    title: 'Made with CMA Studio',
    kind: 'video',
    src: '/clips/home-3.mp4',
    poster:
      'radial-gradient(110% 80% at 50% 100%, rgba(231,207,163,0.5) 0%, transparent 60%), linear-gradient(170deg, #2a1636 0%, #6b3420 55%, #d99a4e 100%)',
    author: 'CineMaster',
  },
  {
    id: 'neutral-sample',
    title: 'Neutral light',
    kind: 'video',
    src: '/clips/style-neutral.mp4',
    poster:
      'radial-gradient(80% 60% at 20% 20%, rgba(212,70,150,0.45) 0%, transparent 55%), radial-gradient(90% 70% at 85% 80%, rgba(52,180,196,0.4) 0%, transparent 60%), linear-gradient(135deg, #0a0714 0%, #14102a 100%)',
    author: 'CineMaster',
  },
];
