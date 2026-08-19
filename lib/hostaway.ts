import { z } from "zod"
import { BRAND_BOOKING_ENGINE_URL, HOSTAWAY_BOOKING_ENGINE_DOMAIN } from "@/lib/brand"
import { calendarCoversStay as calendarRangeIsAvailable, normalizeHostawayCalendarResult } from "@/lib/calendar"
import { nightsBetween } from "@/lib/utils"
import { quoteSchema, type PropertyVariant, type Quote, type Review } from "@/lib/schemas"
import { toE164UsPhone } from "@/lib/phone"

const API_BASE = "https://api.hostaway.com/v1"
const TOKEN_URL = `${API_BASE}/accessTokens`
const BOOKING_ENGINE_API_BASE = "https://booking-engine.hostaway.com/bookingEngines"
const DEFAULT_BOOKING_ENGINE_DOMAIN = HOSTAWAY_BOOKING_ENGINE_DOMAIN

let tokenCache: { value: string; expiresAt: number } | null = null

export function isHostawayConfigured() {
  return Boolean(
    process.env.HOSTAWAY_ACCESS_TOKEN ||
      (process.env.HOSTAWAY_CLIENT_ID && process.env.HOSTAWAY_CLIENT_SECRET),
  )
}

async function getAccessToken() {
  if (process.env.HOSTAWAY_ACCESS_TOKEN) return process.env.HOSTAWAY_ACCESS_TOKEN
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.value
  if (!process.env.HOSTAWAY_CLIENT_ID || !process.env.HOSTAWAY_CLIENT_SECRET) {
    throw new Error("Hostaway credentials are not configured")
  }

  const form = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.HOSTAWAY_CLIENT_ID,
    client_secret: process.env.HOSTAWAY_CLIENT_SECRET,
    scope: "general",
  })
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: form,
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`Hostaway authentication failed (${response.status})`)
  const data = z
    .object({ access_token: z.string(), expires_in: z.number().default(86_400) })
    .parse(await response.json())
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + Math.max(60, data.expires_in - 300) * 1000,
  }
  return data.access_token
}

