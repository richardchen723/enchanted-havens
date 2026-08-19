# Enchanted Havens

The direct-booking website for Enchanted Havens, a private Pacific Northwest resort collection. Built with Next.js App Router, Hostaway, Stripe SetupIntents, Postgres, Gmail SMTP, and Vercel.

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The catalog remains browsable without service credentials. When live pricing or direct checkout is unavailable, the site keeps guests onsite and routes the selected home, dates, and guest count into an inquiry instead of redirecting to another booking engine.

## Environment

See `.env.example` for the full list. Production requires:

- `POSTGRES_URL` for managed Postgres
- Hostaway client credentials and API base URL
- Stripe secret/publishable keys and webhook secret
- Gmail user, app password, and configured inquiry recipient
- `NEXT_PUBLIC_SITE_URL=https://enchantedhavens.com`
- `BOOKING_WRITE_MODE=live` only after the controlled launch reservation passes

Use `BOOKING_WRITE_MODE=staging` with Stripe test keys and `BOOKING_STAGING_LISTING_ID` to constrain real Hostaway reservation writes during launch testing. Run `pnpm staging:preflight` before starting the staging build; it verifies Postgres, Stripe test mode, the allowlisted Hostaway listing, and Gmail authentication without creating a reservation. Preview deployments should leave writes disabled.

Use `BOOKING_WRITE_MODE=sandbox` only with Stripe test keys (`pk_test_...` and `sk_test_...`) to exercise the full native card-saving journey without creating a Hostaway reservation.

For production, prefer a Stripe restricted live key (`rk_live_...`) with only Customer and SetupIntent read/write access. Configure the live publishable key, live webhook signing secret, production Postgres connection, canonical site URL, Hostaway credentials, and Gmail delivery before setting `BOOKING_WRITE_MODE=live`. Pull those production variables into `.env.production.local` and run `pnpm production:preflight`; it performs read-only service checks and does not create a customer, payment method, reservation, or charge.

## Booking contract

Checkout creates a Stripe Customer and off-session SetupIntent. It does not collect payment. Confirmation then rechecks live availability, recalculates the authoritative Hostaway quote, and creates a direct Hostaway reservation with `channelId: 2000` and `isPaid: 0`.

Booking sessions are idempotent and expire after 30 minutes. Only Stripe identifiers and explicit consent metadata are stored; card details never touch the application database. If Hostaway availability or pricing cannot be verified, booking is disabled rather than inferred from the catalog snapshot.

## Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm staging:preflight
```

Install browser binaries once before the Playwright suite:

```bash
pnpm exec playwright install chromium webkit
```

## Data and operations

- Hostaway is the source of truth for listing facts, photography, calendars, quotes, reviews, and reservations.
- Catalog responses cache for one hour; reviews cache for six hours; checkout quotes are never cached.
- The latest successful normalized catalog is persisted to Postgres for read-only outage browsing.
- Stripe and Hostaway webhook events are persisted for audit and reconciliation.
- Contact submissions are stored in Postgres and delivered through Gmail SMTP.
- Legal, cancellation, payment-authorization, and house-rule language must be approved before production writes are enabled.

## Launch gate

Before DNS cutover, create and cancel one controlled production reservation and verify Hostaway calendar blocking, Stripe payment-method storage, the confirmation email, webhook delivery, and mobile checkout. Legacy `book.enchantedhavens.com` traffic should permanently redirect into the canonical Enchanted Havens journey.
