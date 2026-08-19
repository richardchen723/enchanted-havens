import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ShieldCheck, Star } from "lucide-react"
import { InstagramBrandIcon } from "@/components/instagram-brand-icon"
import { PageHero } from "@/components/page-hero"
import { SectionHeading } from "@/components/section-heading"
import { getCatalog } from "@/lib/catalog"
import { getAirbnbReviewSummary } from "@/lib/airbnb"
import { buildHubJsonLd } from "@/lib/landing-page-seo"
import { shareMetadata } from "@/lib/seo-metadata"
import { experienceHub, experienceLandingPages } from "@/lib/seo-pages"
import { formatCount } from "@/lib/utils"

function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

export const metadata: Metadata = shareMetadata({
  title: experienceHub.title,
  description: experienceHub.metaDescription,
  path: experienceHub.path,
  keywords: experienceHub.keywords,
  image: "/images/home-hero/heros-zip/hero-08.webp",
  imageAlt: "A sunset framed from Sea-Renity Haven on Whidbey Island",
})

export default async function ExperiencesPage() {
  const catalog = await getCatalog()
  const propertyBySlug = new Map(catalog.map((property) => [property.slug, property]))
  const imageFor = (slug: string, index = 0, fallback = "/images/cove-club/cove-club-exterior-15.png") => {
    const property = propertyBySlug.get(slug)
    return property?.gallery[index] || property?.heroImage || fallback
  }
  const airbnb = getAirbnbReviewSummary(catalog.flatMap((property) => property.variants.map((variant) => variant.id)))
  const rituals = [
    ["Water", "Docks, beaches, kayaks, cold plunges, and horizon-facing decks."],
    ["Stillness", "Hot tubs, saunas, firelight, deep quiet, and slow mornings."],
    ["Together", "Long tables, generous homes, estate privacy, and room to gather."],
    ["Wildness", "Olympic trails, island coastlines, forest edges, and mountain air."],
  ] as const
  const experiences = [
    { title: "Water, entirely yours", body: "Private docks, lake beaches, ocean frontage, kayaks, and paddle boards turn the shoreline into part of the home.", image: imageFor("blue-haven", 0), link: "/experiences/waterfront-stays" },
    { title: "The restorative outdoors", body: "Hot tubs under the trees, a barrel sauna by the beach, firepits, and decks designed for slow evenings outside.", image: imageFor("emerald-haven", 1), link: "/experiences/wellness-hot-tub-sauna" },
    { title: "Gatherings with a horizon", body: "Homes for family reunions, milestone weekends, and private estate stays where everyone can arrive and truly settle in.", image: imageFor("whidbey-estate"), link: "/experiences/private-estate-gatherings" },
    { title: "At the edge of the wild", body: "Olympic National Park, island coastlines, forest paths, mountain views, and wildlife are never far from the door.", image: imageFor("reflection-haven"), link: "/experiences/olympic-national-park-basecamp" },
  ]
  const heroImage = propertyBySlug.get("sea-renity-haven")?.gallery[0] || catalog[0].heroImage
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(buildHubJsonLd({ hub: experienceHub, pages: experienceLandingPages, reviews: [], heroImage, properties: catalog })) }} />
      <PageHero eyebrow="Experience the Northwest Better" title="A landscape you can live inside." body="The homes are the beginning. What stays with you is the cold lake at noon, cedar after rain, an empty stretch of beach, and a fire still glowing after everyone else has gone in." image={heroImage} imagePosition="center 58%" />
      <section className="bg-[#faf7f0] py-20 lg:py-28">
        <div className="container-shell">
          <SectionHeading eyebrow="Choose Your Rhythm" title="Come closer to what brought you here." />
          <div className="mt-12 grid gap-6 border-b border-black/10 pb-8 sm:grid-cols-2 lg:grid-cols-4">
            {rituals.map(([title, body], index) => (
              <div key={title} className="border-t border-black/10 pt-5 first:border-t-0 first:pt-0 sm:first:border-t sm:first:pt-5 lg:border-t-0 lg:border-l lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
                <p className="text-[0.61rem] font-bold uppercase tracking-[0.18em] text-[#805a27]">0{index + 1}</p>
                <h2 className="mt-3 font-display text-4xl leading-none text-[#173c33]">{title}</h2>
                <p className="mt-4 text-sm leading-7 text-black/58">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 grid gap-16 lg:mt-20 lg:gap-24">
            {experiences.map((experience, index) => (
              <article key={experience.title} className="grid items-center gap-9 lg:grid-cols-2">
                <div className={`image-lift relative aspect-[4/3] overflow-hidden bg-[#dbe2dd] ${index % 2 ? "lg:order-2" : ""}`}>
                  <Image src={experience.image} alt={experience.title} fill sizes="(max-width: 1024px) 100vw, 50vw" quality={82} className="object-cover" />
                </div>
                <div className={index % 2 ? "lg:pr-14" : "lg:pl-14"}>
                  <p className="eyebrow text-[#805a27]">0{index + 1}</p>
                  <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33] sm:text-6xl">{experience.title}</h2>
                  <p className="mt-6 text-lg leading-8 text-black/58">{experience.body}</p>
                  <Link href={experience.link} className="button-outline mt-8 text-[#173c33]">Explore Havens <ArrowRight className="size-4" /></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#173c33] py-20 text-white lg:py-24">
        <div className="container-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow text-[#d4b47d]">Stay With Confidence</p>
            <h2 className="display-balance mt-4 font-display text-5xl leading-[0.95] sm:text-6xl">The experience begins with a real home.</h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/66">Honest photography, guest reflections, live stay totals, and personal guidance keep the feeling of the trip connected to the place you will actually inhabit.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { icon: Star, title: airbnb ? `${airbnb.rating.toFixed(2)} on Airbnb` : "Verified reviews", text: airbnb ? `${formatCount(airbnb.reviewCount, "verified review")} linked to their original Airbnb listings.` : "Read property-specific review history on Airbnb." },
              { icon: InstagramBrandIcon, title: "See the setting", text: "Explore the homes, water, and Northwest details through @enchanted.havens." },
              { icon: ShieldCheck, title: "Personal planning", text: "Select dates for live pricing or ask which experience best fits the trip." },
            ].map((item) => (
              <div key={item.title} className="border-t border-white/18 pt-5">
                <item.icon className="size-5 text-[#d4b47d]" />
                <h3 className="mt-5 font-display text-3xl leading-none">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/64">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#faf7f0] py-20 lg:py-24">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="eyebrow text-[#805a27]">Experience Questions</p>
            <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33]">Choose the rhythm before you choose the house.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-black/60">A few practical answers for matching the feeling of the trip to the right setting.</p>
          </div>
          <div className="border-t border-black/10">
            {experienceHub.faq.map((item) => (
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
