import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Bath, BedDouble, Users } from "lucide-react"
import { PropertyCard } from "@/components/property-card"
import { buildInquiryHref } from "@/lib/contact-handoff"
import { getEditorialVariantDescription, getEditorialVariantHero } from "@/lib/editorial"
import { buildPropertyJsonLd, getPropertySeoContent } from "@/lib/property-seo"
import type { Property } from "@/lib/schemas"
import { appendQuery } from "@/lib/stay-search"
import { formatCount } from "@/lib/utils"

export function EstateHub({ property, similar, preservedQuery = "" }: { property: Property; similar: Property[]; preservedQuery?: string }) {
  const fullEstate = property.variants.find((variant) => variant.slug === "full-estate") || property.variants[0]
  const mainHouse = property.variants.find((variant) => variant.slug === "main-house")
  const estateResidences = property.variants.filter((variant) => variant.id !== fullEstate.id)
  const residences = [fullEstate, ...estateResidences]
  const waysToStay = property.variants.length
  const heroImage = property.heroImage || getEditorialVariantHero(fullEstate.id) || fullEstate.images[0]
  const introductionImage = (mainHouse && getEditorialVariantHero(mainHouse.id)) || fullEstate.images[0] || property.gallery[0]
  const seo = getPropertySeoContent(property)
  const jsonLd = buildPropertyJsonLd({ property, variant: fullEstate, reviews: [], path: `/havens/${property.slug}`, heroImage })
  const estateInquiryHref = buildInquiryHref({
    property: property.slug,
    tripType: "The Cove Club",
    preservedQuery,
    returnTo: `/havens/${property.slug}#estate-residences`,
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="immersive-hero relative min-h-[76dvh] overflow-hidden bg-[#071e19] text-white sm:min-h-[94dvh]">
        <Image src={heroImage} alt={`The private waterfront grounds of ${property.displayName}`} fill loading="eager" quality={82} sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(4,24,19,.82),rgba(4,24,19,.02)_64%),linear-gradient(90deg,rgba(4,24,19,.48),transparent_72%)]" />
        <div className="grain absolute inset-0 opacity-25" />
        <div className="container-shell relative flex min-h-[76dvh] items-end pb-10 pt-36 sm:min-h-[94dvh] sm:pb-12">
          <div className="w-full">
            <p className="hero-reveal eyebrow mb-5 text-[#d4b47d]">The Collection&apos;s Private Estate</p>
            <h1 className="hero-reveal display-balance max-w-6xl font-display text-[clamp(4rem,8vw,8.4rem)] leading-[0.8] tracking-[-0.045em]">{property.displayName}</h1>
            <div className="hero-reveal-delay mt-8 flex flex-col gap-6 border-t border-white/20 pt-6 sm:flex-row sm:items-end sm:justify-between">
              <p className="copy-balance max-w-2xl text-base leading-8 text-white/72 sm:text-lg">Twenty-three gated waterfront acres, {formatCount(waysToStay, "way")} to stay, and the rare freedom of a private world shaped entirely around your gathering.</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[0.64rem] font-bold uppercase tracking-[0.15em] text-white/58"><span>Whidbey Island</span><span>{formatCount(estateResidences.length, "residence")}</span><span>Up to {formatCount(fullEstate.guests, "guest")}</span></div>
            </div>
            <div className="hero-reveal-delay mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href={estateInquiryHref} className="button-light">Plan a Private Estate Stay <ArrowRight className="size-4" /></Link>
              <a href="#estate-residences" className="button-outline text-white">Compare Residences</a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#faf7f0] py-20 lg:py-28">
        <div className="container-shell grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="relative aspect-[4/5] overflow-hidden"><Image src={introductionImage} alt={`Outdoor gathering space at ${property.displayName}`} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" /></div>
          <div className="lg:pl-14">
            <p className="eyebrow text-[#805a27]">One Estate, Entirely Yours</p>
            <h2 className="display-balance mt-5 font-display text-6xl leading-[0.9] text-[#173c33] lg:text-7xl">A private resort, without another guest in sight.</h2>
            <p className="copy-balance mt-8 text-lg leading-9 text-black/60">{property.longNarrative}</p>
            <div className="mt-10 grid grid-cols-3 gap-4 border-y border-black/10 py-7">
              {[["23", "private acres"], [String(waysToStay).padStart(2, "0"), "ways to stay"], ["01", "waterfront world"]].map(([number,label]) => <div key={label}><p className="font-display text-4xl text-[#173c33] sm:text-5xl">{number}</p><p className="mt-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-black/60">{label}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#e7e1d6] py-20 lg:py-24">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.34fr_1fr] lg:gap-20">
          <div>
            <p className="eyebrow text-[#805a27]">Whidbey Island Context</p>
            <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33]">A private estate with local clarity.</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {seo.localSections.map((section, index) => (
              <section key={section.heading} className="border-t border-[#173c33]/16 pt-5">
                <p className="text-[0.61rem] font-bold uppercase tracking-[0.18em] text-[#805a27]">0{index + 1}</p>
                <h3 className="mt-4 font-display text-3xl leading-none text-[#173c33]">{section.heading}</h3>
                <p className="mt-4 text-sm leading-7 text-black/62">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section id="estate-residences" className="scroll-mt-28 bg-[#f3eee3] py-20 lg:py-28">
        <div className="container-shell">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.7fr]"><div><p className="eyebrow text-[#805a27]">The Residences</p><h2 className="display-balance mt-5 max-w-4xl font-display text-6xl leading-[0.9] text-[#173c33] lg:text-7xl">Choose the scale of your Whidbey stay.</h2></div><p className="copy-balance max-w-lg text-sm leading-7 text-black/60 lg:justify-self-end">Reserve one residence for a focused retreat or bring the full estate together for complete privacy across every acre.</p></div>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {residences.map((variant, index) => {
              const editorialDescription = getEditorialVariantDescription(variant.id) || variant.description
              const cardImage = variant.slug === "full-estate"
                ? variant.images[0]
                : getEditorialVariantHero(variant.id) || variant.images[0]

              return (
                <Link
                  key={variant.id}
                  href={appendQuery(`/havens/${property.slug}/${variant.slug}`, preservedQuery)}
                  data-testid={`estate-residence-${variant.slug}`}
                  className={`image-lift group relative overflow-hidden bg-[#173c33] text-white ${index === 0 ? "lg:col-span-2" : ""}`}
                >
                  <div className={`relative ${index === 0 ? "min-h-[34rem] lg:min-h-[43rem]" : "min-h-[32rem]"}`}>
                    <Image
                      src={cardImage}
                      alt={variant.shortName}
                      fill
                      sizes={index === 0 ? "100vw" : "(max-width: 1024px) 100vw, 50vw"}
                      className="object-cover transition duration-700 group-hover:scale-[1.015]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071e19]/95 via-[#071e19]/24 to-transparent" />
                    <div
                      data-testid={`estate-residence-content-${variant.slug}`}
                      className="absolute inset-x-0 bottom-0 p-7 sm:p-9 lg:p-10"
                    >
                      <p className="eyebrow text-[#d4b47d]">{index === 0 ? "Exclusive use" : "Estate residence"}</p>
                      <div className="mt-3 flex items-end justify-between gap-6">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-5xl leading-none sm:text-6xl">{variant.shortName}</h3>
                          <p className="mt-4 line-clamp-3 max-w-2xl text-sm leading-7 text-white/70">{editorialDescription}</p>
                        </div>
                        <span className="hidden size-12 shrink-0 place-items-center border border-white/45 transition group-hover:bg-white group-hover:text-[#173c33] sm:grid">
                          <ArrowRight className="size-5" />
                        </span>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/18 pt-5 text-xs text-white/60">
                        <span className="flex items-center gap-2"><Users className="size-4 text-[#d4b47d]" /> {formatCount(variant.guests, "guest")}</span>
                        <span className="flex items-center gap-2"><BedDouble className="size-4 text-[#d4b47d]" /> {formatCount(variant.bedrooms, "bedroom")}</span>
                        <span className="flex items-center gap-2"><Bath className="size-4 text-[#d4b47d]" /> {formatCount(variant.bathrooms, "bath")}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#faf7f0] py-20 lg:py-24">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="eyebrow text-[#805a27]">Estate Questions</p>
            <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33]">Answers before the group commits.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-black/60">A full-estate stay has more moving parts. Clear expectations and personal planning keep the gathering generous, private, and easy to inhabit.</p>
          </div>
          <div className="border-t border-black/10">
            {seo.faq.map((item) => (
              <details key={item.question} className="group border-b border-black/10 py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-display text-2xl leading-tight text-[#173c33]">
                  {item.question}
                  <span className="grid size-8 shrink-0 place-items-center border border-[#173c33]/20 text-sm transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-black/62">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="container-shell mt-12">
          <div className="border-y border-black/10 py-10">
            <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
              <div>
                <p className="eyebrow text-[#805a27]">Private Estate Planning</p>
                <h2 className="mt-4 font-display text-5xl leading-[0.96] text-[#173c33]">Plan the estate privately.</h2>
                <p className="mt-6 max-w-2xl text-sm leading-7 text-black/62">The Cove Club is best chosen with a real sense of the group, the dates, and how much of the estate you want to make your own.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Link href={estateInquiryHref} className="button-primary justify-center">Contact the Stay Team <ArrowRight className="size-4" /></Link>
                <Link href={appendQuery(`/havens/${property.slug}/full-estate`, preservedQuery)} className="button-outline justify-center text-[#173c33]">Explore Full Estate <ArrowRight className="size-4" /></Link>
                <a href="#estate-residences" className="button-outline justify-center text-[#173c33]">Compare Residences <ArrowRight className="size-4" /></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#173c33] py-20 text-white lg:py-28">
        <div className="container-shell grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="grid grid-cols-2 gap-3"><div className="relative aspect-[3/4]"><Image src={property.gallery[8] || property.gallery[2]} alt={`${property.displayName} residence`} fill sizes="(max-width: 1024px) 50vw, 27vw" className="object-cover" /></div><div className="relative mt-16 aspect-[3/4]"><Image src={property.gallery[13] || property.gallery[3]} alt={`${property.displayName} waterfront living`} fill sizes="(max-width: 1024px) 50vw, 27vw" className="object-cover" /></div></div>
          <div className="lg:pl-14"><p className="eyebrow text-[#d4b47d]">Gathering, Considered</p><h2 className="display-balance mt-5 font-display text-6xl leading-[0.9] lg:text-7xl">Grand in scale. Personal in feeling.</h2><p className="copy-balance mt-8 text-base leading-8 text-white/64 sm:text-lg sm:leading-9">Milestone weekends, multigenerational gatherings, and long-awaited reunions have room to unfold without sacrificing intimacy. Our stay team will help you choose the right combination of residences and understand the estate before you arrive.</p><div className="mt-9 flex flex-wrap gap-3"><Link href={estateInquiryHref} className="button-light">Plan an Estate Stay <ArrowRight className="size-4" /></Link><Link href={appendQuery(`/havens/${property.slug}/full-estate`, preservedQuery)} className="button-outline text-white">Explore Full Estate</Link></div></div>
        </div>
      </section>

      {similar.length > 0 && <section className="bg-[#faf7f0] py-20 lg:py-28"><div className="container-shell"><div className="flex items-end justify-between gap-6"><div><p className="eyebrow text-[#805a27]">Beyond the Estate</p><h2 className="mt-3 font-display text-5xl text-[#173c33]">Other private edges of the Northwest.</h2></div><Link href="/havens" className="button-outline hidden text-[#173c33] sm:inline-flex">View Collection</Link></div><div className="mt-10 grid gap-9 lg:grid-cols-2">{similar.slice(0,2).map((item)=><PropertyCard key={item.slug} property={item} />)}</div></div></section>}
    </>
  )
}
