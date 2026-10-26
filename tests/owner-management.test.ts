import { describe, expect, it } from "vitest"
import { metadata } from "@/app/vacation-rental-management/page"
import { buildSitemap } from "@/app/sitemap"
import robots from "@/app/robots"
import { ownerFaqs, ownerManagementSchema, ownerResults, OWNER_PAGE_PATH } from "@/lib/owner-management"
import { absoluteUrl } from "@/lib/utils"

describe("owner management search discovery", () => {
  it("has an indexable owner-intent canonical and complete share metadata", () => {
    expect(metadata.title).toBe("PNW Vacation Rental Management")
    expect(metadata.description).toMatch(/Olympic Peninsula, Hood Canal, and Whidbey Island/)
    expect(metadata.alternates).toEqual({ canonical: OWNER_PAGE_PATH })
    expect(metadata.robots).toMatchObject({ index: true, follow: true, googleBot: { "max-snippet": -1, "max-image-preview": "large" } })
    expect(metadata.openGraph).toMatchObject({ url: OWNER_PAGE_PATH, images: [expect.objectContaining({ alt: expect.stringContaining("Sea-Renity") })] })
  })

  it("connects the visible service, organization, owner contact and FAQ entities", () => {
    const graph = ownerManagementSchema()["@graph"]
    const organization = graph.find((item) => item["@type"] === "Organization")!
    const service = graph.find((item) => item["@type"] === "Service")!
    expect(service.provider).toEqual({ "@id": organization["@id"] })
    expect(service.areaServed).toEqual(["Port Angeles", "Belfair", "Oak Harbor"].map((name) => ({ "@type": "Place", name: `${name}, Washington` })))
    expect("contactPoint" in organization && organization.contactPoint).toContainEqual(expect.objectContaining({ contactType: "vacation rental management inquiries", url: `${absoluteUrl(OWNER_PAGE_PATH)}#owner-inquiry` }))
    const faq = graph.find((item) => item["@type"] === "FAQPage")!
    expect(faq.mainEntity).toEqual(ownerFaqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })))
    expect(JSON.stringify(graph)).not.toMatch(/aggregateRating|priceCurrency|"price":/)
  })

  it("retains the observed submarket boundaries rather than claiming region-wide ranks", () => {
    expect(ownerResults.map(({ market, rank, listings }) => [market, rank, listings])).toEqual([
      ["Port Angeles", 1, 774], ["Port Angeles", 3, 774], ["Port Angeles", 5, 774], ["Port Angeles", 15, 774], ["Oak Harbor", 5, 207], ["Belfair", 3, 74],
    ])
  })

  it("includes the canonical with images and a real content date, excluding receipts and redirects", () => {
    const sitemap = buildSitemap([])
    expect(sitemap.find((item) => item.url === absoluteUrl(OWNER_PAGE_PATH))).toMatchObject({ lastModified: "2026-10-26", images: expect.arrayContaining([expect.stringContaining("sea-renity-firepit-exterior.webp")]) })
    expect(sitemap.some((item) => /management\/thank-you|\/management$/.test(item.url))).toBe(false)
  })

  it("permits public page discovery for search and AI crawlers while retaining private-path exclusions", () => {
    const rules = robots().rules
    expect(rules).toMatchObject({ userAgent: "*", allow: "/", disallow: expect.arrayContaining(["/api/", "/booking/", "/confirmation/"]) })
    expect(JSON.stringify(rules)).not.toContain(OWNER_PAGE_PATH)
  })
})
