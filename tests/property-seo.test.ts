import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { getAirbnbReviewDestination } from "@/lib/airbnb"
import { BRAND_CONTACT_EMAIL, BRAND_SAME_AS } from "@/lib/brand"
import { fallbackProperties } from "@/lib/editorial"
import { propertyGalleryImageAlt } from "@/lib/property-image-seo"
import { buildPropertyJsonLd, getPropertyKeywords, getPropertySeoContent } from "@/lib/property-seo"

type JsonObject = { [key: string]: unknown }
type BreadcrumbSchema = JsonObject & { itemListElement?: Array<{ name?: string }> }

describe("individual property SEO", () => {
  it("keeps property pages focused on the information guests need to book", () => {
    const source = readFileSync("components/property-detail.tsx", "utf8")
    const bookingSource = readFileSync("components/booking-panel.tsx", "utf8")
    const gallerySource = readFileSync("components/image-gallery.tsx", "utf8")
    const mapSource = readFileSync("components/property-map.tsx", "utf8")

    expect(source).toContain("About This Haven")
    expect(source).toContain("Amenities")
    expect(mapSource).toContain("Location")
    expect(source).toContain("Verified Guest Reviews")
    expect(source).toContain("See what guests say on Airbnb.")
    expect(source).toContain("Guests often mention")
    expect(source).toContain("Snapshot checked")
    expect(source).toContain("Review source")
    expect(source).toContain("Airbnb")
    expect(source).toContain("Read verified reviews on Airbnb")
    expect(source).toContain("is an independent third party and is not endorsed by or associated with Airbnb")
    expect(source).toContain("Frequently Asked Questions")
    expect(source).toContain("What guests ask before staying at")
    expect(source).toContain("Five practical answers shaped by recurring guest questions")
    expect(source).not.toContain(">airbnb<")
    expect(source).not.toContain("Collection Guest Reflections")
    expect(source).not.toContain("<blockquote")
    expect(source).toContain("The Cove Club Residences")
    expect(source).toContain("Compare ways to stay.")
    expect(source).toContain("aria-label=\"Breadcrumb\"")
    expect(source).toMatch(/<PropertyAmenities[\s\S]+<PropertyMap[\s\S]+<AirbnbReviews[\s\S]+<PropertyFaq/)
    expect(source).toContain("!property.estate ? <PropertyFaq")
    expect(mapSource).toContain('id="location"')
    expect(mapSource).toContain("Approximate location")
    expect(source).not.toMatch(/Before You Arrive|A Day Here|Planning Questions|Private Stay Planning|Good to Know|Continue Exploring/)
    expect(source).not.toContain("getPropertyDayMoments")
    expect(bookingSource).toContain("Check Availability")
    expect(bookingSource).not.toMatch(/Complete total appears once dates are selected|A stay specialist can help choose the right haven|Ask our stay team/)
    expect(gallerySource).toContain("propertyGalleryImageAlt")
    expect(gallerySource).toContain("View full gallery")
    expect(gallerySource).toMatch(/Visual Tour|A first walk through the haven|Arrive in the landscape|Follow the light outside|Settle into the room/)
    expect(gallerySource).not.toContain("property image")
    expect(gallerySource).not.toContain("full gallery image")
    expect(source).not.toMatch(/Questions Guests Search|Explore by Intent|Related Guides|Open Guide/)
    expect(source).not.toMatch(/Instagram-visible|live stay data|supplied by Hostaway|worth searching for/i)
  })

  it("keeps the dedicated Cove Club page out of SEO-guide-directory mode", () => {
    const source = readFileSync("components/estate-hub.tsx", "utf8")

    expect(source).toContain("Private Estate Planning")
    expect(source).toContain("Plan the estate privately.")
    expect(source).toContain("Contact the Stay Team")
    expect(source).toContain("Explore Full Estate")
    expect(source).toContain("Compare Residences")
    expect(source).not.toContain("seo.relatedLinks.map")
    expect(source).not.toMatch(/Open Guide|Related Guides/)
  })

  it("creates contextual gallery alt text for image search without generic labels", () => {
    expect(propertyGalleryImageAlt({
      name: "Blue Haven",
      location: "Port Angeles, Washington",
      index: 0,
      tags: ["Lakefront", "Private beach", "Kayaks"],
    })).toBe("Blue Haven lakefront gallery view in Port Angeles, Washington")
  })

  it("provides every published residence with the core information needed to choose and book", () => {
    for (const property of fallbackProperties) {
      expect(property.narrative.trim(), `${property.slug} summary`).not.toBe("")
      expect(property.longNarrative.trim(), `${property.slug} description`).not.toBe("")
      expect(property.location.trim(), `${property.slug} location`).not.toBe("")
      expect(getPropertySeoContent(property).localSections[0]?.body.trim(), `${property.slug} location context`).not.toBe("")

      for (const variant of property.variants) {
        expect(variant.description.trim(), `${variant.shortName} description`).not.toBe("")
        expect(variant.amenities.length, `${variant.shortName} amenities`).toBeGreaterThan(0)
        expect(getAirbnbReviewDestination(variant.id).href, `${variant.shortName} review source`).toMatch(/^https:\/\//)
      }
    }
  })

  it("does not load or pass the editorial review pool to individual property pages", () => {
    const havenSource = readFileSync("app/havens/[slug]/page.tsx", "utf8")
    const variantSource = readFileSync("app/havens/[slug]/[variant]/page.tsx", "utf8")

    expect(havenSource).not.toContain("getFeaturedReviews")
    expect(variantSource).not.toContain("getFeaturedReviews")
    expect(havenSource).not.toContain("reviews={reviews}")
    expect(variantSource).not.toContain("reviews={reviews}")
  })

  it("uses the shared metadata builder for property and estate residence share previews", () => {
    const havenSource = readFileSync("app/havens/[slug]/page.tsx", "utf8")
    const variantSource = readFileSync("app/havens/[slug]/[variant]/page.tsx", "utf8")

    expect(havenSource).toContain("shareMetadata")
    expect(havenSource).toContain("image: property.heroImage")
    expect(variantSource).toContain("shareMetadata")
    expect(variantSource).toContain("image: variant.images[0]")
  })

  it("gives every published haven local content, FAQs, keywords, and internal SEO links", () => {
    for (const property of fallbackProperties) {
      const content = getPropertySeoContent(property)
      expect(content.keywords.length, property.slug).toBeGreaterThanOrEqual(3)
      expect(content.localSections.length, property.slug).toBeGreaterThanOrEqual(2)
      expect(content.faq.length, property.slug).toBe(property.estate ? 3 : 5)
      expect(content.relatedLinks.length, property.slug).toBeGreaterThanOrEqual(3)
      expect(getPropertyKeywords(property, property.variants[0]), property.slug).toContain(property.displayName)
    }
  })

  it("keeps published FAQ arrival windows aligned with the current Hostaway listing times", () => {
    const expectedTimes = [
      { slug: "blue-haven", checkIn: "3:00 p.m. to 11:00 p.m.", checkOut: "10:00 a.m." },
      { slug: "sea-renity-haven", checkIn: "4:00 p.m. to 11:00 p.m.", checkOut: "11:00 a.m." },
      { slug: "emerald-haven", checkIn: "4:00 p.m. to 11:00 p.m.", checkOut: "11:00 a.m." },
      { slug: "fair-haven", checkIn: "3:00 p.m. to 11:00 p.m.", checkOut: "10:00 a.m." },
      { slug: "aurora-haven", checkIn: "3:00 p.m. to 11:00 p.m.", checkOut: "10:00 a.m." },
    ]

    for (const expected of expectedTimes) {
      const property = fallbackProperties.find((item) => item.slug === expected.slug)!
      const answers = getPropertySeoContent(property).faq.map((item) => item.answer).join(" ")
      expect(answers, `${expected.slug} check-in`).toContain(expected.checkIn)
      expect(answers, `${expected.slug} checkout`).toContain(expected.checkOut)
    }
  })

  it("links retreat-suitable properties to the company retreat landing page", () => {
    const retreatPropertySlugs = ["whidbey-estate", "fair-haven", "reflection-haven", "aurora-haven", "emerald-haven"]

    for (const slug of retreatPropertySlugs) {
      const property = fallbackProperties.find((item) => item.slug === slug)!
      const links = getPropertySeoContent(property).relatedLinks.map((link) => link.href)
      expect(links, slug).toContain("/groups/company-retreat-rental-pnw")
    }
  })

  it("links group-suitable properties to the Washington group vacation rentals landing page", () => {
    const groupPropertySlugs = ["whidbey-estate", "sea-renity-haven", "emerald-haven", "fair-haven", "reflection-haven", "aurora-haven"]

    for (const slug of groupPropertySlugs) {
      const property = fallbackProperties.find((item) => item.slug === slug)!
      const links = getPropertySeoContent(property).relatedLinks.map((link) => link.href)
      expect(links, slug).toContain("/groups/washington-group-vacation-rentals")
    }
  })

  it("links every published haven to the direct-book vacation rentals page", () => {
    for (const property of fallbackProperties) {
      const links = getPropertySeoContent(property).relatedLinks.map((link) => link.href)
      expect(links, property.slug).toContain("/stays/direct-book-vacation-rentals-washington")
    }
  })

  it("links Lake Crescent-area homes to the Lake Crescent destination page", () => {
    const lakeCrescentPropertySlugs = ["blue-haven", "emerald-haven", "reflection-haven", "aurora-haven"]

    for (const slug of lakeCrescentPropertySlugs) {
      const property = fallbackProperties.find((item) => item.slug === slug)!
      const links = getPropertySeoContent(property).relatedLinks.map((link) => link.href)
      expect(links, slug).toContain("/destinations/lake-crescent-vacation-rentals")
    }
  })

  it("links lake-house homes to the Washington lake house rentals landing page", () => {
    const lakeHousePropertySlugs = ["blue-haven", "emerald-haven", "reflection-haven"]

    for (const slug of lakeHousePropertySlugs) {
      const property = fallbackProperties.find((item) => item.slug === slug)!
      const links = getPropertySeoContent(property).relatedLinks.map((link) => link.href)
      expect(links, slug).toContain("/stays/washington-lake-house-rentals")
    }
  })

  it("links Olympic National Park-area homes to the dedicated park vacation rentals page", () => {
    const olympicNationalParkPropertySlugs = ["blue-haven", "emerald-haven", "reflection-haven", "aurora-haven"]

    for (const slug of olympicNationalParkPropertySlugs) {
      const property = fallbackProperties.find((item) => item.slug === slug)!
      const links = getPropertySeoContent(property).relatedLinks.map((link) => link.href)
      expect(links, slug).toContain("/destinations/olympic-national-park-vacation-rentals")
    }
  })

  it("links Port Angeles-area homes to the broad Port Angeles vacation rentals page", () => {
    const portAngelesPropertySlugs = ["blue-haven", "emerald-haven", "reflection-haven", "aurora-haven"]

    for (const slug of portAngelesPropertySlugs) {
      const property = fallbackProperties.find((item) => item.slug === slug)!
      const links = getPropertySeoContent(property).relatedLinks.map((link) => link.href)
      expect(links, slug).toContain("/destinations/port-angeles-vacation-rentals")
    }
  })

  it("links near-Seattle properties to the weekend getaway landing page", () => {
    const nearSeattlePropertySlugs = ["whidbey-estate", "fair-haven", "sea-renity-haven"]

    for (const slug of nearSeattlePropertySlugs) {
      const property = fallbackProperties.find((item) => item.slug === slug)!
      const links = getPropertySeoContent(property).relatedLinks.map((link) => link.href)
      expect(links, slug).toContain("/stays/washington-vacation-rentals-near-seattle")
    }
  })

  it("links beach-house properties to the Washington beach house rentals landing page", () => {
    const beachHousePropertySlugs = ["whidbey-estate", "fair-haven", "sea-renity-haven"]

    for (const slug of beachHousePropertySlugs) {
      const property = fallbackProperties.find((item) => item.slug === slug)!
      const links = getPropertySeoContent(property).relatedLinks.map((link) => link.href)
      expect(links, slug).toContain("/stays/washington-beach-house-rentals")
    }
  })

  it("links Whidbey properties to the broad Whidbey Island destination page", () => {
    const whidbeyPropertySlugs = ["whidbey-estate", "sea-renity-haven"]

    for (const slug of whidbeyPropertySlugs) {
      const property = fallbackProperties.find((item) => item.slug === slug)!
      const links = getPropertySeoContent(property).relatedLinks.map((link) => link.href)
      expect(links, slug).toContain("/destinations/whidbey-island-vacation-rentals")
    }
  })

  it("links wedding-lodging properties to the permit-safe wedding landing page", () => {
    const weddingPropertySlugs = ["whidbey-estate", "fair-haven", "sea-renity-haven"]

    for (const slug of weddingPropertySlugs) {
      const property = fallbackProperties.find((item) => item.slug === slug)!
      const links = getPropertySeoContent(property).relatedLinks.map((link) => link.href)
      expect(links, slug).toContain("/groups/washington-wedding-lodging")
    }
  })

  it("links cabin-suitable properties to the Washington cabin rentals landing page", () => {
    const cabinPropertySlugs = ["blue-haven", "emerald-haven", "reflection-haven", "aurora-haven", "fair-haven"]

    for (const slug of cabinPropertySlugs) {
      const property = fallbackProperties.find((item) => item.slug === slug)!
      const links = getPropertySeoContent(property).relatedLinks.map((link) => link.href)
      expect(links, slug).toContain("/stays/washington-cabin-rentals")
    }
  })

  it("passes descriptive social image alt text from property metadata routes", () => {
    const havenSource = readFileSync("app/havens/[slug]/page.tsx", "utf8")
    const variantSource = readFileSync("app/havens/[slug]/[variant]/page.tsx", "utf8")

    expect(havenSource).toContain("imageAlt: `${property.displayName} in ${property.location}`")
    expect(variantSource).toContain("imageAlt: `${variant.shortName} at ${property.displayName} in ${property.location}`")
  })

  it("builds focused LodgingBusiness, BreadcrumbList, and gallery schema for property pages", () => {
    const property = fallbackProperties.find((item) => item.slug === "blue-haven")!
    const variant = property.variants[0]
    const jsonLd = buildPropertyJsonLd({
      property,
      variant,
      reviews: [],
      path: `/havens/${property.slug}`,
      heroImage: property.heroImage,
    })
    const graph = jsonLd["@graph"] as JsonObject[]
    const organization = graph.find((item) => item["@type"] === "Organization") as JsonObject | undefined
    const webpage = graph.find((item) => item["@type"] === "WebPage") as JsonObject | undefined
    const lodging = graph.find((item) => item["@type"] === "LodgingBusiness") as JsonObject | undefined
    const offer = graph.find((item) => item["@type"] === "Offer") as JsonObject | undefined
    const imageGallery = graph.find((item) => item["@type"] === "ImageGallery") as JsonObject | undefined
    const imageObjects = graph.filter((item) => item["@type"] === "ImageObject") as JsonObject[]
    const accommodation = lodging?.containsPlace as JsonObject | undefined

    expect(graph.some((item) => item["@type"] === "LodgingBusiness" && item.name === property.displayName)).toBe(true)
    expect(graph.some((item) => item["@type"] === "Organization" && item["@id"] === "https://enchantedhavens.com/#organization")).toBe(true)
    expect(graph.some((item) => item["@type"] === "WebSite" && item["@id"] === "https://enchantedhavens.com/#website")).toBe(true)
    expect(graph.some((item) => item["@type"] === "BreadcrumbList")).toBe(true)
    expect(organization?.sameAs).toEqual(BRAND_SAME_AS)
    expect(organization?.contactPoint).toEqual(expect.arrayContaining([
      expect.objectContaining({ "@type": "ContactPoint", email: BRAND_CONTACT_EMAIL, url: "https://enchantedhavens.com/contact" }),
    ]))
    expect(webpage).toMatchObject({
      publisher: { "@id": "https://enchantedhavens.com/#organization" },
      isPartOf: { "@id": "https://enchantedhavens.com/#website" },
      mainEntity: { "@id": "https://enchantedhavens.com/havens/blue-haven#lodging" },
      hasPart: [{ "@id": "https://enchantedhavens.com/havens/blue-haven#gallery" }],
      potentialAction: { "@type": "ReserveAction", target: "https://enchantedhavens.com/havens/blue-haven#reserve" },
    })
    expect(webpage?.associatedMedia).toHaveLength(Math.min(8, new Set([property.heroImage, ...variant.images, ...property.gallery]).size))
    expect((webpage?.spatialCoverage as JsonObject[] | undefined)?.some((place) => place.name === "Lake Sutherland")).toBe(true)
    expect(lodging).toMatchObject({
      parentOrganization: { "@id": "https://enchantedhavens.com/#organization" },
      sameAs: BRAND_SAME_AS,
      photo: expect.arrayContaining([{ "@id": "https://enchantedhavens.com/havens/blue-haven#image-1" }]),
      offers: { "@id": "https://enchantedhavens.com/havens/blue-haven#direct-book-offer" },
      potentialAction: { "@type": "ReserveAction", target: "https://enchantedhavens.com/havens/blue-haven#reserve" },
    })
    expect(offer).toMatchObject({
      "@id": "https://enchantedhavens.com/havens/blue-haven#direct-book-offer",
      "@type": "Offer",
      availability: "https://schema.org/LimitedAvailability",
      businessFunction: "https://purl.org/goodrelations/v1#LeaseOut",
      seller: { "@id": "https://enchantedhavens.com/#organization" },
      itemOffered: { "@id": "https://enchantedhavens.com/havens/blue-haven#lodging" },
      potentialAction: { "@type": "ReserveAction", target: "https://enchantedhavens.com/havens/blue-haven#reserve" },
    })
    expect(imageGallery).toMatchObject({
      "@id": "https://enchantedhavens.com/havens/blue-haven#gallery",
      name: "Blue Haven visual gallery",
      about: { "@id": "https://enchantedhavens.com/havens/blue-haven#lodging" },
      isPartOf: { "@id": "https://enchantedhavens.com/havens/blue-haven#webpage" },
    })
    expect(imageGallery?.associatedMedia).toHaveLength(imageObjects.length)
    expect(imageObjects.length).toBeGreaterThanOrEqual(3)
    expect(imageObjects[0]).toMatchObject({
      "@id": "https://enchantedhavens.com/havens/blue-haven#image-1",
      name: "Blue Haven gallery image 1",
      caption: "Blue Haven lakefront gallery view in Port Angeles, Washington",
      representativeOfPage: true,
    })
    expect(accommodation).toMatchObject({
      "@type": "Accommodation",
      occupancy: { "@type": "QuantitativeValue", maxValue: variant.guests },
      numberOfBedrooms: variant.bedrooms,
      numberOfBathroomsTotal: variant.bathrooms,
    })
    expect(graph.some((item) => item["@type"] === "FAQPage")).toBe(false)
    expect(graph.some((item) => item["@id"] === "https://enchantedhavens.com/havens/blue-haven#related-guides")).toBe(false)
  })

  it("adds a variant breadcrumb only for estate residence URLs", () => {
    const estate = fallbackProperties.find((item) => item.slug === "whidbey-estate")!
    const variant = estate.variants.find((item) => item.slug === "lodge")!
    const graph = buildPropertyJsonLd({
      property: estate,
      variant,
      reviews: [],
      path: `/havens/${estate.slug}/${variant.slug}`,
      heroImage: variant.images[0],
    })["@graph"] as JsonObject[]
    const breadcrumb = graph.find((item) => item["@type"] === "BreadcrumbList") as BreadcrumbSchema | undefined
    expect(breadcrumb?.itemListElement).toHaveLength(4)
    expect(breadcrumb?.itemListElement?.at(-1)?.name).toBe("The Lodge")
  })
})
