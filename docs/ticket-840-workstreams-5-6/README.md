# Ticket 840 — reputation and read-only agent planning

Scope: workstreams 5 and 6. Prepared October 27, 2026. Production release remains a separate step.

## Owner decisions and boundaries

- The owner asked to skip personal-story/operator-name additions. The Story page and existing public business contact information are unchanged.
- Public coordinates remain approved; street addresses, guest records, access instructions/codes, internal source notes, and credentials are excluded from the new catalog.
- All prices and handoffs use USD. Payment-processing fees, payment/cancellation calculations, and reservation/payment endpoints are unchanged.
- No channel activation, DNS change, republish action, external outreach, or partnership claim was made.
- Google destination routing: confirmation decision pending owner response. Current routing remains unchanged.

## Workstream 5 — source checks and review freshness

Original Airbnb pages were opened in signed-in Chrome on October 27, 2026. The rating and review count below are the listing's displayed values, not calculated from selected testimonials. Source URLs and dashboard observations are recorded in [source-evidence.json](source-evidence.json).

| Home | Rating | Reviews | Original listing |
|---|---:|---:|---|
| Blue Haven | 4.94 | 210 | [Airbnb](https://www.airbnb.com/rooms/634384398560090584) |
| Sea-Renity Haven | 4.86 | 116 | [Airbnb](https://www.airbnb.com/rooms/862304966484869756) |
| Emerald Haven | 4.95 | 132 | [Airbnb](https://www.airbnb.com/rooms/922135705438701292) |
| Fair Haven | 4.89 | 137 | [Airbnb](https://www.airbnb.com/rooms/923125727364307502) |
| Aurora Haven | 4.93 | 119 | [Airbnb](https://www.airbnb.com/rooms/942394610289436238) |
| Reflection Haven | 4.88 | 91 | [Airbnb](https://www.airbnb.com/rooms/1294876804636674762) |

The total is 805 reviews. The website's 4.91 collection figure is explicitly labeled as a review-count-weighted average of rounded property snapshots, not an independently issued Airbnb business rating. Duplicate listing IDs no longer inflate the summary. Individual cards and property headings now show the check date, as do full review sections and guide/home summaries. Unverified thematic review summaries were removed. No aggregate rating schema or fabricated testimonial was added.

For future refreshes, read each original listing; update its rating, count, and actual ISO checked-at date together. Keep source URLs; do not advance dates when a source cannot be verified. Summaries report the oldest contributing checked-at date.

### Google Vacation Rentals inspection

Hostaway's Channel Manager shows **Google: Active**. All six active homes are **On**, associated with the Enchanted Havens booking engine, with 55–68 images each. Booking website 4346 is **Published**, and its Included tab contains exactly these six homes. Retired Reflection Point and Cove Club residences are absent from that included inventory. No other portfolio inventory was changed.

The dashboard lists `book.enchantedhavens.com` as the custom domain and `57690_2.holidayfuture.com` as the hosted site. Both are reachable. The custom domain serves the Vercel site through redirects. A read-only legacy-link test preserved Blue Haven, April 15–19, 2027, and two guests:

`https://book.enchantedhavens.com/listings/146889?checkIn=2027-04-15&checkOut=2027-04-19&guests=2`

→ HTTP 200 at the corresponding `www.enchantedhavens.com/havens/blue-haven` URL, with the same dates and guest count.

This establishes working website routing, **not Google feed approval or compatibility**. [Hostaway's current instructions](https://support.hostaway.com/hc/en-us/articles/15313739960091-Google-Vacation-Rentals-Overview), updated September 8, 2026, require the exported domain to serve a published Hostaway Booking Website. A channel marked On does not resolve that requirement. The dashboard did not expose the actual Google feed landing-page template or Google-side approval/price-accuracy diagnostics.

Before changing routing, the proposed verification is to obtain Hostaway confirmation of the exact exported URL/template for these six IDs and whether redirects to a custom API-backed checkout are supported. If unsupported, prepare a separate plan to serve a genuine Hostaway Booking Website on the chosen booking subdomain while keeping the marketing site on www. Review effects on existing links, analytics, booking API configuration, and checkout before a DNS change. No support message was sent.

### Legitimate reputation/distribution follow-up

A complete backlink audit was outside the original scan and is not claimed here. Future outreach should use a factual property sheet and original source links: relevant destination visitor directories, local business listings, and partners with an actual relationship to the homes. Confirm listing eligibility and each relationship before naming an organization or claiming endorsement. Do not buy reviews, invent awards, or claim an agent platform recommends the business. Outreach and paid directory membership require a separately specified recipient, message, and any budget.

## Workstream 6 — interface and safeguards

Discoverable through the site footer and `/agents`, with `/agents` in the sitemap:

| Endpoint | Purpose |
|---|---|
| `GET /agent/catalog` | Six active homes, stable IDs, canonical URLs, verified facts, public coordinates, photos, positive amenities, capacity, check dates, original Airbnb sources, USD |
| `GET /agent/openapi.json` | OpenAPI 3.1.1 specification with request and response schemas |
| `GET /agent/search?checkIn=...&checkOut=...&guests=...` | Per-home availability and public USD quote for each capacity-eligible home |
| `GET /agent/quote?listingId=...&checkIn=...&checkOut=...&guests=...` | One dated quote, public fee/tax components, freshness, and property/booking handoff URLs |

The interface uses existing Hostaway calendar and price-detail reads. It never calls reservation creation, card setup, payment confirmation, inquiry creation, or messaging. Catalog refresh may reuse the existing internal catalog snapshot mechanism; read-only here refers to guest, reservation, inventory, and payment effects.

`available` requires a complete usable calendar, stay-rule compatibility, and a positive USD price. `unavailable` means a confirmed calendar or stay-rule failure. Missing/malformed calendar entries, request failures/timeouts, missing price, or a non-USD rate produce `unknown`. Search exposes partial results and unknown homes explicitly. All-unknown searches return 503, not a sold-out result. Empty complete results can mean no home fits the party size.

HTTP outcomes: 400 invalid request; 404 retired/unknown listing; 409 unavailable single-home stay; 414 oversized query; 429 rate limit; 503 unknown upstream state. Responses never contain raw provider errors. Price components omit provider record IDs. Included fee/tax flags are preserved so clients do not double-count; an unspecified mandatory flag remains null rather than guessed.

Freshness: catalog up to one hour with separate factual check dates; live quote responses `no-store`, five-minute expiry; availability observations one minute. Expiry is a refresh instruction, not a price lock. The final checkout revalidates availability and price. Public agent quotes are standard rates; applicable coupons/referrals and optional extras are confirmed in checkout. The website quote route retains its existing coupon/referral handling.

Validation: actual calendar dates, Pacific local day, integer guests, owner-confirmed capacity, maximum 90 nights per request and checkout within 730 days. These are interface limits, not new property stay policies. Long stays can go to the stay team. GET queries are capped at 2048 characters, duplicated/unsupported fields rejected; JSON bodies are capped at 4096 actual bytes. Valid bounded campaign attribution is retained in handoffs. Private/internal `/api/` robots exclusions remain unchanged; the explicitly public interface is under `/agent/`.

Abuse controls: 20 live requests/minute/connection **per server instance**, bounded rate-limit memory, two homes checked concurrently per search, and a 15-second upstream deadline per home. This is not a distributed quota across Vercel instances. Edge/WAF restrictions remain useful if traffic rises; no hosting security setting was changed. No new browser CORS access was granted.

Website controls now update the address-bar dates and guest count, preserve approved attribution, and carry current selections into property, inquiry, and checkout links. Collection guest changes trigger a new price check. Unknown results get clear wording and retry controls. The property panel clears stale quotes when selections change and refreshes after expiry; checkout cannot proceed on a quote for another selection.

### Optional WebMCP assessment

[Chrome's current WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp), updated October 7, 2026, describes a proposed standard available through an origin trial from Chrome 149 and primarily intended for local browser workflows. No claim of universal ChatGPT, Claude, Gemini, or Muse support is made. This change establishes ordinary HTTP/JSON and browser handoffs first. No origin-trial enrollment, browser flag, extension, or WebMCP tool was added. A future opt-in experiment can wrap these read-only operations once a specific supported browser/agent target and measurable objective are selected.

## Validation

- Unit/regression tests: 272 passed, 6 existing integration skips.
- Production build and TypeScript passed. ESLint: only the two existing unused-variable warnings in `lib/owner-inquiries.ts`.
- [Local HTTP checks](local-http-validation.json): planner documentation, catalog, specification, invalid dates, repeated parameters, and retired inventory, without JavaScript.
- Hosted live-price and browser validation: pending below before review completion.
