import { searchPublicStays, freshness } from "@/lib/public-stays"
import { limitStayRequests, readStayBody, stayErrorResponse, stayResponseHeaders, validatePublicStay } from "@/lib/public-stay-request"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    limitStayRequests(request)
    const input = validatePublicStay(await readStayBody(request))
    const checked = await searchPublicStays(input)
    const unknown = checked.filter((item) => item.check.status === "unknown").map(({ property, variant }) => ({ propertySlug: property.slug, listingId: variant.id }))
    const results = checked.filter((item) => item.check.status === "available" && item.check.quote).map(({ property, variant, check }) => ({
      propertySlug: property.slug, availableListingIds: [variant.id],
      variants: [{ listingId: variant.id, variantSlug: variant.slug, quote: { total: check.quote!.total, currency: "USD", nights: check.quote!.nights } }],
    }))
    const allUnknown = checked.length > 0 && unknown.length === checked.length
    return Response.json({ status: allUnknown ? "unknown" : unknown.length ? "partial" : "complete", results, unknown, ...freshness(new Date(), 60), ...(allUnknown ? { error: "We could not confirm availability. Please retry or contact the stay team." } : {}) }, {
      status: allUnknown ? 503 : 200, headers: { ...stayResponseHeaders, ...(allUnknown ? { "Retry-After": "60" } : {}) },
    })
  } catch (error) { return stayErrorResponse(error) }
}
