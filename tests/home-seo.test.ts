import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { metadata } from "@/app/page"
import { BRAND_BOOKING_ENGINE_URL, BRAND_CONTACT_EMAIL, BRAND_INSTAGRAM_URL, BRAND_SAME_AS } from "@/lib/brand"
import { fallbackProperties, featuredReviews } from "@/lib/editorial"
import { buildHomeJsonLd, homeFaq, homeKeywords, homeSeoLinks } from "@/lib/home-seo"
import { absoluteUrl } from "@/lib/utils"

type JsonObject = { [key: string]: unknown }
type ShareImage = { url?: string | URL; alt?: string }
type ItemListSchema = JsonObject & { itemListElement?: unknown[]; numberOfItems?: number }
type FaqSchema = JsonObject & { mainEntity?: unknown[] }
type LodgingSchema = JsonObject & { aggregateRating?: unknown; review?: unknown[]; makesOffer?: unknown[] }

describe("homepage SEO", () => {
  it("uses the warm brand palette for the hero availability transition", () => {
    const homeSource = readFileSync("app/page.tsx", "utf8")
    const searchSource = readFileSync("components/search-form.tsx", "utf8")
    const pickerSource = readFileSync("components/date-range-picker.tsx", "utf8")

    expect(homeSource).toContain("bg-[linear-gradient(180deg,#e7e1d6_0%,#f3eee3_100%)]")
    expect(searchSource).toContain("bg-[#fffdf8]")
    expect(searchSource).toContain("disabled:bg-[#60756e]")
    expect(searchSource).not.toContain("disabled:opacity-45")
    expect(pickerSource).toContain('bg-[#fffdf8] hover:bg-[#f3eee3]')
  })

  it("targets broad Pacific Northwest direct-book search intent in metadata", () => {
    expect(metadata.alternates).toMatchObject({ canonical: "/" })
    expect(metadata.openGraph).toMatchObject({ url: "/", type: "website", siteName: "Enchanted Havens" })
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", images: expect.any(Array) })
    expect((metadata.openGraph as { images?: ShareImage[] }).images?.[0]).toMatchObject({ url: expect.any(String), alt: expect.any(String) })
    expect((metadata.twitter as { images?: ShareImage[] }).images?.[0]).toMatchObject({ url: expect.any(String), alt: expect.any(String) })
    expect(metadata.keywords).toEqual(expect.arrayContaining([
      "Pacific Northwest vacation rentals",
      "Washington waterfront vacation rentals",
      "Washington beach house rentals",
      "Washington cabin rentals",
      "Washington vacation rentals near Seattle",
      "Seattle weekend getaway rental",
      "Washington lake house rentals",
      "Lake Sutherland cabin rental",
      "Lake Crescent vacation rentals",
      "Olympic National Park vacation rentals",
      "Olympic National Park vacation rental",
      "Port Angeles vacation rentals",
      "Whidbey Island beach house rental",
      "Whidbey Island vacation rentals",
      "Whidbey Island private estate rental",
      "Washington group vacation rental",
      "Washington wedding lodging",
      "wedding guest lodging Washington",
      "company retreat rental PNW",
      "direct book vacation rentals Washington",
      "book direct vacation rentals Washington",
    ]))
  })

  it("keeps homepage FAQ and intent links substantial", () => {
    expect(homeFaq.length).toBeGreaterThanOrEqual(4)
    expect(homeSeoLinks.length).toBeGreaterThanOrEqual(6)
    expect(homeKeywords.length).toBeGreaterThanOrEqual(10)
    expect(homeSeoLinks.map((link) => link.href)).toEqual(expect.arrayContaining([
      "/stays/pacific-northwest-vacation-rentals",
      "/stays/direct-book-vacation-rentals-washington",
      "/stays/washington-beach-house-rentals",
      "/stays/washington-lake-house-rentals",
      "/stays/washington-cabin-rentals",
      "/stays/washington-vacation-rentals-near-seattle",
      "/destinations/lake-sutherland-vacation-rentals",
      "/destinations/lake-crescent-vacation-rentals",
      "/destinations/olympic-national-park-vacation-rentals",
      "/destinations/port-angeles-vacation-rentals",
      "/destinations/port-angeles-lake-house-rentals",
      "/destinations/whidbey-island-vacation-rentals",
      "/destinations/whidbey-island-private-estate-rentals",
      "/amenities/washington-hot-tub-vacation-rentals",
      "/groups/family-reunion-house-washington",
      "/groups/washington-group-vacation-rentals",
      "/groups/washington-wedding-lodging",
      "/groups/company-retreat-rental-pnw",
    ]))
  })

  it("keeps homepage SEO landing links out of the premium visual flow", () => {
    const source = readFileSync("app/page.tsx", "utf8")

    expect(source).not.toContain("Search by Intention")
    expect(source).not.toContain("The fastest routes into the collection.")
    expect(source).not.toContain("homeSeoLinks.map")
    expect(source).not.toContain("Open Guide")
  })

  it("keeps the availability-to-collection transition free of the redundant planning strip", () => {
    const source = readFileSync("app/page.tsx", "utf8")

    expect(source).not.toContain("Plan a private escape")
    expect(source).not.toContain("Exact Stay Totals")
    expect(source).not.toContain("Private Planning")
    expect(source).not.toContain("Arrival-Ready Homes")
  })

  it("builds Organization, WebSite, WebPage, LodgingBusiness, ItemList, Breadcrumb, and FAQ schema", () => {
    const graph = buildHomeJsonLd({ catalog: fallbackProperties, reviews: featuredReviews })["@graph"] as JsonObject[]
    const website = graph.find((item) => item["@type"] === "WebSite") as JsonObject | undefined
    const webpage = graph.find((item) => item["@type"] === "WebPage") as JsonObject | undefined
    const itemList = graph.find((item) => item["@type"] === "ItemList") as ItemListSchema | undefined
    const faq = graph.find((item) => item["@type"] === "FAQPage") as FaqSchema | undefined
    const organization = graph.find((item) => item["@type"] === "Organization") as JsonObject | undefined
    const lodging = graph.find((item) => item["@type"] === "LodgingBusiness" && item["@id"] === "https://enchantedhavens.com/#lodging-brand") as LodgingSchema | undefined
    const offerCatalog = graph.find((item) => item["@type"] === "OfferCatalog") as ItemListSchema | undefined

    expect(graph.some((item) => item["@type"] === "Organization")).toBe(true)
    expect(graph.some((item) => item["@type"] === "WebSite")).toBe(true)
    expect(graph.some((item) => item["@type"] === "WebPage")).toBe(true)
    expect(graph.some((item) => item["@type"] === "BreadcrumbList")).toBe(true)
    expect(website?.potentialAction).toMatchObject({ "@type": "SearchAction", target: "https://enchantedhavens.com/havens?checkIn={check_in}&checkOut={check_out}&guests={guests}" })
    expect(webpage?.hasPart).toEqual(expect.arrayContaining([
      { "@id": "https://enchantedhavens.com/havens#webpage" },
      { "@id": "https://enchantedhavens.com/destinations#webpage" },
      { "@id": "https://enchantedhavens.com/stays/direct-book-vacation-rentals-washington#webpage" },
    ]))
    expect(webpage?.significantLink).toEqual(expect.arrayContaining([
      "https://enchantedhavens.com/havens",
      "https://enchantedhavens.com/stays/pacific-northwest-vacation-rentals",
      "https://enchantedhavens.com/groups/family-reunion-house-washington",
    ]))
    const homeImage = webpage?.primaryImageOfPage as JsonObject | undefined
    expect(homeImage).toMatchObject({
      "@type": "ImageObject",
      url: "https://enchantedhavens.com/images/home-hero/heros-zip/hero-02.webp",
      representativeOfPage: true,
    })
    expect(`${homeImage?.caption}`).toContain("Pacific Northwest")
    expect(organization?.sameAs).toEqual(BRAND_SAME_AS)
    expect(organization?.email).toBe(BRAND_CONTACT_EMAIL)
    expect(organization?.contactPoint).toEqual(expect.arrayContaining([
      expect.objectContaining({ "@type": "ContactPoint", email: BRAND_CONTACT_EMAIL, url: absoluteUrl("/contact") }),
    ]))
    expect(organization?.subjectOf).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Direct booking portal", url: BRAND_BOOKING_ENGINE_URL }),
      expect.objectContaining({ name: "Instagram", url: BRAND_INSTAGRAM_URL }),
    ]))
    expect(lodging?.sameAs).toEqual(BRAND_SAME_AS)
    expect(lodging?.contactPoint).toEqual(expect.arrayContaining([
      expect.objectContaining({ email: BRAND_CONTACT_EMAIL, url: absoluteUrl("/contact") }),
    ]))
    expect(lodging?.potentialAction).toMatchObject({ "@type": "ReserveAction", target: "https://enchantedhavens.com/havens#availability" })
    expect(lodging?.hasOfferCatalog).toMatchObject({ "@id": "https://enchantedhavens.com/#direct-book-offers" })
    expect(lodging?.makesOffer).toHaveLength(fallbackProperties.length)
    expect(lodging?.aggregateRating).toBeTruthy()
    expect(lodging?.review?.length).toBeGreaterThanOrEqual(3)
    expect(offerCatalog?.numberOfItems).toBe(fallbackProperties.length)
    expect(offerCatalog?.itemListElement).toHaveLength(fallbackProperties.length)
    expect(offerCatalog?.itemListElement?.[0]).toMatchObject({
      "@type": "Offer",
      availability: "https://schema.org/LimitedAvailability",
      businessFunction: "https://purl.org/goodrelations/v1#LeaseOut",
      potentialAction: { "@type": "ReserveAction" },
    })
    expect(itemList?.numberOfItems).toBe(fallbackProperties.length)
    expect(itemList?.itemListElement).toHaveLength(fallbackProperties.length)
    expect(faq?.mainEntity).toHaveLength(homeFaq.length)
  })
})
