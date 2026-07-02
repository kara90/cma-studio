/**
 * Atmosphere — the fixed cinematic ground shared by every page: drifting gold
 * light-leaks, film grain, and a vignette. Pure CSS (no JS), so it stays a
 * server component and costs the client nothing.
 */
export function Atmosphere() {
  return (
    <>
      <div className="cma-atmos" aria-hidden>
        <div className="cma-leak a" />
        <div className="cma-leak b" />
        <div className="cma-leak c" />
      </div>
      <div className="cma-grain" aria-hidden />
      <div className="cma-vignette" aria-hidden />
    </>
  );
}
