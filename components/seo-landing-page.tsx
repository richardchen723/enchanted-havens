import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, MapPin, ShieldCheck, Star } from "lucide-react"
import { InstagramBrandIcon } from "@/components/instagram-brand-icon"
import { PropertyCard } from "@/components/property-card"
import { buildHubJsonLd, buildLandingPageJsonLd } from "@/lib/landing-page-seo"
import { BRAND_INSTAGRAM_URL } from "@/lib/brand"
import { getHubMatchedProperties } from "@/lib/hub-matched-properties"
import type { Property, Review } from "@/lib/schemas"
import type { SeoHub, SeoLandingPage } from "@/lib/seo-pages"
import { getRelatedSeoPages, getSeoPagesByGroup } from "@/lib/seo-pages"
import { getAirbnbReviewSummary } from "@/lib/airbnb"
import { confirmedStayPolicies, getVerifiedPropertyFacts } from "@/lib/property-facts"
import { guidePlanning } from "@/lib/guide-planning"
import { cn, formatCount } from "@/lib/utils"

function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

function getPropertyImage(property: Property | undefined, index = 0) {
  return property?.gallery[index] || property?.heroImage || "/images/home-hero/heros-zip/hero-07.webp"
}

function pageLabel(group: string) {
  if (group === "destinations") return "Destinations"
  if (group === "groups") return "Group Stays"
  if (group === "stays") return "Stay Types"
  if (group === "amenities") return "Amenities"
  return "Experiences"
}

function groupPath(group: string) {
  if (group === "experiences") return "/experiences"
  return `/${group}`
}

function matchedAvailabilityHref(page: SeoLandingPage) {
  const params = new URLSearchParams({ intent: page.slug, matches: page.propertySlugs.join(",") })
  return `/havens?${params.toString()}#availability`
}

function primaryVariant(property: Property) {
  return property.estate
    ? property.variants.find((variant) => variant.slug === "full-estate") || property.variants[0]
    : property.variants[0]
}

export function GuidePlanning({ page }: { page: SeoLandingPage }) {
  const notes = guidePlanning[page.slug] || []
  return (
    <section id="planning-details" className="scroll-mt-24 bg-[#faf7f0] py-20 lg:py-24">
      <div className="container-shell">
        <p className="eyebrow text-[#805a27]">Planning Details</p>
        <h2 className="mt-4 max-w-3xl font-display text-5xl leading-none text-[#173c33]">Plan the stay around your party.</h2>
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          {notes.map((item) => (
            <article key={item.heading} className="border-t border-[#173c33]/18 pt-6">
              <h3 className="font-display text-3xl leading-tight text-[#173c33]">{item.heading}</h3>
              <p className="mt-4 text-sm leading-7 text-black/65">{item.body}</p>
              {item.sources?.map((source) => <a key={source.href} href={source.href} className="mt-4 block text-sm text-[#173c33] underline underline-offset-4">{source.label}</a>)}
            </article>
          ))}
        </div>
        <p className="mt-10 text-sm leading-7 text-black/65">Share your sleeping, seating, access, and internet requirements with us before booking.</p>
        <Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#173c33] underline underline-offset-4">Ask the Stay Team <ArrowRight className="size-4" /></Link>
      </div>
    </section>
  )
}

