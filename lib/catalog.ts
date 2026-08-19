import { unstable_cache } from "next/cache"
import { PHASE_PRODUCTION_BUILD } from "next/constants"
import { allowedListingIds, fallbackProperties, featuredReviews } from "@/lib/editorial"
import { getLatestCatalogSnapshot, saveCatalogSnapshot } from "@/lib/db"
import { getHostawayListing, getHostawayReviews, getListingMapId, isHostawayConfigured } from "@/lib/hostaway"
import { getHighResolutionImageSet } from "@/lib/images"
import { propertySchema, type Property, type PropertyVariant, type Review } from "@/lib/schemas"
import { isEmailConfigured } from "@/lib/email"
import { isSandboxBooking, isStripeLiveConfigured, isStripeSandboxConfigured } from "@/lib/sandbox-booking"

async function mapWithConcurrency<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>) {
  const output: R[] = []
  let index = 0
  async function worker() {
    while (index < items.length) {
      const current = items[index++]
      output.push(await task(current))
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return output
}

export function mergeCatalogVariants(base: Property[], liveVariants: PropertyVariant[]) {
  const liveById = new Map(liveVariants.map((variant) => [variant.id, variant]))
  return base.map((property) => {
    const variants = property.variants.map((fallbackVariant) => {
      const live = liveById.get(fallbackVariant.id)
      if (!live) return fallbackVariant
      const editorialImages = getHighResolutionImageSet(fallbackVariant.images)
      const liveImages = getHighResolutionImageSet(live.images)
      const images = [...editorialImages, ...liveImages].filter((url, index, all) => all.indexOf(url) === index)
      return {
        ...fallbackVariant,
        ...live,
        name: fallbackVariant.name,
        slug: fallbackVariant.slug,
        shortName: fallbackVariant.shortName,
        description: fallbackVariant.description,
        location: fallbackVariant.location,
        city: fallbackVariant.city,
        region: fallbackVariant.region,
        images: images.length ? images : fallbackVariant.images,
      }
    })
    const gallery = [...property.gallery, ...variants.flatMap((variant) => variant.images)].filter((url, index, all) => all.indexOf(url) === index)
    return {
      ...property,
      variants,
      heroImage: property.heroImage || variants[0]?.images[0],
      gallery: gallery.length ? gallery : property.gallery,
    }
  })
}

export function shouldUseStaticCatalogSnapshot() {
  return process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
}

export async function getCatalogSnapshotOrFallback() {
  const snapshot = await getLatestCatalogSnapshot<Property[]>().catch(() => null)
  if (!snapshot) return fallbackProperties
  const snapshotVariants = propertySchema.array().parse(snapshot).flatMap((property) => property.variants)
  return propertySchema.array().parse(mergeCatalogVariants(fallbackProperties, snapshotVariants))
}

async function fetchCatalog(): Promise<Property[]> {
  if (!isHostawayConfigured()) return fallbackProperties
  try {
    const variants = await mapWithConcurrency(allowedListingIds, 3, getHostawayListing)
    const merged = propertySchema.array().parse(mergeCatalogVariants(fallbackProperties, variants))
    await saveCatalogSnapshot(merged).catch(() => undefined)
    return merged
  } catch (error) {
    console.error("Unable to refresh Hostaway catalog", error)
    return getCatalogSnapshotOrFallback()
  }
}

const getCachedCatalog = unstable_cache(fetchCatalog, ["enchanted-havens-catalog-v19"], {
  revalidate: 3600,
  tags: ["catalog"],
})

export async function getCatalog() {
  if (shouldUseStaticCatalogSnapshot()) return getCatalogSnapshotOrFallback()
  return getCachedCatalog()
}

export async function getProperty(slug: string) {
  return (await getCatalog()).find((property) => property.slug === slug)
}

async function fetchReviews(): Promise<Review[]> {
  if (!isHostawayConfigured()) return featuredReviews
  const catalog = await getCatalog()
  const selected = catalog.filter((property) => property.featured).slice(0, 4)
  try {
    const groups = await mapWithConcurrency(selected, 2, async (property) => {
      const listingMapId = await getListingMapId(property.variants[0].id)
      return getHostawayReviews(listingMapId, property.displayName)
    })
    const reviews = groups.flat()
    return reviews.length ? reviews : featuredReviews
  } catch {
    return featuredReviews
  }
}

const getCachedFeaturedReviews = unstable_cache(fetchReviews, ["enchanted-havens-reviews-v3"], {
  revalidate: 21600,
  tags: ["reviews"],
})

export async function getFeaturedReviews() {
  if (shouldUseStaticCatalogSnapshot()) return featuredReviews
  return getCachedFeaturedReviews()
}

export function bookingIsLiveFor(listingId: number) {
  if (isSandboxBooking()) {
    return process.env.ALLOW_SANDBOX_CHECKOUT === "true" && isStripeSandboxConfigured()
  }
  if (!isHostawayConfigured() || !process.env.POSTGRES_URL || !isEmailConfigured()) return false
  const mode = process.env.BOOKING_WRITE_MODE || "disabled"
  if (mode === "live") return isStripeLiveConfigured()
  return mode === "staging" && isStripeSandboxConfigured() && String(listingId) === process.env.BOOKING_STAGING_LISTING_ID
}
