import type { Metadata } from "next"
import type { Property } from "@/lib/schemas"
import type { SeoHub, SeoLandingPage } from "@/lib/seo-pages"

type ShareMetadataInput = {
  title: string
  description: string
  path: string
  keywords?: string[]
  image?: string
  imageAlt?: string
  openGraphTitle?: string
}

function pageImage(catalog: Property[], slug: string, index = 0) {
  const property = catalog.find((item) => item.slug === slug)
  return property?.gallery[index] || property?.heroImage
}

function shareImages(image: string | undefined, alt: string) {
  return image ? [{ url: image, alt }] : undefined
}

export function shareMetadata({ title, description, path, keywords, image, imageAlt, openGraphTitle }: ShareMetadataInput): Metadata {
  const shareTitle = openGraphTitle || title
  const images = shareImages(image, imageAlt || shareTitle)
  return {
    title,
    description,
    alternates: { canonical: path },
    keywords,
    openGraph: {
      title: shareTitle,
      description,
      url: path,
      type: "website",
      siteName: "Enchanted Havens",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images,
    },
  }
}

export function landingPageMetadata(page: SeoLandingPage, catalog: Property[]): Metadata {
  const image = pageImage(catalog, page.heroPropertySlug, page.heroImageIndex || 0)
  return shareMetadata({
    title: page.title,
    description: page.metaDescription,
    path: page.path,
    keywords: [page.primaryKeyword, ...page.keywords],
    image,
    imageAlt: page.imageAlt,
    openGraphTitle: page.h1,
  })
}

export function hubMetadata(hub: SeoHub, catalog: Property[]): Metadata {
  const image = pageImage(catalog, hub.heroPropertySlug, hub.heroImageIndex || 0)
  return shareMetadata({
    title: hub.title,
    description: hub.metaDescription,
    path: hub.path,
    keywords: hub.keywords,
    image,
    imageAlt: `${hub.title} with Enchanted Havens private Pacific Northwest vacation rentals`,
  })
}
