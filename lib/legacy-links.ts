export const LEGACY_LISTING_DESTINATIONS: Record<number, string> = {
  146889: "/havens/blue-haven",
  157299: "/havens/sea-renity-haven",
  178403: "/havens/emerald-haven",
  178994: "/havens/fair-haven",
  184081: "/havens/aurora-haven",
  335403: "/havens/reflection-haven",
  558675: "/havens/whidbey-estate/lighthouse",
  558676: "/havens/whidbey-estate/lodge",
  558677: "/havens/whidbey-estate/full-estate",
  558678: "/havens/whidbey-estate/main-house",
  571917: "/havens/whidbey-estate/guest-house",
  576478: "/havens/reflection-point",
}

const checkInNames = ["checkIn", "startDate", "arrivalDate", "arrival", "from", "start"]
const checkOutNames = ["checkOut", "endDate", "departureDate", "departure", "to", "end"]
const guestNames = ["guests", "numberOfGuests", "guestCount", "adults"]
const attributionParameter = /^(utm_[a-z0-9_]+|gclid|fbclid|msclkid|intent|matches|experience)$/i
const isoDate = /^\d{4}-\d{2}-\d{2}$/

function firstValue(params: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = params.get(name)?.trim()
    if (value) return value
  }
  return ""
}

export function canonicalLegacyQuery(params: URLSearchParams, today = new Date()) {
  const canonical = new URLSearchParams()
  const checkIn = firstValue(params, checkInNames)
  const checkOut = firstValue(params, checkOutNames)
  const todayIso = today.toISOString().slice(0, 10)
  const validDates = isoDate.test(checkIn) && isoDate.test(checkOut) && checkIn >= todayIso && checkOut > checkIn

  if (validDates) {
    canonical.set("checkIn", checkIn)
    canonical.set("checkOut", checkOut)
  }

  const guestValue = Number(firstValue(params, guestNames))
  if (Number.isInteger(guestValue) && guestValue > 0) canonical.set("guests", String(Math.min(guestValue, 60)))

  for (const [key, value] of params) {
    if (attributionParameter.test(key) && value.trim() && !canonical.has(key)) canonical.set(key, value.trim())
  }

  return canonical
}

export function legacyListingDestination(pathname: string) {
  const match = pathname.match(/^\/listings?\/(\d+)\/?$/i)
  if (!match) return null
  return LEGACY_LISTING_DESTINATIONS[Number(match[1])] || null
}
