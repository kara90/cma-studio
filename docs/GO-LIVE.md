# CMA Studio — go-live runbook (the "connect Cloudflare" session)

Everything the CODE needs is already on the `redesign/glass-studio` branch and
fails soft until the pieces below exist. This is the single checklist for the
dashboard session — Sebastien's accounts, done together. Order matters.

Current state: `main` is LIVE at https://cma-studio.sebastienriccidirector.workers.dev
(git-connected, push = deploy). `redesign/glass-studio` holds the whole platform
rebuild and is NOT merged yet.

---

## 1. R2 bucket (BEFORE merging the branch — deploy fails without it)

`wrangler.jsonc` binds `RENDERS` → bucket **`cma-renders`**. Create it first:

- Dashboard: **R2 → Create bucket → name exactly `cma-renders`**, or
- CLI: `npx wrangler r2 bucket create cma-renders`

Then add a **lifecycle rule** deleting objects older than **365 days** (the
longest plan retention; the app already blocks access earlier per tier, this
just reclaims storage).

Until the bucket exists the app still works: renders return normally, the
Library just shows "storage offline". Only `wrangler deploy` hard-fails.

## 2. Supabase auth polish

- **Auth → URL Configuration → Site URL** = the live URL (confirm emails
  currently redirect to localhost — this is the suspected cause of the
  sign-in bug Seb hit on 2026-07-02).
- **Auth → Attack Protection → CAPTCHA** → enable, provider **Turnstile**,
  paste the Turnstile SECRET key (created in step 3).
- Signups are OPEN by design (`NEXT_PUBLIC_ACADEMY_ALLOWED_DOMAINS` is blank);
  the paywall — not the email domain — is the gate.

## 3. Turnstile (bot protection)

Cloudflare dashboard → **Turnstile → Add widget** (domain = live URL):
- Site key → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (build-time var, `.env.production`)
- Secret key → into Supabase (step 2). Dev builds fall back to the always-pass
  test key automatically.

## 4. Stripe (full detail in BILLING-SETUP.md)

1. Create the recurring Prices → copy the 6 `STRIPE_PRICE_*` ids.
2. Webhook endpoint `https://<live-url>/api/stripe/webhook` with events
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted` → copy the signing secret.
3. Worker **encrypted secrets** (dashboard → Worker → Settings → Variables, or
   `npx wrangler secret put NAME`):
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - all `STRIPE_PRICE_*`

Note: the render paywall is **always on** in code (`lib/authGuard.ts`
verifyAccess → 402 without an active plan). There is no flag to flip — the
moment Stripe works, the business works.

## 5. Edge protection

- WAF: enable the Managed Ruleset + a Rate-Limiting rule on `/api/*`
  (the in-app `RENDER_LIMITER` 12/min binding is already live behind it).
- **Bot Fight Mode** on.
- SSL/TLS mode **Full (strict)**; Always Use HTTPS.

## 6. Custom domain (when chosen)

- Add the domain to the Worker (Custom Domains), update
  `NEXT_PUBLIC_SITE_URL` (`.env.production` + `wrangler.jsonc` vars — it's
  baked at build, so commit + redeploy), update the Stripe webhook URL and the
  Supabase Site URL.
- www → apex 301 (proxied CNAME + redirect rule), per the standing rule for
  every site.

## 7. Merge + verify

1. Merge `redesign/glass-studio` → `main` (Seb's call) — push = auto-deploy.
2. Smoke test IN ORDER: signup (Turnstile visible) → confirm email lands on
   the live URL → buy Student plan (Stripe test mode first) → webhook writes
   `app_metadata.cma_plan` → render on a real fal key → file appears in
   /files → download works → cancel sub in Stripe → render returns 402.

## Blocked on people, not dashboards

- Legal counsel: entity/LLC, DMCA agent registration (~$6, copyright.gov),
  arbitration clause, clickwrap checkbox at signup, governing law.
- Final pricing numbers + plan retention windows (placeholders live in
  `lib/plans.ts` / `lib/retention.ts`).
- Noir look-preview clip + any extra showcase media (drop into
  `lib/showcase.ts` / `lib/lookPreviews.ts`).
