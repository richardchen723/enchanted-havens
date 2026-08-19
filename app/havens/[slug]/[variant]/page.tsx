import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PropertyDetail } from "@/components/property-detail"
import { bookingIsLiveFor, getProperty } from "@/lib/catalog"
import { isHostawayConfigured } from "@/lib/hostaway"
import { getCachedHostawayGallery } from "@/lib/hostaway-gallery"
import { getPropertyKeywords } from "@/lib/property-seo"
import { isSandboxBooking } from "@/lib/sandbox-booking"
import { shareMetadata } from "@/lib/seo-metadata"
import type { PropertyVariant } from "@/lib/schemas"
import { buildStayQuery, parseStaySelection, type RawSearchParams } from "@/lib/stay-search"

const LISTING_SEQUENCE_VARIANT_IDS = new Set([558675, 558678])
const DEDICATED_GALLERY_COVER_VARIANT_IDS = new Set([558677])

async function withCurrentHostawayGallery(variant: PropertyVariant) {
  if (!LISTING_SEQUENCE_VARIANT_IDS.has(variant.id) || !isHostawayConfigured()) return variant
  try {
    const images = await getCachedHostawayGallery(variant.id)
    return images.length ? { ...variant, images } : variant
  } catch (error) {
    console.error(`Unable to load the Hostaway cover gallery for listing ${variant.id}`, error)
    return variant
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; variant: string }> }): Promise<Metadata> {
  const { slug, variant: variantSlug } = await params
  const property = await getProperty(slug)
  const catalogVariant = property?.variants.find((item) => item.slug === variantSlug)
  const variant = catalogVariant ? await withCurrentHostawayGallery(catalogVariant) : undefined
  if (!property || !variant) return { title: "Haven Not Found" }
  const title = `${variant.shortName} at ${property.displayName}`
  return shareMetadata({
    title,
    description: variant.description,
    path: `/havens/${property.slug}/${variant.slug}`,
    keywords: getPropertyKeywords(property, variant),
    image: variant.images[0],
    imageAlt: `${variant.shortName} at ${property.displayName} in ${property.location}`,
  })
}

export default async function HavenVariantPage({ params, searchParams }: { params: Promise<{ slug: string; variant: string }>; searchParams: Promise<RawSearchParams> }) {
  const [{ slug, variant: variantSlug }, query] = await Promise.all([params, searchParams])
  const property = await getProperty(slug)
  const catalogVariant = property?.variants.find((item) => item.slug === variantSlug)
  if (!property || !catalogVariant || !property.estate) notFound()
  const variant = await withCurrentHostawayGallery(catalogVariant)
  const sandboxMode = isSandboxBooking()
  const usesListingCover = LISTING_SEQUENCE_VARIANT_IDS.has(variant.id)
  const usesDedicatedGalleryCover = DEDICATED_GALLERY_COVER_VARIANT_IDS.has(variant.id)
  const initialSelection = parseStaySelection(query, Math.min(2, variant.guests))
  const preservedQuery = buildStayQuery(query, initialSelection)
  return <PropertyDetail property={property} variant={variant} bookingLive={bookingIsLiveFor(variant.id)} quoteAvailable={isHostawayConfigured() || sandboxMode} pagePath={`/havens/${property.slug}/${variant.slug}`} heroImageOverride={usesListingCover ? variant.images[0] : undefined} heroImagePosition={usesDedicatedGalleryCover ? "68% center" : undefined} galleryPreviewStart={usesListingCover || usesDedicatedGalleryCover ? 1 : 0} initialSelection={initialSelection} preservedQuery={preservedQuery} />
}
