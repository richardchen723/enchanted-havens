import { z } from "zod"
import { getCatalog } from "@/lib/catalog"
import { allowedListingIds } from "@/lib/editorial"
import { checkPublicStay, freshness, publicQuote, searchPublicStays, stayHandoff } from "@/lib/public-stays"
import { limitStayRequests, stayErrorResponse, stayResponseHeaders, StayRequestError, validatePublicStay } from "@/lib/public-stay-request"
import { absoluteUrl } from "@/lib/utils"

export function agentParameters(request: Request, quote = false) {
  const url = new URL(request.url)
  if (url.search.length > 2048) throw new StayRequestError("The query is too long.", 414)
  const permitted = new Set(["checkIn", "checkOut", "guests", ...(quote ? ["listingId"] : [])])
  for (const key of url.searchParams.keys()) {
    if ((!permitted.has(key) && !/^(utm_[a-z0-9_]+|gclid|fbclid|msclkid)$/i.test(key)) || url.searchParams.getAll(key).length !== 1) {
      throw new StayRequestError(`Unsupported or repeated parameter: ${key.slice(0,60)}.`)
    }
  }
  const params = Object.fromEntries(url.searchParams)
  const selection = validatePublicStay(params)
  return { params, selection }
}

export async function agentSearch(request: Request) {
  try {
    limitStayRequests(request)
    const { params, selection } = agentParameters(request)
    const checked = await searchPublicStays(selection)
    const unknownCount = checked.filter((item) => item.check.status === "unknown").length
    const results = checked.map(({ property, variant, check }) => ({
      id: `enchanted-havens-${variant.id}`, listingId: variant.id, name: variant.shortName,
      status: check.status, reason: check.reason, generatedAt: check.generatedAt, expiresAt: check.expiresAt,
      ...stayHandoff(property, variant, selection, params),
      ...(check.quote ? { quote: publicQuote(check.quote) } : {}),
    }))
    const unknown = results.length > 0 && unknownCount === results.length
    return Response.json({ version: "1.0", status: unknown ? "unknown" : unknownCount ? "partial" : "complete", selection, currency: "USD", ...freshness(new Date(), 60), unknownCount, results, catalogUrl: absoluteUrl("/agent/catalog") }, { status: unknown ? 503 : 200, headers: { ...stayResponseHeaders, ...(unknown ? { "Retry-After": "60" } : {}) } })
  } catch (error) { return stayErrorResponse(error) }
}

export async function agentQuote(request: Request) {
  try {
    limitStayRequests(request)
    const { params, selection } = agentParameters(request, true)
    const listingId = z.coerce.number().int().positive().safeParse(params.listingId)
    if (!listingId.success) throw new StayRequestError("Provide a valid listingId from the catalog.")
    if (!allowedListingIds.includes(listingId.data)) throw new StayRequestError("This listing is not part of the public collection.", 404, "not_found")
    const property = (await getCatalog()).find((item) => item.variants.some((variant) => variant.id === listingId.data))
    const variant = property?.variants.find((item) => item.id === listingId.data)
    if (!property || !variant) throw new StayRequestError("This listing is not part of the public collection.", 404, "not_found")
    if (selection.guests > variant.guests) throw new StayRequestError(`This home accommodates up to ${variant.guests} guests.`)
    const check = await checkPublicStay(variant.id, selection)
    return Response.json({ version: "1.0", id: `enchanted-havens-${variant.id}`, listingId: variant.id, selection, currency: "USD", ...check, quote: check.quote ? publicQuote(check.quote) : undefined, ...stayHandoff(property, variant, selection, params) }, {
      status: check.status === "unavailable" ? 409 : check.status === "unknown" ? 503 : 200,
      headers: { ...stayResponseHeaders, ...(check.status === "unknown" ? { "Retry-After": "60" } : {}) },
    })
  } catch (error) { return stayErrorResponse(error) }
}
