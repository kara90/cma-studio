import type { Metadata } from 'next';

/**
 * Route-segment layout for /studio. The page itself is a client component
 * (auth-gated workspace) and can't export metadata, so this server layout gives
 * the flagship Director Studio its own title/description/canonical instead of
 * inheriting the homepage's — while adding no wrapper DOM (it just renders
 * children).
 */
export const metadata: Metadata = {
  title: 'Director Studio — real camera, lens & film-stock signatures | CMA Studio',
  description:
    'The Cinematographer engine: choose real camera, lens, film-stock and lighting signatures and it compiles them into the prompt before it reaches the model. Render on your own fal.ai key.',
  alternates: { canonical: '/studio' },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
