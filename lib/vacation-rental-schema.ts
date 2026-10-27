import { getAirbnbReviewDestination } from "@/lib/airbnb"
import { getBookingTermsSummary } from "@/lib/booking-terms"
import { verifiedPropertyPhotos } from "@/lib/property-photos"
import { getHighResolutionImageUrl } from "@/lib/images"
import { applyVerifiedVariantFacts, getVerifiedPropertyFacts, propertyFactDetails } from "@/lib/property-facts"
import type { Property, PropertyVariant } from "@/lib/schemas"
import { publicPropertyCoordinates } from "@/lib/property-locations"
import { absoluteUrl } from "@/lib/utils"

// Image transformations do not make a second photograph. Preserve the first
// usable URL while comparing the underlying Hostaway asset across CDN hosts.
export function propertyImageIdentity(src: string) {
  const url = new URL(src, absoluteUrl())
  if (/^(bookingenginecdn(?:-2)?\.hostaway\.com|hostaway-platform\.s3\.us-west-2\.amazonaws\.com)$/.test(url.hostname)) {
    return `hostaway:${url.pathname}`
  }
  return `${url.origin}${url.pathname}${url.search}`
}

export function propertySchemaImages(property: Property, variant: PropertyVariant, heroImage = property.heroImage) {
  const seen = new Set<string>()
  const candidates = verifiedPropertyPhotos[variant.id]?.map((photo) => photo.url) || [heroImage, ...variant.images, ...property.gallery]
  return candidates.filter((src) => {
    const key = propertyImageIdentity(src)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 12).map((src) => src.startsWith("/") ? absoluteUrl(src) : getHighResolutionImageUrl(src))
}

export function buildVacationRentalEntity(property: Property, input: PropertyVariant, heroImage = property.heroImage) {
  const variant = applyVerifiedVariantFacts(input)
  const facts = getVerifiedPropertyFacts(variant.id)
  const url = absoluteUrl(`/havens/${property.slug}`)
  const airbnb = getAirbnbReviewDestination(variant.id)
  const terms = getBookingTermsSummary(variant)
  const amenities = variant.amenities.map((name) => ({
    "@type": "LocationFeatureSpecification" as const,
    name,
    value: true,
  }))
  const time = (hour: number) => `${String(hour).padStart(2, "0")}:00:00`

  return {
    "@type": "VacationRental" as const,
    ...(facts ? { additionalType: "House" } : {}),
    "@id": `${url}#lodging`,
    identifier: `enchanted-havens-${variant.id}`,
    name: variant.shortName === property.displayName ? property.displayName : `${variant.shortName} at ${property.displayName}`,
    url,
    description: property.seoDescription || variant.description,
    image: propertySchemaImages(property, variant, heroImage),
    parentOrganization: { "@id": `${absoluteUrl()}#organization` },
    ...(airbnb.isListingSpecific ? { sameAs: [airbnb.href] } : {}),
    address: {
      "@type": "PostalAddress" as const,
      addressLocality: variant.city || property.location,
      addressRegion: "WA",
      addressCountry: "US",
    },
    ...(publicPropertyCoordinates[property.slug] ? { geo: { "@type": "GeoCoordinates", ...publicPropertyCoordinates[property.slug] } } : {}),
    currenciesAccepted: "USD",
    // Local wall-clock times avoid hard-coding PST/PDT across daylight saving.
    checkinTime: time(terms.checkInStart),
    checkoutTime: time(terms.checkOut),
    petsAllowed: true,
    amenityFeature: amenities,
    containsPlace: {
      "@type": "Accommodation" as const,
      ...(facts ? { additionalType: "EntirePlace" } : {}),
      "@id": `${url}#accommodation`,
      name: variant.shortName,
      occupancy: { "@type": "QuantitativeValue" as const, value: variant.guests },
      numberOfBedrooms: variant.bedrooms,
      // Schema.org defines this as an integer room count. A displayed 2.5
      // bathroom count stays explicit below rather than guessing the split.
      ...(Number.isInteger(variant.bathrooms) ? { numberOfBathroomsTotal: variant.bathrooms } : {}),
      // Full sleeping layouts, including folding mattresses and child beds,
      // are preserved in additionalProperty below; typed bed counts are optional.
      amenityFeature: amenities,
      petsAllowed: true,
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Bathrooms", value: variant.bathrooms },
      ...(facts ? propertyFactDetails(facts).map((detail) => ({ "@type": "PropertyValue", name: detail.label, value: detail.text })) : []),
    ],
    potentialAction: { "@type": "ReserveAction", target: `${url}#reserve` },
  }
}
