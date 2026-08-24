import { track } from "@vercel/analytics"

type ClarityClient = {
  (command: "event", value: string): void
  (command: "set", key: string, value: string | string[]): void
}

declare global {
  interface Window {
    clarity?: ClarityClient
  }
}

const CLARITY_DIMENSIONS = new Set([
  "destination",
  "guests",
  "hasDates",
  "intent",
  "listing",
  "location",
  "nights",
  "placement",
  "property",
  "results",
  "sandbox",
  "sourcePath",
  "stat",
  "tripType",
  "variant",
])

const CLARITY_FUNNEL_STAGES: Record<string, string> = {
  "Availability CTA Clicked": "availability_intent",
  "Book Now Clicked": "booking_intent",
  "Booking Chat Inquiry Clicked": "inquiry_intent",
  "Checkout Confirmed": "reservation_confirmed",
  "Checkout Error": "checkout_error",
  "Checkout Started": "checkout_started",
  "Checkout Submitted": "checkout_submitted",
  "Checkout Validation Error": "checkout_validation_error",
  "Collection Stat Clicked": "collection_discovery",
  "Stay Inquiry Clicked": "inquiry_intent",
  "Stay Inquiry Sent": "inquiry_sent",
  "Stay Quote Viewed": "quote_viewed",
  "Stay Search Completed": "search_completed",
  "Stay Search No Results": "search_no_results",
  "Stay Search Started": "search_started",
  "Stay Selected": "stay_selected",
}

function clarityEventName(name: string) {
  return `eh_${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`
}

function clarityTagName(name: string) {
  return clarityEventName(name.replace(/([a-z0-9])([A-Z])/g, "$1_$2"))
}

function clarityTagValue(value: string | number | boolean) {
  const normalized = String(value).replace(/[\u0000-\u001f\u007f]+/g, " ").trim()
  return normalized ? normalized.slice(0, 80) : null
}

function setClarityTag(clarity: ClarityClient, key: string, value: string | number | boolean) {
  const normalized = clarityTagValue(value)
  if (!normalized) return

  try {
    clarity("set", clarityTagName(key), normalized)
  } catch {
    // A failed analytics tag must never interrupt the associated conversion.
  }
}

export function trackConversionEvent(name: string, data: Record<string, string | number | boolean> = {}) {
  try {
    track(name, data)
  } catch {
    // Conversion behavior must remain available when analytics is blocked.
  }

  if (typeof window === "undefined" || !window.clarity) return

  const clarity = window.clarity
  for (const [key, value] of Object.entries(data)) {
    if (CLARITY_DIMENSIONS.has(key)) setClarityTag(clarity, key, value)
  }

  const funnelStage = CLARITY_FUNNEL_STAGES[name]
  if (funnelStage) setClarityTag(clarity, "funnelStage", funnelStage)

  try {
    clarity("event", clarityEventName(name))
  } catch {
    // Clarity is optional and must never interrupt a conversion action.
  }
}
