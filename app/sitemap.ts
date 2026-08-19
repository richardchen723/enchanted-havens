import type { MetadataRoute } from "next"
import { getCatalog } from "@/lib/catalog"
import { BRAND_HERO_URL, experienceTiles, homeHeroSlides } from "@/lib/editorial"
import type { Property } from "@/lib/schemas"
import { seoHubs, seoLandingPages } from "@/lib/seo-pages"
import { absoluteUrl } from "@/lib/utils"

const SITEMAP_LAST_MODIFIED = new Date().toISOString()
const HAVENS_HERO_IMAGE = "/images/home-hero/heros-zip/hero-04.webp"

function absoluteImageUrl(src: string) {
  return src.startsWith("/") ? absoluteUrl(src) : src
}

function sitemapImages(sources: Array<string | undefined>, limit = 8) {
  return sources
    .filter((source): source is string => Boolean(source))
    .map(absoluteImageUrl)
    .filter((url, index, all) => all.indexOf(url) === index)
    .slice(0, limit)
}

function propertyHero(catalog: Property[], slug: string, index = 0) {
  const property = catalog.find((item) => item.slug === slug)
  return property?.gallery[index] || property?.heroImage
}

function seoPageImages(catalog: Property[], page: { heroPropertySlug: string; heroImageIndex?: number; propertySlugs: string[] }) {
  return sitemapImages([
    propertyHero(catalog, page.heroPropertySlug, page.heroImageIndex || 0),
    ...page.propertySlugs.flatMap((slug) => {
      const property = catalog.find((item) => item.slug === slug)
      return property ? [property.heroImage, ...property.gallery.slice(0, 2)] : []
    }),
  ], 10)
}

function propertyImages(property: Property, limit = 12) {
  return sitemapImages([property.heroImage, ...property.gallery], limit)
}

function staticPageImages(path: string, catalog: Property[]) {
  if (path === "") return sitemapImages([BRAND_HERO_URL, ...homeHeroSlides.map((slide) => slide.image)], 6)
  if (path === "/havens") return sitemapImages([HAVENS_HERO_IMAGE, ...catalog.map((property) => property.heroImage)], 10)
  if (path === "/experiences") return sitemapImages([propertyHero(catalog, "sea-renity-haven"), ...experienceTiles.map((tile) => tile.image)], 6)
  if (path === "/story") return sitemapImages([propertyHero(catalog, "aurora-haven"), propertyHero(catalog, "emerald-haven", 1), BRAND_HERO_URL], 5)
  if (path === "/contact") return sitemapImages(["/images/sea-renity/sea-renity-living-view.webp", propertyHero(catalog, "whidbey-estate")], 4)
  return sitemapImages([BRAND_HERO_URL], 1)
}

export function buildSitemap(catalog: Property[]): MetadataRoute.Sitemap {
  const staticPaths = ["", "/havens", "/experiences", "/story", "/contact", "/privacy", "/terms"]
  const hubs = Object.values(seoHubs)

  return [
    ...staticPaths.map((path) => ({
      url: absoluteUrl(path),
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
      images: staticPageImages(path, catalog),
    })),
    ...hubs.map((hub) => ({
      url: absoluteUrl(hub.path),
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.78,
      images: sitemapImages([propertyHero(catalog, hub.heroPropertySlug, hub.heroImageIndex || 0)], 4),
    })),
    ...seoLandingPages.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: page.group === "destinations" || page.slug === "pacific-northwest-vacation-rentals" ? 0.86 : 0.82,
      images: seoPageImages(catalog, page),
    })),
    ...catalog.flatMap((property) => [
      {
        url: absoluteUrl(`/havens/${property.slug}`),
        lastModified: SITEMAP_LAST_MODIFIED,
        changeFrequency: "weekly" as const,
        priority: 0.9,
        images: propertyImages(property),
      },
      ...property.variants
        .filter(() => property.estate)
        .map((variant) => ({
          url: absoluteUrl(`/havens/${property.slug}/${variant.slug}`),
          lastModified: SITEMAP_LAST_MODIFIED,
          changeFrequency: "weekly" as const,
          priority: 0.8,
          images: sitemapImages([variant.images[0], ...variant.images], 10),
        })),
    ]),
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap(await getCatalog())
}
