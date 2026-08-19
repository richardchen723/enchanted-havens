import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SeoLandingPageView } from "@/components/seo-landing-page"
import { getCatalog } from "@/lib/catalog"
import { landingPageMetadata } from "@/lib/seo-metadata"
import { getSeoPage, getSeoPagesByGroup } from "@/lib/seo-pages"

export function generateStaticParams() {
  return getSeoPagesByGroup("groups").map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = getSeoPage("groups", (await params).slug)
  if (!page) return { title: "Group Stay Not Found" }
  return landingPageMetadata(page, await getCatalog())
}

export default async function GroupStayPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = getSeoPage("groups", (await params).slug)
  if (!page) notFound()
  return <SeoLandingPageView page={page} catalog={await getCatalog()} />
}
