import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { BRAND_CONTACT_EMAIL, BRAND_SAME_AS } from "@/lib/brand"
import { fallbackProperties, featuredReviews } from "@/lib/editorial"
import {
  buildHavensCollectionJsonLd,
  collectionGuides,
  collectionInternalLinks,
  getCollectionPropertySummary,
  getHavensCollectionStats,
  havensCollectionFaq,
  havensCollectionKeywords,
} from "@/lib/collection-seo"

type JsonObject = { [key: string]: unknown }
type ItemListSchema = JsonObject & { itemListElement?: Array<{ item?: JsonObject }>; numberOfItems?: number }
type OfferCatalogSchema = JsonObject & { itemListElement?: JsonObject[]; numberOfItems?: number }
type FaqSchema = JsonObject & { mainEntity?: unknown[] }

describe("Havens collection SEO", () => {
  it("keeps the collection hub copy guest-facing instead of exposing SEO machinery", () => {
    const source = readFileSync("app/havens/page.tsx", "utf8")

    expect(source).toContain("Planning Questions")
    expect(source).toContain("Start with setting, season, and group fit")
    expect(source).toContain("compare the collection or ask the stay team")
    expect(source).not.toContain("Search by Setting")
    expect(source).not.toContain("Keep Exploring")
    expect(source).not.toContain("High-intent paths through the collection.")
    expect(source).not.toContain("View Destinations")
    expect(source).not.toContain("collectionGuides.map")
    expect(source).not.toContain("collectionInternalLinks.map")
    expect(source).not.toMatch(/Questions Guests Search|organic-search hub/)
    expect(source).toContain('property.slug !== "whidbey-estate"')
  })

  it("includes Reflection Point in inventory while keeping The Cove Club out of the Havens collection", () => {
    const collection = fallbackProperties.filter((property) => property.slug !== "whidbey-estate")

    expect(collection.map((property) => property.slug)).toContain("reflection-point")
    expect(collection.map((property) => property.slug)).not.toContain("whidbey-estate")
    expect(getCollectionPropertySummary(collection.find((property) => property.slug === "reflection-point")!)).toMatchObject({
      capacity: "Up to 6 guests",
      rooms: "3 bedrooms · 2 baths",
    })
  })

  it("covers core organic search intents with crawlable collection data", () => {
    expect(havensCollectionKeywords).toEqual(expect.arrayContaining([
      "Pacific Northwest vacation rentals",
      "Washington waterfront vacation rentals",
      "Washington beach house rentals",
      "Washington lake house rentals",
      "Lake Sutherland cabin rental",
      "Olympic National Park vacation rentals",
      "Olympic National Park vacation rental",
      "Port Angeles vacation rentals",
      "Hood Canal beachfront rental",
      "Whidbey Island beach house rental",
      "Whidbey Island private estate rental",
      "family reunion house Washington",
      "PNW retreat rental",
    ]))
    expect(collectionGuides.length).toBeGreaterThanOrEqual(4)
    expect(collectionInternalLinks.length).toBeGreaterThanOrEqual(6)
    expect(collectionInternalLinks.map((link) => link.href)).toContain("/stays/washington-beach-house-rentals")
    expect(collectionInternalLinks.map((link) => link.href)).toContain("/stays/washington-lake-house-rentals")
    expect(collectionInternalLinks.map((link) => link.href)).toContain("/destinations/olympic-national-park-vacation-rentals")
    expect(collectionInternalLinks.map((link) => link.href)).toContain("/destinations/port-angeles-vacation-rentals")
    expect(havensCollectionFaq.length).toBeGreaterThanOrEqual(5)
  })

  it("summarizes every published haven with capacity, room count, tags, and a property URL", () => {
    const summaries = fallbackProperties.map(getCollectionPropertySummary)
    expect(summaries).toHaveLength(fallbackProperties.length)

    for (const summary of summaries) {
      expect(summary.href).toBe(`/havens/${summary.property.slug}`)
      expect(summary.capacity).toMatch(/^Up to \d+ guests?$/)
      expect(summary.rooms).toContain("bedroom")
      expect(summary.rooms).toContain("bath")
      expect(summary.tags.length).toBeGreaterThanOrEqual(3)
      expect(summary.bestFit.length).toBeGreaterThan(40)
    }
  })

  it("uses the combined full-estate capacity for Cove Club collection copy", () => {
    const estate = fallbackProperties.find((property) => property.slug === "whidbey-estate")!
    const summary = getCollectionPropertySummary(estate)
    const stats = getHavensCollectionStats(fallbackProperties)

    expect(summary.capacity).toBe("Up to 42 guests")
    expect(stats.some((stat) => stat.value === "Up to 42 guests")).toBe(true)
  })

  it("builds CollectionPage, WebSite, brand LodgingBusiness, ItemList, BreadcrumbList, Organization, and FAQ schema", () => {
    const graph = buildHavensCollectionJsonLd(fallbackProperties, featuredReviews)["@graph"] as JsonObject[]
    const website = graph.find((item) => item["@type"] === "WebSite") as JsonObject | undefined
    const itemList = graph.find((item) => item["@type"] === "ItemList") as ItemListSchema | undefined
    const offerCatalog = graph.find((item) => item["@type"] === "OfferCatalog") as OfferCatalogSchema | undefined
    const faq = graph.find((item) => item["@type"] === "FAQPage") as FaqSchema | undefined
    const organization = graph.find((item) => item["@type"] === "Organization") as JsonObject | undefined
    const lodgingBrand = graph.find((item) => item["@id"] === "https://enchantedhavens.com/#lodging-brand") as JsonObject | undefined
    const collectionPage = graph.find((item) => item["@type"] === "CollectionPage") as JsonObject | undefined

    expect(graph.some((item) => item["@type"] === "CollectionPage")).toBe(true)
    expect(graph.some((item) => item["@type"] === "WebSite")).toBe(true)
    expect(website?.potentialAction).toMatchObject({ "@type": "SearchAction", target: "https://enchantedhavens.com/havens?checkIn={check_in}&checkOut={check_out}&guests={guests}" })
    expect(graph.some((item) => item["@type"] === "BreadcrumbList")).toBe(true)
    expect(graph.some((item) => item["@type"] === "Organization")).toBe(true)
    expect(organization?.sameAs).toEqual(BRAND_SAME_AS)
    expect(organization?.contactPoint).toEqual(expect.arrayContaining([
      expect.objectContaining({ "@type": "ContactPoint", email: BRAND_CONTACT_EMAIL, url: "https://enchantedhavens.com/contact" }),
    ]))
    expect(organization?.hasOfferCatalog).toMatchObject({ "@id": "https://enchantedhavens.com/havens#direct-book-offers" })
    expect(organization?.makesOffer).toHaveLength(fallbackProperties.length)
    expect(lodgingBrand).toMatchObject({
      "@type": "LodgingBusiness",
      hasOfferCatalog: { "@id": "https://enchantedhavens.com/havens#direct-book-offers" },
      potentialAction: { "@type": "ReserveAction", target: "https://enchantedhavens.com/havens#availability" },
    })
    expect(lodgingBrand?.sameAs).toEqual(BRAND_SAME_AS)
    expect(lodgingBrand?.aggregateRating).toMatchObject({ "@type": "AggregateRating", bestRating: 5 })
    expect(lodgingBrand?.review).toHaveLength(featuredReviews.length)
    expect(lodgingBrand?.contactPoint).toEqual(expect.arrayContaining([
      expect.objectContaining({ "@type": "ContactPoint", email: BRAND_CONTACT_EMAIL, url: "https://enchantedhavens.com/contact" }),
    ]))
    expect(collectionPage?.isPartOf).toEqual({ "@id": "https://enchantedhavens.com/#website" })
    expect(collectionPage?.hasPart).toEqual(expect.arrayContaining([
      { "@id": "https://enchantedhavens.com/havens#collection" },
      { "@id": "https://enchantedhavens.com/havens#direct-book-offers" },
      { "@id": "https://enchantedhavens.com/havens#faq" },
      { "@id": "https://enchantedhavens.com/destinations/lake-sutherland-vacation-rentals#webpage" },
    ]))
    const primaryImage = collectionPage?.primaryImageOfPage as JsonObject | undefined
    expect(primaryImage).toMatchObject({
      "@type": "ImageObject",
      url: "https://enchantedhavens.com/images/home-hero/heros-zip/hero-07.webp",
      representativeOfPage: true,
    })
    expect(`${primaryImage?.caption}`).toContain("Pacific Northwest")
    expect(collectionPage?.significantLink).toEqual(expect.arrayContaining([
      "https://enchantedhavens.com/havens/blue-haven",
      "https://enchantedhavens.com/havens/whidbey-estate",
      "https://enchantedhavens.com/stays/pacific-northwest-vacation-rentals",
    ]))
    expect(offerCatalog?.numberOfItems).toBe(fallbackProperties.length)
    expect(offerCatalog?.itemListElement).toHaveLength(fallbackProperties.length)
    expect(offerCatalog?.itemListElement?.[0]).toMatchObject({
      "@type": "Offer",
      availability: "https://schema.org/LimitedAvailability",
      businessFunction: "https://purl.org/goodrelations/v1#LeaseOut",
      seller: { "@id": "https://enchantedhavens.com/#lodging-brand" },
      potentialAction: { "@type": "ReserveAction", target: expect.stringMatching(/#reserve$/) },
    })
    expect(itemList?.numberOfItems).toBe(fallbackProperties.length)
    expect(itemList?.itemListElement).toHaveLength(fallbackProperties.length)
    expect(itemList?.itemListElement?.every((item) => Boolean((item.item?.offers as JsonObject | undefined)?.["@id"]))).toBe(true)
    expect(itemList?.itemListElement?.every((item) => (item.item?.potentialAction as JsonObject | undefined)?.["@type"] === "ReserveAction")).toBe(true)
    expect(faq?.mainEntity).toHaveLength(havensCollectionFaq.length)
  })
})
