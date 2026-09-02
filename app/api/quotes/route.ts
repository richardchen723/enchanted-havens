import { getHostawayQuote, isHostawayConfigured, isListingAvailable } from "@/lib/hostaway"
import { allowedListingIds } from "@/lib/editorial"
import { getPropertyByListingId } from "@/lib/editorial"
import { applyPropertyCoupon } from "@/lib/coupons"
import { quoteRequestSchema } from "@/lib/schemas"
import { nightsBetween } from "@/lib/utils"
import { getSandboxQuote, isSandboxBooking } from "@/lib/sandbox-booking"

export async function POST(request: Request) {
  try {
    const input = quoteRequestSchema.parse(await request.json())
    if (!allowedListingIds.includes(input.listingId)) return Response.json({ error: "This listing is not part of the public collection." }, { status: 404 })
    if (nightsBetween(input.checkIn, input.checkOut) < 1) return Response.json({ error: "Departure must be after arrival." }, { status: 400 })
    let quote
    let source: "hostaway" | "sandbox"
    if (isHostawayConfigured()) {
      const available = await isListingAvailable(input.listingId, input.checkIn, input.checkOut)
      if (!available) return Response.json({ error: "This haven is not available for the selected dates." }, { status: 409 })
      quote = await getHostawayQuote(input.listingId, input.checkIn, input.checkOut, input.guests)
      source = "hostaway"
    } else if (isSandboxBooking()) {
      quote = getSandboxQuote(input.listingId, input.checkIn, input.checkOut, input.guests)
      source = "sandbox"
    } else {
      return Response.json({ error: "Live rates are not configured yet." }, { status: 503 })
    }

    if (input.couponCode) {
      const property = getPropertyByListingId(input.listingId)
      if (!property) return Response.json({ error: "This listing is not part of the public collection." }, { status: 404 })
      const application = await applyPropertyCoupon({ propertySlug: property.slug, code: input.couponCode, quote })
      return Response.json({ quote: application.quote, coupon: application.coupon, source, sandboxWrites: isSandboxBooking() })
    }
    return Response.json({ quote, source, sandboxWrites: isSandboxBooking() })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to calculate this stay." }, { status: 400 })
  }
}