export function MatchedHavensComparison({ properties }: { properties: Property[] }) {
  if (!properties.length) return null
  return (
    <section id="compare-havens" className="scroll-mt-24 bg-[#efe7d9] py-16 lg:py-20">
      <div className="container-shell">
        <p className="eyebrow text-[#805a27]">Compare Matched Havens</p>
        <h2 className="mt-4 max-w-3xl font-display text-5xl leading-none text-[#173c33]">Compare sleeping arrangements and access.</h2>
        <p className="mt-6 max-w-3xl text-base leading-8 text-black/65">Use each home’s bedroom layout, water access, and parking to choose a stay that fits your party. Capacities apply to each home individually.</p>
        <div className="mt-10 border-y border-[#173c33]/16">
          {properties.map((property) => {
            const variant = primaryVariant(property)
            const facts = getVerifiedPropertyFacts(variant.id)
            if (!facts) return null
            const arrivalDetails = facts.details.filter((detail) => /Access|Parking|Bathroom/i.test(detail.label))
            return (
              <article key={property.slug} className="grid gap-6 border-b border-[#173c33]/12 py-8 last:border-b-0 lg:grid-cols-[0.8fr_2.2fr]">
                <div>
                  <p className="eyebrow text-[#805a27]">{facts.area}</p>
                  <h3 className="mt-3 font-display text-4xl leading-none text-[#173c33]"><Link href={`/havens/${property.slug}`} className="hover:underline">{property.displayName}</Link></h3>
                  <p className="mt-4 text-sm leading-7 text-black/65">Up to {facts.maxGuests} guests · {facts.bedrooms} bedrooms · {facts.bathrooms} bathrooms</p>
                  <Link href={`/havens/${property.slug}#reserve`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#173c33] underline underline-offset-4">Select dates for exact pricing <ArrowRight className="size-4 shrink-0" /></Link>
                </div>
                <dl className="grid gap-6 md:grid-cols-3">
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-[#805a27]">Sleeping arrangements</dt><dd className="mt-3 text-sm leading-7 text-black/65">{facts.sleeping}</dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-[#805a27]">Setting and water access</dt><dd className="mt-3 text-sm leading-7 text-black/65">{facts.waterAccess}</dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-[#805a27]">Arrival and parking</dt><dd className="mt-3 space-y-3 text-sm leading-7 text-black/65">{arrivalDetails.map((detail) => <p key={detail.label}>{detail.text}</p>)}</dd></div>
                </dl>
              </article>
            )
          })}
        </div>
        <div className="mt-8 grid gap-4 text-sm leading-7 text-black/65 md:grid-cols-2"><p>{confirmedStayPolicies.pets}</p><p>{confirmedStayPolicies.events}</p></div>
      </div>
    </section>
  )
}

function BreadcrumbTrail({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/68">
      <ol className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? <Link href={item.href} className="transition hover:text-white">{item.label}</Link> : <span>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function ProofCards({ properties }: { properties: Property[] }) {
  const airbnb = getAirbnbReviewSummary(properties.flatMap((property) => property.variants.map((variant) => variant.id)))
  const cards = [
    {
      icon: Star,
      title: airbnb ? `${airbnb.rating.toFixed(2)} verified on Airbnb` : "Verified Airbnb reviews",
      text: airbnb ? `${formatCount(airbnb.reviewCount, "review")} across matched Enchanted Havens listings, verified ${airbnb.checkedAt}.` : "Read guest feedback with its original stay context on Airbnb.",
      href: airbnb?.href || BRAND_INSTAGRAM_URL,
      cta: airbnb ? "Check verified reviews" : "See the collection",
    },
    {
      icon: InstagramBrandIcon,
      title: "See the setting",
      text: "The water, forest, and stay details are visible before you inquire.",
      href: BRAND_INSTAGRAM_URL,
      cta: "View @enchanted.havens",
    },
    {
      icon: ShieldCheck,
      title: "Direct-book support",
      text: "Select dates for live pricing, or ask the stay team about rules, retreats, pets, and fit.",
    },
  ]

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-3">
        {cards.map((item) => (
          <div key={item.title} className="border-t border-white/18 pt-5">
            <item.icon className="size-5 text-[#d4b47d]" />
            <h3 className="mt-5 font-display text-3xl leading-none">{item.title}</h3>
            <p className="mt-4 text-sm leading-7 text-white/64">{item.text}</p>
            {item.href ? (
              <a href={item.href} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#d4b47d] transition hover:text-white">
                {item.cta}
                <ArrowRight className="size-4" />
              </a>
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-8 border-t border-white/14 pt-5 text-xs leading-6 text-white/55">Ratings and counts are property-specific snapshots linked to Airbnb. Enchanted Havens is independent and is not endorsed by Airbnb.</p>
    </div>
  )
}

function LandingJsonLd({ page, properties, reviews }: { page: SeoLandingPage; properties: Property[]; reviews: Review[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(buildLandingPageJsonLd({ page, properties, reviews })) }} />
}

export function SeoLandingPageView({ page, catalog }: { page: SeoLandingPage; catalog: Property[] }) {
  const heroProperty = catalog.find((property) => property.slug === page.heroPropertySlug)
  const heroImage = getPropertyImage(heroProperty, page.heroImageIndex || 0)
  const properties = page.propertySlugs.flatMap((slug) => {
    const property = catalog.find((item) => item.slug === slug)
    return property ? [property] : []
  })
  const relatedPages = getRelatedSeoPages(page)
  const featuredProperties = properties.length ? properties : catalog.slice(0, 3)

  return (
    <>
      <LandingJsonLd page={page} properties={featuredProperties} reviews={[]} />

      <section className="immersive-hero relative min-h-[68dvh] overflow-hidden bg-[#071e19] text-white sm:min-h-[88dvh]">
        <Image src={heroImage} alt={heroProperty ? `${heroProperty.displayName} in ${heroProperty.location}` : page.title} fill loading="eager" quality={82} sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,24,20,.78),rgba(5,24,20,.18)_68%),linear-gradient(0deg,rgba(5,24,20,.72),rgba(5,24,20,.05)_58%)]" />
        <div className="grain absolute inset-0 opacity-25" />
        <div className="container-shell relative flex min-h-[68dvh] items-end pb-12 pt-32 sm:min-h-[88dvh] sm:pb-14 sm:pt-36">
          <div className="max-w-5xl">
            <BreadcrumbTrail items={[{ label: "Home", href: "/" }, { label: pageLabel(page.group), href: groupPath(page.group) }, { label: page.eyebrow }]} />
            <h1 className="display-balance mt-6 font-display text-[clamp(4rem,7vw,7.2rem)] leading-[0.84] tracking-[-0.04em]">{page.h1}</h1>
            <p className="copy-balance mt-7 max-w-2xl text-base leading-8 text-white/72 sm:text-lg sm:leading-9">{page.description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={matchedAvailabilityHref(page)} className="button-light">Check Matched Dates <ArrowRight className="size-4" /></Link>
              <Link href="#best-havens" className="button-outline text-white">See Best Fits</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f3eee3] py-16 lg:py-20">
        <div className="container-shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="eyebrow text-[#805a27]">The Guide</p>
            <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33]">{page.title}</h2>
            <p className="mt-6 text-base leading-8 text-black/62">{page.lead}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {page.highlights.map((highlight, index) => (
              <div key={highlight.title} className="border-t border-[#173c33]/16 pt-5">
                <p className="text-[0.61rem] font-bold uppercase tracking-[0.18em] text-[#805a27]">0{index + 1}</p>
                <h3 className="mt-4 font-display text-3xl leading-none text-[#173c33]">{highlight.title}</h3>
                <p className="mt-4 text-sm leading-7 text-black/60">{highlight.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="best-havens" className="bg-[#faf7f0] py-20 lg:py-28">
        <div className="container-shell">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="eyebrow text-[#805a27]">Matched Havens</p>
              <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33] sm:text-6xl">Start with homes shaped for this kind of trip.</h2>
            </div>
            <Link href="/havens" className="button-outline text-[#173c33]">View Full Collection <ArrowRight className="size-4" /></Link>
          </div>
          <div className={cn("mt-12 grid gap-x-7 gap-y-12", featuredProperties.length === 1 ? "lg:grid-cols-1" : "lg:grid-cols-3")}>
            {featuredProperties.slice(0, 6).map((property, index) => (
              <PropertyCard key={property.slug} property={property} priority={index === 0} />
            ))}
          </div>
        </div>
      </section>

      <MatchedHavensComparison properties={featuredProperties} />

      <GuidePlanning page={page} />

      <section className="bg-[#e7e1d6] py-20 lg:py-28">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.34fr_1fr] lg:gap-20">
          <div>
            <p className="eyebrow text-[#805a27]">Area Notes</p>
            <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33]">The details that shape the stay.</h2>
          </div>
          <div className="grid gap-9">
            {page.sections.map((section, index) => (
              <section key={section.heading} className="border-t border-[#173c33]/16 pt-7">
                <p className="text-[0.61rem] font-bold uppercase tracking-[0.18em] text-[#805a27]">0{index + 1}</p>
                <h2 className="mt-4 font-display text-4xl leading-tight text-[#173c33]">{section.heading}</h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-black/63">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#173c33] py-20 text-white lg:py-24">
        <div className="container-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow text-[#d4b47d]">Guest Confidence</p>
            <h2 className="display-balance mt-4 font-display text-5xl leading-[0.95] sm:text-6xl">Direct-book clarity, real guest reflections, visible homes.</h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/66">Every recommendation is grounded in a real Enchanted Havens home, honest photography, guest reflections, and date-based pricing.</p>
          </div>
          <ProofCards properties={featuredProperties} />
        </div>
      </section>

      <section className="bg-[#faf7f0] py-20 lg:py-28">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="eyebrow text-[#805a27]">Planning Questions</p>
            <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33]">Answers before the inquiry.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-black/60">Practical answers to help you choose a setting, understand the details, and plan confidently.</p>
          </div>
          <div className="border-t border-black/10">
            {page.faq.map((item) => (
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

      <section className="bg-[#f3eee3] py-20 lg:py-24">
        <div className="container-shell">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="eyebrow text-[#805a27]">Keep Exploring</p>
              <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33]">More ways to find the right haven.</h2>
            </div>
            <Link href="/contact" className="button-primary">Ask the Stay Team <ArrowRight className="size-4" /></Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {relatedPages.map((related) => (
              <Link key={related.path} href={related.path} className="group border-t border-[#173c33]/18 pt-5">
                <p className="eyebrow text-[#805a27]">{related.eyebrow}</p>
                <h3 className="mt-3 font-display text-3xl leading-none text-[#173c33]">{related.title}</h3>
                <p className="mt-4 text-sm leading-7 text-black/58">{related.metaDescription}</p>
                <p className="mt-5 inline-flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#173c33]">Open Guide <ArrowRight className="size-4 transition group-hover:translate-x-1" /></p>
              </Link>
            ))}
            {page.propertySlugs.slice(0, Math.max(0, 3 - relatedPages.length)).map((slug) => {
              const property = catalog.find((item) => item.slug === slug)
              if (!property) return null
              return (
                <Link key={property.slug} href={`/havens/${property.slug}`} className="group border-t border-[#173c33]/18 pt-5">
                  <p className="eyebrow text-[#805a27]">Haven</p>
                  <h3 className="mt-3 font-display text-3xl leading-none text-[#173c33]">{property.displayName}</h3>
                  <p className="mt-4 flex items-center gap-2 text-sm text-black/58"><MapPin className="size-4" /> {property.location}</p>
                  <p className="mt-5 inline-flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#173c33]">View Property <ArrowRight className="size-4 transition group-hover:translate-x-1" /></p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}

function HubJsonLd({ hub, pages, reviews, heroImage, properties }: { hub: SeoHub; pages: SeoLandingPage[]; reviews: Review[]; heroImage: string; properties: Property[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(buildHubJsonLd({ hub, pages, reviews, heroImage, properties })) }} />
}

export function SeoHubPageView({ hub, catalog }: { hub: SeoHub; catalog: Property[] }) {
  const pages = getSeoPagesByGroup(hub.group)
  const heroProperty = catalog.find((property) => property.slug === hub.heroPropertySlug)
  const heroImage = getPropertyImage(heroProperty, hub.heroImageIndex || 0)
  const matchedProperties = getHubMatchedProperties({ pages, catalog })

  return (
    <>
      <HubJsonLd hub={hub} pages={pages} reviews={[]} heroImage={heroImage} properties={catalog} />
      <section className="immersive-hero relative min-h-[62dvh] overflow-hidden bg-[#071e19] text-white sm:min-h-[76dvh]">
        <Image src={heroImage} alt={hub.title} fill loading="eager" quality={82} sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,24,20,.78),rgba(5,24,20,.14)_70%),linear-gradient(0deg,rgba(5,24,20,.68),rgba(5,24,20,.04)_58%)]" />
        <div className="grain absolute inset-0 opacity-25" />
        <div className="container-shell relative flex min-h-[62dvh] items-end pb-12 pt-32 sm:min-h-[76dvh] sm:pb-14 sm:pt-36">
          <div className="max-w-5xl">
            <BreadcrumbTrail items={[{ label: "Home", href: "/" }, { label: hub.eyebrow }]} />
            <h1 className="display-balance mt-6 font-display text-[clamp(4rem,7vw,7rem)] leading-[0.84] tracking-[-0.04em]">{hub.title}</h1>
            <p className="copy-balance mt-7 max-w-2xl text-base leading-8 text-white/72 sm:text-lg sm:leading-9">{hub.description}</p>
          </div>
        </div>
      </section>

      <section className="bg-[#faf7f0] py-20 lg:py-28">
        <div className="container-shell">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="eyebrow text-[#805a27]">Ways to Be Here</p>
              <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33]">Choose the feeling that calls you north.</h2>
            </div>
            <Link href="/havens" className="button-outline text-[#173c33]">Browse Havens <ArrowRight className="size-4" /></Link>
          </div>
          <div className="mt-12 grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => {
              const property = catalog.find((item) => item.slug === page.heroPropertySlug)
              const image = getPropertyImage(property, page.heroImageIndex || 0)
              return (
                <article key={page.path} className="group">
                  <Link href={page.path} className="block">
                    <div className="image-lift relative aspect-[4/3] overflow-hidden bg-[#dbe2dd]">
                      <Image src={image} alt={property ? `${property.displayName} in ${property.location}` : page.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-transparent to-transparent" />
                      <p className="absolute left-5 top-5 border border-white/45 bg-black/10 px-3 py-2 text-[0.61rem] font-bold uppercase tracking-[0.17em] text-white backdrop-blur-sm">{page.eyebrow}</p>
                    </div>
                    <div className="pt-6">
                      <h3 className="font-display text-4xl leading-none text-[#173c33]">{page.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-black/58">{page.metaDescription}</p>
                      <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4">
                        <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#805a27]">{page.primaryKeyword}</span>
                        <ArrowRight className="size-4 text-[#173c33] transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#e7e1d6] py-20 lg:py-24">
        <div className="container-shell">
          <div>
            <p className="eyebrow text-[#805a27]">The Collection Behind the Guides</p>
            <h2 className="mt-4 max-w-3xl font-display text-5xl leading-none text-[#173c33]">Homes this path returns to again and again.</h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-black/62">These havens appear most often across the guide set, helping guests move from inspiration to the homes that actually fit.</p>
          </div>
          <div className="mt-12 grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {matchedProperties.map(({ property, relatedPages }, index) => {
              const variant = primaryVariant(property)
              return (
                <Link key={property.slug} href={`/havens/${property.slug}`} className="group">
                  <div className="image-lift relative aspect-[4/3] overflow-hidden bg-[#dbe2dd]">
                    <Image src={property.heroImage} alt={`${property.displayName} in ${property.location}`} fill loading={index === 0 ? "eager" : "lazy"} sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/46 via-transparent to-transparent" />
                    <p className="absolute left-5 top-5 border border-white/45 bg-black/10 px-3 py-2 text-[0.61rem] font-bold uppercase tracking-[0.17em] text-white backdrop-blur-sm">{property.eyebrow}</p>
                  </div>
                  <div className="border-t border-[#173c33]/18 pt-5">
                    <p className="text-[0.61rem] font-bold uppercase tracking-[0.16em] text-[#805a27]">A signature Enchanted Haven</p>
                    <h3 className="mt-3 font-display text-4xl leading-none text-[#173c33]">{property.displayName}</h3>
                    <p className="mt-3 text-sm text-black/60">{property.location}</p>
                    <p className="mt-4 flex items-center gap-2 text-xs text-black/55"><Check className="size-4 text-[#805a27]" /> Up to {formatCount(variant.guests, "guest")} · {formatCount(variant.bedrooms, "bedroom")} · {formatCount(variant.bathrooms, "bath")}</p>
                    <p className="mt-4 text-sm leading-7 text-black/60">{property.narrative}</p>
                    <p className="mt-5 text-[0.61rem] font-bold uppercase tracking-[0.14em] text-[#173c33]/70">Especially suited to {relatedPages.slice(0, 2).map((page) => page.eyebrow.toLowerCase()).join(" and ")}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#173c33]">
                      View Haven
                      <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#173c33] py-20 text-white lg:py-24">
        <div className="container-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow text-[#d4b47d]">Guest Confidence</p>
            <h2 className="display-balance mt-4 font-display text-5xl leading-[0.95] sm:text-6xl">A direct-book collection with real proof behind each path.</h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/66">Every path leads back to real homes, visible guest feedback, honest photography, and personal stay support.</p>
          </div>
          <ProofCards properties={matchedProperties.map(({ property }) => property)} />
        </div>
      </section>

      <section className="bg-[#faf7f0] py-20 lg:py-24">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="eyebrow text-[#805a27]">Planning Questions</p>
            <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33]">What guests need to know before choosing a path.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-black/60">Useful, specific answers for choosing the right setting and planning the stay well.</p>
          </div>
          <div className="border-t border-black/10">
            {hub.faq.map((item) => (
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
