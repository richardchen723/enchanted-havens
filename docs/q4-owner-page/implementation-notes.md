# Q4 owner page implementation

Release prepared for production on October 25, 2026, based on the current production commit `58ad34b`. Live deployment verification is recorded separately after rollout.

## Page and conversion flow

- Canonical route: `/vacation-rental-management`.
- `/management` permanently redirects with status 308 and retains campaign parameters.
- Full-service management is the main offer. The page uses EH's existing typography, forest/ivory palette, property photography, header, and footer.
- Three required inquiry fields: name, email, and property location. Phone and a note are optional. The form comes before call/text alternatives on mobile.
- A mobile contact bar appears after the hero and disappears when the inquiry section is visible. Guest chat and stay promotions are suppressed on owner pages.
- Header, footer, story, and property-detail links make the page discoverable within the existing site.

## SEO, GEO, and AI discovery

This was a primary implementation requirement. The page is prerendered as static HTML. Its substantive content, evidence table, source links, service descriptions, regional coverage, FAQ answers, and form are present before JavaScript executes.

The implementation includes:

- A unique title and description, absolute production canonical, Open Graph and Twitter metadata, and index/follow directives with generous snippet/image previews.
- A linked JSON-LD graph containing Organization, WebPage, Service, BreadcrumbList, and FAQPage. The organization identifier and contact information remain consistent with the site's existing entity. FAQ schema and visible answers share one data source.
- Precise service locations and property names, dated evidence, linked sources, and an explanation of the AirDNA comparison boundaries. No unsupported region-wide rankings, fabricated reviews, or guaranteed earnings.
- A canonical sitemap entry with the real content date and four images. Redirect and receipt routes are excluded.
- Public crawl access through the existing wildcard robots rule. Private/API paths retain their exclusions.
- Native HTML links, table headers, labels, headings, FAQ disclosures, and a functional non-JavaScript form POST. An agent can read the service and contact options without executing the client application.

The local production environment previously specified the old Vercel preview domain. Its `NEXT_PUBLIC_SITE_URL` was corrected to `https://enchantedhavens.com`. This local environment file is ignored by Git. The existing hosting configuration uses `https://www.enchantedhavens.com`; the release preserves that canonical origin consistently across metadata, schema, and sitemap. The repository's existing production preflight accepts both branded production origins.

No ranking, indexing, AI citation, or rich-result guarantee is implied. FAQPage markup describes the visible answers; it is not a promise of Google FAQ rich results. No speculative AI-only metadata, duplicate location pages, or `llms.txt` dependency was introduced.

## Evidence used

The page uses the verified October 25 snapshot from `evidence-register.md`: Emerald #1, Reflection #3, and Blue #5 among 774 Port Angeles listings shown; Sea-Renity #5 among 207 Oak Harbor listings; Fair #3 among 74 Belfair listings. AirDNA estimates are explicitly distinguished from owner proceeds and future results.

The owner subsequently supplied Aurora Haven's updated rank of #15 among 774 Port Angeles listings, which is included in the public table. The proof card now reads “Top 5%” across the homes' respective markets, as requested.

Instagram proof uses 42K+ followers and 400K+ views on a single Reel, supported by the linked Reel with a public count of 405K. Four individual Reel examples remain linked below. The single-Reel result replaces the arbitrary four-post sum in the headline. The copy does not claim verified local audience composition, organic acquisition, unique reach, or bookings attributed to those views. Refresh the source data and evidence date together when updating the claims in `lib/owner-management.ts`.

## Inquiry delivery

`POST /api/owner-inquiries` validates input, rejects honeypot and invalid-origin submissions, bounds request size, and applies a basic per-process IP attempt limit. It accepts JSON and native form posts. Native failures preserve and escape entered values; successful native submissions redirect to a noindex receipt page.

The server stores the inquiry in PostgreSQL before notifying the team through the existing Gmail transport. A persistent submission key and row lock prevent ordinary retries from sending another notification. The UI confirms success only after SMTP accepts a recipient. Failed delivery retains the stored inquiry and allows a retry with the same reference. As with ordinary SMTP, a crash between accepted mail and the database update can still cause a duplicate on retry.

Recipient order: `OWNER_INQUIRY_TO_EMAIL`, then `CONTACT_TO_EMAIL`, then `stays@enchantedhavens.com`. The optional owner-specific setting is documented in `.env.example`. Existing database and Gmail credentials are required; the existing schema initializer creates `owner_inquiries`. No new external service is required. The basic IP limiter is not a distributed abuse-prevention service.

Owner funnel events track intent, start, success, and error without sending form contact details to analytics. Form fields are masked for Clarity. The privacy page describes the inquiry data and optional campaign/referral attribution.

## Validation

- Original workspace unit suite: 38 files, 217 tests passed. Isolated production release: 36 files, 205 tests passed; unrelated pending checkout and marketing changes are excluded.
- Owner-specific suite: 4 files, 19 tests passed, including validation, native form submissions, delivery failure, persistent retry behavior, changed-payload rejection, recipient routing, and search metadata.
- TypeScript and optimized production build passed. Next.js reports the owner landing page as prerendered static content.
- Raw HTTP checks against the local production server passed for ordinary browsers, Googlebot, Bingbot, OAI-SearchBot, and ChatGPT-User. Each received HTTP 200, the production canonical, substantive text, all eight FAQ answers, valid linked JSON-LD, and the native form. See `crawler-validation.json`.
- Sitemap images/content date, public robots access, the 308 redirect with campaign preservation, and the noindex receipt were checked.
- Browser checks covered desktop, 390px mobile, and 320px narrow mobile, plus required-field validation and the inquiry anchor offset. No horizontal page overflow was found. Screenshots are saved alongside this document.
- Mail and persistence failure/retry tests use mocks. No real owner lead or test email was sent. Production inbox delivery and hosting crawl access still need the normal post-deployment smoke check.

## Deployment handoff

Use the existing GitHub main → Vercel production workflow. Production secrets are present in Vercel but are not exported by `vercel env pull`, so the full service preflight cannot execute locally from that export. The hosted build and live checks use the existing production configuration. Verify the hosting canonical-domain setting and the existing database/email configuration, then check the live owner page, redirect, sitemap, and recipient delivery. Verify that hosting/WAF rules allow the intended search crawlers and that the page is eligible for indexing and snippets. Submit or inspect the canonical URL through the site's search-console tooling after deployment. Local user-agent checks do not test the hosting network or prove that a search engine has indexed the page.
