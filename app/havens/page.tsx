import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { CollectionBrowser } from "@/components/collection-browser"
import { PageHero } from "@/components/page-hero"
import { SearchForm } from "@/components/search-form"
import { TrackedInternalLink } from "@/components/tracked-contact-link"
import { getCatalog } from "@/lib/catalog"
import {
  HAVENS_COLLECTION_DESCRIPTION,
  HAVENS_COLLECTION_PATH,
  HAVENS_COLLECTION_TITLE,
  buildHavensCollectionJsonLd,
  collectionTrustSignals,
  getHavensCollectionStats,
  havensCollectionFaq,
  havensCollectionKeywords,
} from "@/lib/collection-seo"
import { shareMetadata } from "@/lib/seo-metadata"
import { appendQuery, buildStayQuery, parseStaySelection } from "@/lib/stay-search"

const HAVENS_HERO_IMAGE = "/images/home-hero/heros-zip/hero-04.webp"

export const metadata: Metadata = shareMetadata({
  title: HAVENS_COLLECTION_TITLE,
  description: HAVENS_COLLECTION_DESCRIPTION,
  path: HAVENS_COLLECTION_PATH,
  keywords: havensCollectionKeywords,
  image: HAVENS_HERO_IMAGE,
  imageAlt: "Pacific Northwest private vacation rental collection across water, forest, coast, and estate settings",
  openGraphTitle: "The Havens | Pacific Northwest Vacation Rentals",
})

function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

export default async function HavensPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const selection = parseStaySelection(params)
  const checkIn = selection.checkIn || undefined
  const checkOut = selection.checkOut || undefined
  const guests = selection.guests
  const preservedQuery = buildStayQuery(params, selection)
  const experience = typeof params.experience === "string" ? params.experience : undefined
  const intent = typeof params.intent === "string" ? params.intent : undefined
  const matchedSlugs = typeof params.matches === "string" ? params.matches.split(",").filter(Boolean) : []
  const catalog = await getCatalog()
  const properties = catalog
    .filter((property) => property.slug !== "whidbey-estate")
    .sort((a, b) => a.featuredOrder - b.featuredOrder)
  const searchableProperties = [...catalog].sort((a, b) => a.featuredOrder - b.featuredOrder)
  const stats = getHavensCollectionStats(properties)
  const collectionJsonLd = buildHavensCollectionJsonLd(properties, [])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(collectionJsonLd) }} />

      <PageHero
        eyebrow="The Havens"
        title="A collection shaped by water, forest, and sky."
        body="Rare private homes on lakes, ocean bluffs, Hood Canal, and Whidbey Island, each chosen for the way the landscape changes a stay."
        image={HAVENS_HERO_IMAGE}
        imagePosition="center 52%"
      />
      <section id="availability" className="relative z-10 bg-[#f3eee3] pb-12 lg:pb-16">
        <div className="container-shell -translate-y-8 sm:-translate-y-1/2">
          <SearchForm compact initialCheckIn={checkIn} initialCheckOut={checkOut} initialGuests={guests} preservedQuery={preservedQuery} />
        </div>
        <div className="container-shell -mt-1 text-center sm:-mt-8"><p className="text-xs leading-6 text-black/60">Search exact dates, or browse the full collection below.</p></div>
      </section>

      <section className="bg-[#f3eee3] pb-16 lg:pb-20">
        <div className="container-shell grid gap-8 border-y border-[#173c33]/12 py-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={stat.label} className="md:border-l md:border-[#173c33]/12 md:pl-6 first:md:border-l-0 first:md:pl-0">
              <TrackedInternalLink
                href={stat.href}
                eventName="Collection Stat Clicked"
                data={{ stat: stat.trackingKey, destination: stat.href, location: "havens_collection_stats" }}
                className="group block rounded-sm py-1 outline-none focus-visible:ring-2 focus-visible:ring-[#805a27] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f3eee3]"
              >
                <p className="text-[0.61rem] font-bold uppercase tracking-[0.18em] text-[#805a27]">0{index + 1}</p>
                <p className="mt-3 font-display text-4xl leading-none text-[#173c33] transition-colors group-hover:text-[#805a27]">{stat.value}</p>
                <p className="mt-3 text-sm leading-6 text-black/58">{stat.label}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#173c33]">
                  Explore <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </TrackedInternalLink>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#faf7f0] py-16 lg:py-20">
        <div className="container-shell">
          <CollectionBrowser key={`${checkIn || "browse"}:${checkOut || "browse"}:${guests}`} properties={searchableProperties} initialGuests={guests} initialCheckIn={checkIn} initialCheckOut={checkOut} initialExperience={experience} initialIntent={intent} initialPropertySlugs={matchedSlugs} queryString={preservedQuery} />
          <div className="mt-16 grid gap-7 border-y border-[#173c33]/12 bg-[#f3eee3] px-6 py-8 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="eyebrow text-[#805a27]">Need a second opinion?</p>
              <h2 className="mt-3 font-display text-4xl leading-none text-[#173c33]">Let the stay team match your group to the right haven.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-black/60">Share the setting, dates, and details that matter. We will compare the collection personally without asking you to repeat your search.</p>
            </div>
            <Link href={appendQuery("/contact", preservedQuery)} className="button-primary w-fit shrink-0">Ask for a Match <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section className="bg-[#173c33] py-20 text-white lg:py-24">
        <div className="container-shell grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="eyebrow text-[#d4b47d]">Why Book This Collection</p>
            <h2 className="display-balance mt-4 font-display text-5xl leading-[0.95] sm:text-6xl">A private-resort point of view, home by home.</h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/64">Enchanted Havens is built for guests who want the Pacific Northwest to feel personal: water close enough to change the day, homes with a point of view, and a direct stay team who knows the details behind each listing.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {collectionTrustSignals.map((signal) => (
              <div key={signal.title} className="border-t border-white/18 pt-5">
                <Check className="size-5 text-[#d4b47d]" />
                <h3 className="mt-5 font-display text-3xl leading-none">{signal.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/62">{signal.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#faf7f0] py-20 lg:py-28">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="eyebrow text-[#805a27]">Planning Questions</p>
            <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33]">Useful answers before dates are selected.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-black/60">Start with setting, season, and group fit, then compare the collection or ask the stay team to match the right haven before choosing dates.</p>
          </div>
          <div className="border-t border-black/10">
            {havensCollectionFaq.map((item) => (
              <details key={item.question} className="group border-b border-black/10 py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-2xl leading-tight text-[#173c33]">
                  {item.question}
                  <span className="grid size-8 shrink-0 place-items-center border border-[#173c33]/20 text-sm transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-black/62">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
