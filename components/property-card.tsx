import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react"
import type { Property, PropertyVariant } from "@/lib/schemas"
import { appendQuery } from "@/lib/stay-search"
import { getAirbnbReviewDestination } from "@/lib/airbnb"
import { cn, formatCount, formatCurrency } from "@/lib/utils"

type PropertyCardProps = {
  property: Property
  priority?: boolean
  layout?: "standard" | "feature" | "editorial"
  index?: number
  variant?: PropertyVariant
  queryString?: string
  quote?: { total: number; currency: string; nights: number }
}

function StayMeta({ property, variant, light = false }: { property: Property; variant?: PropertyVariant; light?: boolean }) {
  const stay = variant || (property.estate
    ? property.variants.find((item) => item.slug === "full-estate") || property.variants[0]
    : property.variants[0])
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem]", light ? "text-white/65" : "text-black/60")}>
      <span>Up to {formatCount(stay.guests, "guest")}</span><span aria-hidden="true">·</span>
      <span>{formatCount(stay.bedrooms, "bedroom")}</span><span aria-hidden="true">·</span>
      <span>{formatCount(stay.bathrooms, "bath")}</span>
    </div>
  )
}

function Rate({ light = false, quote }: { light?: boolean; quote?: PropertyCardProps["quote"] }) {
  return (
    <p className={cn("text-xs font-semibold", light ? "text-white/78" : "text-[#173c33]")}>
      {quote ? <><span className="block font-display text-2xl leading-none">{formatCurrency(quote.total, quote.currency, { cents: true })}</span><span className="mt-1 block text-[0.65rem] font-normal opacity-70">Complete total · {formatCount(quote.nights, "night")}</span></> : "Select dates for exact pricing"}
    </p>
  )
}

function VerifiedRating({ snapshot, light = false }: { snapshot: ReturnType<typeof getAirbnbReviewDestination>["snapshot"]; light?: boolean }) {
  if (!snapshot) return null
  return <p className={cn("mt-3 text-xs font-semibold", light ? "text-white/72" : "text-[#173c33]")}>★ {snapshot.rating.toFixed(2)} · {formatCount(snapshot.reviewCount, "verified Airbnb review")}</p>
}

