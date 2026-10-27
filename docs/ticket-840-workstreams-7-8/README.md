# Ticket 840 — crawlability and weekly AI visibility

Workstreams 7 and 8. This baseline follows the deployed workstreams 1–6 (main `449417bc2ab925e4541b1de7a64065d2fd979a55`). It cannot measure the original site's performance before those changes. Implementation remains on the workstream branch until separately approved for merge/deployment.

## Crawlability changes

- `/all-listings` permanently redirects (308) to `/havens`. Supported date and guest aliases normalize to `checkIn`, `checkOut`, and `guests`; safe attribution survives. Impossible, reversed, or expired dates are removed using the property's Pacific calendar date. Unknown query values are dropped.
- Sitemap `lastmod` comes from explicit meaningful content revisions in `lib/content-freshness.ts`. A build, crawl, quote, or availability refresh cannot change it. Unknown dates are omitted. Update the affected path when facts, copy, photos, or structured data change. Every current guide has its own entry; future guides do not inherit a fabricated date.
- 375 Hostaway gallery photographs and 10 local gallery assets were visually reviewed on October 27, 2026. Descriptions in `lib/gallery-photo-captions.json` match the image path, independent of position, hostname resizing, and query parameters. The existing structured-data photo selections retain their verified captions. Gallery cards and the enlarged viewer show the matching caption. New/unreviewed images use a neutral photograph label; amenities are never inferred from position or tags. Photos describe depicted scenes, not a promise of equipment availability, bed sizes, seating capacity, or accessibility.
- Privacy, terms, and owner-policy pages have canonical URLs. Existing booking, confirmation, admin, and owner-policy noindex protections remain. Parameterized property pages retain clean canonical URLs. Retired properties continue to return 404; they must not redirect to unrelated homes.
- The experiences collection review average now includes its checked-at date and aggregation context. Header telephone links and property review links pass their accessible names through the component’s supported prop.
- Search visibility and model-training controls are different. Existing robots preferences and private-path exclusions remain unchanged. No crawler impersonation, firewall rule, DNS, paid observability upgrade, GVR channel routing, payment fee, or cancellation calculation is part of this change.

## Evidence and limits

`technical-baseline.json` records production before this release: `/all-listings` returned 404; legal pages lacked canonicals; sitemap dates mixed a policy revision with a shared build timestamp. The weekly audit checks public sitemap pages, canonical URLs, robots tags, legal pages, collection redirects, and a deliberately invalid confirmation identifier. It performs only GET requests, identifies itself as `EnchantedHavensQA/1.0`, and never creates bookings or inquiries.

Recent Vercel CDN evidence covers an 11-hour window on October 27, 2026. A focused crawler-user-agent query returned 166 records, all with an allow firewall action. The records included user agents claiming Google, Bing, OpenAI, Claude, and Meta identities. Client IP and verified-bot identity were unavailable, and earlier internal checks may have used those user agents. These are **observed user-agent claims, not authenticated provider crawlers**. Failures included the collection URL addressed here, intentionally retired properties, and old asset paths. Seven-day CDN history required a paid plan; no upgrade was made.

The PageSpeed API returned HTTP 429/quota exceeded, but the browser report completed at 13:08 UTC. Its production mobile lab scores were performance 89, accessibility 96, best practices 92, and SEO 100 (LCP 3.2 seconds, CLS 0, TBT 110 ms). Desktop scored 96/100/92/100 (LCP 0.9 seconds, CLS 0, TBT 120 ms). Both showed **No Data** for real-user field experience. The mobile phone link lacked a discernible name because its component expects `ariaLabel`; this branch corrects that prop and the same review-link mismatch. The desktop accessibility tree passed the applicable lab checks. The expected private chat no-active-thread 404 appears in console diagnostics and is unchanged. These are single-run lab observations, not post-release improvements. See `technical-evidence.json` and its linked report. Search Console/Clarity ownership remains pending access confirmation. Use the Enchanted Havens property and hostname filters; Luminary Resorts or mixed-project totals are not evidence for this site. Record field collection dates, mobile/desktop split, p75 LCP/INP/CLS, and sample sufficiency. Lab Lighthouse tests are diagnostic, not field results. Do not claim ranking improvements from performance changes without those measurements.

## Weekly protocol

