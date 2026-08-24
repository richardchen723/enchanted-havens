# Enchanted Havens Growth Report

Run date: 2026-08-24 (Asia/Kuala_Lumpur)
Status: two owned-site experiments deployed to production from commit `0196a5d`; no Clarity or Hostaway account change made

## Executive outcome

This run repaired the largest actionable measurement gap and converted a demonstrated mobile friction point into four qualified discovery journeys. Future Clarity sessions can be isolated to Enchanted Havens and filtered by safe property, variant, placement, and funnel-stage labels. On `/havens`, proof points that produced dead taps now lead to the full collection, destinations, 12-guest options, and waterfront options with explicit conversion tracking.

These changes target booking intent, not session volume. They reached production at 2026-08-24 10:06:12 +08, so measured impact is not yet available.

## Clarity evidence

### August 18–24 versus August 11–17

| Metric | Aug 18–24 | Aug 11–17 | Direction |
| --- | ---: | ---: | --- |
| Sessions | 724 | 834 | -13.2% |
| Unique users | 580 | 664 | -12.7% |
| Pages/session | 2.49 | 2.40 | +3.8% |
| Average scroll | 46.99% | 48.57% | -1.58 pp |
| Active time | 1.5 min | 1.3 min | +0.2 min |
| Total time | 3.5 min | 3.9 min | -0.4 min |
| Dead-click sessions | 122 / 16.85% | 126 / 15.11% | +1.74 pp |
| Quick-back sessions | 140 / 19.34% | 126 / 15.11% | +4.23 pp |
| Rage-click sessions | 3 / 0.41% | 0 | low volume, higher |
| New / returning | 77.90% / 22.10% | 77.82% / 22.18% | essentially flat |

Clarity excluded 35 bots in the current window and 73 in the comparison window. The project also recorded pages on Urban Stays and Oasis, so the totals are contaminated across domains. They are reported as observed, not as a clean Enchanted Havens performance baseline.

### Acquisition, device, and landing segments

- Current source counts were Google 139, Linktree 112, Instagram 84, direct 35, ChatGPT 25, and Wanderlust 15. Clarity channel counts were Other 355, Referral 207, Organic Search 134, Direct 35, Social 17, and AI Platform 4. Clarity's source/channel classifications are not mutually interchangeable.
- Google referrer sessions were 130 versus 152 in the prior window (-14.5%); Linktree was stable at 112 versus 108. Instagram referrer sessions increased to 70 from 15, and the current source view reported 84 Instagram sessions.
- Mobile accounted for 558 sessions (77.18%), PC 151 (20.89%), and Other 14 (1.94%). Mobile Safari plus the Instagram in-app browser accounted for most current sessions; Instagram-app share rose while Mobile Safari share fell.
- Top Enchanted Havens entry pages were `/` (184), `/havens` (136), Sea-Renity (75), The Cove Club (60), Full Estate (41), and Blue Haven (36). Sea-Renity grew sharply versus the comparison window while Blue Haven and Full Estate fell. This is an observed mix shift, not a causal result.
- New/returning share remained flat. Property-level conversion and reliable source-by-property comparison were unavailable because existing API events carried no Clarity labels.

### Intent and booking signals

Current `eh_*` session counts included 149 stay quotes, 121 searches started, 106 searches completed, 16 no-result searches, 116 stay selections, 73 availability CTA clicks, 10 book-now clicks, 10 checkout starts, 3 checkout submissions, and 3 checkout confirmations. Clarity also showed two Purchase sessions. No booking value was available, so attributable guest revenue could not be calculated.

The prior window contained only 16 search-start events and 15 quote events. Because the repository has no durable deployment timestamp and the event set appears only sparsely in that window, the event increase is treated as instrumentation availability rather than acquisition lift.

No funnel was configured in Clarity. The account is ready for a hostname-filtered funnel after deployment: `eh_stay_search_started` → `eh_stay_quote_viewed` → `eh_checkout_started` → `eh_checkout_submitted` → `eh_checkout_confirmed`, with an inquiry branch through `eh_stay_inquiry_clicked` and `eh_stay_inquiry_sent`.

### Heatmaps, recordings, and errors

