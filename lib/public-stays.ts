import { addDays, format, parseISO } from "date-fns"
import { getCatalog } from "@/lib/catalog"
import { calendarCoversStay, normalizeHostawayCalendarResult } from "@/lib/calendar"
import { allowedListingIds } from "@/lib/editorial"
import { getListingCalendar, getHostawayQuote, isHostawayConfigured } from "@/lib/hostaway"
import { getAirbnbReviewDestination } from "@/lib/airbnb"
import { confirmedStayPolicies, getVerifiedPropertyFacts, propertyFactDetails } from "@/lib/property-facts"
import { publicPropertyCoordinates } from "@/lib/property-locations"
import { propertySchemaImages } from "@/lib/vacation-rental-schema"
import { buildStayQuery, type RawSearchParams, type StaySelection } from "@/lib/stay-search"
import type { Property, PropertyVariant, Quote } from "@/lib/schemas"
import { absoluteUrl, nightsBetween } from "@/lib/utils"
import { STAY_LIMITS } from "@/lib/public-stay-request"

export type StayAvailability = "available" | "unavailable" | "unknown"
export type StayCheck = { status: StayAvailability; reason?: string; quote?: Quote; generatedAt: string; expiresAt: string }

export function freshness(now = new Date(), seconds: number = STAY_LIMITS.quoteLifetimeSeconds) {
  return { generatedAt: now.toISOString(), expiresAt: new Date(now.getTime() + seconds * 1000).toISOString() }
}

export function calendarStayStatus(raw: unknown, input: StaySelection): StayAvailability {
  const calendar = normalizeHostawayCalendarResult(raw)
  const rawDays = new Map((Array.isArray(raw) ? raw.map(day => [day?.date, day]) : raw && typeof raw === "object" ? Object.entries(raw) : []) as Array<[string, Record<string, unknown>]>)
  const nights = nightsBetween(input.checkIn, input.checkOut)
  for (let offset = 0; offset <= nights; offset++) {
    const key = format(addDays(parseISO(input.checkIn), offset), "yyyy-MM-dd")
    const day = calendar[key]
    const original = rawDays.get(key)
    const flag = original?.isAvailable ?? original?.available
    if (flag !== undefined && ![true, false, 0, 1, "0", "1"].includes(flag as string | number | boolean)) return "unknown"
    if (flag === undefined && !["available", "unavailable", "booked", "blocked", "reserved"].includes(String(original?.status).toLowerCase())) return "unknown"
    // Missing/malformed upstream days are unknown, never confirmed sold out.
    if (!day || (day.isAvailable === undefined && day.available === undefined && !day.status)) return "unknown"
  }
  const arrival = calendar[input.checkIn], departure = calendar[input.checkOut]
  if (arrival.closedOnArrival === 1 || departure.closedOnDeparture === 1 || (arrival.maximumStay && nights > arrival.maximumStay)) return "unavailable"
  return calendarCoversStay(calendar, input.checkIn, input.checkOut) ? "available" : "unavailable"
}

export async function checkPublicStay(listingId: number, input: StaySelection): Promise<StayCheck> {
  const unknown = (): StayCheck => ({ status: "unknown", reason: "temporarily_unknown", ...freshness(new Date(), 60) })
  if (!isHostawayConfigured()) return unknown()
  try {
    const signal = AbortSignal.timeout(15000)
    const calendar = await getListingCalendar(listingId, input.checkIn, input.checkOut, signal)
    const status = calendarStayStatus(calendar, input)
    if (status === "unknown") return unknown()
    if (status === "unavailable") return { status, reason: "dates_unavailable", ...freshness(new Date(), 60) }
    const quote = await getHostawayQuote(listingId, input.checkIn, input.checkOut, input.guests, signal)
    if (quote.currency !== "USD" || !quote.available || !Number.isFinite(quote.total) || quote.total <= 0) return unknown()
    return { status: "available", quote, ...freshness() }
  } catch { return unknown() }
}

export async function searchPublicStays(input: StaySelection) {
  const catalog = (await getCatalog()).filter((property) => property.variants.some((variant) => allowedListingIds.includes(variant.id)))
  const candidates = catalog.flatMap((property) => property.variants.filter((variant) => allowedListingIds.includes(variant.id) && variant.guests >= input.guests).map((variant) => ({ property, variant })))
  const results: Array<{ property: Property; variant: PropertyVariant; check: StayCheck }> = []
  let index = 0
  async function worker() {
    while (index < candidates.length) {
      const { property, variant } = candidates[index++]
      results.push({ property, variant, check: await checkPublicStay(variant.id, input) })
    }
  }
  await Promise.all(Array.from({ length: Math.min(2, candidates.length) }, worker))
  return results.sort((a, b) => a.property.featuredOrder - b.property.featuredOrder)
}

export function stayHandoff(property: Property, variant: PropertyVariant, selection: StaySelection, params: RawSearchParams = {}) {
  const query = buildStayQuery(params, selection)
  const bookingQuery = new URLSearchParams(query)
  bookingQuery.set("variant", variant.slug)
  return { propertyUrl: absoluteUrl(`/havens/${property.slug}?${query}`), bookingUrl: absoluteUrl(`/booking/${property.slug}?${bookingQuery}`) }
}

export function publicQuote(quote: Quote) {
  return {
    listingId: quote.listingId, checkIn: quote.checkIn, checkOut: quote.checkOut, guests: quote.guests, nights: quote.nights,
    currency: "USD", total: quote.total,
    // Only public price fields; no provider IDs, booking records, or guest data.
    components: quote.components.map((item) => ({ type: item.type, label: item.title, amount: item.total, includedInTotal: item.isIncludedInTotalPrice !== 0, mandatory: item.isMandatory == null ? null : item.isMandatory !== 0 })),
    priceContext: "standard_public_rate", finalPriceRevalidationRequired: true, inventoryHeld: false,
    petPolicy: confirmedStayPolicies.pets,
  }
}

export async function agentCatalog() {
  const properties = (await getCatalog()).flatMap((property) => property.variants.filter((variant) => allowedListingIds.includes(variant.id)).map((variant) => {
    const facts = getVerifiedPropertyFacts(variant.id)!
    const review = getAirbnbReviewDestination(variant.id)
    return {
      id: `enchanted-havens-${variant.id}`, listingId: variant.id, slug: property.slug, name: variant.shortName,
      canonicalUrl: absoluteUrl(`/havens/${property.slug}`), currency: "USD",
      location: { area: facts.area, city: facts.city, region: "Washington", country: "US", coordinates: publicPropertyCoordinates[property.slug] },
      maxGuests: facts.maxGuests, bedrooms: facts.bedrooms, bathrooms: facts.bathrooms, sleepingArrangements: facts.sleeping,
      amenities: variant.amenities, details: propertyFactDetails(facts), images: propertySchemaImages(property, variant),
      factsCheckedAt: facts.source.checkedAt, sourceUrl: facts.source.url,
      reviews: review.snapshot ? { ...review.snapshot, sourceUrl: review.href } : null,
    }
  }))
  return { version: "1.0", ...freshness(new Date(), 3600), currency: "USD", propertyCount: properties.length, properties, links: { documentation: absoluteUrl("/agents"), specification: absoluteUrl("/agent/openapi.json"), search: absoluteUrl("/agent/search"), quote: absoluteUrl("/agent/quote") } }
}
