import { isHostawayConfigured } from "@/lib/hostaway"
import { allowedListingIds } from "@/lib/editorial"
import { getPropertyByListingId } from "@/lib/editorial"
import { applyPropertyCoupon, CouponValidationError } from "@/lib/coupons"
import { quoteRequestSchema } from "@/lib/schemas"
import { checkPublicStay, freshness } from "@/lib/public-stays"
import { limitStayRequests, readStayBody, stayErrorResponse, stayResponseHeaders, StayRequestError, validatePublicStay } from "@/lib/public-stay-request"
import { getSandboxQuote, isSandboxBooking } from "@/lib/sandbox-booking"
import { applyRequestReferral } from "@/lib/affiliates"

export async function POST(request: Request) {
  try {
    limitStayRequests(request)
    const body = await readStayBody(request)
    validatePublicStay(body)
    const parsed = quoteRequestSchema.safeParse(body)
    if (!parsed.success) throw new StayRequestError("Provide a valid listingId and coupon code.")
    const input = parsed.data
    if (!allowedListingIds.includes(input.listingId)) return Response.json({ error: "This listing is not part of the public collection." }, { status: 404, headers: stayResponseHeaders })
    const property = getPropertyByListingId(input.listingId)
    const variant = property?.variants.find((item) => item.id === input.listingId)
    if (!variant || input.guests > variant.guests) throw new StayRequestError("Guest count exceeds this home’s capacity.")
    let quote
    let source: "hostaway" | "sandbox"
    if (isHostawayConfigured()) {
      const checked = await checkPublicStay(input.listingId, input)
      if (checked.status === "unavailable") return Response.json({ error: "This haven is not available for the selected dates.", ...checked }, { status: 409, headers: stayResponseHeaders })
      if (!checked.quote) throw new Error("Availability unknown")
      quote = checked.quote
      source = "hostaway"
    } else if (isSandboxBooking()) {
      quote = getSandboxQuote(input.listingId, input.checkIn, input.checkOut, input.guests)
      source = "sandbox"
    } else {
      return Response.json({ error: "Live rates are not configured yet." }, { status: 503, headers: stayResponseHeaders })
    }

    if (input.couponCode) {
      const property = getPropertyByListingId(input.listingId)
      if (!property) return Response.json({ error: "This listing is not part of the public collection." }, { status: 404, headers: stayResponseHeaders })
      const application = await applyPropertyCoupon({ propertySlug: property.slug, code: input.couponCode, quote })
      return Response.json({ quote: application.quote, coupon: application.coupon, source, sandboxWrites: isSandboxBooking(), ...freshness(), finalPriceRevalidationRequired: true }, { headers: stayResponseHeaders })
    }
    const referral = await applyRequestReferral(request, quote)
    return Response.json({ quote: referral.quote, source, sandboxWrites: isSandboxBooking(), ...freshness(), finalPriceRevalidationRequired: true }, { headers: stayResponseHeaders })
  } catch (error) {
    return stayErrorResponse(error instanceof CouponValidationError ? new StayRequestError(error.message) : error)
  }
}
