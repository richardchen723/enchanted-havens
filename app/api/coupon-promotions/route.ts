import { NextResponse } from "next/server"
import { getCatalog } from "@/lib/catalog"
import { getCouponPromotionPagePaths, normalizeCouponPromotionPath } from "@/lib/coupon-promotion-pages"
import { getAdvertisedCouponForPage } from "@/lib/coupons"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestedPath = normalizeCouponPromotionPath(new URL(request.url).searchParams.get("path") || "")
  if (!requestedPath) return NextResponse.json({ promotion: null }, { status: 400 })

  try {
    const catalog = await getCatalog()
    if (!getCouponPromotionPagePaths(catalog).has(requestedPath)) {
      return NextResponse.json({ promotion: null }, { headers: { "Cache-Control": "private, no-store" } })
    }
    const promotion = await getAdvertisedCouponForPage(requestedPath)
    return NextResponse.json({ promotion }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Unable to load coupon promotion", error)
    return NextResponse.json({ promotion: null }, { headers: { "Cache-Control": "private, no-store" } })
  }
}
