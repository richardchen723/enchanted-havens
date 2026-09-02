import type { Property } from "@/lib/schemas"
import { experienceHub, seoHubs, seoLandingPages, type SeoPageGroup } from "@/lib/seo-pages"

export type CouponPromotionPage = {
  path: string
  label: string
  description: string
}

export type CouponPromotionPageGroup = {
  id: string
  label: string
  description: string
  pages: CouponPromotionPage[]
}

const groupLabels: Record<SeoPageGroup, string> = {
  destinations: "Destination guides",
  stays: "Stay guides",
  groups: "Group stay guides",
  experiences: "Experience guides",
  amenities: "Amenity guides",
}

const groupDescriptions: Record<SeoPageGroup, string> = {
  destinations: "Regional pages guests use while deciding where to stay.",
  stays: "Pages organized around setting, trip style, and proximity.",
  groups: "Planning pages for reunions, retreats, and private gatherings.",
  experiences: "Pages centered on the feeling and activities of a stay.",
  amenities: "Pages for guests searching by a specific amenity.",
}

export function normalizeCouponPromotionPath(path: string) {
  const normalized = path.trim().split(/[?#]/, 1)[0]
  if (!normalized.startsWith("/") || normalized.length > 300) return null
  return normalized === "/" ? normalized : normalized.replace(/\/+$/, "")
}

export function buildCouponPromotionPageGroups(catalog: Property[]): CouponPromotionPageGroup[] {
  const mainPages: CouponPromotionPage[] = [
    { path: "/", label: "Homepage", description: "The main Enchanted Havens landing page." },
    { path: "/havens", label: "The Havens", description: "The complete property collection." },
    { path: "/story", label: "Our Story", description: "The brand and hosting story." },
    { path: "/contact", label: "Contact", description: "The stay-team contact page." },
  ]

  const propertyPages = catalog.flatMap<CouponPromotionPage>((property) => [
    {
      path: `/havens/${property.slug}`,
      label: property.displayName,
      description: property.estate ? "Property collection and estate overview." : property.location,
    },
    ...property.variants
      .filter(() => property.estate)
      .map((variant) => ({
        path: `/havens/${property.slug}/${variant.slug}`,
        label: `${property.displayName} · ${variant.shortName}`,
        description: `${variant.guests} guests · ${variant.bedrooms} bedrooms`,
      })),
  ])

  const guideGroups = (["destinations", "stays", "groups", "experiences", "amenities"] as const).map((group) => {
    const hub = group === "experiences" ? experienceHub : seoHubs[group]
    return {
      id: group,
      label: groupLabels[group],
      description: groupDescriptions[group],
      pages: [
        { path: hub.path, label: hub.title, description: "Guide overview page." },
        ...seoLandingPages
          .filter((page) => page.group === group)
          .map((page) => ({ path: page.path, label: page.title, description: page.eyebrow })),
      ],
    }
  })

  return [
    {
      id: "main",
      label: "Main website pages",
      description: "High-visibility pages in the primary guest journey.",
      pages: mainPages,
    },
    {
      id: "properties",
      label: "Property pages",
      description: "Individual haven and Cove Club residence pages.",
      pages: propertyPages,
    },
    ...guideGroups,
  ]
}

export function getCouponPromotionPagePaths(catalog: Property[]) {
  return new Set(buildCouponPromotionPageGroups(catalog).flatMap((group) => group.pages.map((page) => page.path)))
}