- The mobile `/havens` heatmap had 408 pageviews and 1,379 taps. Calendar-forward, guest-plus, “Add date,” and “Search stays” controls were the leading targets, confirming exact-date search as the main on-page intent.
- Its dead-click view showed 43 dead taps across 17 elements. “7 havens” caused 13 and “6 waterfront havens” caused 7, directly supporting experiment EH-2026-08-24-02.
- Scroll reach was 78.19% at 10% depth, 50.25% at 40%, 40.44% at 50%, 8.33% at 75%, and 1.72% at the bottom. Search and inventory remain appropriately early on the page.
- A high-intent Linktree/Instagram mobile recording entered `/havens`, searched for 40 guests and late-October dates, revisited The Cove Club Full Estate, checked availability, opened an inquiry, and reached secure reservation without completing it. Clarity's generated summary and the visible playback agreed on the sequence; they did not establish the reason for abandonment.
- A Google Vacation Rentals mobile recording entered Blue Haven with `utm_source=google&utm_medium=vacation_rentals` but no dates or guest count in the landing URL. The guest selected dates almost immediately, compared Blue Haven with Sea-Renity, and reached checkout. This supports verifying whether the external feed can preserve exact-date parameters, but does not prove that every GVR link drops them.
- Current JavaScript errors affected 1.66% of sessions (16 errors): half referenced `window.webkit.messagehandlers`, 43.75% were generic script errors, and one referenced a stale Java bridge. These cluster around embedded browsers; repository evidence is insufficient to attribute them to Enchanted Havens code. The prior window also contained three invalid `LatLng` errors that were absent in the current window.
- Performance scored 84/100 versus 81/100. Current LCP was 2.5s and INP 210ms (both “needs improvement” in Clarity), while CLS improved to 0.027 (“good”). The sample was 111 current pageviews versus 151 prior.

## Market and search evidence

