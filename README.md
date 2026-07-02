# Next.js Template — Sebastien's Standard Pack (SEO / Marketing)

Use this for **content/marketing sites that need Google ranking** (server-rendered, fast, SEO-friendly).
For web apps & dashboards, use the Vite template at `F:\CLAUDE CODE\_stack-template\` instead.

## Stack
- **Next.js (App Router)** + React 19 — server rendering, routing, metadata, image optimization
- **Tailwind CSS v4** — styling foundation
- **shadcn/ui** (Radix + Nova preset) — accessible components, Geist font
- **lucide-react** — icon set
- **framer-motion 12** — animation
- **react-hook-form + zod** — forms + validation
- **ui-ux-pro-max** skill — design intelligence (system-level, always available)

## Use it for a new site

```bash
# 1. Copy this folder to your new project location, then:
cd "F:\CLAUDE CODE\YOUR-NEW-SITE"

# 2. Install
npm install

# 3. Start the dev server
npm run dev        # http://localhost:3000
```

## Scripts
- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint

## Add components
```bash
npx shadcn@latest add card dialog input        # etc.
```

## Notes
- Client components that use framer-motion / hooks need `"use client"` at the top
  (see `components/hero.jsx`).
- Routing is file-based (`app/` folder) — no React Router needed here.
- To change the default stack: install/remove a package here, then tell Claude
  "update my standard stack" so memory stays in sync.
