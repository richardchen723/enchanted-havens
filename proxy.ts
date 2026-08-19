import { NextResponse, type NextRequest } from "next/server"
import { canonicalLegacyQuery, legacyListingDestination } from "@/lib/legacy-links"

const LEGACY_BOOKING_HOST = "book.enchantedhavens.com"
const CANONICAL_HOST = "enchantedhavens.com"

export function proxy(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim().toLowerCase()
  const requestHost = (forwardedHost || request.nextUrl.hostname).split(":")[0]
  if (requestHost !== LEGACY_BOOKING_HOST) return NextResponse.next()

  const destination = request.nextUrl.clone()
  destination.protocol = "https:"
  destination.hostname = CANONICAL_HOST
  destination.port = ""
  destination.pathname = legacyListingDestination(destination.pathname) || (destination.pathname === "/" ? "/havens" : destination.pathname)
  destination.search = canonicalLegacyQuery(destination.searchParams).toString()
  return NextResponse.redirect(destination, 308)
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[^/]+$).*)"],
}
