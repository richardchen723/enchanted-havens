import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Bath, BedDouble, Check, Images, MapPin, Star, Users } from "lucide-react"
import { BookingPanel } from "@/components/booking-panel"
import { ExpandableDescription } from "@/components/expandable-description"
import { ImageGallery } from "@/components/image-gallery"
import { OpenDatePickerButton } from "@/components/open-date-picker-button"
import { PropertyMap } from "@/components/property-map"
import { TrackedEventLink } from "@/components/tracked-contact-link"
import { buildInquiryHref } from "@/lib/contact-handoff"
import { getAirbnbReviewDestination } from "@/lib/airbnb"
import { getEditorialVariantHero } from "@/lib/editorial"
import { buildPropertyJsonLd, getPropertySeoContent } from "@/lib/property-seo"
import type { Property, PropertyVariant } from "@/lib/schemas"
import { getDisplayAmenities, getStandoutAmenities } from "@/lib/standout-amenities"
import { appendQuery, type StaySelection } from "@/lib/stay-search"
import { formatCount } from "@/lib/utils"

function AirbnbReviews({ variant }: { variant: PropertyVariant }) {
  const destination = getAirbnbReviewDestination(variant.id)
  const snapshot = destination.snapshot

  return (
    <section id="reviews" aria-labelledby="verified-reviews-heading" className="py-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-[#805a27]">Verified Guest Reviews</p>
          <h2 id="verified-reviews-heading" className="mt-3 font-display text-4xl leading-none text-[#173c33]">See what guests say on Airbnb.</h2>
        </div>
        <p className="text-xs font-semibold text-black/55">Review source · Airbnb</p>
      </div>

      {snapshot ? (
        <div className="mt-7 grid gap-7 border-y border-black/10 py-7 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
          <div>
            <p className="font-display text-5xl leading-none tracking-[-0.04em] text-[#173c33]">{snapshot.rating.toFixed(2)}<span className="ml-1 text-xl text-[#173c33]/40">/5</span></p>
            <p className="mt-2 text-[#805a27]" aria-label={`${snapshot.rating.toFixed(2)} out of 5 stars`}>★★★★★</p>
            <p className="mt-2 text-xs text-black/60">{formatCount(snapshot.reviewCount, "verified review")}</p>
          </div>
          <div>
            <p className="text-sm leading-7 text-black/60">A recent snapshot of verified feedback for {variant.shortName}. Guests often mention:</p>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Common themes in guest reviews">
              {snapshot.mentions.map((mention) => <li key={mention} className="border border-[#805a27]/20 px-3 py-2 text-xs text-[#173c33]">{mention}</li>)}
            </ul>
            <p className="mt-3 text-xs text-black/55">Snapshot checked {snapshot.checkedAt}.</p>
          </div>
        </div>
      ) : (
        <p className="mt-6 border-y border-black/10 py-6 text-sm leading-7 text-black/60">Verified feedback is kept with its original stay, date, and booking context on Airbnb.</p>
      )}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TrackedEventLink
          href={destination.href}
          target="_blank"
          rel="noopener noreferrer"
          eventName="Airbnb Reviews Clicked"
          data={{ property: variant.slug, listingId: variant.id }}
          aria-label={`Read verified Airbnb reviews for ${variant.shortName} (opens in a new tab)`}
          className="button-outline justify-center text-[#173c33] sm:justify-start"
        >
          Read verified reviews on Airbnb
          <ArrowUpRight className="size-4" />
        </TrackedEventLink>
        <p className="max-w-md text-xs leading-5 text-black/55">Enchanted Havens is an independent third party and is not endorsed by or associated with Airbnb, Inc. or its affiliates.</p>
      </div>
    </section>
  )
}

