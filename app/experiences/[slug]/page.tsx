import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SeoLandingPageView } from "@/components/seo-landing-page"
import { getCatalog } from "@/lib/catalog"
import { landingPageMetadata } from "@/lib/seo-metadata"
import { getSeoPage, getSeoPagesByGroup } from "@/lib/seo-pages"

export function generateStaticParams() {
  return getSeoPagesByGroup("experiences").map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = getSeoPage("experiences", (await params).slug)
  if (!page) return { title: "Experience Not Found" }
  return landingPageMetadata(page, await getCatalog())
}

export default async function ExperienceLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = getSeoPage("experiences", (await params).slug)
  if (!page) notFound()
  return <SeoLandingPageView page={page} catalog={await getCatalog()} />
}
