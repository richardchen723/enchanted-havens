import { describe, expect, it } from "vitest"
import { fallbackProperties, featuredReviews } from "@/lib/editorial"
import { getAirbnbReviewDestination } from "@/lib/airbnb"
import { buildVacationRentalEntity, propertyImageIdentity, propertySchemaImages } from "@/lib/vacation-rental-schema"
import { publicPropertyCoordinates } from "@/lib/property-locations"
import { buildPropertyJsonLd } from "@/lib/property-seo"
import { buildHomeJsonLd } from "@/lib/home-seo"
import { buildHavensCollectionJsonLd } from "@/lib/collection-seo"
import { buildHubJsonLd, buildLandingPageJsonLd } from "@/lib/landing-page-seo"
import { seoHubs, seoLandingPages } from "@/lib/seo-pages"
import { getVerifiedPropertyFacts } from "@/lib/property-facts"

type Entity = Record<string, unknown>
function entities(value: unknown, type: string): Entity[] {
  if (!value || typeof value !== "object") return []
  if (Array.isArray(value)) return value.flatMap((item) => entities(item, type))
  const node = value as Entity
  return [...(node["@type"] === type ? [node] : []), ...Object.values(node).flatMap((item) => entities(item, type))]
}

describe("consistent vacation-rental identity", () => {
  it.each(fallbackProperties)("publishes approved facts and coordinates for $slug without a street address", (property) => {
    const variant = property.variants[0]
    const facts = getVerifiedPropertyFacts(variant.id)!
    const entity = buildVacationRentalEntity(property, { ...variant, guests: 99, amenities: [...variant.amenities, "Events allowed"] })
    expect(entity["@type"]).toBe("VacationRental")
    expect(entity.identifier).toBe(`enchanted-havens-${variant.id}`)
    expect(entity.sameAs).toEqual([getAirbnbReviewDestination(variant.id).href])
    expect(entity.geo).toEqual({ "@type": "GeoCoordinates", ...publicPropertyCoordinates[property.slug] })
    expect(entity.address).not.toHaveProperty("streetAddress")
    expect(entity.address).not.toHaveProperty("postalCode")
    expect(entity.containsPlace.occupancy).toEqual({ "@type": "QuantitativeValue", value: facts.maxGuests })
    expect(entity.additionalProperty).toContainEqual({ "@type": "PropertyValue", name: "Sleeping arrangements", value: facts.sleeping })
    expect(entity.containsPlace.petsAllowed).toBe(true)
    expect(entity).not.toHaveProperty("makesOffer")
    expect(entity.amenityFeature.map((item) => item.name)).not.toContain("Events allowed")
    expect(entity.image).toHaveLength(8)
    expect(new Set(entity.image.map(propertyImageIdentity)).size).toBe(8)
    expect(entity.currenciesAccepted).toBe("USD")
    expect(entity.checkinTime).toMatch(/^\d{2}:00:00$/)
    expect(entity).not.toHaveProperty("aggregateRating")
    expect(entity).not.toHaveProperty("review")
    if (!Number.isInteger(variant.bathrooms)) expect(entity.containsPlace).not.toHaveProperty("numberOfBathroomsTotal")
    expect(buildVacationRentalEntity({ ...property, displayName: "Renamed home" }, variant).identifier).toBe(entity.identifier)
  })

  it("retains complete amenities and deduplicates transformations of the same photo", () => {
    const property = fallbackProperties[0]
    const amenityNames = Array.from({ length: 20 }, (_, index) => `Verified amenity ${index + 1}`)
    const entity = buildVacationRentalEntity(property, { ...property.variants[0], amenities: amenityNames })
    expect(entity.amenityFeature.map((item) => item.name)).toEqual(expect.arrayContaining(amenityNames))
    const first = "https://bookingenginecdn.hostaway.com/listing/same?width=100"
    const second = "https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/same?width=200"
    const third = "https://bookingenginecdn.hostaway.com/listing/other"
    const photos = propertySchemaImages({ ...property, heroImage: first, gallery: [second, third] }, { ...property.variants[0], id: 999999, images: [first, second, third] })
    expect(photos).toHaveLength(2)
    expect(new Set(photos.map(propertyImageIdentity)).size).toBe(2)
  })

  it("uses the same property identities and factual records on every page family", () => {
    const guide = seoLandingPages.find((page) => page.slug === "pacific-northwest-vacation-rentals")!
    const graphs: unknown[] = [
      buildHomeJsonLd({ catalog: fallbackProperties, reviews: featuredReviews }),
      buildHavensCollectionJsonLd(fallbackProperties),
      buildLandingPageJsonLd({ page: guide, properties: fallbackProperties, reviews: featuredReviews }),
      buildHubJsonLd({ hub: seoHubs.destinations, pages: seoLandingPages.filter((page) => page.group === "destinations"), properties: fallbackProperties, reviews: featuredReviews }),
    ]
    for (const property of fallbackProperties) {
      graphs.push(buildPropertyJsonLd({ property, variant: property.variants[0], reviews: featuredReviews, path: `/havens/${property.slug}`, heroImage: property.heroImage }))
    }
    for (const graph of graphs) {
      const rentals = entities(graph, "VacationRental")
      expect(rentals.length).toBeGreaterThan(0)
      for (const rental of rentals) {
        const property = fallbackProperties.find((home) => rental.identifier === `enchanted-havens-${home.variants[0].id}`)!
        const expected = buildVacationRentalEntity(property, property.variants[0])
        expect(rental).toMatchObject(expected)
      }
      expect(entities(graph, "AggregateRating")).toEqual([])
      for (const offer of entities(graph, "Offer")) {
        expect(offer).not.toHaveProperty("availability")
        expect(offer).not.toHaveProperty("price")
        expect(offer).not.toHaveProperty("priceCurrency")
      }
    }
  })
})
