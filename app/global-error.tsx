'use client';

/**
 * app/global-error.tsx — root error boundary. Catches any uncaught client-side
 * render error that would otherwise white-screen the app (Next replaces the
 * whole document, so this must render its own <html>/<body>). Self-contained
 * inline styles: it can't assume the app's fonts/CSS survived the error.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#05060a',
          color: '#f4efe6',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ padding: '40px 28px', maxWidth: 380 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 22px',
              borderRadius: 9999,
              border: '2px solid rgba(188,152,99,.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 22, height: 22, borderRadius: 9999, background: 'radial-gradient(circle at 35% 35%,#e7cfa3,#bc9863)' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em', margin: '0 0 10px' }}>Something interrupted the scene.</h1>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: '#8b8f99', margin: '0 0 24px' }}>
            An unexpected error hit this page. Your work and your key are untouched. Try again, or head back home.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                cursor: 'pointer',
                border: 0,
                borderRadius: 12,
                padding: '12px 26px',
                fontSize: 14,
                fontWeight: 600,
                color: '#000',
                background: 'linear-gradient(to bottom,#e7cfa3,#bc9863)',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 12,
                padding: '12px 26px',
                fontSize: 14,
                fontWeight: 600,
                color: '#e7cfa3',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,.14)',
              }}
            >
              Back home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
