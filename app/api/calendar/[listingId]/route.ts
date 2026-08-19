import { differenceInCalendarDays, format, parseISO } from "date-fns"
import { unstable_cache } from "next/cache"
import { z } from "zod"
import { allowedListingIds } from "@/lib/editorial"
import { normalizeHostawayCalendarResult } from "@/lib/calendar"
import { getListingCalendar, isHostawayConfigured } from "@/lib/hostaway"

const querySchema = z.object({
  startDate: z.string().date(),
  endDate: z.string().date(),
})

// Public browsing availability is already edge-cached for 60 seconds below.
// Reuse that same freshness window inside the app so concurrent and repeated
// calendar opens do not each wait on an identical Hostaway request. Quotes and
// checkout availability checks continue to bypass this cache.
const getCachedPublicCalendar = unstable_cache(
  async (listingId: number, startDate: string, endDate: string) => getListingCalendar(listingId, startDate, endDate),
  ["public-listing-calendar-v1"],
  { revalidate: 60 },
)

export async function GET(request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  try {
    const listingId = Number((await params).listingId)
    if (!Number.isInteger(listingId) || !allowedListingIds.includes(listingId)) {
      return Response.json({ error: "This listing is not part of the public collection." }, { status: 404 })
    }
    if (!isHostawayConfigured()) {
      return Response.json({ error: "Live Hostaway availability is not configured." }, { status: 503 })
    }

    const url = new URL(request.url)
    const today = new Date()
    const input = querySchema.parse({
      startDate: url.searchParams.get("startDate") || format(today, "yyyy-MM-dd"),
      endDate: url.searchParams.get("endDate") || format(new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()), "yyyy-MM-dd"),
    })
    const rangeLength = differenceInCalendarDays(parseISO(input.endDate), parseISO(input.startDate))
    if (rangeLength < 1 || rangeLength > 730) {
      return Response.json({ error: "Calendar range must be between 1 and 730 days." }, { status: 400 })
    }

    const result = await getCachedPublicCalendar(listingId, input.startDate, input.endDate)
    const calendar = normalizeHostawayCalendarResult(result)
    return Response.json(
      { listingId, calendar, source: "hostaway", dateRange: input },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
    )
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load availability." }, { status: 400 })
  }
}