- Washington visitation was nearly flat in 2025 (+0.1%), visitor spending grew only 0.9%, overnight/international demand declined, and hotel demand fell 1.1%. The implication is to compete for qualified overnight demand and direct-booking share rather than broad traffic. [State of Washington Tourism](https://industry.stateofwatourism.com/new-tourism-report-indicates-slowing-visitation-for-state-of-washington/)
- Olympic National Park's August 7 conditions update said Lake Crescent was open while Mora Road was closed July 8–October 15, limiting Rialto Beach access via Mora. Near-term Olympic planning content should stay route-specific and date-stamped. [National Park Service current road conditions](https://home.nps.gov/olym/planyourvisit/current-road-conditions.htm)
- September demand hooks include the GOAT Run and Salmon Stroll near Lake Crescent on September 12, plus Whidbey's Oak Harbor Music Festival September 4–6 and DjangoFest September 15–20. These are inventory-gap opportunities, not grounds for thin event pages. [Visit Port Angeles events](https://www.visitportangeles.com/events/) and [Whidbey & Camano Islands calendar](https://whidbeycamanoislands.com/calendar/2026-09/)
- Washington State Ferries recommends reservations on Port Townsend/Coupeville; fall vehicle reservations for September 20–December 26 were released July 21. This is useful conversion-support information for Whidbey pre-arrival journeys. [Washington State Ferries](https://wsdot.wa.gov/travel/washington-state-ferries)
- Broad Lake Sutherland, Hood Canal, and Whidbey searches remain crowded by Airbnb, Vrbo, and specialists. Hood Canal Vacations leads with “book direct and save” plus intent-specific property collections; Hood Canal Resort and Monarch Vacation Rentals foreground waterfront features, hot tubs, private beach, and group fit. Enchanted Havens already has strong core destination/property pages, so this run did not add generic or duplicative landing pages. [Hood Canal Vacations](https://hoodcanalvacations.com/), [Hood Canal Resort](https://hoodcanalresort.com/), and [Monarch Vacation Rentals](https://www.monarchvacations.com/)

## Changes made

### EH-2026-08-24-01 — measurement and attribution

- Added queued `eh_site=enchanted_havens` and `eh_hostname` Clarity custom labels for all allowed production-host sessions.
- Added a strict custom-label allowlist to existing conversion tracking. It includes property, variant, location/placement, source path, guest/night/result counts, selected intent, and funnel stage.
- Explicitly excluded dates, inquiry IDs, chat thread IDs, contact details, payment details, and unapproved arbitrary fields.
- Preserved the existing Vercel Analytics payload and `eh_*` event names; every Clarity operation remains failure-isolated from guest conversion behavior.
- Microsoft documents custom labels through `window.clarity("set", key, value)` and supports filtering them as Custom Labels. [Clarity client API](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api) and [filters overview](https://learn.microsoft.com/en-us/clarity/filters/clarity-filters)

### EH-2026-08-24-02 — mobile collection discovery

- Converted all four collection proof points into accessible, visibly actionable internal links.
- Routed them to all havens, settings, 12-guest results, and waterfront results.
- Added `eh_collection_stat_clicked` with stat, destination, and placement labels, enabling downstream intent measurement.

## Files changed

- `app/layout.tsx`
- `app/havens/page.tsx`
- `components/microsoft-clarity.tsx`
- `components/tracked-contact-link.tsx`
- `lib/analytics.ts`
- `lib/collection-seo.ts`
- `tests/analytics.test.ts`
- `tests/conversion-analytics.test.ts`
- `tests/collection-seo.test.ts`
- `e2e/site.spec.ts`
- `docs/marketing-agent/experiment-ledger.md`
- `docs/marketing-agent/latest-report.md`

## Verification

- Targeted Vitest: 13 tests passed across analytics, conversion analytics, and collection SEO.
- Full Vitest: 27 files and 167 tests passed.
- Playwright journey regression: the new proof-point test passed in desktop Chromium and mobile WebKit (2/2).
- ESLint: passed.
- TypeScript `tsc --noEmit`: passed.
- Next.js 16.2.9 production build: passed; 74 static pages generated and all dynamic routes compiled.
- Rendered QA: all four proof points were visible with the expected label and destination; the responsive journey test confirmed mobile navigation.
- GitHub: commit `0196a5d` pushed to `origin/main`.
- Vercel: Git-triggered production deployment `dpl_Cih5W47HxAKzCFoVP3ZtyUMpEwp9` reached Ready and received `www.enchantedhavens.com`, `enchantedhavens.com`, `book.enchantedhavens.com`, and the project aliases.
- Production smoke test: `/havens`, `/destinations`, the 12-guest collection URL, and the waterfront collection URL returned HTTP 200; live HTML contained all four proof-point destinations plus `eh_site` and `eh_hostname` Clarity tags.

## Deployment completed and remaining approvals

### 1. Deploy the two owned-site experiments — completed

- Audience: all Enchanted Havens visitors; analysis priority is mobile Google/GVR/Instagram/Linktree traffic.
- Budget: $0 media spend; normal deployment only.
- Destination URLs: `https://www.enchantedhavens.com/havens`, `https://www.enchantedhavens.com/destinations`, `https://www.enchantedhavens.com/havens?guests=12#collection`, and `https://www.enchantedhavens.com/havens?experience=waterfront#collection`.
- Result: approved by the user and deployed through the GitHub/Vercel integration. The observation clock starts at 2026-08-24 10:06:12 +08.

### 2. Configure Clarity reporting after deployment

- Audience: all Enchanted Havens sessions tagged `eh_site=enchanted_havens`.
- Budget: $0.
- Publish-ready configuration: save an Enchanted Havens segment using `eh_site=enchanted_havens`; create the five-step booking funnel listed above; create the inquiry branch; apply the hostname segment to dashboards, heatmaps, and recordings.
- Approval request: approve these Clarity account changes. No account settings were changed in this run.

### 3. Verify Google Vacation Rentals exact-date handoff

- Audience: high-intent guests clicking free booking links with dates and party size already selected.
- Budget: $0; no paid campaign recommended from the present evidence.
- Required destination contract: `https://www.enchantedhavens.com/havens/{property-slug}?checkIn={YYYY-MM-DD}&checkOut={YYYY-MM-DD}&guests={integer}&utm_source=google&utm_medium=vacation_rentals&utm_campaign=free_booking_links`.
- Concrete QA URL: `https://www.enchantedhavens.com/havens/blue-haven?checkIn=2026-09-12&checkOut=2026-09-14&guests=2&utm_source=google&utm_medium=vacation_rentals&utm_campaign=free_booking_links`.
- Approval request: approve inspection of the Hostaway/Google Vacation Rentals booking-link template and, only if supported merge fields are available, update it to the canonical contract above. The placeholder syntax must be mapped to Hostaway's actual fields before saving.

## Next run

Use the recorded production cutoff, verify `eh_site`/`eh_hostname` coverage, create or review the Clarity funnels if approved, and compare property/source/device/new-returning behavior. Recheck mobile `/havens` dead taps and stat-link downstream intent, then audit at least five GVR and five Instagram/Linktree exact-date sessions. Do not judge either experiment before its sample floor.
