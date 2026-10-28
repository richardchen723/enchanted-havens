import { NextResponse } from "next/server"
import { canonicalLegacyQuery } from "@/lib/legacy-links"

export function GET(request: Request) {
  const destination = new URL(request.url)
  destination.pathname = "/havens"
  destination.search = canonicalLegacyQuery(destination.searchParams).toString()
  return NextResponse.redirect(destination, 308)
}