function PropertyFaq({ name, items }: { name: string; items: { question: string; answer: string }[] }) {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="border-t border-black/10 py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow text-[#805a27]">Frequently Asked Questions</p>
        <h2 id="faq-heading" className="mt-3 font-display text-4xl leading-none text-[#173c33]">What guests ask before staying at {name}.</h2>
        <p className="mt-4 text-sm leading-7 text-black/56">Five practical answers shaped by recurring guest questions and this haven&apos;s current listing details.</p>
      </div>

      <div className="mt-8 border-t border-black/10">
        {items.map((item, index) => (
          <details key={item.question} className="group border-b border-black/10">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left marker:content-none">
              <span className="flex items-baseline gap-4">
                <span className="text-[0.62rem] font-bold tracking-[0.14em] text-[#805a27]">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-display text-[1.55rem] leading-tight text-[#173c33] sm:text-[1.75rem]">{item.question}</span>
              </span>
              <span className="shrink-0 text-xl font-light text-[#805a27] transition-transform duration-200 group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="max-w-2xl pb-6 pl-10 text-sm leading-7 text-black/62">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function PropertyBreadcrumb({ property, variant, path, inverse = false }: { property: Property; variant: PropertyVariant; path: string; inverse?: boolean }) {
  const variantPath = `/havens/${property.slug}/${variant.slug}`
  const onVariantPage = path === variantPath
  const items = [
    { label: "Home", href: "/" },
    { label: "The Havens", href: "/havens" },
    { label: property.displayName, href: onVariantPage ? `/havens/${property.slug}` : undefined },
    ...(onVariantPage ? [{ label: variant.shortName, href: undefined }] : []),
  ]

  return (
    <nav aria-label="Breadcrumb" className={`text-[0.62rem] font-bold uppercase tracking-[0.16em] ${inverse ? "text-white/65" : "text-black/45"}`}>
      <ol className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? <Link href={item.href} className={`transition ${inverse ? "hover:text-white" : "hover:text-[#173c33]"}`}>{item.label}</Link> : <span>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function Amenity({ children }: { children: string }) {
  return <li className="flex items-center gap-3 border-b border-black/7 py-3 text-sm text-black/64"><Check className="size-4 shrink-0 text-[#805a27]" /> {children}</li>
}

function PropertyAmenities({ standout, allAmenities }: { standout: string[]; allAmenities: string[] }) {
  const standoutKeys = new Set(standout.map((amenity) => amenity.toLowerCase()))
  const remaining = allAmenities.filter((amenity) => !standoutKeys.has(amenity.toLowerCase()))

  return (
    <section id="amenities" aria-labelledby="amenities-heading" className="border-b border-black/10 py-12">
      <p className="eyebrow text-[#805a27]">Standout Amenities</p>
      <h2 id="amenities-heading" className="mt-3 font-display text-4xl leading-none text-[#173c33]">What sets this haven apart.</h2>
      <ul className="mt-7 grid gap-x-10 sm:grid-cols-2">
        {standout.map((amenity) => <Amenity key={amenity}>{amenity}</Amenity>)}
      </ul>
      {remaining.length ? (
        <details className="group mt-6">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-3 border border-[#173c33]/24 px-4 text-[0.63rem] font-bold uppercase tracking-[0.13em] text-[#173c33] transition hover:border-[#173c33]">
            View all {formatCount(allAmenities.length, "amenity", "amenities")}
            <span className="text-base font-normal transition group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <ul className="mt-5 grid gap-x-10 border-t border-black/8 sm:grid-cols-2">
            {remaining.map((amenity) => <Amenity key={amenity}>{amenity}</Amenity>)}
          </ul>
        </details>
      ) : null}
    </section>
  )
}

function EstateResidenceLinks({ property, variant, preservedQuery }: { property: Property; variant: PropertyVariant; preservedQuery: string }) {
  const alternatives = property.variants.filter((item) => item.id !== variant.id)
  if (!property.estate || !alternatives.length) return null

  return (
    <section id="estate-residences" className="scroll-mt-28 border-b border-black/10 py-12">
      <p className="eyebrow text-[#805a27]">The Cove Club Residences</p>
      <h2 className="mt-3 font-display text-4xl leading-none text-[#173c33]">Compare ways to stay.</h2>
      <div className="mt-7 border-y border-black/10">
        {alternatives.map((item) => (
          <Link key={item.id} href={appendQuery(`/havens/${property.slug}/${item.slug}`, preservedQuery)} className="group flex items-center justify-between gap-5 border-b border-black/10 py-4 last:border-b-0">
            <span>
              <span className="block font-display text-2xl text-[#173c33]">{item.shortName}</span>
              <span className="mt-1 block text-xs text-black/52">Up to {formatCount(item.guests, "guest")} · {formatCount(item.bedrooms, "bedroom")}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-[#805a27] transition group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </section>
  )
}

export function PropertyDetail({ property, variant, bookingLive = false, quoteAvailable = false, pagePath, heroImageOverride, heroImagePosition, galleryPreviewStart, initialSelection, preservedQuery = "" }: { property: Property; variant: PropertyVariant; bookingLive?: boolean; quoteAvailable?: boolean; pagePath?: string; heroImageOverride?: string; heroImagePosition?: string; galleryPreviewStart?: number; initialSelection?: StaySelection; preservedQuery?: string }) {
  const propertyImages = variant.images.length > 4 ? variant.images : [...variant.images, ...property.gallery].filter((url, index, all) => all.indexOf(url) === index)
  const heroImage = heroImageOverride || getEditorialVariantHero(variant.id) || propertyImages[0]
  const images = [heroImage, ...propertyImages].filter((url, index, all) => all.indexOf(url) === index)
  const galleryStart = galleryPreviewStart ?? 1
  const seo = getPropertySeoContent(property)
  const locationSummary = seo.localSections[0]?.body
  const canonicalPath = pagePath || (property.estate ? `/havens/${property.slug}/${variant.slug}` : `/havens/${property.slug}`)
  const jsonLd = buildPropertyJsonLd({ property, variant, reviews: [], path: canonicalPath, heroImage })
  const fullDescription = variant.fullDescription || property.longNarrative
  const allAmenities = getDisplayAmenities(variant.amenities)
  const standoutAmenities = getStandoutAmenities(variant)
  const bookingProperty = { slug: property.slug }
  const bookingVariant = { id: variant.id, slug: variant.slug, guests: variant.guests }
  const returnTo = `${canonicalPath}${preservedQuery ? `?${preservedQuery}` : ""}#reserve`
  const inquiryHref = buildInquiryHref({
    property: property.slug,
    variant: variant.slug,
    checkIn: initialSelection?.checkIn,
    checkOut: initialSelection?.checkOut,
    guests: initialSelection?.guests,
    preservedQuery,
    returnTo,
  })
  const verifiedReviews = getAirbnbReviewDestination(variant.id).snapshot

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="bg-[#faf7f0] pb-20 lg:pb-0">
        <section className="immersive-hero relative isolate min-h-[72dvh] overflow-hidden bg-[#173c33] text-white sm:min-h-[88dvh]">
          <Image src={heroImage} alt={`${variant.shortName} in ${property.location}`} fill loading="eager" sizes="100vw" className="object-cover" style={heroImagePosition ? { objectPosition: heroImagePosition } : undefined} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071e19]/88 via-[#071e19]/30 to-[#071e19]/25" aria-hidden="true" />
          <div className="container-shell relative flex min-h-[72dvh] flex-col justify-end pb-10 pt-32 sm:min-h-[88dvh] sm:pb-14 lg:pb-16">
            <PropertyBreadcrumb property={property} variant={variant} path={canonicalPath} inverse />
            <p className="eyebrow mt-8 text-[#e7c892]">{property.eyebrow}</p>
            <h1 className="display-balance mt-4 max-w-5xl font-display text-[clamp(4.5rem,9vw,9rem)] leading-[0.8] tracking-[-0.05em] text-white">{variant.shortName}</h1>
            <p className="mt-6 flex items-center gap-2 text-sm text-white/72"><MapPin className="size-4 text-[#e7c892]" /> {property.location}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-white/22 pt-6 text-xs text-white/72">
              <span className="flex items-center gap-2"><Users className="size-4 text-[#e7c892]" /> {formatCount(variant.guests, "guest")}</span>
              <span className="flex items-center gap-2"><BedDouble className="size-4 text-[#e7c892]" /> {formatCount(variant.bedrooms, "bedroom")}</span>
              <span className="flex items-center gap-2"><Bath className="size-4 text-[#e7c892]" /> {formatCount(variant.bathrooms, "bathroom")}</span>
              {verifiedReviews ? <a href="#reviews" className="flex items-center gap-2 transition hover:text-white"><Star className="size-4 fill-[#e7c892] text-[#e7c892]" /> {verifiedReviews.rating.toFixed(2)} ({verifiedReviews.reviewCount}) verified on Airbnb</a> : null}
              <a href="#gallery" className="ml-auto inline-flex items-center gap-2 font-bold uppercase tracking-[0.13em] text-white transition hover:text-[#e7c892]"><Images className="size-4" /> View the residence</a>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <TrackedEventLink href="#reserve" eventName="Availability CTA Clicked" data={{ property: property.slug, variant: variant.slug }} className="button-light">Check Availability <ArrowRight className="size-4" /></TrackedEventLink>
              <Link href={inquiryHref} className="button-outline text-white">Ask the Stay Team</Link>
            </div>
          </div>
        </section>

        <section id="gallery" className="scroll-mt-24 border-b border-black/8 bg-[#f2ede3] py-14 sm:py-20">
          <div className="container-shell">
            <ImageGallery images={images} listingId={variant.id} name={variant.shortName} location={property.location} tags={[...property.experienceTags, ...variant.amenities]} previewStart={galleryStart} />
          </div>
        </section>

        <section className="pb-20 lg:pb-24">
          <div className="container-shell grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-x-20">
            <div className="lg:col-start-1 lg:row-start-1">
              <section id="about" aria-labelledby="about-heading" className="border-b border-black/10 py-12 sm:py-16">
                <p className="eyebrow text-[#805a27]">About This Haven</p>
                <h2 id="about-heading" className="mt-3 font-display text-4xl leading-none text-[#173c33]">About {variant.shortName}.</h2>
                <ExpandableDescription summary={property.narrative} description={fullDescription} />
              </section>

              <PropertyAmenities standout={standoutAmenities} allAmenities={allAmenities} />
              <PropertyMap variant={variant} location={property.location} locationSummary={locationSummary} />
              <EstateResidenceLinks property={property} variant={variant} preservedQuery={preservedQuery} />
              <AirbnbReviews variant={variant} />
              {!property.estate ? <PropertyFaq name={variant.shortName} items={seo.faq.slice(0, 5)} /> : null}
            </div>

            <BookingPanel key={`${variant.id}:${initialSelection?.checkIn || ""}:${initialSelection?.checkOut || ""}:${initialSelection?.guests || ""}`} property={bookingProperty} variant={bookingVariant} bookingLive={bookingLive} quoteAvailable={quoteAvailable} initialSelection={initialSelection} preservedQuery={preservedQuery} returnTo={returnTo} />
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[#faf7f0]/96 px-4 py-3 shadow-[0_-12px_40px_rgba(7,30,25,.12)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4"><div><p className="text-[0.61rem] font-bold uppercase tracking-[0.14em] text-black/60">Availability & pricing</p><p className="mt-1 font-display text-2xl leading-none text-[#173c33]">Select your dates</p></div><OpenDatePickerButton targetId="reserve-arrival-date" className="button-primary shrink-0" /></div>
      </div>
    </>
  )
}
