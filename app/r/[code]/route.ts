import { NextResponse } from "next/server"
import { getActiveAffiliate, recordReferralVisit } from "@/lib/affiliates"
import { REFERRAL_COOKIE, REFERRAL_MAX_AGE, referralDestination } from "@/lib/affiliate-rules"

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const response = NextResponse.redirect(new URL(referralDestination(new URL(request.url).searchParams.get("haven")), request.url), 307)
  response.headers.set("Cache-Control", "private, no-store")
  response.headers.set("X-Robots-Tag", "noindex, nofollow")
  try {
    const affiliate = await getActiveAffiliate(code)
    if (affiliate) {
      response.cookies.set(REFERRAL_COOKIE, affiliate.code, {
        httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: REFERRAL_MAX_AGE,
      })
      await recordReferralVisit(affiliate.id)
    }
  } catch (error) {
    console.error("Unable to record affiliate referral", error)
  }
  return response
}
