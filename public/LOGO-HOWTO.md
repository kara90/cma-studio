# Logo

The real brand logo is in use: **`public/logo.jpg`** (downloaded from Sebastien's
Drive). `components/Logo.tsx` renders it in every header (studio, landing, pricing,
login), with an original gold aperture SVG as the fallback if the file is missing.

To replace it: overwrite `public/logo.jpg` (or add `public/logo.png` / `logo.svg`
and change the `<img src>` in `components/Logo.tsx`).

Note: the current file is a JPEG on a **black background**, which blends on the dark
headers. For a perfectly clean edge on any background, a **transparent PNG** is ideal.