export function PropertyCard({ property, priority = false, layout = "standard", index = 0, variant, queryString = "", quote }: PropertyCardProps) {
  const propertyPath = variant ? `/havens/${property.slug}/${variant.slug}` : `/havens/${property.slug}`
  const href = appendQuery(propertyPath, queryString)
  const displayName = variant?.shortName || property.displayName
  const eyebrow = variant ? property.displayName : property.eyebrow
  const narrative = variant?.description || property.narrative
  const heroImage = variant?.images[0] || property.heroImage
  const experienceTags = variant?.amenities || property.experienceTags
  const reviewSnapshot = getAirbnbReviewDestination(variant?.id || property.variants[0].id).snapshot

  if (layout === "feature") {
    return (
      <article className="group overflow-hidden bg-[#173c33] text-white">
        <Link href={href} className="grid lg:grid-cols-[1.45fr_0.75fr]">
          <div className="image-lift relative min-h-[27rem] overflow-hidden lg:min-h-[38rem]">
            <Image src={heroImage} alt={`${displayName} in ${property.location}`} fill loading={priority ? "eager" : "lazy"} sizes="(max-width: 1024px) 100vw, 65vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            <p className="absolute left-5 top-5 border border-white/40 bg-black/15 px-3 py-2 text-[0.61rem] font-bold uppercase tracking-[0.18em] backdrop-blur-sm">Signature stay</p>
          </div>
          <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
            <div>
              <p className="eyebrow text-[#d4b47d]">{eyebrow}</p>
              <h3 className="display-balance mt-5 font-display text-5xl leading-[0.9] sm:text-6xl">{displayName}</h3>
              <p className="mt-5 flex items-center gap-2 text-xs text-white/65"><MapPin className="size-3.5" /> {property.location}</p>
              <VerifiedRating snapshot={reviewSnapshot} light />
              <p className="copy-balance mt-8 text-base leading-8 text-white/66">{narrative}</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {experienceTags.slice(0, 3).map((tag) => <span key={tag} className="border border-white/18 px-3 py-2 text-[0.62rem] uppercase tracking-[0.13em] text-white/62">{tag}</span>)}
              </div>
            </div>
            <div className="mt-12 border-t border-white/16 pt-6">
              <StayMeta property={property} variant={variant} light />
              <div className="mt-6 flex items-center justify-between"><Rate light quote={quote} /><span className="inline-flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.16em]">Discover <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></div>
            </div>
          </div>
        </Link>
      </article>
    )
  }

  if (layout === "editorial") {
    const reverse = index % 2 === 1
    return (
      <article className="group border-b border-black/10 pb-12 lg:pb-16">
        <Link href={href} className={cn("grid items-stretch gap-0 bg-[#f4efe5]", reverse ? "lg:grid-cols-[0.78fr_1.22fr]" : "lg:grid-cols-[1.22fr_0.78fr]")}>
          <div className={cn("image-lift relative min-h-[24rem] overflow-hidden sm:min-h-[34rem]", reverse && "lg:order-2")}>
            <Image src={heroImage} alt={`${displayName} in ${property.location}`} fill loading={priority ? "eager" : "lazy"} sizes="(max-width: 1024px) 100vw, 62vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-transparent to-transparent" />
            <p className="absolute left-5 top-5 border border-white/40 bg-black/15 px-3 py-2 text-[0.61rem] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">0{index + 1}</p>
          </div>
          <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
            <div>
              <p className="eyebrow text-[#805a27]">{eyebrow}</p>
              <h2 className="display-balance mt-5 font-display text-5xl leading-[0.9] text-[#173c33] sm:text-6xl">{displayName}</h2>
              <p className="mt-4 flex items-center gap-2 text-xs text-black/60"><MapPin className="size-3.5" /> {property.location}</p>
              <VerifiedRating snapshot={reviewSnapshot} />
              <p className="copy-balance mt-7 text-base leading-8 text-black/60">{narrative}</p>
              <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#173c33]/80">
                {experienceTags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </div>
            <div className="mt-10 border-t border-black/10 pt-6">
              <StayMeta property={property} variant={variant} />
              <div className="mt-6 flex items-center justify-between gap-5"><Rate quote={quote} /><span className="grid size-11 place-items-center border border-[#173c33]/35 text-[#173c33] transition group-hover:border-[#173c33] group-hover:bg-[#173c33] group-hover:text-white"><ArrowUpRight className="size-5" /></span></div>
            </div>
          </div>
        </Link>
      </article>
    )
  }

  return (
    <article className="group">
      <Link href={href} className="block">
        <div className="image-lift relative aspect-[4/3] overflow-hidden bg-[#dbe2dd] sm:aspect-[5/4]">
          <Image src={heroImage} alt={`${displayName} in ${property.location}`} fill loading={priority ? "eager" : "lazy"} sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <p className="absolute left-5 top-5 border border-white/45 bg-black/10 px-3 py-2 text-[0.61rem] font-bold uppercase tracking-[0.17em] text-white backdrop-blur-sm">{eyebrow}</p>
          <span className="absolute bottom-5 right-5 grid size-11 place-items-center border border-white/50 text-white transition group-hover:bg-white group-hover:text-[#173c33]"><ArrowUpRight className="size-5" /></span>
        </div>
        <div className="pt-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h3 className="font-display text-4xl leading-none text-[#173c33] sm:text-[2.8rem]">{displayName}</h3>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-black/60"><MapPin className="size-3.5" /> {property.location}</p>
              <VerifiedRating snapshot={reviewSnapshot} />
            </div>
            <Rate quote={quote} />
          </div>
          <p className="copy-balance mt-5 max-w-xl text-sm leading-7 text-black/58">{narrative}</p>
          <div className="mt-5 border-t border-black/10 pt-4"><StayMeta property={property} variant={variant} /></div>
        </div>
      </Link>
    </article>
  )
}
