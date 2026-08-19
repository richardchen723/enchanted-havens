import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { buildSitemap } from "@/app/sitemap"
import { metadata as contactMetadata } from "@/app/contact/page"
import { metadata as experiencesMetadata } from "@/app/experiences/page"
import { metadata as storyMetadata } from "@/app/story/page"
import { fallbackProperties } from "@/lib/editorial"
import { hubMetadata, landingPageMetadata } from "@/lib/seo-metadata"
import { seoHubs, seoLandingPages } from "@/lib/seo-pages"
import { absoluteUrl } from "@/lib/utils"

function sitemapEntry(path: string) {
  const entry = buildSitemap(fallbackProperties).find((item) => item.url === absoluteUrl(path))
  expect(entry, path).toBeTruthy()
  return entry!
}

function expectAbsoluteImages(path: string, minimum = 1) {
  const entry = sitemapEntry(path)
  expect(entry.images?.length || 0, path).toBeGreaterThanOrEqual(minimum)
  for (const image of entry.images || []) expect(image, path).toMatch(/^https?:\/\//)
}

type ShareImage = { url?: string | URL; alt?: string }
type ShareFields = { images?: ShareImage[] } & Record<string, unknown>

function expectDescriptiveShareImage(image: ShareImage | undefined) {
  expect(image).toMatchObject({ url: expect.any(String), alt: expect.any(String) })
  expect(image?.alt?.length || 0).toBeGreaterThan(20)
}

function expectLargeShareCard(metadata: { openGraph?: unknown; twitter?: unknown }, expectedUrl: string) {
  const openGraph = metadata.openGraph as ShareFields | null | undefined
  const twitter = metadata.twitter as ShareFields | null | undefined

  expect(openGraph).toMatchObject({ url: expectedUrl, type: "website", siteName: "Enchanted Havens" })
  expect(twitter).toMatchObject({ card: "summary_large_image" })
  expect(openGraph?.images).toEqual(expect.any(Array))
  expect(twitter?.images).toEqual(expect.any(Array))
  expectDescriptiveShareImage(openGraph?.images?.[0])
  expectDescriptiveShareImage(twitter?.images?.[0])
}

describe("technical SEO", () => {
  it("adds image sitemap coverage to core collection and support pages", () => {
    expectAbsoluteImages("", 3)
    expectAbsoluteImages("/havens", 7)
    expectAbsoluteImages("/experiences", 3)
    expectAbsoluteImages("/story", 2)
    expectAbsoluteImages("/contact", 1)
  })

  it("adds image sitemap coverage to every SEO hub and evergreen landing page", () => {
    for (const hub of Object.values(seoHubs)) expectAbsoluteImages(hub.path)
    for (const page of seoLandingPages) expectAbsoluteImages(page.path)
  })

  it("adds substantial image sitemap coverage to property and estate residence pages", () => {
    for (const property of fallbackProperties) {
      expectAbsoluteImages(`/havens/${property.slug}`, Math.min(5, property.gallery.length || 1))
      if (property.estate) {
        for (const variant of property.variants) {
          expectAbsoluteImages(`/havens/${property.slug}/${variant.slug}`, Math.min(5, variant.images.length || 1))
        }
      }
    }
  })

  it("keeps conversion support pages canonical and shareable", () => {
    expect(experiencesMetadata.alternates).toMatchObject({ canonical: "/experiences" })
    expect(storyMetadata.alternates).toMatchObject({ canonical: "/story" })
    expect(contactMetadata.alternates).toMatchObject({ canonical: "/contact" })

    expectLargeShareCard(experiencesMetadata, "/experiences")
    expectLargeShareCard(storyMetadata, "/story")
    expectLargeShareCard(contactMetadata, "/contact")
  })

  it("adds large-image Twitter cards to evergreen SEO metadata helpers", () => {
    const page = seoLandingPages.find((item) => item.slug === "pacific-northwest-vacation-rentals")!
    const landingMetadata = landingPageMetadata(page, fallbackProperties)
    const destinationHubMetadata = hubMetadata(seoHubs.destinations, fallbackProperties)

    expect(landingMetadata.alternates).toMatchObject({ canonical: page.path })
    expect(destinationHubMetadata.alternates).toMatchObject({ canonical: seoHubs.destinations.path })
    expectLargeShareCard(landingMetadata, page.path)
    expectLargeShareCard(destinationHubMetadata, seoHubs.destinations.path)
    expect((landingMetadata.openGraph as { images?: ShareImage[] }).images?.[0]?.alt).toBe(page.imageAlt)
    expect((landingMetadata.twitter as { images?: ShareImage[] }).images?.[0]?.alt).toBe(page.imageAlt)
    expect((destinationHubMetadata.openGraph as { images?: ShareImage[] }).images?.[0]?.alt).toContain("Enchanted Havens")
  })

  it("does not expose a broken direct booking portal link in the footer", () => {
    const footerSource = readFileSync("components/site-footer.tsx", "utf8")

    expect(footerSource).not.toContain("Official direct booking portal")
    expect(footerSource).not.toContain("BRAND_BOOKING_ENGINE_URL")
  })

  it("does not render Find Your Haven action buttons", () => {
    const guestFacingSources = [
      readFileSync("app/page.tsx", "utf8"),
      readFileSync("components/site-header.tsx", "utf8"),
      readFileSync("components/site-footer.tsx", "utf8"),
    ].join("\n")

    expect(guestFacingSources).not.toMatch(/Find Your Havens?/i)
  })

  it("keeps the sitewide footer focused on core journeys and featured havens", () => {
    const footerSource = readFileSync("components/site-footer.tsx", "utf8")
    const requiredFooterLinks = [
      "/havens",
      "/havens/blue-haven",
      "/havens/sea-renity-haven",
      "/havens/emerald-haven",
      "/havens/fair-haven",
      "/havens/aurora-haven",
      "/havens/reflection-haven",
      "/havens/reflection-point",
      "/havens/whidbey-estate",
      "/experiences",
      "/story",
      "/contact",
    ]

    for (const href of requiredFooterLinks) expect(footerSource).toContain(href)
    expect(footerSource).not.toContain("collectionLinks")
    expect(footerSource).not.toContain("experiencePathLinks")
    expect(footerSource).not.toMatch(/\/destinations|\/stays|\/groups|\/amenities/)
  })

  it("keeps primary navigation brand-first while leaving SEO hubs off the menu", () => {
    const headerSource = readFileSync("components/site-header.tsx", "utf8")

    for (const href of ["/havens", "/havens/whidbey-estate", "/experiences", "/story", "/contact"]) {
      expect(headerSource).toContain(`"${href}"`)
    }
    for (const tuple of [
      '["Destinations", "/destinations"]',
      '["Stay Types", "/stays"]',
      '["Groups", "/groups"]',
      '["Amenities", "/amenities"]',
    ]) {
      expect(headerSource).not.toContain(tuple)
    }
    expect(headerSource).not.toContain('href === "/stays"')
    expect(headerSource).not.toContain('href === "/groups"')
  })

  it("does not make unsupported Google review claims in guest-facing trust copy", () => {
    const guestFacingSources = [
      readFileSync("app/page.tsx", "utf8"),
      readFileSync("app/experiences/page.tsx", "utf8"),
      readFileSync("components/seo-landing-page.tsx", "utf8"),
      readFileSync("components/property-detail.tsx", "utf8"),
    ].join("\n")

    expect(guestFacingSources).not.toMatch(/Google (and )?guest reviews|Google review|Google and guest reflections/i)
    expect(guestFacingSources).toMatch(/Verified Guest Proof|Verified Airbnb reviews|verified on Airbnb/)
  })

  it("keeps the custom experiences hub connected to real homes without becoming a directory", () => {
    const source = readFileSync("app/experiences/page.tsx", "utf8")

    expect(source).toContain('imageFor("blue-haven"')
    expect(source).toContain('imageFor("emerald-haven"')
    expect(source).toContain('imageFor("whidbey-estate"')
    expect(source).toContain('imageFor("reflection-haven"')
    expect(source).toContain("properties: catalog")
    expect(source).not.toMatch(/Experience-Matched Havens|Homes this path returns to again and again\./)
  })
})