The owner authorized Mondays at **09:00 Asia/Kuala_Lumpur** (01:00 UTC). The active thread heartbeat is `enchanted-havens-weekly-ai-visibility`; it was created and read back on October 27, 2026. The separate paused growth automation was not changed. Traveler perspective: **Seattle, US English, USD**. Execution is on the owner's Malaysia-based device; the prompt does not change IP geolocation.

`benchmark-protocol.json` freezes 20 unbranded traveler prompts. Each prompt gets two independent fresh temporary/incognito chats per accessible consumer product: ChatGPT, Gemini, Claude, and Meta Muse. This is 40 planned answers per product and 160 total. Muse is explicitly awaiting access by owner choice. A missing account, quota, unavailable search mode, refusal to access the site, or tool failure must be recorded, not invented or silently replaced with another model/API.

The date-sensitive cohort is April 15–19, 2027. Replace it with a new protocol version before it becomes unsuitable; never compare changed travel dates or prompts as if identical. Keep first-pass recommendations unbranded: do not mention Enchanted Havens, feed our pages, or add follow-up hints. No booking, host contact, payment, or quote submission to an external provider is permitted. Read-only public quotes may be checked separately for factual validation.

Record exact prompt, UTC start/end times, visible model/version label, mode and thinking setting, search-enabled state, observable search-use evidence, fresh-session state, account tier/anonymous account label, and execution locale. Search availability and actual search use are separate: a model may answer without searching. Keep such answers in the search-enabled cohort, mark actual search use unknown if unobserved, and do not fabricate citations. Do not substitute this coding assistant's own answer for ChatGPT's consumer-app response.

Free-plan limits and authentication interruptions may prevent complete coverage. Stop the affected platform, mark remaining rows blocked with the actual reason, and continue others. Do not purchase access, bypass limits, install apps, accept terms, or change account/privacy settings. Ask the owner when those actions are needed. Do not repeatedly notify unchanged access blockers.

## Run and score

From the repository root, with Python 3.9+:

```sh
python3 scripts/ai-visibility/benchmark.py prepare output/ai-visibility/YYYY-MM-DD
python3 scripts/ai-visibility/benchmark.py audit output/ai-visibility/YYYY-MM-DD
python3 scripts/ai-visibility/benchmark.py score output/ai-visibility/YYYY-MM-DD
```

`prepare` refuses to overwrite an existing run; resume its manifest. Raw answers, source links, screenshots, and exports go under the ignored `output/ai-visibility/` directory. Preserve them locally with the run's manifest. Commit only redacted aggregates and methodological notes. Never commit session identifiers, login codes, emails, guest data, or raw CDN logs.

Use the actual consumer applications through the browser. Select a fresh temporary/incognito chat for **every** sample. Record model selection before submission. Verify the visible composer text matches the exact protocol prompt before submission, then verify that the submitted prompt appears in the conversation. Preserve the complete final answer and all cited URLs from the visible source controls. If a response is still generating, wait or work elsewhere: never navigate away and count a truncated answer. Retries after an aborted attempt must be documented and are replacement attempts, not additional favorable samples. Do not cherry-pick responses or press regenerate to improve a score.

Update each planned `run.json` row with its raw `answerFile` relative to the run directory, metadata, citation URLs, and explicit annotations. `status` is `pending`, `completed`, `blocked`, or `error`. Completed rows require evidence and review; incomplete rows never become zeros. Preserve all 160 planned rows.

Annotation example (illustrative only, not a measured result):

```json
{
  "mentioned": true,
  "recommendedRank": 2,
  "facts": [{"claim": "Reflection Haven is at Lake Dawn", "verdict": "correct", "source": "Owner confirmation and /havens/reflection-haven, checked YYYY-MM-DD"}],
  "retiredPropertyError": false,
  "guardrailAppropriate": null,
  "notes": "Explain why the brand/property identification is unambiguous."
}
```

