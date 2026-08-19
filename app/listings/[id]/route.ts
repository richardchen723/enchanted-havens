import { NextResponse } from "next/server"
import { canonicalLegacyQuery, LEGACY_LISTING_DESTINATIONS } from "@/lib/legacy-links"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const listingId = Number((await params).id)
  if (!Number.isInteger(listingId) || listingId < 1) {
    return Response.json({ error: "Listing not found" }, { status: 404 })
  }

  const pathname = LEGACY_LISTING_DESTINATIONS[listingId]
  if (!pathname) {
    return Response.json({ error: "Listing not found" }, { status: 404 })
  }

  const destination = new URL(request.url)
  destination.pathname = pathname
  destination.search = canonicalLegacyQuery(destination.searchParams).toString()

  return NextResponse.redirect(destination, 308)
}
