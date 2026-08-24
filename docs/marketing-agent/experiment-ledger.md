# Enchanted Havens Growth Experiment Ledger

Last updated: 2026-08-24 (Asia/Kuala_Lumpur)

This ledger is the durable source of truth for owned-site guest-acquisition experiments. Revenue and qualified direct-booking intent take priority over raw traffic. Production deployment, paid media, pricing, availability, Hostaway, Clarity account configuration, outreach, and sends require explicit approval.

## Measurement notes

- Clarity project `m287918n0w` currently includes Enchanted Havens and unrelated Urban Stays/Oasis traffic. Pre-deployment totals below are therefore directional until an Enchanted Havens hostname segment is applied.
- Existing `eh_*` events first appear sparsely in the August 11–17 comparison window. Event-count changes across that boundary are not treated as experiment lift.
- Clarity reports session behavior and event/session counts, but no attributable booking value was available in this run. `eh_checkout_confirmed` is a direct-booking completion proxy, not guest revenue.

## Experiments

### EH-2026-08-24-01 — Clarity attribution dimensions

- Status: running; awaiting production deployment
- Decision date: no earlier than 2026-09-07, or after at least 20 `eh_checkout_started` sessions, whichever is later
- Hypothesis: if every Enchanted Havens session and existing conversion event receive privacy-safe site, hostname, property, variant, placement, and funnel-stage tags, the team can identify which acquisition and property journeys produce qualified inquiries and completed checkouts instead of optimizing mixed, unattributable sessions.
- Audience: all Enchanted Havens visitors, with primary attention to mobile Google, Google Vacation Rentals, Linktree, and Instagram arrivals.
- Primary KPI: at least 95% of post-deployment sessions containing `eh_checkout_started` also contain `eh_site=enchanted_havens`, `eh_hostname`, `eh_property`, `eh_variant`, and `eh_funnel_stage` custom labels in Clarity.
- Secondary KPIs: property- and hostname-filtered search-to-checkout funnel visibility; attributable `eh_checkout_confirmed` sessions by source, landing page, property, variant, device, and new/returning visitor.
- Baseline: 0% of `eh_*` calls carried Clarity custom labels in repository code. August 18–24 showed 10 checkout-start, 3 checkout-submitted, and 3 checkout-confirmed sessions, but property/source combinations could not be isolated reliably and the project included other domains.
- Observation window: 14 days after production deployment, extended to 28 days if fewer than 20 checkout-start sessions occur.
- Success threshold: tag coverage at least 95%, a hostname-filtered funnel can be built without mixed-domain sessions, and no new analytics-caused client exception appears.
- Continue/scale rule: continue while coverage is below the sample threshold; scale by using the labels in recurring property/source reporting after success.
- Revise rule: revise if labels are missing from more than 5% of eligible sessions or tag values are too high-cardinality to filter usefully.
- Stop/rollback rule: roll back the tag calls if they cause a client exception, block a conversion handler, or expose dates, internal inquiry IDs, chat thread IDs, contact data, or payment data.
- Implementation: `components/microsoft-clarity.tsx` queues `eh_site` and `eh_hostname` on allowed production hosts. `lib/analytics.ts` forwards only a bounded allowlist of non-PII event dimensions and a defined funnel stage before the existing event. Dates and internal IDs remain excluded.
- Measured impact: not yet measurable; changes are local and have not been deployed.

### EH-2026-08-24-02 — Collection proof-point journeys

- Status: running; awaiting production deployment
- Decision date: no earlier than 2026-09-07 and after at least 200 mobile `/havens` pageviews
- Hypothesis: if the proof-point cards that guests already tap become clearly styled, tracked links to the full collection, destinations, 12-guest results, and waterfront results, mobile guests will move into relevant inventory journeys and dead taps will fall.
- Audience: mobile visitors to `/havens`, especially Google, Linktree, and Instagram arrivals choosing by group size or waterfront setting.
- Primary KPI: at least 20% of sessions with `eh_collection_stat_clicked` subsequently record `eh_stay_selected`, `eh_availability_cta_clicked`, or `eh_stay_quote_viewed` in the same session.
- Secondary KPIs: at least 15 tracked stat-click sessions; dead taps on the four former proof-point blocks fall by at least 50%; mobile `/havens` quick-back rate does not materially worsen.
- Baseline: the August 18–24 mobile `/havens` heatmap contained 408 pageviews, 1,379 taps, and 43 dead taps across 17 elements. The two largest dead-tap targets were “7 havens” (13) and “6 waterfront havens” (7). No collection-stat click event existed. Scroll reach was 50.25% at 40% depth and 8.33% at 75% depth.
- Observation window: 14 days after production deployment, extended until 200 mobile `/havens` pageviews are reached.
- Success threshold: downstream-intent rate at least 20%, at least 15 tracked stat-click sessions, and at least 50% fewer dead taps on the former stat elements.
- Continue/scale rule: continue through the sample floor; scale the most productive intent link into other collection modules if it clears the threshold.
- Revise rule: revise labels or destinations when a link receives at least 10 clicks but fewer than 10% reach a property or availability action.
- Stop/rollback rule: restore static proof points if mobile `/havens` quick backs rise more than 5 percentage points versus the pre-deployment baseline, navigation loses query state, or any link/query fails.
- Implementation: the entire proof-point area is now an accessible Next.js link with visible “Explore” affordance, focus styling, and `Collection Stat Clicked` tracking. Destinations are `#collection`, `/destinations`, `/havens?guests=12#collection`, and `/havens?experience=waterfront#collection`.
- Measured impact: not yet measurable; changes are local and have not been deployed.

## Decision history

- 2026-08-24: first run; there were no matured experiments to continue, scale, revise, or stop.

## Next observation checklist

1. Confirm production deployment time before starting either observation window.
2. Filter Clarity to `eh_site=enchanted_havens` and compare tag coverage with untagged sessions after deployment.
3. Build the direct-booking funnel and report source/landing/property/device/new-returning splits only where Clarity supplies the dimension.
4. Recheck mobile `/havens` dead taps, quick backs, stat-link clicks, and downstream stay/availability events.
5. Inspect at least five exact-date Google Vacation Rentals journeys and five high-intent Instagram/Linktree journeys.
6. Confirm whether Google Vacation Rentals can pass exact dates and guests into the canonical on-site booking URL.