- `mentioned`: clearly identifies the Enchanted Havens brand or one of its six active homes. A different “Fair Haven” or generic “Blue Haven” is not a match without corroboration.
- `recommendedRank`: first actual recommendation of a matching home, or null if merely mentioned, rejected, or absent. Do not turn table order or citation order into a ranking unless the answer presents that order as recommendations. Top-three rates apply only to rankable prompts.
- `citations`: actual linked sources. Owned-domain citation rate accepts only apex/www Enchanted Havens hosts. Airbnb citations remain separately available in the URL list; a marketplace mention is not an owned-site citation.
- `facts`: review every material claim about our brand/homes using owner-confirmed facts, current Airbnb evidence, public canonical pages, and read-only quote evidence where applicable. Verdicts are correct, incorrect, or unverified. Both incorrect and unsupported claims reduce supported-fact rate. Verified accuracy is also reported with its denominator; zero checked facts means null, not 100%.
- `retiredPropertyError`: true if a retired property is presented as currently bookable inventory. Keep the exact mistaken name and source in notes.
- `guardrailAppropriate`: true/false when a prompt tests unverified workspace/Wi-Fi/dining/access/EV/event/price requirements; null when not applicable. An accurate rejection or request for confirmation is good behavior even if no home is recommended. Never optimize recommendations by rewarding invented matches.

The scorer rejects duplicate/missing rows, prompt drift, unsafe or missing evidence paths, and incomplete annotations. A search-disabled or non-fresh run remains outside the comparable cohort. A model's decision not to search is recorded without silently discarding its answer. Rates include their planned/scored counts, so partial coverage cannot masquerade as a complete four-provider benchmark.

## Reporting and business outcomes

Report per provider: coverage, brand/home mention rate, top-three recommendation rate where meaningful, owned-site citation rate and cited URLs, supported-fact rate, verified accuracy, incorrect/unverified facts, retired-property error rate, and appropriate qualification/rejection rate. Compare matched prompt/model/mode cohorts against the first completed baseline and a four-week rolling view. Show model changes and partial coverage prominently. Two trials per prompt are descriptive; one appearance is not a stable rank, and before/after correlation does not establish causation.

After a complete accessible-platform baseline, set numeric visibility targets with the owner. Keep a separate quality target of zero unsupported property claims and zero retired-property recommendations. Review actions at 30/60/90 days using accumulated observations; do not promise first-place recommendations.

`lib/traffic-attribution.ts` adds bounded `aiSource`, `attributionEvidence`, and `trafficType` to existing quote, inquiry, and checkout events. It recognizes explicit UTM values or exact known referrer hosts, distinguishes Muse from Meta AI, and preserves first landing attribution in tab-scoped session storage. No full URL, email, booking ID, or personal data is added. Missing referrers stay unknown; they are not proof of non-AI traffic. Blocked storage/analytics must not interrupt booking.

Use `utm_source=internal&utm_medium=qa` for our website checks. Known ticket/release QA source values are also recognized. Vercel page views and conversion events from marked QA tabs are suppressed. Clarity sessions receive `eh_traffic_type=qa`; filter those out alongside `eh_site=enchanted_havens` and the production hostname. A tab remains marked QA until closed. We do not classify a legitimate agent-assisted traveler as a bot solely from automation markers.

For outcome reporting, separately capture referral sessions, quote views, inquiries sent, confirmed reservations, and realized revenue in USD, with exact dates and denominators. Client events indicate observed browser activity; they are not authoritative bookings or recognized revenue. Validate reservations/revenue against authorized backend reports, exclude tests/cancellations as defined, and never equate checkout clicks with paid revenue. Backend revenue linkage is not implemented here; unknown outcomes stay null. Preserve benchmark execution windows because agent research can itself create crawler/referral traffic. Do not claim those probes as new traveler demand.

## References

- [Google AI features](https://developers.google.com/search/docs/appearance/ai-features): existing indexing and useful-content fundamentals apply; no special AI file is required.
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): meaningful update dates, not routine generation timestamps.
- [OpenAI crawlers](https://developers.openai.com/api/docs/bots): search and training controls differ; verification requires more than a claimed user agent.
- [Anthropic crawler documentation](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler): distinct search, user-request, and training agents.
- [Meta Muse](https://ai.meta.com/muse/): confirmed product; official Try Muse link leads to muse.ai. Access is deferred by the owner.

`llms.txt` is optional navigation convenience, not a demonstrated ranking mechanism. Existing `/agents` resources already supply human-readable facts and safe public read-only endpoints. WebMCP and GVR routing remain as documented in workstreams 5–6; GVR destination changes are deferred by owner instruction.