async function hostawayRequest<T>(path: string, init: RequestInit = {}, attempt = 0): Promise<T> {
  const token = await getAccessToken()
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
      ...init.headers,
    },
  })
  if (response.status === 429 && attempt < 3) {
    await new Promise((resolve) => setTimeout(resolve, 750 * 2 ** attempt))
    return hostawayRequest<T>(path, init, attempt + 1)
  }
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Hostaway request failed (${response.status}): ${detail.slice(0, 250)}`)
  }
  const payload = await response.json()
  const envelope = z.object({ status: z.string(), result: z.unknown() }).passthrough().parse(payload)
  if (envelope.status !== "success") throw new Error(String(envelope.result || "Hostaway request failed"))
  return envelope.result as T
}

async function bookingEngineRequest<T>(path: string, init: RequestInit = {}, attempt = 0): Promise<T> {
  const domain = process.env.HOSTAWAY_BOOKING_ENGINE_DOMAIN || DEFAULT_BOOKING_ENGINE_DOMAIN
  const response = await fetch(`${BOOKING_ENGINE_API_BASE}/${encodeURIComponent(domain)}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      ...init.headers,
    },
  })
  if (response.status === 429 && attempt < 3) {
    await new Promise((resolve) => setTimeout(resolve, 750 * 2 ** attempt))
    return bookingEngineRequest<T>(path, init, attempt + 1)
  }
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Hostaway booking engine request failed (${response.status}): ${detail.slice(0, 250)}`)
  }
  const payload = await response.json()
  const envelope = z.object({ status: z.string(), result: z.unknown() }).passthrough().parse(payload)
  if (envelope.status !== "success") throw new Error(String(envelope.result || "Hostaway booking engine request failed"))
  return envelope.result as T
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = typeof value === "string" ? Number(value) : value
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback
}

function optionalNumberValue(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function ratingValue(value: unknown) {
  const rawRating = numberValue(value, Number.NaN)
  const rating = rawRating > 100 && rawRating <= 500
    ? rawRating / 100
    : rawRating > 10 && rawRating <= 100
      ? rawRating / 20
      : rawRating > 5 && rawRating <= 10
        ? rawRating / 2
      : rawRating
  return Number.isFinite(rating) && rating >= 0 && rating <= 5 ? Math.round(rating * 100) / 100 : null
}

function sleepingCapacityFromBedTypes(items: Array<Record<string, unknown>>) {
  return items.reduce((sum, item) => sum + numberValue(item.quantity) * 2, 0)
}

export function normalizeHostawayListingResult(result: Record<string, unknown>, listingId: number): PropertyVariant {
  const listing = (result.listing as Record<string, unknown>) || result
  const rawImages = (result.listingImage || result.listingImages || listing.listingImage || []) as Array<Record<string, unknown>>
  const rawAmenities = (result.listingAmenities || listing.listingAmenities || result.listingAmenity || listing.listingAmenity || []) as Array<Record<string, unknown>>
  const rawBedTypes = (result.listingBedTypes || listing.listingBedTypes || []) as Array<Record<string, unknown>>
  const listedGuests = numberValue(listing.personCapacity ?? listing.guestsIncluded)
  const bedCapacity = sleepingCapacityFromBedTypes(rawBedTypes)
  const bedrooms = numberValue(listing.bedroomsNumber)
  const guests = bedrooms >= 15 && bedCapacity > listedGuests ? bedCapacity : listedGuests
  const listingImages = rawImages
    .slice()
    .sort((a, b) => numberValue(a.sortOrder) - numberValue(b.sortOrder))
    .map((image) => String(image.url || ""))
    .filter((url) => url.startsWith("http"))
  const amenities = rawAmenities
    .filter((item) => item.isPresent === undefined || item.isPresent === 1 || item.isPresent === "1" || item.isPresent === true)
    .map((item) => {
      const amenity = item.amenity as Record<string, unknown> | undefined
      return String(item.amenityName || amenity?.name || item.name || "").trim()
    })
    .filter(Boolean)
    .filter((amenity, index, all) => all.indexOf(amenity) === index)

  const latitude = numberValue(listing.lat ?? listing.latitude, Number.NaN)
  const longitude = numberValue(listing.lng ?? listing.longitude, Number.NaN)
  const fullDescription = String(listing.description || "").trim()

  const bookingUrls = listing.bookingEngineUrls as Record<string, unknown> | undefined
  return {
    id: numberValue(listing.id, listingId),
    slug: String(listing.id || listingId),
    name: String(listing.name || "Enchanted Haven"),
    shortName: String(listing.name || "Enchanted Haven").split(":")[0].replaceAll('"', ""),
    description: fullDescription,
    fullDescription: fullDescription || undefined,
    location: [listing.city, listing.state].filter(Boolean).join(", ") || "Pacific Northwest",
    city: String(listing.city || "Pacific Northwest"),
    region: String(listing.state || "Washington"),
    ...(Number.isFinite(latitude) ? { latitude } : {}),
    ...(Number.isFinite(longitude) ? { longitude } : {}),
    guests,
    bedrooms,
    bathrooms: numberValue(listing.bathroomsNumber ?? listing.guestBathroomsNumber),
    beds: numberValue(listing.bedsNumber),
    images: listingImages.length ? listingImages : ["https://bookingenginecdn.hostaway.com/listing/57690-178403-diAc8D--hTY1rYLwMFRNvZgn6PBfl4v3TJJJ7k3UtqoU-6804873044a62?width=1920&quality=82&format=webp&v=2"],
    amenities,
    houseRules: listing.houseRules ? String(listing.houseRules) : null,
    rating: ratingValue(listing.averageReviewRating),
    reviewsCount: numberValue(result.reviewsCount ?? listing.reviewsCount),
    startingPrice: result.averageNightlyPrice ? numberValue(result.averageNightlyPrice) : listing.price ? numberValue(listing.price) : null,
    currency: String(listing.currencyCode || "USD"),
    bookingEngineUrl: bookingUrls?.en ? String(bookingUrls.en) : new URL(`/listings/${listingId}`, BRAND_BOOKING_ENGINE_URL).toString(),
  }
}

export async function getHostawayListing(listingId: number): Promise<PropertyVariant> {
  const result = await hostawayRequest<Record<string, unknown>>(`/listings/${listingId}?includeResources=1`)
  return normalizeHostawayListingResult(result, listingId)
}

export async function getListingMapId(listingId: number) {
  const result = await hostawayRequest<Record<string, unknown>>(`/listings/${listingId}`)
  const listing = (result.listing as Record<string, unknown>) || result
  return numberValue(listing.listingMap ?? listing.listingMapId ?? listing.id, listingId)
}

export async function getListingCalendar(listingId: number, checkIn: string, checkOut: string) {
  return hostawayRequest<Array<Record<string, unknown>>>(
    `/listings/${listingId}/calendar?startDate=${encodeURIComponent(checkIn)}&endDate=${encodeURIComponent(checkOut)}&includeResources=1`,
  )
}

export function calendarCoversStay(calendar: Array<Record<string, unknown>>, checkIn: string, checkOut: string) {
  if (nightsBetween(checkIn, checkOut) < 1) return false
  return calendarRangeIsAvailable(normalizeHostawayCalendarResult(calendar), checkIn, checkOut)
}

export async function isListingAvailable(listingId: number, checkIn: string, checkOut: string) {
  const calendar = await getListingCalendar(listingId, checkIn, checkOut)
  return calendarCoversStay(calendar, checkIn, checkOut)
}

export type HostawayCancellationSummary = {
  name: string
  refundableUntilDays: number | null
  partialRefundUntilDays: number | null
  partialRefundPercent: number | null
}

function daysBeforeArrival(timeDelta: unknown) {
  const seconds = numberValue(timeDelta, Number.NaN)
  return Number.isFinite(seconds) && seconds < 0 ? Math.round(Math.abs(seconds) / 86_400) : null
}

async function getCancellationSummary(policyId: number): Promise<HostawayCancellationSummary | null> {
  if (!policyId) return null
  try {
    const result = await hostawayRequest<Record<string, unknown>>(`/cancellationPolicies/${policyId}`)
    const items = Array.isArray(result.cancellationPolicyItem)
      ? result.cancellationPolicyItem as Array<Record<string, unknown>>
      : []
    const fullRefund = items
      .filter((item) => numberValue(item.refundAmount) >= 100)
      .map((item) => daysBeforeArrival(item.timeDelta))
      .filter((value): value is number => value !== null)
      .sort((a, b) => b - a)[0] ?? null
    const partial = items
      .filter((item) => numberValue(item.refundAmount) > 0 && numberValue(item.refundAmount) < 100)
      .map((item) => ({ days: daysBeforeArrival(item.timeDelta), percent: numberValue(item.refundAmount) }))
      .filter((item): item is { days: number; percent: number } => item.days !== null)
      .sort((a, b) => b.days - a.days)[0]

    return {
      name: String(result.name || "Property-specific"),
      refundableUntilDays: fullRefund,
      partialRefundUntilDays: partial?.days ?? null,
      partialRefundPercent: partial?.percent ?? null,
    }
  } catch {
    return null
  }
}

export function normalizeHostawayQuoteResult(result: Record<string, unknown>, listingId: number, checkIn: string, checkOut: string, guests: number): Quote {
  const components = Array.isArray(result.components) ? result.components : []
  return quoteSchema.parse({
    listingId,
    checkIn,
    checkOut,
    guests,
    nights: nightsBetween(checkIn, checkOut),
    total: numberValue(result.totalPrice),
    currency: String(result.currency || "USD"),
    components,
    available: numberValue(result.totalPrice) > 0,
  })
}

export async function getHostawayQuote(listingId: number, checkIn: string, checkOut: string, guests: number): Promise<Quote> {
  const result = await bookingEngineRequest<Record<string, unknown>>(`/listings/${listingId}/calendar/priceDetails`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      startingDate: checkIn,
      endingDate: checkOut,
      numberOfGuests: guests,
      reservationCouponId: null,
      version: "2",
      components: [],
    }),
  })
  return normalizeHostawayQuoteResult(result, listingId, checkIn, checkOut, guests)
}

export async function getHostawayBookingTerms(listingId: number) {
  const result = await hostawayRequest<Record<string, unknown>>(`/listings/${listingId}?includeResources=1`)
  const listing = (result.listing as Record<string, unknown>) || result
  const cancellationPolicyId = numberValue(listing.cancellationPolicyId)
  const cancellation = await getCancellationSummary(cancellationPolicyId)
  return {
    checkInTimeStart: numberValue(listing.checkInTimeStart, 16),
    checkInTimeEnd: optionalNumberValue(listing.checkInTimeEnd),
    checkOutTime: numberValue(listing.checkOutTime, 11),
    refundableDamageDeposit: numberValue(listing.refundableDamageDeposit),
    cancellation,
  }
}

export async function getHostawayReviews(listingMapId: number, propertyName: string): Promise<Review[]> {
  const result = await hostawayRequest<Array<Record<string, unknown>>>(`/reviews?listingMapId=${listingMapId}&type=guest-to-host&status=published&limit=12`)
  return normalizeHostawayReviewResults(result, propertyName)
}

export function normalizeHostawayReviewResults(result: Array<Record<string, unknown>>, propertyName: string): Review[] {
  return result
    .filter((review) => review.publicReview && review.rating)
    .slice(0, 8)
    .map((review) => ({
      id: String(review.id),
      guestName: String(review.guestName || "Enchanted Havens guest"),
      rating: ratingValue(review.rating) || 5,
      text: String(review.publicReview),
      date: String(review.departureDate || review.insertedOn || ""),
      propertyName,
    }))
}

const reservationRecordSchema = z.record(z.string(), z.unknown())
const reservationListSchema = z.union([
  z.array(reservationRecordSchema),
  z.object({ data: z.array(reservationRecordSchema) }).passthrough().transform((value) => value.data),
])

const inactiveReservationStatuses = new Set(["cancelled", "canceled", "declined", "expired"])

export async function findHostawayReservationByReference(input: {
  bookingReference: string
  listingId: number
  checkIn: string
  checkOut: string
  guestEmail: string
}) {
  const params = new URLSearchParams({
    customerUserId: input.bookingReference,
    guestEmail: input.guestEmail,
    listingId: String(input.listingId),
    limit: "10",
  })
  const result = await hostawayRequest<unknown>(`/reservations?${params.toString()}`)
  const reservations = reservationListSchema.parse(result)
  const match = reservations.find((reservation) => {
    const reference = String(reservation.customerUserId || "")
    const comment = String(reservation.comment || "")
    const status = String(reservation.status || reservation.reservationStatus || "").toLowerCase()
    const arrivalDate = String(reservation.arrivalDate || "")
    const departureDate = String(reservation.departureDate || "")
    const guestEmail = String(reservation.guestEmail || "").toLowerCase()
    const hasReference = reference === input.bookingReference || comment.includes(input.bookingReference)

    return hasReference &&
      !inactiveReservationStatuses.has(status) &&
      (!arrivalDate || arrivalDate === input.checkIn) &&
      (!departureDate || departureDate === input.checkOut) &&
      (!guestEmail || guestEmail === input.guestEmail.toLowerCase())
  })
  if (!match) return null

  const reservationId = numberValue(match.id ?? match.hostawayReservationId, Number.NaN)
  if (!Number.isFinite(reservationId)) return null
  return { id: reservationId, status: String(match.status || match.reservationStatus || "") }
}

export async function createHostawayReservation(input: {
  listingMapId: number
  checkIn: string
  checkOut: string
  guests: number
  guest: Record<string, string | undefined>
  quote: Quote
  bookingReference: string
  stripeCustomerId?: string
}) {
  return hostawayRequest<Record<string, unknown>>("/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channelId: 2000,
      listingMapId: input.listingMapId,
      isManuallyChecked: 0,
      isInitial: 0,
      guestName: `${input.guest.firstName} ${input.guest.lastName}`,
      guestFirstName: input.guest.firstName,
      guestLastName: input.guest.lastName,
      guestEmail: input.guest.email,
      phone: toE164UsPhone(input.guest.phone || ""),
      guestAddress: input.guest.address,
      guestCity: input.guest.city,
      guestZipCode: input.guest.zipCode,
      guestCountry: input.guest.country || "US",
      customerUserId: input.bookingReference,
      numberOfGuests: input.guests,
      adults: input.guests,
      arrivalDate: input.checkIn,
      departureDate: input.checkOut,
      totalPrice: input.quote.total,
      currency: input.quote.currency,
      isPaid: 0,
      paymentMethod: input.stripeCustomerId ? "credit_card" : null,
      stripeGuestId: input.stripeCustomerId || null,
      guestNote: input.guest.specialRequests || null,
      comment: `Enchanted Havens direct booking reference: ${input.bookingReference}. Card saved securely in Stripe; no payment collected at booking. Guest services will charge the saved payment method manually according to the booking terms.`,
      financeField: input.quote.components,
    }),
  })
}

export type HostawayInquiryInput = {
  listingId: number
  checkIn: string
  checkOut: string
  guests: number
  guest: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  note: string
}

export type HostawayConversationMessageSummary = {
  id: number
  reservationId?: number | string
  conversationId?: number
  communicationType?: string
  status?: string
  isIncoming?: number
  isSeen?: number
  body?: string
}

export type HostawayConversationSummary = {
  id: number
  reservationId: number | string
  type?: string
  conversationMessages?: HostawayConversationMessageSummary[]
}

export async function createHostawayInquiry(input: HostawayInquiryInput) {
  const listingMapId = await getListingMapId(input.listingId)
  return hostawayRequest<Record<string, unknown>>("/reservations?forceOverbooking=1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channelId: 2000,
      listingMapId,
      arrivalDate: input.checkIn,
      departureDate: input.checkOut,
      numberOfGuests: input.guests,
      adults: input.guests,
      children: null,
      infants: null,
      pets: null,
      guestFirstName: input.guest.firstName,
      guestLastName: input.guest.lastName,
      guestName: `${input.guest.firstName} ${input.guest.lastName}`,
      guestEmail: input.guest.email,
      guestCountry: "US",
      phone: input.guest.phone,
      totalPrice: 0,
      currency: "USD",
      isPaid: 0,
      isManuallyChecked: 0,
      isInitial: 0,
      status: "inquiry",
      comment: input.note,
      guestNote: input.note,
    }),
  })
}

export async function getConversationForReservation(reservationId: number) {
  const result = await hostawayRequest<unknown>(`/conversations?reservationId=${reservationId}&limit=10`)
  const conversations = Array.isArray(result)
    ? result as HostawayConversationSummary[]
    : result && typeof result === "object" && Array.isArray(Reflect.get(result, "data"))
      ? Reflect.get(result, "data") as HostawayConversationSummary[]
      : []

  return conversations.find((conversation) => Number(conversation.reservationId) === reservationId) || conversations[0] || null
}

export async function getHostawayConversation(conversationId: number) {
  if (!Number.isInteger(conversationId) || conversationId <= 0) return null
  return hostawayRequest<HostawayConversationSummary>(`/conversations/${conversationId}?includeResources=1`)
}

function addUtcDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function selectNearestAvailableInquiryDates(
  calendarResult: unknown,
  firstPossibleCheckIn: string,
): { checkIn: string; checkOut: string } | null {
  const calendar = normalizeHostawayCalendarResult(calendarResult)
  const candidateDates = Object.keys(calendar).filter((date) => date >= firstPossibleCheckIn).sort()

  for (const checkIn of candidateDates) {
    const entry = calendar[checkIn]
    const available = entry.isAvailable === 1 || entry.available === 1 || entry.status?.toLowerCase() === "available"
    if (!available || entry.closedOnArrival === 1) continue

    const minimumStay = Math.max(Number(entry.minimumStay) || 1, 1)
    const stayIsAvailable = Array.from({ length: minimumStay }, (_, offset) => calendar[addUtcDays(checkIn, offset)])
      .every((night) => night && (night.isAvailable === 1 || night.available === 1 || night.status?.toLowerCase() === "available"))
    if (stayIsAvailable) return { checkIn, checkOut: addUtcDays(checkIn, minimumStay) }
  }

  return null
}

export async function getNearestAvailableInquiryDates(listingId: number, now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  const firstPossibleCheckIn = addUtcDays(today, 1)
  const result = await getListingCalendar(listingId, firstPossibleCheckIn, addUtcDays(firstPossibleCheckIn, 180))
  const dates = selectNearestAvailableInquiryDates(result, firstPossibleCheckIn)
  if (!dates) throw new Error("No available dates were found for Hostaway inquiry routing")
  return dates
}

export async function waitForConversationForReservation(
  reservationId: number,
  options: { attempts?: number; delayMs?: number } = {},
) {
  const attempts = options.attempts ?? 6
  const delayMs = options.delayMs ?? 500

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))
    try {
      const conversation = await getConversationForReservation(reservationId)
      if (conversation) return conversation
    } catch (error) {
      if (attempt === attempts - 1) {
        console.warn(`Unable to verify Hostaway conversation for inquiry ${reservationId}:`, error)
      }
    }
  }

  return null
}

export async function sendHostawayConversationMessage(
  conversationId: number,
  body: string,
  communicationType: "email" | "channel" | "sms" | "whatsapp",
) {
  return hostawayRequest<HostawayConversationMessageSummary>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, communicationType }),
  })
}

export async function addHostawayIncomingGuestMessage(conversationId: number, body: string) {
  const messageBody = body.trim()
  if (!messageBody) throw new Error("Guest message cannot be empty")

  return hostawayRequest<HostawayConversationMessageSummary>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: messageBody, isIncoming: 1 }),
  })
}
