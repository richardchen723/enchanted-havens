import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { GuidePlanning, MatchedHavensComparison } from "@/components/seo-landing-page"
import { fallbackProperties } from "@/lib/editorial"
import { guidePlanning } from "@/lib/guide-planning"
import { seoLandingPages } from "@/lib/seo-pages"
import { collectionGuides } from "@/lib/collection-seo"

describe("practical guide planning", () => {
  it("covers the existing 36 guides with distinct, server-rendered planning notes", () => {
    expect(seoLandingPages).toHaveLength(36)
    expect(Object.keys(guidePlanning).sort()).toEqual(seoLandingPages.map((page) => page.slug).sort())
    expect(new Set(Object.values(guidePlanning).map((notes) => JSON.stringify(notes))).size).toBe(36)
    for (const page of seoLandingPages) {
      const html = renderToStaticMarkup(createElement(GuidePlanning, { page }))
      expect(html).toContain(guidePlanning[page.slug][0].heading.replaceAll("'", "&#x27;"))
      expect(html).toContain('href="/contact"')
      const publicCopy = JSON.stringify([page.description, page.sections, page.highlights, guidePlanning[page.slug]])
      expect(publicCopy).not.toMatch(/landing page|search intent|work-ready|permit-safe|\d+\s*(?:Mbps|Gbps)/i)
      for (const note of guidePlanning[page.slug]) {
        for (const source of note.sources || []) expect(source.href).toMatch(/^https:\/\/(?:www\.nps\.gov|wsdot\.wa\.gov)\//)
      }
    }
  })

  it("renders owner-confirmed sleeping layouts, water access, and parking without JavaScript", () => {
    const html = renderToStaticMarkup(createElement(MatchedHavensComparison, { properties: fallbackProperties }))
    expect(html).toContain("Lake Dawn")
    expect(html).toContain("folding mattresses")
    expect(html).toContain("Approximately 30 steps")
    expect(html).toContain("USD 100 flat fee per stay")
    expect(html).toContain("written approval before booking")
    expect(html).not.toMatch(/No EV|no hot tub|no sauna/i)
    expect(html).toContain('href="/havens/sea-renity-haven#reserve"')
    expect(collectionGuides.find((guide) => guide.eyebrow === "Lake Sutherland")?.propertySlugs).toEqual(["blue-haven", "emerald-haven"])
  })

  it("labels the origin of route estimates and asks guests to confirm work requirements", () => {
    const park = JSON.stringify(guidePlanning["olympic-national-park-vacation-rentals"])
    expect(park).toContain("from Port Angeles")
    expect(park).toContain("regional planning estimates")
    expect(park).toContain("entrance queues")
    const retreat = JSON.stringify(guidePlanning["company-retreat-rental-pnw"])
    expect(retreat).toContain("dedicated desk needs")
    expect(retreat).toContain("confirm suitability")
    expect(retreat).not.toMatch(/\d+\s*(?:seats|Mbps|Gbps)/)
  })
})
