import type { Metadata } from "next"
import { SeoHubPageView } from "@/components/seo-landing-page"
import { getCatalog } from "@/lib/catalog"
import { hubMetadata } from "@/lib/seo-metadata"
import { seoHubs } from "@/lib/seo-pages"

const hub = seoHubs.amenities

export async function generateMetadata(): Promise<Metadata> {
  return hubMetadata(hub, await getCatalog())
}

export default async function AmenitiesHubPage() {
  return <SeoHubPageView hub={hub} catalog={await getCatalog()} />
}
