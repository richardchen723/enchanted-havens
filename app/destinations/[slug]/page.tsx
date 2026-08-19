import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SeoLandingPageView } from "@/components/seo-landing-page"
import { getCatalog } from "@/lib/catalog"
import { landingPageMetadata } from "@/lib/seo-metadata"
import { getSeoPage, getSeoPagesByGroup } from "@/lib/seo-pages"

export function generateStaticParams() {
  return getSeoPagesByGroup("destinations").map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = getSeoPage("destinations", (await params).slug)
  if (!page) return { title: "Destination Not Found" }
  return landingPageMetadata(page, await getCatalog())
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = getSeoPage("destinations", (await params).slug)
  if (!page) notFound()
  return <SeoLandingPageView page={page} catalog={await getCatalog()} />
}
