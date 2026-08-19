import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PageHero } from "@/components/page-hero"
import { BRAND_CONTACT_PHONE_DISPLAY } from "@/lib/brand"
import { getCatalog } from "@/lib/catalog"
import { shareMetadata } from "@/lib/seo-metadata"

export const metadata: Metadata = shareMetadata({
  title: "Our Story",
  description: "Enchanted Havens curates design-forward private homes that make the Pacific Northwest feel more intimate, restorative, and memorable.",
  path: "/story",
  keywords: ["Enchanted Havens", "Pacific Northwest private retreats", "luxury vacation rentals Washington", "direct book vacation rentals PNW"],
  image: "/images/aurora-haven/aurora-night-exterior.jpg",
  imageAlt: "Aurora above an Enchanted Havens retreat on the Olympic Peninsula",
  openGraphTitle: "Our Story | Enchanted Havens",
})

export default async function StoryPage() {
  const catalog = await getCatalog()
  const storyHero = catalog.find((property) => property.slug === "aurora-haven")?.heroImage || catalog[0].heroImage
  const seaRenity = catalog.find((property) => property.slug === "sea-renity-haven")
  const emerald = catalog.find((property) => property.slug === "emerald-haven")
  const fair = catalog.find((property) => property.slug === "fair-haven")
  const rituals = [
    { title: "First light", text: "A quiet room, coffee warming, and the landscape slowly returning.", image: seaRenity?.gallery[2] || catalog[0].heroImage },
    { title: "Into the water", text: "A dock, a shoreline, and an afternoon with nowhere else to be.", image: emerald?.gallery[0] || catalog[0].heroImage },
    { title: "After sunset", text: "Firelight, cedar heat, and a last conversation outside.", image: fair?.gallery[1] || catalog[0].heroImage },
  ]
  const principles = [
    ["Place Before Product", "Each stay begins with a rare relationship to water, forest, mountain, or sea."],
    ["Design With Restraint", "Rooms are edited for comfort, light, material warmth, and an uninterrupted sense of place."],
    ["Care You Can Feel", "Preparation, communication, and local knowledge are handled quietly before they are needed."],
    ["Privacy As Luxury", "The collection favors homes where guests can disappear into the landscape together."],
  ] as const
  return (
    <>
      <PageHero eyebrow="Our Story" title="Hospitality, shaped by the landscape." body="Enchanted Havens began with a simple belief: the right home can change the way a place is felt." image={storyHero} />
      <section className="bg-[#faf7f0] py-20 lg:py-28"><div className="container-shell grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center"><div className="image-lift relative aspect-[3/4] overflow-hidden"><Image src={catalog[2].gallery[1]} alt="Lakefront hospitality at Enchanted Havens" fill sizes="(max-width:1024px) 100vw, 42vw" className="object-cover" /></div><div className="lg:pl-14"><p className="eyebrow text-[#805a27]">Why We Exist</p><h2 className="mt-5 font-display text-6xl leading-[0.94] text-[#173c33] lg:text-7xl">To make the extraordinary feel deeply personal.</h2><div className="mt-8 space-y-5 text-lg leading-9 text-black/60"><p>We seek homes with a true sense of place: lake edges, forest clearings, ocean horizons, and rooms where the view is part of the design.</p><p>Then we care for each stay with the consistency of a resort and the intimacy of a private home. The result is less about luxury as display and more about luxury as freedom: space, quiet, beauty, and attention when it matters.</p></div></div></div></section>
      <section className="bg-[#e7e1d6] py-20 lg:py-24">
        <div className="container-shell">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="eyebrow text-[#805a27]">The Point of View</p>
              <h2 className="mt-4 font-display text-5xl leading-[0.94] text-[#173c33] sm:text-6xl">A private resort standard, translated into homes.</h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-black/60 lg:justify-self-end">The work is part curation, part hospitality, and part restraint. We choose fewer homes, prepare them carefully, and let the landscape remain the main event.</p>
          </div>
          <div className="mt-12 grid gap-6 border-b border-[#173c33]/14 pb-8 md:grid-cols-2 lg:grid-cols-4">
            {principles.map(([title, body], index) => (
              <div key={title} className="border-t border-[#173c33]/14 pt-5 first:border-t-0 first:pt-0 md:first:border-t md:first:pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
                <p className="text-[0.61rem] font-bold uppercase tracking-[0.18em] text-[#805a27]">0{index + 1}</p>
                <h3 className="mt-3 font-display text-3xl leading-none text-[#173c33]">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-black/60">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#faf7f0] py-16 lg:py-20">
        <div className="container-shell grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div><p className="eyebrow text-[#805a27]">The Stay Team</p><h2 className="mt-4 font-display text-5xl leading-none text-[#173c33]">Hospitality with a human point of view.</h2></div>
          <div className="grid gap-7 sm:grid-cols-2">
            <div className="border-t border-black/10 pt-5"><h3 className="font-display text-3xl text-[#173c33]">We know the homes.</h3><p className="mt-4 text-sm leading-7 text-black/62">The team guides guests by swimming access, quiet, layout, seasonal rhythm, pet fit, and the small practical details that do not fit neatly into an amenity list.</p></div>
            <div className="border-t border-black/10 pt-5"><h3 className="font-display text-3xl text-[#173c33]">We prepare the arrival.</h3><p className="mt-4 text-sm leading-7 text-black/62">Every stay is supported directly, with arrival information, local context, and a reachable team before and during the visit. Call {BRAND_CONTACT_PHONE_DISPLAY} when a trip needs a real conversation.</p></div>
          </div>
        </div>
      </section>
      <section className="bg-[#173c33] py-20 text-white lg:py-28">
        <div className="container-shell">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
            <div><p className="eyebrow text-[#d4b47d]">The Rituals</p><h2 className="mt-4 font-display text-5xl leading-none sm:text-6xl">Luxury is what the place allows you to notice.</h2></div>
            <p className="max-w-2xl text-base leading-8 text-white/62 lg:justify-self-end">The most memorable moments are rarely scheduled. We shape the stay so there is room for them to happen naturally.</p>
          </div>
          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {rituals.map((ritual, index) => (
              <figure key={ritual.title} className={`group relative overflow-hidden ${index === 1 ? "lg:-translate-y-5" : ""}`}>
                <div className="relative aspect-[3/4]"><Image src={ritual.image} alt={ritual.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-[1.015]" /><div className="absolute inset-0 bg-gradient-to-t from-[#071e19]/88 via-transparent to-transparent" /></div>
                <figcaption className="absolute inset-x-0 bottom-0 p-7"><p className="eyebrow text-[#d4b47d]">0{index + 1}</p><h3 className="mt-3 font-display text-4xl">{ritual.title}</h3><p className="mt-3 text-sm leading-7 text-white/66">{ritual.text}</p></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#f3eee3] py-24 text-center"><div className="container-shell"><p className="eyebrow text-[#805a27]">Begin Here</p><h2 className="mx-auto mt-4 max-w-3xl font-display text-6xl leading-none text-[#173c33]">Find the haven that feels like it was waiting for you.</h2><Link href="/havens" className="button-primary mt-8">Explore the Collection <ArrowRight className="size-4" /></Link></div></section>
    </>
  )
}
