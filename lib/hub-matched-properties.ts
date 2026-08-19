import type { Property } from "@/lib/schemas"
import type { SeoLandingPage } from "@/lib/seo-pages"

export type HubMatchedProperty = {
  property: Property
  guideCount: number
  relatedPages: SeoLandingPage[]
}

export function getHubMatchedProperties({ pages, catalog, limit = 6 }: { pages: SeoLandingPage[]; catalog: Property[]; limit?: number }): HubMatchedProperty[] {
  const catalogBySlug = new Map(catalog.map((property) => [property.slug, property]))
  const matches = new Map<string, { firstSeen: number; relatedPages: SeoLandingPage[] }>()

  pages.forEach((page, pageIndex) => {
    page.propertySlugs.forEach((slug, propertyIndex) => {
      if (!catalogBySlug.has(slug)) return
      const current = matches.get(slug)
      if (current) {
        current.relatedPages.push(page)
        return
      }
      matches.set(slug, {
        firstSeen: pageIndex * 100 + propertyIndex,
        relatedPages: [page],
      })
    })
  })

  return [...matches.entries()]
    .sort(([, left], [, right]) => right.relatedPages.length - left.relatedPages.length || left.firstSeen - right.firstSeen)
    .slice(0, limit)
    .flatMap(([slug, match]) => {
      const property = catalogBySlug.get(slug)
      if (!property) return []
      return [{ property, guideCount: match.relatedPages.length, relatedPages: match.relatedPages }]
    })
}
