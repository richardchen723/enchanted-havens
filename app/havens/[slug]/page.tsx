import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PropertyDetail } from "@/components/property-detail"
import { EstateHub } from "@/components/estate-hub"
import { bookingIsLiveFor, getCatalog, getProperty } from "@/lib/catalog"
import { isHostawayConfigured } from "@/lib/hostaway"
import { getPropertyKeywords } from "@/lib/property-seo"
import { isSandboxBooking } from "@/lib/sandbox-booking"
import { shareMetadata } from "@/lib/seo-metadata"
import { buildStayQuery, parseStaySelection, type RawSearchParams } from "@/lib/stay-search"

export async function generateStaticParams() {
  return (await getCatalog()).map((property) => ({ slug: property.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const property = await getProperty((await params).slug)
  if (!property) return { title: "Haven Not Found" }
  const variant = property.estate ? property.variants.find((item) => item.slug === "full-estate") || property.variants[0] : property.variants[0]
  return shareMetadata({
    title: property.seoTitle,
    description: property.seoDescription,
    path: `/havens/${property.slug}`,
    keywords: getPropertyKeywords(property, variant),
    image: property.heroImage,
    imageAlt: `${property.displayName} in ${property.location}`,
  })
}

export default async function HavenPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const [property, catalog] = await Promise.all([getProperty(slug), getCatalog()])
  if (!property) notFound()
  const variant = property.variants[0]
  const initialSelection = parseStaySelection(query, Math.min(2, variant.guests))
  const preservedQuery = buildStayQuery(query, initialSelection)
  if (property.estate) return <EstateHub property={property} similar={catalog.filter((item) => item.slug !== slug)} preservedQuery={preservedQuery} />
  const sandboxMode = isSandboxBooking()
  return <PropertyDetail property={property} variant={variant} bookingLive={bookingIsLiveFor(variant.id)} quoteAvailable={isHostawayConfigured() || sandboxMode} pagePath={`/havens/${property.slug}`} initialSelection={initialSelection} preservedQuery={preservedQuery} />
}
