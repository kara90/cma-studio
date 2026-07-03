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

4. **Customer Billing Portal** (required by the Refund & Cancellation Policy
   and by "click-to-cancel" rules — cancelling must be as easy as subscribing):
   Stripe dashboard → Settings → Billing → Customer portal → enable, allow
   subscription cancellation. Then add a "Manage billing" link in the app
   (a tiny `/api/portal` route creating a portal session — ~20 lines, do when
   Stripe keys exist).
5. **Yearly renewal reminders** (promised in the Refund Policy): Stripe
   dashboard → Settings → Billing → Subscriptions → enable upcoming-renewal
   emails for yearly subscriptions.

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

## Optional Stripe extra: consent at the payment page itself

The app already has clickwrap: a required checkbox at signup (acceptance
timestamp + terms version stamped on the account via `lib/legal.ts`
TERMS_VERSION) and a reaffirmation line on /pricing. If you also want the
checkbox ON Stripe's own payment page: Stripe dashboard → Settings → Business →
Public details → set the Terms of Service URL, then add
`consent_collection: { terms_of_service: 'required' }` to the session in
`app/api/checkout/route.ts`. Do NOT add the code before the dashboard URL is
set — Stripe rejects the session otherwise.

## DMCA designated agent (do BEFORE launch — not a counsel task)

We host user renders in /files TODAY. Without a registered designated agent
there is NO §512 safe harbor at all — the takedown channel in the Terms is
voluntary and does not substitute. It is a self-serve ~$6 filing Sebastien can
do himself: https://www.copyright.gov/dmca-directory/ → register CineMaster
Academy + the agent email (hello@cinemasteracademy.com). Ten minutes.

## Blocked on people, not dashboards

- Legal counsel: entity/LLC, and the arbitration strategy decision (consumer
  arbitration clause with class-action waiver, small-claims carve-out, 30-day
  opt-out). Governing law is now set to Nevada / Clark County in Terms §19;
  counsel confirms it. The clickwrap, checkout consent, and all three legal
  documents are BUILT; counsel reviews the wording.
- Final pricing numbers + plan retention windows (placeholders live in
  `lib/plans.ts` / `lib/retention.ts`).
- Extra showcase media whenever ready (drop into `lib/showcase.ts` /
  `lib/lookPreviews.ts` — all look tiles have real clips as of 2026-07-02).

---

## Legal launch gate (ONE deploy: draft banners OFF + payments ON, all or nothing)

HARD RULE: never enable payments while any item below is open. The
"Working draft, review by counsel before launch" banners on /terms, /privacy,
/refunds are the visible "still pre-gate" signal and stay up until this deploy.

### Already DONE in beta (live now, banners still up, payments still off)
- Operator identity on Terms (Sections 1 and 21), Privacy, and Refund pages
  (`lib/legal.ts` OPERATOR_IDENTITY, one source of truth).
- Governing law Nevada / Clark County, small-claims carve-out, 1-year claim
  limit (Terms §19).
- Privacy Security section; Model Provider training pointer.
- Beta clause (Terms §2); assignment extension (Terms §20); retention fairness
  (Terms §12); site-wide trademark footer (`components/TrademarkNotice.tsx`);
  homepage storage line.
- Service continuity, outages, and discontinuation clause verbatim (Terms §2),
  with the Refund Policy aligned: 7-day remedy from ANY cause including
  provider/infra, 30-day cancellation right, discontinuation refunded the same
  for monthly and yearly.
- Top-ups reconciled to storage only (no "generations" charge implied).
- Signup: "I am 18 or older" attestation + Terms/Privacy/Refund clickwrap,
  acceptance recorded (`terms_accepted_at`, `terms_version`,
  `agreed_terms_privacy_refund`, `over_18` in Supabase user_metadata).
- Checkout consent gate on /pricing (`CheckoutConsent`): plan, price,
  frequency, "Renews automatically until cancelled," cancellation method, and
  the verbatim required consent checkbox (auto-renewal + immediate performance
  + 14-day proportionate-deduction). The consent + timestamp + terms version
  are sent to `/api/checkout` and stamped onto the Stripe session and
  subscription metadata.
- Moderated / failed render notice in the studio and generators (compute may
  still be consumed on the provider side).
- Key-never-logged + no-tracker test (`npm test`, `tests/no-key-logging.test.mjs`).

### REMAINING for the gate deploy (build these, then flip banners + payments together)
1. Post-purchase acknowledgment email (G4.5): on `checkout.session.completed`,
   send an email restating plan, price, renewal frequency, and how to cancel.
   Needs an email provider (Resend) key + a send in the webhook handler. Use the
   same Resend account pattern as BTE-FORM-WORKER.
2. Yearly renewal reminder job (G4.6): a WORKING scheduled job that sends 15 to
   45 days before renewal. Fastest path is Stripe's native upcoming-renewal
   email (step 4.5); a branded alternative is a Cloudflare Cron Trigger worker
   querying Stripe for upcoming renewals. One of the two must be live.
3. Webhook consent persistence: mirror the Stripe session `consent`,
   `consent_at`, `consent_version` metadata into `app_metadata` so the checkout
   acceptance is recorded per account (the checkout route already stamps Stripe
   metadata; the webhook needs to copy it).
4. Customer Billing Portal + `/api/portal` route + a "Manage billing" link so
   cancel is one click (matches the Refund Policy). See step 4.4 above.
5. DMCA designated agent registered, then add the agent's details to Terms §11
   and switch that section from a voluntary channel to registered safe harbor.
6. Banner removal (G5): delete the "Working draft" banners on /terms, /privacy,
   /refunds and set each "Last updated" to the launch date. ONLY in this deploy.

### Manual for Sebastien (people, not code)
- Clark County fictitious firm name filing for CineMaster Academy (the
  contracting name on these Terms), alongside the Beyond the Edge filing.
- Register the DMCA agent with the US Copyright Office (~$6, self-serve).
- Attorney hour: this gate plus the arbitration strategy decision.
- On custom-domain migration: carry acceptance records and terms versions over
  unchanged, and 301 the workers.dev legal URLs.
- When community sharing ships: STOP and expand the Terms first (public display
  license, reporting, moderation for shared content).
