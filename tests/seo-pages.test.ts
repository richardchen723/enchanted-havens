import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { buildSitemap } from "@/app/sitemap"
import { BRAND_CONTACT_EMAIL, BRAND_SAME_AS } from "@/lib/brand"
import { fallbackProperties, featuredReviews } from "@/lib/editorial"
import { collectionGuides, collectionInternalLinks } from "@/lib/collection-seo"
import { getHubMatchedProperties } from "@/lib/hub-matched-properties"
import { homeSeoLinks } from "@/lib/home-seo"
import { buildHubJsonLd, buildLandingPageJsonLd } from "@/lib/landing-page-seo"
import { getPropertySeoContent } from "@/lib/property-seo"
import { amenityPages, destinationPages, experienceHub, experienceLandingPages, getSeoPagesByGroup, groupPages, seoHubs, seoLandingPages, stayPages } from "@/lib/seo-pages"
import { absoluteUrl } from "@/lib/utils"

type JsonObject = { [key: string]: unknown }
type ItemListSchema = JsonObject & { itemListElement?: Array<{ item?: JsonObject }>; numberOfItems?: number }
type OfferCatalogSchema = JsonObject & { itemListElement?: JsonObject[]; numberOfItems?: number }
type FaqSchema = JsonObject & { mainEntity?: unknown[] }

