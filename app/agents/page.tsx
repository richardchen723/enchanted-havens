import Link from "next/link"
import { shareMetadata } from "@/lib/seo-metadata"
import { STAY_LIMITS } from "@/lib/public-stay-request"

export const metadata = shareMetadata({ title: "Travel Planner Resources", description: "Confirmed property facts, live USD stay quotes, and shareable booking links for travel planners and AI assistants.", path: "/agents" })

export default function AgentsPage() {
  return <div className="bg-[#faf7f0] pb-24 pt-40 text-[#173c33]">
    <div className="container-shell max-w-5xl">
      <p className="eyebrow text-[#805a27]">Travel Planner Resources</p>
      <h1 className="mt-5 font-display text-5xl leading-none sm:text-7xl">Plan a stay with facts you can check.</h1>
      <p className="mt-7 max-w-3xl text-lg leading-8 text-black/65">Travel planners and AI assistants can compare our six Pacific Northwest homes, check a specific stay, and pass the selected home, dates, and guest count to the guest for booking. All prices are in USD.</p>
      <div className="mt-9 flex flex-wrap gap-4"><a className="button-primary" href="/agent/catalog">Read the property catalog</a><a className="button-outline" href="/agent/openapi.json">OpenAPI specification</a></div>
      <section className="mt-16 border-t border-black/15 pt-9">
        <h2 className="font-display text-4xl">From a recommendation to a dated quote.</h2>
        <ol className="mt-6 list-decimal space-y-5 pl-6 leading-8 text-black/65">
          <li>Read <a href="/agent/catalog" className="underline">/agent/catalog</a>. Match the guest’s needs to verified sleeping arrangements, access, amenities, and capacity. Keep each home’s source links and fact-check dates with your recommendation.</li>
          <li>Call <code>/agent/search?checkIn=YYYY-MM-DD&amp;checkOut=YYYY-MM-DD&amp;guests=2</code> to check homes that can accommodate the party. Dates use local Pacific time.</li>
          <li>Call <code>/agent/quote?listingId=146889&amp;checkIn=YYYY-MM-DD&amp;checkOut=YYYY-MM-DD&amp;guests=2</code> for a single home. Use the listing ID from the catalog.</li>
          <li>Show the exact dates, guest count, USD total, included fees and taxes, and when the quote was generated. Use the returned property or booking URL to hand off to the guest.</li>
        </ol>
      </section>
      <section className="mt-14 border-t border-black/15 pt-9">
        <h2 className="font-display text-4xl">Read availability precisely.</h2>
        <div className="mt-7 grid gap-7 sm:grid-cols-3">
          {[['Available', 'The calendar and price were confirmed when checked. A quote does not hold dates.'], ['Unavailable', 'The selected stay does not pass the current calendar or stay rules. Try other dates.'], ['Unknown', 'The calendar or price could not be confirmed. Retry or ask the stay team; do not describe the home as sold out.']].map(([title, body]) => <div key={title}><h3 className="text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-black/65">{body}</p></div>)}
        </div>
        <p className="mt-7 text-sm leading-7 text-black/65">A partial search may contain all three outcomes. HTTP 400 indicates invalid inputs, 404 an unknown home, 409 an unavailable stay, 429 a request limit, and 503 a temporary problem. Follow Retry-After when supplied.</p>
      </section>
      <section className="mt-14 border-t border-black/15 pt-9">
        <h2 className="font-display text-4xl">Fresh prices and a clear handoff.</h2>
        <div className="mt-6 space-y-4 leading-8 text-black/65">
          <p>Each response includes generatedAt and expiresAt. The catalog refreshes at most hourly; individual facts and review snapshots carry their own check dates. Live quote responses are not cached. Refresh quotes after five minutes and availability observations after one minute.</p>
          <p>Quotes show the standard public rate. Applicable coupons, referral offers, and optional extras are confirmed in the guest’s checkout. Read each component’s includedInTotal flag before adding it to a total; do not add included charges a second time. The pet policy is supplied with the quote.</p>
          <p>Availability and the final price are checked again at checkout. These read-only endpoints cannot reserve a home, charge a card, or hold inventory. Guests complete booking and consent in the website’s checkout.</p>
          <p>Requests support up to {STAY_LIMITS.maxNights} nights, ending within {STAY_LIMITS.maxAdvanceDays} days. Live request limits are {STAY_LIMITS.requestsPerMinute} per minute per connection per server instance. Send one request at a time, honor retry guidance, and avoid bulk polling.</p>
          <p>Use the returned URLs to preserve dates, total guests, and valid campaign attribution. Standard utm_* fields, gclid, fbclid, and msclkid are accepted. Do not send guest names, email addresses, payment information, or other personal data to this interface.</p>
        </div>
      </section>
      <p className="mt-14 border-t border-black/15 pt-8 leading-8">For a stay outside these limits or a requirement that needs confirmation, <Link href="/contact" className="underline underline-offset-4">contact the stay team</Link>.</p>
    </div>
  </div>
}
