# CMA Studio Pro — Supabase + Stripe go-live checklist

The code is done. These steps need **your** accounts and keys (I can't enter
financial/service credentials for you). Do them once and the paywall + the
visitor/member pricing states go live.

---

## 1. Supabase (auth + entitlement store)

1. Create a project at supabase.com (or reuse one).
2. **Authentication → Providers → Email**: enable it. (Optionally disable "Confirm
   email" while testing.)
3. **Project Settings → API** — copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` **(server secret — never public)**
4. No tables/SQL required: entitlement lives in each user's `app_metadata.cma_plan`,
   written only by the Stripe webhook via the service-role key (users can't edit it).

## 2. Academy gate

Set `NEXT_PUBLIC_ACADEMY_ALLOWED_DOMAINS` to the email domain(s) allowed in, e.g.
`cinemasteracademy.com`. Blank = fails closed in production.

## 3. Stripe (Cinemaster Academy account)

1. **Products** → create products with **recurring Prices**. Create one Price per
   tier + cycle and copy each Price ID (`price_...`):
   | Env var | What |
   |---|---|
   | `STRIPE_PRICE_STUDENT_YEARLY` | Student, $19.99/mo billed yearly |
   | `STRIPE_PRICE_STUDENT_MONTHLY` | Student, $29.99/mo |
   | `STRIPE_PRICE_PRO_YEARLY` | Pro, $35.99/mo billed yearly |
   | `STRIPE_PRICE_PRO_MONTHLY` | Pro, $39.99/mo |
   | `STRIPE_PRICE_EXT` | Extension, $5.99/mo |
   | `STRIPE_PRICE_EXT_PLUS` | Extension+, $14.99/mo |
   (Studio is "Talk to us" — no price needed. Extension **benefits** are still TBD;
   the Price is just the charge.)
2. **Developers → API keys** → copy the secret key → `STRIPE_SECRET_KEY`.
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://<your-domain>/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`
   - Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`.
4. Set `NEXT_PUBLIC_SITE_URL` to your deployed URL (for checkout redirects).

## 4. Turn the paywall on

Set `CMA_REQUIRE_ENTITLEMENT=true`. Now `/api/generate` returns **402** for any
signed-in user without an active `cma_plan` — i.e. rendering requires a paid
subscription. (Leave it `false` while you test the flow.)

## 5. Deploy

On Cloudflare Pages, add ALL the above as environment variables in the
**Production** build environment (the `NEXT_PUBLIC_*` ones are inlined at build,
so they must be present when it builds). Redeploy.

---

## How the flow works (for reference)

1. Signed-in user clicks a plan on `/pricing` → `POST /api/checkout` verifies their
   session, resolves the **Stripe Price server-side** from the tier id (they can't
   tamper the amount), and creates a Checkout Session bound to their Supabase user id.
2. They pay on Stripe's hosted page.
3. Stripe calls `/api/stripe/webhook`. We **verify the signature** (forged events are
   rejected), then write `app_metadata.cma_plan = { tier, status, expires, … }` for
   that user with the service-role key.
4. `verifyAccess()` (on every render) and the pricing page now see the active plan:
   the tool works and the pricing page shows the **member** state (base plans hidden,
   extensions buyable).
5. Subscription cancel/expiry events flip the status → access is revoked automatically.

### Local testing without deploying
Use the Stripe CLI: `stripe listen --forward-to localhost:4220/api/stripe/webhook`
(gives you a temporary `whsec_...` for `STRIPE_WEBHOOK_SECRET`), then
`stripe trigger checkout.session.completed`.