describe("evergreen SEO landing architecture", () => {
  it("keeps the reusable landing-page UI guest-facing and proof-rich", () => {
    const source = readFileSync("components/seo-landing-page.tsx", "utf8")

    expect(source).toContain("Guest Confidence")
    expect(source).toContain("real guest reflections")
    expect(source).toContain("View @enchanted.havens")
    expect(source).toContain("Planning Details")
    expect(source).toContain("Local Fit")
    expect(source).toContain("Compare Havens")
    expect(source).toContain("Compare Matched Havens")
    expect(source).toContain("Compare the setting, capacity, and rhythm of each stay")
    expect(source).toContain("Homes this path returns to again and again.")
    expect(source).toContain("Best Fit")
    expect(source).toContain("Select dates for exact pricing")
    expect(source).toContain("Booking Clarity")
    expect(source).toContain("aria-label=\"Breadcrumb\"")
    expect(source).not.toMatch(/Search Intent|Trust Signals|Questions Guests Search|Hub Questions|Evergreen Search Guides|Referenced across|Common in/)
  })

  it("publishes destination, stay-type, group, experience, and amenity pages", () => {
    expect(destinationPages.length).toBeGreaterThanOrEqual(11)
    expect(stayPages.length).toBeGreaterThanOrEqual(10)
    expect(groupPages.length).toBeGreaterThanOrEqual(7)
    expect(experienceLandingPages.length).toBeGreaterThanOrEqual(5)
    expect(amenityPages.length).toBeGreaterThanOrEqual(6)
  })

  it("keeps every SEO hub substantial enough for broad crawlable search", () => {
    for (const hub of [...Object.values(seoHubs), experienceHub]) {
      expect(hub.keywords.length, hub.path).toBeGreaterThanOrEqual(3)
      expect(hub.faq.length, hub.path).toBeGreaterThanOrEqual(3)
      expect(hub.metaDescription.length, hub.path).toBeGreaterThan(90)
    }
  })

  it("matches hub pages to the homes most referenced by their guide set", () => {
    const destinationMatches = getHubMatchedProperties({ pages: getSeoPagesByGroup("destinations"), catalog: fallbackProperties })
    const groupMatches = getHubMatchedProperties({ pages: getSeoPagesByGroup("groups"), catalog: fallbackProperties })

    expect(destinationMatches.map((match) => match.property.slug).slice(0, 3)).toEqual([
      "blue-haven",
      "emerald-haven",
      "reflection-haven",
    ])
    expect(destinationMatches[0].guideCount).toBeGreaterThan(destinationMatches.at(-1)?.guideCount || 0)
    expect(groupMatches.map((match) => match.property.slug)).toContain("whidbey-estate")
    expect(groupMatches.find((match) => match.property.slug === "whidbey-estate")?.relatedPages.length).toBeGreaterThanOrEqual(4)
  })

  it("covers the highest-intent search themes with dedicated pages", () => {
    const slugs = seoLandingPages.map((page) => page.slug)
    expect(slugs).toEqual(expect.arrayContaining([
      "pacific-northwest-vacation-rentals",
      "direct-book-vacation-rentals-washington",
      "washington-waterfront-vacation-rentals",
      "washington-beach-house-rentals",
      "washington-lake-house-rentals",
      "washington-cabin-rentals",
      "washington-vacation-rentals-near-seattle",
      "lake-sutherland-vacation-rentals",
      "lake-crescent-vacation-rentals",
      "port-angeles-vacation-rentals",
      "port-angeles-lake-house-rentals",
      "olympic-national-park-vacation-rentals",
      "olympic-peninsula-vacation-rentals",
      "hood-canal-beachfront-rentals",
      "whidbey-island-vacation-rentals",
      "whidbey-island-private-estate-rentals",
      "luxury-vacation-rentals-near-seattle",
      "family-reunion-house-washington",
      "washington-group-vacation-rentals",
      "washington-wedding-lodging",
      "pnw-retreat-rental",
      "company-retreat-rental-pnw",
      "private-estate-rental-washington",
      "washington-hot-tub-vacation-rentals",
      "washington-sauna-vacation-rentals",
      "washington-vacation-rentals-with-private-dock",
      "pet-friendly-vacation-rentals-washington",
    ]))
  })

  it("keeps landing pages substantial and connected to real inventory", () => {
    const propertySlugs = new Set(fallbackProperties.map((property) => property.slug))
    const pagePaths = new Set(seoLandingPages.map((page) => page.path))
    const allowedExternalInternalPaths = new Set(["/contact"])

    for (const page of seoLandingPages) {
      expect(page.h1.length, page.path).toBeGreaterThan(40)
      expect(page.metaDescription.length, page.path).toBeGreaterThan(90)
      expect(page.highlights.length, page.path).toBeGreaterThanOrEqual(3)
      expect(page.sections.length, page.path).toBeGreaterThanOrEqual(3)
      expect(page.faq.length, page.path).toBeGreaterThanOrEqual(3)
      expect(page.keywords.length, page.path).toBeGreaterThanOrEqual(3)
      expect(page.propertySlugs.length, page.path).toBeGreaterThanOrEqual(1)
      for (const slug of page.propertySlugs) expect(propertySlugs.has(slug), `${page.path} -> ${slug}`).toBe(true)
      for (const relatedPath of page.relatedPaths) expect(pagePaths.has(relatedPath) || allowedExternalInternalPaths.has(relatedPath), `${page.path} -> ${relatedPath}`).toBe(true)
    }
  })

  it("keeps every evergreen landing page supported by the internal link graph", () => {
    const inboundCounts = new Map(seoLandingPages.map((page) => [page.path, 0]))
    const countLink = (href: string) => {
      if (!inboundCounts.has(href)) return
      inboundCounts.set(href, inboundCounts.get(href)! + 1)
    }

    for (const link of homeSeoLinks) countLink(link.href)
    for (const link of collectionInternalLinks) countLink(link.href)
    for (const guide of collectionGuides) countLink(guide.href)
    for (const property of fallbackProperties) {
      for (const link of getPropertySeoContent(property).relatedLinks) countLink(link.href)
    }
    for (const page of seoLandingPages) {
      for (const relatedPath of page.relatedPaths) countLink(relatedPath)
    }

    for (const page of seoLandingPages) {
      expect(inboundCounts.get(page.path), page.path).toBeGreaterThanOrEqual(2)
    }
  })

  it("exposes hubs and all landing pages in the sitemap", async () => {
    const urls = new Set(buildSitemap(fallbackProperties).map((entry) => entry.url))
    for (const hub of Object.values(seoHubs)) expect(urls.has(absoluteUrl(hub.path)), hub.path).toBe(true)
    for (const page of seoLandingPages) expect(urls.has(absoluteUrl(page.path)), page.path).toBe(true)
  })

  it("builds rich brand, review, FAQ, collection, and direct-book schema for landing pages", () => {
    const page = seoLandingPages.find((item) => item.slug === "luxury-vacation-rentals-near-seattle")!
    const properties = page.propertySlugs.flatMap((slug) => fallbackProperties.find((property) => property.slug === slug) || [])
    const graph = buildLandingPageJsonLd({ page, properties, reviews: featuredReviews })["@graph"] as JsonObject[]
    const website = graph.find((item) => item["@type"] === "WebSite") as JsonObject | undefined
    const brand = graph.find((item) => item["@id"] === `${absoluteUrl()}#lodging-brand`) as JsonObject | undefined
    const collectionPage = graph.find((item) => item["@type"] === "CollectionPage") as JsonObject | undefined
    const itemList = graph.find((item) => item["@type"] === "ItemList") as ItemListSchema | undefined
    const offerCatalog = graph.find((item) => item["@type"] === "OfferCatalog") as OfferCatalogSchema | undefined
    const faq = graph.find((item) => item["@type"] === "FAQPage") as FaqSchema | undefined
    const spatialCoverage = collectionPage?.spatialCoverage as JsonObject[] | undefined
    const areaServed = brand?.areaServed as string[] | undefined

    expect(graph.some((item) => item["@type"] === "Organization")).toBe(true)
    expect(website?.potentialAction).toMatchObject({ "@type": "SearchAction" })
    expect(collectionPage).toMatchObject({ publisher: { "@id": `${absoluteUrl()}#organization` }, mainEntity: { "@id": `${absoluteUrl(page.path)}#collection` } })
    expect(collectionPage?.hasPart).toEqual(expect.arrayContaining([
      { "@id": `${absoluteUrl(page.path)}#collection` },
      { "@id": `${absoluteUrl(page.path)}#direct-book-offers` },
      { "@id": `${absoluteUrl(page.path)}#faq` },
    ]))
    const primaryImage = collectionPage?.primaryImageOfPage as JsonObject | undefined
    expect(primaryImage).toMatchObject({
      "@type": "ImageObject",
      caption: page.imageAlt,
      representativeOfPage: true,
    })
    expect(collectionPage?.significantLink).toEqual(expect.arrayContaining([
      absoluteUrl("/havens/whidbey-estate"),
      absoluteUrl("/havens/fair-haven"),
      absoluteUrl("/havens"),
    ]))
    expect(spatialCoverage?.some((place) => place.name === "Whidbey Island")).toBe(true)
    expect(areaServed).toEqual(expect.arrayContaining(["Whidbey Island", "Freeland"]))
    expect(brand?.sameAs).toEqual(BRAND_SAME_AS)
    expect(brand?.contactPoint).toEqual(expect.arrayContaining([
      expect.objectContaining({ "@type": "ContactPoint", email: BRAND_CONTACT_EMAIL, url: absoluteUrl("/contact") }),
    ]))
    expect(brand?.aggregateRating).toMatchObject({ "@type": "AggregateRating", bestRating: 5 })
    expect(brand?.review).toHaveLength(featuredReviews.length)
    expect(brand?.potentialAction).toMatchObject({ "@type": "ReserveAction", target: absoluteUrl("/havens#availability") })
    expect(brand?.hasOfferCatalog).toMatchObject({ "@id": `${absoluteUrl(page.path)}#direct-book-offers` })
    expect(brand?.makesOffer).toHaveLength(properties.length)
    expect(offerCatalog?.numberOfItems).toBe(properties.length)
    expect(offerCatalog?.itemListElement).toHaveLength(properties.length)
    expect(offerCatalog?.itemListElement?.[0]).toMatchObject({
      "@type": "Offer",
      availability: "https://schema.org/LimitedAvailability",
      businessFunction: "https://purl.org/goodrelations/v1#LeaseOut",
      potentialAction: { "@type": "ReserveAction", target: expect.stringMatching(/#reserve$/) },
    })
    expect(itemList?.numberOfItems).toBe(properties.length)
    expect(itemList?.itemListElement).toHaveLength(properties.length)
    expect(itemList?.itemListElement?.every((item) => (item.item?.potentialAction as JsonObject | undefined)?.["@type"] === "ReserveAction")).toBe(true)
    expect(itemList?.itemListElement?.every((item) => Boolean((item.item?.offers as JsonObject | undefined)?.["@id"]))).toBe(true)
    expect(faq?.mainEntity).toHaveLength(page.faq.length)
  })

  it("publishes a dedicated company-retreat page with permit-safe planning content", () => {
    const page = seoLandingPages.find((item) => item.slug === "company-retreat-rental-pnw")!

    expect(page.path).toBe("/groups/company-retreat-rental-pnw")
    expect(page.group).toBe("groups")
    expect(page.primaryKeyword).toBe("company retreat rental PNW")
    expect(page.keywords).toEqual(expect.arrayContaining([
      "Pacific Northwest company retreat rental",
      "Washington company retreat rental",
      "leadership retreat rental PNW",
    ]))
    expect(page.propertySlugs).toEqual(expect.arrayContaining([
      "whidbey-estate",
      "fair-haven",
      "reflection-haven",
      "aurora-haven",
      "emerald-haven",
    ]))
    expect([...page.sections.map((section) => section.body), ...page.faq.map((item) => item.answer)].join(" ")).toMatch(/vendors|parking|quiet hours|property-specific rules/i)
    expect(page.relatedPaths).toEqual(expect.arrayContaining([
      "/groups/pnw-retreat-rental",
      "/stays/luxury-vacation-rentals-near-seattle",
      "/groups/private-estate-rental-washington",
    ]))
  })

  it("publishes a dedicated Washington group vacation page for large-group booking intent", () => {
    const page = seoLandingPages.find((item) => item.slug === "washington-group-vacation-rentals")!

    expect(page.path).toBe("/groups/washington-group-vacation-rentals")
    expect(page.group).toBe("groups")
    expect(page.primaryKeyword).toBe("Washington group vacation rental")
    expect(page.keywords).toEqual(expect.arrayContaining([
      "large group vacation rental Washington",
      "large vacation rental Washington",
      "large family vacation rental Washington",
      "PNW group vacation rental",
    ]))
    expect(page.propertySlugs).toEqual(expect.arrayContaining([
      "whidbey-estate",
      "sea-renity-haven",
      "emerald-haven",
      "fair-haven",
      "reflection-haven",
      "aurora-haven",
    ]))
    expect([...page.sections.map((section) => section.body), ...page.faq.map((item) => item.answer)].join(" ")).toMatch(/bedrooms|bathrooms|parking|extra visitors|vendors/i)
    expect(page.relatedPaths).toEqual(expect.arrayContaining([
      "/groups/family-reunion-house-washington",
      "/groups/private-estate-rental-washington",
      "/groups/pnw-retreat-rental",
    ]))
  })

  it("publishes a permit-safe Washington wedding lodging page", () => {
    const page = seoLandingPages.find((item) => item.slug === "washington-wedding-lodging")!

    expect(page.path).toBe("/groups/washington-wedding-lodging")
    expect(page.group).toBe("groups")
    expect(page.primaryKeyword).toBe("Washington wedding lodging")
    expect(page.keywords).toEqual(expect.arrayContaining([
      "wedding guest lodging Washington",
      "Whidbey Island wedding lodging",
      "private estate wedding stay Washington",
      "wedding weekend rental Washington",
    ]))
    expect(page.propertySlugs).toEqual(expect.arrayContaining([
      "whidbey-estate",
      "fair-haven",
      "sea-renity-haven",
    ]))
    expect([...page.sections.map((section) => section.body), ...page.faq.map((item) => item.answer)].join(" ")).toMatch(/ceremonies|vendors|parking|permits|insurance|quiet hours/i)
    expect(page.relatedPaths).toEqual(expect.arrayContaining([
      "/groups/private-estate-rental-washington",
      "/groups/intimate-event-stays-washington",
      "/destinations/whidbey-island-private-estate-rentals",
      "/experiences/private-estate-gatherings",
    ]))
  })

  it("publishes a dedicated near-Seattle weekend page for short-stay search intent", () => {
    const page = seoLandingPages.find((item) => item.slug === "washington-vacation-rentals-near-seattle")!

    expect(page.path).toBe("/stays/washington-vacation-rentals-near-seattle")
    expect(page.group).toBe("stays")
    expect(page.primaryKeyword).toBe("Washington vacation rentals near Seattle")
    expect(page.keywords).toEqual(expect.arrayContaining([
      "Seattle weekend getaway rental",
      "weekend getaway near Seattle",
      "waterfront rentals near Seattle",
      "lake house rental near Seattle",
    ]))
    expect(page.propertySlugs).toEqual(expect.arrayContaining([
      "whidbey-estate",
      "fair-haven",
      "sea-renity-haven",
    ]))
    expect([...page.sections.map((section) => section.body), ...page.faq.map((item) => item.answer)].join(" ")).toMatch(/Whidbey Island|Hood Canal|Seattle|weekend/i)
    expect(page.relatedPaths).toEqual(expect.arrayContaining([
      "/stays/luxury-vacation-rentals-near-seattle",
      "/destinations/whidbey-island-private-estate-rentals",
      "/destinations/hood-canal-beachfront-rentals",
    ]))
  })

  it("publishes a Lake Crescent-area destination page without implying in-park lodging", () => {
    const page = seoLandingPages.find((item) => item.slug === "lake-crescent-vacation-rentals")!

    expect(page.path).toBe("/destinations/lake-crescent-vacation-rentals")
    expect(page.group).toBe("destinations")
    expect(page.primaryKeyword).toBe("Lake Crescent vacation rental")
    expect(page.keywords).toEqual(expect.arrayContaining([
      "Lake Crescent vacation rentals",
      "cabins near Lake Crescent",
      "vacation rental near Lake Crescent",
      "Lake Crescent cabin rental",
      "Olympic National Park lodging alternative",
    ]))
    expect(page.propertySlugs).toEqual(expect.arrayContaining([
      "blue-haven",
      "emerald-haven",
      "reflection-haven",
      "aurora-haven",
    ]))
    const copy = [...page.sections.map((section) => section.body), ...page.faq.map((item) => item.answer)].join(" ")
    expect(copy).toMatch(/Lake Crescent|Lake Sutherland|Port Angeles|Olympic National Park|not inside|nearby/i)
    expect(page.relatedPaths).toEqual(expect.arrayContaining([
      "/destinations/lake-sutherland-vacation-rentals",
      "/destinations/port-angeles-lake-house-rentals",
      "/experiences/olympic-national-park-basecamp",
      "/stays/lakefront-cabins-washington",
    ]))
  })

  it("publishes a dedicated Olympic National Park vacation rentals page without implying in-park lodging", () => {
    const page = seoLandingPages.find((item) => item.slug === "olympic-national-park-vacation-rentals")!

    expect(page.path).toBe("/destinations/olympic-national-park-vacation-rentals")
    expect(page.group).toBe("destinations")
    expect(page.primaryKeyword).toBe("Olympic National Park vacation rental")
    expect(page.keywords).toEqual(expect.arrayContaining([
      "vacation rentals near Olympic National Park",
      "Olympic National Park lodging alternative",
      "Port Angeles vacation rental",
      "Lake Sutherland Olympic National Park rental",
      "Lake Crescent vacation rental",
    ]))
    expect(page.propertySlugs).toEqual(expect.arrayContaining([
      "blue-haven",
      "emerald-haven",
      "reflection-haven",
      "aurora-haven",
    ]))
    const copy = [...page.sections.map((section) => section.body), ...page.faq.map((item) => item.answer)].join(" ")
    expect(copy).toMatch(/outside Olympic National Park|Lake Sutherland|Port Angeles|Lake Crescent|Hurricane Ridge|directly/i)
    expect(page.relatedPaths).toEqual(expect.arrayContaining([
      "/destinations/port-angeles-lake-house-rentals",
      "/destinations/lake-sutherland-vacation-rentals",
      "/destinations/lake-crescent-vacation-rentals",
      "/destinations/olympic-peninsula-vacation-rentals",
      "/experiences/olympic-national-park-basecamp",
    ]))
  })

  it("publishes a broad Port Angeles destination page for park, lake, and town-logistics search intent", () => {
    const page = seoLandingPages.find((item) => item.slug === "port-angeles-vacation-rentals")!

    expect(page.path).toBe("/destinations/port-angeles-vacation-rentals")
    expect(page.group).toBe("destinations")
    expect(page.primaryKeyword).toBe("Port Angeles vacation rental")
    expect(page.keywords).toEqual(expect.arrayContaining([
      "Port Angeles vacation rentals",
      "vacation rentals near Olympic National Park",
      "Lake Sutherland vacation rental",
      "Lake Crescent vacation rental",
      "Olympic Peninsula vacation rental",
    ]))
    expect(page.propertySlugs).toEqual(expect.arrayContaining([
      "blue-haven",
      "emerald-haven",
      "reflection-haven",
      "aurora-haven",
    ]))
    const copy = [...page.sections.map((section) => section.body), ...page.faq.map((item) => item.answer)].join(" ")
    expect(copy).toMatch(/Port Angeles|Lake Sutherland|Lake Crescent|Hurricane Ridge|Sol Duc|groceries|ferries|restaurants/i)
    expect(page.relatedPaths).toEqual(expect.arrayContaining([
      "/destinations/port-angeles-lake-house-rentals",
      "/destinations/olympic-national-park-vacation-rentals",
      "/destinations/lake-sutherland-vacation-rentals",
      "/destinations/lake-crescent-vacation-rentals",
      "/stays/washington-lake-house-rentals",
      "/destinations/olympic-peninsula-vacation-rentals",
    ]))
  })

  it("publishes a broad Whidbey Island destination page beyond private-estate intent", () => {
    const page = seoLandingPages.find((item) => item.slug === "whidbey-island-vacation-rentals")!

    expect(page.path).toBe("/destinations/whidbey-island-vacation-rentals")
    expect(page.group).toBe("destinations")
    expect(page.primaryKeyword).toBe("Whidbey Island vacation rentals")
    expect(page.keywords).toEqual(expect.arrayContaining([
      "Whidbey Island vacation rental",
      "Whidbey Island waterfront rental",
      "Oak Harbor vacation rental",
      "Freeland vacation rental",
      "Whidbey Island rentals near Seattle",
    ]))
    expect(page.propertySlugs).toEqual(expect.arrayContaining([
      "sea-renity-haven",
      "whidbey-estate",
    ]))
    expect([...page.sections.map((section) => section.body), ...page.faq.map((item) => item.answer)].join(" ")).toMatch(/Oak Harbor|Freeland|Seattle|ferry|Deception Pass|The Cove Club/i)
    expect(page.relatedPaths).toEqual(expect.arrayContaining([
      "/destinations/whidbey-island-private-estate-rentals",
      "/stays/washington-vacation-rentals-near-seattle",
      "/destinations/puget-sound-waterfront-rentals",
      "/groups/washington-wedding-lodging",
    ]))
  })

  it("publishes a dedicated direct-book page for OTA-alternative search intent", () => {
    const page = seoLandingPages.find((item) => item.slug === "direct-book-vacation-rentals-washington")!

    expect(page.path).toBe("/stays/direct-book-vacation-rentals-washington")
    expect(page.group).toBe("stays")
    expect(page.primaryKeyword).toBe("direct book vacation rentals Washington")
    expect(page.keywords).toEqual(expect.arrayContaining([
      "book direct vacation rentals Washington",
      "direct booking vacation rentals PNW",
      "Pacific Northwest direct book rentals",
    ]))
    expect(page.propertySlugs).toEqual(expect.arrayContaining([
      "blue-haven",
      "sea-renity-haven",
      "emerald-haven",
      "fair-haven",
      "aurora-haven",
      "reflection-haven",
      "whidbey-estate",
    ]))
    expect([...page.sections.map((section) => section.body), ...page.faq.map((item) => item.answer)].join(" ")).toMatch(/exact pricing|availability|stay team|direct booking|third-party listing/i)
    expect(page.relatedPaths).toEqual(expect.arrayContaining([
      "/stays/pacific-northwest-vacation-rentals",
      "/stays/washington-waterfront-vacation-rentals",
      "/stays/washington-vacation-rentals-near-seattle",
      "/groups/washington-group-vacation-rentals",
    ]))
  })

  it("publishes a Washington beach house page for beachfront and oceanfront search intent", () => {
    const page = seoLandingPages.find((item) => item.slug === "washington-beach-house-rentals")!

    expect(page.path).toBe("/stays/washington-beach-house-rentals")
    expect(page.group).toBe("stays")
    expect(page.primaryKeyword).toBe("Washington beach house rental")
    expect(page.keywords).toEqual(expect.arrayContaining([
      "Washington beach house rentals",
      "Washington beachfront vacation rental",
      "Hood Canal beach house rental",
      "Whidbey Island beach house rental",
      "PNW beach house rental",
    ]))
    expect(page.propertySlugs).toEqual(expect.arrayContaining([
      "fair-haven",
      "sea-renity-haven",
      "whidbey-estate",
    ]))
    const copy = [...page.sections.map((section) => section.body), ...page.faq.map((item) => item.answer)].join(" ")
    expect(copy).toMatch(/Hood Canal|Whidbey Island|Oak Harbor|Freeland|Puget Sound|beachfront|oceanfront|tides|quiet hours/i)
    expect(page.relatedPaths).toEqual(expect.arrayContaining([
      "/destinations/hood-canal-beachfront-rentals",
      "/destinations/whidbey-island-vacation-rentals",
      "/stays/washington-waterfront-vacation-rentals",
      "/destinations/puget-sound-waterfront-rentals",
    ]))
  })

  it("publishes a Washington lake house page for lake, dock, and Port Angeles search intent", () => {
    const page = seoLandingPages.find((item) => item.slug === "washington-lake-house-rentals")!

    expect(page.path).toBe("/stays/washington-lake-house-rentals")
    expect(page.group).toBe("stays")
    expect(page.primaryKeyword).toBe("Washington lake house rental")
    expect(page.keywords).toEqual(expect.arrayContaining([
      "Washington lake house rentals",
      "Washington lakefront vacation rental",
      "Lake Sutherland lake house rental",
      "Port Angeles lake house rental",
      "Lake Crescent vacation rental",
    ]))
    expect(page.propertySlugs).toEqual(expect.arrayContaining([
      "emerald-haven",
      "blue-haven",
      "reflection-haven",
    ]))
    const copy = [...page.sections.map((section) => section.body), ...page.faq.map((item) => item.answer)].join(" ")
    expect(copy).toMatch(/Lake Sutherland|Port Angeles|Lake Crescent|Olympic National Park|dock|kayaks|hot tub/i)
    expect(page.relatedPaths).toEqual(expect.arrayContaining([
      "/destinations/lake-sutherland-vacation-rentals",
      "/destinations/port-angeles-lake-house-rentals",
      "/destinations/lake-crescent-vacation-rentals",
      "/stays/lakefront-cabins-washington",
      "/amenities/washington-vacation-rentals-with-private-dock",
      "/experiences/lake-days-kayaks-docks",
    ]))
  })

  it("publishes a dedicated Washington cabin page for lake, forest, and near-Seattle cabin searches", () => {
    const page = seoLandingPages.find((item) => item.slug === "washington-cabin-rentals")!

    expect(page.path).toBe("/stays/washington-cabin-rentals")
    expect(page.group).toBe("stays")
    expect(page.primaryKeyword).toBe("Washington cabin rentals")
    expect(page.keywords).toEqual(expect.arrayContaining([
      "Washington cabin rental",
      "Olympic Peninsula cabin rental",
      "cabins near Seattle",
      "Washington cabin rentals with hot tub",
    ]))
    expect(page.propertySlugs).toEqual(expect.arrayContaining([
      "blue-haven",
      "emerald-haven",
      "reflection-haven",
      "aurora-haven",
      "fair-haven",
    ]))
    expect([...page.sections.map((section) => section.body), ...page.faq.map((item) => item.answer)].join(" ")).toMatch(/Lake Sutherland|Olympic Peninsula|Hood Canal|Seattle/i)
    expect(page.relatedPaths).toEqual(expect.arrayContaining([
      "/stays/lakefront-cabins-washington",
      "/stays/forest-retreats-washington",
      "/stays/luxury-vacation-rentals-near-seattle",
    ]))
  })

  it("builds rich brand, review, FAQ, guide-list, and direct-book schema for hub pages", () => {
    for (const hub of [...Object.values(seoHubs), experienceHub]) {
      const pages = hub.group === "experiences" ? experienceLandingPages : getSeoPagesByGroup(hub.group)
      const matchedProperties = getHubMatchedProperties({ pages, catalog: fallbackProperties })
      const graph = buildHubJsonLd({ hub, pages, reviews: featuredReviews, heroImage: fallbackProperties[0].heroImage, properties: fallbackProperties })["@graph"] as JsonObject[]
      const website = graph.find((item) => item["@type"] === "WebSite") as JsonObject | undefined
      const brand = graph.find((item) => item["@id"] === `${absoluteUrl()}#lodging-brand`) as JsonObject | undefined
      const collectionPage = graph.find((item) => item["@type"] === "CollectionPage") as JsonObject | undefined
      const itemList = graph.find((item) => item["@id"] === `${absoluteUrl(hub.path)}#guides`) as ItemListSchema | undefined
      const matchedHavens = graph.find((item) => item["@id"] === `${absoluteUrl(hub.path)}#matched-havens`) as ItemListSchema | undefined
      const faq = graph.find((item) => item["@type"] === "FAQPage") as FaqSchema | undefined
      const guideItem = itemList?.itemListElement?.[0]?.item as JsonObject | undefined
      const spatialCoverage = collectionPage?.spatialCoverage as JsonObject[] | undefined

      expect(graph.some((item) => item["@type"] === "Organization"), hub.path).toBe(true)
      expect(website?.potentialAction, hub.path).toMatchObject({ "@type": "SearchAction" })
      expect(collectionPage, hub.path).toMatchObject({ publisher: { "@id": `${absoluteUrl()}#organization` }, mainEntity: { "@id": `${absoluteUrl(hub.path)}#guides` } })
      const primaryImage = collectionPage?.primaryImageOfPage as JsonObject | undefined
      expect(primaryImage, hub.path).toMatchObject({
        "@type": "ImageObject",
        representativeOfPage: true,
      })
      expect(String(primaryImage?.caption), hub.path).toContain("Enchanted Havens")
      expect(spatialCoverage?.map((place) => place.name), hub.path).toEqual(expect.arrayContaining([
        "Lake Sutherland",
        "Olympic Peninsula",
        "Hood Canal",
        "Whidbey Island",
        "Puget Sound",
        "Washington Coast",
      ]))
      expect(spatialCoverage?.every((place) => place["@type"] === "Place"), hub.path).toBe(true)
      expect(collectionPage?.hasPart, hub.path).toHaveLength(pages.length + 1)
      expect(collectionPage?.hasPart, hub.path).toEqual(expect.arrayContaining([
        { "@id": `${absoluteUrl(hub.path)}#matched-havens` },
      ]))
      expect(collectionPage?.significantLink, hub.path).toEqual(expect.arrayContaining([
        absoluteUrl(pages[0].path),
        absoluteUrl(`/havens/${matchedProperties[0].property.slug}`),
        absoluteUrl("/havens"),
      ]))
      expect(brand?.sameAs, hub.path).toEqual(BRAND_SAME_AS)
      expect(brand?.contactPoint, hub.path).toEqual(expect.arrayContaining([
        expect.objectContaining({ "@type": "ContactPoint", email: BRAND_CONTACT_EMAIL, url: absoluteUrl("/contact") }),
      ]))
      expect(brand?.aggregateRating, hub.path).toMatchObject({ "@type": "AggregateRating", bestRating: 5 })
      expect(brand?.review, hub.path).toHaveLength(featuredReviews.length)
      expect(brand?.potentialAction, hub.path).toMatchObject({ "@type": "ReserveAction", target: absoluteUrl("/havens#availability") })
      expect(itemList?.numberOfItems, hub.path).toBe(pages.length)
      expect(itemList?.itemListElement, hub.path).toHaveLength(pages.length)
      expect(guideItem, hub.path).toMatchObject({
        "@id": `${absoluteUrl(pages[0].path)}#webpage`,
        isPartOf: { "@id": `${absoluteUrl(hub.path)}#webpage` },
        mainEntity: { "@id": `${absoluteUrl(pages[0].path)}#collection` },
      })
      expect(guideItem?.significantLink, hub.path).toEqual(expect.arrayContaining([
        absoluteUrl(`/havens/${pages[0].propertySlugs[0]}`),
      ]))
      expect(matchedHavens?.numberOfItems, hub.path).toBe(matchedProperties.length)
      expect(matchedHavens?.itemListElement?.[0], hub.path).toMatchObject({
        url: absoluteUrl(`/havens/${matchedProperties[0].property.slug}`),
        item: {
          "@type": "LodgingBusiness",
          "@id": `${absoluteUrl(`/havens/${matchedProperties[0].property.slug}`)}#lodging`,
          potentialAction: { "@type": "ReserveAction", target: `${absoluteUrl(`/havens/${matchedProperties[0].property.slug}`)}#reserve` },
        },
      })
      expect(faq?.mainEntity, hub.path).toHaveLength(hub.faq.length)
    }
  })

  it("keeps every evergreen landing page connected to rich schema", () => {
    for (const page of seoLandingPages) {
      const properties = page.propertySlugs.flatMap((slug) => fallbackProperties.find((property) => property.slug === slug) || [])
      const graph = buildLandingPageJsonLd({ page, properties, reviews: featuredReviews })["@graph"] as JsonObject[]
      const itemList = graph.find((item) => item["@type"] === "ItemList") as ItemListSchema | undefined
      const offerCatalog = graph.find((item) => item["@type"] === "OfferCatalog") as OfferCatalogSchema | undefined
      const faq = graph.find((item) => item["@type"] === "FAQPage") as FaqSchema | undefined

      expect(graph.some((item) => item["@type"] === "Organization"), page.path).toBe(true)
      expect(graph.some((item) => item["@type"] === "WebSite"), page.path).toBe(true)
      expect(graph.some((item) => item["@type"] === "LodgingBusiness" && item["@id"] === `${absoluteUrl()}#lodging-brand`), page.path).toBe(true)
      expect(itemList?.numberOfItems, page.path).toBe(properties.length)
      expect(offerCatalog?.numberOfItems, page.path).toBe(properties.length)
      expect(faq?.mainEntity, page.path).toHaveLength(page.faq.length)
    }
  })
})
