# Affiliate program — ticket 716

The implementation follows the existing Luminary Resorts workflow, verified against its referral handler, discount selection, booking attribution, commission ledger, and admin payout code on October 26, 2026.

## Workflow

1. An authenticated Enchanted Havens administrator opens `/admin/affiliates`, creates a partner, and configures guest discount and commission rates. New partners default to inactive. Set active when the agreed terms are ready.
2. Share `/r/{code}`. Append `?haven=emerald-haven` to open a specific property. Codes are permanent and case insensitive. Eligible links set a first-party HttpOnly cookie for 30 days; the latest eligible referral wins. Visits count link opens, not unique people.
3. Quotes and checkout apply the partner discount to accommodation only. Both fixed USD and percentage incentives are supported. Taxes and fees remain unchanged. An explicit coupon overrides the referral offer and attribution, matching LR. A zero guest discount can still earn a commission.
4. Checkout saves the affiliate identity, original accommodation subtotal, discount, commission rate and amount in its server-side booking session. The 30-minute checkout honors these terms even if the cookie disappears during card verification or the partner is subsequently edited/deactivated.
5. Hostaway confirmation, attribution, commission creation and the confirmation outbox entry commit atomically. The unique booking-session constraint and transaction prevent duplicate commissions on concurrent/retried confirmations. Abandoned and sandbox checkouts do not earn commissions.
6. Administrators review the ledger, adjust amounts with a reason, and record owed, paid or cancelled status. This is a manual accounting record; it never sends money. Check Hostaway for cancellations, refunds and modifications before payout. Changes and actors are recorded in the audit history, while original booked terms remain immutable.
7. Export commission reports as CSV. Reports contain reservation references and stay economics but no guest contact or payment details. CSV formula injection is neutralized.

## LR alignment and adaptations

LR source reviewed: `app/api/referral/[code]/route.ts`, `lib/discounts.ts`, `lib/incentives.ts`, `lib/attribution.ts`, `lib/commissions.ts`, `app/api/payment/confirm/route.ts`, `app/api/admin/commission/[id]/mark-paid/route.ts`, and migration `003_affiliate_marketing.sql` in the local `luminary-resorts-ui-2` repository.

The 30-day last-referral model, coupon precedence, pre-discount accommodation commission basis, active/date eligibility, and manual payout tracking follow LR. Enchanted Havens uses its existing private admin authentication and native booking-session model. Terms are frozen at checkout setup rather than re-read from a mutable cookie after the reservation is created. Commission writes participate in the confirmation transaction. Unknown accommodation subtotals never fall back to including taxes or fees.

No affiliate portal, automatic payouts, automatic cancellation/refund synchronization, report emails or QR generator is included. Those are outside ticket 716's requested referral, attribution, commission and admin workflow. Changes to reservations are reconciled manually in the ledger, as in the LR MVP.

## Data and deployment

`lib/affiliate-schema.ts` supplies additive, idempotent schema setup through the existing `ensureSchema()` mechanism. `db/schema.sql` includes the same definitions for manual setup. Existing bookings have a null snapshot and keep their current behavior. Affiliates and commission records cannot be deleted through the admin UI; deactivation retains shared-code ownership and history.

All amounts are USD. Admin views, mutations and exports require an existing authenticated admin session. Public referral links expose no partner contact or financial data. The privacy page describes referral tracking.

## Validation

- `pnpm test`: pricing, referral routing, admin access, export sanitization and booking confirmation regressions.
- `AFFILIATE_TEST_DATABASE_URL=postgres://USER@localhost/eh_affiliate_test_716 pnpm exec vitest run tests/affiliate-database.test.ts`: real PostgreSQL schema, persistence, audit, coupon precedence, inactive offers, frozen terms, concurrent confirmation and manual commission updates. Use a dedicated local database whose name begins with `eh_affiliate_test`; never point this test at production.
- `pnpm typecheck`, `pnpm lint`, `pnpm build`.
- Local browser QA uses dummy partners and reservations only; no real Stripe payment, Hostaway reservation or partner payout is needed.
