import { getHostawayQuote, isHostawayConfigured, isListingAvailable } from "@/lib/hostaway"
import { allowedListingIds } from "@/lib/editorial"
import { quoteRequestSchema } from "@/lib/schemas"
import { nightsBetween } from "@/lib/utils"
import { getSandboxQuote, isSandboxBooking } from "@/lib/sandbox-booking"

export async function POST(request: Request) {
  try {
    const input = quoteRequestSchema.parse(await request.json())
    if (!allowedListingIds.includes(input.listingId)) return Response.json({ error: "This listing is not part of the public collection." }, { status: 404 })
    if (nightsBetween(input.checkIn, input.checkOut) < 1) return Response.json({ error: "Departure must be after arrival." }, { status: 400 })
    if (isHostawayConfigured()) {
      const available = await isListingAvailable(input.listingId, input.checkIn, input.checkOut)
      if (!available) return Response.json({ error: "This haven is not available for the selected dates." }, { status: 409 })
      const quote = await getHostawayQuote(input.listingId, input.checkIn, input.checkOut, input.guests)
      return Response.json({ quote, source: "hostaway", sandboxWrites: isSandboxBooking() })
    }
    if (isSandboxBooking()) return Response.json({ quote: getSandboxQuote(input.listingId, input.checkIn, input.checkOut, input.guests), source: "sandbox", sandboxWrites: true })
    return Response.json({ error: "Live rates are not configured yet." }, { status: 503 })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to calculate this stay." }, { status: 400 })
  }
}
